# AI agent guide — متامد (Metamed)

Instructions for AI agents (Claude Code et al.) working on this repo. Read this
first, then `README.md` and `docs/DEPLOYMENT.md`.

## What this is

A national medical-equipment-loan management system. Django REST backend + React
(TypeScript/Vite) frontend, Persian **RTL** UI. All 8 build phases are complete and
the app is **deployed live** (see `docs/DEPLOYMENT.md`).

## Golden rules

1. **Never commit `.secrets/`.** It holds Render/Vercel/Resend keys and the admin
   password. It's gitignored — keep it that way. Don't print secret values in
   commit messages, PR bodies, or chat beyond what's strictly necessary.
2. **Work in branches, open a PR, merge to `main`.** Never push directly to `main`
   (it's also blocked by tooling). `main` auto-deploys to Render + Vercel.
3. **Verify before shipping.** Run the backend `manage.py check`, frontend
   `tsc --noEmit`, and a smoke test of any new endpoint against the running Docker
   stack before committing.
4. **Keep local (MySQL) and prod (Postgres) both working.** See "Database" below.
5. **Match existing style.** Persian labels on models/UI, the inline-style +
   design-token CSS approach on the frontend, DRF ViewSets + role permissions on
   the backend. Look at a sibling app/page before writing a new one.

## Local development

Docker Desktop on the dev machine occupies ports 8000 & 3306, so the stack maps to
**8080** (backend), **3307** (MySQL), **5175** (frontend).

```bash
cp backend/.env.example backend/.env   # first time
docker compose up                       # or: make up
```

- Frontend: http://localhost:5175
- API health: http://localhost:8080/api/health/
- Get a login code in dev: `POST /api/auth/request-otp` returns `dev_code`
  (because `OTP_EXPOSE_DEV_CODE=1` locally; it is `0` in prod).

Common commands:
```bash
docker compose exec backend python manage.py check
docker compose exec backend python manage.py makemigrations <app>
docker compose exec backend python manage.py migrate
docker compose exec frontend npx tsc --noEmit
```

**Container gotcha:** the Vite dev server can crash if files are written while it's
watching; if `tsc`/the frontend seems down, `docker compose up -d frontend` to
restart. The backend dev server can also crash on a transient mid-edit import; if
`/api/health/` fails, `docker compose restart backend`.

## Architecture

Backend apps live in `backend/apps/`:

| App | Responsibility |
|-----|----------------|
| `accounts` | Email-OTP auth, custom `User` (email login, 9-role `UserRole`), JWT, `permissions.py` |
| `organization` | Organization → Branch → Unit |
| `equipment` | Equipment (auto code `MM-XXXXXX`, 11 statuses), Supplier, StatusHistory, Transfer, Inspection; stats + bulk-import |
| `patients` | Patient |
| `loans` | EquipmentRequest, Borrower, Loan (lifecycle drives equipment status), Guarantee |
| `maintenance` | DamageReport, Maintenance (repair lifecycle + decommission) |
| `community` | Donor, CashDonation, EquipmentDonation, Volunteer |
| `dashboard` | `/api/dashboard/` role-scoped aggregation (no models) |
| `reports` | streaming CSV exports (no models) |
| `notifications` | Notification model + API; `signals.py` auto-alerts managers |
| `search` | `/api/search/?q=` across equipment/patients/donors (no models) |

Frontend in `frontend/src/`: `pages/` (one per feature, each fetches via
`auth/api.ts` `apiFetch`), `components/` (charts, `TopbarTools`), `auth/`
(`AuthContext`, `api.ts`). `Dashboard.tsx` is the app shell with the sidebar +
nested routes; add new pages there.

### Conventions that matter

- **Status lifecycles live on the model**, not in views. e.g. `Loan.deliver()`,
  `Maintenance.complete()` change the row *and* cascade `equipment.change_status(...)`.
  Mirror this when adding workflow models. Status changes go through
  `Equipment.change_status()` so `EquipmentStatusHistory` is always recorded.
- **Permissions** are DRF permission classes (see `apps/accounts/permissions.py`
  and the per-app `*StaffOrManager` classes). Reads: any authenticated user.
  Writes: manager roles + the relevant staff role. New write endpoints must set
  `permission_classes` — don't leave them open.
- **New OTP users default to `volunteer`** (read-only). Promote via Django admin or
  `make shell-backend`.
- **Migrations**: prefer `makemigrations` inside the backend container. Apps without
  models (`dashboard`, `reports`, `search`) intentionally have none.
- **Persian everywhere user-facing**: model `verbose_name`, `TextChoices` labels,
  UI strings. Numbers shown with `.toLocaleString('fa-IR')`.

## Database (read this before touching settings or migrations)

- **Local** = MySQL 8 (docker-compose). **Production** = PostgreSQL on Render.
- The driver is split: `requirements.txt` has `psycopg2-binary` only;
  `requirements-dev.txt` adds `mysqlclient` and is what the Dockerfile installs.
  **Do not add `mysqlclient` to `requirements.txt`** — it breaks the Render build.
- `settings.py` parses `DATABASE_URL` and supports both `mysql://` and
  `postgresql://`. In prod, `DATABASE_SCHEMA=metamed` isolates tables in a shared
  Postgres via `search_path`; `manage.py ensure_schema` creates the schema before
  migrate. Keep both code paths intact.
- All models must stay DB-agnostic (standard Django fields + `JSONField`). Don't use
  MySQL- or Postgres-only features.

## Deployment

Auto-deploys from `main`: Render (backend) + Vercel (frontend). Full details,
env-var list, and redeploy steps in `docs/DEPLOYMENT.md`. If you change the frontend
domain, update `CORS_ALLOWED_ORIGINS` + `CSRF_TRUSTED_ORIGINS` on Render.

## When you finish a unit of work

1. `tsc --noEmit` clean + backend `check` clean + smoke-test new endpoints.
2. Commit on a branch, open a PR, merge to `main`.
3. If you added an env var, document it in `docs/DEPLOYMENT.md` and set it on Render/Vercel.
4. Update `README.md` / `docs/PLAN.md` if scope changed.
