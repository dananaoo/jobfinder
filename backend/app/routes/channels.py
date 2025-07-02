from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import schemas, models, crud
from app.db import get_db
from app.routes.auth import get_current_user
from app.utils.telegram_client import telegram_client
from telethon.errors import ChannelInvalidError, ChannelPrivateError
import asyncio

router = APIRouter(
    prefix="/api/v1/channels",
    tags=["Telegram Channels"],
)

MAX_CHANNELS_PER_USER = 3

@router.post("/", response_model=schemas.UserTelegramChannelOut, status_code=status.HTTP_201_CREATED)
async def add_user_channel(
    channel: schemas.UserTelegramChannelCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Проверяем, не превышен ли лимит каналов
    if len(current_user.channels) >= MAX_CHANNELS_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You can add a maximum of {MAX_CHANNELS_PER_USER} channels.",
        )

    # Проверяем, не добавлен ли уже такой канал
    existing_channel = db.query(models.UserTelegramChannel).filter(
        models.UserTelegramChannel.user_id == current_user.id,
        models.UserTelegramChannel.channel_username == channel.channel_username
    ).first()

    if existing_channel:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This channel is already in your list.",
        )

    # Validate channel existence and public status
    try:
        if not telegram_client.is_connected():
            await telegram_client.connect()
        entity = await telegram_client.get_entity(channel.channel_username)
    except ChannelInvalidError:
        raise HTTPException(status_code=400, detail="Channel is invalid or does not exist.")
    except ChannelPrivateError:
        raise HTTPException(status_code=400, detail="Channel is private and cannot be added.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to validate channel: {str(e)}")
    finally:
        if telegram_client.is_connected():
            await telegram_client.disconnect()

    db_channel = models.UserTelegramChannel(
        user_id=current_user.id,
        channel_username=channel.channel_username
    )
    db.add(db_channel)
    db.commit()
    db.refresh(db_channel)
    return db_channel

@router.get("/", response_model=List[schemas.UserTelegramChannelOut])
async def get_user_channels(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return current_user.channels

@router.get("/internal/all", response_model=List[str])
async def get_all_channels(db: Session = Depends(get_db)):
    return await crud.get_all_unique_channels(db)

@router.delete("/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_channel(
    channel_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_channel = db.query(models.UserTelegramChannel).filter(
        models.UserTelegramChannel.id == channel_id
    ).first()

    if not db_channel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")

    if db_channel.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this channel.",
        )

    db.delete(db_channel)
    db.commit()
    return None 