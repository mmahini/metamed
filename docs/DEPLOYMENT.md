# Deployment

متامد is deployed across Render (backend) and Vercel (frontend). Both auto-deploy
from the `main` branch of `github.com/mmahini/metamed`.

## Live URLs

| | URL |
|---|---|
| App (frontend) | https://metamed-weld.vercel.app |
| API | https://metamed-backend.onrender.com |
| Django admin | https://metamed-backend.onrender.com/admin/ |
| Swagger UI | https://metamed-backend.onrender.com/api/docs/ |
| Health | https://metamed-backend.onrender.com/api/health/ |

## Backend — Render

- **Service**: `metamed-backend` (`srv-d8vfqam8bjmc7388k140`), region `frankfurt`, **free** plan, native Python runtime, `rootDir = backend`.
- **Auto-deploy**: on push to `main`.
- **Build command**:
  ```
  pip install -r requirements.txt
  python manage.py collectstatic --noinput
  python manage.py ensure_schema
  python manage.py migrate --noinput
  (python manage.py createsuperuser --noinput || true)
  ```
- **Start command**: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers 3`
- **Cold start**: free tier spins down when idle; first request after inactivity takes ~50s.
- **Important**: `requirements.txt` must **not** include `mysqlclient` (it can't build on
  Render's native Python env). The MySQL driver lives in `requirements-dev.txt` for local
  Docker only. Production uses Postgres via `psycopg2-binary`.

### Backend environment variables (set in Render dashboard)

| Key | Notes |
|-----|-------|
| `DJANGO_SETTINGS_MODULE` | `core.settings` |
| `DJANGO_DEBUG` | `0` |
| `DJANGO_SECRET_KEY` | generated secret |
| `DJANGO_ALLOWED_HOSTS` | `.onrender.com` |
| `DATABASE_URL` | shared soroush-mehr Postgres connection string |
| `DATABASE_SCHEMA` | `metamed` (table isolation via search_path) |
| `PYTHON_VERSION` | `3.12.6` |
| `RESEND_API_KEY` | Resend key (nemoapps.xyz domain) |
| `RESEND_FROM` | `متامد <noreply@nemoapps.xyz>` |
| `OTP_EXPOSE_DEV_CODE` | `0` (never expose codes in prod) |
| `CORS_ALLOWED_ORIGINS` | `https://metamed-weld.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | `https://metamed-weld.vercel.app` |
| `DJANGO_SUPERUSER_EMAIL` / `DJANGO_SUPERUSER_PASSWORD` | seeds the admin on build |

## Database — shared Postgres, isolated schema

metamed shares soroush-mehr's Render Postgres instance but keeps its tables in a
dedicated **`metamed`** schema. This is enforced by:

- `DATABASE_SCHEMA=metamed` → `settings.py` sets `OPTIONS["options"] = "-c search_path=metamed"`.
- `python manage.py ensure_schema` runs **before** migrate and issues
  `CREATE SCHEMA IF NOT EXISTS metamed`, so tables never land in `public` or
  soroush-mehr's schema.

To split metamed onto its own database later: provision a new Postgres, point
`DATABASE_URL` at it (optionally drop `DATABASE_SCHEMA`), redeploy. No code change.

## Frontend — Vercel

- **Project**: `metamed` (`prj_TpfFmupZ2nJUHW3eHnKsN2nZC1tm`), framework Vite, output `dist`.
- **Build env var**: `VITE_API_URL=https://metamed-backend.onrender.com` (production + preview).
  This is baked into the bundle at build time; `src/auth/api.ts` reads it.
- **SPA routing**: `frontend/vercel.json` rewrites non-asset paths to `/index.html`.
- **Redeploy from CLI** (the dir is linked via `frontend/.vercel/project.json`, gitignored):
  ```bash
  cd frontend
  vercel deploy --prod --yes --token=$VERCEL_TOKEN
  ```

## Credentials

All deploy secrets live in `.secrets/deploy.env` (gitignored) and
`.secrets/_deploy_state.json`. Source values originate from sibling projects:
Render/Vercel from `soroush-mehr/.secrets/`, Resend from `nemo/nemo-anki/.secrets/`.
**Never commit `.secrets/`.**

## Redeploy checklist

1. Merge to `main` → Render & Vercel auto-build.
2. If you changed env vars, update them in the respective dashboard (or via API) and
   trigger a redeploy on Render.
3. If the frontend domain changes, update `CORS_ALLOWED_ORIGINS` + `CSRF_TRUSTED_ORIGINS`
   on Render to match.

## Known limitations

- Render free tier: cold starts (~50s) and the shared free Postgres has modest
  storage/connection limits.
- No custom domain yet (uses `*.vercel.app` / `*.onrender.com`).
