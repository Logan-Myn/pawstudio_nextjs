import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get user from Better-Auth session
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch user's image history
    const images = await db.getImagesByUserId(user.id, limit, offset)

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
      originalUrl: image.original_url,
      processedUrl: image.processed_url,
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