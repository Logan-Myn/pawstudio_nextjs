import { neon } from '@neondatabase/serverless';

const oldDbUrl = process.env.OLD_DATABASE_URL!;
const newDbUrl = process.env.NEW_DATABASE_URL!;

if (!oldDbUrl || !newDbUrl) {
  console.error('Error: OLD_DATABASE_URL and NEW_DATABASE_URL environment variables are required');
  process.exit(1);
}

async function migrateData() {
  const oldDb = neon(oldDbUrl);
  const newDb = neon(newDbUrl);

  console.log('🚀 Starting data migration from Rails to Next.js...\n');

  try {
    // 1. Migrate Users
    console.log('👤 Migrating users...');
    const users = await oldDb`SELECT * FROM users`;
    console.log(`Found ${users.length} users to migrate`);

    for (const user of users) {
      const userId = `user_${user.id}`; // Better-Auth uses string IDs with prefix

      await newDb`
        INSERT INTO users (id, email, name, credits, stripe_customer_id, role, created_at, updated_at)
        VALUES (
          ${userId},
          ${user.email},
          ${user.full_name || user.email.split('@')[0]},
          ${user.credits || 3},
          ${user.stripe_customer_id},
          ${user.admin ? 'admin' : 'user'},
          ${user.created_at},
          ${user.updated_at}
        )
        ON CONFLICT (id) DO NOTHING
      `;

      // Create password account entry (users will need to reset password)
      await newDb`
        INSERT INTO accounts (id, account_id, provider_id, user_id, created_at, updated_at)
        VALUES (
          ${`account_${user.id}`},
          ${user.email},
          'credential',
          ${userId},
          ${user.created_at},
          ${user.updated_at}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log('✅ Users migrated successfully\n');

    // 2. Migrate Scenes
    console.log('🎨 Migrating scenes...');
    const scenes = await oldDb`SELECT * FROM scenes`;
    console.log(`Found ${scenes.length} scenes to migrate`);

    for (const scene of scenes) {
      await newDb`
        INSERT INTO scenes (id, name, description, prompt, category, active, display_order, usage_count, created_at, updated_at)
        VALUES (
          ${scene.id},
          ${scene.name},
          ${scene.description},
          ${scene.prompt},
          ${scene.category},
          ${scene.active},
          ${scene.display_order},
          ${scene.usage_count || 0},
          ${scene.created_at},
          ${scene.updated_at}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log('✅ Scenes migrated successfully\n');

    // 3. Migrate Photos
    console.log('📸 Migrating photos...');
    const photos = await oldDb`SELECT * FROM photos`;
    console.log(`Found ${photos.length} photos to migrate`);

    for (const photo of photos) {
      const userId = `user_${photo.user_id}`;

      await newDb`
        INSERT INTO photos (id, user_id, original_filename, file_url, file_size, uploaded_at, created_at, updated_at)
        VALUES (
          ${photo.id},
          ${userId},
          ${photo.original_filename},
          ${photo.file_url},
          ${photo.file_size},
          ${photo.uploaded_at},
          ${photo.created_at},
          ${photo.updated_at}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log('✅ Photos migrated successfully\n');

    // 4. Migrate Generations (to images table)
    console.log('🖼️  Migrating generations to images table...');
    const generations = await oldDb`SELECT * FROM generations`;
    console.log(`Found ${generations.length} generations to migrate`);

    for (const generation of generations) {
      const userId = `user_${generation.user_id}`;

      await newDb`
        INSERT INTO images (id, user_id, photo_id, original_url, processed_url, filter_type, processing_status, credits_used, processing_started_at, processed_at, created_at, updated_at)
        VALUES (
          ${generation.id},
          ${userId},
          ${generation.photo_id},
          ${generation.original_url || ''},
          ${generation.result_image_url},
          ${generation.scene_type},
          ${generation.status},
          ${generation.credits_used || 1},
          ${generation.processing_started_at},
          ${generation.completed_at},
          ${generation.created_at},
          ${generation.updated_at}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log('✅ Generations migrated successfully\n');

    // 5. Migrate Credit Transactions
    console.log('💳 Migrating credit transactions...');
    const transactions = await oldDb`SELECT * FROM credit_transactions`;
    console.log(`Found ${transactions.length} transactions to migrate`);

    for (const transaction of transactions) {
      const userId = `user_${transaction.user_id}`;

      await newDb`
        INSERT INTO credit_transactions (id, user_id, transaction_type, amount, description, stripe_payment_intent_id, payment_method_id, created_at, updated_at)
        VALUES (
          ${transaction.id},
          ${userId},
          ${transaction.transaction_type},
          ${transaction.amount},
          ${transaction.description},
          ${transaction.stripe_payment_intent_id},
          ${transaction.payment_method_id},
          ${transaction.created_at},
          ${transaction.updated_at}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log('✅ Credit transactions migrated successfully\n');

    // 6. Migrate Payment Methods
    console.log('💰 Migrating payment methods...');
    const paymentMethods = await oldDb`SELECT * FROM payment_methods`;
    console.log(`Found ${paymentMethods.length} payment methods to migrate`);

    for (const pm of paymentMethods) {
      const userId = `user_${pm.user_id}`;

      await newDb`
        INSERT INTO payment_methods (id, user_id, stripe_payment_method_id, card_brand, card_last4, card_exp_month, card_exp_year, is_default, created_at, updated_at)
        VALUES (
          ${pm.id},
          ${userId},
          ${pm.stripe_payment_method_id},
          ${pm.card_brand},
          ${pm.card_last4},
          ${pm.card_exp_month},
          ${pm.card_exp_year},
          ${pm.is_default},
          ${pm.created_at},
          ${pm.updated_at}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log('✅ Payment methods migrated successfully\n');

    console.log('🎉 Migration complete! Summary:');
    console.log(`   - ${users.length} users`);
    console.log(`   - ${scenes.length} scenes`);
    console.log(`   - ${photos.length} photos`);
    console.log(`   - ${generations.length} generations`);
    console.log(`   - ${transactions.length} credit transactions`);
    console.log(`   - ${paymentMethods.length} payment methods`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrateData()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
