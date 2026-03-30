export interface GlossaryTerm {
  term: { en: string; es: string };
  definition: { en: string; es: string };
  category: "material" | "technique" | "standard" | "product" | "design";
}

export const glossaryTerms: GlossaryTerm[] = [
  {
    term: { en: "Cefiontect", es: "Cefiontect" },
    definition: {
      en: "TOTO's proprietary ceramic glaze fired into the porcelain surface at the molecular level. Creates an extraordinarily smooth surface that resists waste adhesion, reduces cleaning frequency, and inhibits bacterial growth. Available on TOTO's premium toilet and basin lines.",
      es: "El glaseado cerámico propietario de TOTO cocido en la superficie de porcelana a nivel molecular. Crea una superficie extraordinariamente lisa que resiste la adhesión de residuos, reduce la frecuencia de limpieza e inhibe el crecimiento bacteriano.",
    },
    category: "product",
  },
  {
    term: { en: "Silgranit", es: "Silgranit" },
    definition: {
      en: "BLANCO's composite material made from 80% natural granite and 20% acrylic resin. Non-porous, scratch-resistant, and heat-resistant to 280°C. Color runs through the full thickness — scratches don't reveal a different layer. Available in 10 colors.",
      es: "El material compuesto de BLANCO hecho de 80% granito natural y 20% resina acrílica. No poroso, resistente a rayones y al calor hasta 280°C. El color atraviesa todo el espesor del material.",
    },
    category: "material",
  },
  {
    term: { en: "PVD Finish", es: "Acabado PVD" },
    definition: {
      en: "Physical Vapor Deposition — a finish application method that bonds a thin metallic film to the fixture surface at the atomic level. PVD finishes are 5–10x more durable than traditional electroplated finishes and resist tarnishing, scratching, and corrosion. Used by Kohler (Vibrant series) and Brizo (Brilliance series).",
      es: "Deposición Física de Vapor — un método de aplicación de acabado que une una película metálica delgada a la superficie del accesorio a nivel atómico. Los acabados PVD son 5–10 veces más duraderos que los acabados electrodepositados tradicionales.",
    },
    category: "technique",
  },
  {
    term: { en: "Tornado Flush", es: "Tornado Flush" },
    definition: {
      en: "TOTO's three-jet flushing technology that creates a centrifugal washing action around the toilet bowl. Uses only 4.8 liters per flush — 20% less than Mexico's NOM-009-CNA maximum of 6.0 liters — while cleaning more effectively than conventional gravity-fed systems.",
      es: "La tecnología de descarga de tres chorros de TOTO que crea una acción de lavado centrífuga alrededor del inodoro. Usa solo 4.8 litros por descarga — 20% menos que el máximo NOM-009-CNA de México de 6.0 litros.",
    },
    category: "product",
  },
  {
    term: { en: "Silicon Bronze", es: "Bronce de Silicón" },
    definition: {
      en: "A copper alloy containing 3–4% silicon and small amounts of manganese. Used by Sun Valley Bronze for door hardware. Naturally corrosion-resistant — unlike brass, it won't tarnish, pit, or develop green patina from outdoor exposure. The same alloy used in marine propellers and fine art sculpture.",
      es: "Una aleación de cobre que contiene 3–4% de silicón y pequeñas cantidades de manganeso. Usada por Sun Valley Bronze para herraje de puertas. Naturalmente resistente a la corrosión — a diferencia del latón, no se empaña ni desarrolla pátina verde.",
    },
    category: "material",
  },
  {
    term: { en: "Cantera", es: "Cantera" },
    definition: {
      en: "A volcanic stone indigenous to central Mexico, widely used in colonial architecture. In San Miguel de Allende, pink and gray cantera is used for building facades, doorframes, fountain basins, and decorative elements. Softer than granite but harder than limestone, it's carveable yet durable in the region's temperate climate.",
      es: "Una piedra volcánica autóctona del centro de México, ampliamente usada en la arquitectura colonial. En San Miguel de Allende, la cantera rosa y gris se usa para fachadas, marcos de puertas, fuentes y elementos decorativos.",
    },
    category: "material",
  },
  {
    term: { en: "Talavera", es: "Talavera" },
    definition: {
      en: "A type of majolica pottery with Denominación de Origen protection — only ceramics produced in Puebla and surrounding municipalities using traditional methods and materials can legally be called Talavera. Characterized by tin-based white glaze and mineral pigments in six colors. Used for decorative tile, basins, and accent pieces.",
      es: "Un tipo de cerámica mayólica con protección de Denominación de Origen — solo las cerámicas producidas en Puebla y municipios aledaños usando métodos y materiales tradicionales pueden legalmente llamarse Talavera.",
    },
    category: "material",
  },
  {
    term: { en: "NOM-009-CNA", es: "NOM-009-CNA" },
    definition: {
      en: "Mexico's official standard (Norma Oficial Mexicana) governing maximum water flow rates for plumbing fixtures. Sets limits of 6.0 liters per flush for toilets, 8.3 liters per minute for faucets, and 9.5 liters per minute for showerheads. All fixtures sold in Mexico must comply.",
      es: "La norma oficial mexicana que gobierna las tasas máximas de flujo de agua para accesorios de plomería. Establece límites de 6.0 litros por descarga para sanitarios, 8.3 litros por minuto para grifos y 9.5 litros por minuto para regaderas.",
    },
    category: "standard",
  },
  {
    term: { en: "WaterSense", es: "WaterSense" },
    definition: {
      en: "The U.S. EPA's voluntary labeling program for water-efficient products. While not legally required in Mexico, WaterSense certification guarantees performance testing and qualifies for LEED water efficiency credits. Products must perform as well as standard fixtures while using at least 20% less water.",
      es: "El programa voluntario de etiquetado de la EPA de EE.UU. para productos eficientes en agua. Aunque no es legalmente requerido en México, la certificación WaterSense garantiza pruebas de rendimiento y califica para créditos LEED de eficiencia de agua.",
    },
    category: "standard",
  },
  {
    term: { en: "Washlet", es: "Washlet" },
    definition: {
      en: "TOTO's integrated bidet toilet seat technology. Features heated water spray with adjustable pressure and position, warm air drying, heated seat, deodorizer, and UV-light self-sterilization. Available in C100, C200, and premium S7A models. Engineered as part of the toilet system, not an aftermarket add-on.",
      es: "La tecnología de asiento de inodoro bidet integrado de TOTO. Incluye rociado de agua caliente con presión y posición ajustables, secado con aire caliente, asiento calefaccionado, desodorizador y autoesterilización por luz UV.",
    },
    category: "product",
  },
  {
    term: { en: "Rough-In", es: "Preparación en Bruto" },
    definition: {
      en: "The plumbing installation phase completed before walls and floors are finished. Includes positioning supply lines, drain connections, and valve bodies according to the fixture manufacturer's specifications. Critical dimensions vary by brand and model — always verify rough-in specs before wall closure.",
      es: "La fase de instalación de plomería completada antes de que se terminen muros y pisos. Incluye el posicionamiento de líneas de suministro, conexiones de drenaje y cuerpos de válvula según las especificaciones del fabricante.",
    },
    category: "technique",
  },
  {
    term: { en: "Undermount", es: "Bajo Cubierta" },
    definition: {
      en: "A sink installation method where the basin is mounted below the countertop surface, creating a seamless edge. Requires solid countertop material (granite, quartz, concrete — not laminate). Easier to clean than drop-in installations because there's no rim where debris collects.",
      es: "Un método de instalación de fregadero donde el lavabo se monta debajo de la superficie de la encimera, creando un borde continuo. Requiere material de encimera sólido (granito, cuarzo, concreto — no laminado).",
    },
    category: "technique",
  },
  {
    term: { en: "Vessel Sink", es: "Lavabo Tipo Vasija" },
    definition: {
      en: "A basin that sits on top of the countertop or vanity surface rather than being recessed into it. Popular in San Miguel de Allende for showcasing artisanal copper, ceramic, and stone pieces. Requires a wall-mounted or vessel-height faucet (standard deck-mount faucets are too short).",
      es: "Un lavabo que se asienta sobre la superficie de la encimera o tocador en lugar de empotrarle. Popular en San Miguel de Allende para exhibir piezas artesanales de cobre, cerámica y piedra.",
    },
    category: "design",
  },
  {
    term: { en: "Apron-Front Sink", es: "Fregadero Tipo Delantal" },
    definition: {
      en: "Also called a farmhouse sink. A kitchen sink style where the front face of the basin extends past the cabinetry, creating a visible apron. Available in fireclay (Kohler Whitehaven), composite (BLANCO Ikon), and stainless steel. Requires a custom cabinet cut-out for installation.",
      es: "También llamado fregadero tipo granja. Un estilo de fregadero de cocina donde la cara frontal del lavabo se extiende más allá de la ebanistería, creando un delantal visible.",
    },
    category: "design",
  },
  {
    term: { en: "Thermostatic Valve", es: "Válvula Termostática" },
    definition: {
      en: "A shower valve that maintains a constant water temperature regardless of changes in supply pressure. Essential for safety (prevents scalding) and comfort. Brizo and Kohler thermostatic valves allow precise temperature setting with ±1°C accuracy.",
      es: "Una válvula de ducha que mantiene una temperatura de agua constante independientemente de los cambios en la presión de suministro. Esencial para seguridad (previene quemaduras) y confort.",
    },
    category: "product",
  },
  {
    term: { en: "Patina", es: "Pátina" },
    definition: {
      en: "The surface color change that occurs naturally on metals like copper and bronze when exposed to air, water, and touch over time. On copper, patina progresses from salmon pink to warm amber to chocolate brown, and eventually to blue-green verdigris. Not damage — it's a protective layer that adds character.",
      es: "El cambio de color superficial que ocurre naturalmente en metales como el cobre y el bronce cuando se exponen al aire, agua y tacto con el tiempo. No es daño — es una capa protectora que agrega carácter.",
    },
    category: "material",
  },
  {
    term: { en: "LEED Certification", es: "Certificación LEED" },
    definition: {
      en: "Leadership in Energy and Environmental Design — a green building certification system administered by the U.S. Green Building Council. Water-efficient fixtures contribute to the 'Indoor Water Use Reduction' prerequisite. WaterSense-labeled products from TOTO and Kohler qualify for LEED water credits.",
      es: "Liderazgo en Energía y Diseño Ambiental — un sistema de certificación de edificios verdes. Los accesorios eficientes en agua contribuyen al prerrequisito de 'Reducción de Uso de Agua Interior'.",
    },
    category: "standard",
  },
  {
    term: { en: "Denominación de Origen", es: "Denominación de Origen" },
    definition: {
      en: "A geographic designation certifying that a product originates from a specific region and follows traditional production methods. In fixtures, this applies to Talavera pottery (Puebla) and certain artisanal ceramics. Similar to France's AOC or Italy's DOP systems.",
      es: "Una designación geográfica que certifica que un producto se origina de una región específica y sigue métodos de producción tradicionales. En accesorios, esto aplica a la cerámica Talavera (Puebla) y ciertas cerámicas artesanales.",
    },
    category: "standard",
  },
  {
    term: { en: "Fireclay", es: "Arcilla Refractaria" },
    definition: {
      en: "A ceramic material fired at extremely high temperatures (over 1,800°F / 1,000°C) to create a dense, non-porous surface. Used for apron-front kitchen sinks (Kohler Whitehaven) and some bathroom basins. Extremely resistant to staining, scratching, and thermal shock. Heavier than stainless steel alternatives.",
      es: "Un material cerámico cocido a temperaturas extremadamente altas (más de 1,000°C) para crear una superficie densa y no porosa. Usado para fregaderos tipo delantal y algunos lavabos de baño.",
    },
    category: "material",
  },
  {
    term: { en: "Comfort Height", es: "Altura Confort" },
    definition: {
      en: "Kohler's term for ADA-compliant toilet height — 17–19 inches (43–48cm) from floor to seat top, compared to standard 15 inches (38cm). Easier to use for adults and those with mobility limitations. TOTO's equivalent is called 'Universal Height.' Most new residential and all commercial toilets now use comfort/universal height.",
      es: "El término de Kohler para la altura de inodoro compatible con ADA — 43–48cm del piso al asiento, comparado con los 38cm estándar. Más fácil de usar para adultos y personas con limitaciones de movilidad.",
    },
    category: "design",
  },
  {
    term: { en: "SmartTouch", es: "SmartTouch" },
    definition: {
      en: "Brizo's touch-activation technology for kitchen and bathroom faucets. A simple touch anywhere on the spout or handle toggles water flow on/off. Uses capacitive sensing (similar to smartphone screens). Reduces water waste by making it easy to turn off flow during food prep or handwashing.",
      es: "La tecnología de activación táctil de Brizo para grifos de cocina y baño. Un simple toque en cualquier parte del grifo activa o desactiva el flujo de agua. Usa detección capacitiva similar a las pantallas de smartphones.",
    },
    category: "product",
  },
];
