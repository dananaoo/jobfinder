from sqlalchemy import Column, Integer, String, DateTime, Text
from app.db import Base
from datetime import datetime

class JobPost(Base):
    __tablename__ = "job_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    source = Column(String, default="telegram")
    link = Column(String, nullable=True)
    published_at = Column(DateTime, default=datetime.utcnow)
    salary = Column(Integer, nullable=True) 
    location = Column(String, nullable=True)  # для сравнения с desired_city

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True, nullable=False)
    full_name = Column(String)
    resume_text = Column(Text)
    desired_position = Column(String)
    skills = Column(Text)
    experience_level = Column(String)
    desired_salary = Column(Integer, nullable=True)
    desired_city = Column(String, nullable=True)
    desired_format = Column(String, nullable=True)  # онлайн, офлайн, гибрид
    desired_work_time = Column(String, nullable=True)  # full-time, part-time