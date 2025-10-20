import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";
import { Pool } from "pg";
import { resend } from "./resend";

// Create a PostgreSQL connection pool for Better-Auth
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});

export const auth = betterAuth({
  database: pool,
  plugins: [
    expo({
      // Add mobile app scheme for trusted origins
      trustedOrigins: ["pawstudio://", "pawstudio://*"],
    }),
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      try {
        if (!process.env.RESEND_API_KEY) {
          console.error("Cannot send verification email: RESEND_API_KEY is not configured");
          return;
        }

        const { data, error } = await resend.emails.send({
          from: "PawStudio <account@paw-studio.com>",
          to: user.email,
          subject: "Verify your PawStudio account",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to PawStudio!</h2>
              <p style="color: #666; font-size: 16px;">
                Thank you for signing up. We're excited to help you transform your pet photos with AI-powered filters!
              </p>
              <p style="color: #666; font-size: 16px;">
                Please verify your email address by clicking the button below:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}"
                   style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Verify Email
                </a>
              </div>
              <p style="color: #999; font-size: 14px;">
                This link will expire in 24 hours for security reasons.
              </p>
              <p style="color: #999; font-size: 14px;">
                If you didn't create an account with PawStudio, you can safely ignore this email.
              </p>
            </div>
          `,
        });

        if (error) {
          console.error("Failed to send verification email:", error);
          return;
        }

        console.log("Verification email sent successfully:", data);
      } catch (error) {
        console.error("Error sending verification email:", error);
      }
    },
  },
  socialProviders: {
    google: {
      // Use web client for OAuth flow (iOS client is for mobile app only)
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectURI: `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`,
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache session in cookie for 5 minutes
    },
    modelName: "sessions",
    fields: {
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      userId: "user_id",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  user: {
    modelName: "users",
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    additionalFields: {
      credits: {
        type: "number",
        defaultValue: 3,
        required: false,
      },
      role: {
        type: "string",
        defaultValue: "user",
        required: false,
      },
      stripe_customer_id: {
        type: "string",
        required: false,
      },
    },
  },
  account: {
    modelName: "accounts",
    fields: {
      accountId: "account_id",
      providerId: "provider_id",
      userId: "user_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    modelName: "verification_tokens",
    fields: {
      identifier: "identifier",
      value: "value",
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  advanced: {
    database: {
      generateId: () => {
        // Generate user IDs with "user_" prefix to match our migration
        return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      },
    },
  },
});
