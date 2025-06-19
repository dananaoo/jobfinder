import asyncio
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
from datetime import datetime, timedelta
import os, json, re, time

import fitz  # PyMuPDF
import asyncpg
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import APIRouter

from app.db import AsyncSessionLocal
from app.models import JobPost, UserProfile
from app import schemas, crud
from app.schemas import UserProfileCreate, UserProfileOut, JobPostOut
from app.crud import create_user_profile, get_user_profile, recommend_jobs_for_user, create_or_update_job_post
from app.utils.pdf import extract_text_from_pdf
from app.utils.gemini import extract_json_from_response, analyze_resume_with_gemini
from app.routes.jobs import router as jobs_router


load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()
app.include_router(jobs_router)


# 📦 Dependency
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


# 🕓 Подождать, пока БД поднимется
async def wait_for_db():
    for _ in range(10):
        try:
            conn = await asyncpg.connect(DATABASE_URL.replace("postgresql+asyncpg", "postgresql"))
            await conn.close()
            return
        except Exception as e:
            print("Waiting for DB...", e)
            time.sleep(2)

@app.on_event("startup")
async def startup_all():
    await wait_for_db()
    await asyncio.sleep(1)
    asyncio.create_task(clean_old_jobs())

@app.get("/")
async def root():
    return {"message": "Telegram Job Tracker working!"}


# 📌 Вакансии
# (эндпоинты перенесены в app/routes/jobs.py)


# 👤 Профили
@app.post("/profile", response_model=UserProfileOut)
async def create_profile(profile: UserProfileCreate, db: AsyncSession = Depends(get_db)):
    return await create_user_profile(db, profile)

@app.get("/profile/{telegram_id}", response_model=UserProfileOut)
async def read_profile(telegram_id: str, db: AsyncSession = Depends(get_db)):
    profile = await get_user_profile(db, telegram_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


# 📄 Чтение текста из PDF
# (функция extract_text_from_pdf перенесена в app/utils/pdf.py)


# 🧠 JSON из ответа Gemini
# (функция extract_json_from_response перенесена в app/utils/gemini.py)


# 🧠 Gemini: анализ резюме
# (функция analyze_resume_with_gemini перенесена в app/utils/gemini.py)


# 📤 Обработка и обновление профиля
@app.post("/upload_resume")
async def upload_resume(
    file: UploadFile = File(...),
    telegram_id: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    text = await extract_text_from_pdf(file)
    gpt_data = analyze_resume_with_gemini(text)

    profile = await get_user_profile(db, telegram_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Всегда обновляем текст резюме
    profile.resume_text = text

    # Список всех полей профиля, которые можно обновлять (кроме id, telegram_id, resume_text)
    updatable_fields = [
        "full_name", "gender", "phone_number", "email", "citizenship", "address",
        "education", "experience", "experience_level", "skills", "languages", "interests", "achievements",
        "desired_position", "desired_salary", "desired_city", "desired_format", "desired_work_time", "industries"
    ]
    bad_values = {"string", "none", "null", ""}
    for field in updatable_fields:
        if field in gpt_data:
            value = gpt_data[field]
            # skills всегда строка
            if isinstance(value, list) or isinstance(value, dict):
                value = json.dumps(value, ensure_ascii=False)
            if isinstance(value, str) and value.strip().lower() in bad_values:
                continue
            if isinstance(value, int) and value == 0 and field != "desired_salary":
                continue
            setattr(profile, field, value)
    # resume_text всегда обновляется выше

    await db.commit()
    await db.refresh(profile)

    # Возвращаем все основные поля профиля
    return {
        "message": "Резюме обработано и профиль обновлён",
        "profile": {field: getattr(profile, field) for field in ["id", "full_name", "gender", "phone_number", "email", "citizenship", "address", "education", "experience", "experience_level", "skills", "languages", "interests", "achievements", "resume_text", "desired_position", "desired_salary", "desired_city", "desired_format", "desired_work_time", "industries"]}
    }


# 🎯 Рекомендации
@app.get("/recommendations", response_model=List[JobPostOut])
async def recommend_jobs(telegram_id: str = Query(...), db: AsyncSession = Depends(get_db)):
    profile = await get_user_profile(db, telegram_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    result = await db.execute(select(JobPost))
    jobs = result.scalars().all()

    user_skills = [s.strip().lower() for s in (profile.skills or "").split(",") if s.strip()]
    user_industries = [i.strip().lower() for i in (profile.industries or "").split(",") if i.strip()]
    user_city = (profile.desired_city or "").lower()
    user_format = (profile.desired_format or "").lower()
    user_work_time = (profile.desired_work_time or "").lower()

    def relevance_score(job: JobPost) -> int:
        score = 0
        job_text = f"{job.title} {job.description} {(job.location or '')}".lower()

        # 🎯 Совпадения по индустриям
        if any(ind in job_text for ind in user_industries):
            score += 5

        # 🔧 Совпадения по скиллам
        score += sum(1 for skill in user_skills if skill in job_text)

        # 📍 Город
        if user_city and user_city in job_text:
            score += 1
        # 🧑‍💻 Формат работы
        if user_format and user_format in job_text:
            score += 1
        # ⏱️ Время работы
        if user_work_time and user_work_time in job_text:
            score += 1

        return score

    # 💡 Фильтруем только те, где есть хотя бы 1 очко
    scored_jobs = [(job, relevance_score(job)) for job in jobs]
    filtered = [job for job, score in scored_jobs if score > 0]
    sorted_jobs = sorted(filtered, key=lambda x: relevance_score(x), reverse=True)

    return sorted_jobs[:30]



# 🧹 Очистка устаревших вакансий
async def clean_old_jobs():
    await asyncio.sleep(2)
    while True:
        try:
            async with AsyncSessionLocal() as db:
                cutoff_date = datetime.utcnow() - timedelta(days=30)
                await db.execute(delete(JobPost).where(JobPost.published_at < cutoff_date))
                await db.commit()
        except Exception as e:
            print("❌ Ошибка при очистке старых job'ов:", e)
        await asyncio.sleep(86400)
