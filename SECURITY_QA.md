# CitaIA - Security & Quality Assurance (QA) Guide

Este documento consolida las estrategias de seguridad implementadas, la arquitectura de despliegue, y los flujos de aseguramiento de calidad (QA) requeridos para mantener el proyecto CitaIA libre de vulnerabilidades y en un estado óptimo para producción.

---

## 1. Arquitectura de Seguridad (Implementada)

### 1.1 Contenedores y Redes (Hetzner)
* **Aislamiento de Red:** El API de consultas de CitaIA interactúa de forma aislada a través de la red personalizada `pitaya_net`, separando el tráfico externo del sistema de base de datos (`luxury-mysql-prod`).
* **Nginx Proxy Manager:** Se utiliza como capa de terminación SSL, denegando el tráfico en puertos directos (80/3013) expuestos maliciosamente en el Firewall y forzando la seguridad y cifrado mediante HTTPS.

### 1.2 Protección de Credenciales y Repositorio (GitHub)
* **Política Global de `.gitignore`:** Ningún archivo de variables de entorno o credenciales sensibles (`**/.env`, `**/.env.production`, `**/.env.deploy`, `*.sqlite`, `*keys.json`) es rastreado por Git.
* **Scrubbing de Historial (Reescritura de Git):** Toda la historia de los repositorios fue purgada quirúrgicamente para eliminar de forma permanente errores de los primeros commits donde se expusieron contraseñas de Hostinger u OpenSSL Keys. Ya no hay rastro activo de claves fugaces en commits antiguos.

### 1.3 Análisis y Criptografía de Google API
* **Hardening de parseo de Llaves Privadas:** La aplicación incluye inyección segura de las credenciales de Google Service Accounts y remueva caracteres inyectados, literales o retornos de Windows (`\r`, `\n`) previniendo colapsos tipo `ERR_OSSL_UNSUPPORTED` en Node 20.
* **Autenticación SSH:** Los deploys a producción ahora se ejecutan exclusivamente a través de flujos autenticados mediante pares de llaves `rsa` (`id_citaia`) sin delegar tokens a Git.

### 1.4 Reglas de Accesibilidad (CORS)
* En lugar de accesos genéricos tipo `*`, la instancia prohíbe el tráfico ajeno forzando un mapeo explícito de la variable `CORS_ORIGINS` (Ej. `https://citaia.pitayacode.io`), previniendo que portales de terceros roben/accedan indebidamente a las peticiones hacia el API.

---

## 2. Protocolo de Quality Assurance (QA) y Chequeos Generales

Cada vez que liberes nuevas funciones o re-despliegues partes del sistema, ejecuta el siguiente protocolo QA.

### ✅ Checklist Básico de Despliegue
- [ ] **Validación CORS**: Abrir el front-end y asegurarse de que la consola del navegador `(F12)` reporte una carga exitosa a las validaciones API (`GET /api/pitaya/config`).
- [ ] **Validación DNS y Certificado**: Comprobar en web que el sitio sea visible usando `https://` y no caduque o tenga SSL inválidamente configurado.
- [ ] **Integridad de Entorno**: Validar que los archivos de entorno no se han sobreescrito localmente de `.env.example` a los originales.
- [ ] **Verificar Commits Seguros**: Antes de `git push`, ejecutar en terminal `git status` para confirmar que ningún archivo `.env` o secreto se muestre como 'Untracked' o 'Modified'. 

### ✅ Checklist de Google Calendar
- [ ] Ejecutar una demostración de chat como cliente pidiendo 'agenda' y 'espacios' y checar que se ofrezcan citas (Se validó correcta inyección de OpenSSL).
- [ ] Agendar una cita de prueba para verificar que el API de Google retorne bloqueos posteriores en esa hora (`isSlotAvailable()`) regresando un fallo correctamente en caso de que alguien empalme su horario.

### ✅ Checklist del Servidor Backend (API Logs)
- [ ] Al reiniciar el contenedor en Hetzner: `docker logs --tail 30 appointment-api` debe arrojar `running on port 3013`. Ninguna conexión de Prisma, OpenSSL o MySQL debe mostrarse como PANIC o CRASH.
- [ ] Comprobar que en el *Nginx Proxy Manager* la conexión re-dija explícitamente a `appointment-api` por el puerto exacto (ej. 3013) tras actualizaciones al Docker Compose.

---

## 3. Manejo de Incidentes
Ante la exposición o filtración de claves:
1. **GitHub Alert**: Si recibes advertencias de "Secret exposed". Ignorar si sabemos que el archivo fue sobrescrito artificialmente, O aplicar `git filter-branch --force --index-filter` inmediatamente al archivo.
2. Reponer en caliente (*rotate*): Entrar vía SSH a VPS y reescribir inmediatamente la clave afectada en `api/.env.production` para luego hacer un reinicio con `docker compose restart`.
