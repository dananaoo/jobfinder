from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Union


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
    telegram_id: Optional[str] = None

class UserProfileOut(UserProfileBase):
    id: int
    telegram_id: Optional[str] = None

    class Config:
        from_attributes = True


# =====================
# 👤 USER
# =====================
class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: Union[str, None] = None
    phone: Union[str, None] = None

class UserCreate(UserBase):
    password: str
    user_profile_id: int

class UserOut(UserBase):
    id: int
    user_profile_id: int
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: Union[str, None] = None
    phone: Union[str, None] = None
    password: str

class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: Union[str, None] = None
    phone: Union[str, None] = None
    password: str
