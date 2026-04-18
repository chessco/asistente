import logger from "./logger.js";

/**
 * Payment Service (Mock)
 * Simulates Stripe Checkout operations.
 */
class PaymentService {
  /**
   * Generates a "Stripe" checkout link
   */
  public generatePaymentLink(appointmentId: string, amount: number, serviceName: string): string {
    // In a real app, you would use:
    // const session = await stripe.checkout.sessions.create({...});
    // return session.url;
    
    // MOCK:
    const baseUrl = process.env.WEB_URL || "http://localhost:5173";
    return `${baseUrl}/pay?id=${appointmentId}&amount=${amount}&service=${encodeURIComponent(serviceName)}`;
  }

  /**
   * Simulates a webhook receipt
   */
  public async handleWebhookSim(appointmentId: string) {
    logger.info(`Payment received for appointment ${appointmentId}`);
    // Update DB status (This would be done in a real /webhook endpoint)
  }
}

export const paymentService = new PaymentService();
