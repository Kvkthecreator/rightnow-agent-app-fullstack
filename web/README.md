This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Static Assets

Place your image and logo assets in the `public/assets` directory:
- `public/assets/logos/` for logo files (e.g. `rightnow-logo-dark.png`, `rightnow-logo-light.png`)
- `public/assets/images/` for other images (e.g. `landing-hero.png`)

Files in `public` are served at the root path. For example, an asset at
`public/assets/logos/rightnow-logo-dark.png` is available at `/assets/logos/rightnow-logo-dark.png`.

Usage examples:

```tsx
import Image from 'next/image';
import Logo from '../components/Logo'; // or '@/components/Logo'

// Default logo (32x32)
<Logo variant="dark" />

// Custom logo size
<Logo variant="light" width={120} height={40} />

// Other static images
<Image src="/assets/images/landing-hero.png" alt="Landing Hero" width={600} height={400} />
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
  
## Environment Variables

To configure your local development and production environments, create a `.env.local` file in the `web/` directory with the following variables:
```env
# URL of your Render-hosted FastAPI backend for agent-run and task-types
NEXT_PUBLIC_API_BASE=http://localhost:10000
# Supabase REST API URL (public)
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
# Supabase anonymous key for client calls
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
On your production host (e.g., Vercel), set the same variables in the project settings:
  • `NEXT_PUBLIC_API_BASE` → your Render backend URL (e.g. `https://yarnnn.com`)
  • `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
  • `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anonymous key
After updating `NEXT_PUBLIC_API_BASE`, redeploy the frontend so route handlers
use the new value. You can confirm by requesting `/api/baskets/<id>/change-queue`
and checking that the backend logs show a GET request without a 500 error.
