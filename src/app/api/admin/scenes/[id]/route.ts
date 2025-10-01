import { NextRequest } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin'
import { db } from '@/lib/db'

// PUT /api/admin/scenes/[id] - Update scene
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAdminAccess(request)
    const sceneId = params.id
    const body = await request.json()
    const { name, description, creditCost, promptTemplate, imageReference, isActive } = body

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

    // Check if scene exists
    const existingScene = await db.getSceneById(sceneId)

    if (!existingScene) {
      return new Response(
        JSON.stringify({ error: 'Scene not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update scene
    const updatedScene = await db.updateScene(sceneId, {
      name,
      description,
      credit_cost: creditCost,
      prompt_template: promptTemplate,
      image_reference: imageReference || null,
      is_active: isActive !== undefined ? isActive : existingScene.is_active
    })

    if (!updatedScene) {
      console.error('Failed to update scene')
      return new Response(
        JSON.stringify({ error: 'Failed to update scene' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const formattedScene = {
      id: updatedScene.id,
      name: updatedScene.name,
      description: updatedScene.description,
      creditCost: updatedScene.credit_cost,
      isActive: updatedScene.is_active,
      promptTemplate: updatedScene.prompt_template,
      imageReference: updatedScene.image_reference || null,
      createdAt: updatedScene.created_at
    }

    return new Response(
      JSON.stringify({ success: true, scene: formattedScene }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Scene update error:', error)
    const status = error.message?.includes('permissions') ? 403 : 
                  error.message?.includes('token') ? 401 : 500
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// DELETE /api/admin/scenes/[id] - Delete scene
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAdminAccess(request)
    const sceneId = params.id

    // Check if scene exists
    const existingScene = await db.getSceneById(sceneId)

    if (!existingScene) {
      return new Response(
        JSON.stringify({ error: 'Scene not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if scene is being used in any images
    const usedImages = await db.getImagesByFilterType(sceneId, 1)

    if (!usedImages) {
      console.error('Failed to check scene usage')
      return new Response(
        JSON.stringify({ error: 'Failed to verify scene usage' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (usedImages && usedImages.length > 0) {
      // Instead of hard delete, soft delete by setting is_active to false
      const deactivated = await db.updateScene(sceneId, { is_active: false })

      if (!deactivated) {
        console.error('Failed to deactivate scene')
        return new Response(
          JSON.stringify({ error: 'Failed to deactivate scene' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Scene deactivated (has existing usage)'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Hard delete if not used
    const deleted = await db.deleteScene(sceneId)

    if (!deleted) {
      console.error('Failed to delete scene')
      return new Response(
        JSON.stringify({ error: 'Failed to delete scene' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Scene deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Scene deletion error:', error)
    const status = error.message?.includes('permissions') ? 403 : 
                  error.message?.includes('token') ? 401 : 500
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// GET /api/admin/scenes/[id] - Get specific scene
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAdminAccess(request)
    const sceneId = params.id

    const scene = await db.getSceneById(sceneId)

    if (!scene) {
      return new Response(
        JSON.stringify({ error: 'Scene not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const formattedScene = {
      id: scene.id,
      name: scene.name,
      description: scene.description,
      creditCost: scene.credit_cost,
      isActive: scene.is_active,
      promptTemplate: scene.prompt_template,
      imageReference: scene.image_reference || null,
      createdAt: scene.created_at
    }

    return new Response(
      JSON.stringify({ success: true, scene: formattedScene }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Scene fetch error:', error)
    const status = error.message?.includes('permissions') ? 403 : 
                  error.message?.includes('token') ? 401 : 500
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}