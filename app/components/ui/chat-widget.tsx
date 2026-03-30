"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const greetings = {
  en: {
    title: "Counter Cultures",
    subtitle: "How can we help?",
    placeholder: "Ask about products, pricing, showroom visits...",
    greeting:
      "Welcome to Counter Cultures! I can help you with product information, pricing, showroom visits, our trade program, or artisanal commissions. What are you looking for?",
  },
  es: {
    title: "Counter Cultures",
    subtitle: "¿Cómo podemos ayudarte?",
    placeholder: "Pregunta sobre productos, precios, visitas al showroom...",
    greeting:
      "¡Bienvenido a Counter Cultures! Puedo ayudarte con información de productos, precios, visitas al showroom, nuestro programa trade o encargos artesanales. ¿Qué estás buscando?",
  },
};

const ChatWidget = ({ locale = "en" }: { locale?: string }) => {
  const lang = (locale as "en" | "es") || "en";
  const t = greetings[lang];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: t.greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages([...updated, { role: "assistant", content: data.message }]);
    } catch {
      setMessages([
        ...updated,
        {
          role: "assistant",
          content:
            lang === "es"
              ? "Lo siento, no pude responder. Por favor intenta de nuevo o contáctanos por WhatsApp."
              : "Sorry, I couldn\u2019t respond. Please try again or reach us on WhatsApp.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat bubble */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-terracotta text-white shadow-lg hover:bg-brand-copper transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Open chat"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] bg-white rounded-xl shadow-2xl border border-brand-stone/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-brand-charcoal px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-display text-base text-white tracking-wide">
                  {t.title}
                </h3>
                <p className="font-body text-xs text-white/60 mt-0.5">
                  {t.subtitle}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-10 h-10 text-white/60 hover:text-white transition-colors cursor-pointer"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl font-body text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-brand-terracotta text-white rounded-br-md"
                        : "bg-brand-sand/50 text-brand-charcoal rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-brand-sand/50 px-4 py-2.5 rounded-2xl rounded-bl-md">
                    <Loader2 className="w-4 h-4 text-brand-stone animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={send}
              className="shrink-0 border-t border-brand-stone/10 px-4 py-3 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder}
                className="flex-1 font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 outline-none bg-transparent"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 text-brand-terracotta hover:text-brand-copper disabled:text-brand-stone/30 transition-colors cursor-pointer disabled:cursor-default"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export { ChatWidget };
