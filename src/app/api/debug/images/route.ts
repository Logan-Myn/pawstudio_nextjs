import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get user session
    let userId: string | null = null;
    const session = await auth.api.getSession({ headers: request.headers });

    if (session && session.user) {
      userId = session.user.id;
    } else {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const sessionTokenMatch = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
        if (sessionTokenMatch) {
          const sessionToken = sessionTokenMatch[1];
          const [dbSession] = await sql`
            SELECT user_id FROM sessions
            WHERE token = ${sessionToken} AND expires_at > NOW()
          `;
          if (dbSession) userId = dbSession.user_id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get ALL images for this user (no filters)
    const allImages = await sql`
      SELECT
        id,
        user_id,
        original_url,
        processed_url,
        filter_type,
        processing_status,
        created_at,
        processed_at
      FROM images
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    // Get filtered images (what the history endpoint uses)
    const filteredImages = await sql`
      SELECT
        id,
        user_id,
        original_url,
        processed_url,
        filter_type,
        processing_status,
        created_at,
        processed_at
      FROM images
      WHERE user_id = ${userId}
        AND processed_url IS NOT NULL
        AND processing_status = 'completed'
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      userId,
      allImagesCount: allImages.length,
      filteredImagesCount: filteredImages.length,
      allImages: allImages,
      filteredImages: filteredImages,
      difference: allImages.filter(img =>
        !filteredImages.find(fimg => fimg.id === img.id)
      )
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Failed to fetch debug data' }, { status: 500 })
  }
}
