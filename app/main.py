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

from app.db import AsyncSessionLocal
from app.models import JobPost, UserProfile
from app import schemas, crud
from app.schemas import UserProfileCreate, UserProfileOut, JobPostOut
from app.crud import create_user_profile, get_user_profile, recommend_jobs_for_user, create_or_update_job_post


load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()


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
@app.post("/jobs", response_model=schemas.JobPostOut)
async def create_job(job: schemas.JobPostCreate, db: AsyncSession = Depends(get_db)):
    return await create_or_update_job_post(db, job)

@app.get("/jobs", response_model=List[schemas.JobPostOut])
async def read_jobs(db: AsyncSession = Depends(get_db)):
    return await crud.get_all_jobs(db)


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
async def extract_text_from_pdf(file: UploadFile) -> str:
    content = await file.read()
    doc = fitz.open(stream=content, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text


# 🧠 JSON из ответа Gemini
def extract_json_from_response(text: str) -> dict:
    try:
        json_str = re.search(r"\{.*\}", text, re.DOTALL).group()
        return json.loads(json_str)
    except Exception as e:
        print("❌ Ошибка JSON:", e)
        raise HTTPException(status_code=500, detail="Gemini вернул невалидный JSON")


# 🧠 Gemini: анализ резюме
def analyze_resume_with_gemini(text: str) -> dict:
    prompt = f"""
Ты — AI-ассистент. Извлеки ключевые данные из этого резюме:\n{text}\n
Верни JSON с полями:
- skills (список)
- experience_level (junior/middle/senior)
- desired_position (строка)
"""
    model = genai.GenerativeModel("models/gemini-1.5-flash")
    response = model.generate_content(prompt)
    raw_text = response.text.strip()
    print("📥 Ответ от Gemini:", raw_text)
    return extract_json_from_response(raw_text)


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

    profile.resume_text = text
    profile.skills = ", ".join(gpt_data.get("skills", []))
    profile.experience_level = gpt_data.get("experience_level")
    profile.desired_position = gpt_data.get("desired_position")

    await db.commit()
    await db.refresh(profile)

    return {
        "message": "Резюме обработано и профиль обновлён",
        "profile": {
            "id": profile.id,
            "skills": profile.skills,
            "experience_level": profile.experience_level,
            "desired_position": profile.desired_position
        }
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
