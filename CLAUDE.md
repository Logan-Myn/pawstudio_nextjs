# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PawStudio** is an AI-powered pet photo editing application built with **Next.js 15**. The app uses Google's Gemini 2.5 Flash Image API to transform pet photos with AI-generated studio-quality filters and effects while preserving pet identity.

## Development Rules
- Use supabase MCP when needed
- Do not use placeholder information - search online if you don't know
- Do not add TODO comments - implement all features completely
- "cpd" means: Commit and Push on Github and deploy on Vercel

## Technology Stack

- **Frontend Framework:** Next.js 15.5.2 with React 19.1.0, App Router, Turbopack
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 with Radix UI components
- **Database & Auth:** Supabase (PostgreSQL with Row Level Security)
- **Image Storage:** Backblaze B2
- **AI Processing:** Google Gemini 2.5 Flash Image API (`@google/generative-ai`)
- **Payment Processing:** Stripe (partial implementation)
- **State Management:** Zustand
- **Form Handling:** React Hook Form with Zod validation
- **Deployment:** Vercel

## Development Commands

**Local Development:**
```bash
npm run dev              # Start dev server with Turbopack
npm run build            # Production build with Turbopack
npm start                # Start production server
npm run lint             # Run ESLint
```

**Vercel Deployment:**
```bash
npm run vercel           # Deploy to Vercel
npm run vercel:dev       # Run Vercel dev environment
npm run vercel:deploy    # Deploy to production
npm run vercel:preview   # Create preview deployment
```

## Architecture Overview

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register)
│   ├── admin/             # Admin panel pages
│   ├── api/               # API routes
│   │   ├── auth/          # Auth endpoints
│   │   ├── images/        # Image processing endpoints
│   │   ├── credits/       # Credit system endpoints
│   │   └── admin/         # Admin API endpoints
│   ├── auth/              # OAuth callback handler
│   └── dashboard/         # Main dashboard and editor
├── components/            # React components
│   ├── ui/                # Radix UI components (shadcn/ui style)
│   ├── auth/              # Auth-related components
│   ├── editor/            # Image editor components
│   └── admin/             # Admin components
├── lib/                   # Utilities and core logic
│   ├── store/             # Zustand state stores
│   ├── auth.ts            # Authentication logic
│   ├── credits.ts         # Credit system logic
│   ├── admin.ts           # Admin authorization
│   ├── supabase.ts        # Supabase client
│   └── api.ts             # API client utilities
└── types/                 # TypeScript type definitions
```

### Key Architecture Patterns

**Authentication Flow:**
1. Better Auth handles user authentication (email/password + Google OAuth)
2. Email verification required for new signups via Resend (account@paw-studio.com)
3. `AuthProvider` component wraps the app and syncs auth state with Zustand store
4. User data is stored in database `users` table with credits tracking
5. New users automatically get 3 free credits on signup
6. Protected routes use `ProtectedRoute` component, admin routes use `AdminRoute`

**Image Processing Flow:**
1. User uploads image → `/api/images/upload` → Backblaze B2 storage
2. User selects filter → `/api/images/process` route:
   - Checks user credits (minimum 1 required)
   - Downloads original image from B2
   - Processes with Gemini 2.5 Flash Image API using filter-specific prompts
   - Uploads processed image to B2
   - Deducts 1 credit and records transaction
   - Updates image record with processed URL

**Credit System:**
- Users have a credit balance stored in `users.credits`
- Each image process costs 1 credit
- Credit packages: 5 ($0.99) to 100 ($9.99) credits
- Transactions tracked in `credit_transactions` table
- All credit operations use Supabase Admin client to bypass RLS

**Admin System:**
- Role-based access control: `user`, `admin`, `super_admin`
- Admin API routes protected by `withAdminAuth` wrapper
- Admin can manage users, scenes, and system settings
- Uses Supabase RPC function `get_user_with_role` for authorization

### Environment Variables

Required in `.env.local`:
- `DATABASE_URL` - PostgreSQL database connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_KEY` - Supabase service role key (server-side only)
- `GEMINI_API_KEY` - Google Gemini API key
- `RESEND_API_KEY` - Resend API key for email verification (format: re_xxxxx)
- `B2_APPLICATION_KEY_ID` - Backblaze B2 key ID
- `B2_APPLICATION_KEY` - Backblaze B2 application key
- `B2_BUCKET_NAME` - Backblaze B2 bucket name
- `B2_BUCKET_ID` - Backblaze B2 bucket ID
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `BETTER_AUTH_URL` - Better Auth base URL (http://localhost:3000 for dev)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (optional)

### Important Implementation Details

**Email Verification (Better Auth + Resend):**
- Email verification is required for all new signups (`requireEmailVerification: true`)
- Verification emails sent automatically on signup via Resend API
- From address: `account@paw-studio.com` (verified domain)
- Auto sign-in enabled after successful verification
- Configured in `src/lib/auth.ts` with `emailVerification` settings

**Supabase RLS Bypass:**
API routes use `supabaseAdmin` client (service role) to bypass Row Level Security for credit deduction and image updates. Regular client uses anon key with RLS enforced.

**Image Processing API (`/api/images/process/route.ts`):**
- Uses Gemini 2.5 Flash Image model: `gemini-2.5-flash-image-preview`
- Filter prompts defined in `getPromptForFilter()` function
- Returns base64 image data from AI response
- Handles B2 authorization, upload URLs, and SHA1 hashing for uploads

**State Management:**
- `useAuthStore` (Zustand): Global auth state, user info, credits
- `useEditorStore` (Zustand): Editor-specific state (images, filters, processing)

**Type Safety:**
- Path aliases: `@/*` maps to `src/*`
- Strict TypeScript mode enabled
- Type definitions in `src/types/index.ts`

### Available Filters

Defined in `src/types/index.ts`:
- `studio_bw` - Studio Black & White portrait
- `painted_portrait` - Classic oil painting style
- `pop_art` - Vibrant pop art graphics
- `seasonal_winter` - Winter wonderland theme

All filters cost 1 credit per use.

## Business Model

Freemium credit system:
- 1 free credit for new users
- Credit packages: $0.99 (5 credits) to $9.99 (100 credits)
- Each AI filter application costs 1 credit
- Target: 15% conversion rate, $3.50 average spend per user

## Testing & Debugging

- Check Vercel logs for API route errors
- Supabase dashboard for database queries and RLS policies
- Browser DevTools Network tab for API calls
- Console logs extensively used in `/api/images/process` route
