import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { validateSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    console.log('🎫 /feedback/jwt GET - Starting...');

    // Validate session
    const userId = await validateSession(request);

    if (!userId) {
      console.log('❌ No userId found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', userId);

    // Get user data from database
    const userData = await db.getUserById(userId);

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get Featurebase JWT secret from environment
    const featurebaseSecret = process.env.FEATUREBASE_JWT_SECRET;

    if (!featurebaseSecret) {
      console.error('❌ FEATUREBASE_JWT_SECRET not configured');
      return NextResponse.json(
        { error: 'Feedback service not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Create JWT payload for Featurebase
    // According to Featurebase docs, the payload should include:
    // - email (required)
    // - userId (required)
    // - name (optional)
    // - profilePicture (optional)
    // - customFields (optional)
    const payload = {
      email: userData.email,
      userId: userData.id,
      name: userData.name || 'PawStudio User',
      customFields: {
        credits: userData.credits?.toString() || '0',
        role: userData.role || 'user',
      },
    };

    console.log('🔐 Creating JWT for user:', { userId: userData.id, email: userData.email });

    // Sign the JWT token
    // Featurebase uses HS256 algorithm by default
    const token = jwt.sign(payload, featurebaseSecret, {
      algorithm: 'HS256',
      expiresIn: '1h', // Token expires in 1 hour
    });

    console.log('✅ JWT created successfully');

    return NextResponse.json({
      token,
      expiresIn: 3600, // 1 hour in seconds
    });

  } catch (error) {
    console.error('Feedback JWT error:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback token' },
      { status: 500 }
    );
  }
}
