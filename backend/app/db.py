import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Настраиваем движок и сессию
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для моделей
Base = declarative_base()

# Зависимость для получения сессии БД
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
