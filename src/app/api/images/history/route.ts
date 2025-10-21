import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, sql } from '@/lib/db'

const CDN_URL = process.env.CDN_URL || 'https://cdn.paw-studio.com';
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'pawstudio';

// Helper function to transform B2 URLs to CDN URLs
function transformToCDN(url: string): string {
  if (!url) return url;

  // Pattern: https://f003.backblazeb2.com/file/pawstudio/path/to/file.jpg
  // Transform to: https://cdn.paw-studio.com/path/to/file.jpg
  const b2Pattern = new RegExp(`https://f\\d+\\.backblazeb2\\.com/file/${B2_BUCKET_NAME}/(.+)`);
  const match = url.match(b2Pattern);

  if (match && match[1]) {
    return `${CDN_URL}/${match[1]}`;
  }

  // If already a CDN URL or unknown format, return as-is
  return url;
}

export async function GET(request: NextRequest) {
  try {
    // Try to get user from Better-Auth session first
    let userId: string | null = null;

    const session = await auth.api.getSession({ headers: request.headers });

    if (session && session.user) {
      userId = session.user.id;
    } else {
      // Fallback: Check for manually-created session (mobile Google auth)
      const cookieHeader = request.headers.get('cookie');

      if (cookieHeader) {
        const sessionTokenMatch = cookieHeader.match(/better-auth\.session_token=([^;]+)/);

        if (sessionTokenMatch) {
          const sessionToken = sessionTokenMatch[1];

          // Validate session token in database
          const [dbSession] = await sql`
            SELECT user_id, expires_at
            FROM sessions
            WHERE token = ${sessionToken}
            AND expires_at > NOW()
          `;

          if (dbSession) {
            userId = dbSession.user_id;
          }
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch user's image history
    const images = await db.getImagesByUserId(userId, limit, offset)

    // Handle null/undefined (shouldn't happen with || [] in db function, but be safe)
    if (!images) {
      return NextResponse.json({
        success: true,
        images: [],
        total: 0
      })
    }

    // Transform the data to match frontend expectations
    const processedImages = images.map(image => ({
      id: image.id,
      originalUrl: transformToCDN(image.original_url),
      processedUrl: transformToCDN(image.processed_url),
      filterId: image.filter_type,
      filterName: getFilterName(image.filter_type),
      createdAt: image.created_at,
      processedAt: image.processed_at,
      userId: image.user_id
    }))

    return NextResponse.json({
      success: true,
      images: processedImages,
      total: processedImages.length
    })

  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch image history' }, 
      { status: 500 }
    )
  }
}

function getFilterName(filterId: string): string {
  const filterNames: Record<string, string> = {
    'studio_bw': 'Studio Black & White',
    'painted_portrait': 'Classic Painted Portrait',
    'pop_art': 'Pop Art Vibrant',
    'seasonal_winter': 'Winter Wonderland'
  }
  
  return filterNames[filterId] || filterId
}