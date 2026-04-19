FROM python:3.11-slim

WORKDIR /opt/backend

COPY requirements.txt requirements.txt
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x start.sh \
    && useradd -m -u 1000 appuser \
    && chown -R appuser /opt/backend

USER appuser

EXPOSE 8000
CMD ["./start.sh"]
