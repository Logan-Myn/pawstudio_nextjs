import { NextRequest } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin'
import { sql } from '@/lib/db'

export interface ActivityEvent {
  id: string
  type: 'user_registered' | 'image_processed' | 'credits_purchased' | 'credits_used' | 'scene_created' | 'scene_updated'
  description: string
  user_email: string | null
  user_name: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export async function GET(request: NextRequest) {
  try {
    await verifyAdminAccess(request)

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build unified activity query from multiple sources
    let activities: ActivityEvent[] = []

    if (!type || type === 'user_registered') {
      const userRegistrations = await sql`
        SELECT
          'user_' || id as id,
          'user_registered' as type,
          'New user registered' as description,
          email as user_email,
          name as user_name,
          json_build_object('credits', credits, 'role', role) as metadata,
          created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
      activities = [...activities, ...userRegistrations]
    }

    if (!type || type === 'image_processed') {
      const imageProcessed = await sql`
        SELECT
          'img_' || i.id as id,
          'image_processed' as type,
          'Image processed with ' || i.filter_type as description,
          u.email as user_email,
          u.name as user_name,
          json_build_object(
            'filter_type', i.filter_type,
            'credits_used', COALESCE(i.credits_used, 1),
            'processing_status', i.processing_status
          ) as metadata,
          COALESCE(i.processed_at, i.created_at) as created_at
        FROM images i
        LEFT JOIN users u ON i.user_id = u.id
        WHERE i.processing_status = 'completed'
        ORDER BY COALESCE(i.processed_at, i.created_at) DESC
        LIMIT ${limit}
      `
      activities = [...activities, ...imageProcessed]
    }

    if (!type || type === 'credits_purchased') {
      const creditPurchases = await sql`
        SELECT
          'txn_' || ct.id as id,
          'credits_purchased' as type,
          'Purchased ' || ct.amount || ' credits' as description,
          u.email as user_email,
          u.name as user_name,
          json_build_object(
            'amount', ct.amount,
            'description', ct.description,
            'stripe_payment_intent_id', ct.stripe_payment_intent_id
          ) as metadata,
          ct.created_at
        FROM credit_transactions ct
        LEFT JOIN users u ON ct.user_id = u.id
        WHERE ct.transaction_type = 'purchase'
        ORDER BY ct.created_at DESC
        LIMIT ${limit}
      `
      activities = [...activities, ...creditPurchases]
    }

    if (!type || type === 'credits_used') {
      const creditUsage = await sql`
        SELECT
          'txn_' || ct.id as id,
          'credits_used' as type,
          'Used ' || ABS(ct.amount) || ' credit(s)' as description,
          u.email as user_email,
          u.name as user_name,
          json_build_object(
            'amount', ABS(ct.amount),
            'description', ct.description
          ) as metadata,
          ct.created_at
        FROM credit_transactions ct
        LEFT JOIN users u ON ct.user_id = u.id
        WHERE ct.transaction_type = 'usage'
        ORDER BY ct.created_at DESC
        LIMIT ${limit}
      `
      activities = [...activities, ...creditUsage]
    }

    if (!type || type === 'scene_created' || type === 'scene_updated') {
      const sceneChanges = await sql`
        SELECT
          'scene_' || id as id,
          CASE
            WHEN updated_at = created_at THEN 'scene_created'
            ELSE 'scene_updated'
          END as type,
          CASE
            WHEN updated_at = created_at THEN 'Scene "' || name || '" created'
            ELSE 'Scene "' || name || '" updated'
          END as description,
          NULL as user_email,
          NULL as user_name,
          json_build_object(
            'name', name,
            'category', category,
            'active', active,
            'usage_count', usage_count
          ) as metadata,
          GREATEST(created_at, updated_at) as created_at
        FROM scenes
        ORDER BY GREATEST(created_at, updated_at) DESC
        LIMIT ${limit}
      `
      activities = [...activities, ...sceneChanges]
    }

    // Sort all activities by created_at descending
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply pagination
    const paginatedActivities = activities.slice(offset, offset + limit)

    // Get total count for pagination
    const totalCount = activities.length

    return new Response(
      JSON.stringify({
        success: true,
        activities: paginatedActivities,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Activity API error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('permissions') ? 403 :
                  message.includes('session') ? 401 : 500
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
