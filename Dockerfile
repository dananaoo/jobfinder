FROM python:3.10-slim

WORKDIR /code

COPY requirements.txt .

# ⚡ Быстрее, без --no-cache-dir
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
