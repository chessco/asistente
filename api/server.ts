import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { calendarService } from './calendar.service.js';
import { aiService } from './ai.service.js';
import { paymentService } from './payment.service.js';
import logger from './logger.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// In-memory session store (simple)
const sessions = new Map<string, any>();

// --- HELPERS ---

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
  return {
    id: tenantId,
    name: tenantId.charAt(0).toUpperCase() + tenantId.slice(1),
    businessHours: { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] },
    whatsappNumber: process.env.WHATSAPP_NUMBER || '1234567890',
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    googleClientEmail: null,
    googlePrivateKey: null,
    isPremiumAI: false,
    cancelationBuffer: 15
  };
};

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

// --- ROUTES ---

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/:tenantId/config', async (req, res) => {
  const config = await getConfig(req.params.tenantId);
  res.json({ name: config.name, whatsappNumber: config.whatsappNumber, isPremiumAI: config.isPremiumAI });
});

app.get('/api/:tenantId/admin/config', async (req, res) => res.json(await getConfig(req.params.tenantId)));

app.post('/api/:tenantId/admin/config', async (req, res) => {
  const { tenantId } = req.params;
  await prisma.tenant.upsert({
    where: { id: tenantId },
    update: req.body,
    create: { id: tenantId, ...req.body }
  });
  res.json({ success: true });
});

app.get('/api/:tenantId/admin/appointments', async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    where: { tenantId: req.params.tenantId },
    orderBy: { startTime: 'desc' },
    take: 50
  });
  res.json(appointments.map(a => ({
    id: a.id,
    patient: a.patientName,
    service: a.service,
    startTime: a.startTime,
    status: a.status
  })));
});

app.get('/api/:tenantId/admin/services', async (req, res) => {
  res.json(await prisma.service.findMany({ where: { tenantId: req.params.tenantId } }));
});

app.post('/api/:tenantId/admin/services', async (req, res) => {
  const service = await prisma.service.create({ data: { tenantId: req.params.tenantId, ...req.body } });
  res.json(service);
});

app.delete('/api/:tenantId/admin/services/:id', async (req, res) => {
  await prisma.service.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// CHAT ENDPOINT
app.post('/api/:tenantId/chat', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    const { tenantId } = req.params;
    const config = await getConfig(tenantId);
    const credentials = config.googleClientEmail ? { clientEmail: config.googleClientEmail, privateKey: config.googlePrivateKey } : undefined;

    if (!sessions.has(sessionId)) sessions.set(sessionId, { step: 'greeting', data: {} });
    const session = sessions.get(sessionId);
    const userMsg = message.toLowerCase();

    // PREMIUM AI FLOW
    if (config.isPremiumAI) {
      const services = await prisma.service.findMany({ where: { tenantId } });
      const serviceNames = services.map((s: any) => s.name);
      const extracted = await aiService.extractEntities(message, serviceNames);

      if (extracted.name) session.data.name = extracted.name;
      if (extracted.service) session.data.service = extracted.service;

      if (extracted.intent === 'cancel') {
          session.step = 'awaiting_cancel_confirmation';
          return res.json({ response: "Entendido. ¿Me confirmas tu nombre para buscar la cita y cancelarla?" });
      }
      if (extracted.intent === 'reschedule') {
          session.step = 'awaiting_reschedule_name';
          return res.json({ response: "Claro, puedo ayudarte a cambiar tu cita. ¿A nombre de quién está la reserva actualmente?" });
      }

      if (!session.data.service) {
          const aiResponse = await aiService.generateResponse("El usuario quiere agendar pero falta servicio.", "Preguntar por servicio");
          return res.json({ response: aiResponse || "¿Qué servicio te gustaría agendar?", options: serviceNames });
      }
      if (!session.data.name) {
          return res.json({ response: `Perfecto para ${session.data.service}. ¿A nombre de quién agendamos?` });
      }
      if (session.step === 'greeting' || session.step === 'awaiting_service' || session.step === 'awaiting_name') {
          session.step = 'awaiting_datetime';
          const slots = await calendarService.getAvailableSlots(config.calendarId, credentials, config);
          return res.json({ response: `Gracias ${session.data.name}. ¿Para cuándo te gustaría agendar?`, options: slots.map(s => `${s.day} ${s.start}`) });
      }
    }

    // STANDARD FLOWS
    if (userMsg.includes('cancelar') || userMsg.includes('cancelación') || userMsg.includes('cancelacion')) {
      session.step = 'awaiting_cancel_confirmation';
      return res.json({ response: "Entendido. ¿A nombre de quién está la reserva que deseas cancelar?" });
    }
    if (userMsg.includes('reprogramar') || userMsg.includes('cambiar') || userMsg.includes('mover') || userMsg.includes('reagenda') || userMsg.includes('reagendar')) {
      session.step = 'awaiting_reschedule_name';
      return res.json({ response: "Claro. ¿A nombre de quién está la reserva actualmente?" });
    }

    // 1. Cancellation Logic
    if (session.step === 'awaiting_cancel_confirmation') {
      const buffer = config.cancelationBuffer || 0;
      const cutoff = new Date(Date.now() - (buffer * 60 * 1000));
      
      const appointment = await prisma.appointment.findFirst({
          where: { tenantId, patientName: { contains: message }, status: 'confirmada', startTime: { gte: cutoff } }
      });
      if (appointment) {
          try {
              if (appointment.googleEventId) {
                  await calendarService.deleteEvent(config.calendarId, appointment.googleEventId, credentials);
              }
          } catch (e) {
              logger.warn("Could not delete from Google Calendar, maybe already deleted", { error: e });
          }
          await prisma.appointment.update({ where: { id: appointment.id }, data: { status: 'cancelada' } });
          const cancelTime = appointment.startTime.toLocaleString();
          session.step = 'greeting';
          return res.json({ 
            response: `Tu cita de las ${cancelTime} ha sido cancelada.`,
            step: 'canceled',
            options: []
          });
      }
      return res.json({ response: "No encontré ninguna cita próxima a ese nombre. Verifícalo por favor." });
    }

    // 2. Rescheduling Logic
    if (session.step === 'awaiting_reschedule_name') {
      const buffer = config.cancelationBuffer || 0;
      const cutoff = new Date(Date.now() - (buffer * 60 * 1000));

      const appointment = await prisma.appointment.findFirst({
          where: { 
              tenantId, 
              patientName: { contains: message }, 
              status: 'confirmada', 
              startTime: { gte: cutoff } 
          }
      });

      if (appointment) {
          session.data.oldAppointment = appointment;
          session.data.name = appointment.patientName;
          session.data.service = appointment.service;
          session.step = 'awaiting_datetime';
          const slots = await calendarService.getAvailableSlots(config.calendarId, credentials, config);
          return res.json({ response: `Encontré tu cita para las ${appointment.startTime.toLocaleString()}. ¿A qué nuevo horario quieres cambiarla?`, options: slots.map(s => `${s.day} ${s.start}`) });
      }
      return res.json({ response: `No logré encontrar una cita activa para "${message}" en el futuro cercano.` });
    }

    // 3. Normal Booking Step Flow
    if (session.step === 'greeting') {
      session.step = 'awaiting_service';
      return res.json({ response: "¡Hola! ¿Qué servicio te gustaría agendar?", options: ['Consulta General', 'Evaluación', 'Seguimiento'] });
    }
    if (session.step === 'awaiting_service') {
      session.data.service = message;
      session.step = 'awaiting_name';
      return res.json({ response: `Excelente. ¿A nombre de quién agendamos?` });
    }
    if (session.step === 'awaiting_name') {
      session.data.name = message;
      session.step = 'awaiting_datetime';
      const slots = await calendarService.getAvailableSlots(config.calendarId, credentials, config);
      return res.json({ response: `Gracias ${message}. ¿Cuándo te gustaría venir?`, options: slots.map(s => `${s.day} ${s.start}`) });
    }

    if (session.step === 'awaiting_datetime') {
      try {
          const isAvailable = await calendarService.isSlotAvailable(message, config.calendarId, credentials);
          if (!isAvailable) {
            const slots = await calendarService.getAvailableSlots(config.calendarId, credentials, config);
            return res.json({ response: "Ese horario ya está ocupado. ¿Te sirve alguno de estos?", options: slots.map(s => `${s.day} ${s.start}`) });
          }

          const parsedDate = calendarService.parseDate(message);
          if (!isWithinBusinessHours(parsedDate, config)) {
              const slots = await calendarService.getAvailableSlots(config.calendarId, credentials, config);
              return res.json({ response: "Ese horario está fuera de nuestra jornada laboral. Prueba con estos:", options: slots.map(s => `${s.day} ${s.start}`) });
          }
          const serviceInfo = await prisma.service.findFirst({ where: { tenantId, name: session.data.service } });

          // Handle rescheduling delete
          if (session.data.oldAppointment) {
              try {
                  if (session.data.oldAppointment.googleEventId) {
                      await calendarService.deleteEvent(config.calendarId, session.data.oldAppointment.googleEventId, credentials);
                  }
                  await prisma.appointment.update({ where: { id: session.data.oldAppointment.id }, data: { status: 'reprogramada' } });
              } catch (e) {
                  logger.warn("Could not delete old event, proceeding anyway", { error: e });
              }
          }

          const event = await calendarService.createEvent(config.calendarId, session.data.name, session.data.service, message, credentials) as any;
          const appointment = await prisma.appointment.create({
              data: {
                  tenantId,
                  patientName: session.data.name,
                  service: session.data.service,
                  googleEventId: event.id,
                  startTime: parsedDate,
                  amount: serviceInfo?.price || 0,
                  paymentStatus: serviceInfo?.price ? 'pendiente' : 'n/a'
              }
          });

          let payMsg = "";
          if (serviceInfo?.price) {
              const link = paymentService.generatePaymentLink(appointment.id, serviceInfo.price, session.data.service);
              payMsg = `\n\n💰 Para confirmar, abona aquí: ${link}`;
          }

          session.step = 'greeting';
          const rawText = `Hola, soy ${session.data.name}, confirmo mi cita para el ${message} para ${session.data.service}`;
          const waLink = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(rawText)}`;
          
          const responseText = 
            `✨ *¡Cita Confirmada!* ✨\n\n` +
            `📅 *Día:* ${message}\n` +
            `👤 *A nombre de:* ${session.data.name || 'Paciente'}\n` +
            `🩺 *Servicio:* ${session.data.service || 'Consulta'}\n\n` +
            `Te esperamos puntualmente. ${payMsg}\n\n` +
            `👇 Confirma tu asistencia aquí: \n\n` +
            `${waLink}`;

          const finalData = { name: session.data.name, service: session.data.service, datetime: message };
          session.step = 'greeting';
          session.data = {};
          return res.json({ 
            response: responseText, 
            step: 'confirmed', 
            data: finalData,
            options: [] // Force clear buttons
          });
      } catch (error) {
          logger.error("Booking error", { error, session: session.id });
          return res.json({ response: "Tuve un problema al procesar la cita. Por favor, intenta un horario diferente o contacta a soporte." });
      }
    }

    return res.json({ response: "No entendí eso. ¿Podemos empezar de nuevo?" });
  } catch (error) {
    logger.error("Global Chat Error", { error });
    return res.json({ response: "Lo siento, tuve un problema interno. ¿Podemos intentarlo de nuevo en un momento?" });
  }
});

const PORT = 3013;
app.listen(PORT, () => console.log(`\n\n🚀 CitaIA Backend running on http://localhost:${PORT}`));
