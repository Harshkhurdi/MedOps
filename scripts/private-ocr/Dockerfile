FROM python:3.13-slim
RUN apt-get update && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-eng tesseract-ocr-hin poppler-utils && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY worker.py /app/worker.py
RUN useradd --uid 10001 --no-create-home ocr
USER 10001
ENV OCR_BIND=0.0.0.0
EXPOSE 8787
CMD ["python", "/app/worker.py"]
