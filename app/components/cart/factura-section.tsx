"use client";

import { FileText, ChevronDown } from "lucide-react";

/**
 * MX factura toggle. Default off — most B2C buyers don't want a CFDI,
 * so showing the full RFC form upfront would tank conversion. When the
 * customer flips the toggle, we expand to capture the SAT-required fields.
 *
 * The dropdown values use the SAT catalog codes (Régimen Fiscal,
 * Uso CFDI). Labels are user-friendly so people don't need to look
 * up codes — the value posted to the API is what SAT/Odoo will accept.
 */

export interface FacturaData {
  enabled: boolean;
  rfc: string;
  razonSocial: string;
  regimenFiscal: string;
  usoCfdi: string;
  cpFiscal: string;
}

export const EMPTY_FACTURA: FacturaData = {
  enabled: false,
  rfc: "",
  razonSocial: "",
  regimenFiscal: "",
  usoCfdi: "",
  cpFiscal: "",
};

const T = {
  en: {
    title: "Need a tax invoice (factura)?",
    hint: "Required to deduct this purchase. We'll issue a CFDI to your RFC.",
    toggleOn: "Yes, send a factura",
    toggleOff: "No factura needed",
    rfc: "RFC *",
    razonSocial: "Razón Social *",
    razonSocialHint: "As registered with SAT",
    regimen: "Régimen Fiscal *",
    uso: "Uso de CFDI *",
    cp: "Postal code (CP fiscal) *",
    cpHint: "From your Constancia de Situación Fiscal",
  },
  es: {
    title: "¿Necesitas factura?",
    hint: "Requerida para deducir esta compra. Emitiremos un CFDI a tu RFC.",
    toggleOn: "Sí, emitir factura",
    toggleOff: "No necesito factura",
    rfc: "RFC *",
    razonSocial: "Razón Social *",
    razonSocialHint: "Como aparece en tu constancia",
    regimen: "Régimen Fiscal *",
    uso: "Uso de CFDI *",
    cp: "Código postal (CP fiscal) *",
    cpHint: "De tu Constancia de Situación Fiscal",
  },
};

// SAT catalog — abbreviated to the most common codes for a luxury
// retail customer. Add more here if needed.
const REGIMEN_OPTIONS = [
  { value: "612", label: "612 — Personas Físicas con Actividades Empresariales y Profesionales" },
  { value: "626", label: "626 — Régimen Simplificado de Confianza" },
  { value: "605", label: "605 — Sueldos y Salarios" },
  { value: "601", label: "601 — General de Ley Personas Morales" },
  { value: "603", label: "603 — Personas Morales con Fines no Lucrativos" },
  { value: "606", label: "606 — Arrendamiento" },
  { value: "608", label: "608 — Demás ingresos" },
  { value: "616", label: "616 — Sin obligaciones fiscales" },
];

const USO_CFDI_OPTIONS = [
  { value: "G03", label: "G03 — Gastos en general" },
  { value: "G01", label: "G01 — Adquisición de mercancías" },
  { value: "I08", label: "I08 — Otra maquinaria y equipo" },
  { value: "D10", label: "D10 — Pagos por servicios educativos" },
  { value: "S01", label: "S01 — Sin efectos fiscales" },
  { value: "CP01", label: "CP01 — Pagos" },
];

interface FacturaSectionProps {
  locale: "en" | "es";
  value: FacturaData;
  onChange: (next: FacturaData) => void;
  errors?: Partial<Record<keyof FacturaData, string>>;
}

export const FacturaSection = ({
  locale,
  value,
  onChange,
  errors = {},
}: FacturaSectionProps) => {
  const t = T[locale];

  return (
    <div
      className={`border border-brand-stone/15 bg-brand-linen/40 transition-all ${
        value.enabled ? "p-5" : "p-4"
      }`}
    >
      <div className="flex items-start gap-3">
        <FileText className="w-5 h-5 text-brand-copper shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-medium text-brand-charcoal">
            {t.title}
          </p>
          <p className="font-body text-xs text-dash-text-secondary mt-0.5">
            {t.hint}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...value, enabled: !value.enabled })}
          aria-pressed={value.enabled}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-copper/40 focus:ring-offset-2 focus:ring-offset-brand-linen ${
            value.enabled ? "bg-brand-copper" : "bg-brand-stone/30"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              value.enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {value.enabled && (
        <div className="mt-5 space-y-4 cc-item-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FacturaInput
              label={t.rfc}
              value={value.rfc}
              onChange={(v) =>
                onChange({ ...value, rfc: v.toUpperCase().replace(/\s/g, "") })
              }
              placeholder="XAXX010101000"
              error={errors.rfc}
              maxLength={13}
              monospace
            />
            <FacturaInput
              label={t.cp}
              hint={t.cpHint}
              value={value.cpFiscal}
              onChange={(v) =>
                onChange({ ...value, cpFiscal: v.replace(/\D/g, "") })
              }
              maxLength={5}
              error={errors.cpFiscal}
              monospace
            />
          </div>

          <FacturaInput
            label={t.razonSocial}
            hint={t.razonSocialHint}
            value={value.razonSocial}
            onChange={(v) => onChange({ ...value, razonSocial: v })}
            error={errors.razonSocial}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FacturaSelect
              label={t.regimen}
              value={value.regimenFiscal}
              onChange={(v) => onChange({ ...value, regimenFiscal: v })}
              options={REGIMEN_OPTIONS}
              error={errors.regimenFiscal}
            />
            <FacturaSelect
              label={t.uso}
              value={value.usoCfdi}
              onChange={(v) => onChange({ ...value, usoCfdi: v })}
              options={USO_CFDI_OPTIONS}
              error={errors.usoCfdi}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface InputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  maxLength?: number;
  monospace?: boolean;
}

const FacturaInput = ({
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  maxLength,
  monospace,
}: InputProps) => (
  <div>
    <label className="block font-body text-xs tracking-wide text-dash-text-secondary mb-1.5">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-invalid={!!error}
      className={`w-full px-3 py-2.5 text-sm bg-white border transition-colors focus:outline-none focus:ring-1 ${
        monospace ? "font-mono tracking-wider" : "font-body"
      } ${
        error
          ? "border-dash-danger focus:border-dash-danger focus:ring-dash-danger/20"
          : "border-brand-stone/25 focus:border-brand-copper focus:ring-brand-copper/20"
      }`}
    />
    {error ? (
      <p className="mt-1 font-body text-xs text-dash-danger" role="alert">
        {error}
      </p>
    ) : (
      hint && (
        <p className="mt-1 font-body text-xs text-dash-text-secondary/70">
          {hint}
        </p>
      )
    )}
  </div>
);

interface SelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
}

const FacturaSelect = ({ label, value, onChange, options, error }: SelectProps) => (
  <div>
    <label className="block font-body text-xs tracking-wide text-dash-text-secondary mb-1.5">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`appearance-none w-full px-3 py-2.5 pr-9 font-body text-sm bg-white border transition-colors focus:outline-none focus:ring-1 ${
          error
            ? "border-dash-danger focus:border-dash-danger focus:ring-dash-danger/20"
            : "border-brand-stone/25 focus:border-brand-copper focus:ring-brand-copper/20"
        }`}
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-brand-stone pointer-events-none" />
    </div>
    {error && (
      <p className="mt-1 font-body text-xs text-dash-danger" role="alert">
        {error}
      </p>
    )}
  </div>
);
