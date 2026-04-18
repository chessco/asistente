import prisma from './prisma-client.js';
import logger from './logger.js';

/**
 * Reminder Service
 * Scans for upcoming appointments and "sends" reminders via WhatsApp.
 */
class ReminderService {
  /**
   * Start the reminder checker (simulated cron)
   * Runs every 1 hour (3600000 ms)
   */
  public start() {
    logger.info("Reminder Service started. Checking every 1 hour.");
    setInterval(() => this.checkReminders(), 1000 * 60 * 60);
    // Also run once on startup
    this.checkReminders();
  }

  private async checkReminders() {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find appointments in the next 24h that haven't had a reminder sent
      const appointments = await prisma.appointment.findMany({
        where: {
          startTime: {
            gte: now,
            lte: tomorrow
          },
          reminderSent: false,
          status: 'confirmada'
        },
        include: {
          tenant: true
        }
      });

      if (appointments.length === 0) return;

      logger.info(`Found ${appointments.length} appointments for reminder.`);

      for (const appt of appointments) {
        await this.sendReminder(appt);
      }
    } catch (error) {
      logger.error("Error in reminder job", { error });
    }
  }

  private async sendReminder(appt: any) {
    try {
      const { patientName, startTime, tenant } = appt;
      const dateStr = startTime.toLocaleString('es-MX', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      const message = `Hola ${patientName}, te recordamos tu cita en ${tenant.name} para mañana ${dateStr}. ¡Te esperamos!`;
      
      // SIMULATION: In a real app, you'd call Twilio or Meta API here.
      logger.info("--- WHATSAPP REMINDER SENT ---");
      logger.info(`To: ${patientName} (${tenant.whatsappNumber})`);
      logger.info(`Message: ${message}`);
      logger.info("------------------------------");

      // Mark as sent
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminderSent: true }
      });
    } catch (error) {
      logger.error(`Failed to send reminder for appointment ${appt.id}`, { error });
    }
  }
}

export const reminderService = new ReminderService();
