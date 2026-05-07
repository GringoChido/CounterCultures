/**
 * SAT product/service codes (clave de producto/servicio) for CFDI.
 *
 * Curated subset of the SAT catalog relevant to Counter Cultures' product
 * lines: plumbing fixtures, kitchen/bath hardware, lighting, and accessories.
 * The full SAT catalog has 50,000+ entries; this file keeps only the ~85
 * codes that apply to this business.
 *
 * Source: finance team's "SAT CODES.xlsx" workbook.
 */

export interface SATCode {
  code: string;
  description: string;
}

export const SAT_CODES: SATCode[] = [
  { code: "01010101", description: "No existe en el catálogo (Público en general)" },
  { code: "24112005", description: "Canastas metálicas" },
  { code: "26111608", description: "Generadores de vapor" },
  { code: "26121600", description: "Cables eléctricos y accesorios" },
  { code: "30181500", description: "Porcelana sanitaria" },
  { code: "30181501", description: "Tinas o bañeras" },
  { code: "30181502", description: "Bidés, Bidet" },
  { code: "30181503", description: "Duchas, Regadera" },
  { code: "30181504", description: "Lavabo, Lavamanos" },
  { code: "30181505", description: "Inodoros o excusados, Tocador para baño" },
  { code: "30181506", description: "Mingitorio, Orinales" },
  { code: "30181507", description: "Cabinas de hidromasaje y bañeras, Canceles para baño, Cerramientos para bañeras o duchas" },
  { code: "30181508", description: "Divisiones de baños" },
  { code: "30181511", description: "Inodoros o excusados, Taza de baño" },
  { code: "30181514", description: "Tapa de tanque del inodoro" },
  { code: "30181515", description: "Tanque del inodoro" },
  { code: "30181516", description: "Sauna" },
  { code: "30181517", description: "Jacuzzi" },
  { code: "30181600", description: "Instalaciones residenciales no sanitarias (Accesorios para cuarto de baño)" },
  { code: "30181601", description: "Jabonera" },
  { code: "30181602", description: "Toallero" },
  { code: "30181603", description: "Asiento de inodoro, Asiento para taza de baño, Bizcocho o asiento del inodoro" },
  { code: "30181604", description: "Tapa de inodoro, Tapa del bizcocho, Tapa para taza de baño" },
  { code: "30181605", description: "Desagüe" },
  { code: "30181606", description: "Ganchos de baño, Toalleros" },
  { code: "30181607", description: "Cortina de baño o su ensamble" },
  { code: "30181608", description: "Tubo para cortina de baño, Varilla de ducha" },
  { code: "30181609", description: "Portafrascos, Soporte para frascos de ducha" },
  { code: "30181610", description: "Portapapel, Soporte de papel higiénico" },
  { code: "30181611", description: "Portacepillos y portavasos, Soporte de cepillos de dientes o vaso" },
  { code: "30181612", description: "Gancho para la máquina afeitadora" },
  { code: "30181613", description: "Faldón de la tina o del jacuzzi" },
  { code: "30181614", description: "Dispensador de jabón" },
  { code: "30181700", description: "Grifos (Llaves)" },
  { code: "30181701", description: "Fregadero, Llave de paso, Llave de registro, Llaves mezcladoras, Tarja" },
  { code: "30181800", description: "Grifería y cabezales de ducha, chorros y accesorios" },
  { code: "30181801", description: "Pomo de ducha, Regadera" },
  { code: "30181802", description: "Aireador de la ducha, Filtro aireador para regadera" },
  { code: "30181803", description: "Ducha teléfono, Regadera de extensión manual" },
  { code: "30181804", description: "Grifo, Llaves para regadera" },
  { code: "30181805", description: "Ducha combinada fija y teléfono, Sistema de regadera mixta" },
  { code: "30181806", description: "Bañera de hidromasaje, Chorros" },
  { code: "30181807", description: "Boquilla, Tubo de bañera con desviador" },
  { code: "30181808", description: "Válvulas ocultas, Válvulas para regaderas" },
  { code: "30181809", description: "Juego de reparación para ducha manual, Kit de reparación de duchas teléfono" },
  { code: "30181810", description: "Ajuste de grifo" },
  { code: "30181811", description: "Kit de reparación de grifo" },
  { code: "30181812", description: "Regaderas corporales, Rociador de cuerpo" },
  { code: "31101700", description: "Piezas fundidas en molde permanente" },
  { code: "31101710", description: "Objetos de cobre fundidos en molde fijo, Piezas de cobre fundidas en molde permanente" },
  { code: "31162400", description: "Fijadores varios" },
  { code: "31162401", description: "Aros interiores" },
  { code: "31162402", description: "Cerraduras" },
  { code: "31162403", description: "Goznes o bisagras" },
  { code: "31162407", description: "Pestillo (Cerrojo, Pasador)" },
  { code: "31162800", description: "Ferretería en general" },
  { code: "31162801", description: "Chapas o pomos" },
  { code: "31162804", description: "Topes de puerta" },
  { code: "39111800", description: "Accesorios de iluminación" },
  { code: "39122200", description: "Interruptores eléctricos y accesorios" },
  { code: "39122216", description: "Interruptores de botón" },
  { code: "40101800", description: "Equipo de calefacción y piezas y accesorios" },
  { code: "40141719", description: "Adaptadores para plomería" },
  { code: "40142508", description: "Filtros (coladores) de canasta" },
  { code: "40161500", description: "Filtros" },
  { code: "40161502", description: "Filtros de agua" },
  { code: "42142203", description: "Sapo para W.C." },
  { code: "46171500", description: "Cerraduras, elementos de seguridad y accesorios" },
  { code: "47111500", description: "Equipo de lavado y secado" },
  { code: "47131805", description: "Ceras limpiadoras, Limpiadores de propósito general" },
  { code: "48101700", description: "Distribuidores automáticos de comida y bebida" },
  { code: "48101907", description: "Jarras para servicio de comidas" },
  { code: "52141500", description: "Electrodomésticos para cocina" },
  { code: "52141503", description: "Trituradores de basura para uso doméstico" },
  { code: "52141546", description: "Extractor de cocina para uso doméstico" },
  { code: "56101545", description: "Espejos decorativos" },
  { code: "56101812", description: "Mesas para cambiar al bebé o accesorios" },
  { code: "78102200", description: "Servicios postales de paqueteo y courrier" },
  { code: "80141611", description: "Servicios de personalización de obsequios o productos" },
];

export const searchSATCodes = (query: string, limit = 20): SATCode[] => {
  if (!query) return SAT_CODES.slice(0, limit);
  const q = query.toLowerCase();
  return SAT_CODES.filter(
    (c) => c.code.includes(q) || c.description.toLowerCase().includes(q)
  ).slice(0, limit);
};

export const findSATCode = (code: string): SATCode | undefined =>
  SAT_CODES.find((c) => c.code === code);
