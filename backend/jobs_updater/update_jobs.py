import asyncio
import time
import os
from dotenv import load_dotenv
from parse_telegram import main as parse_telegram_main

load_dotenv()

INTERVAL_SECONDS = 3 * 60 * 60  # 3 часа

async def loop_forever():
    if os.getenv("ENV") != "prod":
        print("🛑 Telegram парсинг отключён в dev-среде.")
        return
        
    while True:
        print("🔄 Запуск парсинга Telegram...")
        try:
            await parse_telegram_main()
            print("✅ Парсинг завершён.")
        except Exception as e:
            print("❌ Ошибка во время парсинга:", e)
        await asyncio.sleep(INTERVAL_SECONDS)

if __name__ == "__main__":
    asyncio.run(loop_forever())
