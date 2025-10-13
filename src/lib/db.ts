import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export { sql };

// Helper functions for common queries
export const db = {
  // User queries
  async getUserById(userId: string) {
    const [user] = await sql`
      SELECT id, email, name, credits, role, stripe_customer_id, created_at, updated_at
      FROM users
      WHERE id = ${userId}
    `;
    return user;
  },

  async updateUserCredits(userId: string, newCredits: number) {
    const [user] = await sql`
      UPDATE users
      SET credits = ${newCredits}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, credits
    `;
    return user;
  },

  async getUserCredits(userId: string): Promise<number> {
    const [result] = await sql`
      SELECT credits FROM users WHERE id = ${userId}
    `;
    return result?.credits || 0;
  },

  // Credit transaction queries
  async createCreditTransaction(
    userId: string,
    amount: number,
    type: 'purchase' | 'usage' | 'bonus',
    description: string,
    stripePaymentIntentId?: string
  ) {
    const [transaction] = await sql`
      INSERT INTO credit_transactions (user_id, amount, transaction_type, description, stripe_payment_intent_id)
      VALUES (${userId}, ${amount}, ${type}, ${description}, ${stripePaymentIntentId})
      RETURNING *
    `;
    return transaction;
  },

  async getCreditTransactions(userId: string, limit = 50) {
    const transactions = await sql`
      SELECT * FROM credit_transactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return transactions;
  },

  // Image queries
  async createImage(data: {
    userId: string;
    originalUrl: string;
    filterType: string;
    photoId?: number;
  }) {
    const [image] = await sql`
      INSERT INTO images (user_id, original_url, filter_type, photo_id, processing_status)
      VALUES (${data.userId}, ${data.originalUrl}, ${data.filterType}, ${data.photoId || null}, 'pending')
      RETURNING *
    `;
    return image;
  },

  async updateImage(imageId: number, data: {
    processedUrl?: string;
    processingStatus?: string;
    processedAt?: Date;
  }) {
    const [image] = await sql`
      UPDATE images
      SET
        processed_url = COALESCE(${data.processedUrl}, processed_url),
        processing_status = COALESCE(${data.processingStatus}, processing_status),
        processed_at = COALESCE(${data.processedAt?.toISOString()}, processed_at),
        updated_at = NOW()
      WHERE id = ${imageId}
      RETURNING *
    `;
    return image;
  },

  async updateImageByOriginalUrl(userId: string, originalUrl: string, data: {
    processedUrl?: string;
    processingStatus?: string;
    processedAt?: Date;
    filterType?: string;
  }) {
    const [image] = await sql`
      UPDATE images
      SET
        processed_url = COALESCE(${data.processedUrl}, processed_url),
        processing_status = COALESCE(${data.processingStatus}, processing_status),
        processed_at = COALESCE(${data.processedAt?.toISOString()}, processed_at),
        filter_type = COALESCE(${data.filterType}, filter_type),
        updated_at = NOW()
      WHERE user_id = ${userId} AND original_url = ${originalUrl}
      RETURNING *
    `;
    return image;
  },

  async getUserImages(userId: string, limit = 50) {
    const images = await sql`
      SELECT * FROM images
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return images;
  },

  async getImagesByUserId(userId: string, limit = 50, offset = 0) {
    const images = await sql`
      SELECT * FROM images
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    return images || [];
  },

  // Photo queries
  async createPhoto(data: {
    userId: string;
    originalFilename: string;
    fileUrl: string;
    fileSize: number;
  }) {
    const [photo] = await sql`
      INSERT INTO photos (user_id, original_filename, file_url, file_size, uploaded_at)
      VALUES (${data.userId}, ${data.originalFilename}, ${data.fileUrl}, ${data.fileSize}, NOW())
      RETURNING *
    `;
    return photo;
  },

  async getUserPhotos(userId: string) {
    const photos = await sql`
      SELECT * FROM photos
      WHERE user_id = ${userId}
      ORDER BY uploaded_at DESC
    `;
    return photos;
  },

  async deletePhoto(photoId: number, userId: string) {
    const [photo] = await sql`
      DELETE FROM photos
      WHERE id = ${photoId} AND user_id = ${userId}
      RETURNING *
    `;
    return photo;
  },

  // Scene queries
  async getActiveScenes() {
    const scenes = await sql`
      SELECT * FROM scenes
      WHERE active = true
      ORDER BY display_order ASC
    `;
    return scenes;
  },

  async getAllScenes() {
    const scenes = await sql`
      SELECT * FROM scenes
      ORDER BY display_order ASC
    `;
    return scenes;
  },

  async getSceneById(sceneId: string | number) {
    const [scene] = await sql`
      SELECT * FROM scenes WHERE id = ${sceneId}
    `;
    return scene;
  },

  async createScene(data: {
    id?: string;
    name: string;
    description: string;
    prompt: string;
    category?: string;
    credit_cost?: number;
    preview_image?: string;
    displayOrder?: number;
    active?: boolean;
  }) {
    const [scene] = await sql`
      INSERT INTO scenes (name, description, prompt, category, credit_cost, preview_image, display_order, active)
      VALUES (
        ${data.name},
        ${data.description},
        ${data.prompt},
        ${data.category || null},
        ${data.credit_cost || 1},
        ${data.preview_image || null},
        ${data.displayOrder || 0},
        ${data.active !== undefined ? data.active : true}
      )
      RETURNING *
    `;
    return scene;
  },

  async updateScene(sceneId: string | number, data: {
    name?: string;
    description?: string;
    prompt?: string;
    category?: string;
    credit_cost?: number;
    preview_image?: string;
    active?: boolean;
    displayOrder?: number;
  }) {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push(`name = $${values.length + 1}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${values.length + 1}`);
      values.push(data.description);
    }
    if (data.prompt !== undefined) {
      updates.push(`prompt = $${values.length + 1}`);
      values.push(data.prompt);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${values.length + 1}`);
      values.push(data.category);
    }
    if (data.credit_cost !== undefined) {
      updates.push(`credit_cost = $${values.length + 1}`);
      values.push(data.credit_cost);
    }
    if (data.preview_image !== undefined) {
      updates.push(`preview_image = $${values.length + 1}`);
      values.push(data.preview_image);
    }
    if (data.active !== undefined) {
      updates.push(`active = $${values.length + 1}`);
      values.push(data.active);
    }
    if (data.displayOrder !== undefined) {
      updates.push(`display_order = $${values.length + 1}`);
      values.push(data.displayOrder);
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = NOW()`);
    values.push(sceneId);

    const query = `
      UPDATE scenes
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const [scene] = await sql(query, values);
    return scene;
  },

  async deleteScene(sceneId: string | number) {
    const [scene] = await sql`
      DELETE FROM scenes WHERE id = ${sceneId} RETURNING *
    `;
    return scene;
  },

  async incrementSceneUsage(sceneId: string | number) {
    await sql`
      UPDATE scenes
      SET usage_count = usage_count + 1
      WHERE id = ${sceneId}
    `;
  },

  // Admin queries
  async getAllUsers() {
    const users = await sql`
      SELECT id, email, name, credits, role, stripe_customer_id, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;
    return users;
  },
};
