import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface ExtractedInfo {
  name?: string;
  service?: string;
  datetime?: string;
  intent: "book" | "cancel" | "reschedule" | "query" | "other";
  answer?: string; // For direct responses to queries
}

class AIService {
  /**
   * Extracts entities and intent from a message using Gemini
   * Now with business context to answer FAQs
   */
  async extractEntities(message: string, availableServices: string[], tenantConfig?: any): Promise<ExtractedInfo> {
    if (!process.env.GEMINI_API_KEY) {
      logger.warn("GEMINI_API_KEY not found. Falling back to basic intent detection.");
      return this.fallbackExtraction(message);
    }

    try {
      const businessContext = tenantConfig ? `
        Información del Negocio:
        - Nombre: ${tenantConfig.name}
        - WhatsApp: ${tenantConfig.whatsappNumber}
        - Horarios: ${tenantConfig.businessHours.start} a ${tenantConfig.businessHours.end}
        - Días de atención: ${tenantConfig.businessHours.days.map((d: number) => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d]).join(', ')}
        - Servicios: ${availableServices.join(", ")}
      ` : "";

      const prompt = `
        Eres un asistente de recepción premium llamado CitaIA para un negocio.
        Tu objetivo es ayudar a agendar citas o responder dudas sobre el negocio.
        
        ${businessContext}
        Fecha/Hora actual: ${new Date().toLocaleString()}

        Si el usuario hace una pregunta sobre el negocio (horarios, ubicación, servicios, contacto), genera una respuesta amigable y profesional en el campo "answer".
        Si el usuario quiere agendar, extraer los datos.

        Mensaje: "${message}"

        JSON schema (devuelve solo el JSON):
        {
          "name": string (solo si el usuario se presenta),
          "service": string (debe coincidir exactamente con uno de los servicios disponibles si se menciona),
          "datetime": string (si se menciona una fecha/hora, ponla en texto natural ej: "lunes 10am"),
          "intent": "book" | "cancel" | "reschedule" | "query" | "other",
          "answer": string (solo si es una pregunta que puedes responder con la información del negocio, de lo contrario null)
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Basic JSON cleaning
      text = text.replace(/```json|```/gi, "").trim();
      return JSON.parse(text);
    } catch (error) {
      logger.error("Error in AI extraction:", error);
      return this.fallbackExtraction(message);
    }
  }

  private fallbackExtraction(message: string): ExtractedInfo {
    const msg = message.toLowerCase();
    let intent: any = "book";
    if (msg.includes("cancelar")) intent = "cancel";
    if (msg.includes("reprogramar") || msg.includes("cambiar")) intent = "reschedule";
    if (msg.includes("horarios") || msg.includes("disponibles")) intent = "query";

    return { intent };
  }

  /**
   * Generates a natural response based on the missing information
   */
  async generateResponse(context: string, nextStep: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) return ""; // Fallback will handle it

    try {
      const prompt = `
        Actúa como un asistente de recepción premium y amable.
        Contexto actual: ${context}
        Siguiente paso necesario: ${nextStep}
        
        Genera una respuesta corta, profesional y cálida (máximo 2 frases).
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (e) {
      return "";
    }
  }
}

export const aiService = new AIService();
