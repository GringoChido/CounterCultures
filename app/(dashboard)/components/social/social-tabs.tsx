"use client";

import { useState } from "react";
import { Rss, PenSquare, MessageCircle, BarChart3 } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: "feed", label: "Feed", icon: Rss },
  { id: "create", label: "Create Post", icon: PenSquare },
  { id: "comments", label: "Comments", icon: MessageCircle },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

interface SocialTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function SocialTabs({ activeTab, onTabChange }: SocialTabsProps) {
  return (
    <div className="flex gap-1 bg-dash-bg rounded-xl p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              isActive
                ? "bg-dash-surface text-brand-copper shadow-sm"
                : "text-dash-text-secondary hover:text-dash-text hover:bg-dash-surface/50"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
