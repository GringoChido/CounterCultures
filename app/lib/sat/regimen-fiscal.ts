export type PersonType = "fisica" | "moral" | "both";

export interface RegimenFiscalEntry {
  code: string;
  label_es: string;
  label_en: string;
  appliesTo: PersonType;
}

export const REGIMEN_FISCAL: RegimenFiscalEntry[] = [
  { code: "601", label_es: "General de Ley Personas Morales", label_en: "General Law Legal Entities", appliesTo: "moral" },
  { code: "603", label_es: "Personas Morales con Fines no Lucrativos", label_en: "Non-Profit Legal Entities", appliesTo: "moral" },
  { code: "605", label_es: "Sueldos y Salarios e Ingresos Asimilados a Salarios", label_en: "Wages and Salaries", appliesTo: "fisica" },
  { code: "606", label_es: "Arrendamiento", label_en: "Leasing", appliesTo: "fisica" },
  { code: "607", label_es: "Regimen de Enajenacion o Adquisicion de Bienes", label_en: "Disposal or Acquisition of Goods", appliesTo: "fisica" },
  { code: "608", label_es: "Demas ingresos", label_en: "Other Income", appliesTo: "fisica" },
  { code: "610", label_es: "Residentes en el Extranjero sin Establecimiento Permanente en Mexico", label_en: "Foreign Residents without Permanent Establishment in Mexico", appliesTo: "both" },
  { code: "611", label_es: "Ingresos por Dividendos (socios y accionistas)", label_en: "Dividend Income (partners and shareholders)", appliesTo: "fisica" },
  { code: "612", label_es: "Personas Fisicas con Actividades Empresariales y Profesionales", label_en: "Individuals with Business and Professional Activities", appliesTo: "fisica" },
  { code: "614", label_es: "Ingresos por intereses", label_en: "Interest Income", appliesTo: "fisica" },
  { code: "615", label_es: "Regimen de los ingresos por obtencion de premios", label_en: "Prize Income", appliesTo: "fisica" },
  { code: "616", label_es: "Sin obligaciones fiscales", label_en: "No Tax Obligations", appliesTo: "fisica" },
  { code: "620", label_es: "Sociedades Cooperativas de Produccion que optan por diferir sus ingresos", label_en: "Production Cooperatives Deferring Income", appliesTo: "moral" },
  { code: "621", label_es: "Incorporacion Fiscal", label_en: "Tax Incorporation", appliesTo: "fisica" },
  { code: "622", label_es: "Actividades Agricolas, Ganaderas, Silvicolas y Pesqueras", label_en: "Agricultural, Livestock, Forestry and Fishing Activities", appliesTo: "both" },
  { code: "623", label_es: "Opcional para Grupos de Sociedades", label_en: "Optional for Corporate Groups", appliesTo: "moral" },
  { code: "624", label_es: "Coordinados", label_en: "Coordinated Entities", appliesTo: "moral" },
  { code: "625", label_es: "Regimen de las Actividades Empresariales con ingresos a traves de Plataformas Tecnologicas", label_en: "Business Activities via Technology Platforms", appliesTo: "fisica" },
  { code: "626", label_es: "Regimen Simplificado de Confianza", label_en: "Simplified Trust Regime", appliesTo: "both" },
  { code: "628", label_es: "Hidrocarburos", label_en: "Hydrocarbons", appliesTo: "moral" },
  { code: "629", label_es: "De los Regimenes Fiscales Preferentes y de las Empresas Multinacionales", label_en: "Preferential Tax Regimes and Multinational Enterprises", appliesTo: "both" },
  { code: "630", label_es: "Enajenacion de acciones en bolsa de valores", label_en: "Sale of Stock Exchange Shares", appliesTo: "both" },
] as const;

export type RegimenFiscalCode = (typeof REGIMEN_FISCAL)[number]["code"];
