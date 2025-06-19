import asyncio
import os
import requests
import logging
from telethon import TelegramClient
from telethon.tl.types import Message
from dotenv import load_dotenv
from extract_with_gemini import extract_fields_from_text

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

api_id = int(os.getenv("TG_API_ID"))
api_hash = os.getenv("TG_API_HASH")
channels = ["jobforjunior", "remotejobss", "forfrontend", "forallqa", "fordesigner", "forproducts"]

client = TelegramClient("tg_session", api_id, api_hash)

FASTAPI_URL = "http://backend:8000/jobs"

def check_backend():
    try:
        response = requests.get("http://backend:8000/")
        if response.status_code == 200:
            logger.info("✅ Backend is available")
            return True
        else:
            logger.error(f"❌ Backend returned status code: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Cannot connect to backend: {e}")
        return False

def post_job(data):
    try:
        response = requests.post(FASTAPI_URL, json=data)
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

        if not check_backend():
            logger.error("❌ Backend is not available, exiting...")
            return

        for ch in channels:
            logger.info(f"\n📡 Чтение из канала: {ch}")
            try:
                async for message in client.iter_messages(ch, limit=3):
                    if isinstance(message, Message) and message.message:
                        lines = message.message.strip().split("\n", 1)
                        title = lines[0][:100] if lines else "No Title"
                        description = lines[1] if len(lines) > 1 else ""

                        logger.info(f"📝 Обработка вакансии: {title}")

                        try:
                            fields = extract_fields_from_text(description)
                            logger.info(f"✨ Извлеченные поля: {fields}")
                            await asyncio.sleep(5)  # ⏱️ защита от лимитов Gemini
                        except Exception as e:
                            logger.error(f"❌ Gemini parse error: {e}")
                            fields = {}

                        data = {
                            "title": title.strip(),
                            "description": description.strip(),
                            "source": "telegram",
                            "link": None,
                            "salary": fields.get("salary"),
                            "location": fields.get("location"),
                            "deadline": fields.get("deadline"),
                            "format": fields.get("format"),
                            "work_time": fields.get("work_time"),
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


