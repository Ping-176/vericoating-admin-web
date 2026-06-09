# Vericoating Admin Web

Independent admin system for Vericoating catalog and sample request management.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Apply the matching Supabase migration in `D:\workspace\vericoating-supabase` before using sample request management.
