from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import select, and_, or_
from sqlalchemy.exc import IntegrityError
from app.models import JobPost, UserProfile, User, UserTelegramChannel
from app.schemas import JobPostCreate, UserProfileCreate, UserCreate
from datetime import datetime, timedelta
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ✅ Создание или обновление вакансии
async def create_or_update_job_post(db: AsyncSession, job: JobPostCreate):
    # Поиск дубликата по telegram_message_id + channel_name
    result = await db.execute(
        select(JobPost).where(
            and_(
                JobPost.telegram_message_id == job.telegram_message_id,
                JobPost.channel_name == job.channel_name
            )
        )
    )
    existing_job = result.scalars().first()

    job_data = job.dict(exclude_unset=True)

    if existing_job:
        # Такая вакансия уже есть, ничего не делаем
        return existing_job
    else:
        # Создание новой вакансии
        db_job = JobPost(**job_data)
        db.add(db_job)
        await db.commit()
        await db.refresh(db_job)
        return db_job


# ✅ Получить все вакансии
async def get_all_jobs(db: AsyncSession):
    result = await db.execute(select(JobPost))
    return result.scalars().all()


# ✅ Получить все уникальные каналы
async def get_all_unique_channels(db: AsyncSession):
    result = await db.execute(select(UserTelegramChannel.channel_username).distinct())
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


async def get_user_by_email_or_phone(db: AsyncSession, email: str = None, phone: str = None):
    query = None
    if email:
        query = select(User).where(User.email == email)
    elif phone:
        query = select(User).where(User.phone == phone)
    if query is None:
        return None
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    
    # Создаём пустой профиль
    db_profile = UserProfile(
        full_name=f"{user.first_name} {user.last_name}",
        email=user.email,
        phone_number=user.phone
    )

    # Создаём пользователя и сразу связываем с профилем
    db_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        phone=user.phone,
        hashed_password=hashed_password,
        profile=db_profile
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# ✅ Поиск вакансий с фильтрацией
async def search_jobs(db: AsyncSession, salary_min=None, industry=None, title=None, format=None, location=None):
    stmt = select(JobPost)
    filters = []
    if salary_min is not None:
        filters.append(JobPost.salary >= salary_min)
    if industry:
        filters.append(JobPost.industry.ilike(f"%{industry}%"))
    if title:
        filters.append(JobPost.title.ilike(f"%{title}%"))
    if format:
        filters.append(JobPost.format.ilike(f"%{format}%"))
    if location:
        filters.append(JobPost.location.ilike(f"%{location}%"))
    # Если фильтры не заданы — свежие вакансии за сутки
    if not filters:
        one_day_ago = datetime.utcnow() - timedelta(days=1)
        filters.append(JobPost.created_at >= one_day_ago)
    stmt = stmt.where(and_(*filters)).order_by(JobPost.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()
