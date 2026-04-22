"use client";

import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";

type ContactActionsProps = {
  phone?: string | null;
  email?: string | null;
  alwaysVisible?: boolean;
  className?: string;
  size?: "sm" | "md";
};

const normalizePhone = (phone: string): string =>
  phone.replace(/[^\d+]/g, "").replace(/^\+/, "");

const ContactActions = ({
  phone,
  email,
  alwaysVisible = false,
  className = "",
  size = "sm",
}: ContactActionsProps) => {
  const iconSize = size === "sm" ? 14 : 16;
  const buttonClasses =
    "inline-flex items-center justify-center rounded p-1.5 text-dash-text-secondary hover:bg-dash-surface-2 hover:text-dash-accent transition";
  const visibility = alwaysVisible
    ? "opacity-100"
    : "opacity-0 group-hover:opacity-100 transition-opacity";

  if (!phone && !email) return null;

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${visibility} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {phone ? (
        <Link
          href={`https://wa.me/${normalizePhone(phone)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses}
          title={`WhatsApp ${phone}`}
          aria-label={`WhatsApp ${phone}`}
        >
          <MessageCircle size={iconSize} />
        </Link>
      ) : null}
      {email ? (
        <a
          href={`mailto:${email}`}
          className={buttonClasses}
          title={`Email ${email}`}
          aria-label={`Email ${email}`}
        >
          <Mail size={iconSize} />
        </a>
      ) : null}
    </div>
  );
};

export { ContactActions };
export type { ContactActionsProps };
