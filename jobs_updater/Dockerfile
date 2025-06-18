FROM python:3.10-slim

WORKDIR /code

COPY jobs_updater/requirements.txt .

RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .
