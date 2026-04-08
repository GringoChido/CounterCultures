"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  isPast,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/app/(dashboard)/components/status-badge";
import { SlideOut } from "@/app/(dashboard)/components/slide-out";
import { sampleScheduledPosts, samplePosts } from "@/app/lib/social/sample-data";
import type { SocialPlatform } from "@/app/lib/social/types";

const platformColors: Record<SocialPlatform, string> = {
  instagram: "bg-pink-500",
  facebook: "bg-blue-600",
};

const platformLabels: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
};

const statusConfig = {
  scheduled: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200", label: "Scheduled" },
  published: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50", border: "border-green-200", label: "Published" },
  failed: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50", border: "border-red-200", label: "Failed" },
};

interface CalendarEvent {
  id: string;
  title: string;
  platforms: SocialPlatform[];
  date: Date;
  time: string;
  status: "scheduled" | "published" | "failed";
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CONTENT_TYPES = ["blog-post", "social-post", "email-newsletter", "product-spotlight", "project-showcase", "press-release"] as const;
const PLATFORMS = ["instagram", "facebook", "website", "email"] as const;
const CONTENT_STATUSES = ["draft", "scheduled", "published", "failed"] as const;

const ContentCalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2, 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "", type: "social-post" as string, platform: "instagram" as string,
    scheduled_date: "", status: "draft" as string, author: "Roger", notes: "",
  });

  // Merge scheduled + published posts into calendar events
  const calendarEvents: CalendarEvent[] = [
    ...sampleScheduledPosts.map((sp) => ({
      id: sp.id,
      title: sp.message.slice(0, 50) + (sp.message.length > 50 ? "..." : ""),
      platforms: sp.platforms,
      date: new Date(sp.scheduledAt),
      time: format(new Date(sp.scheduledAt), "h:mm a"),
      status: sp.status as "scheduled" | "published" | "failed",
    })),
    ...samplePosts.slice(0, 6).map((p) => ({
      id: p.id,
      title: p.message.slice(0, 50) + (p.message.length > 50 ? "..." : ""),
      platforms: [p.platform],
      date: new Date(p.createdAt),
      time: format(new Date(p.createdAt), "h:mm a"),
      status: "published" as const,
    })),
  ];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const getEventsForDay = (day: Date) =>
    calendarEvents.filter((e) => isSameDay(e.date, day));

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  // Stats
  const scheduledCount = calendarEvents.filter((e) => e.status === "scheduled").length;
  const publishedCount = calendarEvents.filter((e) => e.status === "published").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Content Calendar</h2>
          <p className="text-sm text-dash-text-secondary mt-1">
            Plan and schedule your social media content
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 text-xs text-dash-text-secondary mr-4">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              {scheduledCount} scheduled
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              {publishedCount} published
            </span>
          </div>
          <button
            onClick={() => {
              setNewPost({
                title: "", type: "social-post", platform: "instagram",
                scheduled_date: selectedDay ? format(selectedDay, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
                status: "draft", author: "Roger", notes: "",
              });
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-copper text-white rounded-lg text-sm font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Post
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Calendar */}
        <div className="xl:col-span-3 bg-dash-surface rounded-xl border border-dash-border">
          <div className="flex items-center justify-between p-5 border-b border-dash-border">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-dash-text" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-copper" />
              <h3 className="text-lg font-semibold text-dash-text">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
            </div>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-dash-text" />
            </button>
          </div>

          <div className="grid grid-cols-7">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-dash-text-secondary border-b border-dash-border"
              >
                {day}
              </div>
            ))}

            {Array.from({ length: startPadding }).map((_, i) => (
              <div
                key={`pad-${i}`}
                className="min-h-[100px] border-b border-r border-dash-border bg-dash-bg/30"
              />
            ))}

            {days.map((day) => {
              const events = getEventsForDay(day);
              const today = isToday(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[100px] border-b border-r border-dash-border p-2 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-brand-copper/5 ring-1 ring-inset ring-brand-copper/20"
                      : today
                      ? "bg-brand-copper/5"
                      : "hover:bg-dash-bg/50"
                  }`}
                >
                  <span
                    className={`text-xs font-medium ${
                      today
                        ? "bg-brand-copper text-white w-6 h-6 rounded-full flex items-center justify-center"
                        : "text-dash-text-secondary"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-1">
                    {events.slice(0, 3).map((event) => {
                      const StatusIcon = statusConfig[event.status].icon;
                      return (
                        <div
                          key={event.id}
                          className="flex items-center gap-1 group"
                        >
                          <StatusIcon
                            className={`w-2.5 h-2.5 shrink-0 ${statusConfig[event.status].color}`}
                          />
                          <div className="flex items-center gap-1 min-w-0">
                            {event.platforms.map((p) => (
                              <div
                                key={p}
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${platformColors[p]}`}
                              />
                            ))}
                            <span className="text-[10px] text-dash-text truncate group-hover:text-brand-copper transition-colors">
                              {event.title.slice(0, 20)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {events.length > 3 && (
                      <span className="text-[10px] text-brand-copper font-medium">
                        +{events.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Detail Sidebar */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
            <h3 className="text-sm font-semibold text-dash-text mb-1">
              {selectedDay
                ? format(selectedDay, "EEEE, MMMM d")
                : "Select a day"}
            </h3>
            {selectedDay && (
              <p className="text-xs text-dash-text-secondary mb-4">
                {selectedDayEvents.length} post{selectedDayEvents.length !== 1 ? "s" : ""}
              </p>
            )}

            {selectedDayEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDayEvents.map((event) => {
                  const cfg = statusConfig[event.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <StatusIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-dash-text-secondary ml-auto">
                          {event.time}
                        </span>
                      </div>
                      <p className="text-xs text-dash-text leading-relaxed mb-2">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {event.platforms.map((p) => (
                          <span
                            key={p}
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              p === "instagram"
                                ? "bg-pink-100 text-pink-600"
                                : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {platformLabels[p]}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : selectedDay ? (
              <div className="text-center py-6">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-dash-text-secondary/30" />
                <p className="text-xs text-dash-text-secondary">
                  No posts on this day
                </p>
                <button
                  onClick={() => {
                    setNewPost((p) => ({ ...p, scheduled_date: selectedDay ? format(selectedDay, "yyyy-MM-dd") : "" }));
                    setShowCreateModal(true);
                  }}
                  className="text-xs text-brand-copper hover:text-brand-copper/80 mt-2 inline-block cursor-pointer"
                >
                  + Schedule a post
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-dash-text-secondary/30" />
                <p className="text-xs text-dash-text-secondary">
                  Click a day to see details
                </p>
              </div>
            )}
          </div>

          {/* Upcoming Posts List */}
          <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
            <h3 className="text-sm font-semibold text-dash-text mb-4">
              Upcoming Scheduled
            </h3>
            <div className="space-y-3">
              {sampleScheduledPosts
                .filter((sp) => sp.status === "scheduled")
                .sort(
                  (a, b) =>
                    new Date(a.scheduledAt).getTime() -
                    new Date(b.scheduledAt).getTime()
                )
                .slice(0, 5)
                .map((post) => (
                  <div
                    key={post.id}
                    className="flex items-start gap-3 py-2 border-b border-dash-border last:border-0"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-dash-text truncate">
                        {post.message.slice(0, 60)}...
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {post.platforms.map((p) => (
                          <div
                            key={p}
                            className={`w-2 h-2 rounded-full ${platformColors[p]}`}
                          />
                        ))}
                        <span className="text-[10px] text-dash-text-secondary">
                          {format(new Date(post.scheduledAt), "MMM d · h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-dash-surface rounded-xl border border-dash-border p-4">
            <div className="space-y-2">
              {(Object.entries(platformColors) as [SocialPlatform, string][]).map(
                ([platform, color]) => (
                  <div key={platform} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    <span className="text-xs text-dash-text-secondary">
                      {platformLabels[platform]}
                    </span>
                  </div>
                )
              )}
              <div className="pt-2 mt-2 border-t border-dash-border space-y-1.5">
                {(Object.entries(statusConfig) as [string, typeof statusConfig.scheduled][]).map(
                  ([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <Icon className={`w-3 h-3 ${cfg.color}`} />
                        <span className="text-xs text-dash-text-secondary">
                          {cfg.label}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Create Post SlideOut */}
      <SlideOut open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Content">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1">Title *</label>
            <input className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus:ring-1 focus:ring-brand-copper" value={newPost.title} onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Spring Collection Spotlight" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-dash-text-secondary mb-1">Content Type</label>
              <select className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus:ring-1 focus:ring-brand-copper" value={newPost.type} onChange={(e) => setNewPost((p) => ({ ...p, type: e.target.value }))}>
                {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-dash-text-secondary mb-1">Platform</label>
              <select className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus:ring-1 focus:ring-brand-copper" value={newPost.platform} onChange={(e) => setNewPost((p) => ({ ...p, platform: e.target.value }))}>
                {PLATFORMS.map((pl) => <option key={pl} value={pl}>{pl.charAt(0).toUpperCase() + pl.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-dash-text-secondary mb-1">Scheduled Date</label>
              <input type="date" className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus:ring-1 focus:ring-brand-copper" value={newPost.scheduled_date} onChange={(e) => setNewPost((p) => ({ ...p, scheduled_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-dash-text-secondary mb-1">Status</label>
              <select className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus:ring-1 focus:ring-brand-copper" value={newPost.status} onChange={(e) => setNewPost((p) => ({ ...p, status: e.target.value }))}>
                {CONTENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1">Notes</label>
            <textarea className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus:ring-1 focus:ring-brand-copper h-24 resize-none" value={newPost.notes} onChange={(e) => setNewPost((p) => ({ ...p, notes: e.target.value }))} placeholder="Content brief, talking points, hashtags..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              disabled={createSaving || !newPost.title}
              onClick={async () => {
                setCreateSaving(true);
                try {
                  const res = await fetch("/api/dashboard/content-calendar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newPost),
                  });
                  if (!res.ok) throw new Error("Failed");
                  toast.success("Content added to calendar");
                  setShowCreateModal(false);
                } catch {
                  toast.error("Error saving content");
                } finally {
                  setCreateSaving(false);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-copper text-white rounded-lg text-sm font-medium hover:bg-brand-copper/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {createSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button onClick={() => setShowCreateModal(false)} className="flex items-center gap-2 px-4 py-2 text-dash-text-secondary border border-dash-border rounded-lg text-sm hover:bg-dash-bg transition-colors cursor-pointer">
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </SlideOut>
    </div>
  );
};

export default ContentCalendarPage;
