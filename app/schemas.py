from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class JobPostCreate(BaseModel):
    title: str
    description: str
    link: Optional[str] = None
    source: Optional[str] = "telegram"

class JobPostOut(JobPostCreate):
    id: int
    published_at: datetime

    class Config:
        orm_mode = True
class UserProfileCreate(BaseModel):
    telegram_id: str
    full_name: Optional[str] = None
    resume_text: Optional[str] = None
    desired_position: Optional[str] = None
    desired_salary: Optional[str] = None
    skills: Optional[str] = None
    experience_level: Optional[str] = None
    desired_salary: Optional[int] = None
    desired_city: Optional[str] = None
    desired_format: Optional[str] = None
    desired_work_time: Optional[str] = None
class UserProfileOut(UserProfileCreate):
    id: int

    class Config:
        from_attributes = True  