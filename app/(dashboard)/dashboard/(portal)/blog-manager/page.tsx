"use client";

import { format } from "date-fns";
import { createColumnHelper } from "@tanstack/react-table";
import { Plus, FileText, Eye } from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { articles } from "@/app/lib/articles";

interface BlogPost {
  id: string;
  title: string;
  status: "published" | "draft";
  author: string;
  date: string;
  views: number;
  pillar: string;
}

const statusVariants: Record<string, BadgeVariant> = {
  published: "success",
  draft: "default",
};

const blogPosts: BlogPost[] = articles.map((article, index) => ({
  id: String(index + 1),
  title: article.title.en,
  status: index < articles.length - 1 ? "published" : "draft",
  author: article.author,
  date: article.date,
  views: Math.floor(Math.random() * 3000) + 200,
  pillar: article.pillar,
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

const BlogManagerPage = () => {
  const publishedCount = blogPosts.filter((p) => p.status === "published").length;
  const draftCount = blogPosts.filter((p) => p.status === "draft").length;
  const totalViews = blogPosts.reduce((sum, p) => sum + p.views, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Blog Manager</h2>
          <p className="text-sm text-dash-text-secondary mt-1">Create and manage blog content</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-copper text-white rounded-lg text-sm font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer">
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
        data={blogPosts as unknown as Record<string, unknown>[]}
        columns={columns as never}
        searchKey="title"
        searchPlaceholder="Search posts..."
      />
    </div>
  );
};

export default BlogManagerPage;
