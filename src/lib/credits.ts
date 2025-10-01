import { db } from './db';

export const credits = {
  // Fetch user's current credit balance
  async getBalance(userId: string): Promise<number> {
    return await db.getUserCredits(userId);
  },

  // Update user's credit balance
  async updateBalance(userId: string, newBalance: number) {
    await db.updateUserCredits(userId, newBalance);
  },

  // Deduct credits (for image processing)
  async deductCredits(userId: string, amount: number, description: string) {
    const currentBalance = await this.getBalance(userId);

    if (currentBalance < amount) {
      throw new Error('Insufficient credits');
    }

    const newBalance = currentBalance - amount;

    // Update user balance
    await this.updateBalance(userId, newBalance);

    // Record transaction
    await this.recordTransaction(userId, -amount, 'usage', description);

    return newBalance;
  },

  // Add credits (for purchases)
  async addCredits(userId: string, amount: number, description: string, stripePaymentIntentId?: string) {
    const currentBalance = await this.getBalance(userId);
    const newBalance = currentBalance + amount;

    // Update user balance
    await this.updateBalance(userId, newBalance);

    // Record transaction
    await this.recordTransaction(userId, amount, 'purchase', description, stripePaymentIntentId);

    return newBalance;
  },

  // Record a credit transaction
  async recordTransaction(
    userId: string,
    amount: number,
    type: 'purchase' | 'usage' | 'bonus',
    description: string,
    stripePaymentIntentId?: string
  ) {
    await db.createCreditTransaction(userId, amount, type, description, stripePaymentIntentId);
  },

  // Get transaction history
  async getTransactions(userId: string, limit = 50) {
    return await db.getCreditTransactions(userId, limit);
  },

  // Create Stripe checkout session for credit purchase
  async purchaseCredits(packageId: string, token: string) {
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ packageId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Purchase failed');
      }

      const result = await response.json();
      return {
        success: result.success,
        newBalance: result.newBalance,
        creditsAdded: result.creditsAdded
      };
    } catch (error) {
      console.error('Purchase error:', error);
      throw error;
    }
  },

  // Format price for display
  formatPrice(priceInCents: number): string {
    return `$${(priceInCents / 100).toFixed(2)}`;
  }
};
