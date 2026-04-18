import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface ExtractedInfo {
  name?: string;
  service?: string;
  datetime?: string; // Should be in a parseable format
  intent: "book" | "cancel" | "reschedule" | "query" | "other";
}

class AIService {
  /**
   * Extracts entities and intent from a message using Gemini
   */
  async extractEntities(message: string, availableServices: string[]): Promise<ExtractedInfo> {
    if (!process.env.GEMINI_API_KEY) {
      logger.warn("GEMINI_API_KEY not found. Falling back to basic intent detection.");
      return this.fallbackExtraction(message);
    }

    try {
      const prompt = `
        Eres un asistente de extracción de datos para una clínica.
        Analiza el siguiente mensaje y extrae la información en formato JSON.
        
        Servicios disponibles: ${availableServices.join(", ")}
        Fecha/Hora actual: ${new Date().toLocaleString()}

        Mensaje: "${message}"

        JSON schema (devuelve solo el JSON):
        {
          "name": string (nombre del paciente si se menciona),
          "service": string (debe coincidir con uno de los servicios disponibles o ser el más cercano),
          "datetime": string (fecha y hora solicitada en formato ISO si es posible determinarla),
          "intent": "book" | "cancel" | "reschedule" | "query" | "other"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Basic JSON cleaning
      const cleaned = text.replace(/```json|```/gi, "").trim();
      return JSON.parse(cleaned);
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
