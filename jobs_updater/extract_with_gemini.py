import os
import re
import json
import logging
from dotenv import load_dotenv
import openai

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

client = openai.AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2024-02-15-preview",
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)
DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT")

def clean_fields(fields: dict) -> dict:
    bad_values = {"not specified", "n/a", "none", "null", "", "нет", "не указано", "-"}
    cleaned = {}
    for k, v in fields.items():
        if isinstance(v, str) and v.strip().lower() in bad_values:
            continue
        if k == "deadline" and v and not re.match(r"^\d{4}-\d{2}-\d{2}$", str(v)):
            continue
        cleaned[k] = v
    return cleaned

def extract_fields_from_text(text: str) -> dict:
    if not text:
        logger.warning("⚠️ Empty text provided to extract_fields_from_text")
        return {}

    prompt = f"""
You are an AI assistant that extracts structured information from job vacancy descriptions for an HR system.

**Instructions:**
- Отвечай только валидным JSON, без пояснений, markdown и прочего.
- Extract as many fields as possible from the list below and return them in JSON. If some fields are missing, just omit them.
- Do not return a field if you cannot find a real value.
- Do not write placeholder or garbage values ('string', 'none', 'null', '0', 'N/A', 'Not specified', '-', etc.).
- For deadline, only return if it is a real date in YYYY-MM-DD format.

**Fields to extract (include only if present):**
- salary: integer (only the number, no currency symbols or words)
- location: string (city or country)
- deadline: string (application deadline, in YYYY-MM-DD format if possible)
- format: string (online / offline / hybrid / remote)
- industry: string (e.g., IT, marketing, finance)
- contact_info: string (link, phone, or @username for contacting about the job)
- title: string (job title, if present)
- company: string (company name, if present)
- description: string (full job description, if present)

**Positive Example (vacancy):**
{{
  "title": "Backend Developer",
  "company": "Acme Corp",
  "salary": 150000,
  "location": "Moscow, Russia",
  "format": "online",
  "industry": "IT",
  "contact_info": "@acme_hr",
  "deadline": "2024-07-01",
  "description": "We are looking for a backend developer..."
}}

Job description:
{text}
"""

    try:
        logger.info("🤖 Sending request to Azure OpenAI...")
        response = client.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": "You extract job vacancy information in strict JSON format according to the given template."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=1200,
        )
        raw_text = response.choices[0].message.content.strip()
        try:
            result = json.loads(raw_text)
        except json.JSONDecodeError:
            # fallback: extract first {...} block
            json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if not json_match:
                logger.error("❌ No JSON found in OpenAI response")
                return {}
            json_str = json_match.group()
            result = json.loads(json_str)
        result = clean_fields(result)
        logger.info(f"✨ Successfully extracted fields: {result}")
        return result
    except json.JSONDecodeError as e:
        logger.error(f"❌ Failed to parse JSON from OpenAI response: {e}")
        return {}
    except Exception as e:
        logger.error(f"❌ Unexpected error in extract_fields_from_text: {e}")
        return {}
