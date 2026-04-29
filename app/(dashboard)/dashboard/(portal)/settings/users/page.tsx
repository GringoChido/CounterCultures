"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  UserPlus,
  Loader2,
  Trash2,
  Pencil,
  ShieldCheck,
  Wallet,
  Briefcase,
  Lock,
} from "lucide-react";
import { useFeatures } from "@/app/lib/use-features";
import {
  ALL_FEATURE_KEYS,
  FEATURES,
  ROLE_DEFAULTS,
  type Feature,
} from "@/app/lib/features";
import type { UserRole, PortalUser } from "@/app/lib/users-sheet";

interface UserFormState {
  mode: "create" | "edit";
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  enabledFeatures: Set<Feature>;
}

const ROLE_LABEL: Record<UserRole, string> = {
  owner: "Owner",
  finance: "Finance",
  sales: "Sales",
};

const ROLE_ICON: Record<UserRole, typeof ShieldCheck> = {
  owner: ShieldCheck,
  finance: Wallet,
  sales: Briefcase,
};

const computeEnabledSet = (
  role: UserRole,
  overrides: string
): Set<Feature> => {
  const set = new Set<Feature>(ROLE_DEFAULTS[role]);
  for (const tokenRaw of overrides.split("|")) {
    const token = tokenRaw.trim();
    if (!token) continue;
    const sign = token[0];
    const name = token.slice(1) as Feature;
    if (!ALL_FEATURE_KEYS.includes(name)) continue;
    if (sign === "+") set.add(name);
    else if (sign === "-") set.delete(name);
  }
  return set;
};

const FEATURE_GROUPS: { label: string; features: Feature[] }[] = [
  {
    label: "Daily-driver surfaces",
    features: [
      "view_today",
      "view_customers",
      "view_orders",
      "view_invoices",
      "view_payments",
      "view_inbox",
      "view_inventory",
      "view_purchases",
      "view_shipments",
    ],
  },
  {
    label: "Pipeline & CRM",
    features: ["view_leads", "view_pipeline"],
  },
  {
    label: "Catalog admin",
    features: ["view_brands", "view_products"],
  },
  {
    label: "Marketing",
    features: ["view_marketing", "view_social", "view_blog"],
  },
  {
    label: "Operations",
    features: ["view_drive", "view_finance", "view_stripe", "view_odoo", "view_trade"],
  },
  {
    label: "Write actions (Odoo + Stripe)",
    features: [
      "create_quote",
      "send_quote",
      "create_invoice",
      "cancel_order",
      "send_prefactura",
      "approve_prefactura",
      "attach_cfdi",
      "register_payment",
      "send_payment_link",
    ],
  },
  {
    label: "System",
    features: ["manage_users", "manage_settings"],
  },
];

const UsersAdminPage = () => {
  const features = useFeatures();
  const [users, setUsers] = useState<PortalUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<UserFormState | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    const r = await fetch("/api/dashboard/users", { credentials: "include" });
    if (r.ok) {
      const data = (await r.json()) as { users: PortalUser[] };
      setUsers(data.users);
    } else {
      toast.error("Couldn't load users");
    }
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const startCreate = () => {
    setForm({
      mode: "create",
      email: "",
      name: "",
      role: "sales",
      active: true,
      enabledFeatures: new Set<Feature>(ROLE_DEFAULTS.sales),
    });
  };

  const startEdit = (u: PortalUser) => {
    setForm({
      mode: "edit",
      email: u.email,
      name: u.name,
      role: u.role,
      active: u.active,
      enabledFeatures: computeEnabledSet(u.role, u.featureOverrides),
    });
  };

  const handleRoleChange = (role: UserRole) => {
    if (!form) return;
    // When the role changes, reset the enabled features to the new role's
    // default. Admins can then add/remove specific features on top.
    setForm({
      ...form,
      role,
      enabledFeatures: new Set<Feature>(ROLE_DEFAULTS[role]),
    });
  };

  const toggleFeature = (feature: Feature) => {
    if (!form) return;
    const next = new Set(form.enabledFeatures);
    if (next.has(feature)) next.delete(feature);
    else next.add(feature);
    setForm({ ...form, enabledFeatures: next });
  };

  const handleSubmit = async () => {
    if (!form) return;
    setSaving(true);
    const method = form.mode === "create" ? "POST" : "PATCH";
    const r = await fetch("/api/dashboard/users", {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: form.email.trim().toLowerCase(),
        name: form.name.trim(),
        role: form.role,
        active: form.active,
        enabledFeatures: [...form.enabledFeatures],
      }),
    });
    setSaving(false);
    if (r.ok) {
      toast.success(form.mode === "create" ? "User added" : "User updated");
      setForm(null);
      reload();
    } else {
      const body = await r.json().catch(() => ({}));
      toast.error(body.error || "Save failed");
    }
  };

  const handleDeactivate = async (email: string) => {
    if (!confirm(`Deactivate ${email}? They'll lose access immediately on next sign-in.`)) {
      return;
    }
    const r = await fetch(
      `/api/dashboard/users?email=${encodeURIComponent(email)}`,
      { method: "DELETE", credentials: "include" }
    );
    if (r.ok) {
      toast.success("User deactivated");
      reload();
    } else {
      toast.error("Deactivate failed");
    }
  };

  const sortedUsers = useMemo(
    () =>
      users
        ? [...users].sort((a, b) => {
            if (a.active !== b.active) return a.active ? -1 : 1;
            return a.email.localeCompare(b.email);
          })
        : null,
    [users]
  );

  // Gate the page itself — if the user lacks manage_users, show a notice.
  if (features.ready && !features.has("manage_users")) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="bg-dash-surface border border-dash-border rounded-xl p-8 text-center">
          <Lock className="w-8 h-8 mx-auto text-dash-text-muted mb-3" />
          <h1 className="text-lg font-semibold text-dash-text">Restricted</h1>
          <p className="text-sm text-dash-text-secondary mt-2">
            Only owners can manage portal users. Ask Roger if you need access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-light tracking-wide text-dash-text">
            Portal users
          </h1>
          <p className="text-sm text-dash-text-secondary mt-1">
            Add, edit, or deactivate accounts. Per-user feature toggles let you
            grant or restrict capabilities beyond the role default.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-copper text-white text-sm font-medium rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add user
        </button>
      </div>

      <div className="bg-dash-surface border border-dash-border rounded-xl overflow-hidden">
        {loading && !users && (
          <div className="flex items-center justify-center py-12 text-dash-text-secondary">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading users…
          </div>
        )}
        {sortedUsers && sortedUsers.length === 0 && (
          <div className="text-center py-12 text-dash-text-secondary text-sm">
            No users yet. Add the first one — bootstrap mode is active until
            then, so anyone with an @countercultures.com.mx email can sign in.
          </div>
        )}
        {sortedUsers && sortedUsers.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-dash-bg-muted text-dash-text-muted text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2.5">User</th>
                <th className="text-left px-4 py-2.5">Role</th>
                <th className="text-left px-4 py-2.5">Status</th>
                <th className="text-left px-4 py-2.5">Overrides</th>
                <th className="text-right px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dash-border">
              {sortedUsers.map((u) => {
                const RoleIcon = ROLE_ICON[u.role];
                const overrideCount = u.featureOverrides
                  ? u.featureOverrides.split("|").filter(Boolean).length
                  : 0;
                return (
                  <tr key={u.email} className={u.active ? "" : "opacity-50"}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-dash-text">{u.name}</div>
                      <div className="text-xs text-dash-text-secondary">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-dash-bg-muted text-dash-text">
                        <RoleIcon className="w-3.5 h-3.5" />
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          u.active
                            ? "bg-dash-success-soft text-dash-success"
                            : "bg-dash-danger-soft text-dash-danger"
                        }`}
                      >
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dash-text-secondary text-xs">
                      {overrideCount === 0
                        ? "Role default"
                        : `${overrideCount} override${overrideCount === 1 ? "" : "s"}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(u)}
                          className="p-1.5 rounded-md text-dash-text-secondary hover:bg-dash-bg-muted hover:text-dash-text transition-colors cursor-pointer"
                          aria-label="Edit user"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {u.active && (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(u.email)}
                            className="p-1.5 rounded-md text-dash-danger hover:bg-dash-danger-soft transition-colors cursor-pointer"
                            aria-label="Deactivate user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit / create modal */}
      {form && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setForm(null);
          }}
        >
          <div className="w-full max-w-2xl bg-dash-surface rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-dash-border">
              <h2 className="font-display text-xl font-light text-dash-text">
                {form.mode === "create" ? "Add user" : `Edit ${form.email}`}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="user@countercultures.com.mx"
                    disabled={form.mode === "edit"}
                    className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg disabled:bg-dash-bg-muted disabled:text-dash-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg bg-dash-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                  >
                    <option value="owner">Owner — all features</option>
                    <option value="finance">Finance — money + invoicing</option>
                    <option value="sales">Sales — customer-facing</option>
                  </select>
                  <p className="text-[11px] text-dash-text-muted mt-1">
                    Changing the role resets feature toggles to that role's default.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 border border-dash-border rounded-lg cursor-pointer hover:bg-dash-bg-muted transition-colors">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) =>
                        setForm({ ...form, active: e.target.checked })
                      }
                    />
                    <span className="text-sm">{form.active ? "Active" : "Inactive"}</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium text-dash-text-muted uppercase tracking-wider mb-2">
                  Features ({form.enabledFeatures.size}/{ALL_FEATURE_KEYS.length})
                </h3>
                <div className="space-y-4">
                  {FEATURE_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-dash-text-muted mb-1.5">
                        {group.label}
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {group.features.map((f) => {
                          const enabled = form.enabledFeatures.has(f);
                          const isDefault = ROLE_DEFAULTS[form.role].includes(f);
                          return (
                            <label
                              key={f}
                              className={`flex items-start gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-dash-bg-muted transition-colors ${
                                enabled !== isDefault ? "bg-dash-warn-soft/50" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={() => toggleFeature(f)}
                                className="mt-0.5"
                              />
                              <span className="text-xs text-dash-text leading-tight">
                                <span className="font-medium">{FEATURES[f]}</span>
                                {enabled !== isDefault && (
                                  <span className="ml-1 text-[10px] uppercase tracking-wider text-dash-warn">
                                    {enabled ? "added" : "removed"}
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-dash-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setForm(null)}
                disabled={saving}
                className="px-4 py-2 text-sm text-dash-text-secondary hover:text-dash-text transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !form.email || !form.name}
                className="flex items-center gap-2 px-4 py-2 bg-brand-copper text-white text-sm font-medium rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {form.mode === "create" ? "Add user" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAdminPage;
