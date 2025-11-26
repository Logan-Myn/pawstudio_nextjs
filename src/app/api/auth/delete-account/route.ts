import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { validateSession } from '@/lib/session';

// Backblaze B2 configuration
const B2_KEY_ID = process.env.B2_APPLICATION_KEY_ID;
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY;
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'pawstudio';
const CDN_URL = process.env.CDN_URL || 'https://cdn.paw-studio.com';

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

async function deleteFromB2(fileName: string, authData: BackblazeAuth): Promise<boolean> {
  try {
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
      console.error('Failed to list file in B2:', fileName);
      return false;
    }

    const listData = await listResponse.json();
    const file = listData.files?.[0];

    if (!file || file.fileName !== fileName) {
      console.log('File not found in B2, may have been already deleted:', fileName);
      return true; // Consider it a success if file doesn't exist
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
      console.error('Failed to delete file from B2:', fileName, errorText);
      return false;
    }

    console.log('✅ File deleted from B2:', fileName);
    return true;
  } catch (error) {
    console.error('Error deleting file from B2:', fileName, error);
    return false;
  }
}

function extractB2FileName(fileUrl: string): string {
  try {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (pathParts[0] === 'file' && pathParts[1] === B2_BUCKET_NAME) {
      // B2 direct URL format: /file/pawstudio/users/{userId}/...
      return pathParts.slice(2).join('/');
    } else {
      // CDN URL format: /users/{userId}/...
      return pathParts.join('/');
    }
  } catch (error) {
    console.error('Failed to parse URL:', fileUrl, error);
    return '';
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Validate session
    const userId = await validateSession(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user info for logging
    const user = await db.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`🗑️ Starting account deletion for user: ${user.email} (${userId})`);

    // Step 1: Get all user's photos from database
    const photos = await sql`
      SELECT id, file_url FROM photos WHERE user_id = ${userId}
    `;

    // Step 2: Get all user's generated images from database
    const images = await sql`
      SELECT id, original_url, processed_url FROM images WHERE user_id = ${userId}
    `;

    // Step 3: Delete all files from Backblaze B2
    const filesToDelete: string[] = [];

    // Collect photo URLs
    for (const photo of photos) {
      if (photo.file_url) {
        const fileName = extractB2FileName(photo.file_url);
        if (fileName) {
          filesToDelete.push(fileName);
        }
      }
    }

    // Collect image URLs (both original and processed)
    for (const image of images) {
      if (image.original_url) {
        const fileName = extractB2FileName(image.original_url);
        if (fileName) {
          filesToDelete.push(fileName);
        }
      }
      if (image.processed_url) {
        const fileName = extractB2FileName(image.processed_url);
        if (fileName) {
          filesToDelete.push(fileName);
        }
      }
    }

    // Remove duplicates (some original_urls might be shared)
    const uniqueFiles = [...new Set(filesToDelete)];

    console.log(`📁 Found ${uniqueFiles.length} files to delete from B2`);

    // Delete files from B2 if there are any
    if (uniqueFiles.length > 0) {
      try {
        const authData = await getB2Authorization();

        // Delete files in batches to avoid overwhelming B2
        const batchSize = 10;
        let deletedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < uniqueFiles.length; i += batchSize) {
          const batch = uniqueFiles.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(fileName => deleteFromB2(fileName, authData))
          );

          deletedCount += results.filter(r => r).length;
          failedCount += results.filter(r => !r).length;
        }

        console.log(`✅ B2 cleanup complete: ${deletedCount} deleted, ${failedCount} failed`);
      } catch (b2Error) {
        console.error('B2 cleanup error (continuing with DB deletion):', b2Error);
        // Continue with database deletion even if B2 cleanup fails
        // This ensures the user can still delete their account
      }
    }

    // Step 4: Delete user from database (CASCADE will handle related tables)
    // The CASCADE constraints will automatically delete:
    // - sessions
    // - accounts (OAuth connections)
    // - photos
    // - images
    // - credit_transactions
    // - payment_methods
    const deletedUser = await db.deleteUser(userId);

    if (!deletedUser) {
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    console.log(`✅ Account deleted successfully: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
      deletedFiles: uniqueFiles.length,
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

// POST method for confirmation step (optional - requires password for email users)
export async function POST(request: NextRequest) {
  try {
    // Validate session
    const userId = await validateSession(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { confirmation } = body;

    // Require explicit confirmation text
    if (confirmation !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Invalid confirmation. Please type "DELETE MY ACCOUNT" to confirm.' },
        { status: 400 }
      );
    }

    // Get user info
    const user = await db.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return account summary before deletion
    const [photoCount] = await sql`
      SELECT COUNT(*) as count FROM photos WHERE user_id = ${userId}
    `;

    const [imageCount] = await sql`
      SELECT COUNT(*) as count FROM images WHERE user_id = ${userId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Confirmation accepted. Call DELETE to proceed with account deletion.',
      summary: {
        email: user.email,
        name: user.name,
        credits: user.credits,
        photosToDelete: parseInt(photoCount?.count || '0'),
        generatedImagesToDelete: parseInt(imageCount?.count || '0'),
        memberSince: user.created_at,
      }
    });

  } catch (error) {
    console.error('Account deletion confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to process confirmation' },
      { status: 500 }
    );
  }
}
