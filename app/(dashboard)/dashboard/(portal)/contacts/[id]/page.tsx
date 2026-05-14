"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MessageCircle,
  Loader2,
  AlertCircle,
  Tag,
  Calendar,
  FileText,
} from "lucide-react";
import { ClassificationPicker } from "@/app/(dashboard)/components/classification-picker";
import { ClassificationBadge } from "@/app/(dashboard)/components/classification-badge";
import type {
  ContactClassification,
  CrmContact,
} from "@/app/lib/contact-classifications";

const ContactDetailPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = use(params);
  const [contact, setContact] = useState<CrmContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContact = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/contacts?q=`);
      const data = await res.json();
      const found = (data.contacts as CrmContact[])?.find((c) => c.id === id);
      if (!found) {
        setError("Contact not found");
        return;
      }
      setContact(found);
    } catch {
      setError("Failed to load contact");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  const handleClassificationsChange = async (next: ContactClassification[]) => {
    if (!contact) return;
    setContact({ ...contact, classifications: next });
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contact.id, classifications: next }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Save failed");
        setContact({ ...contact, classifications: contact.classifications });
      }
    } catch {
      setError("Save failed");
      setContact({ ...contact, classifications: contact.classifications });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 text-dash-accent animate-spin" />
      </div>
    );
  }

  if (error && !contact) {
    return (
      <div className="p-6 max-w-[800px] mx-auto">
        <Link
          href="/dashboard/contacts"
          className="inline-flex items-center gap-1.5 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contacts
        </Link>
        <div className="bg-dash-surface border border-dash-border rounded-lg p-8 text-center">
          <AlertCircle className="w-8 h-8 text-dash-warn mx-auto mb-3" />
          <p className="text-sm text-dash-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  if (!contact) return null;

  const phone = contact.phone?.replace(/\s/g, "");

  return (
    <div className="p-6 max-w-[800px] mx-auto">
      <Link
        href="/dashboard/contacts"
        className="inline-flex items-center gap-1.5 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Contacts
      </Link>

      {/* Contact card */}
      <div className="bg-dash-surface border border-dash-border rounded-lg">
        {/* Header */}
        <div className="p-6 border-b border-dash-border">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-dash-surface-2 flex items-center justify-center shrink-0">
              {contact.company ? (
                <Building2 className="w-6 h-6 text-dash-text-secondary" />
              ) : (
                <User className="w-6 h-6 text-dash-text-secondary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-medium truncate">
                {contact.name}
              </h1>
              {contact.company && (
                <p className="text-sm text-dash-text-secondary">{contact.company}</p>
              )}
            </div>
            {saving && (
              <Loader2 className="w-4 h-4 text-dash-accent animate-spin shrink-0 mt-1" />
            )}
          </div>

          {/* Classifications — prominent, near top */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-3.5 h-3.5 text-dash-text-muted" />
              <span className="text-xs font-medium uppercase tracking-wider text-dash-text-muted">
                Classifications
              </span>
            </div>
            <ClassificationPicker
              value={contact.classifications}
              onChange={handleClassificationsChange}
              disabled={saving}
            />
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-dash-warn bg-brand-terracotta/10 px-3 py-2 rounded">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-dash-text-muted shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-dash-text-muted">
                    Email
                  </p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm hover:text-dash-accent"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            )}

            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-dash-text-muted shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-dash-text-muted">
                    Phone
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{contact.phone}</span>
                    {phone && (
                      <a
                        href={`https://wa.me/${phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-sage hover:text-brand-sage/80"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {contact.type && (
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-dash-text-muted shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-dash-text-muted">
                    Type
                  </p>
                  <span className="text-sm">{contact.type}</span>
                </div>
              </div>
            )}

            {contact.createdAt && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-dash-text-muted shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-dash-text-muted">
                    Created
                  </p>
                  <span className="text-sm">{contact.createdAt.slice(0, 10)}</span>
                </div>
              </div>
            )}
          </div>

          {contact.tags && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-dash-text-muted mb-1">
                Tags
              </p>
              <p className="text-sm text-dash-text-secondary">{contact.tags}</p>
            </div>
          )}

          {contact.notes && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-3.5 h-3.5 text-dash-text-muted" />
                <p className="text-[10px] uppercase tracking-wider text-dash-text-muted">
                  Notes
                </p>
              </div>
              <p className="text-sm text-dash-text-secondary whitespace-pre-wrap">
                {contact.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactDetailPage;
