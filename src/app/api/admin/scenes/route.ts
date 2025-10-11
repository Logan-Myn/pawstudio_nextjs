import { NextRequest } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin'
import { db } from '@/lib/db'

// GET /api/admin/scenes - List all scenes (admin only)
export async function GET(request: NextRequest) {
  try {
    await verifyAdminAccess(request)

    const scenes = await db.getAllScenes()

    if (!scenes) {
      console.error('Failed to fetch scenes')
      return new Response(
        JSON.stringify({ error: 'Failed to fetch scenes' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const formattedScenes = scenes.map(scene => ({
      id: scene.id,
      name: scene.name,
      description: scene.description,
      promptTemplate: scene.prompt,
      creditCost: scene.credit_cost || 1,
      category: scene.category || null,
      imageReference: scene.preview_image || null,
      isActive: scene.active,
      displayOrder: scene.display_order || 0,
      usageCount: scene.usage_count || 0,
      createdAt: scene.created_at,
      updatedAt: scene.updated_at || scene.created_at
    }))

    return new Response(
      JSON.stringify({ success: true, scenes: formattedScenes }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Scenes API error:', error)
    const status = error.message?.includes('permissions') ? 403 : 
                  error.message?.includes('token') ? 401 : 500
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// POST /api/admin/scenes - Create new scene
export async function POST(request: NextRequest) {
  try {
    await verifyAdminAccess(request)
    const body = await request.json()
    const { name, description, creditCost, promptTemplate, imageReference, isActive = true } = body

    // Validation
    if (!name || !description || !promptTemplate) {
      return new Response(
        JSON.stringify({ error: 'Name, description, and prompt template are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (creditCost < 0) {
      return new Response(
        JSON.stringify({ error: 'Credit cost must be non-negative' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create new scene
    const newScene = await db.createScene({
      name,
      description,
      prompt: promptTemplate,
      credit_cost: creditCost || 1,
      preview_image: imageReference || null,
      active: isActive,
      displayOrder: 0
    })

    if (!newScene) {
      console.error('Failed to create scene')
      return new Response(
        JSON.stringify({ error: 'Failed to create scene' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const formattedScene = {
      id: newScene.id,
      name: newScene.name,
      description: newScene.description,
      creditCost: newScene.credit_cost,
      isActive: newScene.active,
      promptTemplate: newScene.prompt,
      imageReference: newScene.preview_image || null,
      createdAt: newScene.created_at
    }

    return new Response(
      JSON.stringify({ success: true, scene: formattedScene }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Scene creation error:', error)
    const status = error.message?.includes('permissions') ? 403 : 
                  error.message?.includes('token') ? 401 : 500
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}