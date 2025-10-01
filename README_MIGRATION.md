# PawStudio Migration Guide

## Step 1: Set up New Neon Database

1. Go to your Neon dashboard
2. Run the SQL schema from `schema.sql`:

```bash
# Connect to your new Neon database using psql or Neon SQL Editor
psql "postgresql://neondb_owner:npg_Lc5alqxwd9BV@ep-wandering-voice-adq61cyw-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Then paste the contents of schema.sql
\i schema.sql
```

Or copy the contents of `schema.sql` and paste into the Neon SQL Editor in the dashboard.

## Step 2: Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

Required variables:
- `DATABASE_URL` - New Neon database connection string
- `BETTER_AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `BETTER_AUTH_URL` - `http://localhost:3000` for local dev
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- All Backblaze B2 variables
- `GEMINI_API_KEY` - Google Gemini API key
- Stripe keys

## Step 3: Migrate Data from Rails Database

Install tsx if you haven't:
```bash
npm install -g tsx
```

Run the migration script:
```bash
OLD_DATABASE_URL="postgresql://neondb_owner:npg_Gjfl7Ibe1pXD@ep-delicate-hall-a-delr6un-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require" \
NEW_DATABASE_URL="postgresql://neondb_owner:npg_Lc5alqxwd9BV@ep-wandering-voice-adq61cyw-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" \
npx tsx migrate-data.ts
```

This will:
- Migrate all users (user IDs will be prefixed with `user_`)
- Migrate all scenes
- Migrate all photos (7 records)
- Migrate all generations → images table
- Migrate all credit transactions
- Migrate all payment methods

## Step 4: Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to test the application.

## Step 5: Test Core Features

- [ ] Register a new user
- [ ] Login with email/password
- [ ] Login with Google OAuth
- [ ] Upload an image
- [ ] Process an image (check credits deduct)
- [ ] View transaction history
- [ ] Admin login (if you have an admin account)

## Step 6: Deploy to Vercel

```bash
npm run vercel:deploy
```

Make sure to add all environment variables in the Vercel dashboard, and update:
- `BETTER_AUTH_URL` to your production domain
- `NEXT_PUBLIC_APP_URL` to your production domain

## Troubleshooting

### Database Connection Issues

If you get connection errors, verify:
1. DATABASE_URL is correct
2. Neon database is accessible
3. IP allowlist is configured (if applicable)

### Authentication Issues

If Better-Auth isn't working:
1. Check BETTER_AUTH_SECRET is set
2. Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
3. Check Google OAuth redirect URLs include your domain

### Migration Errors

If data migration fails:
1. Check OLD_DATABASE_URL and NEW_DATABASE_URL are correct
2. Ensure schema.sql ran successfully first
3. Check logs for specific errors

## Important Notes

- **User IDs changed**: Rails user IDs are now prefixed with `user_` (e.g., `1` → `user_1`)
- **Passwords reset**: Users will need to reset passwords (Better-Auth uses different hashing)
- **Sessions invalid**: All existing sessions will be invalid
- **Backblaze URLs**: Photo URLs remain the same (no migration needed)
