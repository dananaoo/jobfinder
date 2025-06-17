import asyncio
import os
import requests
from telethon import TelegramClient
from telethon.tl.types import Message
from dotenv import load_dotenv

load_dotenv()

api_id = int(os.getenv("TG_API_ID"))
api_hash = os.getenv("TG_API_HASH")
channels = ["jobforjunior" , "remotejobss", "forfrontend", "forallqa", "fordesigner", "forproducts"]

# замени на нужный канал
client = TelegramClient("tg_session", api_id, api_hash)

FASTAPI_URL = "http://localhost:8000/jobs"

def post_job(title, description):
    data = {
        "title": title.strip(),
        "description": description.strip(),
        "source": "telegram",
        "link": None
    }
    response = requests.post(FASTAPI_URL, json=data)
    if response.status_code == 200:
        print(f"✅ Вакансия сохранена: {title}")
    else:
        print(f"❌ Ошибка при сохранении: {response.status_code} - {response.text}")

async def main():
    await client.start()
    print("🔌 Connected to Telegram!")

    for ch in channels:
        print(f"\n📡 Чтение из канала: {ch}")
        async for message in client.iter_messages(ch, limit=10):
            if isinstance(message, Message) and message.message:
                lines = message.message.strip().split("\n", 1)
                title = lines[0][:100] if lines else "No Title"
                description = lines[1] if len(lines) > 1 else ""
                post_job(title, description)

if __name__ == "__main__":
    asyncio.run(main())
