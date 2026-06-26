# متامد

**مرکز تجهیزات امانی مراقبتی درمانی**

A national network for managing medical and care equipment — collecting, lending to patients in need, repairing, and cycling back into service.

## Stack

- **Backend**: Django 5.1 + Django REST Framework + MySQL 8
- **Frontend**: React 18 + TypeScript + Vite (RTL/Persian)
- **Auth**: Email OTP → JWT
- **Deploy**: Render (backend + MySQL) · Vercel (frontend)

## Quick Start

```bash
cp .env.example .env
make up
```

Then open [http://localhost:5175](http://localhost:5175).

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
make test            # run Django tests
make typecheck       # frontend TypeScript check
```
