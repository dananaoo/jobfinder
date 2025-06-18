from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# =====================
# 🧾 JOB POST
# =====================
class JobPostCreate(BaseModel):
    title: str
    description: str
    link: Optional[str] = None
    source: Optional[str] = "telegram"
    published_at: Optional[datetime] = None
    salary: Optional[int] = None
    location: Optional[str] = None
    deadline: Optional[datetime] = None

class JobPostOut(JobPostCreate):
    id: int

    class Config:
        from_attributes = True


# =====================
# 👤 USER PROFILE
# =====================
class UserProfileBase(BaseModel):
    full_name: Optional[str] = None
    gender: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    citizenship: Optional[str] = None
    address: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    languages: Optional[str] = None
    interests: Optional[str] = None
    achievements: Optional[str] = None
    resume_text: Optional[str] = None
    desired_position: Optional[str] = None
    experience_level: Optional[str] = None
    desired_salary: Optional[int] = None
    desired_city: Optional[str] = None
    desired_format: Optional[str] = None  # онлайн, офлайн, гибрид
    desired_work_time: Optional[str] = None  # full-time, part-time
    industries: Optional[str] = None

class UserProfileCreate(UserProfileBase):
    telegram_id: str

class UserProfileOut(UserProfileBase):
    id: int
    telegram_id: str

    class Config:
        from_attributes = True
