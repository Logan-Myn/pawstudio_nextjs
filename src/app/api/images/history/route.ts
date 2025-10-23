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

    // DEBUG: First check ALL images for this user
    const allUserImages = await sql`
      SELECT id, processing_status, processed_url IS NOT NULL as has_url, created_at
      FROM images
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10
    `;
    console.log('🔍 DEBUG: ALL images for user:', userId, '→', allUserImages.length, 'total images');
    console.log('🔍 DEBUG: Image details:', allUserImages.map(img => ({
      id: img.id,
      status: img.processing_status,
      has_url: img.has_url,
      created: img.created_at
    })));

    // Fetch user's image history
    console.log('📥 Fetching image history for user:', userId, { limit, offset })
    const images = await db.getImagesByUserId(userId, limit, offset)
    console.log('📊 Query result:', images ? `Found ${images.length} images` : 'No images found')

    if (images && images.length > 0) {
      console.log('🔍 First image sample:', {
        id: images[0].id,
        status: images[0].processing_status,
        hasProcessedUrl: !!images[0].processed_url,
        filterType: images[0].filter_type
      })
    }

    // Handle null/undefined (shouldn't happen with || [] in db function, but be safe)
    if (!images) {
      console.log('⚠️ No images array returned')
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

    console.log('✅ Returning', processedImages.length, 'processed images')

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