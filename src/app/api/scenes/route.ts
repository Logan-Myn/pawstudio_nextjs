import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/scenes - Public endpoint for listing active scenes
export async function GET(request: NextRequest) {
  try {
    const scenes = await db.getAllScenes()

    if (!scenes) {
      return NextResponse.json(
        { error: 'Failed to fetch scenes' },
        { status: 500 }
      )
    }

    // Filter only active scenes for public access
    const activeScenes = scenes.filter(scene => scene.active)

    // Format response to match mobile app expectations
    const formattedScenes = activeScenes.map(scene => ({
      id: scene.id,
      name: scene.name,
      description: scene.description,
      prompt: scene.prompt,
      category: scene.category || null,
      credit_cost: scene.credit_cost || 1,
      preview_image: scene.preview_image || null,
      active: scene.active,
      display_order: scene.display_order || 0,
      usage_count: scene.usage_count || 0,
      created_at: scene.created_at,
      updated_at: scene.updated_at || scene.created_at
    }))

    return NextResponse.json(formattedScenes)
  } catch (error: any) {
    console.error('Scenes API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
