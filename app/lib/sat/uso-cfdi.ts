export interface UsoCfdiEntry {
  code: string;
  label_es: string;
  label_en: string;
}

export const USO_CFDI: UsoCfdiEntry[] = [
  { code: "G01", label_es: "Adquisicion de mercancias", label_en: "Acquisition of merchandise" },
  { code: "G02", label_es: "Devoluciones, descuentos o bonificaciones", label_en: "Returns, discounts or rebates" },
  { code: "G03", label_es: "Gastos en general", label_en: "General expenses" },
  { code: "I01", label_es: "Construcciones", label_en: "Construction" },
  { code: "I02", label_es: "Mobiliario y equipo de oficina por inversiones", label_en: "Office furniture and equipment" },
  { code: "I03", label_es: "Equipo de transporte", label_en: "Transportation equipment" },
  { code: "I04", label_es: "Equipo de computo y accesorios", label_en: "Computer equipment and accessories" },
  { code: "I05", label_es: "Dados, troqueles, moldes, matrices y herramental", label_en: "Dies, molds, matrices and tooling" },
  { code: "I06", label_es: "Comunicaciones telefonicas", label_en: "Telephone communications" },
  { code: "I07", label_es: "Comunicaciones satelitales", label_en: "Satellite communications" },
  { code: "I08", label_es: "Otra maquinaria y equipo", label_en: "Other machinery and equipment" },
  { code: "D01", label_es: "Honorarios medicos, dentales y gastos hospitalarios", label_en: "Medical and dental fees, hospital expenses" },
  { code: "D02", label_es: "Gastos medicos por incapacidad o discapacidad", label_en: "Medical expenses for disability" },
  { code: "D03", label_es: "Gastos funerales", label_en: "Funeral expenses" },
  { code: "D04", label_es: "Donativos", label_en: "Donations" },
  { code: "D05", label_es: "Intereses reales efectivamente pagados por creditos hipotecarios (casa habitacion)", label_en: "Mortgage interest (residential)" },
  { code: "D06", label_es: "Aportaciones voluntarias al SAR", label_en: "Voluntary SAR contributions" },
  { code: "D07", label_es: "Primas por seguros de gastos medicos", label_en: "Medical insurance premiums" },
  { code: "D08", label_es: "Gastos de transportacion escolar obligatoria", label_en: "Mandatory school transportation expenses" },
  { code: "D09", label_es: "Depositos en cuentas para el ahorro, primas que tengan como base planes de pensiones", label_en: "Savings account deposits, pension plan premiums" },
  { code: "D10", label_es: "Pagos por servicios educativos (colegiaturas)", label_en: "Educational services (tuition)" },
  { code: "S01", label_es: "Sin efectos fiscales", label_en: "No tax effect" },
  { code: "CP01", label_es: "Pagos", label_en: "Payments" },
  { code: "CN01", label_es: "Nomina", label_en: "Payroll" },
] as const;

export type UsoCfdiCode = (typeof USO_CFDI)[number]["code"];
