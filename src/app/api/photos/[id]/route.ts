import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { validateSession } from '@/lib/session';

// Backblaze B2 configuration
const B2_KEY_ID = process.env.B2_APPLICATION_KEY_ID;
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY;
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'pawstudio';

interface BackblazeAuth {
  authorizationToken: string;
  apiUrl: string;
}

async function getB2Authorization(): Promise<BackblazeAuth> {
  const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${B2_KEY_ID}:${B2_APPLICATION_KEY}`).toString('base64')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to authorize with Backblaze B2');
  }

  const data = await response.json();
  return {
    authorizationToken: data.authorizationToken,
    apiUrl: data.apiUrl,
  };
}

async function deleteFromB2(fileName: string, authData: BackblazeAuth): Promise<void> {
  // First, get file information to get the fileId
  const listResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_list_file_names`, {
    method: 'POST',
    headers: {
      'Authorization': authData.authorizationToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bucketId: process.env.B2_BUCKET_ID,
      startFileName: fileName,
      maxFileCount: 1,
      prefix: fileName,
    }),
  });

  if (!listResponse.ok) {
    console.error('Failed to list file in B2');
    return;
  }

  const listData = await listResponse.json();
  const file = listData.files?.[0];

  if (!file || file.fileName !== fileName) {
    console.log('File not found in B2, may have been already deleted');
    return;
  }

  // Delete the file using fileId
  const deleteResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_delete_file_version`, {
    method: 'POST',
    headers: {
      'Authorization': authData.authorizationToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileId: file.fileId,
      fileName: file.fileName,
    }),
  });

  if (!deleteResponse.ok) {
    const errorText = await deleteResponse.text();
    console.error('Failed to delete file from B2:', errorText);
    throw new Error('Failed to delete file from Backblaze B2');
  }

  console.log('✅ File deleted from B2:', fileName);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const photoId = parseInt(id);

    if (isNaN(photoId)) {
      return NextResponse.json({ error: 'Invalid photo ID' }, { status: 400 });
    }

    // Validate session
    const userId = await validateSession(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get photo details before deleting to extract B2 filename
    const [photo] = await sql`
      SELECT * FROM photos
      WHERE id = ${photoId} AND user_id = ${userId}
    `;

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found or unauthorized' }, { status: 404 });
    }

    // Extract B2 filename from URL
    // URL format: https://cdn.paw-studio.com/users/{userId}/uploads/{timestamp}-{random}.{ext}
    // or: https://f003.backblazeb2.com/file/pawstudio/users/{userId}/uploads/{timestamp}-{random}.{ext}
    let b2FileName = '';
    try {
      const url = new URL(photo.file_url);
      // Extract path after domain, removing leading slash and bucket name if present
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'file' && pathParts[1] === B2_BUCKET_NAME) {
        // B2 direct URL format
        b2FileName = pathParts.slice(2).join('/');
      } else {
        // CDN URL format
        b2FileName = pathParts.join('/');
      }
    } catch (error) {
      console.error('Failed to parse photo URL:', error);
    }

    // Delete from Backblaze B2
    if (b2FileName) {
      try {
        const authData = await getB2Authorization();
        await deleteFromB2(b2FileName, authData);
      } catch (b2Error) {
        console.error('B2 deletion error (continuing with DB deletion):', b2Error);
        // Continue with DB deletion even if B2 deletion fails
      }
    }

    // Delete the photo from database (cascade will delete related generations)
    const deletedPhoto = await db.deletePhoto(photoId, userId);

    if (!deletedPhoto) {
      return NextResponse.json({ error: 'Photo not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    });

  } catch (error) {
    console.error('Photo deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
