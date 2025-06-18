from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.models import JobPost, UserProfile
from app.schemas import JobPostCreate, UserProfileCreate


# ✅ Создание вакансии (с проверкой на дубликат)
async def create_job_post(db: AsyncSession, job: JobPostCreate):
    result = await db.execute(
        select(JobPost).where(
            JobPost.title == job.title,
            JobPost.description == job.description,
            JobPost.source == job.source,
        )
    )
    existing_job = result.scalars().first()

    if existing_job:
        return existing_job

    db_job = JobPost(**job.dict())
    db.add(db_job)
    await db.commit()
    await db.refresh(db_job)
    return db_job


# ✅ Получить все вакансии
async def get_all_jobs(db: AsyncSession):
    result = await db.execute(select(JobPost))
    return result.scalars().all()


# ✅ Создать профиль пользователя
async def create_user_profile(db: AsyncSession, profile: UserProfileCreate):
    db_profile = UserProfile(**profile.dict())
    db.add(db_profile)
    await db.commit()
    await db.refresh(db_profile)
    return db_profile


# ✅ Получить профиль по Telegram ID
async def get_user_profile(db: AsyncSession, telegram_id: str):
    result = await db.execute(
        select(UserProfile).where(UserProfile.telegram_id == telegram_id)
    )
    return result.scalar_one_or_none()


# ✅ Рекомендовать вакансии по профилю
async def recommend_jobs_for_user(db: AsyncSession, user: UserProfile) -> list[JobPost]:
    stmt = select(JobPost)

    # Город
    if user.desired_city:
        stmt = stmt.where(JobPost.location.ilike(f"%{user.desired_city}%"))

    # Формат
    if user.desired_format:
        stmt = stmt.where(JobPost.description.ilike(f"%{user.desired_format}%"))

    # График
    if user.desired_work_time:
        stmt = stmt.where(JobPost.description.ilike(f"%{user.desired_work_time}%"))

    # Зарплата
    if user.desired_salary:
        stmt = stmt.where(JobPost.salary >= user.desired_salary * 0.8)

    # Навыки
    if user.skills:
        skill_filters = [
            JobPost.description.ilike(f"%{skill.strip().lower()}%")
            for skill in user.skills.split(",")
        ]
        for f in skill_filters:
            stmt = stmt.where(f)

    result = await db.execute(stmt)
    return result.scalars().all()
