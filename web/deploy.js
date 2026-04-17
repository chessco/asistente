import Client from 'ssh2-sftp-client';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env from .env.deploy or .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.deploy') });
dotenv.config();

const config = {
  host: process.env.DEPLOY_HOST,
  port: parseInt(process.env.DEPLOY_PORT || '22'),
  username: process.env.DEPLOY_USER,
  password: process.env.DEPLOY_PASSWORD,
  readyTimeout: 20000,
  // debug: console.log, // Descomenta esto si quieres ver el log detallado de SSH
};

async function deploy() {
  const sftp = new Client();
  const localDir = path.join(__dirname, 'dist');
  const remoteDir = process.env.DEPLOY_REMOTE_PATH || 'public_html';

  if (!fs.existsSync(localDir)) {
    console.error('Error: La carpeta "dist" no existe. Ejecuta "npm run build" primero.');
    process.exit(1);
  }

  try {
    console.log(`Conectando a ${config.host}...`);
    await sftp.connect(config);
    
    console.log(`Subiendo contenido de ${localDir} a ${remoteDir}...`);
    
    // Upload the directory content
    await sftp.uploadDir(localDir, remoteDir);

    console.log('¡Despliegue completado con éxito! 🚀');
  } catch (err) {
    console.error('Error en el despliegue:', err.message);
    process.exit(1);
  } finally {
    await sftp.end();
  }
}

deploy();
