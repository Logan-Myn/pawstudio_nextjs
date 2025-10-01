# Migration Guide: Rails PawStudio → Next.js PawStudio

## Overview
This guide details the complete migration from the Rails application at `/Users/loganmoyon/Documents/Dev/pawstudio` to the Next.js application at `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend`.

**Total Estimated Time:** 5-6 days

---

## Phase 1: Database Schema Setup (Day 1)

### 1.1 Export Current Database Schema

**Location:** `/Users/loganmoyon/Documents/Dev/pawstudio/db/schema.rb`

**Key Tables to Migrate:**
- `users` - User accounts with credits
- `photos` - User uploaded photos (7 records exist in Backblaze)
- `scenes` - AI scene configurations (10+ scenes with categories)
- `generations` - Generation history
- `credit_transactions` - Payment history
- `payment_methods` - Saved payment methods

**Export Command:**
```bash
cd /Users/loganmoyon/Documents/Dev/pawstudio
# Get current database URL from Neon
DATABASE_URL="postgresql://neondb_owner:npg_Gjfl7Ibe1pXD@ep-delicate-hall-a-delr6un-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Export data
pg_dump $DATABASE_URL > /Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/rails_backup.sql
```

### 1.2 Create New Neon Database Schema

**Create the following schema in new Neon database compatible with Better-Auth:**

```sql
-- Users table (Better-Auth compatible)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  name TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Custom PawStudio fields
  credits_balance INTEGER DEFAULT 3 NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  admin BOOLEAN DEFAULT FALSE NOT NULL
);

-- Better-Auth sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Better-Auth accounts table
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMP,
  refresh_token_expires_at TIMESTAMP,
  scope TEXT,
  password TEXT, -- hashed password for email/password auth
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Better-Auth verification tokens
CREATE TABLE verification_tokens (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Photos table
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_uploaded_at ON photos(uploaded_at);

-- Scenes table
CREATE TABLE scenes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  category TEXT,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  display_order INTEGER NOT NULL,
  usage_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scenes_active ON scenes(active);
CREATE INDEX idx_scenes_category ON scenes(category);
CREATE INDEX idx_scenes_display_order ON scenes(display_order);
CREATE INDEX idx_scenes_active_display_order ON scenes(active, display_order);

-- Generations table
CREATE TABLE generations (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  scene_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  result_image_url TEXT,
  credits_used INTEGER DEFAULT 1 NOT NULL,
  processing_started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_photo_id ON generations(photo_id);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generations_scene_type ON generations(scene_type);
CREATE INDEX idx_generations_created_at ON generations(created_at);

-- Credit transactions table
CREATE TABLE credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  payment_method_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX idx_credit_transactions_stripe_payment_intent_id ON credit_transactions(stripe_payment_intent_id);

-- Payment methods table
CREATE TABLE payment_methods (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_stripe_payment_method_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX idx_payment_methods_user_id_is_default ON payment_methods(user_id, is_default);
```

### 1.3 Data Migration Script

**Create migration script:** `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/migrate-data.ts`

```typescript
import { neon } from '@neondatabase/serverless';
import { hash } from 'bcrypt';

const oldDbUrl = process.env.OLD_DATABASE_URL!;
const newDbUrl = process.env.NEW_DATABASE_URL!;

async function migrateData() {
  const oldDb = neon(oldDbUrl);
  const newDb = neon(newDbUrl);

  console.log('Starting data migration...');

  // 1. Migrate Users
  console.log('Migrating users...');
  const users = await oldDb`SELECT * FROM users`;

  for (const user of users) {
    const userId = `user_${user.id}`; // Better-Auth uses string IDs

    await newDb`
      INSERT INTO users (id, email, name, credits_balance, stripe_customer_id, admin, created_at, updated_at)
      VALUES (
        ${userId},
        ${user.email},
        ${user.email.split('@')[0]},
        ${user.credits_balance},
        ${user.stripe_customer_id},
        ${user.admin},
        ${user.created_at},
        ${user.updated_at}
      )
      ON CONFLICT (id) DO NOTHING
    `;

    // Create password account entry (users will need to reset password)
    await newDb`
      INSERT INTO accounts (id, account_id, provider_id, user_id, created_at, updated_at)
      VALUES (
        ${`account_${user.id}`},
        ${user.email},
        'credential',
        ${userId},
        ${user.created_at},
        ${user.updated_at}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // 2. Migrate Scenes
  console.log('Migrating scenes...');
  const scenes = await oldDb`SELECT * FROM scenes`;

  for (const scene of scenes) {
    await newDb`
      INSERT INTO scenes (id, name, description, prompt, category, active, display_order, usage_count, created_at, updated_at)
      VALUES (
        ${scene.id},
        ${scene.name},
        ${scene.description},
        ${scene.prompt},
        ${scene.category},
        ${scene.active},
        ${scene.display_order},
        ${scene.usage_count},
        ${scene.created_at},
        ${scene.updated_at}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // 3. Migrate Photos
  console.log('Migrating photos...');
  const photos = await oldDb`SELECT * FROM photos`;

  for (const photo of photos) {
    const userId = `user_${photo.user_id}`;

    await newDb`
      INSERT INTO photos (id, user_id, original_filename, file_url, file_size, uploaded_at, created_at, updated_at)
      VALUES (
        ${photo.id},
        ${userId},
        ${photo.original_filename},
        ${photo.file_url},
        ${photo.file_size},
        ${photo.uploaded_at},
        ${photo.created_at},
        ${photo.updated_at}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // 4. Migrate Generations
  console.log('Migrating generations...');
  const generations = await oldDb`SELECT * FROM generations`;

  for (const generation of generations) {
    const userId = `user_${generation.user_id}`;

    await newDb`
      INSERT INTO generations (id, user_id, photo_id, scene_type, status, result_image_url, credits_used, processing_started_at, completed_at, created_at, updated_at)
      VALUES (
        ${generation.id},
        ${userId},
        ${generation.photo_id},
        ${generation.scene_type},
        ${generation.status},
        ${generation.result_image_url},
        ${generation.credits_used},
        ${generation.processing_started_at},
        ${generation.completed_at},
        ${generation.created_at},
        ${generation.updated_at}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // 5. Migrate Credit Transactions
  console.log('Migrating credit transactions...');
  const transactions = await oldDb`SELECT * FROM credit_transactions`;

  for (const transaction of transactions) {
    const userId = `user_${transaction.user_id}`;

    await newDb`
      INSERT INTO credit_transactions (id, user_id, transaction_type, amount, stripe_payment_intent_id, payment_method_id, created_at, updated_at)
      VALUES (
        ${transaction.id},
        ${userId},
        ${transaction.transaction_type},
        ${transaction.amount},
        ${transaction.stripe_payment_intent_id},
        ${transaction.payment_method_id},
        ${transaction.created_at},
        ${transaction.updated_at}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // 6. Migrate Payment Methods
  console.log('Migrating payment methods...');
  const paymentMethods = await oldDb`SELECT * FROM payment_methods`;

  for (const pm of paymentMethods) {
    const userId = `user_${pm.user_id}`;

    await newDb`
      INSERT INTO payment_methods (id, user_id, stripe_payment_method_id, card_brand, card_last4, card_exp_month, card_exp_year, is_default, created_at, updated_at)
      VALUES (
        ${pm.id},
        ${userId},
        ${pm.stripe_payment_method_id},
        ${pm.card_brand},
        ${pm.card_last4},
        ${pm.card_exp_month},
        ${pm.card_exp_year},
        ${pm.is_default},
        ${pm.created_at},
        ${pm.updated_at}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  console.log('Migration complete!');
}

migrateData().catch(console.error);
```

**Run migration:**
```bash
cd /Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS
npm install @neondatabase/serverless bcrypt
OLD_DATABASE_URL="your_old_neon_url" NEW_DATABASE_URL="your_new_neon_url" npx tsx migrate-data.ts
```

---

## Phase 2: Setup Better-Auth (Day 2)

### 2.1 Install Dependencies

```bash
cd /Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend
npm install better-auth @better-auth/next drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
npm uninstall @supabase/supabase-js @supabase/ssr
```

### 2.2 Create Better-Auth Configuration

**File:** `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/lib/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { neonAdapter } from "better-auth/adapters/neon";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export const auth = betterAuth({
  database: neonAdapter(sql),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
```

### 2.3 Create Auth API Route

**File:** `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/app/api/auth/[...all]/route.ts`

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### 2.4 Update Environment Variables

**File:** `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/.env.local`

```bash
# Replace Supabase vars with Neon + Better-Auth
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
BETTER_AUTH_SECRET="generate-a-random-32-char-secret"
BETTER_AUTH_URL="http://localhost:3000"

# Keep existing
NEXT_PUBLIC_API_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_xxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
GOOGLE_CLIENT_ID="xxx"
GOOGLE_CLIENT_SECRET="xxx"

# Backblaze B2
B2_APPLICATION_KEY_ID="xxx"
B2_APPLICATION_KEY="xxx"
B2_BUCKET_NAME="pawstudio"
B2_BUCKET_ID="xxx"

# Google Gemini
GOOGLE_GEMINI_API_KEY="xxx"
```

### 2.5 Create Auth Client Hook

**File:** `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
```

### 2.6 Update Auth Store

**File:** `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/lib/store/auth.ts`

**Replace Supabase imports with Better-Auth:**

```typescript
import { create } from 'zustand';
import { useSession } from '@/lib/auth-client';

interface User {
  id: string;
  email: string;
  name?: string;
  credits: number;
  admin: boolean;
}

interface AuthState {
  user: User | null;
  credits: number;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setCredits: (credits: number) => void;
  updateCredits: (amount: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  credits: 0,
  isLoading: true,
  setUser: (user) => set({ user, credits: user?.credits || 0, isLoading: false }),
  setCredits: (credits) => set({ credits }),
  updateCredits: (amount) => set((state) => ({
    credits: state.credits + amount,
    user: state.user ? { ...state.user, credits: state.credits + amount } : null
  })),
}));
```

### 2.7 Update Login Page

**File:** `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/app/(auth)/login/page.tsx`

**Replace Supabase login with Better-Auth:**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error } = await signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message || 'Invalid email or password');
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Welcome back! Please sign in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2.8 Update Register Page

**File:** `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/app/(auth)/register/page.tsx`

Similar pattern to login, replace Supabase with Better-Auth `signUp.email()`.

---

## Phase 3: Add Photo Library Feature (Day 3)

### 3.1 Copy Models from Rails

**Reference:** `/Users/loganmoyon/Documents/Dev/pawstudio/app/models/photo.rb`

### 3.2 Create Library Page

**File:** `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/app/dashboard/library/page.tsx`

**Reference UI from:** `/Users/loganmoyon/Documents/Dev/pawstudio/app/views/dashboard/index.html.erb` (lines 85-119)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Trash2, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface LibraryPhoto {
  id: number;
  originalFilename: string;
  fileUrl: string;
  uploadedAt: string;
}

export default function LibraryPage() {
  const { user } = useAuthStore();
  const [photos, setPhotos] = useState<LibraryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos/library');
      const data = await response.json();
      setPhotos(data.photos);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (photoId: number) => {
    if (!confirm('Delete this photo?')) return;

    try {
      await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
      setPhotos(photos.filter(p => p.id !== photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Photo Library</h1>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Photo
        </Button>
      </div>

      {photos.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No photos yet</h3>
            <p className="text-gray-600 mb-6">
              Upload photos to reuse them in multiple generations
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="group relative overflow-hidden">
              <div className="aspect-square relative">
                <Image
                  src={photo.fileUrl}
                  alt={photo.originalFilename}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(photo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-xs truncate">{photo.originalFilename}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3.3 Add Library Selection to Editor

**File:** `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/app/dashboard/editor/page.tsx`

**Reference:** `/Users/loganmoyon/Documents/Dev/pawstudio/app/views/dashboard/index.html.erb` (lines 32-40, 84-119)

Add tabs for "Upload New" vs "From Library" similar to Rails implementation.

---

## Phase 4: Add Dynamic Scenes (Day 4)

### 4.1 Create Scenes API Route

**File:** `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/app/api/scenes/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const scenes = await sql`
      SELECT * FROM scenes
      WHERE active = true
      ORDER BY display_order ASC
    `;

    return NextResponse.json({ scenes });
  } catch (error) {
    console.error('Error fetching scenes:', error);
    return NextResponse.json({ error: 'Failed to fetch scenes' }, { status: 500 });
  }
}
```

### 4.2 Update Editor to Use Dynamic Scenes

**Reference:** `/Users/loganmoyon/Documents/Dev/pawstudio/app/views/generations/new.html.erb`

Replace the fixed 4 filters with database-driven scenes from the API.

---

## Phase 5: Add Mobile API Endpoints (Day 5)

### 5.1 Create API v1 Routes

**Reference:** `/Users/loganmoyon/Documents/Dev/pawstudio/app/controllers/api/v1/`

**Files to create:**

1. `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/app/api/v1/auth/register/route.ts`
2. `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/app/api/v1/scenes/route.ts`
3. `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/app/api/v1/photos/route.ts`
4. `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/app/api/v1/generations/route.ts`

**Example:** Auth Registration

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const user = await auth.api.signUpEmail({
      body: { email, password, name: email.split('@')[0] },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        credits: 3,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 400 }
    );
  }
}
```

---

## Phase 6: Environment & Configuration (Day 6)

### 6.1 Update Next.js Config

**File:** `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pawstudio.s3.eu-central-003.backblazeb2.com',
      },
    ],
  },
};

export default nextConfig;
```

### 6.2 Copy Backblaze Configuration

**Reference:** `/Users/loganmoyon/Documents/Dev/pawstudio/config/storage.yml`

**Copy to:** `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/.env.local`

```bash
B2_APPLICATION_KEY_ID="003dc8d882eef040000000003"
B2_APPLICATION_KEY="K003k0uFW+wG/lkj+1lYbNPcLa3spw4"
B2_BUCKET_NAME="pawstudio"
B2_BUCKET_ID="dc8d882eef04027cf5470d14"
B2_ENDPOINT="https://s3.eu-central-003.backblazeb2.com"
```

### 6.3 Copy Stripe Configuration

**Reference:** `/Users/loganmoyon/Documents/Dev/pawstudio/app/controllers/credits_controller.rb`

**Copy webhook secret and keys to:** `.env.local`

---

## Phase 7: Testing & Deployment (Day 7)

### 7.1 Test Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Dashboard displays correctly
- [ ] Photo upload works
- [ ] Photo library shows migrated photos
- [ ] Scene selection shows all scenes
- [ ] Generation flow works end-to-end
- [ ] Credits deduct properly
- [ ] Stripe payment works
- [ ] Admin panel accessible
- [ ] Mobile API endpoints respond correctly

### 7.2 Deploy to Vercel

```bash
cd /Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend
vercel --prod
```

### 7.3 Configure Vercel Environment Variables

Add all `.env.local` variables to Vercel dashboard:
- DATABASE_URL
- BETTER_AUTH_SECRET
- BETTER_AUTH_URL
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- B2_* variables
- GOOGLE_GEMINI_API_KEY

---

## Design & UI/UX Guidelines

### Color Scheme (from Rails)

**Reference:** `/Users/loganmoyen/Documents/Dev/pawstudio/app/views/layouts/application.html.erb`

```css
/* Primary Colors */
--orange-500: #f97316
--orange-600: #ea580c
--red-500: #ef4444
--red-600: #dc2626

/* Gradients */
--gradient-primary: linear-gradient(to right, #f97316, #ef4444)
--gradient-hero: linear-gradient(to bottom right, #1f2937, #ea580c, #dc2626)

/* Backgrounds */
--bg-orange-50: #fff7ed
--bg-gray-50: #f9fafb
--bg-gray-800: #1f2937
```

### Typography

**Reference:** Rails uses default system fonts
- Font Family: `font-sans` (Inter, system-ui)
- Headings: `font-bold`
- Body: `font-normal`

### Component Styling Patterns

#### 1. Dashboard Hero Section
**Reference:** `/Users/loganmoyon/Documents/Dev/pawstudio/app/views/dashboard/index.html.erb` (lines 2-16)

```tsx
<div className="relative overflow-hidden bg-gradient-to-br from-gray-800 via-orange-800 to-red-800">
  <div className="absolute inset-0 bg-black/20"></div>
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50/5 to-transparent"></div>
  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
    <div className="text-center text-white">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
        Your studio awaits, {userName}
      </h1>
      <p className="text-xl sm:text-2xl text-orange-100 max-w-3xl mx-auto leading-relaxed">
        What masterpiece will you create today?
      </p>
    </div>
  </div>
</div>
```

#### 2. Buttons

**Primary Button (Generate, Start):**
```tsx
<Button className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-xl hover:shadow-orange-500/25 transform hover:scale-[1.02] transition-all duration-300">
  Generate My Pet Photo
</Button>
```

**Secondary Button:**
```tsx
<Button className="bg-orange-600 text-white py-3 px-6 rounded-2xl font-semibold hover:bg-orange-700 transition-colors">
  Get Credits
</Button>
```

**Outline Button:**
```tsx
<Button variant="outline" className="border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
  Cancel
</Button>
```

#### 3. Cards

**Main Cards:**
```tsx
<Card className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Image Cards (Gallery):**
```tsx
<Card className="group relative bg-white rounded-2xl p-4 shadow-lg border border-gray-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300">
  <div className="aspect-square rounded-xl mb-4 overflow-hidden">
    <Image className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
  </div>
</Card>
```

#### 4. Scene/Filter Selection Cards

**Reference:** `/Users/loganmoyon/Documents/Dev/pawstudio/app/views/dashboard/index.html.erb` (lines 116-178)

```tsx
<div className="scene-card cursor-pointer group" onClick={handleSelect}>
  <div className="aspect-square bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 relative border border-gray-100">
    <Image className="w-full h-full object-cover" />

    {/* Hover overlay */}
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex items-end rounded-xl">
      <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="font-semibold text-sm">{sceneName}</div>
        <div className="text-xs text-white/80 line-clamp-2 mt-1">{description}</div>
      </div>
    </div>

    {/* Selection indicator */}
    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center text-sm font-bold opacity-0 scale-0 group-[.selected]:opacity-100 group-[.selected]:scale-100 transition-all duration-200 shadow-lg">
      ✓
    </div>
  </div>
</div>
```

#### 5. Category Tabs

**Reference:** `/Users/loganmoyon/Documents/Dev/pawstudio/app/views/dashboard/index.html.erb` (lines 86-112)

```tsx
{/* Active Tab */}
<Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-sm">
  All
</Button>

{/* Inactive Tab */}
<Button className="bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
  Professional ✨
</Button>
```

#### 6. Upload Dropzone

**Reference:** `/Users/loganmoyon/Documents/Dev/pawstudio/app/views/dashboard/index.html.erb` (lines 33-69)

```tsx
<div className="border-2 border-dashed border-orange-300 rounded-2xl p-8 text-center hover:border-orange-400 hover:bg-orange-50/50 transition-all duration-300">
  <svg className="mx-auto w-16 h-16 text-orange-400 mb-4" />
  <p className="text-lg font-semibold text-gray-900 mb-2">
    Drag & drop your photo here
  </p>
  <p className="text-gray-500">or click to browse</p>
</div>
```

#### 7. Photo Preview with Overlay

```tsx
<div className="relative group cursor-pointer">
  <Image className="w-full h-80 object-cover rounded-2xl shadow-lg" />

  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex flex-col justify-between p-6">
    <div className="text-white">
      <h3 className="font-semibold text-lg mb-1">{fileName}</h3>
      <p className="text-white/70 text-sm">{fileSize}</p>
    </div>

    <div className="flex justify-center">
      <Button className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors">
        📷 Change Photo
      </Button>
    </div>
  </div>
</div>
```

#### 8. Loading States

**Processing Animation:**
```tsx
<div className="text-center py-8">
  <div className="animate-spin w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full mx-auto mb-6"></div>
  <h3 className="text-xl font-bold text-gray-900 mb-2">Creating Your Magic ✨</h3>
  <p className="text-gray-600 mb-6">Our AI is working hard to transform your pet photo...</p>

  <div className="bg-gray-50 rounded-2xl p-4">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm text-gray-600">Processing time:</span>
      <span className="text-sm font-mono text-gray-900">{elapsed}s</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-1000" style={{width: `${progress}%`}}></div>
    </div>
  </div>
</div>
```

#### 9. Navigation

**Desktop Nav:**
```tsx
<nav className="bg-white border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      <div className="flex items-center">
        <span className="text-2xl">🐾</span>
        <span className="ml-2 text-xl font-bold text-gray-900">PawStudio</span>
      </div>
      <div className="flex items-center space-x-4">
        <Link className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md">
          Dashboard
        </Link>
        <Link className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md">
          📸 Library
        </Link>
        <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
          💳 {credits} Credits
        </Button>
      </div>
    </div>
  </div>
</nav>
```

#### 10. Alerts & Notifications

**Error:**
```tsx
<div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-4">
  <div className="flex items-start">
    <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
    <div>
      <h3 className="font-semibold text-red-900 mb-1">Generation Failed</h3>
      <div className="text-sm text-red-700">{errorMessage}</div>
    </div>
  </div>
</div>
```

**Success:**
```tsx
<div className="bg-green-50 border border-green-200 rounded-2xl p-4">
  <div className="flex items-center text-green-800">
    <svg className="w-5 h-5 mr-2" />
    <span className="text-sm">Your credit has been refunded automatically.</span>
  </div>
</div>
```

**Info:**
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
  <div className="flex items-center text-blue-800">
    <svg className="w-5 h-5 mr-2" />
    <span className="text-sm">This usually takes 30-60 seconds</span>
  </div>
</div>
```

### Layout Specifications

**Container Widths:**
- Small content: `max-w-4xl`
- Main content: `max-w-7xl`
- Full width: `w-full`

**Spacing:**
- Section padding: `py-12` or `py-16`
- Card padding: `p-8`
- Element gaps: `gap-6` or `gap-8`

**Border Radius:**
- Large cards: `rounded-3xl`
- Medium elements: `rounded-2xl`
- Small elements: `rounded-xl`
- Buttons: `rounded-2xl` or `rounded-xl`

**Shadows:**
- Cards: `shadow-xl`
- Hover: `hover:shadow-xl`
- Buttons: `shadow-lg`

### Responsive Breakpoints

```tsx
// Mobile first approach
<div className="
  grid
  grid-cols-1
  sm:grid-cols-2
  md:grid-cols-3
  lg:grid-cols-4
  gap-4
  sm:gap-6
">
```

**Rails breakpoints:**
- `sm:` 640px (mobile landscape)
- `md:` 768px (tablet)
- `lg:` 1024px (desktop)
- `xl:` 1280px (large desktop)

### Animation & Transitions

**Standard transition:**
```tsx
className="transition-all duration-300"
```

**Hover scale:**
```tsx
className="transform hover:scale-[1.02] transition-transform duration-300"
```

**Fade in/out:**
```tsx
className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
```

**Slide:**
```tsx
className="translate-x-0 hover:translate-x-1 transition-transform"
```

### Icons

**Rails uses emojis for icons:**
- 🐾 Logo
- 📸 Camera/Photos
- 💳 Credits
- ✨ AI/Magic
- 🚀 Launch/Start
- ❄️ Winter
- 🌸 Spring
- 🍂 Autumn
- 🌅 Beach
- 🎭 Professional
- 👑 Elegant

**When using Lucide icons in Next.js, maintain similar visual weight:**
```tsx
import { Camera, CreditCard, Sparkles, Rocket } from 'lucide-react';
<Camera className="w-5 h-5" />
```

### Tailwind Config for Rails Colors

**File:** `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Match Rails orange-red theme
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Primary orange
          600: '#ea580c', // Hover orange
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      boxShadow: {
        'orange-glow': '0 0 20px rgba(249, 115, 22, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
```

### Component File Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── dashboard/
│   │   ├── hero-section.tsx   # Dashboard hero
│   │   ├── stats-cards.tsx    # Credit/stats cards
│   │   └── gallery-grid.tsx   # Recent images grid
│   ├── editor/
│   │   ├── upload-zone.tsx    # Drag & drop upload
│   │   ├── scene-selector.tsx # Scene selection grid
│   │   ├── category-tabs.tsx  # Category filter tabs
│   │   └── processing.tsx     # Loading/processing state
│   ├── library/
│   │   ├── photo-grid.tsx     # Library photo grid
│   │   └── photo-card.tsx     # Individual photo card
│   └── shared/
│       ├── navbar.tsx         # Top navigation
│       └── credits-badge.tsx  # Credits display
```

### Design Principles from Rails

1. **Warm, friendly colors** - Orange/red gradients create excitement
2. **Rounded corners** - Everything uses large border radius (rounded-2xl, rounded-3xl)
3. **Generous spacing** - Lots of padding and white space
4. **Smooth animations** - All interactions have transitions
5. **Clear hierarchy** - Large headings, clear CTAs
6. **Emoji enhancement** - Emojis add personality without overwhelming
7. **Shadow depth** - Cards have prominent shadows for depth
8. **Hover feedback** - Everything interactive shows hover state

### Key UX Patterns to Preserve

1. **Dashboard flow:** Hero → Stats → Gallery
2. **Generation flow:** Upload → Scene Selection → Processing → Result
3. **Tab switching:** Smooth transitions between Upload/Library
4. **Scene selection:** Grid with category filtering
5. **Photo preview:** Large preview with overlay actions
6. **Loading states:** Animated spinner + progress bar
7. **Error handling:** Inline errors with auto-refund messaging
8. **Credits display:** Always visible in nav + modal for purchase

---

## Post-Migration Tasks

### Clean Up Rails Project

**Optional:** Archive the Rails project
```bash
mv /Users/loganmoyon/Documents/Dev/pawstudio /Users/loganmoyon/Documents/Dev/pawstudio_backup
```

### User Communication

**Important:** Users will need to:
1. **Reset their passwords** (Better-Auth uses different hashing)
2. **Re-link payment methods** (test Stripe integration)

**Send migration email:**
```
Subject: PawStudio Platform Upgrade

We've upgraded PawStudio to a faster, more reliable platform!

What's New:
- Faster photo processing
- Better mobile experience
- Enhanced admin tools

Action Required:
- Please reset your password: [link]
- Your credits and photos have been migrated

Questions? Contact support@pawstudio.com
```

---

## Rollback Plan

If migration fails, you can rollback:

1. **Keep Rails running** until Next.js is fully tested
2. **Run both in parallel** during transition period
3. **DNS cutover** only after 100% confidence

**Emergency rollback:**
```bash
# Point DNS back to Digital Ocean Rails app
# Rails app is still deployed and running
```

---

## Key File Locations Reference

### Rails Project (Source)
- Main: `/Users/loganmoyon/Documents/Dev/pawstudio`
- Schema: `/Users/loganmoyon/Documents/Dev/pawstudio/db/schema.rb`
- Models: `/Users/loganmoyon/Documents/Dev/pawstudio/app/models/`
- Controllers: `/Users/loganmoyon/Documents/Dev/pawstudio/app/controllers/`
- Views: `/Users/loganmoyon/Documents/Dev/pawstudio/app/views/`
- Config: `/Users/loganmoyon/Documents/Dev/pawstudio/config/`

### Next.js Project (Destination)
- Main: `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend`
- App Router: `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/app`
- Components: `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/components`
- Lib: `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/lib`
- Types: `/Users/loganmoyon/Documents/Dev/PawStudio_Mobile_NextJS/frontend/src/types`

---

## Success Criteria

- ✅ All users migrated
- ✅ All photos accessible (7 from Backblaze)
- ✅ All scenes working (10+ scenes)
- ✅ Credit balances preserved
- ✅ Payment methods working
- ✅ Mobile API functional
- ✅ Admin panel accessible
- ✅ Performance improved over Rails
- ✅ Zero downtime deployment

---

## Timeline Summary

| Day | Focus | Estimated Hours |
|-----|-------|----------------|
| 1 | Database schema + migration | 8h |
| 2 | Better-Auth setup | 6h |
| 3 | Photo library feature | 6h |
| 4 | Dynamic scenes | 4h |
| 5 | Mobile API endpoints | 6h |
| 6 | Configuration & testing | 8h |
| 7 | Deployment & verification | 4h |

**Total:** ~42 hours (~5-6 working days)

---

## Notes

- **Database:** Keep old Neon database as backup for 30 days
- **Photos:** Already in Backblaze, just update references
- **Users:** Will need password reset (Better-Auth incompatible with Devise)
- **Stripe:** Customers preserved, test webhooks thoroughly
- **Mobile:** React Native app can use same Next.js API

---

## Support

If you encounter issues during migration:
1. Check Better-Auth docs: https://better-auth.com
2. Check Neon docs: https://neon.tech/docs
3. Preserve Rails backup for emergency rollback
4. Test thoroughly in staging before production cutover
