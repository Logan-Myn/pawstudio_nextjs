# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PawStudio** is an AI-powered pet photo editing application built with **Next.js 15**. The app uses Black Forest Labs' FLUX.2 Pro API to transform pet photos with AI-generated studio-quality filters and effects while preserving pet identity.

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
- **AI Processing:** Black Forest Labs FLUX.2 Pro API (native fetch)
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
   - Processes with FLUX.2 Pro API using filter-specific prompts
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
- `BFL_API_KEY` - Black Forest Labs FLUX.2 Pro API key (get from https://dashboard.bfl.ai)
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
- Uses FLUX.2 Pro via native fetch (endpoint: `/v1/flux-2-pro`)
- Filter prompts stored in database `scenes` table and fetched dynamically
- Processing handled by `processImageWithFlux()` from `@/lib/flux`
- Returns base64 image data from AI response
- Handles B2 authorization, upload URLs, and SHA1 hashing for uploads
- Admin can test prompts via `/api/admin/scenes/preview` endpoint

**State Management:**
- `useAuthStore` (Zustand): Global auth state, user info, credits
- `useEditorStore` (Zustand): Editor-specific state (images, filters, processing)

**Type Safety:**
- Path aliases: `@/*` maps to `src/*`
- Strict TypeScript mode enabled
- Type definitions in `src/types/index.ts`

### Available Scenes/Filters

Scenes are stored in the `scenes` database table and managed via the admin panel:
- Each scene has: name, description, category, prompt, credit_cost, preview_image, active status
- Scenes can be tested using the admin panel's "Prompt Preview" feature
- Mobile app fetches active scenes from `/api/scenes`
- Default scenes: studio portraits, winter wonderland, pop art, etc.
- All scenes cost 1 credit per use by default (configurable per scene)

**Admin Panel Features:**
- Create/edit/delete scenes at `/admin/scenes`
- Test multiple prompts simultaneously with a sample image
- Archive successful prompt results for future reference
- Upload preview images for each scene

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
- Run test script: `npx tsx scripts/test-flux.ts` (requires BFL_API_KEY in .env.local)

## AI Service Migration History

### Migration: FLUX.1 Kontext Pro → FLUX.2 Pro

**Migration Date:** November 2025

Upgraded from FLUX.1 Kontext Pro to FLUX.2 Pro for improved quality and lower cost.

**Key Changes:**
- **Endpoint:** `/v1/flux-kontext-pro` → `/v1/flux-2-pro`
- **Files Updated:**
  - `src/lib/flux-native.ts` - Native FLUX.2 Pro integration
  - `src/lib/flux.ts` - Wrapper module
  - `scripts/test-flux.ts` - Test script

**FLUX.2 Pro Benefits over FLUX.1 Kontext Pro:**
- Better photorealism and image quality
- Lower cost ($0.03 vs $0.04 per megapixel)
- Support for up to 8 reference images (vs 3)
- Resolution up to 4MP (2048x2048)
- Improved typography and hex color support
- Better prompt adherence

**Rollback Plan:**
If issues occur, revert to FLUX.1 Kontext Pro by changing endpoint in `flux-native.ts`:
```typescript
// Change this line:
const submitResponse = await fetch(`${API_BASE_URL}/v1/flux-2-pro`, {
// Back to:
const submitResponse = await fetch(`${API_BASE_URL}/v1/flux-kontext-pro`, {
```

---

### Migration: Gemini → FLUX.1 Kontext Pro

**Migration Date:** January 2025

The application was migrated from Google Gemini 2.5 Flash to Black Forest Labs FLUX.1 Kontext Pro for improved image quality and context-aware editing capabilities.

**Key Changes:**
- **AI Service Module:** `src/lib/flux.ts` - Core FLUX integration
- **Package:** Replaced `@google/generative-ai` with native fetch
- **API Routes Updated:**
  - `src/app/api/images/process/route.ts` - Main image processing
  - `src/app/api/admin/scenes/preview/route.ts` - Admin prompt testing
- **Environment Variable:** `BFL_API_KEY` (replaces `GEMINI_API_KEY`)

**Testing Before Deployment:**
1. Add `BFL_API_KEY` to `.env.local`
2. Place test pet photo at `scripts/test-pet.jpg`
3. Run: `npx tsx scripts/test-flux.ts`
4. Review generated images in `scripts/` folder
5. If quality is acceptable, deploy to Vercel with `BFL_API_KEY` environment variable
