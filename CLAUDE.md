# Time Tracker

Personal time-tracking web app (PWA) for the iPhone home screen. Replaces an Excel sheet.
Full plan with mockups: https://claude.ai/artifact/RpCRLV9LZ5yrVND1DkJw61

## Stack

- Vue 3 (`<script setup>`, TypeScript) + Vite + vue-router
- Supabase: Postgres + Auth (email/password), row-level security on every table
- Netlify hosting (`netlify.toml`), PWA added in milestone 9

## Commands

- `npm run dev` – local dev server
- `npm run build` – type-check + production build
- `npm test` – Vitest unit tests for `src/lib` (`*.test.ts` next to the code)
- `npm run format` – Prettier

## Structure

```
src/
  main.ts, App.vue, router.ts   app start, layout shell, routes + auth guard
  lib/                          plain helpers: supabase, dates, time, holidays, targets, suggestions, vacation, stats
  types/                        TimeEntry, WorkProfile, DescriptionStat, DailyTotal (mirror tables/views)
  composables/                  state + data access: useAuth, useProfile, useEntries, useSuggestions, useVacation, useStats
  views/                        one file per screen
  components/                   reusable UI pieces
  styles/main.css               color tokens (light/dark) and base styles
supabase/migrations/            SQL, run in order in the Supabase SQL editor
```

## Work rules (domain)

- 38.5 h week, Mon–Fri, daily target 7.7 h (7:42)
- Austrian public holidays: target 0 h; 24 and 31 Dec: half days (3.85 h)
- Hours are shown in decimal (7.75 h); h:mm as secondary
- Vacation: 25 days per calendar year; first year pro rata, rounded up; unused days expire after 2 years, oldest used first
- Breaks are gaps between entries, never entries
- UI language English; descriptions are mostly German (suggestions must ignore umlauts/case)

## Code conventions

General rules: see `../CLAUDE.md`. Project-specific:

- Dates as `'YYYY-MM-DD'` strings in local time (`lib/dates.ts`), never `toISOString()` for dates
- Calculations live in `src/lib` as plain functions with tests; components only display them
- Prettier: no semicolons, single quotes, width 100
