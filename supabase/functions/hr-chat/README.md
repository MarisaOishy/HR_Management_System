# HR Assistant Chatbot — Setup Guide

This Supabase Edge Function powers the in-app HR chatbot. It calls
Google Gemini (free tier) and executes tool calls against your Supabase
database **using the signed-in user's JWT**, so Row-Level Security
controls what the assistant can see.

---

## 1. Get a free Gemini API key

1. Open <https://aistudio.google.com/app/apikey>
2. Sign in with a Google account.
3. Click **Create API key** → copy the key.

Free tier today: ~1,500 requests/day, 1M tokens/day, 15 req/min — more
than enough for a small team.

---

## 2. Install the Supabase CLI (one-time)

PowerShell on Windows:

```powershell
npm install -g supabase
```

Or follow <https://supabase.com/docs/guides/local-development/cli/getting-started>.

Log in and link to your existing project:

```powershell
supabase login
supabase link --project-ref <your-project-ref>
```

(`project-ref` is the part of `VITE_SUPABASE_URL` between `https://` and
`.supabase.co`.)

---

## 3. Add the Gemini key as a secret

```powershell
supabase secrets set GEMINI_API_KEY=your_key_here
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected automatically by the
Edge Functions runtime — you don't need to set those.

---

## 4. Deploy the function

```powershell
supabase functions deploy hr-chat
```

That's it — the chat widget in the app (bottom-right bubble) will start
working immediately. No frontend env vars are needed; the widget reaches
the function via the `supabase-js` client.

---

## 5. Recommended: Enable Row Level Security

The chatbot is only as safe as your RLS policies. Without RLS, an
Employee asking *"show me everyone's salaries"* would get them.

At minimum, lock down the employee-scoped tables. Example for
`leave_balances`:

```sql
alter table leave_balances enable row level security;

-- Employees see only their own balance
create policy "self read leave_balances" on leave_balances
  for select using (
    employee_id in (select id from employees where email = auth.email())
  );

-- HR / Admin see everything (read)
create policy "hr read leave_balances" on leave_balances
  for select using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('Admin','HR Admin','HR')
  );
```

Apply analogous policies to: `employees`, `leave_requests`, `payroll`,
`attendance_records`, `performance_reviews`.

You can see existing policies in [supabase/rls_policies.sql](../../rls_policies.sql).

---

## 6. Try it

1. `npm run dev`
2. Log in as any user.
3. Click the blue chat bubble (bottom-right).
4. Try: *"What's my leave balance?"*, *"Show my last payslip"*,
   *"How many people are on leave today?"* (HR/Admin only).

---

## Troubleshooting

- **"Server is missing GEMINI_API_KEY secret."** → step 3 wasn't run, or
  you ran it before linking the project. Re-run after `supabase link`.
- **"Missing auth token."** → the user is not signed in. The widget
  hides itself when there is no session — so this only happens if the
  function is called directly.
- **"Quota exceeded"** from Gemini → daily free tier used up. Wait until
  reset (UTC midnight) or add billing in Google AI Studio.
- **The bot says "No employee record linked to your account."** → the
  auth user's email does not match any row in the `employees` table.
  This is expected for new admin accounts that don't have an employee
  profile — only the HR-wide tools will work for them.

---

## Architecture

```
React UI (ChatWidget)
        │  POST { messages }  +  Authorization: Bearer <JWT>
        ▼
Supabase Edge Function `hr-chat`
        │
        ├─ Verifies JWT, derives role from user_metadata / email
        │
        ├─ Builds tool list filtered by role
        │     (Employee → self-service only)
        │     (HR / Admin → self-service + org-wide tools)
        │
        ├─ Calls Gemini 2.0 Flash with system prompt + tools + history
        │
        ├─ If Gemini returns a functionCall → executes via supabase-js
        │  client carrying the user's JWT (so RLS applies)
        │
        └─ Loops until Gemini returns text → returns it to the UI
```

Files added by this feature (everything additive — nothing existing
was removed or restructured):

- `supabase/functions/hr-chat/index.ts`        — Edge Function
- `supabase/functions/hr-chat/README.md`       — this file
- `src/lib/services/chatService.ts`            — client → function
- `src/app/components/chat/ChatWidget.tsx`     — floating widget UI
- `src/app/layouts/MainLayout.tsx`             — one-line mount
