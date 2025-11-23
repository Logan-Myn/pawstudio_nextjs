import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validateSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    console.log('✅ /auth/complete-trial POST - Starting...');

    // Validate session
    const userId = await validateSession(request);

    if (!userId) {
      console.log('❌ No userId found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('👤 User authenticated:', userId);

    // Update user to disable trial mode
    const [updatedUser] = await sql`
      UPDATE users
      SET trial_mode = false, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, email, name, credits, trial_mode, role, created_at, updated_at
    `;

    if (!updatedUser) {
      console.log('❌ Failed to update user');
      return NextResponse.json(
        { error: 'Failed to complete trial' },
        { status: 500 }
      );
    }

    console.log('✅ Trial mode disabled for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Trial completed successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        credits: updatedUser.credits,
        trialMode: updatedUser.trial_mode,
        role: updatedUser.role,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
      }
    });

  } catch (error) {
    console.error('❌ Complete trial error:', error);
    return NextResponse.json(
      { error: 'Failed to complete trial' },
      { status: 500 }
    );
  }
}
