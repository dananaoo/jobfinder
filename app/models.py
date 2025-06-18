from sqlalchemy import Column, Integer, String, DateTime, Text
from app.db import Base
from datetime import datetime


class JobPost(Base):
    __tablename__ = "job_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    source = Column(String, default="telegram")  # откуда получена вакансия
    link = Column(String, nullable=True)         # ссылка на оригинал
    published_at = Column(DateTime, default=datetime.utcnow)  # когда появилась в канале
    salary = Column(Integer, nullable=True)
    location = Column(String, nullable=True)     # для сравнения с desired_city
    deadline = Column(DateTime, nullable=True)   # если указан дедлайн в тексте


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True, nullable=False)

    # Личная информация
    full_name = Column(String)
    gender = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    email = Column(String, nullable=True)
    citizenship = Column(String, nullable=True)
    address = Column(String, nullable=True)

    # Резюме (исходный текст + распарсенные поля)
    resume_text = Column(Text)
    education = Column(String, nullable=True)
    experience = Column(String, nullable=True)
    experience_level = Column(String)
    skills = Column(Text, nullable=True)
    languages = Column(String, nullable=True)
    interests = Column(String, nullable=True)
    achievements = Column(String, nullable=True)

    # Предпочтения для рекомендаций
    desired_position = Column(String)
    desired_salary = Column(Integer, nullable=True)
    desired_city = Column(String, nullable=True)
    desired_format = Column(String, nullable=True)      # онлайн, офлайн, гибрид
    desired_work_time = Column(String, nullable=True)   # full-time, part-time
    industries = Column(String, nullable=True)          # тип компании / домен
