# Student Ops School

Offline-first Expo (React Native) TypeScript app for a small school (~10–15 staff, ~300 students).

**Android package:** `com.studentops.school`  
**GitHub (owner):** `kedarnath-dev-byte/student-ops-school`

## Modules

| Tab | Purpose |
|-----|---------|
| Attendance | Pick class/date, mark Present / Absent / Late (big touch targets) |
| Students | List, add, detail + progress notes |
| Fees | Collect fee (student, amount, cash/UPI/bank, note) |
| Expenses | Record spend (amount, category, purpose) |
| More | Partners, money report (in/out/net by partner this month) |

## Finance rule (shared pot)

Three partners (A / B / C) share **one** school pot:

- Any partner can collect fees from **any** student.
- Any partner can spend on **any** school expense.
- Every money movement **must** record: `partner_id` (from login), student (fees) or purpose/category (expenses), amount, method, timestamp.
- **No anonymous cash.** Soft-delete only via **void + reason** (no hard deletes).

v0 runs fully offline with a Zustand + AsyncStorage mock store and seed data. Supabase schema is ready under `supabase/migrations/001_init.sql`.

## Prerequisites

- Node 18+ (Node 20 recommended)
- npm or yarn
- Expo Go on a phone, or Android emulator / web

## Run (mock / offline)

```bash
cd student-ops-school
npm install
npx expo start
```

Then press `a` (Android), `i` (iOS simulator), `w` (web), or scan the QR with Expo Go.

### Typecheck

```bash
npm run typecheck
# or: npx tsc --noEmit
```

## Login

On launch, pick **Partner A**, **Partner B**, or **Partner C**. That selection stamps every attendance mark, fee, expense, and progress note.

## Project layout

```
app/                  Expo Router screens (tabs + login + students)
src/store/            Zustand mock store + seed + types
src/components/       Shared UI
supabase/migrations/  001_init.sql (partners, students, attendance, fees, expenses)
```

## Environment (Supabase — later)

Copy `.env.example` → `.env` (never commit secrets):

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Leave blank for mock mode. When ready, apply `supabase/migrations/001_init.sql` in the Supabase SQL editor, then replace store calls with Supabase client queries (same shapes).

## EAS APK (later)

```bash
npm i -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

`app.json` already sets:

- `name`: Student Ops  
- `slug`: student-ops-school  
- `android.package`: com.studentops.school  

## Reset demo data

**More → Reset mock data to seed** clears local AsyncStorage state back to the 6 demo students + sample fees/expenses.

## License

Private — school operations tool.
