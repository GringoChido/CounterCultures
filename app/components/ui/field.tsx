"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
} from "react";
import { focusRing } from "./focus-ring";

type FieldVariant = "storefront" | "dashboard";

interface FieldShellProps {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  hideLabel?: boolean;
  className?: string;
  children: (ids: { describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

const labelClass =
  "block font-body text-sm font-medium text-brand-charcoal mb-1.5";
const descClass = "font-body text-xs text-dash-text-secondary mt-1";
const errorClass = "font-body text-xs text-dash-danger mt-1";

const FieldShell = ({
  id,
  label,
  description,
  error,
  required,
  hideLabel,
  className,
  children,
}: FieldShellProps) => {
  const descId = description ? `${id}-desc` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : labelClass}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-dash-danger ml-0.5">
            *
          </span>
        ) : null}
      </label>
      {children({ describedBy, invalid: Boolean(error) })}
      {description ? (
        <p id={descId} className={descClass}>
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errId} className={errorClass} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

const baseControl = (variant: FieldVariant) =>
  [
    "w-full px-4 py-3 rounded-md font-body text-sm transition-colors",
    variant === "storefront"
      ? "bg-dash-surface border border-brand-stone/20 text-brand-charcoal placeholder:text-dash-text-secondary/50 hover:border-brand-stone/40 focus:border-brand-terracotta"
      : "bg-dash-surface border border-dash-border text-dash-text placeholder:text-dash-text-muted hover:border-dash-border-strong focus:border-brand-copper",
    "aria-[invalid=true]:border-dash-danger",
    focusRing,
  ].join(" ");

interface BaseFieldProps {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  variant?: FieldVariant;
  hideLabel?: boolean;
  containerClassName?: string;
}

interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id">,
    BaseFieldProps {
  id?: string;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      description,
      error,
      required,
      variant = "storefront",
      hideLabel,
      containerClassName,
      className = "",
      id: idProp,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const id = idProp ?? autoId;
    return (
      <FieldShell
        id={id}
        label={label}
        description={description}
        error={error}
        required={required}
        hideLabel={hideLabel}
        className={containerClassName}
      >
        {({ describedBy, invalid }) => (
          <input
            ref={ref}
            id={id}
            required={required}
            aria-required={required || undefined}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={`${baseControl(variant)} ${className}`}
            {...props}
          />
        )}
      </FieldShell>
    );
  }
);
TextField.displayName = "TextField";

interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">,
    BaseFieldProps {
  id?: string;
}

const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  (
    {
      label,
      description,
      error,
      required,
      variant = "storefront",
      hideLabel,
      containerClassName,
      className = "",
      id: idProp,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const id = idProp ?? autoId;
    return (
      <FieldShell
        id={id}
        label={label}
        description={description}
        error={error}
        required={required}
        hideLabel={hideLabel}
        className={containerClassName}
      >
        {({ describedBy, invalid }) => (
          <textarea
            ref={ref}
            id={id}
            required={required}
            aria-required={required || undefined}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={`${baseControl(variant)} resize-none ${className}`}
            {...props}
          />
        )}
      </FieldShell>
    );
  }
);
TextAreaField.displayName = "TextAreaField";

interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id">,
    BaseFieldProps {
  id?: string;
  children: ReactNode;
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      label,
      description,
      error,
      required,
      variant = "storefront",
      hideLabel,
      containerClassName,
      className = "",
      id: idProp,
      children,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const id = idProp ?? autoId;
    return (
      <FieldShell
        id={id}
        label={label}
        description={description}
        error={error}
        required={required}
        hideLabel={hideLabel}
        className={containerClassName}
      >
        {({ describedBy, invalid }) => (
          <select
            ref={ref}
            id={id}
            required={required}
            aria-required={required || undefined}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={`${baseControl(variant)} ${className}`}
            {...props}
          >
            {children}
          </select>
        )}
      </FieldShell>
    );
  }
);
SelectField.displayName = "SelectField";

export { TextField, TextAreaField, SelectField };
export type { TextFieldProps, TextAreaFieldProps, SelectFieldProps };
