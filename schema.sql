-- PawStudio Database Schema for Neon + Better-Auth
-- Run this schema on the new Neon database

-- Better-Auth users table (with PawStudio custom fields)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  name TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Custom PawStudio fields
  credits INTEGER DEFAULT 0 NOT NULL,
  trial_mode BOOLEAN DEFAULT TRUE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin', 'super_admin'))
);

-- Better-Auth sessions table
CREATE TABLE IF NOT EXISTS sessions (
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
CREATE TABLE IF NOT EXISTS accounts (
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
  password TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Better-Auth verification tokens
CREATE TABLE IF NOT EXISTS verification_tokens (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Photos table (for user uploaded images)
CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON photos(uploaded_at);

-- Scenes table (AI filter configurations)
CREATE TABLE IF NOT EXISTS scenes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  category TEXT,
  credit_cost INTEGER DEFAULT 1 NOT NULL,
  preview_image TEXT,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  display_order INTEGER NOT NULL,
  usage_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenes_active ON scenes(active);
CREATE INDEX IF NOT EXISTS idx_scenes_category ON scenes(category);
CREATE INDEX IF NOT EXISTS idx_scenes_display_order ON scenes(display_order);
CREATE INDEX IF NOT EXISTS idx_scenes_active_display_order ON scenes(active, display_order);
CREATE INDEX IF NOT EXISTS idx_scenes_credit_cost ON scenes(credit_cost);

-- Images table (renamed from generations for clarity - tracks processed images)
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_id INTEGER REFERENCES photos(id) ON DELETE SET NULL,
  original_url TEXT NOT NULL,
  processed_url TEXT,
  filter_type TEXT NOT NULL,
  processing_status TEXT DEFAULT 'pending' NOT NULL,
  credits_used INTEGER DEFAULT 1 NOT NULL,
  processing_started_at TIMESTAMP,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_photo_id ON images(photo_id);
CREATE INDEX IF NOT EXISTS idx_images_processing_status ON images(processing_status);
CREATE INDEX IF NOT EXISTS idx_images_filter_type ON images(filter_type);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);

-- Credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'bonus')),
  amount INTEGER NOT NULL,
  description TEXT,
  stripe_payment_intent_id TEXT UNIQUE,
  payment_method_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe_payment_intent_id ON credit_transactions(stripe_payment_intent_id);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
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

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_payment_method_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id_is_default ON payment_methods(user_id, is_default);
