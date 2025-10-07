import { NextRequest } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin'
import { db } from '@/lib/db'

// GET /api/admin/scenes - List all scenes (public endpoint for users to see available scenes)
export async function GET(request: NextRequest) {
  try {
    // No auth required - users need to see available scenes for photo generation
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
      prompt: scene.prompt_template,
      category: scene.category || null,
      preview_image: scene.image_reference || null,
      active: scene.is_active,
      display_order: scene.display_order || 0,
      usage_count: scene.usage_count || 0,
      created_at: scene.created_at,
      updated_at: scene.updated_at || scene.created_at
    }))

    return new Response(
      JSON.stringify(formattedScenes),
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

    // Generate a unique ID for the scene
    const sceneId = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)

    // Check if scene ID already exists
    const existingScene = await db.getSceneById(sceneId)

    if (existingScene) {
      return new Response(
        JSON.stringify({ error: 'A scene with this name already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create new scene
    const newScene = await db.createScene({
      id: sceneId,
      name,
      description,
      credit_cost: creditCost || 1,
      prompt_template: promptTemplate,
      image_reference: imageReference || null,
      is_active: isActive
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
      isActive: newScene.is_active,
      promptTemplate: newScene.prompt_template,
      imageReference: newScene.image_reference || null,
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