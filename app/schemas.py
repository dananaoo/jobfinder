from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Union


# =====================
# 🧾 JOB POST
# =====================
class JobPostBase(BaseModel):
    title: str
    description: str
    contact_info: Optional[str] = "telegram"
    created_at: Optional[datetime] = None
    salary: Optional[int] = None
    location: Optional[str] = None
    deadline: Optional[datetime] = None
    format: Optional[str] = None
    channel_name: Optional[str] = None
    telegram_message_id: Optional[int] = None


class JobPostCreate(JobPostBase):
    pass


class JobPostOut(JobPostBase):
    id: int
    parsed_at: datetime

    class Config:
        from_attributes = True


# =====================
# ➕ USER TELEGRAM CHANNEL
# =====================
class UserTelegramChannelBase(BaseModel):
    channel_username: str

class UserTelegramChannelCreate(UserTelegramChannelBase):
    pass

class UserTelegramChannelOut(UserTelegramChannelBase):
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

class UserOut(UserBase):
    id: int
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
