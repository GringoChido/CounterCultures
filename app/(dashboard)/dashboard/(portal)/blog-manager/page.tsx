"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { createColumnHelper } from "@tanstack/react-table";
import { Plus, FileText, Eye, Save, X, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { SlideOut } from "@/app/(dashboard)/components/slide-out";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { NotesPanel } from "@/app/(dashboard)/components/notes-panel";
import { ShareButton } from "@/app/(dashboard)/components/share-button";
import { articles } from "@/app/lib/articles";
import { useProductInsert } from "@/app/(dashboard)/components/product-insert-context";

interface BlogPost {
  id: string;
  title: string;
  status: "published" | "draft";
  author: string;
  date: string;
  views: number;
  pillar: string;
  slug: string;
  brandSlugs: string[];
}

const statusVariants: Record<string, BadgeVariant> = {
  published: "success",
  draft: "default",
};

interface ApiPost {
  slug: string;
  title: { en: string; es: string };
  pillar: string;
  date: string;
  author: string;
  brandSlugs?: string[];
  status: "published" | "draft";
  source: "hardcoded" | "sheet";
}

const apiPostToBlogPost = (p: ApiPost, index: number): BlogPost => ({
  id: p.slug || String(index + 1),
  title: p.title.en || p.title.es,
  status: p.status,
  author: p.author,
  date: p.date,
  views: 0,
  pillar: p.pillar,
  slug: p.slug,
  brandSlugs: p.brandSlugs ?? [],
});

// Fallback for SSR: render hardcoded articles immediately, then hydrate from API
const initialPosts: BlogPost[] = articles.map((article, index) => ({
  id: article.slug,
  title: article.title.en,
  status: index < articles.length - 1 ? "published" : "draft",
  author: article.author,
  date: article.date,
  views: 0,
  pillar: article.pillar,
  slug: article.slug,
  brandSlugs: article.brandSlugs ?? [],
}));

const columnHelper = createColumnHelper<BlogPost>();

const columns = [
  columnHelper.accessor("title", {
    header: "Title",
    cell: (info) => (
      <div className="max-w-xs">
        <p className="font-medium truncate">{info.getValue()}</p>
        <p className="text-xs text-dash-text-secondary mt-0.5">{info.row.original.pillar}</p>
      </div>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      return <StatusBadge label={status.charAt(0).toUpperCase() + status.slice(1)} variant={statusVariants[status]} />;
    },
  }),
  columnHelper.accessor("brandSlugs", {
    header: "Brands",
    enableSorting: false,
    cell: (info) => {
      const slugs = info.getValue();
      if (slugs.length === 0) {
        return <span className="text-dash-text-secondary">&mdash;</span>;
      }
      const shown = slugs.slice(0, 2);
      const extra = slugs.length - shown.length;
      return (
        <div className="flex flex-wrap gap-1 items-center">
          {shown.map((s) => (
            <span
              key={s}
              className="px-1.5 py-0.5 bg-brand-copper/10 text-brand-copper border border-brand-copper/20 rounded text-[10px] leading-tight"
            >
              {s}
            </span>
          ))}
          {extra > 0 && (
            <span className="text-[10px] text-dash-text-secondary">
              +{extra}
            </span>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor("author", {
    header: "Author",
    cell: (info) => <span>{info.getValue()}</span>,
  }),
  columnHelper.accessor("date", {
    header: "Date",
    cell: (info) => format(new Date(info.getValue()), "MMM d, yyyy"),
  }),
  columnHelper.accessor("views", {
    header: "Views",
    cell: (info) => (
      <div className="flex items-center gap-1.5">
        <Eye className="w-3.5 h-3.5 text-dash-text-secondary" />
        <span>{info.getValue().toLocaleString()}</span>
      </div>
    ),
  }),
];

const BLOG_PILLARS = ["Design Inspiration", "Product Spotlights", "Trade Insights", "Behind the Scenes", "Project Showcases", "Industry Trends"] as const;

const BlogManagerPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  useEffect(() => {
    fetch("/api/dashboard/blog-posts")
      .then((r) => r.json())
      .then((data: { posts?: ApiPost[] }) => {
        if (data.posts) setPosts(data.posts.map(apiPostToBlogPost));
      })
      .catch(() => {});
  }, []);

  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;
  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", pillar: BLOG_PILLARS[0] as string, author: "Roger Gonzalez", notes: "", brandSlugs: "" });
  const [linkedProducts, setLinkedProducts] = useState<{ name: string; slug: string; brand: string; image: string }[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { consumeInsert, pendingInsert, openCommandPalette } = useProductInsert();

  useEffect(() => {
    if (pendingInsert && formOpen) {
      const inserted = consumeInsert();
      if (inserted) {
        setLinkedProducts((prev) => [...prev, { name: inserted.product, slug: inserted.slug, brand: inserted.brand, image: inserted.image }]);
        setNewPost((p) => ({ ...p, notes: p.notes + (p.notes ? "\n" : "") + `{{product:${inserted.slug}}}` }));
        toast.success(`Embedded: ${inserted.product}`);
      }
    }
  }, [pendingInsert, formOpen, consumeInsert]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Blog Manager</h2>
          <p className="text-sm text-dash-text-secondary mt-1">Create and manage blog content</p>
        </div>
        <button
          onClick={() => { setNewPost({ title: "", pillar: BLOG_PILLARS[0], author: "Roger Gonzalez", notes: "", brandSlugs: "" }); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-copper text-white rounded-lg text-sm font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-status-won/10 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-status-won" />
            </div>
            <div>
              <p className="text-xs text-dash-text-secondary">Published</p>
              <p className="text-xl font-bold text-dash-text">{publishedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-dash-bg flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-dash-text-secondary" />
            </div>
            <div>
              <p className="text-xs text-dash-text-secondary">Drafts</p>
              <p className="text-xl font-bold text-dash-text">{draftCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-copper/10 flex items-center justify-center">
              <Eye className="w-4.5 h-4.5 text-brand-copper" />
            </div>
            <div>
              <p className="text-xs text-dash-text-secondary">Total Views</p>
              <p className="text-xl font-bold text-dash-text">{totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        data={posts as unknown as Record<string, unknown>[]}
        columns={columns as never}
        searchKey="title"
        searchPlaceholder="Search posts..."
        onRowClick={(row) => setSelectedPost(row as unknown as BlogPost)}
      />

      <SlideOut open={formOpen} onClose={() => setFormOpen(false)} title="New Blog Post">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1">Post Title *</label>
            <input className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-1 focus:ring-brand-copper" value={newPost.title} onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. How to Choose the Perfect Kitchen Faucet" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-dash-text-secondary mb-1">Content Pillar</label>
              <select className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-1 focus:ring-brand-copper" value={newPost.pillar} onChange={(e) => setNewPost((p) => ({ ...p, pillar: e.target.value }))}>
                {BLOG_PILLARS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-dash-text-secondary mb-1">Author</label>
              <input className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-1 focus:ring-brand-copper" value={newPost.author} onChange={(e) => setNewPost((p) => ({ ...p, author: e.target.value }))} />
            </div>
          </div>
          {/* Embedded Products */}
          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1">Embedded Products</label>
            {linkedProducts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {linkedProducts.map((lp) => (
                  <div key={lp.slug} className="flex items-center gap-2 px-2 py-1 bg-dash-bg border border-dash-border rounded-lg text-xs text-dash-text">
                    {lp.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={lp.image} alt={lp.name} className="w-5 h-5 rounded object-cover" />
                    )}
                    <span>{lp.name}</span>
                    <button onClick={() => setLinkedProducts((prev) => prev.filter((p) => p.slug !== lp.slug))} className="text-dash-text-secondary hover:text-dash-danger cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={openCommandPalette}
              className="flex items-center gap-1.5 text-xs text-brand-copper hover:text-brand-copper/80 transition-colors cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              Embed Product
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1">Brand Tags</label>
            <input
              type="text"
              className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-1 focus:ring-brand-copper"
              value={newPost.brandSlugs}
              onChange={(e) => setNewPost((p) => ({ ...p, brandSlugs: e.target.value }))}
              placeholder="kohler, dornbracht, waterworks (comma separated)"
            />
            <p className="mt-1 text-[11px] text-dash-text-muted">
              These slugs drive the reciprocal link on each brand page.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1">Notes / Brief</label>
            <textarea className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-1 focus:ring-brand-copper h-32 resize-none" value={newPost.notes} onChange={(e) => setNewPost((p) => ({ ...p, notes: e.target.value }))} placeholder="Key points, target keywords, audience, call-to-action..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={!newPost.title}
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-dash-border text-dash-text-secondary rounded-lg text-sm font-medium hover:border-brand-copper hover:text-brand-copper transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              disabled={saving || !newPost.title}
              onClick={async () => {
                setSaving(true);
                try {
                  const brandList = newPost.brandSlugs
                    .split(/[,\s]+/)
                    .map((s) => s.trim().toLowerCase())
                    .filter(Boolean);
                  const res = await fetch("/api/dashboard/content-calendar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: newPost.title,
                      type: "blog-post",
                      platform: "website",
                      scheduled_date: new Date().toISOString().split("T")[0],
                      status: "draft",
                      author: newPost.author,
                      notes: `Pillar: ${newPost.pillar}. ${newPost.notes}`,
                      brandSlugs: brandList.join("|"),
                    }),
                  });
                  if (!res.ok) throw new Error("Failed");
                  toast.success("Blog post draft created");
                  setFormOpen(false);
                } catch {
                  toast.error("Error creating post");
                } finally {
                  setSaving(false);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-copper text-white rounded-lg text-sm font-medium hover:bg-brand-copper/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Create Draft
            </button>
            <button onClick={() => setFormOpen(false)} className="flex items-center gap-2 px-4 py-2 text-dash-text-secondary border border-dash-border rounded-lg text-sm hover:bg-dash-bg transition-colors cursor-pointer">
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </SlideOut>

      <SlideOut
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        title={selectedPost?.title ?? "Post"}
      >
        {selectedPost && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                Post Details
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-dash-text-secondary">Pillar:</span>{" "}
                  {selectedPost.pillar}
                </p>
                <p>
                  <span className="text-dash-text-secondary">Author:</span>{" "}
                  {selectedPost.author}
                </p>
                <p>
                  <span className="text-dash-text-secondary">Date:</span>{" "}
                  {format(new Date(selectedPost.date), "MMM d, yyyy")}
                </p>
                <p>
                  <span className="text-dash-text-secondary">Status:</span>{" "}
                  <StatusBadge
                    label={selectedPost.status.charAt(0).toUpperCase() + selectedPost.status.slice(1)}
                    variant={statusVariants[selectedPost.status]}
                  />
                </p>
                {selectedPost.brandSlugs.length > 0 && (
                  <div className="flex flex-wrap gap-1 items-center pt-1">
                    <span className="text-dash-text-secondary mr-1">Brands:</span>
                    {selectedPost.brandSlugs.map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 bg-brand-copper/10 text-brand-copper border border-brand-copper/20 rounded text-[10px] leading-tight"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-dash-border">
              <NotesPanel
                entityType="blog_post"
                entityId={selectedPost.id}
                title="Editorial Notes"
              />
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-dash-border">
              <a
                href={`/en/insights/${selectedPost.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                View post
              </a>
              <ShareButton
                entityType="blog_post"
                entityId={selectedPost.id}
                summary={`Review before publish: ${selectedPost.title}`}
                deepLink={`/dashboard/blog-manager#${selectedPost.id}`}
                compact
              />
            </div>
          </div>
        )}
      </SlideOut>

      <SlideOut
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Preview — New Post"
      >
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-dash-text-muted">
            {newPost.pillar} · {newPost.author} ·{" "}
            {format(new Date(), "MMM d, yyyy")}
          </p>
          <h1 className="font-serif text-3xl leading-tight text-dash-text">
            {newPost.title || "Untitled post"}
          </h1>
          {newPost.brandSlugs ? (
            <div className="flex flex-wrap gap-1.5">
              {newPost.brandSlugs
                .split(/[,\s]+/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((slug) => (
                  <span
                    key={slug}
                    className="px-2 py-0.5 text-[11px] bg-brand-copper/10 text-brand-copper rounded-full"
                  >
                    {slug}
                  </span>
                ))}
            </div>
          ) : null}

          {linkedProducts.length > 0 ? (
            <div className="border border-dash-border rounded-lg p-4 bg-dash-surface-2">
              <p className="text-[11px] uppercase tracking-[0.14em] text-dash-text-muted mb-2">
                Embedded products
              </p>
              <div className="grid grid-cols-2 gap-3">
                {linkedProducts.map((lp) => (
                  <div
                    key={lp.slug}
                    className="flex items-center gap-2 bg-dash-surface rounded border border-dash-border p-2"
                  >
                    {lp.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={lp.image}
                        alt={lp.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-dash-text truncate">
                        {lp.name}
                      </p>
                      <p className="text-[11px] text-dash-text-secondary truncate">
                        {lp.brand}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-dash-text-muted mb-1">
              Brief / Notes
            </p>
            <p className="text-sm text-dash-text whitespace-pre-wrap">
              {newPost.notes || (
                <span className="text-dash-text-muted">No notes yet.</span>
              )}
            </p>
          </div>

          <p className="text-[11px] text-dash-text-muted pt-2 border-t border-dash-border">
            This is a pre-publish preview. The final article layout, hero
            image, and body copy are added in the CMS after the draft is
            created.
          </p>
        </div>
      </SlideOut>
    </div>
  );
};

export default BlogManagerPage;
