FROM python:3.10-slim

WORKDIR /code

# Копируем requirements.txt и файл с Gemini логикой
COPY jobs_updater/requirements.txt .
COPY jobs_updater/extract_with_gemini.py .


# Устанавливаем зависимости
RUN pip install --upgrade pip && pip install -r requirements.txt

# Копируем остальной код проекта
COPY . .

# Запускаем update_jobs.py
CMD ["python", "jobs_updater/update_jobs.py"]
