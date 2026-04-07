import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, PlusCircle, CheckCircle2, ChevronLeft, ChevronRight, Calendar, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  type: "bot" | "user";
  content: string | React.ReactNode;
  timestamp: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content: "Hola 👋 Soy el asistente virtual. ¿En qué puedo ayudarte?",
      timestamp: "10:00 AM",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    addMessage(userMsg);
    setInput("");
    
    // Simulate Bot Response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "¡Hola! ¿Qué servicio te gustaría agendar?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      addMessage(botMsg);
      setStep(1);
    }, 1500);
  };

  const handleQuickReply = (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    addMessage(userMsg);
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      if (step === 1) {
        addMessage({
          id: Date.now().toString(),
          type: "bot",
          content: "¿Qué día y hora te vendría mejor?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setStep(2);
      }
    }, 1000);
  };

  const handleBooking = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setStep(3);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] max-w-3xl mx-auto w-full px-4 pt-6">
      {/* Header Info */}
      <div className="mb-8 pl-4 border-l-4 border-primary">
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Asistente Virtual</h1>
        <p className="text-sm text-on-surface-variant font-medium">Estamos listos para ayudarte con tus consultas médicas.</p>
      </div>

      {/* Chat History */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto flex flex-col gap-6 pb-32 scroll-smooth no-scrollbar"
      >
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.type === "user" ? "items-end" : "items-start"} max-w-[85%] ${msg.type === "user" ? "ml-auto" : ""}`}
            >
              <div className={`flex items-center gap-2 mb-1 ${msg.type === "user" ? "mr-2" : "ml-2"}`}>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${msg.type === "bot" ? "text-primary" : "text-slate-500"}`}>
                  {msg.type === "bot" ? "Concierge AI" : "Tú"}
                </span>
                <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
              </div>
              <div className={`p-4 rounded-2xl chat-bubble-shadow ${
                msg.type === "bot" 
                  ? "bg-white text-on-surface rounded-tl-none" 
                  : "bg-primary text-on-primary rounded-tr-none"
              }`}>
                <div className="text-sm leading-relaxed">{msg.content}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Quick Replies */}
        {step === 0 && !isTyping && (
          <div className="flex flex-wrap gap-2 py-2">
            <button 
              onClick={() => handleQuickReply("Agendar cita")}
              className="bg-blue-100 text-primary px-4 py-2 rounded-full text-xs font-semibold hover:bg-blue-200 transition-all active:scale-95"
            >
              Agendar cita
            </button>
            <button 
              onClick={() => handleQuickReply("Ver servicios")}
              className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-xs font-semibold hover:bg-slate-200 transition-all active:scale-95"
            >
              Ver servicios
            </button>
            <button 
              onClick={() => handleQuickReply("Hablar con alguien")}
              className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-xs font-semibold hover:bg-slate-200 transition-all active:scale-95"
            >
              Hablar con alguien
            </button>
          </div>
        )}

        {/* Service Options */}
        {step === 1 && !isTyping && (
          <div className="flex flex-wrap gap-2 py-2">
            {["Limpieza Dental", "Consulta General", "Blanqueamiento"].map((service) => (
              <button 
                key={service}
                onClick={() => handleQuickReply(service)}
                className="bg-white border border-slate-200 text-primary px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-50 transition-all"
              >
                {service}
              </button>
            ))}
          </div>
        )}

        {/* Calendar Widget */}
        {step === 2 && !isTyping && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-on-surface">Octubre 2024</span>
              <div className="flex gap-2">
                <ChevronLeft className="h-5 w-5 text-slate-400 cursor-pointer" />
                <ChevronRight className="h-5 w-5 text-slate-400 cursor-pointer" />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {[
                { d: "Lun", n: "14" },
                { d: "Mar", n: "15", active: true },
                { d: "Mie", n: "16" },
                { d: "Jue", n: "17" },
                { d: "Vie", n: "18" },
              ].map((day) => (
                <div 
                  key={day.n}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                    day.active ? "bg-primary text-on-primary ring-2 ring-primary ring-offset-2" : "bg-slate-50"
                  }`}
                >
                  <span className={`text-[10px] uppercase font-bold ${day.active ? "opacity-80" : "text-slate-400"}`}>{day.d}</span>
                  <span className="text-sm font-bold">{day.n}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["09:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "03:30 PM", "05:00 PM"].map((time, i) => (
                <button 
                  key={time}
                  onClick={handleBooking}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    i === 4 ? "bg-primary text-on-primary" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Success State */}
        {step === 3 && !isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-8 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="text-emerald-600 h-10 w-10" />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-emerald-100 max-w-sm">
              <h3 className="text-xl font-bold text-on-surface mb-2">Perfecto, tu cita ha sido registrada ✅</h3>
              <p className="text-on-surface-variant text-sm mb-6">Hemos enviado los detalles a tu correo electrónico y estamos preparando todo para recibirte.</p>
              <button className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity">
                <MessageSquare className="h-5 w-5" />
                Continuar en WhatsApp
              </button>
            </div>
          </motion.div>
        )}

        {isTyping && (
          <div className="flex items-center gap-2 ml-4 mt-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
            <span className="text-[11px] font-medium text-primary/60 italic">is typing...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-20 md:bottom-8 left-0 w-full px-4 md:px-0 z-40">
        <div className="max-w-3xl mx-auto w-full">
          <div className="bg-white/80 backdrop-blur-2xl p-2 rounded-3xl chat-bubble-shadow flex items-center gap-2 border border-white/50 shadow-2xl">
            <button className="p-2 text-slate-400 hover:text-primary transition-colors">
              <PlusCircle className="h-6 w-6" />
            </button>
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Escribe tu mensaje..."
              className="flex-grow bg-transparent border-none focus:ring-0 text-sm py-3 text-on-surface placeholder:text-slate-300 outline-none"
            />
            <button 
              onClick={handleSend}
              className="bg-primary hover:bg-primary-container text-on-primary w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-90"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
