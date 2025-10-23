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
    const imageId = parseInt(id);

    if (isNaN(imageId)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    // Validate session
    const userId = await validateSession(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get image details before deleting to extract B2 filenames
    const [image] = await sql`
      SELECT * FROM images
      WHERE id = ${imageId} AND user_id = ${userId}
    `;

    if (!image) {
      return NextResponse.json({ error: 'Image not found or unauthorized' }, { status: 404 });
    }

    // Extract B2 filenames from URLs
    const extractB2FileName = (url: string): string => {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts[0] === 'file' && pathParts[1] === B2_BUCKET_NAME) {
          return pathParts.slice(2).join('/');
        } else {
          return pathParts.join('/');
        }
      } catch (error) {
        console.error('Failed to parse URL:', error);
        return '';
      }
    };

    // Get B2 authorization once
    let authData: BackblazeAuth | null = null;
    try {
      authData = await getB2Authorization();
    } catch (authError) {
      console.error('Failed to get B2 authorization:', authError);
    }

    // Delete processed image from B2
    if (image.processed_url && authData) {
      const processedFileName = extractB2FileName(image.processed_url);
      if (processedFileName) {
        try {
          await deleteFromB2(processedFileName, authData);
        } catch (b2Error) {
          console.error('B2 deletion error for processed image (continuing):', b2Error);
        }
      }
    }

    // Delete original image from B2 (if not referenced by other images)
    if (image.original_url && authData) {
      // Check if other images reference this original URL
      const [otherImage] = await sql`
        SELECT id FROM images
        WHERE original_url = ${image.original_url}
        AND id != ${imageId}
        LIMIT 1
      `;

      // Only delete if no other images reference this original
      if (!otherImage) {
        const originalFileName = extractB2FileName(image.original_url);
        if (originalFileName) {
          try {
            await deleteFromB2(originalFileName, authData);
          } catch (b2Error) {
            console.error('B2 deletion error for original image (continuing):', b2Error);
          }
        }
      } else {
        console.log('Original image still referenced by other generations, keeping it');
      }
    }

    // Delete the image from database
    await sql`
      DELETE FROM images
      WHERE id = ${imageId} AND user_id = ${userId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });

  } catch (error) {
    console.error('Image deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
