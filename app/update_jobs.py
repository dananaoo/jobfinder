import asyncio
import time
from app.parse_telegram import main as parse_telegram_main

INTERVAL_SECONDS = 30 * 60  # 30 минут

async def loop_forever():
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
