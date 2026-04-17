import { google } from 'googleapis';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

interface Slot {
  start: string;
  day: string;
}

/**
 * Calendar Service
 * Handles interaction with Google Calendar API using Service Account.
 */
class CalendarService {
  private calendar;
  private auth;

  constructor() {
    this.auth = this.createAuth();
    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  /**
   * Creates a Google Auth instance.
   * Uses provided credentials or falls back to environment variables.
   */
  private createAuth(credentials?: { clientEmail?: string, privateKey?: string }) {
    const SCOPES = ['https://www.googleapis.com/auth/calendar'];
    
    const email = credentials?.clientEmail || process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = credentials?.privateKey || process.env.GOOGLE_PRIVATE_KEY;
    
    if (privateKey) {
      privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
    }

    return new google.auth.JWT({
      email: email,
      key: privateKey,
      scopes: SCOPES
    });
  }

  /**
   * Helper to get a calendar instance for a specific tenant.
   */
  private getCalendarForTenant(credentials?: { clientEmail?: string, privateKey?: string }) {
    if (!credentials?.clientEmail || !credentials?.privateKey) {
      return this.calendar;
    }
    const auth = this.createAuth(credentials);
    return google.calendar({ version: 'v3', auth: auth });
  }

  /**
   * Helper to parse natural language date strings.
   */
  public parseDate(dateTimeStr: string): Date {
    const now = new Date();
    let target = new Date(now);
    
    const lower = dateTimeStr.toLowerCase();
    if (lower.includes('mañana')) target.setDate(now.getDate() + 1);
    if (lower.includes('pasado mañana')) target.setDate(now.getDate() + 2);
    
    // Extract: Hour, Minutes (Optional), AM/PM (Optional)
    const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const ampm = (timeMatch[3] || '').replace(/\./g, '').toLowerCase();

      if ((ampm === 'pm' || ampm === 'p') && hours < 12) hours += 12;
      if ((ampm === 'am' || ampm === 'a') && hours === 12) hours = 0;
      
      target.setHours(hours, minutes, 0, 0);
    }
    
    return target;
  }

  /**
   * Checks if a given time slot is already occupied.
   * Returns true if the slot is AVAILABLE, false if it is BLOCKED.
   */
  async isSlotAvailable(dateTimeStr: string, calendarId: string = 'primary', credentials?: any): Promise<boolean> {
    const startTime = this.parseDate(dateTimeStr);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const calendar = this.getCalendarForTenant(credentials);

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
    });

    const items = response.data.items || [];
    return items.length === 0;
  }

  /**
   * Creates an event in Google Calendar.
   */
  async createEvent(calendarId: string, name: string, service: string, dateTimeStr: string, credentials?: any) {
    try {
      const startTime = this.parseDate(dateTimeStr);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      const calendar = this.getCalendarForTenant(credentials);

      const response = await calendar.events.insert({
        calendarId: calendarId || 'primary',
        requestBody: {
          summary: `CitaIA: ${service} - ${name}`,
          description: `Nueva cita agendada vía Pitaya Schedly CitaIA para ${service}.`,
          start: { dateTime: startTime.toISOString(), timeZone: 'America/Hermosillo' },
          end: { dateTime: endTime.toISOString(), timeZone: 'America/Hermosillo' },
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating event', { error, calendarId, name, service });
      throw error;
    }
  }

  /**
   * List upcoming events for a specific calendar.
   */
  async listUpcomingEvents(calendarId: string, maxResults: number = 20, credentials?: any) {
    try {
      const calendar = this.getCalendarForTenant(credentials);
      const response = await calendar.events.list({
        calendarId: calendarId || 'primary',
        timeMin: new Date().toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return response.data.items || [];
    } catch (error) {
      logger.error('Error listing events', { error, calendarId });
      throw error;
    }
  }

  /**
   * Finds available slot gaps.
   */
  async getAvailableSlots(calendarId: string, credentials?: any): Promise<Slot[]> {
    try {
      const now = new Date();
      const events = await this.listUpcomingEvents(calendarId, 50, credentials);
      const slots: Slot[] = [];
      const daysToScan = 2;

      let currentScanTime = new Date(now);
      currentScanTime.setHours(currentScanTime.getHours() + 1, 0, 0, 0);

      const endTime = new Date(now);
      endTime.setDate(endTime.getDate() + daysToScan);
      endTime.setHours(21, 0, 0, 0);

      while (currentScanTime < endTime && slots.length < 8) {
        const slotEnd = new Date(currentScanTime.getTime() + 60 * 60 * 1000);
        
        const hasConflict = events.some((event: any) => {
          const eStart = new Date(event.start?.dateTime || event.start?.date || '');
          const eEnd = new Date(event.end?.dateTime || event.end?.date || '');
          return (currentScanTime < eEnd && slotEnd > eStart);
        });

        if (!hasConflict) {
          const isToday = currentScanTime.getDate() === now.getDate();
          slots.push({
            start: currentScanTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            day: isToday ? "Hoy" : "Mañana"
          });
        }
        
        currentScanTime.setHours(currentScanTime.getHours() + 1);
        if (currentScanTime.getHours() > 20) {
          currentScanTime.setDate(currentScanTime.getDate() + 1);
          currentScanTime.setHours(8, 0, 0, 0);
        }
      }

      return slots;
    } catch (error) {
      logger.error("Error finding available slots", { error, calendarId });
      return [];
    }
  }
}

export const calendarService = new CalendarService();
