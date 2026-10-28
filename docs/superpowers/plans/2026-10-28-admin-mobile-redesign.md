# Admin Mobile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the LA MELANINA admin easier to use on phones and improve the revenue chart while preserving current admin operations.

**Architecture:** Keep existing data loading and mutations in `Admin.tsx` and `store.ts`. Add responsive render paths and focused UI components in the admin, with mobile-only presentation changes in `admin.css`. Use the already-installed Recharts package for the revenue chart.

**Tech Stack:** React 19, TypeScript, Recharts, Lucide, existing admin CSS.

**Spec:** `docs/superpowers/specs/2026-10-28-admin-mobile-redesign-design.md`

## Global Constraints

- Do not change booking rules, Supabase data, payment calculations, or appointment status semantics.
- Do not remove any current admin section or action.
- Do not add a charting dependency; Recharts is already in `package.json`.
- Preserve the warm cream surfaces, brown/rose accents, and restrained borders.
- Keep dialog keyboard behavior and current data operations intact.

## Review Focus

- Six admin areas remain reachable from desktop and mobile navigation.
- Mobile appointment rows expose the same information and open the same appointment detail action.
- Appointment completion and cancellation still require the current confirmation step.
- Chart totals remain based on payment date and use all visible payment records for the selected month.
- Empty months and small widths render without clipped labels or horizontal scrolling.

---

### Task 1: Responsive admin shell and navigation

**Files:**
- Modify: `src/admin/Admin.tsx`
- Modify: `src/admin/admin.css`

**Interfaces:**
- Consumes: existing `Section`, `navigation`, `switchSection` state and callbacks.
- Produces: desktop navigation with six labeled items; mobile navigation with Início, Agenda, Clientes, and Mais. Mais provides Financeiro, Serviços, Configurações, and Sair.

- [x] Keep the existing desktop sidebar and all six labels visible at desktop widths.
- [x] Add the four-item mobile bottom navigation; make Mais open a compact menu for the remaining sections and logout.
- [x] Set touch targets to at least 44px and add clear focus/selected states.
- [x] Reflow the top bar, page heading, period selector, and page padding at narrow widths.
- [x] Review desktop/tablet/mobile widths for overflow and section reachability.

### Task 2: Mobile appointment cards and filters

**Files:**
- Modify: `src/admin/Admin.tsx`
- Modify: `src/admin/admin.css`

**Interfaces:**
- Consumes: existing `appointmentTable(list)`, `Appointment`, `openDetail`, `filtered`, `dayRows`, and current filter state.
- Produces: desktop table and mobile appointment cards with equivalent appointment information and an open-details action.

- [x] Preserve the table layout on desktop.
- [x] At mobile widths, render each appointment as a card with client, service, date/time, status, amount/received, and open-details action.
- [x] Arrange search, status, date, and export controls in a usable mobile flow without clipping.
- [x] Keep empty states and new-booking action available when no appointments match.
- [x] Review agenda and overview cards at narrow widths, including long names and service names.

### Task 3: Appointment detail and edit flow

**Files:**
- Modify: `src/admin/Admin.tsx`
- Modify: `src/admin/admin.css`

**Interfaces:**
- Consumes: existing `detail`, `confirm`, `run`, `updateBooking`, `recordPayment`, and `Modal` behavior.
- Produces: a full-height mobile detail view with summary and prominent actions; editable details, payment, and history remain accessible.

- [x] Reorder the appointment summary so client, service, date, and status are easy to scan.
- [x] Place save, complete, and cancel actions in a clear mobile action area; preserve completion/cancellation confirmation.
- [x] Group contact/date/notes fields separately from payment and history.
- [x] Stack edit fields at phone widths and keep controls clear of the mobile navigation/safe area.
- [x] Verify status and payment actions still call the existing functions with unchanged semantics.

### Task 4: Revenue chart and overview hierarchy

**Files:**
- Modify: `src/admin/Admin.tsx`
- Modify: `src/admin/admin.css`

**Interfaces:**
- Consumes: `Appointment[]`, the selected `month`, existing `monthlySummary`, and `money`.
- Produces: responsive revenue chart with currency ticks, date/value tooltip, month total, and empty state.

- [x] Replace the custom SVG `RevenueChart` with a focused Recharts implementation using payment date totals.
- [x] Add a responsive currency axis, accessible label, and tooltip with date and amount.
- [x] Display the selected month's received total and a clear no-data state.
- [x] At mobile widths, show the day agenda before the chart; preserve the desktop overview layout.
- [x] Review the financial screen and verify chart/summary totals use payment dates.

### Task 5: Final review and publish to main

**Files:**
- Review: `src/admin/Admin.tsx`
- Review: `src/admin/admin.css`

- [x] Review all six sections at desktop and mobile widths, checking touch targets, focus, long content, and overflow.
- [x] Check that all existing appointment, payment, service, and settings actions remain available.
- [x] Run the project build if dependencies are available; do not add dependencies for this redesign.
- [x] Publish the reviewed admin changes to the repository's `main` branch.
