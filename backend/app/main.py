import asyncio
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
from datetime import datetime, timedelta
import os, json, re, time
# from fastapi.staticfiles import StaticFiles
# import pathlib

import fitz  # PyMuPDF
import asyncpg
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import APIRouter
from fastapi.middleware.cors import CORSMiddleware

from app.db import AsyncSessionLocal, get_db
from app.models import JobPost, UserProfile, User
from app import schemas, crud
from app.schemas import UserProfileCreate, UserProfileOut, JobPostOut
from app.crud import create_user_profile, get_user_profile, recommend_jobs_for_user, create_or_update_job_post, get_user_profile_by_user_id
from app.utils.pdf import extract_text_from_pdf
from app.utils.gemini import extract_json_from_response
from app.utils.gemini import analyze_resume_with_openai as analyze_resume_with_gemini
from app.utils.gemini import recommend_jobs_with_openai

from app.routes.jobs import router as jobs_router
from app.routes.auth import router as auth_router, get_current_user
from app.routes.channels import router as channels_router


load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()
app.include_router(jobs_router)
app.include_router(auth_router)
app.include_router(channels_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 📦 Dependency
# async def get_db() -> AsyncSession:
#     async with AsyncSessionLocal() as session:
#         yield session


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

@app.get("/profile", response_model=UserProfileOut)
async def read_profile(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found for the current user")
    return profile

@app.put("/profile", response_model=UserProfileOut)
async def update_profile(
    profile_data: schemas.UserProfileCreate = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found for the current user")
    
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, field, value)
    
    await db.commit()
    await db.refresh(profile)
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    text = await extract_text_from_pdf(file)
    gpt_data = analyze_resume_with_gemini(text)

    result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found for the current user")

    profile.resume_text = text

    updatable_fields = [
        "full_name", "gender", "citizenship", "address",
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
        "profile": {field: getattr(profile, field) for field in [
            "id", "full_name", "gender", "phone_number", "email", "citizenship", "address", "education",
            "experience", "experience_level", "skills", "languages", "interests", "achievements", "resume_text",
            "desired_position", "desired_salary", "desired_city", "desired_format", "desired_work_time", "industries"
        ]}
    }


# 🎯 Рекомендации
@app.get("/recommendations", response_model=List[JobPostOut])
async def recommend_jobs(user_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    profile = await get_user_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    result = await db.execute(select(JobPost))
    jobs = result.scalars().all()

    # Преобразуем профиль и вакансии в dict для LLM
    profile_dict = {field: getattr(profile, field) for field in profile.__table__.columns.keys()}
    jobs_dicts = [
        {field: getattr(job, field) for field in job.__table__.columns.keys()}
        for job in jobs
    ]

    try:
        llm_recs = recommend_jobs_with_openai(profile_dict, jobs_dicts)
        # llm_recs: [{"id": <job_id>, "reasons": [..]}]
        id_to_job = {job.id: job for job in jobs}
        recommended = []
        for rec in llm_recs:
            job = id_to_job.get(rec["id"])
            if job:
                job_out = JobPostOut.from_orm(job).dict()
                job_out["reasons"] = rec.get("reasons", [])
                recommended.append(job_out)
        return recommended[:30]
    except Exception as e:
        print("❌ LLM recommendations failed, fallback to comprehensive logic:", e)
        # Comprehensive fallback: analyze full profile like LLM would
        
        # Parse all user data with JSON support
        def parse_field(field_value):
            """Parse field that might be JSON array or comma-separated string"""
            if not field_value:
                return []
            try:
                # Try parsing as JSON first
                import json
                parsed = json.loads(field_value)
                if isinstance(parsed, list):
                    return [str(item).strip().lower() for item in parsed if item]
                else:
                    return [str(parsed).strip().lower()]
            except:
                # Fallback to comma-separated parsing
                return [s.strip().lower() for s in str(field_value).split(",") if s.strip()]
        
        user_skills = parse_field(profile.skills)
        user_industries = parse_field(profile.industries)
        user_position = (profile.desired_position or "").lower()
        user_city = (profile.desired_city or "").lower()
        user_format = (profile.desired_format or "").lower()
        user_work_time = (profile.desired_work_time or "").lower()
        user_experience_level = (profile.experience_level or "").lower()
        
        # Parse experience and education for additional skills/keywords
        experience_text = (profile.experience or "").lower()
        education_text = (profile.education or "").lower()
        achievements_text = (profile.achievements or "").lower()
        
        # Extract additional skills from experience/education
        additional_keywords = []
        tech_keywords = ['python', 'javascript', 'java', 'react', 'django', 'sql', 'mongodb', 'aws', 'docker', 'kubernetes', 'machine learning', 'data science', 'frontend', 'backend', 'fullstack', 'api', 'rest', 'microservices']
        for keyword in tech_keywords:
            if keyword in experience_text or keyword in education_text or keyword in achievements_text:
                additional_keywords.append(keyword)

        def comprehensive_relevance_score(job: JobPost) -> tuple:
            score = 0
            matches = []
            job_title = (job.title or "").lower()
            job_description = (job.description or "").lower()
            job_location = (job.location or "").lower()
            job_format = (job.format or "").lower()
            job_text = f"{job_title} {job_description}"
            
            # 1. EXACT POSITION MATCH (weight: 15) - highest priority
            if user_position and user_position in job_title:
                score += 15
                matches.append(f"Точное совпадение должности: {user_position}")
            elif user_position and any(word in job_title for word in user_position.split() if len(word) > 2):
                score += 8
                matches.append(f"Частичное совпадение должности: {user_position}")
            
            # 2. SKILLS FROM PROFILE (weight: 4 per skill)
            skill_matches = [skill for skill in user_skills if skill in job_text]
            score += len(skill_matches) * 4
            if skill_matches:
                matches.append(f"Навыки из профиля: {', '.join(skill_matches[:4])}")
            
            # 3. SKILLS FROM EXPERIENCE (weight: 3 per skill)
            experience_matches = [kw for kw in additional_keywords if kw in job_text]
            score += len(experience_matches) * 3
            if experience_matches:
                matches.append(f"Навыки из опыта: {', '.join(experience_matches[:3])}")
            
            # 4. EXPERIENCE LEVEL MATCH (weight: 6)
            level_keywords = {
                'junior': ['junior', 'intern', 'entry', 'начинающий', 'стажер'],
                'middle': ['middle', 'mid', 'experienced', 'опытный'],
                'senior': ['senior', 'lead', 'старший', 'ведущий', 'главный']
            }
            if user_experience_level:
                for level, keywords in level_keywords.items():
                    if user_experience_level in keywords:
                        if any(kw in job_text for kw in level_keywords[level]):
                            score += 6
                            matches.append(f"Уровень опыта: {user_experience_level}")
                        break
            
            # 5. INDUSTRY MATCH (weight: 5)
            industry_matches = [ind for ind in user_industries if ind in job_text]
            score += len(industry_matches) * 5
            if industry_matches:
                matches.append(f"Индустрия: {', '.join(industry_matches[:2])}")
            
            # 6. LOCATION MATCH (weight: 4)
            if user_city and user_city in job_location:
                score += 4
                matches.append(f"Город: {user_city}")
            
            # 7. FORMAT MATCH (weight: 3)
            if user_format and user_format in job_format:
                score += 3
                matches.append(f"Формат работы: {user_format}")
            
            # 8. WORK TIME MATCH (weight: 2)
            if user_work_time and user_work_time in job_text:
                score += 2
                matches.append(f"График работы: {user_work_time}")
            
            # 9. BONUS FOR MULTIPLE MATCHES
            if len(matches) >= 3:
                score += 2
                matches.append("Бонус за множественные совпадения")
                
            return (score, matches)

        # Score all jobs and sort by relevance
        job_scores = []
        for job in jobs:
            score, matches = comprehensive_relevance_score(job)
            if score > 0:  # Only include jobs with at least one match
                job_out = JobPostOut.from_orm(job).dict()
                job_out["reasons"] = matches
                job_scores.append((job_out, score))
        
        # Sort by score (descending) and return top 30
        sorted_jobs = sorted(job_scores, key=lambda x: x[1], reverse=True)
        return [job for job, score in sorted_jobs[:30]]


# 🧹 Очистка устаревших вакансий
async def clean_old_jobs():
    await asyncio.sleep(2)
    while True:
        try:
            async with AsyncSessionLocal() as db:
                cutoff_date = datetime.utcnow() - timedelta(days=30)
                await db.execute(delete(JobPost).where(JobPost.created_at < cutoff_date))
                await db.commit()
        except Exception as e:
            print("❌ Ошибка при очистке старых job'ов:", e)
        await asyncio.sleep(86400)




# Frontend работает отдельно на порту 5173
# StaticFiles не нужны в микросервисной архитектуре