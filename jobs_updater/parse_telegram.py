import asyncio
import os
import requests
import logging
from telethon import TelegramClient
from telethon.tl.types import Message
from dotenv import load_dotenv
from extract_with_gemini import extract_fields_from_text
from datetime import datetime, timedelta, timezone

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

api_id = int(os.getenv("TG_API_ID"))
api_hash = os.getenv("TG_API_HASH")

GLOBAL_CHANNELS = ["jobforjunior", "jobkz_1", "kzdailyjobs", "kz_bi_jobs", "careercentervacancies", "itcom_kz", "juniors_rabota_jobs", "evacuatejobs", "halyk_jumys", "remote_kazakhstan"]

client = TelegramClient("tg_session", api_id, api_hash)

FASTAPI_URL = "http://backend:8000"

FIRST_RUN = os.getenv("FIRST_RUN", "false").lower() == "true"

def get_user_channels():
    try:
        response = requests.get(f"{FASTAPI_URL}/api/v1/channels/internal/all")
        if response.status_code == 200:
            logger.info(f"✅ Получены каналы пользователей: {response.json()}")
            return response.json()
        else:
            logger.error(f"❌ Ошибка при получении каналов пользователей: {response.status_code}")
            return []
    except Exception as e:
        logger.error(f"❌ Не удалось получить каналы пользователей: {e}")
        return []

def post_job(data):
    try:
        response = requests.post(f"{FASTAPI_URL}/jobs", json=data)
        if response.status_code == 200:
            logger.info(f"✅ Вакансия сохранена: {data['title']}")
        else:
            logger.error(f"❌ Ошибка при сохранении: {response.status_code} - {response.text}")
    except Exception as e:
        logger.error(f"❌ Ошибка при отправке запроса: {e}")

async def main():
    try:
        await client.start()
        logger.info("🔌 Connected to Telegram!")

        user_channels = get_user_channels()
        all_channels = list(set(GLOBAL_CHANNELS + user_channels))
        logger.info(f"📢 Все каналы для парсинга: {all_channels}")

        if FIRST_RUN:
            one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
            logger.info("⏳ Первый запуск: парсим только сообщения за последние 7 дней")
        else:
            logger.info("⏰ Обычный запуск: парсим только последние 20 сообщений")

        for ch in all_channels:
            logger.info(f"\n📡 Чтение из канала: {ch}")
            try:
                limit = 100 if FIRST_RUN else 20
                async for message in client.iter_messages(ch, limit=limit):
                    if FIRST_RUN and message.date < one_week_ago:
                        continue
                    if isinstance(message, Message) and message.message:
                        lines = message.message.strip().split("\n", 1)
                        title = lines[0][:100] if lines else "No Title"
                        description = lines[1] if len(lines) > 1 else ""

                        logger.info(f"📝 Обработка вакансии: {title}")

                        try:
                            fields = extract_fields_from_text(description)
                            logger.info(f"✨ Извлеченные поля: {fields}")
                            await asyncio.sleep(4.2)  # ⏱️ защита от лимитов Gemini
                        except Exception as e:
                            logger.error(f"❌ Gemini parse error: {e}")
                            fields = {}

                        # Логика выбора contact_info
                        contact_info = fields.get("contact_info")
                        if contact_info and contact_info.strip():
                            contact_info_value = contact_info.strip()
                        else:
                            contact_info_value = f"https://t.me/{ch}"

                        data = {
                            "title": title.strip(),
                            "description": description.strip(),
                            "telegram_message_id": message.id,
                            "channel_name": ch,
                            "created_at": message.date.replace(tzinfo=None).isoformat(),
                            "parsed_at": datetime.utcnow().isoformat(),
                            "contact_info": contact_info_value,
                            "salary": fields.get("salary"),
                            "location": fields.get("location"),
                            "deadline": fields.get("deadline"),
                            "format": fields.get("format"),
                            "industry": fields.get("industry"),
                        }

                        post_job(data)
            except Exception as e:
                logger.error(f"❌ Ошибка при чтении канала {ch}: {e}")

    except Exception as e:
        logger.error(f"❌ Critical error: {e}")
    finally:
        await client.disconnect()
        logger.info("👋 Disconnected from Telegram")

if __name__ == "__main__":
    asyncio.run(main())


