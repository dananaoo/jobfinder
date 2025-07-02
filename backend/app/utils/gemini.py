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
Ты — AI-эксперт по подбору вакансий. Тебе дан ПОЛНЫЙ профиль пользователя (резюме + предпочтения) и список вакансий. Твоя задача — провести глубокий анализ совместимости и отсортировать вакансии по релевантности.

АНАЛИЗИРУЙ ВСЮ ИНФОРМАЦИЮ О ПОЛЬЗОВАТЕЛЕ:

**ОПЫТ И НАВЫКИ (высокий вес):**
- skills: технические навыки, языки программирования, инструменты
- experience: опыт работы, проекты, достижения
- experience_level: уровень (junior/middle/senior)
- education: образование, степень, университет
- achievements: сертификаты, награды, достижения

**ЖЕЛАНИЯ И ПРЕДПОЧТЕНИЯ (высокий вес):**
- desired_position: желаемая должность
- desired_city: желаемый город
- desired_format: формат работы (онлайн/офлайн/гибрид)
- desired_work_time: график (full-time/part-time)
- desired_salary: зарплатные ожидания
- industries: желаемые индустрии

**ЛИЧНАЯ ИНФОРМАЦИЯ (низкий вес):**
- languages: знание языков
- interests: интересы и хобби

КРИТЕРИИ ОЦЕНКИ СОВМЕСТИМОСТИ:

🎯 **ИДЕАЛЬНОЕ СОВПАДЕНИЕ (score: 5):**
- Навыки пользователя ↔ требования вакансии (80%+ совпадение)
- Опыт работы релевантен направлению вакансии
- Желаемая должность = название вакансии или очень близко
- Уровень опыта соответствует требованиям
- Город/формат/график совпадают

⭐ **ОТЛИЧНОЕ СОВПАДЕНИЕ (score: 4):**
- Навыки совпадают на 60-80%
- Опыт частично релевантен
- Должность в той же сфере
- Уровень опыта подходит (±1 уровень)
- 2+ совпадения по предпочтениям

✅ **ХОРОШЕЕ СОВПАДЕНИЕ (score: 3):**
- Навыки совпадают на 40-60%
- Есть релевантный опыт или образование
- Должность в смежной сфере
- 1-2 совпадения по предпочтениям

🤔 **ВОЗМОЖНОЕ СОВПАДЕНИЕ (score: 2):**
- Некоторые навыки совпадают (20-40%)
- Опыт переносимый или образование релевантно
- Хотя бы 1 важное совпадение

❌ **СЛАБОЕ СОВПАДЕНИЕ (score: 1):**
- Минимальные совпадения по навыкам (<20%)
- Только географические или форматные совпадения

ИНСТРУКЦИИ:
- Анализируй ВСЕ поля профиля, не только desired_*
- Учитывай синонимы и смежные технологии (React ≈ JavaScript, Python ≈ Django)
- Сравнивай уровень опыта с требованиями вакансии
- Возвращай ВСЕ вакансии с score ≥ 1
- Сортируй строго по убыванию score
- Для каждой вакансии дай КОНКРЕТНЫЕ объяснения совпадений

Профиль пользователя:
{json.dumps(profile, ensure_ascii=False, indent=2)}

Список вакансий:
{json.dumps(jobs, ensure_ascii=False, indent=2)}

Ответ верни в формате JSON (отсортированный по score от 5 до 1):
[
  {{
    "id": <id вакансии>,
    "match_score": <число от 1 до 5>,
    "reasons": [
      "Навыки: совпадают Python, Django (из skills)",
      "Опыт: 3 года backend разработки (из experience)", 
      "Должность: ищет Backend Developer, вакансия Python Developer",
      "Город: желает Алматы, вакансия в Алматы",
      "Уровень: middle опыт подходит под требования"
    ]
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

