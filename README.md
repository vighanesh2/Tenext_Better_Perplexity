This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Auth (Supabase)

Sign-in and sign-up use Supabase with email and password.

1. Create a [Supabase](https://supabase.com) project and add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. Add your app URL to **Redirect URLs** in Supabase: Authentication → URL Configuration (e.g. `http://localhost:3000/auth/callback` for local dev).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### If you see 404 NOT_FOUND after deploy

The app lives at the **repository root** (no subfolder). In Vercel:

1. **Project Settings → General → Root Directory**  
   Leave **empty** (or `.`). If this is set to `better-perplexity` or any subfolder, clear it and save.

2. **Framework Preset**  
   Should be **Next.js**. If the project was created when the app was in a subfolder, Vercel may have picked "Other"; set it to Next.js.

3. **Build & Output**  
   Do **not** set a custom Output Directory. Let Vercel use the Next.js default.

4. **Redeploy**  
   Push your latest commit (with the flattened structure), then in Vercel: Deployments → ⋮ on latest → **Redeploy** (or trigger a new deploy from your Git provider).
