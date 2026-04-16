import { calendarService } from './calendar.service.js';
import dotenv from 'dotenv';

dotenv.config();

async function testConflict() {
  console.log('🧪 Iniciando prueba de Prevención de Doble Cita...');
  
  // Escenarios de Prueba:
  // 1. Exactamente a la misma hora (4:00 PM Mañana - ocupado por Juan Pérez)
  // 2. Con 30 min de diferencia (4:30 PM Mañana - dentro del margen de 1h)
  // 3. Con 2 horas de diferencia (6:00 PM Mañana - disponible)

  const tests = [
    { label: 'Misma Hora (4pm)', time: 'Mañana a las 4pm', expected: false },
    { label: 'Margen 30min (4:30pm)', time: 'Mañana a las 4:30pm', expected: false },
    { label: 'Fuera de Margen (6pm)', time: 'Mañana a las 6pm', expected: true }
  ];

  for (const test of tests) {
    console.log(`\n🔍 Probando: ${test.label} - Horario: "${test.time}"`);
    const isAvailable = await calendarService.isSlotAvailable(test.time);
    
    if (isAvailable === test.expected) {
      console.log(`✅ RESULTADO CORRECTO: ${isAvailable ? 'Disponible' : 'Bloqueado'}`);
    } else {
      console.log(`❌ ERROR: Se esperaba ${test.expected ? 'Disponible' : 'Bloqueado'} pero se obtuvo ${isAvailable ? 'Disponible' : 'Bloqueado'}`);
    }
  }
}

testConflict();
