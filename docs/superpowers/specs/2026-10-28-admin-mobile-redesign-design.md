# Admin mobile redesign

## Intent

Make the LA MELANINA admin easier to scan and operate on a phone, while giving the desktop view a clearer hierarchy. Make the revenue chart useful at a glance and interactive when the administrator wants detail.

## Goals

- Show appointment information and its common actions without horizontal scrolling on mobile.
- Keep all six admin areas reachable while making mobile navigation readable and easy to tap.
- Put today's appointments before the revenue chart on narrow screens.
- Make appointment editing, completion, and cancellation easy to distinguish.
- Replace the basic SVG chart with a responsive chart that has readable currency ticks, a date/value tooltip, and a clear month total.
- Improve spacing, typography, contrast, and touch targets across the existing admin screens.

## Non-goals and anti-goals

- Do not change booking rules, Supabase data, payment calculations, or appointment status semantics.
- Do not remove any current admin section or action.
- Avoid adding a charting dependency; Recharts is already in `package.json`.
- Avoid decorative motion, tiny type, and horizontal scrolling as the primary way to use mobile screens.

## Constraints

- The admin currently lives in `src/admin/Admin.tsx` and `src/admin/admin.css`.
- The current navigation has six sections; mobile must preserve access to all of them.
- Existing data is already loaded for appointments and payments, so chart improvements must derive from that data without new backend calls.
- Preserve the existing visual identity: warm cream surfaces, brown/rose accents, and restrained borders.
- Keep dialog keyboard behavior and current data operations intact.

## Approaches

1. **CSS-only responsive cleanup:** enlarge controls and tune breakpoints. This is low effort, but leaves the wide appointment table and dense edit dialog as the core mobile experience.
2. **Mobile-first admin refresh (selected):** use appointment cards on mobile, a four-item bottom navigation with a “Mais” menu for Financeiro/Serviços/Configurações, and a full-height mobile appointment editor with the appointment summary and primary actions prominent. Reorder the home screen so the day agenda appears before the chart on small screens. Keep the six-section sidebar on desktop.
3. **Full component and workflow rewrite:** rebuild every admin section and dialog around new components. This could produce a wider redesign, but adds unnecessary behavior risk for this request.

The selected approach targets the specific mobile pain points and the chart while preserving the existing information architecture, backend, and data behavior.

## Design details

- **Navigation:** desktop retains all six labeled destinations. Mobile shows Início, Agenda, Clientes, and Mais with touch areas at least 44px high; Mais opens Financeiro, Serviços, and Configurações. Keep logout accessible there.
- **Overview:** at mobile widths, show the day agenda before the chart. Keep the month selector available and summarize received amount above the chart.
- **Agenda:** use the current table on desktop. On mobile, render each appointment as a card with name, service, date/time, status, amount/received, and a clear open-details action. Reflow search, status, date, and export controls without clipping.
- **Appointment details:** on mobile, use a full-height dialog. Lead with client, service, status, and date. Make Save, Complete, and Cancel clearly visible; place editable contact/date/notes fields in a distinct section and payment/history in separate sections. Preserve confirmation before completion or cancellation.
- **Chart:** use the existing Recharts package for a responsive area or bar chart of payments by payment date. Provide currency axis labels, an accessible chart label, a tooltip with date and amount, a month total, and an empty state. Do not imply revenue based on appointment date; payments remain grouped by payment date.
- **Other screens:** keep clients/services/settings/finance content and actions, with single-column layouts, larger controls, and no clipped content on phones.
- **Accessibility:** retain visible focus, labels, keyboard access, readable contrast, and reduced-motion support.

## Open implementation choices

- The builder may choose the exact Recharts presentation (area or bars) based on the current chart data and available width, while keeping the date/value tooltip, currency axis, and month total.
- The builder may extract focused subcomponents from `Admin.tsx` where that makes the mobile and desktop render paths clearer without changing their behavior.
