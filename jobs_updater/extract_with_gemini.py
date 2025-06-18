import os
import re
import json
import logging
from dotenv import load_dotenv
import google.generativeai as genai

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.error("❌ GEMINI_API_KEY not found in environment variables")
    raise ValueError("GEMINI_API_KEY is required")

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel("models/gemini-1.5-flash")
    logger.info("✅ Gemini model initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize Gemini model: {e}")
    raise

def extract_fields_from_text(text: str) -> dict:
    if not text:
        logger.warning("⚠️ Empty text provided to extract_fields_from_text")
        return {}

    prompt = f"""
Ты — AI ассистент. Проанализируй описание вакансии и извлеки следующие поля, если они есть:
- salary: целое число (без символов валюты, только число)
- location: строка (город или страна)
- deadline: строка (дата дедлайна если указана, в формате YYYY-MM-DD)
- format: строка (онлайн / офлайн / гибрид)
- work_time: строка (full-time / part-time / internship / freelance)
- industry: строка (например: IT, маркетинг, финансы)

Вот текст вакансии:
{text}

Верни JSON с этими ключами. Если значения нет — верни null.
"""

    try:
        logger.info("🤖 Sending request to Gemini...")
        response = model.generate_content(prompt)
        
        if not response.text:
            logger.error("❌ Empty response from Gemini")
            return {}

        logger.info(f"📥 Raw response from Gemini: {response.text[:200]}...")
        
        json_match = re.search(r"\{.*\}", response.text, re.DOTALL)
        if not json_match:
            logger.error("❌ No JSON found in Gemini response")
            return {}
            
        json_str = json_match.group()
        result = json.loads(json_str)
        logger.info(f"✨ Successfully extracted fields: {result}")
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Failed to parse JSON from Gemini response: {e}")
        return {}
    except Exception as e:
        logger.error(f"❌ Unexpected error in extract_fields_from_text: {e}")
        return {}
