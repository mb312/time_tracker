# Time Tracker

Personal time tracking as a home-screen web app.

## Setup

1. Create a Supabase project and run `supabase/migrations/001_time_entries.sql`, then `002_work_profile.sql` in the SQL editor.
2. In Supabase → Authentication → Users, add your user (email + password). Then turn off "Allow new users to sign up".
3. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.
4. `npm install` and `npm run dev`.

## Deploy

Connect the repository in Netlify and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as environment variables. Build settings come from `netlify.toml`.
