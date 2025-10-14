import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

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
    // Get user from Better-Auth session
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('Fetching photos for user:', userId);

    // Fetch user's uploaded photos from database using db helper
    const photosData = await db.getUserPhotos(userId);
    console.log('Photos found:', photosData.length);

    const photos = photosData.map(photo => ({
      id: photo.id,
      userId: photo.user_id,
      originalFilename: photo.original_filename,
      fileUrl: transformToCDN(photo.file_url),
      fileSize: photo.file_size,
      uploadedAt: photo.uploaded_at,
      createdAt: photo.created_at,
    }));

    return NextResponse.json({
      success: true,
      photos,
    });

  } catch (error) {
    console.error('Library fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photo library' },
      { status: 500 }
    );
  }
}
