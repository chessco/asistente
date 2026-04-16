import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import logger from './logger.js';
import { calendarService } from './calendar.service.js';

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

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Better CORS for development: allow any localhost/127.0.0.1
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

const getConfig = (tenantId: string) => {
  const defaults = {
    name: tenantId.charAt(0).toUpperCase() + tenantId.slice(1), // Default name from ID
    businessHours: { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] },
    whatsappNumber: process.env.WHATSAPP_NUMBER || '1234567890',
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary'
  };

  try {
    const configPath = path.join(TENANTS_DIR, `${tenantId}.json`);
    if (fs.existsSync(configPath)) {
      const saved = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      // Merge with defaults to ensure all fields are present
      return {
        ...defaults,
        ...saved,
        businessHours: { ...defaults.businessHours, ...(saved.businessHours || {}) }
      };
    }
  } catch (e) {
    logger.error(`Error reading config for tenant ${tenantId}`, { error: e });
  }
  return defaults;
};

// Public config for frontend
app.get('/api/:tenantId/config', (req, res) => {
  const config = getConfig(req.params.tenantId);
  res.json({ 
    name: config.name,
    whatsappNumber: config.whatsappNumber 
  });
});

// Helper to check business hours
const isWithinBusinessHours = (date: Date, tenantId: string) => {
  const config = getConfig(tenantId);
  const day = date.getDay();
  const time = date.getHours() * 60 + date.getMinutes();
  
  const bh = config.businessHours;
  const [startH, startM] = bh.start.split(':').map(Number);
  const [endH, endM] = bh.end.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  return bh.days.includes(day) && time >= startMinutes && time <= endMinutes;
};

const appointments: any[] = [];

// Config Endpoints
app.get('/api/:tenantId/admin/config', (req, res) => {
  res.json(getConfig(req.params.tenantId));
});

// SUPER ADMIN: List all tenants
app.get('/api/admin/tenants', (req, res) => {
  try {
    if (!fs.existsSync(TENANTS_DIR)) return res.json([]);
    const files = fs.readdirSync(TENANTS_DIR);
    const tenants = files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const id = f.replace('.json', '');
        const config = getConfig(id);
        return { id, name: config.name };
      });
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list tenants' });
  }
});

// SUPER ADMIN: Create new tenant
app.post('/api/admin/tenants', (req, res) => {
  try {
    const { id, name } = req.body;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    
    const configPath = path.join(TENANTS_DIR, `${id}.json`);
    if (fs.existsSync(configPath)) return res.status(400).json({ error: 'Tenant already exists' });

    const newConfig = {
      name: name || id,
      businessHours: { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] },
      whatsappNumber: '1234567890',
      calendarId: 'primary'
    };

    if (!fs.existsSync(TENANTS_DIR)) fs.mkdirSync(TENANTS_DIR);
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// SUPER ADMIN: Update tenant name
app.patch('/api/admin/tenants/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const configPath = path.join(TENANTS_DIR, `${id}.json`);
    if (!fs.existsSync(configPath)) return res.status(404).json({ error: 'Tenant not found' });

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    config.name = name;
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

app.post('/api/:tenantId/admin/config', (req, res) => {
  try {
    const { tenantId } = req.params;
    const newConfig = req.body;
    const configPath = path.join(TENANTS_DIR, `${tenantId}.json`);
    
    if (!fs.existsSync(TENANTS_DIR)) fs.mkdirSync(TENANTS_DIR);
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    res.json({ success: true });
  } catch (error) {
    logger.error('Error saving config', { error, tenantId: req.params.tenantId });
    res.status(500).json({ error: 'Failed to save config' });
  }
});

// Admin Endpoint to List Appointments
app.get('/api/:tenantId/admin/appointments', async (req, res) => {
  try {
    const config = getConfig(req.params.tenantId);
    const events = await calendarService.listUpcomingEvents(config.calendarId, 20);
    const formattedEvents = events.map(event => {
      // Basic extraction from summary "CitaIA: Service - Name"
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
  const config = getConfig(tenantId);
  
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { step: 'greeting', data: {} });
  }

  const session = sessions.get(sessionId);
  const userMsg = message.toLowerCase();

  // 1. Intercept Commands
  if (userMsg.includes('ver horarios') || userMsg.includes('disponibles')) {
    const slots = await calendarService.getAvailableSlots(config.calendarId);
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
    const slots = await calendarService.getAvailableSlots(config.calendarId);
    const options = slots.map(s => `${s.day} ${s.start}`);
    return res.json({ 
      response: `Gracias ${message}. ¿Qué día y a qué hora te gustaría venir?\n\nAquí tienes algunos horarios libres:`,
      options: options.length > 0 ? options : ['Mañana 10am', 'Mañana 4pm'],
      step: 'awaiting_datetime'
    });
  }

  if (session.step === 'awaiting_datetime') {
    const isAvailable = await calendarService.isSlotAvailable(message, config.calendarId);
    if (!isAvailable) {
      const slots = await calendarService.getAvailableSlots(config.calendarId);
      return res.json({ 
        response: `Lo siento, ese horario ya está ocupado. ¿Te gustaría alguno de estos?`,
        options: slots.map(s => `${s.day} ${s.start}`),
        step: 'awaiting_datetime'
      });
    }

    const parsedDate = calendarService.parseDate(message);
    if (!isWithinBusinessHours(parsedDate, tenantId)) {
      const slots = await calendarService.getAvailableSlots(config.calendarId);
      return res.json({ 
        response: `Lo siento, ese horario está fuera de nuestro tiempo de atención. ¿Qué tal uno de estos?`,
        options: slots.map(s => `${s.day} ${s.start}`),
        step: 'awaiting_datetime'
      });
    }

    session.data.datetime = message;
    session.step = 'confirmed';
    
    try {
      await calendarService.createEvent(config.calendarId, session.data.name, session.data.service, message);
    } catch (e) {
      logger.error("Calendar integration error (skipping)", { error: e, sessionId, tenantId });
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

// Port Setup
const PORT = process.env.PORT || 3013;
app.listen(PORT, () => {
  logger.info(`CitaIA multi-tenant backend running on port ${PORT}`);
});
