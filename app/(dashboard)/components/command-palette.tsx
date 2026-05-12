"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Users,
  Kanban,
  MessageCircle,
  Share2,
  Mail,
  FileText,
  BarChart3,
  TrendingUp,
  Package,
  Handshake,
  FolderOpen,
  Settings,
  ArrowRight,
  Award,
  Truck,
  Clock,
  User,
  Briefcase,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  searchAllEntities,
  type SearchResult,
  type SearchResultType,
  type SearchProductData,
  type SearchAllResult,
} from "@/app/lib/search";
import type { Product } from "@/app/lib/types";

const RECENT_KEY = "cc_palette_recent";
const RECENT_CAP = 5;
const RECENT_RENDER_LIMIT = 5;
const SEARCH_DEBOUNCE_MS = 250;

type PaletteItemType = SearchResultType | "page";

interface PaletteItem {
  id: string;
  type: PaletteItemType;
  title: string;
  subtitle: string;
  href: string;
  icon?: LucideIcon;
  productData?: SearchProductData;
}

const pageItems: PaletteItem[] = [
  { id: "page-overview", type: "page", title: "Today", subtitle: "Daily action view", href: "/dashboard/overview", icon: LayoutDashboard },
  { id: "page-leads", type: "page", title: "Leads", subtitle: "Manage leads & contacts", href: "/dashboard/leads", icon: Users },
  { id: "page-pipeline", type: "page", title: "Pipeline", subtitle: "Sales pipeline board", href: "/dashboard/pipeline", icon: Kanban },
  { id: "page-whatsapp", type: "page", title: "WhatsApp", subtitle: "Messaging inbox", href: "/dashboard/whatsapp", icon: MessageCircle },
  { id: "page-trade", type: "page", title: "Trade Program", subtitle: "Trade partner management", href: "/dashboard/trade-program", icon: Handshake },
  { id: "page-brands", type: "page", title: "Brands", subtitle: "73 brand catalog", href: "/dashboard/brands", icon: Award },
  { id: "page-products", type: "page", title: "Products", subtitle: "Product catalog", href: "/dashboard/products", icon: Package },
  { id: "page-shipments", type: "page", title: "Shipments & Customs", subtitle: "Shipment tracking, pedimentos, duties", href: "/dashboard/shipments", icon: Truck },
  { id: "page-social", type: "page", title: "Social Hub", subtitle: "Calendar, feed, create, comments, analytics", href: "/dashboard/social", icon: Share2 },
  { id: "page-email", type: "page", title: "Email Campaigns", subtitle: "Manage email campaigns", href: "/dashboard/email-campaigns", icon: Mail },
  { id: "page-blog", type: "page", title: "Blog Manager", subtitle: "Blog posts & content", href: "/dashboard/blog-manager", icon: FileText },
  { id: "page-ap", type: "page", title: "Accounts Payable", subtitle: "Vendor queue, open bills, terms", href: "/dashboard/accounts-payable", icon: Wallet },
  { id: "page-sales-analytics", type: "page", title: "Pipeline & Sales", subtitle: "Revenue & deal metrics", href: "/dashboard/sales-analytics", icon: TrendingUp },
  { id: "page-marketing-analytics", type: "page", title: "Marketing & Traffic", subtitle: "Traffic, sources, pages, campaigns, funnel", href: "/dashboard/marketing-analytics", icon: BarChart3 },
  { id: "page-notifications", type: "page", title: "Notifications", subtitle: "Alert history & ack queue", href: "/dashboard/notifications", icon: Clock },
  { id: "page-drive", type: "page", title: "Drive", subtitle: "Files & documents", href: "/dashboard/drive", icon: FolderOpen },
  { id: "page-settings", type: "page", title: "Settings", subtitle: "Account & preferences", href: "/dashboard/settings", icon: Settings },
];

const groupOrder: PaletteItemType[] = [
  "page",
  "lead",
  "deal",
  "trafico",
  "shipment",
  "brand",
  "product",
  "blog",
];

const groupLabels: Record<PaletteItemType, string> = {
  page: "Pages",
  lead: "Leads",
  deal: "Deals",
  trafico: "Traficos",
  shipment: "Shipments",
  brand: "Brands",
  product: "Products",
  blog: "Blog Posts",
};

const typeIcons: Record<PaletteItemType, LucideIcon> = {
  page: LayoutDashboard,
  lead: User,
  deal: Briefcase,
  trafico: Truck,
  shipment: Package,
  brand: Award,
  product: Package,
  blog: FileText,
};

const productDataToProduct = (pd: SearchProductData): Product => ({
  id: pd.id,
  sku: pd.sku,
  brand: pd.brand,
  name: pd.name,
  nameEn: pd.nameEn,
  price: pd.price,
  tradePrice: pd.tradePrice,
  currency: pd.currency as "MXN" | "USD",
  images: pd.images,
  finishes: pd.finishes,
  category: pd.category as Product["category"],
  subcategory: pd.subcategory,
  availability: pd.availability as Product["availability"],
  slug: pd.slug,
  description: pd.description,
  descriptionEn: pd.descriptionEn,
  artisanal: pd.artisanal,
  featured: pd.featured,
});

const searchResultToPalette = (r: SearchResult): PaletteItem => ({
  id: r.id,
  type: r.type,
  title: r.title,
  subtitle: r.subtitle,
  href: r.href,
  productData: r.productData,
});

const getRecent = (): PaletteItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PaletteItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const pushRecent = (item: PaletteItem) => {
  if (typeof window === "undefined") return;
  const current = getRecent().filter((r) => r.id !== item.id);
  const next = [item, ...current].slice(0, RECENT_CAP);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* localStorage full or disabled — ignore */
  }
};

const filterPages = (q: string): PaletteItem[] => {
  if (!q.trim()) return [];
  const ql = q.trim().toLowerCase();
  return pageItems.filter(
    (p) =>
      p.title.toLowerCase().includes(ql) ||
      p.subtitle.toLowerCase().includes(ql) ||
      p.href.toLowerCase().includes(ql)
  );
};

interface CommandPaletteProps {
  onProductSelect?: (product: Product) => void;
  onProductInsert?: (product: Product) => void;
  registerOpen?: (fn: () => void) => void;
}

export function CommandPalette({
  onProductSelect,
  onProductInsert,
  registerOpen,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<PaletteItem[]>([]);
  const [recent, setRecent] = useState<PaletteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    registerOpen?.(() => setOpen(true));
  }, [registerOpen]);

  useEffect(() => {
    if (!open) return;
    setRecent(getRecent());
  }, [open]);

  const [searchErrors, setSearchErrors] = useState<
    Array<{ entity: string; message: string }>
  >([]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchErrors([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const live = await searchAllEntities(q);
        setResults(live.results.map(searchResultToPalette));
        setSearchErrors(live.errors);
      } catch (e) {
        setResults([]);
        setSearchErrors([
          { entity: "all", message: e instanceof Error ? e.message : "Search failed" },
        ]);
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, open]);

  const grouped = useMemo<Record<PaletteItemType, PaletteItem[]>>(() => {
    const out = {} as Record<PaletteItemType, PaletteItem[]>;
    if (query.trim()) {
      const pageMatches = filterPages(query);
      if (pageMatches.length) out.page = pageMatches;
      for (const r of results) {
        if (!out[r.type]) out[r.type] = [];
        out[r.type].push(r);
      }
    } else {
      out.page = pageItems;
    }
    return out;
  }, [query, results]);

  const flatList = useMemo<PaletteItem[]>(() => {
    if (!query.trim()) {
      return [...recent.slice(0, RECENT_RENDER_LIMIT), ...pageItems];
    }
    const flat: PaletteItem[] = [];
    for (const t of groupOrder) {
      if (grouped[t]) flat.push(...grouped[t]);
    }
    return flat;
  }, [query, grouped, recent]);

  useEffect(() => {
    if (selectedIndex >= flatList.length) {
      setSelectedIndex(Math.max(0, flatList.length - 1));
    }
  }, [flatList.length, selectedIndex]);

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

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const navigate = useCallback(
    (item: PaletteItem) => {
      pushRecent(item);
      if (item.type === "product" && item.productData) {
        setOpen(false);
        onProductSelect?.(productDataToProduct(item.productData));
        return;
      }
      setOpen(false);
      router.push(item.href);
    },
    [router, onProductSelect]
  );

  const insertProduct = useCallback(
    (item: PaletteItem) => {
      if (item.type === "product" && item.productData) {
        pushRecent(item);
        setOpen(false);
        onProductInsert?.(productDataToProduct(item.productData));
      }
    },
    [onProductInsert]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatList[selectedIndex]) navigate(flatList[selectedIndex]);
    } else if (e.key === "Tab") {
      const selected = flatList[selectedIndex];
      if (selected?.type === "product") {
        e.preventDefault();
        insertProduct(selected);
      }
    }
  };

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!open) return null;

  let runningIndex = 0;
  const showRecent = !query.trim() && recent.length > 0;
  const showEmptyHint = query.trim().length >= 2 && !loading && flatList.length === 0;

  const renderRow = (item: PaletteItem) => {
    const idx = runningIndex++;
    const isSelected = idx === selectedIndex;
    const Icon = item.icon ?? typeIcons[item.type];
    return (
      <button
        key={`${item.id}-${idx}`}
        data-index={idx}
        onClick={() => navigate(item)}
        onMouseEnter={() => setSelectedIndex(idx)}
        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-left transition-colors cursor-pointer ${
          isSelected ? "bg-brand-copper/10 text-brand-copper" : "text-dash-text hover:bg-dash-bg"
        }`}
      >
        {item.type === "product" && item.productData?.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.productData.images[0]}
            alt={item.title || "Product"}
            className="w-9 h-9 rounded-md object-cover shrink-0"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            onLoad={(e) => {
              if (e.currentTarget.naturalWidth > 0 && e.currentTarget.naturalWidth < 200) {
                e.currentTarget.style.display = "none";
              }
            }}
          />
        ) : (
          <Icon className="w-4 h-4 shrink-0 opacity-60" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.title}</p>
          {item.subtitle && (
            <p className="text-[11px] text-dash-text-secondary truncate">{item.subtitle}</p>
          )}
        </div>
        {isSelected && <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-40" />}
      </button>
    );
  };

  const renderSection = (label: string, items: PaletteItem[]) => (
    <div className="mb-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-copper/80 px-3 py-2">
        {label}
      </p>
      {items.map(renderRow)}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <div className="relative mx-auto mt-[15vh] w-full max-w-xl px-4">
        <div className="bg-dash-surface rounded-2xl border border-dash-border shadow-2xl overflow-hidden">
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
              placeholder="Search leads, deals, traficos, shipments, brands, products, blog…"
              className="flex-1 h-14 bg-transparent text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-mono text-dash-text-secondary bg-dash-bg border border-dash-border rounded-md">
              ESC
            </kbd>
          </div>

          <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-2">
            {searchErrors.length > 0 && (
              <div
                role="alert"
                className="mx-2 my-2 px-3 py-2 text-[11px] rounded border border-amber-500/40 bg-amber-500/10 text-amber-700"
              >
                Search partially unavailable: {searchErrors.map((e) => e.entity).join(", ")}.
                Results below may be incomplete.
              </div>
            )}
            {showRecent && renderSection("Recent", recent.slice(0, RECENT_RENDER_LIMIT))}

            {!query.trim() && renderSection("Pages", pageItems)}

            {query.trim().length >= 2 &&
              loading &&
              flatList.length === 0 && (
                <div className="space-y-2 px-2 py-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-9 bg-dash-bg rounded-md animate-pulse" />
                  ))}
                </div>
              )}

            {query.trim().length >= 2 &&
              groupOrder.map((t) => {
                const items = grouped[t];
                if (!items || items.length === 0) return null;
                return (
                  <div key={t}>{renderSection(groupLabels[t], items)}</div>
                );
              })}

            {showEmptyHint && (
              <div className="py-8 text-center text-sm text-dash-text-secondary">
                <p>No results for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-dash-text-muted mt-1">
                  Try a brand, deal name, or trafico number.
                </p>
              </div>
            )}

            {query.trim().length === 1 && (
              <div className="py-6 text-center text-xs text-dash-text-muted">
                Keep typing — minimum 2 characters.
              </div>
            )}
          </div>

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
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-dash-bg border border-dash-border rounded font-mono">TAB</kbd>
                insert product
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
