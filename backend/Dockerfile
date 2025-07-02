FROM python:3.10-slim

WORKDIR /code

# Обновляем pip
RUN pip install --upgrade pip

# Устанавливаем PyMuPDF отдельно (с бинарником)
RUN pip install pymupdf==1.22.3

# Теперь устанавливаем остальные зависимости
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
