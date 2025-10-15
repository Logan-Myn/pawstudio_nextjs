# RevenueCat Webhook Setup Guide

This guide will help you configure the RevenueCat webhook to automatically add credits when users purchase credit packages in the mobile app.

## Overview

The webhook system allows RevenueCat to notify your backend when purchases are completed, so credits can be automatically added to user accounts.

**Flow:**
```
User makes purchase → RevenueCat processes with Apple → Webhook sent to backend → Credits added to account
```

## Quick Setup Checklist

- [ ] Generate a webhook secret token
- [ ] Add `REVENUECAT_WEBHOOK_SECRET` to `.env.local`
- [ ] Deploy backend to production
- [ ] Configure webhook in RevenueCat dashboard
- [ ] Test with sandbox purchase

## Step-by-Step Instructions

### 1. Generate Webhook Secret

Generate a secure random string to use as your webhook secret. You can use:

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Generate a UUID
uuidgen
```

Copy the generated string - you'll need it for the next steps.

### 2. Add Secret to Environment Variables

Add the webhook secret to your backend `.env.local`:

```env
# RevenueCat Webhook
REVENUECAT_WEBHOOK_SECRET=your_generated_secret_here
```

**Important:** Keep this secret secure and don't commit it to version control!

### 3. Deploy Your Backend

Make sure your backend is deployed and publicly accessible:

```bash
# If using Vercel
vercel --prod

# Or your deployment method
```

Note the production URL (e.g., `https://your-app.vercel.app`).

### 4. Configure Webhook in RevenueCat Dashboard

1. Go to https://app.revenuecat.com/
2. Select your project: **PawStudio**
3. Navigate to **Project Settings** → **Integrations** → **Webhooks**
4. Click **+ Add Webhook**
5. Fill in the details:

   **Webhook URL:**
   ```
   https://your-production-domain.com/api/webhooks/revenuecat
   ```

   **Authorization Header:**
   ```
   Bearer YOUR_GENERATED_SECRET
   ```
   (Use the same secret from step 1)

   **Events to Send:**
   - ✅ `INITIAL_PURCHASE`
   - ✅ `NON_RENEWING_PURCHASE`
   - ✅ `RENEWAL` (optional, for future subscription support)

6. Click **Save**

### 5. Test the Webhook

#### Option A: Use RevenueCat Test Event

1. In RevenueCat dashboard, go to your webhook
2. Click **Send Test Event**
3. Check your backend logs to see if webhook was received

#### Option B: Make Sandbox Purchase

1. Build mobile app with development build
2. Sign in with sandbox Apple ID
3. Make a test purchase (starter/premium/ultimate)
4. Check backend logs for webhook processing
5. Verify credits were added to user account

## Product to Credit Mapping

The webhook automatically maps product IDs to credit amounts:

| Product ID | Credits | Display Name |
|------------|---------|--------------|
| `starter`  | 5       | starter(5)   |
| `premium`  | 20      | premium(20)  |
| `ultimate` | 50      | ultimate(50) |

This mapping is defined in `/src/app/api/webhooks/revenuecat/route.ts`.

## Webhook Endpoint Details

**Location:** `/src/app/api/webhooks/revenuecat/route.ts`

**What it does:**
1. Verifies webhook authenticity using Authorization header
2. Parses the event payload
3. Filters for credit-granting events
4. Gets user from database
5. Maps product ID to credit amount
6. Adds credits to user account
7. Records transaction in database

**Security features:**
- Authorization token verification
- Event type filtering
- Sandbox filtering in production
- User existence validation
- Transaction logging

## Testing Checklist

- [ ] Backend receives webhook test event
- [ ] Backend logs show successful processing
- [ ] Authorization verification works
- [ ] Unknown product IDs are rejected
- [ ] Credits are added to user account
- [ ] Transaction is recorded in database
- [ ] Sandbox events are filtered in production
- [ ] Multiple webhook calls don't duplicate credits (idempotency)

## Troubleshooting

### Webhook not receiving events

**Check:**
- Is backend deployed and running?
- Is webhook URL correct in RevenueCat dashboard?
- Is URL publicly accessible (not localhost)?
- Are firewall rules blocking RevenueCat?

**Test:**
```bash
# Test if your endpoint is accessible
curl -X POST https://your-domain.com/api/webhooks/revenuecat \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"event":{"type":"INITIAL_PURCHASE","app_user_id":"test"}}'
```

### Authorization errors (401)

**Causes:**
- Secret mismatch between `.env.local` and RevenueCat dashboard
- Missing "Bearer " prefix in Authorization header
- Secret not deployed (still using old environment variables)

**Fix:**
1. Verify secret matches exactly in both places
2. Ensure format is `Bearer YOUR_SECRET` (with space)
3. Redeploy backend after changing `.env.local`
4. Update webhook configuration in RevenueCat dashboard

### Credits not adding

**Check:**
1. Backend logs - is webhook being received?
2. Product ID - is it in `PRODUCT_CREDIT_MAPPING`?
3. User ID - does it match between app and database?
4. Database - does transaction record exist?

**Debug:**
```typescript
// Add extra logging in webhook route.ts
console.log('Webhook payload:', JSON.stringify(payload, null, 2));
console.log('User found:', user);
console.log('Credits to add:', creditsToAdd);
console.log('New balance:', newBalance);
```

### Duplicate credits being added

**Causes:**
- RevenueCat retrying webhook on non-200 response
- Multiple webhook configurations
- Webhook being triggered multiple times

**Solutions:**
1. Ensure webhook returns 200 status
2. Check for multiple webhooks in dashboard
3. Implement idempotency using `transaction_id`:

```typescript
// Check if transaction already processed
const existing = await db.getTransactionByPaymentId(event.transaction_id);
if (existing) {
  console.log('Transaction already processed, skipping');
  return NextResponse.json({ received: true, duplicate: true });
}
```

## Adding New Products

When you create new credit packages:

1. **Create product in RevenueCat dashboard** with appropriate product ID

2. **Update webhook mapping** in `/src/app/api/webhooks/revenuecat/route.ts`:
   ```typescript
   const PRODUCT_CREDIT_MAPPING: Record<string, number> = {
     'starter': 5,
     'premium': 20,
     'ultimate': 50,
     'mega': 100,      // Add new product
     'ultra': 500,     // Add new product
   }
   ```

3. **Deploy backend** with updated mapping

4. **Test** with sandbox purchase

## Monitoring

**Things to monitor:**
- Webhook success rate in RevenueCat dashboard
- Backend error logs for webhook failures
- Credit transaction records in database
- User credit balances after purchases

**Log examples to look for:**

**Success:**
```
📥 RevenueCat webhook received: { type: 'INITIAL_PURCHASE', userId: 'user123', productId: 'premium' }
✅ Credits added successfully: { userId: 'user123', creditsAdded: 20, newBalance: 25 }
```

**Errors:**
```
❌ Invalid webhook authorization
❌ Unknown product ID: invalid_product
❌ User not found: user123
❌ Failed to update user credits
```

## Security Best Practices

1. **Never commit secrets** - use environment variables
2. **Use strong webhook secret** - at least 32 characters
3. **Verify webhook signature** - always check Authorization header
4. **Validate user exists** - before adding credits
5. **Log all transactions** - for audit trail
6. **Filter sandbox in production** - prevent test transactions
7. **Implement rate limiting** - prevent abuse
8. **Monitor webhook calls** - detect unusual patterns

## Production Deployment

Before going live:

1. [ ] Generate production webhook secret
2. [ ] Add to production environment variables
3. [ ] Deploy backend to production
4. [ ] Configure webhook with production URL
5. [ ] Test with sandbox purchases
6. [ ] Test with real (small) purchase
7. [ ] Monitor logs for first few days
8. [ ] Set up alerts for webhook failures

## Environment Variables Reference

**Required:**
```env
REVENUECAT_WEBHOOK_SECRET=your_secure_random_string_here
```

**Optional (for debugging):**
```env
NODE_ENV=production  # Filters sandbox events
```

## Support

For webhook issues:
1. Check backend logs first
2. Review RevenueCat dashboard webhook logs
3. Test with "Send Test Event" in dashboard
4. Contact RevenueCat support if needed

## Summary

Once configured, the webhook system automatically:
- ✅ Receives purchase notifications from RevenueCat
- ✅ Verifies webhook authenticity
- ✅ Adds correct number of credits to user account
- ✅ Records transaction for audit trail
- ✅ Returns success to RevenueCat

Users will see their credits update automatically after purchase!
