"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react";

type Platform = "instagram" | "facebook" | "pinterest";

interface ScheduledPost {
  id: string;
  title: string;
  platform: Platform;
  date: Date;
  time: string;
}

const platformColors: Record<Platform, string> = {
  instagram: "bg-pink-500",
  facebook: "bg-blue-600",
  pinterest: "bg-red-600",
};

const platformLabels: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  pinterest: "Pinterest",
};

const samplePosts: ScheduledPost[] = [
  { id: "1", title: "New copper basin collection", platform: "instagram", date: new Date(2026, 2, 2), time: "10:00 AM" },
  { id: "2", title: "Spring sale announcement", platform: "facebook", date: new Date(2026, 2, 5), time: "2:00 PM" },
  { id: "3", title: "Artisan spotlight: Santa Clara", platform: "instagram", date: new Date(2026, 2, 9), time: "11:00 AM" },
  { id: "4", title: "Design inspiration board", platform: "pinterest", date: new Date(2026, 2, 12), time: "9:00 AM" },
  { id: "5", title: "Customer testimonial video", platform: "facebook", date: new Date(2026, 2, 15), time: "3:00 PM" },
  { id: "6", title: "Behind the scenes: workshop", platform: "instagram", date: new Date(2026, 2, 18), time: "12:00 PM" },
  { id: "7", title: "Trade program benefits", platform: "facebook", date: new Date(2026, 2, 22), time: "10:00 AM" },
  { id: "8", title: "Kitchen renovation ideas", platform: "pinterest", date: new Date(2026, 2, 25), time: "1:00 PM" },
  { id: "9", title: "Patina care tips", platform: "instagram", date: new Date(2026, 2, 28), time: "4:00 PM" },
  { id: "10", title: "Weekend showroom event", platform: "facebook", date: new Date(2026, 2, 30), time: "9:00 AM" },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ContentCalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const getPostsForDay = (day: Date) =>
    samplePosts.filter((post) => isSameDay(post.date, day));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Content Calendar</h2>
          <p className="text-sm text-dash-text-secondary mt-1">Plan and schedule your social media content</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-copper text-white rounded-lg text-sm font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer">
          <Plus className="w-4 h-4" />
          Schedule Post
        </button>
      </div>

      <div className="bg-dash-surface rounded-xl border border-dash-border">
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
            <div key={day} className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-dash-text-secondary border-b border-dash-border">
              {day}
            </div>
          ))}

          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[100px] border-b border-r border-dash-border bg-dash-bg/30" />
          ))}

          {days.map((day) => {
            const posts = getPostsForDay(day);
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] border-b border-r border-dash-border p-2 ${today ? "bg-brand-copper/5" : "hover:bg-dash-bg/50"} transition-colors`}
              >
                <span className={`text-xs font-medium ${today ? "bg-brand-copper text-white w-6 h-6 rounded-full flex items-center justify-center" : "text-dash-text-secondary"}`}>
                  {format(day, "d")}
                </span>
                <div className="mt-1 space-y-1">
                  {posts.map((post) => (
                    <div key={post.id} className="flex items-center gap-1.5 group cursor-pointer">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${platformColors[post.platform]}`} />
                      <span className="text-[10px] text-dash-text truncate group-hover:text-brand-copper transition-colors">
                        {post.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {(Object.entries(platformColors) as [Platform, string][]).map(([platform, color]) => (
          <div key={platform} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-xs text-dash-text-secondary">{platformLabels[platform]}</span>
          </div>
        ))}
      </div>

      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <h3 className="text-sm font-semibold text-dash-text mb-4">Upcoming Posts</h3>
        <div className="space-y-3">
          {samplePosts.slice(0, 5).map((post) => (
            <div key={post.id} className="flex items-center justify-between py-2 border-b border-dash-border last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${platformColors[post.platform]}`} />
                <div>
                  <p className="text-sm font-medium text-dash-text">{post.title}</p>
                  <p className="text-xs text-dash-text-secondary">{platformLabels[post.platform]}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-dash-text">{format(post.date, "MMM d, yyyy")}</p>
                <p className="text-xs text-dash-text-secondary">{post.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContentCalendarPage;
