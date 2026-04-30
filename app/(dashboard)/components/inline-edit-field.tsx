"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X, Pencil } from "lucide-react";

type InlineEditFieldProps = {
  value: string;
  onSave: (newValue: string) => void | Promise<void>;
  placeholder?: string;
  type?: "text" | "number" | "email" | "tel";
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
  validate?: (v: string) => string | null;
};

const InlineEditField = ({
  value,
  onSave,
  placeholder = "—",
  type = "text",
  className = "",
  inputClassName = "",
  ariaLabel,
  validate,
}: InlineEditFieldProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSave = async () => {
    if (validate) {
      const err = validate(draft);
      if (err) {
        setError(err);
        return;
      }
    }
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
    setError(null);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`group inline-flex items-center gap-1.5 text-left hover:text-dash-accent transition ${className}`}
        aria-label={ariaLabel ?? `Edit ${value || placeholder}`}
      >
        <span>{value || <span className="text-dash-text-muted">{placeholder}</span>}</span>
        <Pencil
          size={12}
          className="opacity-0 group-hover:opacity-60 transition-opacity"
        />
      </button>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") handleCancel();
        }}
        disabled={saving}
        aria-label={ariaLabel}
        aria-invalid={Boolean(error)}
        className={`px-2 py-1 text-sm border border-dash-border rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-dash-accent/40 ${inputClassName}`}
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="p-1 rounded text-dash-success hover:bg-dash-success/10 transition"
        aria-label="Save"
      >
        <Check size={14} />
      </button>
      <button
        type="button"
        onClick={handleCancel}
        disabled={saving}
        className="p-1 rounded text-dash-text-muted hover:bg-dash-surface-2 transition"
        aria-label="Cancel"
      >
        <X size={14} />
      </button>
      {error ? (
        <span className="text-xs text-dash-danger ml-1" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
};

export { InlineEditField };
export type { InlineEditFieldProps };
