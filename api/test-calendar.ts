import { calendarService } from './calendar.service.js';
import dotenv from 'dotenv';

dotenv.config();

async function sendRealTest() {
  console.log('🚀 Enviando Cita de Prueba Real para CitaIA...');
  
  try {
    const event = await calendarService.createEvent(
      'primary',
      'Juan Pérez (Prueba Final)',
      'Limpieza Dental Profunda 🦷',
      'Mañana a las 4pm'
    );
    
    console.log('\n✅ ¡Cita enviada!');
    console.log('🔗 Link al Calendario:', event.htmlLink);
  } catch (error) {
    console.error('\n❌ ERROR DETALLADO:');
    if (error.response && error.response.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

sendRealTest();
