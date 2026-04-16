import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, CheckCircle2, MessageSquare, ChevronLeft, Paperclip, Smile, MoreVertical } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import avatar from "../assets/avatar.png";
import API_BASE_URL from "../api-config";

interface Message {
  id: string;
  type: "bot" | "user";
  content: string | React.ReactNode;
  timestamp: string;
}

export default function ChatPage() {
  const { tenantId = "pitaya" } = useParams();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content: "Hola 👋 Soy CitaIA, tu asistente virtual. ¿Qué servicio te gustaría agendar hoy?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [serverStep, setServerStep] = useState("greeting");
  const [options, setOptions] = useState<string[]>(["Agendar Cita", "Ver Servicios", "Hablar con alguien"]);
  const [bookingData, setBookingData] = useState<any>({});
  const [whatsappNumber, setWhatsappNumber] = useState("5216441942690");
  const [businessName, setBusinessName] = useState("");
  
  const sessionId = useMemo(() => Math.random().toString(36).substring(7), []);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch tenant config for whatsapp number
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/${tenantId}/config`);
        const data = await res.json();
        if (data.whatsappNumber) setWhatsappNumber(data.whatsappNumber);
        if (data.name) setBusinessName(data.name);
      } catch (e) {
        console.error("ChatPage config fetch error:", e);
      }
    };
    fetchConfig();
  }, [tenantId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, options]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setOptions([]); 
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/${tenantId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setOptions(data.options || []);
      setServerStep(data.step);
      setBookingData(data.data || {});
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const generateWhatsAppUrl = () => {
    let message = "Hola, ";
    if (serverStep === 'confirmed') {
      message += `soy ${bookingData.name || 'un cliente'} y acabo de agendar un ${bookingData.service || 'servicio'} para el ${bookingData.datetime || 'un horario'} vía CitaIA.`;
    } else {
      message += "vengo de CitaIA y me gustaría hablar con un asesor.";
    }
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="flex flex-col h-screen wa-background overflow-hidden">
      {/* WhatsApp Header */}
      <header className="bg-[#008069] text-white px-4 py-3 flex items-center justify-between shadow-md z-50">
        <div className="flex items-center gap-2">
          <Link to={`/${tenantId}`} className="p-1 hover:bg-black/10 rounded-full transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div className="relative">
            <img 
              src={avatar} 
              alt="CitaIA" 
              className="h-10 w-10 rounded-full bg-white object-cover border border-white/20"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#008069] rounded-full"></div>
          </div>
          <div className="flex flex-col ml-1">
            <h1 className="text-[16px] font-bold leading-tight">{businessName || "CitaIA"}</h1>
            <span className="text-[11px] opacity-90">en línea</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <MoreVertical className="h-5 w-5 opacity-80 cursor-not-allowed" />
        </div>
      </header>

      {/* Chat History */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto px-4 py-6 wa-scrollbar flex flex-col gap-4 pb-32"
      >
        <div className="flex justify-center mb-4">
          <span className="bg-[#d1e4fc] text-[11px] text-[#54656f] px-3 py-1 rounded-lg uppercase font-bold shadow-sm">
            Hoy
          </span>
        </div>

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex flex-col ${msg.type === "user" ? "items-end ml-12" : "items-start mr-12"}`}
            >
              <div className={msg.type === "bot" ? "wa-bubble-bot" : "wa-bubble-user"}>
                <div className="text-[14.5px] leading-relaxed pr-8">
                  {typeof msg.content === 'string' ? msg.content : msg.content}
                </div>
                <span className="absolute bottom-1 right-2 text-[10px] text-[#667781] flex items-center gap-1">
                  {msg.timestamp}
                  {msg.type === "user" && <span className="text-[#53bdeb] text-xs">✓✓</span>}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start gap-2 max-w-[80%]">
            <div className="wa-bubble-bot py-3 px-4">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#667781] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-[#667781] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-[#667781] rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Replies */}
        {!isTyping && options.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 justify-center py-4 px-4 sticky bottom-0"
          >
            {options.map((opt) => (
              <button 
                key={opt}
                onClick={() => opt.includes("WhatsApp") || opt.includes("Hablar") ? window.open(generateWhatsAppUrl(), '_blank') : handleSend(opt)}
                className={`px-4 py-2 rounded-full text-[13.5px] font-semibold transition-all active:scale-95 shadow-md border border-white/50 ${
                  opt.includes("WhatsApp") 
                    ? "bg-[#25D366] text-white" 
                    : "bg-white text-[#008069]"
                }`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}

        {/* Confirmation Card */}
        {serverStep === 'confirmed' && !isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center py-4"
          >
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-emerald-100 max-w-sm text-center">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-[#111b21] mb-2">¡Cita Confirmada!</h3>
              <p className="text-sm text-[#667781] mb-6">
                Tu cita para <strong>{bookingData.service}</strong> ha sido registrada en el sistema.
              </p>
              <a 
                href={generateWhatsAppUrl()}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 px-6 rounded-lg w-full transition-all hover:brightness-105 active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                <MessageSquare className="h-5 w-5" />
                Abrir WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </div>

      {/* WhatsApp Input Bar */}
      <div className="p-2 pb-6 bg-[#f0f2f5] border-t border-[#d1d7db] flex items-center gap-2">
        <div className="flex-grow bg-white rounded-full px-4 py-1.5 flex items-center gap-3 shadow-sm">
          <Smile className="h-6 w-6 text-[#667781] cursor-not-allowed" />
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Mensaje"
            className="flex-grow bg-transparent border-none focus:ring-0 text-[15px] py-2 text-[#111b21] placeholder:text-[#667781] outline-none"
          />
          <Paperclip className="h-6 w-6 text-[#667781] -rotate-45 cursor-not-allowed" />
        </div>
        <button 
          onClick={() => handleSend()}
          disabled={isTyping || !input.trim()}
          className="bg-[#00a884] text-white w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 shadow-md"
        >
          <Send className="h-5 w-5 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
