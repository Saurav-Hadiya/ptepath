# PTEPath — Design & Theming Reference

## Overview

This document defines the complete visual design system for PTEPath.
All developers must reference only these tokens — no hardcoded color or font values anywhere.
Changing any token here updates the entire platform automatically.

---

## Color System

### Primary Colors

| Name | Hex | Usage |
|---|---|---|
| Navy | `#0F1B4C` | Sidebar, navbar, banners, hero backgrounds |
| Blue | `#2563EB` | Primary buttons, active states, links, progress bars |
| Blue Light | `#3B82F6` | Button hover states, secondary highlights |
| Blue Pale | `#EFF6FF` | Info backgrounds, selected state backgrounds |

### Accent Color

| Name | Hex | Usage |
|---|---|---|
| Amber | `#F59E0B` | Logo accent, score badges, important callouts |
| Amber Pale | `#FFFBEB` | Warning backgrounds, caution message areas |

### Neutral Colors

| Name | Hex | Usage |
|---|---|---|
| White | `#FFFFFF` | Card backgrounds, modal backgrounds |
| Off White | `#F8FAFF` | Page background, input fields, alternate rows |
| Border Gray | `#E2E8F0` | Card borders, dividers, input borders |
| Slate | `#64748B` | Body text, descriptions, secondary labels |
| Dark | `#1E293B` | Primary headings, important text |
| Muted | `#94A3B8` | Placeholder text, disabled labels |

### Semantic Colors

| Name | Hex | Usage |
|---|---|---|
| Success Green | `#10B981` | Correct answers, high scores (80–90), success messages |
| Success Bg | `#ECFDF5` | Correct answer highlight background |
| Error Red | `#EF4444` | Wrong answers, low scores (0–49), error messages |
| Error Bg | `#FEF2F2` | Wrong answer highlight background |
| Warning Amber | `#F59E0B` | Partial scores (50–79), caution states — reuses accent |
| Warning Bg | `#FFFBEB` | Missed answer highlight background |

### Module Identity Colors

Used only as thin card top borders or small icon backgrounds — never as dominant fills.

| Module | Hex | Usage |
|---|---|---|
| Speaking | `#2563EB` | Speaking card accent, icon tint |
| Writing | `#7C3AED` | Writing card accent, icon tint |
| Reading | `#059669` | Reading card accent, icon tint |
| Listening | `#DC2626` | Listening card accent, icon tint |

---

## Score Color Logic

Scores are displayed out of 90 following the real PTE scale.
Score number and bar color change based on range.

| Score Range | Color | Hex | Meaning |
|---|---|---|---|
| 80 – 90 | Green | `#10B981` | High — Excellent |
| 50 – 79 | Amber | `#F59E0B` | Mid — Needs improvement |
| 0 – 49 | Red | `#EF4444` | Low — Significant work needed |

Applies to: individual question scores, module scores, overall mock test score.

---

## Answer Highlight States

Four states used consistently after every submission across all modules.

| State | Background | Border | Text Color | When Used |
|---|---|---|---|---|
| Correct — Selected | `#ECFDF5` | `#10B981` | `#065F46` | Student selected + was correct |
| Wrong — Selected | `#FEF2F2` | `#EF4444` | `#991B1B` | Student selected + was wrong |
| Missed — Not Selected | `#FFFBEB` | `#F59E0B` | `#92400E` | Student did not select but was correct |
| Neutral | `#F8FAFF` | `#E2E8F0` | `#1E293B` | Student did not select + was wrong (no action) |

---

## Typography

### Font Families

| Role | Font | Weights | Import |
|---|---|---|---|
| Display / Headings | Outfit | 700, 800, 900 | Google Fonts |
| Body / UI text | Inter | 400, 500, 600 | Google Fonts |
| Numbers / Scores | Outfit | 700, 800 | Same as display |
| Code / Monospace | Courier New | 400 | System font |

### Google Fonts Import
Add to `_document.tsx` or `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

### Type Scale

| Element | Font | Size | Weight | Color |
|---|---|---|---|---|
| Page Title (H1) | Outfit | 2.5rem – 3.5rem | 800 | `#0F1B4C` Navy |
| Section Heading (H2) | Outfit | 1.75rem – 2rem | 700 | `#0F1B4C` Navy |
| Card Title (H3) | Outfit | 1.1rem – 1.25rem | 700 | `#1E293B` Dark |
| Body Text | Inter | 0.9rem – 1rem | 400 | `#64748B` Slate |
| Label / Caption | Inter | 0.75rem – 0.85rem | 600 | `#64748B` Slate |
| Score Number | Outfit | 2rem – 4rem | 800 | Score color logic |
| Button Text | Inter | 0.9rem – 1rem | 600 | `#FFFFFF` White |
| Input Text | Inter | 0.95rem | 400 | `#1E293B` Dark |

---

## Spacing & Shape

### Border Radius

| Element | Radius |
|---|---|
| Cards | 12px |
| Buttons | 8px |
| Input fields | 8px |
| Badges / Tags | 100px (pill) |
| Small chips | 6px |
| Modal / Dialog | 16px |

### Shadows

| Name | Value | When Used |
|---|---|---|
| Card default | `0 2px 8px rgba(15,27,76,0.07)` | All cards at rest |
| Card hover | `0 8px 24px rgba(15,27,76,0.12)` | Cards on hover/focus |
| Modal | `0 20px 60px rgba(15,27,76,0.18)` | Modals and drawers |
| Button primary | `0 4px 12px rgba(37,99,235,0.35)` | Primary buttons only |

### Layout Spacing

| Area | Value |
|---|---|
| Page horizontal padding | 5% both sides |
| Section vertical padding | 64px top and bottom |
| Card padding | 28px – 36px |
| Sidebar width | 260px fixed |
| Gap between cards | 20px – 24px |
| Gap between form fields | 16px – 20px |

---

## CSS Variables — Complete Token Set

Add this to your global CSS file (`globals.css` or equivalent).
All components reference these variables — never hardcode hex values.

```css
:root {
  /* ── Brand ───────────────────────────────── */
  --brand-primary:        #0F1B4C;
  --brand-accent:         #F59E0B;

  /* ── Action ──────────────────────────────── */
  --action-default:       #2563EB;
  --action-hover:         #3B82F6;
  --action-subtle:        #EFF6FF;

  /* ── Background ──────────────────────────── */
  --bg-page:              #F8FAFF;
  --bg-card:              #FFFFFF;
  --bg-accent:            #FFFBEB;

  /* ── Text ────────────────────────────────── */
  --text-primary:         #1E293B;
  --text-secondary:       #64748B;
  --text-muted:           #94A3B8;

  /* ── Border ──────────────────────────────── */
  --border-default:       #E2E8F0;

  /* ── Feedback ────────────────────────────── */
  --feedback-success:     #10B981;
  --feedback-success-bg:  #ECFDF5;
  --feedback-error:       #EF4444;
  --feedback-error-bg:    #FEF2F2;
  --feedback-warning:     #F59E0B;
  --feedback-warning-bg:  #FFFBEB;

  /* ── Module Identity ─────────────────────── */
  --module-speaking:      #2563EB;
  --module-writing:       #7C3AED;
  --module-reading:       #059669;
  --module-listening:     #DC2626;

  /* ── Shape & Shadow ──────────────────────── */
  --radius-card:          12px;
  --radius-button:        8px;
  --radius-input:         8px;
  --radius-pill:          100px;
  --radius-modal:         16px;
  --shadow-card:          0 2px 8px rgba(15,27,76,0.07);
  --shadow-hover:         0 8px 24px rgba(15,27,76,0.12);
  --shadow-modal:         0 20px 60px rgba(15,27,76,0.18);
  --shadow-button:        0 4px 12px rgba(37,99,235,0.35);
}
```

## CSS Variable Name Reference

| Semantic Name | Hex Value | Old Name (reference only) |
|---|---|---|
| --brand-primary | #0F1B4C | was --color-navy |
| --brand-accent | #F59E0B | was --color-amber |
| --action-default | #2563EB | was --color-blue |
| --action-hover | #3B82F6 | was --color-blue-light |
| --action-subtle | #EFF6FF | was --color-blue-pale |
| --bg-page | #F8FAFF | was --color-off-white |
| --bg-card | #FFFFFF | was --color-white |
| --bg-accent | #FFFBEB | was --color-amber-pale |
| --text-primary | #1E293B | was --color-dark |
| --text-secondary | #64748B | was --color-slate |
| --text-muted | #94A3B8 | was --color-muted |
| --border-default | #E2E8F0 | was --color-border |
| --feedback-success | #10B981 | was --color-success |
| --feedback-success-bg | #ECFDF5 | was --color-success-bg |
| --feedback-error | #EF4444 | was --color-error |
| --feedback-error-bg | #FEF2F2 | was --color-error-bg |
| --feedback-warning | #F59E0B | was --color-warning |
| --feedback-warning-bg | #FFFBEB | was --color-warning-bg |
| --module-speaking | #2563EB | was --color-speaking |
| --module-writing | #7C3AED | was --color-writing |
| --module-reading | #059669 | was --color-reading |
| --module-listening | #DC2626 | was --color-listening |

---

## Developer Rules

### Always
- Use CSS variables for every color, font, radius, and shadow value
- Use Outfit for all headings, numbers, and score displays
- Use Inter for all body text, labels, buttons, and inputs
- Show scores in green/amber/red based on score range logic
- Use the four answer highlight states consistently after every submission

### Never
- Hardcode a hex color value in any component file
- Use a font family not defined in this document
- Use module identity colors as full backgrounds — top borders and icon tints only
- Show scores out of anything other than 90
- Mix semantic colors — success green is only for correct/high score states

### Mode
Light mode only.
Navy is reserved for sidebar, navbar, and banner sections only.
All content areas use white (`#FFFFFF`) or off-white (`#F8FAFF`) backgrounds.