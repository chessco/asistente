import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import logger from './logger.js';
import { calendarService } from './calendar.service.js';
import prisma from './prisma-client.js';

dotenv.config();

const app = express();
app.use(express.json());

// Request logging with Morgan
app.use(morgan(':method :url :status :response-time ms - :res[content-length]', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// CORS Configuration for Split Deployment
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://citaia.pitayacode.com',
  'https://www.citaia.pitayacode.com'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

if (process.env.CORS_ORIGINS) {
  const origins = process.env.CORS_ORIGINS.split(',').map(o => o.trim());
  allowedOrigins.push(...origins);
}

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const isLocal = !origin || 
                   origin.includes('localhost') || 
                   origin.includes('127.0.0.1');

    if (isLocal || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const sessions = new Map<string, any>();
const TENANTS_DIR = path.join(process.cwd(), 'tenants');

/**
 * Migration: One-time sync from JSON files to MySQL
 */
async function migrateJsonToDb() {
  try {
    const count = await prisma.tenant.count();
    if (count > 0) return; // Already migrated or seeded

    if (!fs.existsSync(TENANTS_DIR)) return;

    logger.info("Starting JSON to MySQL migration...");
    const files = fs.readdirSync(TENANTS_DIR).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const id = file.replace('.json', '');
      const data = JSON.parse(fs.readFileSync(path.join(TENANTS_DIR, file), 'utf-8'));
      
      await prisma.tenant.upsert({
        where: { id },
        update: {},
        create: {
          id,
          name: data.name || id,
          whatsappNumber: data.whatsappNumber || '1234567890',
          calendarId: data.calendarId || 'primary',
          businessHours: data.businessHours || { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] },
          googleClientEmail: data.googleClientEmail,
          googlePrivateKey: data.googlePrivateKey
        }
      });
      logger.info(`Migrated tenant: ${id}`);
    }
    logger.info("Migration completed successfully.");
  } catch (error) {
    logger.error("Migration failed", { error });
  }
}

/**
 * Fetch tenant configuration from DB
 */
const getConfig = async (tenantId: string) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (tenant) {
      return {
        ...tenant,
        businessHours: (tenant.businessHours as any) || { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] }
      };
    }
  } catch (e) {
    logger.error(`Error reading config for tenant ${tenantId}`, { error: e });
  }

  // Fallback defaults
  return {
    id: tenantId,
    name: tenantId.charAt(0).toUpperCase() + tenantId.slice(1),
    businessHours: { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] },
    whatsappNumber: process.env.WHATSAPP_NUMBER || '1234567890',
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    googleClientEmail: null,
    googlePrivateKey: null
  };
};

// Public config for frontend
app.get('/api/:tenantId/config', async (req, res) => {
  const config = await getConfig(req.params.tenantId);
  res.json({ 
    name: config.name,
    whatsappNumber: config.whatsappNumber 
  });
});

// Helper to check business hours
const isWithinBusinessHours = (date: Date, config: any) => {
  const day = date.getDay();
  const time = date.getHours() * 60 + date.getMinutes();
  
  const bh = config.businessHours;
  const [startH, startM] = bh.start.split(':').map(Number);
  const [endH, endM] = bh.end.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  return bh.days.includes(day) && time >= startMinutes && time <= endMinutes;
};

// Config Endpoints
app.get('/api/:tenantId/admin/config', async (req, res) => {
  res.json(await getConfig(req.params.tenantId));
});

// SUPER ADMIN: List all tenants
app.get('/api/admin/tenants', async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true }
    });
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list tenants' });
  }
});

// SUPER ADMIN: Create new tenant
app.post('/api/admin/tenants', async (req, res) => {
  try {
    const { id, name } = req.body;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    
    await prisma.tenant.create({
      data: {
        id,
        name: name || id,
        businessHours: { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] },
        whatsappNumber: '1234567890',
        calendarId: 'primary'
      }
    });

    res.json({ success: true, id });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Tenant already exists' });
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// SUPER ADMIN: Update tenant name
app.patch('/api/admin/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    await prisma.tenant.update({
      where: { id },
      data: { name }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

app.post('/api/:tenantId/admin/config', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const newConfig = req.body;

    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {
        name: newConfig.name,
        whatsappNumber: newConfig.whatsappNumber,
        calendarId: newConfig.calendarId,
        businessHours: newConfig.businessHours,
        googleClientEmail: newConfig.googleClientEmail,
        googlePrivateKey: newConfig.googlePrivateKey
      },
      create: {
        id: tenantId,
        name: newConfig.name,
        whatsappNumber: newConfig.whatsappNumber,
        calendarId: newConfig.calendarId,
        businessHours: newConfig.businessHours,
        googleClientEmail: newConfig.googleClientEmail,
        googlePrivateKey: newConfig.googlePrivateKey
      }
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error saving config', { error, tenantId: req.params.tenantId });
    res.status(500).json({ error: 'Failed to save config' });
  }
});

// Admin Endpoint to List Appointments
app.get('/api/:tenantId/admin/appointments', async (req, res) => {
  try {
    const config = await getConfig(req.params.tenantId);
    const credentials = config.googleClientEmail ? { clientEmail: config.googleClientEmail, privateKey: config.googlePrivateKey } : undefined;
    
    const events = await calendarService.listUpcomingEvents(config.calendarId, 20, credentials);
    const formattedEvents = events.map(event => {
      const summary = event.summary || '';
      const parts = summary.replace('CitaIA: ', '').split(' - ');
      const startDate = event.start?.dateTime || event.start?.date || 'Sin fecha';
      
      return {
        id: event.id,
        patient: parts[1] || 'Paciente',
        service: parts[0] || 'Consulta',
        startTime: startDate,
        htmlLink: event.htmlLink,
        status: 'confirmada'
      };
    });
    
    res.json(formattedEvents);
  } catch (error) {
    logger.error('Admin API error fetching appointments', { error, tenantId: req.params.tenantId });
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Chat Endpoint
app.post('/api/:tenantId/chat', async (req, res) => {
  const { sessionId, message } = req.body;
  const { tenantId } = req.params;
  const config = await getConfig(tenantId);
  const credentials = config.googleClientEmail ? { clientEmail: config.googleClientEmail, privateKey: config.googlePrivateKey } : undefined;
  
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { step: 'greeting', data: {} });
  }

  const session = sessions.get(sessionId);
  const userMsg = message.toLowerCase();

  // 1. Intercept Commands
  if (userMsg.includes('ver horarios') || userMsg.includes('disponibles')) {
    const slots = await calendarService.getAvailableSlots(config.calendarId, credentials);
    if (slots.length > 0) {
      const slotTexts = slots.map(s => `${s.day} a las ${s.start}`);
      return res.json({ 
        response: `¡Claro! Tengo estos espacios libres:\n\n${slotTexts.join('\n')}\n\n¿Cuál te gustaría reservar?`,
        options: slots.map(s => `${s.day} ${s.start}`),
        step: 'awaiting_datetime'
      });
    }
  }

  // Generic flow logic
  if (session.step === 'greeting') {
    session.step = 'awaiting_service';
    return res.json({ 
      response: `¡Hola! Soy CitaIA. ¿Qué servicio te gustaría agendar?`,
      options: ['Consulta General', 'Seguimiento', 'Urgencia'],
      step: 'awaiting_service'
    });
  }

  if (session.step === 'awaiting_service') {
    session.data.service = message;
    session.step = 'awaiting_name';
    return res.json({ 
      response: `Perfecto, un ${message}. ¿A nombre de quién agendamos?`,
      step: 'awaiting_name'
    });
  }

  if (session.step === 'awaiting_name') {
    session.data.name = message;
    session.step = 'awaiting_datetime';
    const slots = await calendarService.getAvailableSlots(config.calendarId, credentials);
    const options = slots.map(s => `${s.day} ${s.start}`);
    return res.json({ 
      response: `Gracias ${message}. ¿Qué día y a qué hora te gustaría venir?\n\nAquí tienes algunos horarios libres:`,
      options: options.length > 0 ? options : ['Mañana 10am', 'Mañana 4pm'],
      step: 'awaiting_datetime'
    });
  }

  if (session.step === 'awaiting_datetime') {
    const isAvailable = await calendarService.isSlotAvailable(message, config.calendarId, credentials);
    if (!isAvailable) {
      const slots = await calendarService.getAvailableSlots(config.calendarId, credentials);
      return res.json({ 
        response: `Lo siento, ese horario ya está ocupado. ¿Te gustaría alguno de estos?`,
        options: slots.map(s => `${s.day} ${s.start}`),
        step: 'awaiting_datetime'
      });
    }

    const parsedDate = calendarService.parseDate(message);
    if (!isWithinBusinessHours(parsedDate, config)) {
      const slots = await calendarService.getAvailableSlots(config.calendarId, credentials);
      return res.json({ 
        response: `Lo siento, ese horario está fuera de nuestro tiempo de atención. ¿Qué tal uno de estos?`,
        options: slots.map(s => `${s.day} ${s.start}`),
        step: 'awaiting_datetime'
      });
    }

    session.data.datetime = message;
    session.step = 'confirmed';
    
    try {
      // 1. Create in Google Calendar
      await calendarService.createEvent(config.calendarId, session.data.name, session.data.service, message, credentials);
      
      // 2. Local Persistence (Analytics/Backup)
      await prisma.appointment.create({
        data: {
          tenantId: tenantId,
          patientName: session.data.name,
          service: session.data.service,
          startTime: parsedDate,
          status: 'confirmada'
        }
      });
    } catch (e) {
      logger.error("Appointment creation error", { error: e, sessionId, tenantId });
    }

    const whatsappNum = config.whatsappNumber;
    const waLink = `https://wa.me/${whatsappNum}?text=Hola,%20soy%20${encodeURIComponent(session.data.name)}%20y%20quiero%20agendar%20${encodeURIComponent(session.data.service)}%20para%20el%20${encodeURIComponent(session.data.datetime)}`;
    
    return res.json({ 
      response: `¡Excelente! Tu cita está agendada para el ${message}. He enviado los detalles a Schedly. Por favor presiona el botón para confirmar por WhatsApp.`,
      options: ['Confirmar por WhatsApp', 'Agendar otra'],
      step: 'confirmed',
      data: session.data,
      waLink
    });
  }

  res.json({ response: "Lo siento, no entendí eso. ¿Podemos empezar de nuevo?", step: 'greeting' });
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled Exception', { 
    error: err.message, 
    stack: err.stack, 
    path: req.path, 
    method: req.method 
  });
  res.status(500).json({ error: 'Internal Server Error' });
});

// Startup
const PORT = process.env.PORT || 3013;
app.listen(PORT, async () => {
  logger.info(`CitaIA multi-tenant backend running on port ${PORT}`);
  await migrateJsonToDb();
});
