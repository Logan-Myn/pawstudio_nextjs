import { NextRequest } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await verifyAdminAccess(request)

    // Get total and new users this month
    const [userStats] = await sql`
      SELECT
        COUNT(*)::int as total_users,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END)::int as new_users_this_month
      FROM users
    `

    // Get total and monthly processed images
    const [imageStats] = await sql`
      SELECT
        COUNT(*)::int as total_images,
        COUNT(CASE WHEN processed_at > NOW() - INTERVAL '30 days' THEN 1 END)::int as images_this_month
      FROM images
      WHERE processing_status = 'completed'
    `

    // Get total and monthly credits spent (usage transactions have negative amounts)
    const [creditStats] = await sql`
      SELECT
        COALESCE(SUM(ABS(amount)), 0)::int as total_credits_spent,
        COALESCE(SUM(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN ABS(amount) ELSE 0 END), 0)::int as credits_spent_this_month
      FROM credit_transactions
      WHERE transaction_type = 'usage'
    `

    // Get scene counts
    const [sceneStats] = await sql`
      SELECT
        COUNT(*)::int as total_scenes,
        COUNT(CASE WHEN active = true THEN 1 END)::int as active_scenes
      FROM scenes
    `

    // Get revenue stats (purchase transactions)
    const [revenueStats] = await sql`
      SELECT
        COALESCE(SUM(amount), 0)::int as total_credits_purchased,
        COALESCE(SUM(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0)::int as credits_purchased_this_month,
        COUNT(CASE WHEN transaction_type = 'purchase' THEN 1 END)::int as total_purchases,
        COUNT(CASE WHEN transaction_type = 'purchase' AND created_at > NOW() - INTERVAL '30 days' THEN 1 END)::int as purchases_this_month
      FROM credit_transactions
      WHERE transaction_type = 'purchase'
    `

    const stats = {
      totalUsers: userStats?.total_users || 0,
      newUsersThisMonth: userStats?.new_users_this_month || 0,
      totalImages: imageStats?.total_images || 0,
      imagesThisMonth: imageStats?.images_this_month || 0,
      totalCreditsSpent: creditStats?.total_credits_spent || 0,
      creditsSpentThisMonth: creditStats?.credits_spent_this_month || 0,
      totalScenes: sceneStats?.total_scenes || 0,
      activeScenes: sceneStats?.active_scenes || 0,
      totalCreditsPurchased: revenueStats?.total_credits_purchased || 0,
      creditsPurchasedThisMonth: revenueStats?.credits_purchased_this_month || 0,
      totalPurchases: revenueStats?.total_purchases || 0,
      purchasesThisMonth: revenueStats?.purchases_this_month || 0,
    }

    return new Response(
      JSON.stringify({ success: true, stats }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Stats API error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('permissions') ? 403 :
                  message.includes('session') ? 401 : 500
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
