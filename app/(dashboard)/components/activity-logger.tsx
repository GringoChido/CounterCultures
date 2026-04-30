"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Phone,
  Mail,
  MessageCircle,
  Users,
  FileText,
  Plus,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ActivityType = "call" | "email" | "meeting" | "note" | "whatsapp";

interface LogEntry {
  type: ActivityType;
  contactName: string;
  description: string;
  followUpDate?: string;
  dealId?: string;
}

const activityOptions: { type: ActivityType; label: string; icon: React.ElementType; color: string }[] = [
  { type: "call", label: "Call", icon: Phone, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { type: "email", label: "Email", icon: Mail, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { type: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "bg-green-500/10 text-green-400 border-green-500/20" },
  { type: "meeting", label: "Meeting", icon: Users, color: "bg-brand-copper/10 text-brand-copper border-brand-copper/20" },
  { type: "note", label: "Note", icon: FileText, color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
];

interface ActivityLoggerProps {
  onLog?: (entry: LogEntry) => void;
  defaultContact?: string;
  defaultDealId?: string;
  compact?: boolean;
}

const ActivityLogger = ({ onLog, defaultContact = "", defaultDealId, compact = false }: ActivityLoggerProps) => {
  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState<LogEntry>({
    type: "call",
    contactName: defaultContact,
    description: "",
    followUpDate: "",
    dealId: defaultDealId,
  });

  const handleSubmit = () => {
    if (!entry.description.trim()) return;
    onLog?.(entry);
    setEntry({ type: "call", contactName: defaultContact, description: "", followUpDate: "", dealId: defaultDealId });
    setOpen(false);
  };

  if (compact) {
    return (
      <>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-brand-copper/10 text-brand-copper hover:bg-brand-copper/20 transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          Log
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 top-full mt-2 w-80 bg-dash-surface border border-dash-border rounded-xl shadow-xl z-30 p-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-dash-text">Log Activity</span>
                  <button onClick={() => setOpen(false)} className="cursor-pointer">
                    <X className="w-4 h-4 text-dash-text-secondary" />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  {activityOptions.map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => setEntry({ ...entry, type: opt.type })}
                      className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                        entry.type === opt.type ? opt.color : "border-dash-border text-dash-text-secondary hover:border-dash-text-secondary"
                      }`}
                      title={opt.label}
                    >
                      <opt.icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
                <textarea
                  value={entry.description}
                  onChange={(e) => setEntry({ ...entry, description: e.target.value })}
                  placeholder="What happened?"
                  className="w-full h-16 px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-xs text-dash-text placeholder-dash-text-secondary/50 resize-none focus:outline-none focus:border-brand-copper/50"
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={entry.followUpDate || ""}
                    onChange={(e) => setEntry({ ...entry, followUpDate: e.target.value })}
                    className="flex-1 px-2 py-1.5 bg-dash-bg border border-dash-border rounded-lg text-xs text-dash-text focus:outline-none focus:border-brand-copper/50"
                    placeholder="Follow-up"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!entry.description.trim()}
                    className="px-3 py-1.5 bg-brand-copper text-white rounded-lg text-xs font-medium hover:bg-brand-copper/90 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-dash-text">Log Activity</h3>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-copper text-white rounded-lg text-xs font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            New Activity
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4">
              {/* Activity type */}
              <div className="flex gap-2">
                {activityOptions.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => setEntry({ ...entry, type: opt.type })}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      entry.type === opt.type ? opt.color : "border-dash-border text-dash-text-secondary hover:border-dash-text-secondary"
                    }`}
                  >
                    <opt.icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Contact name */}
              <input
                type="text"
                value={entry.contactName}
                onChange={(e) => setEntry({ ...entry, contactName: e.target.value })}
                placeholder="Contact name"
                className="w-full px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text placeholder-dash-text-secondary/50 focus:outline-none focus:border-brand-copper/50"
              />

              {/* Description */}
              <textarea
                value={entry.description}
                onChange={(e) => setEntry({ ...entry, description: e.target.value })}
                placeholder="What happened? Key takeaways, next steps..."
                className="w-full h-20 px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text placeholder-dash-text-secondary/50 resize-none focus:outline-none focus:border-brand-copper/50"
              />

              {/* Follow-up date */}
              <div>
                <label className="block text-xs text-dash-text-secondary mb-1">Follow-up date (optional)</label>
                <input
                  type="date"
                  value={entry.followUpDate || ""}
                  onChange={(e) => setEntry({ ...entry, followUpDate: e.target.value })}
                  className="px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text focus:outline-none focus:border-brand-copper/50"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={!entry.description.trim()}
                  className="px-4 py-2 bg-brand-copper text-white rounded-lg text-sm font-medium hover:bg-brand-copper/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Log Activity
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 border border-dash-border text-dash-text rounded-lg text-sm font-medium hover:bg-dash-bg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { ActivityLogger };
