# متامد

**مرکز تجهیزات امانی مراقبتی درمانی**

A national network for managing medical and care equipment — collecting, lending to patients in need, repairing, and cycling back into service.

## Stack

- **Backend**: Django 5.1 + Django REST Framework + MySQL 8
- **Frontend**: React 18 + TypeScript + Vite (RTL/Persian)
- **Auth**: Email OTP → JWT
- **Deploy**: Render (backend + MySQL) · Vercel (frontend)

## Quick Start (Docker Desktop)

> **Port note**: Docker Desktop on the dev machine already occupies ports 8000 and 3306, so the compose file maps to host ports **8080** (backend) and **3307** (MySQL).

```bash
cp backend/.env.example backend/.env
docker compose up
```

| Service   | URL / port                          |
|-----------|-------------------------------------|
| Frontend  | http://localhost:5175                |
| Backend   | http://localhost:8080/api/health/   |
| MySQL     | localhost:3307  (user: metamed)     |

**Test OTP flow (dev mode returns code in response):**
```bash
curl -X POST http://localhost:8080/api/auth/request-otp \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com"}'
# → { "otp_id": "...", "dev_code": "12345", ... }
```

Use `dev_code` at http://localhost:5175/auth/verify to log in without email.

## Docs

- [Master Plan](docs/PLAN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Design System](docs/DESIGN_SYSTEM.md)

## Development

```bash
make up              # start full stack
make down            # stop
make migrate         # apply DB migrations
make makemigrations  # generate new migrations
make shell-backend   # bash into backend container
make shell-db        # mysql shell
make test-backend    # run Django tests
make createsuperuser # create Django admin user
```
