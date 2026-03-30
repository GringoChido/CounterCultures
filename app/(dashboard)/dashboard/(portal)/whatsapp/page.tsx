"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MessageCircle, Send, Phone, MoreVertical, Search, Check, CheckCheck } from "lucide-react";

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  avatar: string;
  phone: string;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "contact";
  timestamp: Date;
  read: boolean;
}

const conversations: Conversation[] = [
  {
    id: "1",
    name: "Maria Rodriguez",
    lastMessage: "I'd love to see the copper basin collection in person",
    timestamp: new Date(2026, 2, 30, 14, 23),
    unread: 2,
    avatar: "MR",
    phone: "+52 415 123 4567",
  },
  {
    id: "2",
    name: "James Patterson",
    lastMessage: "Can you send the spec sheet for the farmhouse sink?",
    timestamp: new Date(2026, 2, 30, 11, 45),
    unread: 0,
    avatar: "JP",
    phone: "+1 512 555 0123",
  },
  {
    id: "3",
    name: "Sofia Gutierrez",
    lastMessage: "The trade program application is ready for review",
    timestamp: new Date(2026, 2, 29, 16, 30),
    unread: 1,
    avatar: "SG",
    phone: "+52 55 9876 5432",
  },
  {
    id: "4",
    name: "David Chen",
    lastMessage: "Thanks for the quote! We'll discuss and get back to you",
    timestamp: new Date(2026, 2, 29, 9, 15),
    unread: 0,
    avatar: "DC",
    phone: "+1 310 555 7890",
  },
  {
    id: "5",
    name: "Ana Morales",
    lastMessage: "The delivery was perfect, very happy with the pieces",
    timestamp: new Date(2026, 2, 28, 18, 0),
    unread: 0,
    avatar: "AM",
    phone: "+52 415 987 6543",
  },
];

const sampleMessages: Record<string, Message[]> = {
  "1": [
    { id: "m1", text: "Hi! I saw your copper basins on Instagram. They're beautiful!", sender: "contact", timestamp: new Date(2026, 2, 30, 13, 45), read: true },
    { id: "m2", text: "Thank you, Maria! Each piece is hand-hammered by artisans in Santa Clara del Cobre. Would you like to know more about any specific design?", sender: "user", timestamp: new Date(2026, 2, 30, 13, 50), read: true },
    { id: "m3", text: "Yes! The oval basin with the natural patina finish caught my eye. What sizes do you have?", sender: "contact", timestamp: new Date(2026, 2, 30, 14, 10), read: true },
    { id: "m4", text: "We have that in 16\", 18\", and 20\" widths. The 18\" is our most popular. I can send you the full spec sheet.", sender: "user", timestamp: new Date(2026, 2, 30, 14, 15), read: true },
    { id: "m5", text: "That would be great! Also, do you have a showroom I could visit?", sender: "contact", timestamp: new Date(2026, 2, 30, 14, 20), read: false },
    { id: "m6", text: "I'd love to see the copper basin collection in person", sender: "contact", timestamp: new Date(2026, 2, 30, 14, 23), read: false },
  ],
  "2": [
    { id: "m7", text: "Hi, I'm working on a kitchen remodel project. Do you carry farmhouse sinks?", sender: "contact", timestamp: new Date(2026, 2, 30, 10, 0), read: true },
    { id: "m8", text: "Absolutely! We have several copper farmhouse sinks. Are you looking for a specific size?", sender: "user", timestamp: new Date(2026, 2, 30, 10, 30), read: true },
    { id: "m9", text: "33\" single bowl would be ideal. My client loves the hammered copper look.", sender: "contact", timestamp: new Date(2026, 2, 30, 11, 0), read: true },
    { id: "m10", text: "Can you send the spec sheet for the farmhouse sink?", sender: "contact", timestamp: new Date(2026, 2, 30, 11, 45), read: true },
  ],
};

const WhatsAppPage = () => {
  const [selectedConversation, setSelectedConversation] = useState<string>("1");
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const activeConversation = conversations.find((c) => c.id === selectedConversation);
  const messages = sampleMessages[selectedConversation] ?? [];

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dash-text">WhatsApp Inbox</h2>
        <p className="text-sm text-dash-text-secondary mt-1">Manage customer conversations</p>
      </div>

      <div className="bg-dash-surface rounded-xl border border-dash-border overflow-hidden flex h-[calc(100vh-220px)] min-h-[500px]">
        <div className="w-80 border-r border-dash-border flex flex-col shrink-0">
          <div className="p-3 border-b border-dash-border">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dash-text-secondary" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full flex items-start gap-3 p-3 border-b border-dash-border hover:bg-dash-bg/50 transition-colors text-left cursor-pointer ${
                  selectedConversation === conv.id ? "bg-brand-copper/5 border-l-2 border-l-brand-copper" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-brand-copper/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-brand-copper">{conv.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-dash-text truncate">{conv.name}</p>
                    <span className="text-[10px] text-dash-text-secondary shrink-0 ml-2">
                      {format(conv.timestamp, "h:mm a")}
                    </span>
                  </div>
                  <p className="text-xs text-dash-text-secondary truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-brand-copper flex items-center justify-center shrink-0 mt-1">
                    <span className="text-[10px] font-bold text-white">{conv.unread}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              <div className="flex items-center justify-between p-4 border-b border-dash-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-copper/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-brand-copper">{activeConversation.avatar}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dash-text">{activeConversation.name}</p>
                    <p className="text-xs text-dash-text-secondary">{activeConversation.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-dash-bg transition-colors cursor-pointer">
                    <Phone className="w-4 h-4 text-dash-text-secondary" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-dash-bg transition-colors cursor-pointer">
                    <MoreVertical className="w-4 h-4 text-dash-text-secondary" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-dash-bg/30">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                        msg.sender === "user"
                          ? "bg-brand-copper text-white rounded-br-sm"
                          : "bg-dash-surface border border-dash-border text-dash-text rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${msg.sender === "user" ? "text-white/60" : "text-dash-text-secondary"}`}>
                        <span className="text-[10px]">{format(msg.timestamp, "h:mm a")}</span>
                        {msg.sender === "user" && (
                          msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-dash-border">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                  />
                  <button className="p-2.5 bg-brand-copper rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer">
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-dash-text-secondary/30 mx-auto mb-3" />
                <p className="text-sm text-dash-text-secondary">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPage;
