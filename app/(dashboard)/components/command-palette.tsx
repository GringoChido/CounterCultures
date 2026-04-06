"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Users,
  Kanban,
  MessageCircle,
  CalendarDays,
  Share2,
  Mail,
  FileText,
  BarChart3,
  TrendingUp,
  PieChart,
  ClipboardList,
  Package,
  Handshake,
  FolderOpen,
  Settings,
  User,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { SAMPLE_LEADS, SAMPLE_PIPELINE } from "@/app/lib/sample-dashboard-data";

// ---------------------------------------------------------------------------
// Searchable items
// ---------------------------------------------------------------------------

interface SearchItem {
  id: string;
  label: string;
  description?: string;
  category: "page" | "lead" | "deal" | "action" | "document";
  href: string;
  icon: React.ElementType;
  keywords?: string[];
}

const pageItems: SearchItem[] = [
  { id: "overview", label: "Overview", description: "Main dashboard", category: "page", href: "/dashboard/overview", icon: LayoutDashboard, keywords: ["home", "dashboard", "main"] },
  { id: "leads", label: "Leads", description: "Manage leads & contacts", category: "page", href: "/dashboard/leads", icon: Users, keywords: ["contacts", "prospects"] },
  { id: "pipeline", label: "Pipeline", description: "Sales pipeline board", category: "page", href: "/dashboard/pipeline", icon: Kanban, keywords: ["deals", "kanban", "sales"] },
  { id: "whatsapp", label: "WhatsApp", description: "Messaging inbox", category: "page", href: "/dashboard/whatsapp", icon: MessageCircle, keywords: ["messages", "chat"] },
  { id: "calendar", label: "Content Calendar", description: "Schedule social posts", category: "page", href: "/dashboard/content-calendar", icon: CalendarDays, keywords: ["schedule", "posts", "social"] },
  { id: "social", label: "Social Media Hub", description: "Create, engage, analyze", category: "page", href: "/dashboard/social", icon: Share2, keywords: ["instagram", "facebook", "posts", "analytics"] },
  { id: "email", label: "Email Campaigns", description: "Manage email campaigns", category: "page", href: "/dashboard/email-campaigns", icon: Mail, keywords: ["newsletter", "drip", "marketing"] },
  { id: "blog", label: "Blog Manager", description: "Blog posts & content", category: "page", href: "/dashboard/blog-manager", icon: FileText, keywords: ["articles", "content", "writing"] },
  { id: "web-analytics", label: "Website Analytics", description: "Traffic & performance", category: "page", href: "/dashboard/website-analytics", icon: BarChart3, keywords: ["traffic", "visitors", "pageviews"] },
  { id: "sales-analytics", label: "Sales Analytics", description: "Revenue & metrics", category: "page", href: "/dashboard/sales-analytics", icon: TrendingUp, keywords: ["revenue", "deals", "performance"] },
  { id: "marketing-analytics", label: "Marketing Analytics", description: "Campaign performance", category: "page", href: "/dashboard/marketing-analytics", icon: PieChart, keywords: ["campaigns", "roi", "funnel"] },
  { id: "reports", label: "Reports", description: "Generate reports", category: "page", href: "/dashboard/reports", icon: ClipboardList, keywords: ["export", "download", "pdf"] },
  { id: "products", label: "Products", description: "Product catalog", category: "page", href: "/dashboard/products", icon: Package, keywords: ["inventory", "catalog", "items"] },
  { id: "trade", label: "Trade Program", description: "Trade partner management", category: "page", href: "/dashboard/trade-program", icon: Handshake, keywords: ["partners", "wholesale", "discount"] },
  { id: "drive", label: "Drive", description: "Files & documents", category: "page", href: "/dashboard/drive", icon: FolderOpen, keywords: ["files", "documents", "uploads"] },
  { id: "settings", label: "Settings", description: "Account & preferences", category: "page", href: "/dashboard/settings", icon: Settings, keywords: ["account", "profile", "integrations"] },
];

function buildSearchItems(): SearchItem[] {
  const items: SearchItem[] = [...pageItems];

  // Add leads
  SAMPLE_LEADS.forEach((lead) => {
    items.push({
      id: `lead-${lead.id}`,
      label: lead.name,
      description: `${lead.status} · ${lead.source} · ${lead.budget}`,
      category: "lead",
      href: "/dashboard/leads",
      icon: User,
      keywords: [lead.email, lead.phone, lead.projectType, lead.assignedRep].filter(Boolean),
    });
  });

  // Add pipeline deals
  SAMPLE_PIPELINE.forEach((deal) => {
    items.push({
      id: `deal-${deal.id}`,
      label: deal.name,
      description: `${deal.stage} · $${(deal.value / 1000).toFixed(0)}K · ${deal.contactName}`,
      category: "deal",
      href: "/dashboard/pipeline",
      icon: DollarSign,
      keywords: [deal.contactName, deal.products, deal.assignedRep].filter(Boolean),
    });
  });

  return items;
}

const categoryLabels: Record<string, string> = {
  page: "Pages",
  lead: "Leads",
  deal: "Deals",
  document: "Documents",
  action: "Actions",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [docItems, setDocItems] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const allItems = useMemo(() => buildSearchItems(), []);

  // Fetch documents when query changes
  useEffect(() => {
    if (!open || !query.trim() || query.length < 2) {
      setDocItems([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/dashboard/documents?q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          const items: SearchItem[] = (data.documents ?? []).map(
            (doc: { Doc_ID: string; Type: string; Customer_Name: string; Created_Date: string; Amount: string }) => ({
              id: `doc-${doc.Doc_ID}`,
              label: doc.Doc_ID,
              description: `${doc.Type} · ${doc.Customer_Name} · ${doc.Created_Date}${doc.Amount ? ` · $${parseInt(doc.Amount).toLocaleString()}` : ""}`,
              category: "document" as const,
              href: "/dashboard/drive",
              icon: FileText,
              keywords: [doc.Customer_Name, doc.Type],
            })
          );
          setDocItems(items);
        }
      } catch {
        setDocItems([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 12); // show pages by default
    const q = query.toLowerCase();
    const matched = allItems.filter((item) => {
      if (item.label.toLowerCase().includes(q)) return true;
      if (item.description?.toLowerCase().includes(q)) return true;
      if (item.keywords?.some((k) => k.toLowerCase().includes(q))) return true;
      return false;
    });
    return [...matched, ...docItems];
  }, [query, allItems, docItems]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    filtered.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filtered]);

  const flatFiltered = useMemo(() => {
    const flat: SearchItem[] = [];
    Object.values(grouped).forEach((items) => flat.push(...items));
    return flat;
  }, [grouped]);

  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const navigate = useCallback(
    (item: SearchItem) => {
      setOpen(false);
      router.push(item.href);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatFiltered[selectedIndex]) {
        navigate(flatFiltered[selectedIndex]);
      }
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!open) return null;

  let runningIndex = 0;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative mx-auto mt-[15vh] w-full max-w-xl">
        <div className="bg-dash-surface rounded-2xl border border-dash-border shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-dash-border">
            <Search className="w-5 h-5 text-dash-text-secondary shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, leads, deals..."
              className="flex-1 h-14 bg-transparent text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-mono text-dash-text-secondary bg-dash-bg border border-dash-border rounded-md">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
            {flatFiltered.length === 0 ? (
              <div className="py-8 text-center text-sm text-dash-text-secondary">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              Object.entries(grouped).map(([category, items]) => {
                const group = (
                  <div key={category} className="mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary px-3 py-2">
                      {categoryLabels[category] || category}
                    </p>
                    {items.map((item) => {
                      const idx = runningIndex++;
                      const isSelected = idx === selectedIndex;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          data-index={idx}
                          onClick={() => navigate(item)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-brand-copper/10 text-brand-copper"
                              : "text-dash-text hover:bg-dash-bg"
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0 opacity-60" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.label}</p>
                            {item.description && (
                              <p className="text-[11px] text-dash-text-secondary truncate">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-40" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
                return group;
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-dash-border text-[10px] text-dash-text-secondary">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-dash-bg border border-dash-border rounded font-mono">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-dash-bg border border-dash-border rounded font-mono">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-dash-bg border border-dash-border rounded font-mono">↵</kbd>
                open
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-dash-bg border border-dash-border rounded font-mono">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-dash-bg border border-dash-border rounded font-mono">K</kbd>
              toggle
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
