from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app import schemas, models
from app.db import get_db

router = APIRouter(
    prefix="/api/v1/users",
    tags=["Users"],
)

@router.get("/with-channels", response_model=List[schemas.UserOutWithDetails])
def get_users_with_channels(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users 