import json
from fastapi import APIRouter, Depends, UploadFile, File, Body, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app import schemas, models
from app.db import get_db
from app.auth import get_current_user
from app.utils.pdf import extract_text_from_pdf
from app.utils.gemini import analyze_resume_with_gemini

router = APIRouter(
    prefix="/api/v1/profile",
    tags=["User Profile"],
)

@router.get("/", response_model=schemas.UserProfileOut)
def read_profile(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile

@router.put("/", response_model=schemas.UserProfileOut)
def update_profile(
    profile_data: schemas.UserProfileCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    return profile

@router.post("/upload_resume")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    text = await extract_text_from_pdf(file)
    gpt_data = analyze_resume_with_gemini(text)

    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    profile.resume_text = text

    updatable_fields = [
        "full_name", "gender", "citizenship", "address",
        "education", "experience", "experience_level", "skills", "languages", "interests", "achievements",
        "desired_position", "desired_salary", "desired_city", "desired_format", "desired_work_time", "industries"
    ]
    bad_values = {"string", "none", "null", ""}
    for field in updatable_fields:
        if field in gpt_data:
            value = gpt_data[field]
            if isinstance(value, list) or isinstance(value, dict):
                value = json.dumps(value, ensure_ascii=False)
            if isinstance(value, str) and value.strip().lower() in bad_values:
                continue
            if isinstance(value, int) and value == 0 and field != "desired_salary":
                continue
            setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return {
        "message": "Резюме обработано и профиль обновлён",
        "profile": schemas.UserProfileOut.from_orm(profile).dict()
    } 