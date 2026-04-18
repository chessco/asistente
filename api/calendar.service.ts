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
      privateKey = privateKey
        .replace(/^"|"$/g, '')          // Strip surrounding quotes
        .split(String.raw`\n`).join('\n') // Convert literal "\n" text to actual newlines
        .replace(/\\n/g, '\n')          // Convert any leftover \\n
        .replace(/\r/g, '');            // Strip Windows carriage returns
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
    
    // 1. Handle Keywords
    if (lower.includes('mañana')) target.setDate(now.getDate() + 1);
    else if (lower.includes('pasado mañana')) target.setDate(now.getDate() + 2);
    
    // 2. Handle Weekdays (lun, mar, mié, jue, vie, sáb, dom)
    const daysMap: { [key: string]: number } = { 'dom': 0, 'lun': 1, 'mar': 2, 'mie': 3, 'jue': 4, 'vie': 5, 'sab': 6 };
    for (const [dayName, dayCode] of Object.entries(daysMap)) {
      if (lower.includes(dayName)) {
        const currentDay = now.getDay();
        let diff = dayCode - currentDay;
        if (diff <= 0) diff += 7; // Next occurrence
        target.setDate(now.getDate() + diff);
        break;
      }
    }

    // 3. Handle specific Day Number (e.g., "20", "21")
    const dayMatch = lower.match(/\b(\d{1,2})\b/);
    if (dayMatch && !lower.includes(':') && !lower.includes(' a.m.') && !lower.includes(' p.m.')) {
       // Only if it's a standalone number or part of a date string that we can identify
       // But wait, the suggested slots are like "lun 20 09:00 a.m."
    }
    // Improved logic for "lun 20 09:00 a.m.":
    const fullMatch = lower.match(/(?:lun|mar|mie|jue|vie|sab|dom)\s+(\d{1,2})/);
    if (fullMatch) {
      const dayNum = parseInt(fullMatch[1]);
      target.setDate(dayNum);
      // Handle month rollover if necessary (simple for now)
      if (dayNum < now.getDate()) target.setMonth(now.getMonth() + 1);
    }

    // 4. Extract Time (Hour:Minutes AM/PM)
    const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const ampm = (timeMatch[3] || '').replace(/\./g, '').toLowerCase();

      if (ampm === '') {
        if (hours >= 1 && hours <= 7) hours += 12;
      } else {
        if ((ampm === 'pm' || ampm === 'p') && hours < 12) hours += 12;
        if ((ampm === 'am' || ampm === 'a') && hours === 12) hours = 0;
      }
      
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
   * Deletes an event in Google Calendar.
   */
  async deleteEvent(calendarId: string, eventId: string, credentials?: any) {
    try {
      const calendar = this.getCalendarForTenant(credentials);
      await calendar.events.delete({
        calendarId: calendarId || 'primary',
        eventId: eventId
      });
    } catch (error) {
      logger.error('Error deleting event', { error, calendarId, eventId });
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
   * Finds available slot gaps respecting business hours.
   */
  async getAvailableSlots(calendarId: string, credentials?: any, config?: any): Promise<Slot[]> {
    try {
      const bh = config?.businessHours || { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] };
      const [startH, startM] = bh.start.split(':').map(Number);
      const [endH, endM] = bh.end.split(':').map(Number);
      
      const now = new Date();
      const events = await this.listUpcomingEvents(calendarId, 60, credentials);
      const slots: Slot[] = [];
      const daysToScan = 3; // Scan a bit further

      let currentScanTime = new Date(now);
      currentScanTime.setHours(currentScanTime.getHours() + 1, 0, 0, 0);

      const maxScanDate = new Date(now);
      maxScanDate.setDate(maxScanDate.getDate() + daysToScan);

      while (currentScanTime < maxScanDate && slots.length < 10) {
        const day = currentScanTime.getDay();
        const hour = currentScanTime.getHours();
        const minutes = currentScanTime.getMinutes();
        const currentTimeMinutes = hour * 60 + minutes;

        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        // 1. Filter by Business Hours and Days
        if (bh.days.includes(day) && currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes) {
          const slotEnd = new Date(currentScanTime.getTime() + 60 * 60 * 1000);
          
          const hasConflict = events.some((event: any) => {
            const eStart = new Date(event.start?.dateTime || event.start?.date || '');
            const eEnd = new Date(event.end?.dateTime || event.end?.date || '');
            return (currentScanTime < eEnd && slotEnd > eStart);
          });

          if (!hasConflict) {
            const isToday = currentScanTime.getDate() === now.getDate();
            slots.push({
              start: currentScanTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }),
              day: isToday ? "Hoy" : (currentScanTime.getDate() === now.getDate() + 1 ? "Mañana" : currentScanTime.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }))
            });
          }
        }
        
        // Move to next hour
        currentScanTime.setHours(currentScanTime.getHours() + 1);
        
        // If we passed the business day, move to next day start
        if (currentScanTime.getHours() >= endH) {
          currentScanTime.setDate(currentScanTime.getDate() + 1);
          currentScanTime.setHours(startH, startM, 0, 0);
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
