from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import AsyncSessionLocal
from app.schemas import UserRegister, UserLogin, UserOut, UserProfileCreate, UserCreate
from app.crud import create_user, get_user_by_email_or_phone, verify_password, create_user_profile
from app.models import User
from fastapi import status

router = APIRouter()

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user: UserRegister, db: AsyncSession = Depends(get_db)):
    if not user.email and not user.phone:
        raise HTTPException(status_code=400, detail="Email или телефон обязателен")
    existing = await get_user_by_email_or_phone(db, email=user.email, phone=user.phone)
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь с таким email или телефоном уже существует")
    # Создаём профиль
    profile_in = UserProfileCreate(
        full_name=f"{user.first_name} {user.last_name}",
        gender=None, phone_number=user.phone, email=user.email, telegram_id=None
    )
    profile = await create_user_profile(db, profile_in)
    # Создаём пользователя
    user_in = user.dict()
    user_in["user_profile_id"] = profile.id
    user_in["password"] = user.password
    db_user = await create_user(db, UserCreate(**user_in))
    return db_user

@router.post("/login")
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email_or_phone(db, email=data.email, phone=data.phone)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверные учетные данные")
    return {"message": "Успешный вход", "user_id": user.id}

@router.post("/logout")
async def logout():
    # Если будет сессия/токен — тут удалять
    return {"message": "Успешный выход"} 