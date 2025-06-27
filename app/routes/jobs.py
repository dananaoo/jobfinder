from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app import schemas, crud
from app.schemas import JobPostOut, JobPostCreate
from app.crud import create_or_update_job_post
from app.db import get_db

router = APIRouter()

# 📌 Вакансии
@router.post("/jobs", response_model=JobPostOut)
async def create_job(job: JobPostCreate, db: AsyncSession = Depends(get_db)):
    return await create_or_update_job_post(db, job)

@router.get("/jobs", response_model=List[JobPostOut])
async def read_jobs(db: AsyncSession = Depends(get_db)):
    return await crud.get_all_jobs(db)

@router.get("/jobs/search", response_model=List[JobPostOut])
async def search_jobs(
    db: AsyncSession = Depends(get_db),
    salary_min: int = Query(None),
    industry: str = Query(None),
    title: str = Query(None),
    format: str = Query(None),
    location: str = Query(None),
):
    return await crud.search_jobs(
        db,
        salary_min=salary_min,
        industry=industry,
        title=title,
        format=format,
        location=location,
    ) 