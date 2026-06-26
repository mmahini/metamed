# متامد — Design System

Based on the متامد logo: **royal blue** (brand color) + **teal green** (accent leaf).

---

## Color Palette

### Primary — Royal Blue
Extracted from the logo's dominant color.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#1B52C4` | Buttons, links, active states |
| `--color-primary-dark` | `#0F3A8A` | Hover states, dark header |
| `--color-primary-deeper` | `#0A2660` | Footer, nav backgrounds |
| `--color-primary-light` | `#D6E4FA` | Selected backgrounds |
| `--color-primary-subtle` | `#EBF1FD` | Card backgrounds, chips |

### Accent — Teal Green
Extracted from the logo's leaf accent.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent` | `#2EBF8F` | Success, positive KPIs, highlights |
| `--color-accent-dark` | `#1E8F68` | Hover on accent |
| `--color-accent-light` | `#E6F9F3` | Success backgrounds |

### Semantic

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#10B981` | Positive, available |
| `--color-warning` | `#F59E0B` | Attention, near-due |
| `--color-error` | `#EF4444` | Errors, critical alerts |
| `--color-info` | `#3B82F6` | Info banners |

### Neutrals

| Token | Value | Usage |
|-------|-------|-------|
| `--color-text` | `#1A2545` | Body text |
| `--color-text-muted` | `#64748B` | Secondary text, labels |
| `--color-text-light` | `#94A3B8` | Placeholders, disabled |
| `--color-surface` | `#FFFFFF` | Card surfaces |
| `--color-bg` | `#F5F8FD` | Page background |
| `--color-bg-alt` | `#EBF0F8` | Alternate rows, sections |
| `--color-border` | `#D1DEEF` | Borders, dividers |
| `--color-border-strong` | `#B0C4DE` | Stronger borders |

---

## Typography

**Font**: [Vazirmatn](https://github.com/rastikerdar/vazirmatn) — the standard open-source Persian/Latin font.

```
--font-family-base: 'Vazirmatn', Tahoma, Arial, sans-serif;
```

| Scale | Size | Weight | Usage |
|-------|------|--------|-------|
| `--text-xs` | 11px | 400 | Captions, badges |
| `--text-sm` | 13px | 400 | Labels, helper text |
| `--text-base` | 15px | 400 | Body text |
| `--text-md` | 17px | 500 | Sub-headings |
| `--text-lg` | 20px | 600 | Card titles |
| `--text-xl` | 24px | 700 | Page headings |
| `--text-2xl` | 30px | 700 | KPI numbers |
| `--text-3xl` | 38px | 800 | Hero headings |

---

## Spacing Scale

```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

---

## Border Radius

```
--radius-sm:  6px
--radius-md:  10px
--radius-lg:  16px
--radius-xl:  24px
--radius-full: 9999px
```

---

## Shadows

```
--shadow-sm:  0 1px 3px rgba(27,82,196,.08);
--shadow-md:  0 4px 16px rgba(27,82,196,.12);
--shadow-lg:  0 8px 32px rgba(27,82,196,.16);
```

---

## Components

### KPI Card
- Background: white
- Border: 1px `--color-border`
- Radius: `--radius-lg`
- Shadow: `--shadow-sm`
- Icon: colored circle (category color)
- Value: `--text-2xl`, `--color-text`
- Trend badge: green (up) / red (down)

### Status Badge
| Status | Color |
|--------|-------|
| آماده خدمت | accent green |
| در حال استفاده / امانت | primary blue |
| نیازمند بررسی | warning amber |
| در حال تعمیر | warning |
| خارج از خدمت | error red |
| رزرو شده | info blue |

### Navigation (Sidebar)
- Width: 260px
- Background: `--color-primary-deeper` (#0A2660)
- Active item: `--color-primary` with left border accent
- Text: white / rgba(255,255,255,0.7)
- Logo area: white logo on deep blue

### Button

| Variant | Background | Text |
|---------|-----------|------|
| primary | `--color-primary` | white |
| accent | `--color-accent` | white |
| outline | transparent | `--color-primary`, border |
| ghost | transparent | `--color-primary` |
| danger | `--color-error` | white |

---

## RTL Notes

- `dir="rtl"` on `<html>`
- Use logical CSS properties: `margin-inline-start` vs `margin-right`
- Icons: phone numbers / codes use `dir="ltr"` 
- Sidebar: on the right side in RTL
- Number formatting: use `toLocaleString('fa-IR')` for Persian digits in KPIs
