from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import JobPost
from app.schemas import JobPostCreate
from app.models import UserProfile
from app.schemas import UserProfileCreate
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
async def create_job_post(db: AsyncSession, job: JobPostCreate):
    db_job = JobPost(**job.dict())
    db.add(db_job)
    await db.commit()
    await db.refresh(db_job)
    return db_job

async def get_all_jobs(db: AsyncSession):
    result = await db.execute(select(JobPost))
    return result.scalars().all()

async def create_user_profile(db: AsyncSession, profile: UserProfileCreate):
    db_profile = UserProfile(**profile.dict())
    db.add(db_profile)
    await db.commit()
    await db.refresh(db_profile)
    return db_profile

async def get_user_profile(db: AsyncSession, telegram_id: str):
    result = await db.execute(
        select(UserProfile).where(UserProfile.telegram_id == telegram_id)
    )
    return result.scalar_one_or_none()

async def recommend_jobs_for_user(db: AsyncSession, user: UserProfile) -> list[JobPost]:
    stmt = select(JobPost)

    # Простейшие фильтры на основе профиля пользователя
    if user.skills:
        skill_filters = [JobPost.description.ilike(f"%{skill.strip()}%") for skill in user.skills.split(",")]
        stmt = stmt.where(*skill_filters)

    if user.desired_city:
        stmt = stmt.where(JobPost.city.ilike(f"%{user.desired_city}%"))

    if user.desired_format:
        stmt = stmt.where(JobPost.format.ilike(f"%{user.desired_format}%"))

    if user.desired_work_time:
        stmt = stmt.where(JobPost.work_time.ilike(f"%{user.desired_work_time}%"))

    if user.desired_salary:
        stmt = stmt.where(JobPost.salary >= user.desired_salary)

    result = await db.execute(stmt)
    return result.scalars().all()

async def create_job_post(db: AsyncSession, job: JobPostCreate):
    # Проверка на дубликаты
    result = await db.execute(
        select(JobPost).where(
            JobPost.title == job.title,
            JobPost.description == job.description,
            JobPost.source == job.source,
        )
    )
    existing_job = result.scalars().first()

    if existing_job:
        return existing_job  # или можно raise HTTPException(...)

    # Если дубликатов нет — сохраняем
    db_job = JobPost(**job.dict())
    db.add(db_job)
    await db.commit()
    await db.refresh(db_job)
    return db_job