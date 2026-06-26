# متامد

**مرکز تجهیزات امانی مراقبتی درمانی** — Metamed

A national system for managing the lifecycle of medical & care equipment loans:
collecting, registering, lending to patients in need, repairing, and cycling back
into service. Persian (RTL) UI.

## Status

All 8 planned phases are complete and the app is **deployed and live**.

| | URL |
|---|---|
| App (frontend) | https://metamed-weld.vercel.app |
| API | https://metamed-backend.onrender.com |
| Django admin | https://metamed-backend.onrender.com/admin/ |
| API docs (Swagger) | https://metamed-backend.onrender.com/api/docs/ |

> The backend runs on Render's free tier and spins down when idle — the first
> request after inactivity can take ~50s (cold start), then it's fast.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Django 5.1 + Django REST Framework |
| Auth | Email OTP → JWT (simplejwt) |
| Frontend | React 18 + TypeScript + Vite (RTL/Persian, Vazirmatn) |
| Database (local) | MySQL 8.0 |
| Database (prod) | PostgreSQL (Render, schema-isolated) |
| Dev | Docker Compose |
| Backend hosting | Render |
| Frontend hosting | Vercel |
| Email | Resend (transactional OTP) |
| API docs | drf-spectacular (Swagger UI) |

## Quick Start (Docker Desktop)

> **Port note**: Docker Desktop on the dev machine occupies ports 8000 and 3306,
> so the compose file maps to host ports **8080** (backend) and **3307** (MySQL).

```bash
cp backend/.env.example backend/.env
docker compose up
```

| Service   | URL / port                          |
|-----------|-------------------------------------|
| Frontend  | http://localhost:5175                |
| Backend   | http://localhost:8080/api/health/   |
| MySQL     | localhost:3307  (user: metamed)     |

**Test OTP flow (dev mode returns the code in the response):**
```bash
curl -X POST http://localhost:8080/api/auth/request-otp \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com"}'
# → { "otp_id": "...", "dev_code": "12345", ... }
```
Use `dev_code` at http://localhost:5175/auth/verify to log in without email.

## Features by app

| App | Responsibility |
|-----|----------------|
| `accounts` | Email-OTP auth, 9-role users, JWT |
| `organization` | Organization → Branch → Unit hierarchy |
| `equipment` | Equipment (11 statuses, auto code `MM-XXXXXX`), suppliers, status history, transfers, inspections, bulk import, stats |
| `patients` | Patient records |
| `loans` | Equipment requests, borrowers, loan lifecycle, guarantees |
| `maintenance` | Damage reports, repair lifecycle, decommission |
| `community` | Donors, cash & equipment donations, volunteers |
| `dashboard` | Role-scoped KPIs, charts, recent activity |
| `reports` | CSV exports (equipment, loans, cash donations) |
| `notifications` | In-app notifications + manager auto-alerts |
| `search` | Global search across equipment / patients / donors |

## Docs

- [Master Plan & phase log](docs/PLAN.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [Deployment](docs/DEPLOYMENT.md)

## Development

```bash
docker compose up            # start full stack
docker compose down          # stop
make migrate                 # apply DB migrations
make makemigrations          # generate new migrations
make shell-backend           # Django shell
make shell-db                # mysql shell
make test-backend            # run Django tests
make createsuperuser         # create Django admin user

# frontend type-check
docker compose exec frontend npx tsc --noEmit
```

## Roles

`national_manager` · `branch_manager` · `unit_manager` · `reception` ·
`equipment` · `maintenance` · `community` · `supervisor` · `volunteer`

New OTP users default to `volunteer` (read-only). Promote via the Django admin
or `make shell-backend`.
