# Pingly

Self-hosted мониторинг доступности сайтов с публичной страницей статуса.

Пингует URL-адреса по расписанию, фиксирует историю за 90 дней и отправляет Telegram-алерт при смене статуса — как Stripe Status или GitHub Status, только у вас на сервере.

![Stack](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square) ![Stack](https://img.shields.io/badge/React-18-61DAFB?style=flat-square) ![Stack](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square) ![Stack](https://img.shields.io/badge/Docker-compose-2496ED?style=flat-square)

## Быстрый старт

**1. Клонируй репозиторий**

```bash
git clone https://github.com/MAleksandr89/Pingly.git
cd Pingly
```

**2. Создай `.env`**

```bash
cp .env.example .env
```

Заполни обязательные поля:

```env
POSTGRES_PASSWORD=придумай-пароль
DATABASE_URL=postgresql+asyncpg://pingly:придумай-пароль@postgres:5432/pingly
SECRET_KEY=                        # openssl rand -hex 32
```

Опционально — Telegram-алерты:

```env
TELEGRAM_BOT_TOKEN=токен от @BotFather
TELEGRAM_CHAT_ID=твой chat_id
```

**3. Запусти**

```bash
docker compose up -d
docker compose exec api alembic upgrade head
```

**4. Зарегистрируйся и добавь первый монитор**

- Dashboard → http://localhost:5173
- Публичная страница статуса → http://localhost:5173/status
- API docs → http://localhost:8000/docs

## Production (с Traefik + HTTPS)

Требует запущенного [Traefik](https://github.com/MAleksandr89) и внешней сети `proxy_network`.

```bash
# Заполни в .env: DOMAIN, ACME_EMAIL
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api alembic upgrade head
```

## Стек

| Слой | Технология |
|------|-----------|
| Backend | FastAPI + SQLAlchemy async + Alembic |
| Frontend | React 18 + Vite + TanStack Query |
| База данных | PostgreSQL 16 |
| Очередь | Celery + Redis |
| Инфраструктура | Docker Compose + Traefik |
