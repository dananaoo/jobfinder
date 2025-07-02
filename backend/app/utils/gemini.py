import os
import json
import openai
import re
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

client = openai.AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2024-02-15-preview",
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT")  # Например: "gpt-35-turbo"

def extract_json_from_response(text: str) -> dict:
    try:
        json_str = re.search(r"\{.*\}", text, re.DOTALL).group()
        return json.loads(json_str)
    except Exception as e:
        print("❌ Ошибка JSON:", e)
        raise HTTPException(status_code=500, detail="OpenAI вернул невалидный JSON")

def analyze_resume_with_openai(text: str) -> dict:
    prompt = f"""
Ты — AI-ассистент, который структурирует резюме для HR-системы. Твоя задача — максимально точно извлечь данные по каждому из следующих полей. Если по какому-то полю нет информации — не включай его в JSON вообще (не пиши 'string', 'null', 'none', '0' и т.п.).

**Поля и требования:**
- full_name: ФИО полностью, если есть.
- gender: Только если явно указан (например, 'male', 'female', 'женский', 'мужской').
- phone_number: Только реальный номер телефона, без лишних слов.
- email: Только реальный email, без лишних слов.
- citizenship: Гражданство, если указано.
- address: Город и страна проживания, если есть.
- education: Структура с ключами: university, degree, cgpa, scholarship, start_date, end_date, relevant_courses (если есть).
- experience: Список объектов с ключами: title, company/organization, location, start_date, end_date, responsibilities, achievement (если есть).
- experience_level: Только если явно указан (junior/middle/senior/lead и т.п.).
- skills: Список технологий, языков программирования, инструментов и т.п. (например, ["Python", "SQL", "Django"]).
- languages: Список языков и уровней владения, если есть.
- interests: Список интересов, если есть.
- achievements: Список достижений, наград, сертификатов, призовых мест, публикаций и т.п. Даже если они встречаются внутри опыта или проектов, выдели их сюда отдельным списком.
- desired_position: Желаемая должность, если указана.
- desired_salary: Только если явно указана сумма или диапазон.
- desired_city: Город, в котором ищет работу, если есть.
- desired_format: Формат работы (онлайн, офлайн, гибрид), если есть.
- desired_work_time: График работы (full-time, part-time и т.п.), если есть.
- industries: Список индустрий или сфер, если есть.

**Требования:**
- Не возвращай поле, если не удалось найти реальное значение.
- Не пиши мусорные значения ('string', 'none', 'null', '0', 'N/A' и т.п.).
- Если поле сложное (например, education, experience, skills, achievements), верни его как структуру или список.
- Если в резюме есть достижения (награды, призовые места, сертификаты, публикации и т.д.), обязательно выдели их в отдельное поле achievements (список строк), даже если они встречаются внутри опыта или проектов.

**Пример:**
{{
  "full_name": "Иван Иванов",
  "email": "ivan@example.com",
  "phone_number": "+7 777 123 45 67",
  "education": {{
    "university": "МГУ",
    "degree": "Бакалавр прикладной математики",
    "cgpa": 4.8,
    "start_date": "2018",
    "end_date": "2022"
  }},
  "skills": ["Python", "SQL", "Django"],
  "experience": [
    {{
      "title": "Backend Developer",
      "company": "ООО Рога и Копыта",
      "location": "Москва, Россия",
      "start_date": "2022-06",
      "end_date": "2023-12",
      "responsibilities": ["Разработка API", "Интеграция с внешними сервисами"],
      "achievement": "Внедрил CI/CD, ускорил релизы на 30%"
    }}
  ],
  "achievements": [
    "Победитель олимпиады по программированию",
    "Сертификат AWS Certified Developer"
  ]
}}

Резюме:
{text}
"""  # Твой длинный промпт оставь без изменений

    try:
        response = client.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": "Ты структурируешь резюме в JSON формате строго по заданному шаблону."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=2000,
        )
        raw_text = response.choices[0].message.content
        print("📥 Ответ от Azure OpenAI:", raw_text)
        return extract_json_from_response(raw_text)
    except Exception as e:
        print("❌ Azure OpenAI API error:", e)
        raise HTTPException(status_code=500, detail="Ошибка при обращении к Azure OpenAI API")

def recommend_jobs_with_openai(profile: dict, jobs: list) -> list:
    """
    Использует Azure OpenAI для выбора наиболее подходящих вакансий для пользователя и объяснения причин.
    На входе: profile (dict) — профиль пользователя, jobs (list) — список вакансий (dict).
    На выходе: список рекомендованных вакансий с причинами (list of dict: {job, reasons})
    """
    prompt = f"""
Ты — AI-ассистент по подбору вакансий. Тебе дан профиль пользователя и список вакансий. Твоя задача — выбрать только те вакансии, которые наиболее подходят этому пользователю (по крайней мере по 2-3 совпадающим пунктам: навыки, индустрия, город, формат работы, график, желаемая должность и т.д.).

Для каждой подходящей вакансии:
- Верни id вакансии
- Кратко объясни, почему она подходит (укажи совпадающие пункты)
- Не возвращай вакансии, если совпадает только 1 пункт или нет совпадений
- Не придумывай вакансии, используй только из списка

Профиль пользователя:
{json.dumps(profile, ensure_ascii=False, indent=2)}

Список вакансий:
{json.dumps(jobs, ensure_ascii=False, indent=2)}

Ответ верни в формате JSON:
[
  {{
    "id": <id вакансии>,
    "reasons": ["Причина 1", "Причина 2", ...]
  }}, ...
]
"""
    try:
        response = client.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": "Ты помогаешь рекомендовать вакансии по профилю пользователя. Отвечай строго в формате JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=2000,
        )
        raw_text = response.choices[0].message.content
        print("📥 Ответ от Azure OpenAI (recommend):", raw_text)
        return json.loads(raw_text)
    except Exception as e:
        print("❌ Azure OpenAI API error (recommend):", e)
        raise HTTPException(status_code=500, detail="Ошибка при обращении к Azure OpenAI API (recommend)")

