import asyncio
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import fitz  # PyMuPDF
import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import Query
from app.models import JobPost, UserProfile
from sqlalchemy import select, delete
from datetime import datetime, timedelta
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

import time
import asyncpg
from app.db import AsyncSessionLocal
from app import schemas, crud
from app.schemas import UserProfileCreate, UserProfileOut, JobPostOut
from app.crud import create_user_profile, get_user_profile, recommend_jobs_for_user


# ✅ Настройка Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

# 📦 Dependency
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session



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

# 🌱 Тестовый рут
@app.get("/")
async def root():
    return {"message": "Telegram Job Tracker working!"}

# 📌 CRUD по вакансиям
@app.post("/jobs", response_model=schemas.JobPostOut)
async def create_job(job: schemas.JobPostCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_job_post(db, job)

@app.get("/jobs", response_model=List[schemas.JobPostOut])
async def read_jobs(db: AsyncSession = Depends(get_db)):
    return await crud.get_all_jobs(db)


# 👤 CRUD по профилю
@app.post("/profile", response_model=UserProfileOut)
async def create_profile(profile: UserProfileCreate, db: AsyncSession = Depends(get_db)):
    return await create_user_profile(db, profile)

@app.get("/profile/{telegram_id}", response_model=UserProfileOut)
async def read_profile(telegram_id: str, db: AsyncSession = Depends(get_db)):
    profile = await get_user_profile(db, telegram_id)
    if profile is None:
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

# 🧠 Извлечение JSON из текста ответа Gemini
def extract_json_from_response(text: str) -> dict:
    try:
        # Ищем первый JSON блок
        json_str = re.search(r"\{.*\}", text, re.DOTALL).group()
        return json.loads(json_str)
    except Exception as e:
        print("❌ Ошибка JSON:", e)
        raise HTTPException(status_code=500, detail="Gemini вернул невалидный JSON")

# 🧠 Обработка резюме через Gemini
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

# 📤 Эндпоинт для загрузки резюме
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

    # Обновляем профиль
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
@app.get("/recommendations", response_model=List[JobPostOut])
async def recommend_jobs(telegram_id: str = Query(...), db: AsyncSession = Depends(get_db)):
    profile = await get_user_profile(db, telegram_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    query = select(JobPost)

    # Фильтры по полям профиля
    if profile.desired_city:
        query = query.where(JobPost.location.ilike(f"%{profile.desired_city}%"))
    if profile.desired_format:
        query = query.where(JobPost.description.ilike(f"%{profile.desired_format}%"))
    if profile.desired_work_time:
        query = query.where(JobPost.description.ilike(f"%{profile.desired_work_time}%"))
    if profile.desired_salary:
        query = query.where(JobPost.salary >= profile.desired_salary * 0.8)

    result = await db.execute(query)
    jobs = result.scalars().all()

    # Фильтрация по скиллам и ранжирование
    user_skills = [s.strip().lower() for s in (profile.skills or "").split(",")]

    def skill_match_count(job):
        job_text = f"{job.title} {job.description}".lower()
        return sum(skill in job_text for skill in user_skills)

    # Добавляем только те, где есть совпадения по скиллам
    matched_jobs = [job for job in jobs if skill_match_count(job) > 0]
    matched_jobs.sort(key=skill_match_count, reverse=True)

    return matched_jobs[:30]

async def clean_old_jobs():
    await asyncio.sleep(2)  # Подстраховка, чтобы БД точно поднялась
    while True:
        try:
            async with AsyncSessionLocal() as db:
                cutoff_date = datetime.utcnow() - timedelta(days=30)
                await db.execute(delete(JobPost).where(JobPost.published_at < cutoff_date))
                await db.commit()
        except Exception as e:
            print("❌ Ошибка при очистке старых job'ов:", e)
        await asyncio.sleep(86400)  # раз в сутки


