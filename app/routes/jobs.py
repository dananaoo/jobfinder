from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app import schemas, crud
from app.schemas import JobPostOut, JobPostCreate
from app.crud import create_or_update_job_post
from app.db import AsyncSessionLocal

router = APIRouter()

# 📦 Dependency
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

# 📌 Вакансии
@router.post("/jobs", response_model=JobPostOut)
async def create_job(job: JobPostCreate, db: AsyncSession = Depends(get_db)):
    return await create_or_update_job_post(db, job)

@router.get("/jobs", response_model=List[JobPostOut])
async def read_jobs(db: AsyncSession = Depends(get_db)):
    return await crud.get_all_jobs(db) 