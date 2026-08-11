# craft-cervezas

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_ReGA9keE1IWnq4OIePMFT9Vj8Gtu)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
# Craft Cervezas

## Supabase

The application expects these environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Database changes live in `supabase/migrations`. Apply migrations to the linked
Supabase project before deploying application code that depends on them.

### Create the first super admin

1. Create the user in Supabase Authentication (email/password). Public signup
   stays disabled.
2. In the SQL editor, insert the matching profile using the Authentication user
   UUID:

```sql
insert into public.profiles (id, full_name, role, active)
values ('AUTH_USER_UUID', 'Administrator', 'super_admin', true);
```

Never place the service-role key in browser code or in a `NEXT_PUBLIC_`
variable.
