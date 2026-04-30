"use client";

import Link from "next/link";
import { Building2, User, ExternalLink, Users } from "lucide-react";

interface PartnerLite {
  id: string;
  name: string;
  email?: string;
  is_company?: string;
}

interface PartnerHierarchyProps {
  /** "customer" routes to /dashboard/customers, "vendor" to /dashboard/vendors. */
  mode: "customer" | "vendor";
  parent: PartnerLite | null;
  children: PartnerLite[];
}

const PartnerHierarchy = ({
  mode,
  parent,
  children,
}: PartnerHierarchyProps) => {
  if (!parent && children.length === 0) return null;
  const basePath = mode === "customer" ? "/dashboard/customers" : "/dashboard/vendors";

  return (
    <section className="bg-dash-surface border border-dash-border p-5 rounded">
      <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Hierarchy
      </h2>

      {parent && (
        <div className="mb-3">
          <p className="text-[11px] uppercase tracking-wider text-dash-text-secondary mb-1.5">
            Part of
          </p>
          <Link
            href={`${basePath}/${parent.id}`}
            className="inline-flex items-center gap-2 px-3 py-2 bg-dash-bg-muted/60 border border-dash-border rounded hover:border-brand-copper transition-colors"
          >
            <Building2 className="w-4 h-4 text-dash-text-secondary" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-dash-text truncate">
                {parent.name}
              </div>
              {parent.email && (
                <div className="text-[11px] text-dash-text-secondary truncate">
                  {parent.email}
                </div>
              )}
            </div>
            <ExternalLink className="w-3 h-3 text-dash-text-secondary" />
          </Link>
        </div>
      )}

      {children.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-dash-text-secondary mb-1.5">
            Contacts ({children.length})
          </p>
          <ul className="space-y-1">
            {children.slice(0, 8).map((c) => (
              <li key={c.id}>
                <Link
                  href={`${basePath}/${c.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-dash-bg-muted/60 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-dash-text-secondary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-dash-text truncate">
                      {c.name}
                    </div>
                    {c.email && (
                      <div className="text-[11px] text-dash-text-secondary truncate">
                        {c.email}
                      </div>
                    )}
                  </div>
                  <ExternalLink className="w-3 h-3 text-dash-text-secondary opacity-60" />
                </Link>
              </li>
            ))}
          </ul>
          {children.length > 8 && (
            <p className="text-[11px] text-dash-text-secondary mt-2 px-3">
              + {children.length - 8} more
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export { PartnerHierarchy };
