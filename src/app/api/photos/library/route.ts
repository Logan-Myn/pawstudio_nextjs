import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

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
      fileUrl: photo.file_url,
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
