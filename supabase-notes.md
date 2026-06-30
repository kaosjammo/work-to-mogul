# Supabase Notes — Login & Cloud Save

This documents the **Supabase** setup for optional account login + cloud save.
The game stays fully playable **anonymously with local saves** when Supabase is
not configured — cloud sync is a progressive enhancement, never a requirement.

> Status: **planned / front-loaded** (iteration 1 = docs). The client code,
> auth handling, and sync logic land in the next loop iteration. Provisioning
> the Supabase project now (per this doc) lets that land immediately.

## Why Supabase (no custom backend)

Supabase gives us hosted **Auth** + a **Postgres** table with **Row Level
Security (RLS)** behind a public anon key — no server code to write, deploy, or
secure. This satisfies "do not build a custom backend unless absolutely
necessary." The frontend talks directly to Supabase using only the **anon key**;
RLS ensures a user can only read/write their own save row.

## 1. Create the project

1. Create a free project at <https://supabase.com>.
2. **Project Settings → API** → copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
3. Never copy the **service_role** key into the frontend or this repo.

## 2. Auth method

Use **email + password** (fastest, no email-deliverability dependency for
testing) — or magic-link if you prefer. In **Authentication → Providers**,
ensure Email is enabled. For frictionless testing you may turn **off** "Confirm
email" (Authentication → Sign In / Providers → Email) so signups are usable
immediately; turn it back on for a real launch.

## 3. The `game_saves` table

One row per user, holding the same versioned save envelope already used by
`localStorage` (`tycoon:save`). Run this in the **SQL Editor**:

```sql
-- One save per user.
create table if not exists public.game_saves (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  save_data    jsonb       not null,
  save_version integer     not null default 1,
  updated_at   timestamptz not null default now()
);

-- Lock the table down; users only ever touch their own row.
alter table public.game_saves enable row level security;

create policy "select own save"
  on public.game_saves for select
  using (auth.uid() = user_id);

create policy "insert own save"
  on public.game_saves for insert
  with check (auth.uid() = user_id);

create policy "update own save"
  on public.game_saves for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Delete is not used yet, but the policy is ready for "delete account/save" later.
create policy "delete own save"
  on public.game_saves for delete
  using (auth.uid() = user_id);
```

### Column mapping
| Column | Source in app |
|---|---|
| `user_id` | `auth.users.id` of the signed-in user (set automatically) |
| `save_data` | the full save envelope `{ version, savedAt, state }` (same shape as `localStorage`) |
| `save_version` | `SAVE_VERSION` from `src/save/serialize.ts` (for future migrations) |
| `updated_at` | bumped on every upload; used for conflict comparison vs the local `savedAt` |

## 4. Conflict strategy (planned)

On login, compare the local save's `savedAt` against the cloud row's
`updated_at`:

- **Both exist** → show a non-destructive choice: **"Use this device"** vs
  **"Use cloud save"** (with each save's timestamp + a quick stat like cash or
  lifetime earnings). Neither is deleted until the user picks; the chosen one is
  then synced to the other.
- **Only local** → upload local to cloud.
- **Only cloud** → download cloud to local.
- **Neither** → start fresh.

Autosave continues to write `localStorage` always; cloud upload is debounced
(e.g. on autosave tick + on tab-hide) and only when signed in.

## 5. Security checklist

- [x] Only `VITE_SUPABASE_ANON_KEY` (public) is used in the frontend.
- [x] RLS enabled with per-user `auth.uid() = user_id` policies.
- [x] `.env` / `.env.local` are gitignored; only `.env.example` is committed.
- [x] No service_role key anywhere in the repo or client bundle.

## 6. Environment variables

See `.env.example`. Vite exposes only vars prefixed `VITE_` to the client.

| Var | Value |
|---|---|
| `VITE_SUPABASE_URL` | Project URL from Supabase API settings |
| `VITE_SUPABASE_ANON_KEY` | anon/public key from Supabase API settings |

For Vercel deployment of these, see `deploy-notes.md`.
