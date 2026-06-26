# متامد — Master Plan

**مرکز تجهیزات امانی مراقبتی درمانی**

A national network for managing the lifecycle of medical and care equipment — collecting, registering, lending to patients in need, repairing, and recycling back into service.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Django 5.1 + Django REST Framework |
| Database | MySQL 8.0 |
| Auth | Email OTP → JWT (simplejwt) |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Plain CSS, custom properties, RTL |
| Dev | Docker Compose |
| Backend hosting | Render (web service + MySQL) |
| Frontend hosting | Vercel |
| Email | Resend (transactional OTP) |

> **MySQL on Render**: The free tier only includes PostgreSQL. MySQL starts at **$7/month** (Starter plan). As an alternative, [Aiven](https://aiven.io) offers a free MySQL tier. The codebase uses `DATABASE_URL` so the engine can be swapped by changing the URL scheme.

---

## Roles

| Key | Persian |
|-----|---------|
| `national_manager` | مدیر کل متامد |
| `branch_manager` | مدیر شعبه |
| `unit_manager` | مسئول واحد |
| `reception` | کارشناس پذیرش |
| `equipment` | کارشناس تجهیزات |
| `maintenance` | کارشناس تعمیر و نگهداری |
| `community` | کارشناس مشارکت‌های مردمی |
| `supervisor` | ناظر |
| `volunteer` | داوطلب |

---

## Equipment Statuses

| Status | Description |
|--------|-------------|
| `ready` | آماده خدمت |
| `reserved` | رزرو شده |
| `on_loan` | امانت داده شده |
| `in_transfer` | در حال انتقال |
| `needs_review` | نیازمند بررسی |
| `needs_disinfection` | نیازمند ضدعفونی |
| `under_repair` | در حال تعمیر |
| `awaiting_parts` | در انتظار قطعه |
| `decommissioned` | خارج از خدمت |
| `scrapped` | اسقاط شده |
| `lost` | مفقود شده |

---

## Equipment Categories

| Key | Persian |
|-----|---------|
| `mobility` | تجهیزات حرکتی (ویلچر، واکر، عصا…) |
| `respiratory` | تجهیزات تنفسی (اکسیژن‌ساز، نبولایزر…) |
| `bed_care` | تجهیزات بستری (تخت، تشک مواج…) |
| `rehabilitation` | تجهیزات توانبخشی |
| `monitoring` | تجهیزات پایش و مراقبت |
| `other` | سایر |

---

## Phases

### Phase 1 — Foundation ✅ (branch: `phase/1-foundation`)
- Project scaffold (mirrors soroush-mehr architecture)
- Django + MySQL, settings, health endpoint
- Email OTP auth: User model with roles, EmailOTP, rate-limited views, Resend email
- Design system: tokens from logo (royal blue + teal green), Vazirmatn font, RTL
- Landing page (Persian)
- Login flow: email → OTP → JWT → dashboard
- Basic dashboard stub (role-aware header + nav placeholder)
- Docker Compose (MySQL 8), Makefile, render.yaml, vercel.json
- `.secrets/` template

---

### Phase 2 — Org Structure & Core Models (branch: `phase/2-models`)
- `Organization` — top-level Metamed entity
- `Branch` — city-level (شعب شهرستانی)
- `Unit` — service unit (واحدهای خدمت‌رسان), linked to Branch
- `EquipmentCategory`, `EquipmentOwner`, `Supplier`
- `Equipment` with full status lifecycle, serial number, unique code
- `EquipmentStatusHistory` — every status change logged
- `Patient` — basic profile + need description
- Assign users to branches/units; enforce role permissions via `IsUnitStaff`, `IsBranchManager`, etc.
- Django admin configuration for all models
- Frontend: Org structure pages (units list, branch detail) — admin only

---

### Phase 3 — Equipment Management (branch: `phase/3-equipment`)
- Equipment CRUD (register, list, filter, detail)
- Equipment inspection form (`EquipmentInspection`)
- Equipment transfer between units/branches (`EquipmentTransfer`)
- Bulk import via CSV
- Equipment inventory view per unit
- Status dashboard: counts per status, per category
- Frontend: Equipment list + filters, Equipment detail page, status badge component

---

### Phase 4 — Service Operations: Patients & Loans (branch: `phase/4-loans`)
- `EquipmentRequest` — patient requests specific equipment type
- `Borrower` — person who physically receives the equipment (may differ from patient)
- `Referrer` — who referred the patient (doctor, hospital, NGO)
- `Loan` — tying equipment → patient → unit, with delivery + return dates
- `Guarantee` — تعهدنامه / ضامن / سفته / چک per loan
- Loan lifecycle: assigned → delivered → returned → disinfected → ready
- Loan extension workflow
- Priority queue when equipment scarce
- Frontend: New request wizard, pending requests list, active loans table, return form

---

### Phase 5 — Maintenance & Quality (branch: `phase/5-maintenance`)
- `DamageReport` — reported damage on return
- `Maintenance` — repair record with technician, cost, dates
- `EquipmentInspection` — pre-loan / post-return checklist
- Maintenance queue dashboard
- Parts awaiting state + supplier contact
- Decommission workflow with reason
- Frontend: Maintenance queue, damage report form, inspection checklist

---

### Phase 6 — Donations & Community (branch: `phase/6-donations`)
- `Donor` — خیرین (individuals + organizations)
- `EquipmentDonation` — donated equipment with ownership tracking
- `CashDonation` — نقدی / دیجیتال
- `Volunteer` — داوطلبان with availability and skills
- Donor acknowledgment + impact report (how many patients served)
- Public-facing donation intake form
- Frontend: Donor list, donation history, volunteer management

---

### Phase 7 — Role-Based Dashboards (branch: `phase/7-dashboards`)
Four dashboard views matching the provided mockups:

1. **National Executive** (`national_manager`) — full network KPIs, Iran map, 12-month trend charts, strategic alerts
2. **Operations Center** (`branch_manager` at HQ) — inter-branch transfers, pending requests, recent activities
3. **Branch Manager** — branch-level KPIs, unit performance table, monthly trends
4. **Unit Manager** — daily ops: active loans, pending requests, near-due returns, quick actions

Charts library: Recharts  
Map: SVG-based Iran province map  
Metrics: all KPIs from the proposal's Chapter 12

---

### Phase 8 — Reports & Advanced (branch: `phase/8-reports`)
- Export to Excel / PDF
- Strategic KPIs from Chapter 7 of executive annex
- Notification system (in-app + email)
- Activity log viewer for supervisors
- Full-text search across patients / equipment
- Advanced filters + saved filter presets
- Public impact statistics page
- API documentation (drf-spectacular / Swagger)

---

## Deployment

```
Frontend  → Vercel (auto-deploy on push to main)
Backend   → Render web service (free tier)
Database  → Render MySQL ($7/mo) or Aiven MySQL (free)
Email     → Resend (transactional OTP)
Media     → Cloudflare R2 (Phase 3+)
```

### Environment Variables (production)
```
# Backend (Render)
DJANGO_SECRET_KEY=...
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=metamed-backend.onrender.com
CORS_ALLOWED_ORIGINS=https://metamed.vercel.app
DATABASE_URL=mysql://user:pass@host:3306/metamed
RESEND_API_KEY=...
RESEND_FROM=متامد <noreply@metamed.ir>

# Frontend (Vercel)
VITE_API_URL=https://metamed-backend.onrender.com
```
