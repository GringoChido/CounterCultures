export type ArticlePillar = "Design" | "Product" | "Trade" | "Craft";

export interface Article {
  slug: string;
  title: { en: string; es: string };
  excerpt: { en: string; es: string };
  pillar: ArticlePillar;
  date: string;
  readTime: string;
  image: string;
  author: string;
  featured?: boolean;
  editorsPick?: boolean;
  body: { en: string; es: string };
  relatedSlugs: string[];
}

export const pillarColors: Record<ArticlePillar, string> = {
  Design: "bg-brand-copper",
  Product: "bg-brand-charcoal",
  Trade: "bg-brand-sage",
  Craft: "bg-brand-terracotta",
};

export const pillarLabels: Record<ArticlePillar, { en: string; es: string }> = {
  Design: { en: "Design", es: "Diseño" },
  Product: { en: "Product", es: "Producto" },
  Trade: { en: "Trade", es: "Profesional" },
  Craft: { en: "Craft", es: "Artesanía" },
};

export const articles: Article[] = [
  {
    slug: "hand-hammered-copper-basin-guide",
    title: {
      en: "The Complete Guide to Hand-Hammered Copper Basins",
      es: "Guía Completa de Lavabos de Cobre Martillado a Mano",
    },
    excerpt: {
      en: "From Santa Clara del Cobre to your bathroom — how artisanal copper basins are made, maintained, and why they develop a living patina that no factory finish can replicate.",
      es: "De Santa Clara del Cobre a tu baño — cómo se fabrican los lavabos artesanales de cobre, cómo mantenerlos y por qué desarrollan una pátina viva que ningún acabado de fábrica puede replicar.",
    },
    pillar: "Craft",
    date: "2026-03-15",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&q=80",
    author: "Roger Williams",
    featured: true,
    editorsPick: true,
    body: {
      en: `## The Living Art of Copper

In the mountain town of Santa Clara del Cobre, Michoacán, copper artisans have been hammering vessels by hand for over five centuries. The tradition predates the Spanish arrival — the Purépecha people were master metalworkers long before European contact. Today, this same lineage produces the copper basins we bring to Counter Cultures.

## How a Copper Basin Is Made

Every basin starts as a flat copper sheet, typically 16-gauge (1.3mm) thick. The artisan heats the metal to roughly 700°C, then hammers it over a wooden form called a *yunque*. Each blow is deliberate — the hammer marks you see on a finished basin are not decorative affectation but evidence of the forming process itself.

A single basin requires between 3,000 and 8,000 hammer strikes, depending on its diameter and depth. After forming, the piece is annealed (reheated and slowly cooled) to relieve internal stress, then hand-finished with increasingly fine hammering to achieve the desired texture.

### The Patina Question

Copper is a reactive metal. Unlike stainless steel or porcelain, it changes over time. Fresh copper is bright salmon-pink; within weeks of use, it develops warm amber tones, then gradually deepens to rich chocolate brown. With continued exposure to water and air, it can develop verdigris — the blue-green oxidation seen on copper roofs and the Statue of Liberty.

This patina is not damage. It's a protective layer that actually slows further oxidation. Many of our clients specifically request pre-patinated finishes because they prefer the lived-in warmth. Others want the bright copper and enjoy watching the transformation unfold.

## Care and Maintenance

Copper basins require less maintenance than most people expect:

**Daily care:** Rinse with water after use. A soft cloth prevents water spots.

**Weekly:** Clean with mild soap and a non-abrasive sponge. Avoid bleach, ammonia, or abrasive cleaners — they strip the patina and can pit the surface.

**To restore brightness:** Apply a paste of lemon juice and salt, let it sit for 30 seconds, then rinse. This removes oxidation and returns the copper to its original pink tone.

**To accelerate patina:** Apply a thin coat of liver of sulfur solution. This is the technique our artisans use for the "antique" finish option.

## Specifications for Architects

When specifying a copper basin for a project, keep these technical details in mind:

- **Weight:** Copper basins are heavier than porcelain equivalents. A 45cm vessel basin weighs approximately 4–5 kg. Ensure the vanity or countertop can support the load.
- **Drain compatibility:** Our basins use standard 1.5" (38mm) drain openings compatible with all major drain assemblies.
- **Lead time:** Artisanal basins are made to order. Standard designs ship in 3–4 weeks; custom sizes or finishes require 6–8 weeks.
- **Warranty:** Every Counter Cultures copper basin carries a 5-year structural warranty against defects in material or craftsmanship.

## Why Copper Matters

In a world of mass-produced uniformity, a hand-hammered copper basin is a declaration of values. It says you care about provenance, about the hands that made the thing, about materials that age honestly rather than degrading. Every basin is unique — no two carry identical hammer patterns, and the patina each develops is shaped by its owner's water chemistry, climate, and use.

That's not a compromise. That's the point.`,
      es: `## El Arte Vivo del Cobre

En el pueblo montañoso de Santa Clara del Cobre, Michoacán, los artesanos del cobre han martillado recipientes a mano durante más de cinco siglos. La tradición es anterior a la llegada española — los purépechas eran maestros metalúrgicos mucho antes del contacto europeo. Hoy, este mismo linaje produce los lavabos de cobre que traemos a Counter Cultures.

## Cómo Se Hace un Lavabo de Cobre

Cada lavabo comienza como una lámina plana de cobre, típicamente calibre 16 (1.3mm) de espesor. El artesano calienta el metal a aproximadamente 700°C, luego lo martilla sobre una forma de madera llamada *yunque*. Cada golpe es deliberado — las marcas de martillo que ves en un lavabo terminado no son una afectación decorativa sino evidencia del proceso de formado mismo.

Un solo lavabo requiere entre 3,000 y 8,000 golpes de martillo, dependiendo de su diámetro y profundidad. Después del formado, la pieza se recoce (se recalienta y enfría lentamente) para aliviar el estrés interno, luego se termina a mano con martillado cada vez más fino para lograr la textura deseada.

### La Cuestión de la Pátina

El cobre es un metal reactivo. A diferencia del acero inoxidable o la porcelana, cambia con el tiempo. El cobre fresco es rosa salmón brillante; en semanas de uso, desarrolla tonos ámbar cálidos, luego se profundiza gradualmente a marrón chocolate rico. Con exposición continua al agua y aire, puede desarrollar verdín — la oxidación azul-verde vista en techos de cobre y la Estatua de la Libertad.

Esta pátina no es daño. Es una capa protectora que realmente desacelera la oxidación posterior. Muchos de nuestros clientes solicitan específicamente acabados pre-patinados porque prefieren la calidez vivida. Otros quieren el cobre brillante y disfrutan ver la transformación desarrollarse.

## Cuidado y Mantenimiento

Los lavabos de cobre requieren menos mantenimiento del que la mayoría espera:

**Cuidado diario:** Enjuagar con agua después del uso. Un paño suave previene manchas de agua.

**Semanal:** Limpiar con jabón suave y una esponja no abrasiva. Evitar cloro, amoníaco o limpiadores abrasivos — eliminan la pátina y pueden picar la superficie.

**Para restaurar el brillo:** Aplicar una pasta de jugo de limón y sal, dejar reposar 30 segundos, luego enjuagar.

**Para acelerar la pátina:** Aplicar una capa delgada de solución de hígado de azufre. Esta es la técnica que nuestros artesanos usan para la opción de acabado "antiguo".

## Especificaciones para Arquitectos

Al especificar un lavabo de cobre para un proyecto, ten en cuenta estos detalles técnicos:

- **Peso:** Los lavabos de cobre son más pesados que los equivalentes de porcelana. Un lavabo tipo vasija de 45cm pesa aproximadamente 4–5 kg.
- **Compatibilidad de drenaje:** Nuestros lavabos usan aberturas de drenaje estándar de 1.5" (38mm) compatibles con todos los ensambles principales.
- **Tiempo de entrega:** Los lavabos artesanales se hacen por pedido. Diseños estándar envían en 3–4 semanas; tamaños o acabados personalizados requieren 6–8 semanas.
- **Garantía:** Cada lavabo de cobre Counter Cultures tiene una garantía estructural de 5 años contra defectos de material o mano de obra.

## Por Qué Importa el Cobre

En un mundo de uniformidad producida en masa, un lavabo de cobre martillado a mano es una declaración de valores. Dice que te importa la procedencia, las manos que hicieron la pieza, los materiales que envejecen honestamente en lugar de degradarse. Cada lavabo es único — ninguno lleva patrones de martillo idénticos, y la pátina que cada uno desarrolla está moldeada por la química del agua, el clima y el uso de su propietario.

Eso no es un compromiso. Ese es el punto.`,
    },
    relatedSlugs: ["talavera-tile-specification", "artisanal-vs-factory-fixtures"],
  },
  {
    slug: "bathroom-design-trends-san-miguel-2026",
    title: {
      en: "Bathroom Design Trends in San Miguel de Allende for 2026",
      es: "Tendencias de Diseño de Baños en San Miguel de Allende para 2026",
    },
    excerpt: {
      en: "What architects and designers are specifying this year: earthy palettes, statement fixtures, and the return of freestanding tubs in Mexico's most design-forward city.",
      es: "Lo que arquitectos y diseñadores están especificando este año: paletas terrosas, accesorios destacados y el regreso de las bañeras exentas en la ciudad más vanguardista de México.",
    },
    pillar: "Design",
    date: "2026-03-08",
    readTime: "6 min",
    image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
    author: "Roger Williams",
    featured: false,
    editorsPick: true,
    body: {
      en: `## The San Miguel Aesthetic in 2026

San Miguel de Allende has always occupied a unique position in Mexican design — a colonial city that attracts an international creative class, where 400-year-old cantera stone walls meet contemporary European fixtures. The design language here is neither purely Mexican nor purely modern. It's a third thing entirely.

In 2026, that synthesis is sharper than ever. Here are the trends we're seeing from the architects, designers, and builders who visit our showroom.

## Trend 1: Earthy, Mineral Palettes

The all-white bathroom is over — at least in San Miguel. Designers are choosing warm mineral tones: terracotta, ochre, raw concrete gray, and sage green. These colors echo the city's natural stone buildings and desert landscape.

What this means for fixtures: matte black and brushed gold finishes are giving way to warmer tones. Brizo's Luxe Gold and California Faucets' Satin Bronze are our most-requested finishes this quarter. For basins, hand-hammered copper and natural stone are outselling white porcelain 3-to-1.

## Trend 2: The Statement Freestanding Tub

Freestanding tubs declined in popularity during the 2018–2022 period as shower-forward bathrooms dominated. In San Miguel, they're back — but differently. The new freestanding tub isn't a centerpiece in a cavernous master bath. It's a sculptural object placed near a window, against a textured wall, or on a stone plinth.

Our Badeloft solid-surface tubs and Kohler's Veil collection are the models architects reach for. The key is clean lines — no ornamental feet, no heavy rims. The tub itself becomes architecture.

## Trend 3: Integrated Indoor-Outdoor Bathrooms

San Miguel's temperate climate (average high: 27°C year-round) makes indoor-outdoor bathrooms genuinely practical. We're seeing more projects with partially open-air showers, garden-view tubs, and bathroom courtyards planted with native species.

Fixture implications: outdoor-rated hardware is essential. Sun Valley Bronze's silicon bronze entry lock sets and California Faucets' marine-grade finishes perform well in these applications because they're designed to withstand exposure.

## Trend 4: Artisan-Factory Pairing

The most sophisticated bathrooms in San Miguel pair a single artisanal statement piece — a hand-hammered copper basin, a Talavera tile accent wall, a carved cantera stone tub surround — with precision-engineered factory fixtures from brands like TOTO, Kohler, or Brizo.

This is the philosophy Counter Cultures was built on. Roger Williams founded the showroom in 2004 specifically because he saw architects struggling to source both categories from the same place. Twenty-two years later, it remains our core offering.

## What's Declining

- Vessel sinks on raised pedestals (the proportion feels dated)
- Chrome finishes (perceived as too cold for San Miguel's warm interiors)
- Frameless glass shower enclosures (being replaced by partial glass with steel frames or curtains)
- Oversized rain showerheads (clients are choosing TOTO's Aero-e models with more focused, water-efficient spray patterns)

## Looking Ahead

The through-line in all these trends is intentionality. San Miguel's design community isn't chasing novelty — they're refining a material and spatial vocabulary that feels connected to place. That's what makes specifying fixtures here different from any other market we serve.`,
      es: `## La Estética de San Miguel en 2026

San Miguel de Allende siempre ha ocupado una posición única en el diseño mexicano — una ciudad colonial que atrae a una clase creativa internacional, donde muros de cantera de 400 años se encuentran con accesorios europeos contemporáneos. El lenguaje de diseño aquí no es puramente mexicano ni puramente moderno. Es una tercera cosa completamente diferente.

En 2026, esa síntesis es más nítida que nunca. Aquí están las tendencias que vemos de los arquitectos, diseñadores y constructores que visitan nuestro showroom.

## Tendencia 1: Paletas Terrosas y Minerales

El baño completamente blanco se acabó — al menos en San Miguel. Los diseñadores están eligiendo tonos minerales cálidos: terracota, ocre, gris concreto natural y verde salvia. Estos colores hacen eco de los edificios de piedra natural de la ciudad y el paisaje desértico.

Lo que esto significa para accesorios: los acabados negro mate y oro cepillado están dando paso a tonos más cálidos. Luxe Gold de Brizo y Satin Bronze de California Faucets son nuestros acabados más solicitados este trimestre. Para lavabos, el cobre martillado a mano y la piedra natural están superando a la porcelana blanca 3 a 1.

## Tendencia 2: La Bañera Exenta como Declaración

Las bañeras exentas declinaron en popularidad durante el período 2018–2022 mientras los baños enfocados en ducha dominaban. En San Miguel, están de vuelta — pero de manera diferente. La nueva bañera exenta no es una pieza central en un baño principal cavernoso. Es un objeto escultórico colocado cerca de una ventana, contra una pared texturizada, o sobre un plinto de piedra.

Nuestras bañeras Badeloft de superficie sólida y la colección Veil de Kohler son los modelos que los arquitectos buscan.

## Tendencia 3: Baños Integrados Interior-Exterior

El clima templado de San Miguel (promedio máximo: 27°C todo el año) hace que los baños interior-exterior sean genuinamente prácticos. Estamos viendo más proyectos con duchas parcialmente al aire libre, bañeras con vista al jardín y patios de baño plantados con especies nativas.

Implicaciones para accesorios: el hardware clasificado para exteriores es esencial. Los herrajes de bronce silicón de Sun Valley Bronze y los acabados de grado marino de California Faucets funcionan bien en estas aplicaciones.

## Tendencia 4: Combinación Artesanal-Industrial

Los baños más sofisticados en San Miguel combinan una sola pieza artesanal destacada — un lavabo de cobre martillado a mano, un muro de acento de azulejo Talavera, un rodapié de bañera de cantera tallada — con accesorios de fábrica de precisión de marcas como TOTO, Kohler o Brizo.

Esta es la filosofía sobre la cual se construyó Counter Cultures. Roger Williams fundó el showroom en 2004 específicamente porque vio a los arquitectos luchando por obtener ambas categorías del mismo lugar. Veintidós años después, sigue siendo nuestra oferta principal.

## Lo Que Está en Declive

- Lavabos tipo vasija en pedestales elevados (la proporción se siente anticuada)
- Acabados cromados (percibidos como demasiado fríos para los interiores cálidos de San Miguel)
- Mamparas de ducha de vidrio sin marco (reemplazadas por vidrio parcial con marcos de acero o cortinas)
- Regaderas de lluvia sobredimensionadas (los clientes están eligiendo los modelos Aero-e de TOTO con patrones de rociado más enfocados y eficientes)

## Mirando Hacia Adelante

El hilo conductor en todas estas tendencias es la intencionalidad. La comunidad de diseño de San Miguel no persigue la novedad — están refinando un vocabulario material y espacial que se siente conectado al lugar.`,
    },
    relatedSlugs: ["hand-hammered-copper-basin-guide", "kohler-vs-toto-comparison"],
  },
  {
    slug: "blanco-silgranit-vs-stainless",
    title: {
      en: "BLANCO Silgranit vs. Stainless Steel: Which Kitchen Sink Is Right for You?",
      es: "BLANCO Silgranit vs. Acero Inoxidable: ¿Qué Fregadero de Cocina Es el Indicado?",
    },
    excerpt: {
      en: "A side-by-side comparison of two kitchen sink materials — durability, maintenance, aesthetics, and real-world performance in Mexican kitchens.",
      es: "Una comparación lado a lado de dos materiales de fregadero de cocina — durabilidad, mantenimiento, estética y rendimiento real en cocinas mexicanas.",
    },
    pillar: "Product",
    date: "2026-02-28",
    readTime: "7 min",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    author: "Counter Cultures",
    editorsPick: false,
    body: {
      en: `## Two Materials, Two Philosophies

Choosing a kitchen sink material isn't just about aesthetics — it's about how you cook, how you clean, and what you want your kitchen to communicate. Stainless steel says "professional kitchen." BLANCO Silgranit says "designed living space." Neither answer is wrong, but they suit different clients.

## What Is Silgranit?

Silgranit is BLANCO's proprietary composite material: 80% natural granite and 20% acrylic resin, molded under extreme heat and pressure. The result is a non-porous surface that resists scratches, stains, heat (up to 280°C), and household acids better than natural stone, porcelain, or standard composites.

Unlike surface-coated sinks, Silgranit's color runs through the full thickness of the material. A scratch doesn't reveal a different layer underneath — it reveals more of the same material.

## Durability Comparison

**Scratch resistance:** Silgranit wins. Its granite composite shrugs off daily knife contact and pot scrubbing. Stainless steel scratches easily, though many homeowners consider the patina of fine scratches part of its character.

**Stain resistance:** Silgranit wins decisively. Coffee, wine, beet juice, and turmeric — all common kitchen stains — wipe off Silgranit's non-porous surface. Stainless steel doesn't stain per se, but develops water spots and mineral deposits in San Miguel's hard-water conditions.

**Heat resistance:** Both perform well. Silgranit is rated to 280°C (you can place a hot pan directly in the sink). Stainless steel handles heat without issue.

**Impact resistance:** Stainless steel wins. Drop a heavy cast-iron skillet in a Silgranit sink and you risk chipping the edge. The same impact on stainless steel might dent it, but won't fracture the material.

## Maintenance in Mexican Kitchens

San Miguel de Allende's water is notoriously hard — high calcium and mineral content. This is the single most important factor for local homeowners choosing between these materials.

**Stainless steel + hard water:** Constant water spot battle. Spots show immediately, especially on brushed finishes. Requires daily drying or periodic treatment with Bar Keeper's Friend.

**Silgranit + hard water:** Significantly less visible spotting. BLANCO's patented Hygiene+Plus antibacterial surface also inhibits bacterial growth — a meaningful advantage in Mexico's warmer climate.

## Aesthetic Considerations

Silgranit comes in 10 colors, from classic White and Anthracite to warmer tones like Truffle and Café. This range makes it easier to integrate with stone countertops and the earthy palettes popular in San Miguel interiors.

Stainless steel is universally compatible but reads as utilitarian. In residential kitchens with warm wood, stone, and copper accents, stainless can feel like the one element that wasn't chosen — it was defaulted to.

## Our Recommendation

For most residential kitchens in San Miguel de Allende, we recommend Silgranit. The hard-water performance alone justifies the choice, and the material's warmth integrates better with the regional design aesthetic.

For professional or semi-professional kitchens, outdoor kitchens, or clients who prioritize impact resistance and repairability, stainless steel remains the right call.

Both are available to view in our showroom. We keep the BLANCO Ikon 33" apron-front in Anthracite and the Kohler Strive undermount stainless on permanent display.`,
      es: `## Dos Materiales, Dos Filosofías

Elegir un material de fregadero de cocina no se trata solo de estética — se trata de cómo cocinas, cómo limpias y qué quieres que comunique tu cocina. El acero inoxidable dice "cocina profesional." BLANCO Silgranit dice "espacio de vida diseñado." Ninguna respuesta es incorrecta, pero se adaptan a diferentes clientes.

## ¿Qué Es Silgranit?

Silgranit es el material compuesto propietario de BLANCO: 80% granito natural y 20% resina acrílica, moldeado bajo calor y presión extremos. El resultado es una superficie no porosa que resiste rayones, manchas, calor (hasta 280°C) y ácidos domésticos mejor que la piedra natural, la porcelana o los compuestos estándar.

A diferencia de los fregaderos con recubrimiento superficial, el color de Silgranit atraviesa todo el espesor del material.

## Comparación de Durabilidad

**Resistencia a rayones:** Silgranit gana. Su compuesto de granito resiste el contacto diario con cuchillos y el friegue de ollas.

**Resistencia a manchas:** Silgranit gana decisivamente. Café, vino, jugo de betabel y cúrcuma — todas manchas comunes de cocina — se limpian de la superficie no porosa de Silgranit.

**Resistencia al calor:** Ambos funcionan bien. Silgranit está clasificado hasta 280°C.

**Resistencia al impacto:** El acero inoxidable gana. Dejar caer un sartén pesado de hierro fundido en un fregadero Silgranit puede astillar el borde.

## Mantenimiento en Cocinas Mexicanas

El agua de San Miguel de Allende es notoriamente dura — alto contenido de calcio y minerales. Este es el factor más importante para los propietarios locales al elegir entre estos materiales.

**Acero inoxidable + agua dura:** Batalla constante con manchas de agua. Las manchas se muestran inmediatamente, especialmente en acabados cepillados.

**Silgranit + agua dura:** Manchas significativamente menos visibles. La superficie antibacteriana Hygiene+Plus patentada de BLANCO también inhibe el crecimiento bacteriano — una ventaja significativa en el clima más cálido de México.

## Consideraciones Estéticas

Silgranit viene en 10 colores, desde el clásico Blanco y Antracita hasta tonos más cálidos como Truffle y Café. Esta gama facilita la integración con encimeras de piedra y las paletas terrosas populares en los interiores de San Miguel.

## Nuestra Recomendación

Para la mayoría de las cocinas residenciales en San Miguel de Allende, recomendamos Silgranit. El rendimiento con agua dura por sí solo justifica la elección, y la calidez del material se integra mejor con la estética de diseño regional.

Para cocinas profesionales o semi-profesionales, cocinas al aire libre, o clientes que priorizan la resistencia al impacto y la reparabilidad, el acero inoxidable sigue siendo la elección correcta.

Ambos están disponibles para ver en nuestro showroom.`,
    },
    relatedSlugs: ["kitchen-faucet-finish-guide", "hand-hammered-copper-basin-guide"],
  },
  {
    slug: "specifying-fixtures-hospitality-mexico",
    title: {
      en: "Specifying Fixtures for Hospitality Projects in Mexico",
      es: "Especificación de Accesorios para Proyectos de Hospitalidad en México",
    },
    excerpt: {
      en: "What architects need to know about lead times, warranty coverage, water efficiency standards, and import logistics when specifying for hotels and restaurants in Mexico.",
      es: "Lo que los arquitectos necesitan saber sobre tiempos de entrega, cobertura de garantía, estándares de eficiencia de agua y logística de importación al especificar para hoteles y restaurantes en México.",
    },
    pillar: "Trade",
    date: "2026-02-20",
    readTime: "10 min",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    author: "Roger Williams",
    editorsPick: true,
    body: {
      en: `## The Hospitality Specification Challenge

Specifying fixtures for a residential project in San Miguel is straightforward — you're working with one client, one vision, and typically one bathroom at a time. Hospitality is a different discipline entirely. A boutique hotel might need 20 identical guest bathrooms, a lobby restroom, a pool-area shower, a restaurant kitchen, and a bar prep station — each with different performance requirements, all on a coordinated timeline.

At Counter Cultures, hospitality projects represent roughly 35% of our Trade Program business. Here's what we've learned about making specifications work in the Mexican market.

## Lead Times: The Critical Path

For international brands (Kohler, TOTO, Brizo, BLANCO), most products ship from U.S. or Japanese warehouses. Standard lead times to San Miguel de Allende:

- **In-stock standard finishes:** 4–6 weeks (shipping + customs)
- **Special-order finishes:** 8–12 weeks
- **Custom or discontinued items:** 12–16 weeks, subject to manufacturer confirmation
- **Artisanal pieces (Mistoa, copper basins):** 3–8 weeks depending on complexity

**Critical insight:** Mexican customs clearance adds 1–3 weeks of unpredictability. We recommend building a 2-week buffer into every hospitality timeline. Our Trade Program handles all import logistics, duties, and customs brokerage — architects don't need to manage this directly.

## Water Efficiency Standards

Mexico's NOM-009-CNA standard governs water-efficient fixtures. Key thresholds:

- **Toilets:** Maximum 6.0 liters per flush (Lpf). TOTO's Tornado Flush achieves 4.8 Lpf — the most efficient we carry.
- **Faucets:** Maximum 8.3 liters per minute (Lpm) at 4.1 bar pressure. All Brizo and Kohler lavatory faucets meet this standard.
- **Showerheads:** Maximum 9.5 Lpm. TOTO's Aero-e technology delivers a full-coverage spray at 7.6 Lpm.

For LEED-certified hospitality projects, WaterSense-labeled fixtures earn additional credits. All TOTO and most Kohler fixtures carry WaterSense certification.

## Warranty in Commercial Applications

This is where architects get caught. Most manufacturer warranties have a residential/commercial split:

- **Kohler:** Lifetime residential, 1-year commercial on most products. Exception: commercial-grade lines (Tripoint, Bardon) carry 3-year commercial warranties.
- **TOTO:** 1-year commercial standard, 5-year on Cefiontect-glazed surfaces. The C100/C200 Washlet units carry a 3-year limited warranty regardless of application.
- **Brizo:** Lifetime residential (finish and function), limited lifetime commercial (function only, 5-year finish).
- **Sun Valley Bronze:** 10-year warranty regardless of application — the strongest commercial warranty in our portfolio.

**Our recommendation:** For high-traffic hospitality fixtures, specify TOTO for toilets (Cefiontect's self-glazing surface reduces maintenance dramatically) and Sun Valley Bronze for door hardware (the silicon bronze alloy is virtually indestructible in commercial use).

## Quantity Pricing

Counter Cultures Trade Program pricing for hospitality quantities:

- **10–24 units of same SKU:** 8% below retail
- **25–49 units:** 12% below retail
- **50+ units:** Project-specific pricing (contact us directly)

These discounts apply to all brands except artisanal pieces, which are priced individually based on scope.

## The Specification Package

For every hospitality project, we provide a specification package that includes:

1. **Product cut sheets** with dimensions, finish samples, and installation requirements
2. **Rough-in specifications** for plumbing contractors
3. **Maintenance guides** for hotel engineering teams (bilingual EN/ES)
4. **Warranty documentation** with commercial terms clearly outlined
5. **Timeline projections** with customs buffer built in

Our Trade Program coordinator handles this end-to-end. The architect's job is to select; our job is to deliver and document.`,
      es: `## El Desafío de la Especificación en Hospitalidad

Especificar accesorios para un proyecto residencial en San Miguel es sencillo — trabajas con un cliente, una visión, y típicamente un baño a la vez. La hospitalidad es una disciplina completamente diferente. Un hotel boutique podría necesitar 20 baños de huéspedes idénticos, un baño de lobby, una ducha de área de piscina, una cocina de restaurante y una estación de preparación de bar — cada uno con diferentes requisitos de rendimiento, todos en un cronograma coordinado.

En Counter Cultures, los proyectos de hospitalidad representan aproximadamente el 35% de nuestro negocio del Programa Trade.

## Tiempos de Entrega: La Ruta Crítica

Para marcas internacionales (Kohler, TOTO, Brizo, BLANCO), la mayoría de los productos envían desde almacenes en EE.UU. o Japón. Tiempos de entrega estándar a San Miguel de Allende:

- **Acabados estándar en existencia:** 4–6 semanas (envío + aduana)
- **Acabados por pedido especial:** 8–12 semanas
- **Artículos personalizados o descontinuados:** 12–16 semanas
- **Piezas artesanales (Mistoa, lavabos de cobre):** 3–8 semanas

**Perspectiva crítica:** El despacho de aduanas mexicanas agrega 1–3 semanas de imprevisibilidad. Recomendamos construir un margen de 2 semanas en cada cronograma de hospitalidad.

## Estándares de Eficiencia de Agua

La norma NOM-009-CNA de México gobierna los accesorios eficientes en agua:

- **Sanitarios:** Máximo 6.0 litros por descarga (Lpd). El Tornado Flush de TOTO logra 4.8 Lpd.
- **Grifos:** Máximo 8.3 litros por minuto (Lpm) a 4.1 bar de presión.
- **Regaderas:** Máximo 9.5 Lpm. La tecnología Aero-e de TOTO entrega un rociado de cobertura completa a 7.6 Lpm.

## Garantía en Aplicaciones Comerciales

Aquí es donde los arquitectos se confunden. La mayoría de las garantías de fabricantes tienen una división residencial/comercial:

- **Kohler:** De por vida residencial, 1 año comercial en la mayoría de productos.
- **TOTO:** 1 año comercial estándar, 5 años en superficies con glaseado Cefiontect.
- **Brizo:** De por vida residencial, comercial limitada de por vida (5 años en acabado).
- **Sun Valley Bronze:** Garantía de 10 años sin importar la aplicación — la garantía comercial más fuerte en nuestro portafolio.

## Precios por Cantidad

Precios del Programa Trade de Counter Cultures para cantidades de hospitalidad:

- **10–24 unidades del mismo SKU:** 8% debajo de retail
- **25–49 unidades:** 12% debajo de retail
- **50+ unidades:** Precios específicos por proyecto

## El Paquete de Especificación

Para cada proyecto de hospitalidad, proporcionamos un paquete de especificación que incluye fichas técnicas, especificaciones de instalación en bruto, guías de mantenimiento bilingües, documentación de garantía y proyecciones de cronograma.`,
    },
    relatedSlugs: ["trade-program-benefits", "kohler-vs-toto-comparison"],
  },
  {
    slug: "sun-valley-bronze-foundry",
    title: {
      en: "Inside Sun Valley Bronze: How America's Finest Hardware Is Made",
      es: "Dentro de Sun Valley Bronze: Cómo Se Fabrica la Mejor Herrería de América",
    },
    excerpt: {
      en: "A look inside the Idaho foundry where every entry lock set is individually sand-cast in silicon bronze and finished by hand — and why it matters for Mexican architecture.",
      es: "Un vistazo dentro de la fundición en Idaho donde cada juego de cerradura de entrada se funde individualmente en arena de bronce de silicón y se termina a mano.",
    },
    pillar: "Craft",
    date: "2026-02-12",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80",
    author: "Roger Williams",
    body: {
      en: `## Silicon Bronze: The Material

Most door hardware is made from brass — a zinc-copper alloy that's easy to machine and cheap to produce. Sun Valley Bronze uses silicon bronze instead: a copper alloy with 3–4% silicon and small amounts of manganese. The difference is profound.

Silicon bronze is the same alloy used in marine propellers, industrial pumps, and fine art sculpture. It's naturally corrosion-resistant — it won't tarnish, pit, or develop the green patina that brass hardware shows after a few years of outdoor exposure. In San Miguel's climate, where many homes have open-air courtyards and exposed exterior doors, this corrosion resistance isn't a luxury. It's a requirement.

## The Sand-Casting Process

Every Sun Valley Bronze piece begins as a handmade wax model. An artisan carves the original pattern — a lever handle, a rosette, a deadbolt housing — from blocks of jeweler's wax, refining every curve and edge by hand. This original becomes the master pattern.

From the master, the foundry creates a rubber mold. Molten wax is injected into the mold to produce identical wax copies of the original. Each wax copy is then coated in ceramic slurry and fine silica sand, building up a shell layer by layer. When the ceramic shell is dry, it's heated to melt and drain the wax — leaving a hollow ceramic negative of the original piece.

Molten silicon bronze at 1,100°C is poured into the ceramic shell. After cooling, the shell is broken away to reveal the raw bronze casting. Each piece is then hand-finished: ground, sanded, and polished to the customer's specified finish.

## Finishes That Age Honestly

Sun Valley Bronze offers over 20 standard finishes, from bright polished bronze to dark antiqued patinas. What makes them different from plated finishes (like PVD-coated brass) is that the color is the material itself. You can't chip, flake, or wear through a Sun Valley Bronze finish because there's no coating to wear through.

Over decades, the bronze develops a subtle warm patina that deepens the original finish rather than degrading it. A Sun Valley Bronze lever handle looks better at 20 years than it did at one.

## Why Sun Valley Bronze in Mexico

We carry Sun Valley Bronze because it solves a specific problem in Mexican architecture: exterior hardware that survives the climate. San Miguel's elevation (1,900m) means intense UV exposure. The surrounding Bajío region brings summer rain and mineral-heavy water. Interior Mexico's temperature swings — from 5°C winter mornings to 32°C summer afternoons — stress plated finishes until they crack.

Silicon bronze doesn't care. It's the same material inside and out, and every surface exposure just adds character. For architects specifying door hardware on hacienda-style homes, boutique hotels, and courtyard residences, it's the only material we recommend for exterior applications.

## Pricing and Lead Times

Sun Valley Bronze is a premium product. A full entry lock set (lever, deadbolt, rosettes) starts around MXN 76,000 — roughly 3–4x the price of equivalent Emtek hardware. The value proposition is longevity: these pieces will outlast the building they're installed in.

Standard lead time is 8–10 weeks from order. Custom finishes or non-standard configurations add 2–4 weeks. Counter Cultures Trade Program members receive priority allocation.`,
      es: `## Bronce de Silicón: El Material

La mayoría del herraje para puertas está hecho de latón — una aleación de zinc-cobre que es fácil de maquinar y barata de producir. Sun Valley Bronze usa bronce de silicón en su lugar: una aleación de cobre con 3–4% de silicón y pequeñas cantidades de manganeso. La diferencia es profunda.

El bronce de silicón es la misma aleación usada en hélices marinas, bombas industriales y escultura de arte fino. Es naturalmente resistente a la corrosión — no se empaña, no se pica, ni desarrolla la pátina verde que el herraje de latón muestra después de unos años de exposición exterior. En el clima de San Miguel, donde muchas casas tienen patios abiertos y puertas exteriores expuestas, esta resistencia a la corrosión no es un lujo. Es un requisito.

## El Proceso de Fundición en Arena

Cada pieza de Sun Valley Bronze comienza como un modelo de cera hecho a mano. Un artesano talla el patrón original — una manija de palanca, una roseta, una carcasa de cerrojo — de bloques de cera de joyero, refinando cada curva y borde a mano.

Desde el maestro, la fundición crea un molde de caucho. La cera derretida se inyecta en el molde para producir copias de cera idénticas. Cada copia se recubre en lechada cerámica y arena de sílice fina, construyendo una capa de cáscara. Cuando la cáscara cerámica está seca, se calienta para derretir y drenar la cera — dejando un negativo cerámico hueco de la pieza original.

Bronce de silicón fundido a 1,100°C se vierte en la cáscara cerámica. Después del enfriamiento, la cáscara se rompe para revelar la fundición en bruto de bronce. Cada pieza se termina a mano: se esmerila, se lija y se pule al acabado especificado por el cliente.

## Acabados Que Envejecen Honestamente

Sun Valley Bronze ofrece más de 20 acabados estándar. Lo que los hace diferentes de los acabados chapados es que el color es el material mismo. No puedes astillar, descamar o desgastar un acabado de Sun Valley Bronze porque no hay recubrimiento que desgastar.

## Por Qué Sun Valley Bronze en México

Llevamos Sun Valley Bronze porque resuelve un problema específico en la arquitectura mexicana: herraje exterior que sobrevive al clima. La elevación de San Miguel (1,900m) significa exposición UV intensa. La región del Bajío circundante trae lluvia de verano y agua rica en minerales. Los cambios de temperatura del interior de México estresan los acabados chapados hasta que se agrietan.

Al bronce de silicón no le importa. Es el mismo material por dentro y por fuera, y cada exposición de superficie solo agrega carácter.

## Precios y Tiempos de Entrega

Sun Valley Bronze es un producto premium. Un juego completo de cerradura de entrada comienza alrededor de MXN 76,000 — aproximadamente 3–4x el precio del herraje Emtek equivalente. La propuesta de valor es longevidad: estas piezas sobrevivirán al edificio en el que están instaladas.

Tiempo de entrega estándar es 8–10 semanas desde el pedido.`,
    },
    relatedSlugs: ["hand-hammered-copper-basin-guide", "specifying-fixtures-hospitality-mexico"],
  },
  {
    slug: "trade-program-benefits",
    title: {
      en: "5 Ways the Counter Cultures Trade Program Saves Architects Time",
      es: "5 Formas en Que el Programa Trade de Counter Cultures Ahorra Tiempo a los Arquitectos",
    },
    excerpt: {
      en: "From dedicated pricing to specification support — how architects and designers streamline procurement through our trade program and why 60+ firms in central Mexico rely on it.",
      es: "Desde precios dedicados hasta soporte de especificación — cómo arquitectos y diseñadores agilizan la procuración a través de nuestro programa trade.",
    },
    pillar: "Trade",
    date: "2026-02-05",
    readTime: "4 min",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    author: "Counter Cultures",
    body: {
      en: `## Why a Trade Program Exists

Architects and interior designers don't shop the way homeowners do. You're specifying for clients, managing budgets, coordinating with contractors, and working across multiple projects simultaneously. Retail pricing, standard lead times, and consumer-level support don't serve this workflow.

Counter Cultures' Trade Program was designed specifically for design professionals working in central Mexico. Over 60 architecture firms, interior designers, and builders are currently enrolled. Here's what it includes — and why it matters.

## 1. Trade Pricing

Trade members receive 15–25% below retail pricing across all brands. The exact discount varies by manufacturer and product line:

- **Kohler, TOTO, Brizo:** 15% below retail
- **BLANCO, California Faucets:** 20% below retail
- **Sun Valley Bronze, Emtek:** 20% below retail
- **Badeloft, Villeroy & Boch:** 25% below retail
- **Artisanal collection:** 10% below retail

For hospitality projects with quantity orders, additional volume pricing applies.

Pricing is confidential — trade quotes are issued directly to the designer, not to the end client. This protects your margin and your client relationship.

## 2. Specification Support

Choosing between 3,000+ SKUs across 12 brands is time-consuming. Our specification team helps narrow the selection based on:

- **Project requirements** (commercial vs. residential, indoor vs. outdoor, water efficiency targets)
- **Budget parameters** (we'll identify the best product at each price point)
- **Finish coordination** (ensuring faucets, hardware, and accessories work together)
- **Installation constraints** (rough-in dimensions, wall thickness, clearances)

We provide complete specification packages: cut sheets, CAD files, rough-in drawings, and finish samples. For presentation to clients, we supply high-resolution product photography and curated mood boards.

## 3. Consolidated Import Logistics

This is the benefit most unique to the Mexican market. Importing fixtures from U.S. and international manufacturers involves customs brokerage, duty calculations, freight coordination, and regulatory compliance.

Counter Cultures handles all of this. When you order through the Trade Program, we manage:

- Import duties and taxes (calculated at time of quote, no surprises)
- Customs clearance at the border
- Freight from warehouse to our San Miguel facility
- Final delivery to your project site or client's home

You get a single delivered price. No separate freight invoices, no customs paperwork, no duty calculations.

## 4. Priority Fulfillment

Trade orders are processed ahead of retail orders. In practical terms:

- **Stock check confirmation** within 4 business hours (vs. 24 hours for retail)
- **Order processing** same day if placed before 12:00 PM CST
- **Dedicated inventory reserve** for active trade projects (we'll hold stock for up to 30 days against a confirmed order)
- **Direct manufacturer escalation** when items are on backorder

For urgent hospitality timelines, we've been known to drive to Querétaro or León to intercept a shipment and deliver same-week. That's not a published policy — it's what happens when your business matters to us.

## 5. After-Sale Support

Products arrive damaged. Clients change their minds after installation. A faucet cartridge fails three years in. These things happen, and they shouldn't become the architect's problem.

Trade Program after-sale support includes:

- **Warranty claims** handled by us (we manage the manufacturer relationship)
- **Replacement parts** sourced and shipped without requiring the architect's involvement
- **Returns and exchanges** processed within 5 business days for unopened items
- **Technical installation support** via phone/WhatsApp for contractors on site

## How to Join

The Trade Program is open to licensed architects, interior designers, builders, and hospitality operators in Mexico. Application takes 2 minutes — visit our Trade page or call the showroom directly. Approval is typically same-day.`,
      es: `## Por Qué Existe un Programa Trade

Los arquitectos y diseñadores de interiores no compran como los propietarios. Estás especificando para clientes, gestionando presupuestos, coordinando con contratistas y trabajando en múltiples proyectos simultáneamente.

El Programa Trade de Counter Cultures fue diseñado específicamente para profesionales de diseño que trabajan en el centro de México. Más de 60 firmas de arquitectura, diseñadores de interiores y constructores están inscritos actualmente.

## 1. Precios Trade

Los miembros Trade reciben 15–25% por debajo del precio de retail en todas las marcas:

- **Kohler, TOTO, Brizo:** 15% debajo de retail
- **BLANCO, California Faucets:** 20% debajo de retail
- **Sun Valley Bronze, Emtek:** 20% debajo de retail
- **Badeloft, Villeroy & Boch:** 25% debajo de retail
- **Colección artesanal:** 10% debajo de retail

Los precios son confidenciales — las cotizaciones trade se emiten directamente al diseñador, no al cliente final.

## 2. Soporte de Especificación

Nuestro equipo de especificación ayuda a reducir la selección entre 3,000+ SKUs de 12 marcas basándose en requisitos del proyecto, parámetros de presupuesto, coordinación de acabados y restricciones de instalación.

Proporcionamos paquetes de especificación completos: fichas técnicas, archivos CAD, dibujos de instalación en bruto y muestras de acabado.

## 3. Logística de Importación Consolidada

Este es el beneficio más único del mercado mexicano. Counter Cultures maneja corretaje aduanal, cálculos de aranceles, coordinación de flete y cumplimiento regulatorio.

Recibes un precio único entregado. Sin facturas de flete separadas, sin papeleo aduanal.

## 4. Cumplimiento Prioritario

Los pedidos Trade se procesan antes que los pedidos de retail:

- **Confirmación de existencias** en 4 horas hábiles
- **Procesamiento de pedidos** el mismo día si se coloca antes de las 12:00 PM CST
- **Reserva de inventario dedicada** para proyectos trade activos
- **Escalación directa al fabricante** cuando los artículos están en orden pendiente

## 5. Soporte Post-Venta

El soporte post-venta del Programa Trade incluye reclamaciones de garantía manejadas por nosotros, piezas de reemplazo enviadas sin requerir la participación del arquitecto, devoluciones procesadas en 5 días hábiles y soporte técnico de instalación por teléfono/WhatsApp.

## Cómo Inscribirse

El Programa Trade está abierto a arquitectos licenciados, diseñadores de interiores, constructores y operadores de hospitalidad en México. La solicitud toma 2 minutos — visita nuestra página Trade o llama al showroom directamente.`,
    },
    relatedSlugs: ["specifying-fixtures-hospitality-mexico", "kohler-vs-toto-comparison"],
  },
  {
    slug: "kohler-vs-toto-comparison",
    title: {
      en: "Kohler vs. TOTO: An Honest Comparison for the Mexican Market",
      es: "Kohler vs. TOTO: Una Comparación Honesta para el Mercado Mexicano",
    },
    excerpt: {
      en: "We sell both. We install both. Here's an unbiased comparison of two premium fixture brands — technology, design philosophy, warranty, and which works better in Mexican conditions.",
      es: "Vendemos ambos. Instalamos ambos. Aquí una comparación imparcial de dos marcas premium de accesorios — tecnología, filosofía de diseño, garantía y cuál funciona mejor en condiciones mexicanas.",
    },
    pillar: "Product",
    date: "2026-01-28",
    readTime: "9 min",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
    author: "Roger Williams",
    body: {
      en: `## Why This Comparison Matters

Kohler and TOTO are the two most specified premium fixture brands in our showroom. Both are excellent. Both have loyal followings among architects. And both have specific strengths that make them better suited to certain applications.

We're an authorized dealer for both brands, so we have no incentive to steer you one way. This comparison reflects 22 years of selling, installing, and servicing these products in central Mexico.

## Design Philosophy

**Kohler** designs like an American luxury brand. Their aesthetic is broad — from traditional (Artifacts, Memoirs) to contemporary (Composed, Components) to minimalist (Veil). Kohler's strength is range: whatever the client's taste, there's a Kohler product that fits.

**TOTO** designs like a Japanese engineering company. Their aesthetic is narrower but more refined. Every TOTO product prioritizes hygiene, water efficiency, and material quality over decorative variety. The design language is clean, geometric, and functional. If Kohler is a department store, TOTO is a specialty boutique.

## Toilet Technology

This is where the gap is widest — and it favors TOTO.

**TOTO's advantages:**
- **Tornado Flush:** A three-jet flushing system that creates a centrifugal washing action around the bowl. Uses only 4.8 liters per flush while cleaning more effectively than conventional 6.0L gravity systems.
- **Cefiontect:** A ceramic glaze fired into the porcelain surface that's extraordinarily smooth at the microscopic level. Waste and bacteria literally can't adhere. This surface stays cleaner longer than any competing product we carry.
- **Washlet integration:** TOTO's bidet seat technology is engineered as part of the toilet — not an aftermarket addition. The C100, C200, and S7A Washlet seats offer heated water, adjustable spray, warm air drying, and UV-light self-sterilization.

**Kohler's advantages:**
- **Design variety:** Kohler offers 40+ toilet models across traditional, transitional, and contemporary styles. TOTO offers fewer than 20.
- **Comfort Height:** Kohler's standard "comfort height" (17.5") is 1" taller than standard, making it more accessible for older users and those with mobility issues.
- **Price range:** Kohler's entry-level products start lower than TOTO's, making them accessible for budget-conscious projects.

**Our take:** For toilets specifically, we recommend TOTO. The Cefiontect surface reduces cleaning frequency dramatically — a meaningful advantage in Mexico's warmer climate where bathroom hygiene demands are higher.

## Faucets and Fixtures

Here the comparison evens out significantly.

**Kohler faucets** use ceramic disc valves across their premium lines. The Composed and Purist collections are our best sellers — clean lines, excellent ergonomics, and a wide finish palette including Vibrant Brushed Moderne Brass (our most-requested Kohler finish in San Miguel).

**TOTO faucets** are less commonly specified in Mexico, partly because their distribution has historically focused on toilets and Washlets. Their GS and TLS series are well-engineered but limited in finish options compared to Kohler.

For faucets, we more often recommend **Brizo** as the premium option and **California Faucets** for custom finish work, rather than choosing between Kohler and TOTO.

## Warranty and Service in Mexico

**Kohler:** Lifetime limited warranty on most residential faucets and fixtures. Parts are available through Counter Cultures — we maintain a common replacement parts inventory for the 20 most-installed Kohler SKUs.

**TOTO:** 1-year standard warranty on most products, with extended coverage on Cefiontect surfaces (5 years). Washlet electronic components carry a 3-year warranty. Parts availability in Mexico is more limited — we stock Washlet seats and flush valves but special orders for less common parts take 4–6 weeks.

**Practical note:** Both brands honor warranties through authorized dealers in Mexico. You don't need to ship products back to the U.S. — we handle warranty claims locally.

## The Bottom Line

| Category | Advantage |
|---|---|
| Toilets | TOTO |
| Faucets | Even (consider Brizo/California Faucets) |
| Bathtubs | Kohler |
| Design range | Kohler |
| Water efficiency | TOTO |
| Warranty coverage | Kohler |
| Parts availability in Mexico | Kohler |

For most projects in San Miguel de Allende, we recommend a mixed specification: TOTO toilets, Kohler or Brizo faucets, and brand-specific selections for bathtubs and accessories based on the project's aesthetic direction. This isn't a compromise — it's how you get the best product in every category.`,
      es: `## Por Qué Importa Esta Comparación

Kohler y TOTO son las dos marcas de accesorios premium más especificadas en nuestro showroom. Ambas son excelentes. Ambas tienen seguidores leales entre los arquitectos. Y ambas tienen fortalezas específicas que las hacen más adecuadas para ciertas aplicaciones.

Somos distribuidor autorizado de ambas marcas, así que no tenemos incentivo para dirigirte en una dirección. Esta comparación refleja 22 años de vender, instalar y dar servicio a estos productos en el centro de México.

## Filosofía de Diseño

**Kohler** diseña como una marca de lujo americana. Su estética es amplia. La fortaleza de Kohler es el rango: cualquiera que sea el gusto del cliente, hay un producto Kohler que encaja.

**TOTO** diseña como una empresa de ingeniería japonesa. Su estética es más estrecha pero más refinada. Cada producto TOTO prioriza la higiene, la eficiencia de agua y la calidad de materiales sobre la variedad decorativa.

## Tecnología de Sanitarios

Aquí es donde la brecha es más amplia — y favorece a TOTO.

**Ventajas de TOTO:**
- **Tornado Flush:** Un sistema de descarga de tres chorros que crea una acción de lavado centrífuga. Usa solo 4.8 litros por descarga.
- **Cefiontect:** Un glaseado cerámico extraordinariamente liso a nivel microscópico. Los desechos y bacterias literalmente no pueden adherirse.
- **Integración Washlet:** La tecnología de asiento bidet de TOTO está diseñada como parte del sanitario.

**Ventajas de Kohler:**
- **Variedad de diseño:** Kohler ofrece 40+ modelos de sanitarios.
- **Comfort Height:** La altura "comfort height" estándar de Kohler es más accesible.
- **Rango de precios:** Los productos de nivel de entrada de Kohler comienzan más bajos.

**Nuestra opinión:** Para sanitarios específicamente, recomendamos TOTO. La superficie Cefiontect reduce la frecuencia de limpieza dramáticamente.

## Grifos y Accesorios

Aquí la comparación se nivela significativamente. Los grifos de Kohler usan válvulas de disco cerámico en sus líneas premium. Las colecciones Composed y Purist son nuestros más vendidos.

Para grifos, más a menudo recomendamos **Brizo** como la opción premium y **California Faucets** para trabajo de acabado personalizado.

## Garantía y Servicio en México

**Kohler:** Garantía limitada de por vida en la mayoría de grifos y accesorios residenciales.

**TOTO:** Garantía estándar de 1 año en la mayoría de productos, con cobertura extendida en superficies Cefiontect (5 años).

## El Resultado Final

Para la mayoría de los proyectos en San Miguel de Allende, recomendamos una especificación mixta: sanitarios TOTO, grifos Kohler o Brizo, y selecciones específicas de marca para bañeras y accesorios basados en la dirección estética del proyecto. Esto no es un compromiso — es cómo obtienes el mejor producto en cada categoría.`,
    },
    relatedSlugs: ["blanco-silgranit-vs-stainless", "specifying-fixtures-hospitality-mexico"],
  },
  {
    slug: "talavera-tile-specification",
    title: {
      en: "Specifying Talavera Tile: A Guide for Architects",
      es: "Especificación de Azulejo Talavera: Una Guía para Arquitectos",
    },
    excerpt: {
      en: "Not all Talavera is created equal. How to distinguish authentic Denominación de Origen tile from imitations, and technical specs for specifying it in wet environments.",
      es: "No toda la Talavera es igual. Cómo distinguir azulejos auténticos con Denominación de Origen de imitaciones, y especificaciones técnicas para áreas húmedas.",
    },
    pillar: "Craft",
    date: "2026-01-15",
    readTime: "7 min",
    image: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800&q=80",
    author: "Roger Williams",
    body: {
      en: `## What Makes Talavera Authentic

True Talavera pottery holds a Denominación de Origen — a geographic designation similar to Champagne or Parmigiano-Reggiano. Only ceramics produced in Puebla, Atlixco, Cholula, Tecali, and San Pablo del Monte using traditional methods and materials can legally be called "Talavera."

The designation matters because it guarantees:
- **Clay source:** Local black and white clay, hand-mixed in specific proportions
- **Glaze composition:** Lead-free tin-based glaze (the white base coat that gives Talavera its characteristic milky ground)
- **Pigment palette:** Only six colors derived from mineral pigments (blue from cobalt, green from copper oxide, yellow from iron, orange and rust from iron and antimony, black from manganese)
- **Firing process:** Double-fired at 1,050°C minimum in a wood-burning or gas kiln

Imitation "Talavera-style" tile — widely available throughout Mexico — uses industrial ceramic bodies, screen-printed designs, and lower firing temperatures. It's cheaper and more uniform, but it lacks the depth of color, the slight irregularity, and the durability of authentic tile.

## Technical Specifications for Wet Environments

Architects specifying authentic Talavera for bathroom applications need to account for the material's characteristics:

**Water absorption:** Authentic Talavera is semi-vitreous, with water absorption rates of 3–6%. This is higher than porcelain (< 0.5%) but well within acceptable range for wall applications. For shower walls and backsplashes, we recommend sealing with a penetrating silicone-based sealer after installation.

**Slip resistance:** Unglazed Talavera tile provides adequate slip resistance for bathroom floors (DCOF > 0.42). Glazed Talavera should be limited to wall applications or low-traffic floor areas.

**Dimensional tolerance:** Handmade Talavera tiles vary ±2mm in both length and width. This is normal — it's what gives a Talavera installation its handcrafted character. Specify a wider grout joint (4–6mm minimum vs. 2mm for factory tile) to accommodate variation.

**Thermal expansion:** Talavera's coefficient of thermal expansion is compatible with standard thinset mortars. No special adhesive is required, but we recommend a polymer-modified thinset for wet applications.

## Design Guidelines

The most successful Talavera installations in our experience follow a few principles:

1. **Use it as an accent, not a field tile.** A full bathroom of Talavera can feel overwhelming. A niche, a border, or a vanity backsplash creates impact without visual fatigue.

2. **Pair with simple factory fixtures.** Let the tile be the artisanal statement. A Talavera backsplash paired with a clean Kohler Composed faucet reads as curated. The same backsplash with an ornate traditional faucet reads as cluttered.

3. **Commit to maintenance.** Talavera's tin-based glaze is durable but not impervious. Acidic cleaners (vinegar, citrus-based products) will etch the surface over time. Specify pH-neutral cleaners for any area with Talavera tile.

## Sourcing Through Counter Cultures

We work with three Denominación de Origen workshops in Puebla. Lead time for standard patterns is 4–6 weeks; custom designs require 8–12 weeks. All tile is inspected at our San Miguel facility before delivery to the project site.

For architects enrolled in our Trade Program, we provide:
- Sample tiles for client presentation (up to 6 samples per project, complimentary)
- Sealed vs. unsealed samples showing the visual difference
- Written care instructions in English and Spanish for the end client
- Installation specifications for the tile contractor`,
      es: `## Qué Hace Auténtica a la Talavera

La cerámica Talavera verdadera tiene una Denominación de Origen — una designación geográfica similar al Champagne o al Parmigiano-Reggiano. Solo las cerámicas producidas en Puebla, Atlixco, Cholula, Tecali y San Pablo del Monte usando métodos y materiales tradicionales pueden legalmente llamarse "Talavera."

La designación importa porque garantiza:
- **Fuente de arcilla:** Arcilla local negra y blanca, mezclada a mano en proporciones específicas
- **Composición del glaseado:** Glaseado a base de estaño sin plomo
- **Paleta de pigmentos:** Solo seis colores derivados de pigmentos minerales
- **Proceso de cocción:** Doble cocción a 1,050°C mínimo

La imitación de azulejo "estilo Talavera" usa cuerpos cerámicos industriales, diseños impresos por serigrafía y temperaturas de cocción más bajas.

## Especificaciones Técnicas para Ambientes Húmedos

Los arquitectos que especifican Talavera auténtica para aplicaciones de baño necesitan considerar las características del material:

**Absorción de agua:** La Talavera auténtica es semi-vítrea, con tasas de absorción de agua de 3–6%. Esto es más alto que la porcelana (< 0.5%) pero dentro del rango aceptable para aplicaciones de pared. Para muros de ducha, recomendamos sellar con un sellador penetrante a base de silicón después de la instalación.

**Resistencia al deslizamiento:** El azulejo Talavera sin glasear proporciona resistencia adecuada al deslizamiento para pisos de baño (DCOF > 0.42).

**Tolerancia dimensional:** Los azulejos Talavera hechos a mano varían ±2mm. Especifica una junta de lechada más ancha (4–6mm mínimo).

**Expansión térmica:** El coeficiente de expansión térmica de la Talavera es compatible con morteros thinset estándar.

## Directrices de Diseño

Las instalaciones de Talavera más exitosas en nuestra experiencia siguen algunos principios:

1. **Úsala como acento, no como azulejo de campo.** Un baño completo de Talavera puede sentirse abrumador. Un nicho, un borde o un salpicadero de tocador crea impacto sin fatiga visual.

2. **Combínala con accesorios de fábrica simples.** Deja que el azulejo sea la declaración artesanal.

3. **Comprométete con el mantenimiento.** Los limpiadores ácidos grabarán la superficie con el tiempo. Especifica limpiadores de pH neutro.

## Compra a Través de Counter Cultures

Trabajamos con tres talleres con Denominación de Origen en Puebla. El tiempo de entrega para patrones estándar es 4–6 semanas; diseños personalizados requieren 8–12 semanas.`,
    },
    relatedSlugs: ["hand-hammered-copper-basin-guide", "artisanal-vs-factory-fixtures"],
  },
  {
    slug: "artisanal-vs-factory-fixtures",
    title: {
      en: "Artisanal vs. Factory Fixtures: When to Use Each",
      es: "Accesorios Artesanales vs. de Fábrica: Cuándo Usar Cada Uno",
    },
    excerpt: {
      en: "Not every fixture should be handmade, and not every fixture should come from a factory. A framework for knowing which approach serves each element of your project.",
      es: "No todos los accesorios deben ser hechos a mano, y no todos deben venir de fábrica. Un marco para saber qué enfoque sirve a cada elemento de tu proyecto.",
    },
    pillar: "Design",
    date: "2026-01-08",
    readTime: "6 min",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c0?w=800&q=80",
    author: "Roger Williams",
    editorsPick: false,
    body: {
      en: `## The False Binary

The design conversation around artisanal vs. factory-made fixtures often frames it as an either/or choice — authenticity vs. reliability, soul vs. precision. At Counter Cultures, we've spent 22 years demonstrating that the most compelling interiors use both, deliberately.

The question isn't "artisanal or factory?" It's "which fixture in this room should be artisanal, and which should be factory?"

## When Artisanal Is the Right Choice

**Statement pieces that anchor a room's character.** A hand-hammered copper basin on a cantera stone vanity. A hand-thrown ceramic vessel sink in a powder room. These are the pieces visitors touch, photograph, and ask about. They should carry the maker's signature.

**Pieces where variation is a feature.** Copper patina, hand-formed ceramic glaze, natural stone — these materials are beautiful precisely because each piece is unique. Factory consistency would diminish them.

**Context-specific commissions.** When a client wants a basin that matches their home's specific cantera stone, or a tile pattern that references a family crest, or hardware proportioned for an oversized colonial door — only artisanal production can deliver this specificity.

**Budget allocation:** Artisanal pieces should represent 15–30% of a project's fixture budget. This constrains them to the moments that matter most and prevents the "artisanal everywhere" approach that dilutes impact.

## When Factory Is the Right Choice

**Anything that needs to perform identically every time.** Toilet flush mechanisms, faucet cartridges, shower valves, drain assemblies. These are precision-engineered systems where a 0.5mm tolerance matters. TOTO's Tornado Flush works because every unit is manufactured to the same specification. A hand-thrown toilet would be a novelty, not an improvement.

**High-traffic commercial fixtures.** Hotel guest bathrooms, restaurant restrooms, office washrooms. These fixtures need to survive thousands of uses without maintenance intervention. Kohler's commercial-grade products are engineered for this. Artisanal pieces in commercial settings create maintenance headaches.

**Repeating elements.** When you need 12 matching faucets for a hotel or 8 identical cabinet pulls for a kitchen, factory production delivers the consistency the design requires.

**Background fixtures.** Not everything in a bathroom is a protagonist. The toilet, the shower valve, the towel bar — these should be excellent but invisible. Factory fixtures from TOTO, Kohler, and Brizo do this perfectly.

## The Counter Cultures Framework

Here's the decision framework we use with architects in our showroom:

| Element | Recommendation | Why |
|---|---|---|
| Basin/sink | Artisanal (feature bath) or Factory (guest/utility) | The basin is the room's visual anchor — artisanal adds character where it's seen |
| Faucet | Factory always | Precision engineering; daily mechanical use demands reliability |
| Toilet | Factory always | Hygiene technology (Cefiontect, Tornado Flush) can't be handmade |
| Bathtub | Either | Depends on whether the tub is sculptural (artisanal) or functional (factory) |
| Door hardware | Either | Exterior: Sun Valley Bronze (artisanal-quality factory). Interior: Emtek (factory) |
| Tile accent | Artisanal | This is where Talavera, hand-painted cement tile, or custom mosaics shine |
| Field tile | Factory | Background surfaces need consistency and easy replacement |

## The Integration Principle

The magic happens at the intersection. A Mistoa hand-formed basin sitting on a concrete vanity, paired with a Brizo Litze faucet in Luxe Gold — the contrast between organic and engineered is what makes both pieces more powerful. Neither the basin nor the faucet would make the same statement alone.

This is what Counter Cultures was built to enable: one showroom where you can specify both the factory-engineered Brizo faucet and the village-hammered copper basin, coordinated to work together, delivered on the same timeline.`,
      es: `## La Falsa Dicotomía

La conversación de diseño alrededor de accesorios artesanales vs. de fábrica a menudo lo enmarca como una elección de uno u otro — autenticidad vs. confiabilidad, alma vs. precisión. En Counter Cultures, hemos pasado 22 años demostrando que los interiores más convincentes usan ambos, deliberadamente.

La pregunta no es "¿artesanal o de fábrica?" Es "¿qué accesorio en esta habitación debe ser artesanal, y cuál debe ser de fábrica?"

## Cuándo lo Artesanal Es la Elección Correcta

**Piezas de declaración que anclan el carácter de una habitación.** Un lavabo de cobre martillado a mano sobre un tocador de cantera. Un lavabo de cerámica tipo vasija hecho a mano en un medio baño.

**Piezas donde la variación es una característica.** Pátina de cobre, glaseado de cerámica hecho a mano, piedra natural — estos materiales son hermosos precisamente porque cada pieza es única.

**Comisiones específicas al contexto.** Cuando un cliente quiere un lavabo que combine con la cantera específica de su casa, o un patrón de azulejo que haga referencia a un escudo familiar.

**Asignación de presupuesto:** Las piezas artesanales deben representar 15–30% del presupuesto de accesorios de un proyecto.

## Cuándo lo de Fábrica Es la Elección Correcta

**Cualquier cosa que necesite funcionar idénticamente cada vez.** Mecanismos de descarga de sanitarios, cartuchos de grifos, válvulas de ducha. Estos son sistemas de ingeniería de precisión.

**Accesorios comerciales de alto tráfico.** Baños de huéspedes de hotel, baños de restaurantes, baños de oficinas.

**Elementos repetitivos.** Cuando necesitas 12 grifos iguales o 8 jaladeras de gabinete idénticas.

**Accesorios de fondo.** No todo en un baño es un protagonista. El sanitario, la válvula de ducha, el toallero — estos deben ser excelentes pero invisibles.

## El Principio de Integración

La magia sucede en la intersección. Un lavabo Mistoa formado a mano sentado en un tocador de concreto, combinado con un grifo Brizo Litze en Luxe Gold — el contraste entre lo orgánico y lo diseñado es lo que hace a ambas piezas más poderosas.

Esto es lo que Counter Cultures fue construido para habilitar: un showroom donde puedes especificar tanto el grifo Brizo de ingeniería de fábrica como el lavabo de cobre martillado a mano, coordinados para trabajar juntos.`,
    },
    relatedSlugs: ["hand-hammered-copper-basin-guide", "bathroom-design-trends-san-miguel-2026"],
  },
  {
    slug: "kitchen-faucet-finish-guide",
    title: {
      en: "Kitchen Faucet Finishes: A Visual Guide to What Works in Mexican Kitchens",
      es: "Acabados de Grifos de Cocina: Una Guía Visual para Cocinas Mexicanas",
    },
    excerpt: {
      en: "Chrome, brushed nickel, matte black, or satin brass? How each finish performs with San Miguel's hard water, and which pair best with popular countertop materials.",
      es: "¿Cromo, níquel cepillado, negro mate o latón satinado? Cómo funciona cada acabado con el agua dura de San Miguel, y cuáles combinan mejor con los materiales de encimera populares.",
    },
    pillar: "Product",
    date: "2025-12-18",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80",
    author: "Counter Cultures",
    body: {
      en: `## The Finish Decision

Kitchen faucet finish is one of those decisions that seems simple until you start living with it. The wrong finish in San Miguel's hard-water environment means daily wiping, visible fingerprints, and water spots that never quite go away. The right finish means a faucet that looks good with minimal maintenance.

Here's what we've learned from 22 years of selling and servicing kitchen faucets in central Mexico.

## Chrome

**The case for:** Chrome is the most durable finish available. It's applied through an electrolytic process that bonds chromium to the base metal at a molecular level. You can't scratch it with normal kitchen use, and it resists corrosion indefinitely.

**The case against:** Chrome shows everything. Water spots, fingerprints, soap residue — all immediately visible on chrome's mirror surface. In San Miguel's hard-water conditions, a chrome faucet requires daily wiping to look clean. Most of our clients have moved away from chrome in residential kitchens.

**Best paired with:** Modern white kitchens, professional-style ranges, stainless steel appliances. Chrome says "precision" and works best in kitchens that lean utilitarian.

## Brushed Nickel / Stainless

**The case for:** The gold standard for low-maintenance kitchen finishes. The brushed texture hides water spots and fingerprints effectively. It's universally compatible with stainless steel appliances and sinks. PVD (Physical Vapor Deposition) versions from Kohler (Vibrant Stainless) and Brizo are exceptionally durable.

**The case against:** It can read as generic. Brushed nickel has been the default kitchen faucet finish for 20+ years, and in a design-forward market like San Miguel, it sometimes lacks personality.

**Best paired with:** Granite or quartz countertops, stainless steel sinks, transitional kitchen designs. The workhorse finish that never disappoints.

## Matte Black

**The case for:** High visual impact. Matte black creates strong contrast against light countertops and makes a design statement without competing with other elements. It's the most-photographed finish on design social media for a reason.

**The case against:** Matte black is the most maintenance-intensive finish in our lineup. Hard water deposits show as white chalky spots on the dark surface. Fingerprint oils create visible smudges. And the matte coating, while durable, can show wear at the handle and spout base over 5–10 years of daily use.

**Best paired with:** Light marble or concrete countertops, white cabinetry, minimalist interiors. Works beautifully but demands commitment to upkeep.

## Satin Brass / Brushed Gold

**The case for:** This is the finish of the moment in San Miguel. Warm brass and gold tones complement the city's earthy palette — terracotta, cantera stone, warm wood, and copper accents all pair naturally with satin brass. California Faucets' Satin Bronze and Brizo's Luxe Gold are our two most-requested finishes this year.

**The case against:** Price premium (typically 20–30% over brushed nickel) and limited availability across product lines. Not every faucet model is available in warm metallic finishes.

**Best paired with:** Wood countertops, natural stone, Talavera tile, copper accents, warm-toned cabinetry. The ideal finish for the San Miguel aesthetic.

## Our Recommendations by Kitchen Style

| Kitchen Style | Recommended Finish | Our Top Pick |
|---|---|---|
| Modern minimalist | Matte black or chrome | Brizo Litze in Matte Black |
| Warm contemporary | Satin brass or brushed gold | California Faucets Descanso in Satin Bronze |
| Traditional Mexican | Satin brass or oil-rubbed bronze | Kohler Artifacts in Vibrant Brushed Bronze |
| Professional/chef | Brushed stainless | Kohler Purist in Vibrant Stainless |
| Transitional | Brushed nickel | Brizo Solna in Brilliance Stainless |

All finishes are available to see and compare in our showroom. We keep faucets in multiple finishes on display so you can see how they look under the same lighting conditions.`,
      es: `## La Decisión del Acabado

El acabado del grifo de cocina es una de esas decisiones que parece simple hasta que empiezas a vivir con ella. El acabado equivocado en el ambiente de agua dura de San Miguel significa limpieza diaria, huellas dactilares visibles y manchas de agua que nunca desaparecen.

## Cromo

**A favor:** El cromo es el acabado más duradero disponible. Se aplica a través de un proceso electrolítico que une el cromo al metal base a nivel molecular.

**En contra:** El cromo muestra todo. Manchas de agua, huellas dactilares, residuos de jabón — todo inmediatamente visible. En las condiciones de agua dura de San Miguel, un grifo cromado requiere limpieza diaria.

**Mejor combinado con:** Cocinas blancas modernas, estufas estilo profesional.

## Níquel Cepillado / Acero Inoxidable

**A favor:** El estándar de oro para acabados de cocina de bajo mantenimiento. La textura cepillada oculta efectivamente manchas de agua y huellas dactilares.

**En contra:** Puede leerse como genérico. Ha sido el acabado predeterminado por 20+ años.

**Mejor combinado con:** Encimeras de granito o cuarzo, fregaderos de acero inoxidable, diseños transicionales.

## Negro Mate

**A favor:** Alto impacto visual. Crea fuerte contraste contra encimeras claras.

**En contra:** Es el acabado que más mantenimiento requiere. Los depósitos de agua dura se muestran como manchas calcáreas blancas sobre la superficie oscura.

**Mejor combinado con:** Mármol claro o encimeras de concreto, gabinetes blancos, interiores minimalistas.

## Latón Satinado / Oro Cepillado

**A favor:** Este es el acabado del momento en San Miguel. Los tonos cálidos de latón y oro complementan la paleta terrosa de la ciudad.

**En contra:** Precio premium (típicamente 20–30% sobre níquel cepillado) y disponibilidad limitada.

**Mejor combinado con:** Encimeras de madera, piedra natural, azulejo Talavera, acentos de cobre. El acabado ideal para la estética de San Miguel.

Todos los acabados están disponibles para ver y comparar en nuestro showroom.`,
    },
    relatedSlugs: ["blanco-silgranit-vs-stainless", "kohler-vs-toto-comparison"],
  },
  {
    slug: "water-efficiency-guide-mexico",
    title: {
      en: "Water Efficiency in Mexican Construction: Standards, Certification, and Product Selection",
      es: "Eficiencia de Agua en la Construcción Mexicana: Estándares, Certificación y Selección de Productos",
    },
    excerpt: {
      en: "Mexico's water crisis demands smarter fixtures. A technical guide to NOM standards, WaterSense certification, and the most water-efficient products available through Counter Cultures.",
      es: "La crisis del agua en México exige accesorios más inteligentes. Una guía técnica de estándares NOM, certificación WaterSense y los productos más eficientes disponibles.",
    },
    pillar: "Trade",
    date: "2025-12-05",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80",
    author: "Roger Williams",
    body: {
      en: `## The Context

Mexico's central highlands face a worsening water crisis. The aquifer beneath San Miguel de Allende has dropped measurably in the past decade, and water restrictions are increasingly common during dry season (November–May). For architects and builders, water-efficient fixtures aren't an optional upgrade — they're a professional responsibility.

This guide covers the technical standards, certification programs, and specific products that help projects meet or exceed Mexico's water efficiency requirements.

## Mexican Water Standards: NOM-009-CNA

The Norma Oficial Mexicana NOM-009-CNA sets maximum flow rates for plumbing fixtures sold in Mexico:

| Fixture Type | Maximum Flow/Volume | Standard Reference |
|---|---|---|
| Toilets | 6.0 Lpf (liters per flush) | NOM-009-CNA-2011 |
| Urinals | 3.8 Lpf | NOM-009-CNA-2011 |
| Lavatory faucets | 8.3 Lpm at 4.1 bar | NOM-009-CNA-2011 |
| Kitchen faucets | 8.3 Lpm at 4.1 bar | NOM-009-CNA-2011 |
| Showerheads | 9.5 Lpm at 5.5 bar | NOM-009-CNA-2011 |

All products sold through Counter Cultures meet or exceed these standards. Many significantly outperform them.

## WaterSense Certification

WaterSense is the U.S. EPA's voluntary labeling program for water-efficient products. While not legally required in Mexico, WaterSense certification provides two advantages:

1. **Performance guarantee:** WaterSense-certified products must pass independent testing proving they perform as well as or better than standard products while using less water.
2. **LEED credits:** For projects pursuing LEED certification, WaterSense fixtures earn water efficiency credits under the "Indoor Water Use Reduction" prerequisite.

## Top Water-Efficient Products by Category

### Toilets: TOTO Drake II (4.8 Lpf)
TOTO's Tornado Flush technology uses three angled jets to create a centrifugal washing action that cleans the bowl with just 4.8 liters — 20% less than the NOM maximum. The Cefiontect glaze further reduces water needs by preventing waste adhesion, meaning fewer flushes and less cleaning water overall.

### Faucets: Brizo Litze with SmartTouch (5.0 Lpm)
Brizo's SmartTouch technology activates the faucet with a simple touch anywhere on the spout or handle. This reduces water waste from leaving the faucet running while hands are occupied. The flow rate of 5.0 Lpm is 40% below the NOM maximum.

### Showerheads: TOTO Aero-e (7.6 Lpm)
TOTO's Aero-e technology mixes air into the water stream, creating larger, softer droplets that feel full-coverage despite lower water volume. At 7.6 Lpm, it's 20% below the NOM maximum while delivering a noticeably better shower experience than many standard 9.5 Lpm heads.

### Kitchen: BLANCO Solenta Senso (5.5 Lpm)
BLANCO's semi-professional pull-down faucet with infrared sensor activation. The sensor turns water on only when hands or objects are detected under the spout — dramatically reducing waste during food prep and dishwashing.

## Calculating Water Savings

For a typical 3-bathroom residential project in San Miguel, switching from standard NOM-compliant fixtures to our recommended high-efficiency lineup saves approximately:

- **Toilets:** 14,600 liters/year (assuming 10 flushes/day, 365 days)
- **Faucets:** 8,760 liters/year (assuming 20 minutes total daily use)
- **Showers:** 10,950 liters/year (assuming 15 minutes daily use)
- **Total annual savings:** ~34,310 liters — enough to fill a standard residential cistern 17 times

At San Miguel's current water costs, this represents approximately MXN 3,400 in annual savings. The payback period on the fixture premium is typically 2–3 years, after which the savings are pure margin for the homeowner.

## Specifying for Water Efficiency

When creating specifications for water-conscious projects, include these details:

1. **Flow rates in liters per minute (Lpm)** — not just "low-flow" language
2. **WaterSense certification number** where applicable
3. **Aerator type** (laminar flow for healthcare, aerated for residential)
4. **Pressure requirements** (some low-flow fixtures require minimum 2.0 bar to perform correctly)

Counter Cultures Trade Program members receive a water-efficiency specification template that includes all these details for our recommended products.`,
      es: `## El Contexto

Las tierras altas centrales de México enfrentan una crisis de agua que empeora. El acuífero debajo de San Miguel de Allende ha bajado mediblemente en la última década, y las restricciones de agua son cada vez más comunes durante la temporada seca (noviembre–mayo). Para arquitectos y constructores, los accesorios eficientes en agua no son una mejora opcional — son una responsabilidad profesional.

## Estándares Mexicanos de Agua: NOM-009-CNA

La Norma Oficial Mexicana NOM-009-CNA establece tasas máximas de flujo para accesorios de plomería vendidos en México:

| Tipo de Accesorio | Flujo/Volumen Máximo |
|---|---|
| Sanitarios | 6.0 Lpd (litros por descarga) |
| Mingitorios | 3.8 Lpd |
| Grifos de lavabo | 8.3 Lpm a 4.1 bar |
| Grifos de cocina | 8.3 Lpm a 4.1 bar |
| Regaderas | 9.5 Lpm a 5.5 bar |

## Certificación WaterSense

WaterSense es el programa voluntario de etiquetado de la EPA de EE.UU. para productos eficientes en agua. Aunque no es legalmente requerido en México, la certificación WaterSense proporciona garantía de rendimiento y créditos LEED.

## Productos Más Eficientes por Categoría

### Sanitarios: TOTO Drake II (4.8 Lpd)
La tecnología Tornado Flush de TOTO usa tres chorros angulados para crear una acción de lavado centrífuga con solo 4.8 litros — 20% menos que el máximo NOM.

### Grifos: Brizo Litze con SmartTouch (5.0 Lpm)
La tecnología SmartTouch de Brizo activa el grifo con un simple toque. La tasa de flujo de 5.0 Lpm es 40% debajo del máximo NOM.

### Regaderas: TOTO Aero-e (7.6 Lpm)
La tecnología Aero-e de TOTO mezcla aire en la corriente de agua, creando gotas más grandes y suaves a 7.6 Lpm — 20% debajo del máximo NOM.

## Calculando Ahorros de Agua

Para un proyecto residencial típico de 3 baños en San Miguel, cambiar de accesorios estándar a nuestra línea de alta eficiencia ahorra aproximadamente 34,310 litros anuales — suficiente para llenar una cisterna residencial estándar 17 veces.

A los costos actuales de agua en San Miguel, esto representa aproximadamente MXN 3,400 en ahorros anuales. El período de recuperación de la inversión es típicamente 2–3 años.`,
    },
    relatedSlugs: ["kohler-vs-toto-comparison", "specifying-fixtures-hospitality-mexico"],
  },
];

export const getArticleBySlug = (slug: string): Article | undefined =>
  articles.find((a) => a.slug === slug);

export const getArticlesByPillar = (pillar: ArticlePillar): Article[] =>
  articles.filter((a) => a.pillar === pillar);

export const getFeaturedArticle = (): Article | undefined =>
  articles.find((a) => a.featured);

export const getEditorsPicks = (): Article[] =>
  articles.filter((a) => a.editorsPick);
