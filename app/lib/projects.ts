import type { BilingualText } from "./types";

export interface ProjectImage {
  src: string;
  alt: BilingualText;
  caption?: BilingualText;
}

export interface ProjectFixture {
  product: string;
  brand: string;
  location: BilingualText;
  slug?: string;
}

export interface Project {
  slug: string;
  title: string;
  location: BilingualText;
  architect: string;
  architectFirm?: string;
  type: { en: string; es: string };
  year: number;
  description: BilingualText;
  longDescription: BilingualText;
  heroImage: string;
  gallery: ProjectImage[];
  brands: string[];
  fixtures: ProjectFixture[];
  testimonial?: {
    quote: BilingualText;
    author: string;
    role: BilingualText;
  };
  stats?: {
    label: BilingualText;
    value: string;
  }[];
}

export const PROJECTS: Project[] = [
  {
    slug: "casa-atelier",
    title: "Casa Atelier",
    location: { en: "San Miguel de Allende", es: "San Miguel de Allende" },
    architect: "Arq. Carolina Mendoza",
    architectFirm: "Studio Arquitectura MX",
    type: { en: "Residential", es: "Residencial" },
    year: 2023,
    description: {
      en: "A contemporary home where Brizo Litze faucets meet hand-hammered copper basins. Every fixture tells a story of precision and craft.",
      es: "Una casa contemporánea donde los grifos Brizo Litze se encuentran con lavabos de cobre martillado a mano. Cada accesorio cuenta una historia de precisión y arte.",
    },
    longDescription: {
      en: "Casa Atelier is a 4,200 sq ft contemporary residence in the historic Centro of San Miguel de Allende. Architect Carolina Mendoza envisioned a home that bridges the city's colonial heritage with a rigorously modern interior — raw concrete walls, polished concrete floors, and floor-to-ceiling steel-frame windows flooding every room with light.\n\nCounter Cultures specified the full fixture package: Brizo Litze pull-down faucets in the open kitchen, TOTO Connelly toilets with WASHLET C5 bidet seats in all four bathrooms, and a pair of hand-hammered copper vessel basins by Don Miguel of Santa Clara del Cobre for the master suite powder room.\n\nThe result is a home where international precision engineering and Mexican artisanal craft coexist effortlessly — exactly the philosophy Counter Cultures was built on.",
      es: "Casa Atelier es una residencia contemporánea de 390 m² en el Centro histórico de San Miguel de Allende. La arquitecta Carolina Mendoza imaginó una casa que une la herencia colonial de la ciudad con un interior rigurosamente moderno — muros de concreto aparente, pisos de concreto pulido y ventanas de acero de piso a techo que inundan cada habitación de luz.\n\nCounter Cultures especificó el paquete completo de grifería: mezcladoras Brizo Litze en la cocina abierta, sanitarios TOTO Connelly con asientos bidet WASHLET C5 en los cuatro baños, y un par de lavabos vessel de cobre martillado a mano por Don Miguel de Santa Clara del Cobre para el medio baño de la suite principal.\n\nEl resultado es una casa donde la ingeniería de precisión internacional y la artesanía mexicana coexisten sin esfuerzo — exactamente la filosofía sobre la que se construyó Counter Cultures.",
    },
    heroImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80",
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
        alt: { en: "Casa Atelier exterior", es: "Exterior de Casa Atelier" },
        caption: { en: "Street facade with restored cantera stone portal", es: "Fachada con portal de cantera restaurado" },
      },
      {
        src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
        alt: { en: "Open-plan kitchen with Brizo faucets", es: "Cocina abierta con grifos Brizo" },
        caption: { en: "Brizo Litze faucet in Luxe Gold over BLANCO Silgranit sink", es: "Grifo Brizo Litze en Luxe Gold sobre tarja BLANCO Silgranit" },
      },
      {
        src: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80",
        alt: { en: "Master bathroom with copper basin", es: "Baño principal con lavabo de cobre" },
        caption: { en: "Hand-hammered copper vessel basin by Don Miguel", es: "Lavabo vessel de cobre martillado a mano por Don Miguel" },
      },
      {
        src: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80",
        alt: { en: "Guest bathroom with TOTO fixtures", es: "Baño de invitados con accesorios TOTO" },
        caption: { en: "TOTO Connelly toilet with WASHLET C5 bidet seat", es: "Sanitario TOTO Connelly con asiento bidet WASHLET C5" },
      },
      {
        src: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&q=80",
        alt: { en: "Freestanding tub in master suite", es: "Bañera independiente en suite principal" },
        caption: { en: "Badeloft freestanding soaker with California Faucets floor-mount filler", es: "Bañera Badeloft con llenador de piso California Faucets" },
      },
    ],
    brands: ["Brizo", "TOTO", "Counter Cultures Artisanal", "BLANCO", "Badeloft", "California Faucets"],
    fixtures: [
      { product: "Litze Pull-Down Kitchen Faucet", brand: "Brizo", location: { en: "Kitchen", es: "Cocina" }, slug: "brizo-litze-pull-down" },
      { product: "Connelly Two-Piece Toilet", brand: "TOTO", location: { en: "All bathrooms", es: "Todos los baños" }, slug: "toto-connelly-two-piece" },
      { product: "WASHLET C5 Bidet Seat", brand: "TOTO", location: { en: "All bathrooms", es: "Todos los baños" }, slug: "toto-washlet-c5" },
      { product: "Hand-Hammered Copper Vessel Basin", brand: "Counter Cultures", location: { en: "Master powder room", es: "Medio baño principal" }, slug: "michelle-polished-copper-vessel" },
      { product: "Freestanding Bathtub", brand: "Badeloft", location: { en: "Master suite", es: "Suite principal" }, slug: "badeloft-freestanding-bathtub" },
    ],
    testimonial: {
      quote: {
        en: "Counter Cultures transformed our project. Roger understood the vision immediately — he specified Brizo for the kitchen, TOTO for the guest baths, and then surprised us with a hand-hammered copper basin from a local artisan that became the centerpiece of the master suite.",
        es: "Counter Cultures transformó nuestro proyecto. Roger entendió la visión de inmediato — especificó Brizo para la cocina, TOTO para los baños de invitados, y luego nos sorprendió con un lavabo de cobre martillado a mano de un artesano local que se convirtió en la pieza central de la suite principal.",
      },
      author: "Arq. Carolina Mendoza",
      role: { en: "Principal, Studio Arquitectura MX", es: "Directora, Studio Arquitectura MX" },
    },
    stats: [
      { label: { en: "Square Feet", es: "Metros Cuadrados" }, value: "4,200 ft² / 390 m²" },
      { label: { en: "Bathrooms", es: "Baños" }, value: "4" },
      { label: { en: "Fixtures Specified", es: "Accesorios Especificados" }, value: "38" },
      { label: { en: "Completion", es: "Terminación" }, value: "2023" },
    ],
  },
  {
    slug: "hotel-jardin-de-la-sierra",
    title: "Hotel Jardín de la Sierra",
    location: { en: "Guanajuato", es: "Guanajuato" },
    architect: "Arq. Sofía Villanueva",
    architectFirm: "Studio Arquitectura MX",
    type: { en: "Hospitality", es: "Hotelería" },
    year: 2022,
    description: {
      en: "48 rooms, each specified with TOTO Washlets and Kohler rain showers. The lobby features a custom artisanal copper vessel by Don Miguel.",
      es: "48 habitaciones, cada una especificada con TOTO Washlets y regaderas de lluvia Kohler. El lobby presenta un lavabo artesanal de cobre por Don Miguel.",
    },
    longDescription: {
      en: "Hotel Jardín de la Sierra is a 48-room boutique hotel tucked into the hillsides of Guanajuato's historic center, overlooking the Jardín de la Unión. The project required sourcing consistent, durable fixtures across all guest rooms while maintaining the property's colonial character.\n\nCounter Cultures worked directly with the hotel's design team to specify TOTO Drake toilets with WASHLET S2 bidet seats for all 48 rooms — a move that set the property apart from every competitor in the region. Kohler rain shower systems were paired with California Faucets StyleTherm thermostatic valves for precise temperature control.\n\nThe hotel's centerpiece is the reception lobby, where a monumental artisanal copper vessel sink sits atop a reclaimed mesquite wood console — commissioned from Don Miguel of Santa Clara del Cobre and finished with a California Faucets Christopher faucet in Weathered Copper.",
      es: "Hotel Jardín de la Sierra es un hotel boutique de 48 habitaciones enclavado en las laderas del centro histórico de Guanajuato, con vista al Jardín de la Unión. El proyecto requería accesorios consistentes y duraderos en todas las habitaciones mientras se mantenía el carácter colonial de la propiedad.\n\nCounter Cultures trabajó directamente con el equipo de diseño del hotel para especificar sanitarios TOTO Drake con asientos bidet WASHLET S2 para las 48 habitaciones — una decisión que distinguió a la propiedad de todos los competidores de la región. Los sistemas de regadera de lluvia Kohler se combinaron con válvulas termostáticas StyleTherm de California Faucets para un control preciso de temperatura.\n\nLa pieza central del hotel es el lobby de recepción, donde un monumental lavabo vessel de cobre artesanal descansa sobre una consola de madera de mezquite recuperada — comisionado a Don Miguel de Santa Clara del Cobre y terminado con un grifo California Faucets Christopher en Cobre Envejecido.",
    },
    heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80",
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
        alt: { en: "Hotel Jardín exterior at dusk", es: "Exterior del Hotel Jardín al atardecer" },
        caption: { en: "Colonial facade with restored ironwork balconies", es: "Fachada colonial con balcones de herrería restaurada" },
      },
      {
        src: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&q=80",
        alt: { en: "Guest room bathroom", es: "Baño de habitación" },
        caption: { en: "TOTO Drake toilet with WASHLET S2 and Kohler rain shower", es: "Sanitario TOTO Drake con WASHLET S2 y regadera de lluvia Kohler" },
      },
      {
        src: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&q=80",
        alt: { en: "Lobby copper vessel sink", es: "Lavabo de cobre del lobby" },
        caption: { en: "Custom artisanal copper vessel by Don Miguel", es: "Lavabo de cobre artesanal por Don Miguel" },
      },
      {
        src: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1200&q=80",
        alt: { en: "Suite bathroom detail", es: "Detalle del baño de suite" },
        caption: { en: "California Faucets Christopher faucet in Weathered Copper", es: "Grifo California Faucets Christopher en Cobre Envejecido" },
      },
    ],
    brands: ["TOTO", "Kohler", "California Faucets", "Counter Cultures Artisanal"],
    fixtures: [
      { product: "Drake Elongated Toilet", brand: "TOTO", location: { en: "48 guest rooms", es: "48 habitaciones" }, slug: "toto-drake-elongated" },
      { product: "WASHLET S2 Bidet Seat", brand: "TOTO", location: { en: "48 guest rooms", es: "48 habitaciones" } },
      { product: "StyleTherm Thermostatic Valve", brand: "California Faucets", location: { en: "All showers", es: "Todas las regaderas" }, slug: "california-faucets-thermostatic-valve" },
      { product: "Christopher Single-Hole Faucet", brand: "California Faucets", location: { en: "Lobby & suites", es: "Lobby y suites" }, slug: "california-faucets-christopher" },
    ],
    testimonial: {
      quote: {
        en: "Working with Counter Cultures on a 48-room hotel was seamless. They managed the entire specification process, coordinated deliveries across multiple brands, and even commissioned a one-of-a-kind piece for our lobby. No other supplier in Mexico could have done that.",
        es: "Trabajar con Counter Cultures en un hotel de 48 habitaciones fue impecable. Gestionaron todo el proceso de especificación, coordinaron entregas de múltiples marcas, e incluso comisionaron una pieza única para nuestro lobby. Ningún otro proveedor en México podría haber hecho eso.",
      },
      author: "Arq. Sofía Villanueva",
      role: { en: "Lead Architect, Hotel Jardín de la Sierra", es: "Arquitecta Líder, Hotel Jardín de la Sierra" },
    },
    stats: [
      { label: { en: "Guest Rooms", es: "Habitaciones" }, value: "48" },
      { label: { en: "Brands Specified", es: "Marcas Especificadas" }, value: "4" },
      { label: { en: "Total Fixtures", es: "Total de Accesorios" }, value: "240+" },
      { label: { en: "Completion", es: "Terminación" }, value: "2022" },
    ],
  },
  {
    slug: "residencia-el-charco",
    title: "Residencia El Charco",
    location: { en: "San Miguel de Allende", es: "San Miguel de Allende" },
    architect: "Arq. David Torres Robles",
    type: { en: "Residential", es: "Residencial" },
    year: 2024,
    description: {
      en: "A hacienda-style estate with Sun Valley Bronze entry hardware, BLANCO kitchen sinks, and Badeloft freestanding tubs throughout.",
      es: "Una hacienda con herrajes Sun Valley Bronze, tarjas de cocina BLANCO y bañeras independientes Badeloft en toda la propiedad.",
    },
    longDescription: {
      en: "Residencia El Charco is a 6,800 sq ft hacienda-style estate on a two-acre parcel south of San Miguel de Allende. Architect David Torres Robles designed the home as a contemporary interpretation of traditional Mexican ranch architecture — thick adobe walls, exposed wooden beams, and deep covered portales wrapping the central courtyard.\n\nThe entry makes an immediate statement: Sun Valley Bronze Contemporary entry lock sets in Silicon Bronze on hand-carved mesquite doors. Inside, the kitchen features a BLANCO Ikon double-bowl apron sink in Anthracite paired with a California Faucets Davoli bridge faucet in Antique Brass.\n\nEach of the five bathrooms features a Badeloft freestanding bathtub. The master suite showcases an oval soaker beneath a skylight, while the guest casita uses the compact model with a floor-mounted California Faucets tub filler in Burnished Brass.",
      es: "Residencia El Charco es una hacienda de 630 m² en un terreno de 8,000 m² al sur de San Miguel de Allende. El arquitecto David Torres Robles diseñó la casa como una interpretación contemporánea de la arquitectura ranchera mexicana tradicional — muros gruesos de adobe, vigas de madera expuestas y portales profundos que envuelven el patio central.\n\nLa entrada hace una declaración inmediata: cerraduras de entrada Contemporary de Sun Valley Bronze en Bronce al Silicio sobre puertas de mezquite talladas a mano. Adentro, la cocina presenta una tarja doble BLANCO Ikon con mandil en Anthracite con una mezcladora puente Davoli de California Faucets en Latón Antiguo.\n\nCada uno de los cinco baños presenta una bañera independiente Badeloft. La suite principal muestra una bañera oval bajo un tragaluz, mientras que la casita de invitados usa el modelo compacto con un llenador de bañera de piso California Faucets en Latón Bruñido.",
    },
    heroImage: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=80",
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80",
        alt: { en: "Residencia El Charco courtyard", es: "Patio de Residencia El Charco" },
        caption: { en: "Central courtyard with covered portales", es: "Patio central con portales cubiertos" },
      },
      {
        src: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80",
        alt: { en: "Entry door hardware detail", es: "Detalle de herraje de puerta de entrada" },
        caption: { en: "Sun Valley Bronze Contemporary entry set in Silicon Bronze", es: "Cerradura Contemporary de Sun Valley Bronze en Bronce al Silicio" },
      },
      {
        src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",
        alt: { en: "Kitchen with BLANCO sink", es: "Cocina con tarja BLANCO" },
        caption: { en: "BLANCO Ikon Silgranit apron sink with California Faucets Davoli bridge faucet", es: "Tarja con mandil BLANCO Ikon Silgranit con mezcladora puente California Faucets Davoli" },
      },
      {
        src: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&q=80",
        alt: { en: "Master bathroom freestanding tub", es: "Bañera independiente del baño principal" },
        caption: { en: "Badeloft oval freestanding soaker beneath skylight", es: "Bañera oval Badeloft bajo tragaluz" },
      },
    ],
    brands: ["Sun Valley Bronze", "BLANCO", "Badeloft", "California Faucets"],
    fixtures: [
      { product: "Contemporary Entry Lock Set", brand: "Sun Valley Bronze", location: { en: "Main entry", es: "Entrada principal" }, slug: "sun-valley-bronze-contemporary-entry" },
      { product: "Ikon 30\" Silgranit Apron Sink", brand: "BLANCO", location: { en: "Kitchen", es: "Cocina" }, slug: "blanco-ikon-30-apron-sink" },
      { product: "Davoli Bridge Kitchen Faucet", brand: "California Faucets", location: { en: "Kitchen", es: "Cocina" }, slug: "california-faucets-davoli-bridge" },
      { product: "Freestanding Bathtub", brand: "Badeloft", location: { en: "5 bathrooms", es: "5 baños" }, slug: "badeloft-freestanding-bathtub" },
      { product: "Floor-Mount Tub Filler", brand: "California Faucets", location: { en: "Master suite", es: "Suite principal" }, slug: "california-faucets-floor-mount-tub-filler" },
    ],
    stats: [
      { label: { en: "Square Feet", es: "Metros Cuadrados" }, value: "6,800 ft² / 630 m²" },
      { label: { en: "Bathrooms", es: "Baños" }, value: "5" },
      { label: { en: "Fixtures Specified", es: "Accesorios Especificados" }, value: "52" },
      { label: { en: "Completion", es: "Terminación" }, value: "2024" },
    ],
  },
  {
    slug: "restaurante-lumbre",
    title: "Restaurante Lumbre",
    location: { en: "San Miguel de Allende", es: "San Miguel de Allende" },
    architect: "TAC Arquitectos",
    type: { en: "Commercial", es: "Comercial" },
    year: 2023,
    description: {
      en: "An open-kitchen concept restaurant with Brizo commercial-grade faucets and BLANCO Silgranit prep sinks designed for high-volume use.",
      es: "Un restaurante de cocina abierta con grifos Brizo de grado comercial y tarjas BLANCO Silgranit diseñadas para uso de alto volumen.",
    },
    longDescription: {
      en: "Restaurante Lumbre is a 120-seat fire-focused restaurant in San Miguel's Colonia Guadalupe, built around a central open kitchen with a wood-fired grill and plancha. TAC Arquitectos designed the space to celebrate the ritual of cooking — diners sit at counter heights surrounding the kitchen, watching every dish come to life.\n\nThe commercial kitchen demanded fixtures that could withstand 300+ covers per night. Counter Cultures specified Brizo Litze pull-down faucets in a commercial-grade configuration for the three prep stations, paired with BLANCO Silgranit undermount sinks in Coal Negro — chosen for their stain resistance and matte-black aesthetic that masks the wear of daily service.\n\nIn the restrooms, TOTO Drake toilets with WASHLET seats elevate the guest experience, while Ebbe Lattice square drains in matte black maintain the restaurant's dark, moody design language.",
      es: "Restaurante Lumbre es un restaurante de 120 asientos enfocado en fuego en la Colonia Guadalupe de San Miguel, construido alrededor de una cocina abierta central con parrilla y plancha de leña. TAC Arquitectos diseñó el espacio para celebrar el ritual de cocinar — los comensales se sientan a altura de barra rodeando la cocina, observando cada platillo cobrar vida.\n\nLa cocina comercial demandaba accesorios capaces de soportar más de 300 cubiertos por noche. Counter Cultures especificó grifos Brizo Litze extraíbles en configuración comercial para las tres estaciones de preparación, combinados con tarjas BLANCO Silgranit de bajo montar en Coal Negro — elegidas por su resistencia a manchas y estética negro mate que disimula el desgaste del servicio diario.\n\nEn los baños, sanitarios TOTO Drake con asientos WASHLET elevan la experiencia del comensal, mientras que drenajes cuadrados Ebbe Lattice en negro mate mantienen el lenguaje de diseño oscuro y dramático del restaurante.",
    },
    heroImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80",
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",
        alt: { en: "Restaurant open kitchen", es: "Cocina abierta del restaurante" },
        caption: { en: "Central open kitchen with wood-fired grill", es: "Cocina abierta central con parrilla de leña" },
      },
      {
        src: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1200&q=80",
        alt: { en: "Prep station detail", es: "Detalle de estación de preparación" },
        caption: { en: "Brizo Litze faucet over BLANCO Silgranit sink in Coal Negro", es: "Grifo Brizo Litze sobre tarja BLANCO Silgranit en Coal Negro" },
      },
      {
        src: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&q=80",
        alt: { en: "Restaurant restroom", es: "Baño del restaurante" },
        caption: { en: "Moody restroom with Ebbe Lattice drain and TOTO fixtures", es: "Baño con drenaje Ebbe Lattice y accesorios TOTO" },
      },
    ],
    brands: ["Brizo", "BLANCO", "TOTO", "Ebbe"],
    fixtures: [
      { product: "Litze Pull-Down Kitchen Faucet", brand: "Brizo", location: { en: "3 prep stations", es: "3 estaciones de preparación" }, slug: "brizo-litze-pull-down" },
      { product: "Ikon Silgranit Double Bowl Sink", brand: "BLANCO", location: { en: "Kitchen", es: "Cocina" }, slug: "blanco-ikon-double-bowl" },
      { product: "Drake Elongated Toilet", brand: "TOTO", location: { en: "Restrooms", es: "Baños" }, slug: "toto-drake-elongated" },
      { product: "Lattice Square Drain", brand: "Ebbe", location: { en: "Restrooms", es: "Baños" }, slug: "ebbe-lattice-drain" },
    ],
    stats: [
      { label: { en: "Seats", es: "Asientos" }, value: "120" },
      { label: { en: "Covers/Night", es: "Cubiertos/Noche" }, value: "300+" },
      { label: { en: "Prep Stations", es: "Estaciones de Prep." }, value: "3" },
      { label: { en: "Completion", es: "Terminación" }, value: "2023" },
    ],
  },
  {
    slug: "boutique-hotel-cantera",
    title: "Boutique Hotel Cantera",
    location: { en: "Querétaro", es: "Querétaro" },
    architect: "Arq. Sofía Villanueva",
    type: { en: "Hospitality", es: "Hotelería" },
    year: 2023,
    description: {
      en: "Cantera stone vessel sinks from Taller Piedra Viva paired with California Faucets' Descanso series in an antique brass finish.",
      es: "Lavabos vessel de cantera de Taller Piedra Viva combinados con la serie Descanso de California Faucets en acabado latón antiguo.",
    },
    longDescription: {
      en: "Boutique Hotel Cantera is a 16-room property in Querétaro's historic center, converted from a 19th-century cantera stone mansion. The design concept celebrates the building's materiality — every surface is a dialogue between ancient stone and contemporary comfort.\n\nEach guest room features a cantera rosa vessel sink, hand-carved by the artisans of Taller Piedra Viva in Querétaro, paired with a California Faucets Descanso single-hole faucet in Antique Brass. The contrast between the rough-hewn pink stone and the precision-machined brass creates a moment of tension that defines the hotel's character.\n\nThe suites feature Badeloft freestanding soakers positioned against original exposed-stone walls, with Brizo tub fillers in a custom Weathered Bronze finish sourced through Counter Cultures' special order program.",
      es: "Boutique Hotel Cantera es una propiedad de 16 habitaciones en el centro histórico de Querétaro, convertida de una mansión de cantera del siglo XIX. El concepto de diseño celebra la materialidad del edificio — cada superficie es un diálogo entre piedra antigua y comodidad contemporánea.\n\nCada habitación presenta un lavabo vessel de cantera rosa, tallado a mano por los artesanos de Taller Piedra Viva en Querétaro, combinado con un grifo Descanso monomando de California Faucets en Latón Antiguo. El contraste entre la piedra rosa tallada a mano y el latón maquinado con precisión crea un momento de tensión que define el carácter del hotel.\n\nLas suites presentan bañeras independientes Badeloft posicionadas contra los muros de piedra original expuesta, con llenadores de bañera Brizo en acabado Bronce Envejecido personalizado, obtenido a través del programa de pedidos especiales de Counter Cultures.",
    },
    heroImage: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1920&q=80",
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&q=80",
        alt: { en: "Hotel Cantera suite bathroom", es: "Baño de suite Hotel Cantera" },
        caption: { en: "Badeloft freestanding soaker against original cantera walls", es: "Bañera Badeloft contra muros originales de cantera" },
      },
      {
        src: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80",
        alt: { en: "Cantera vessel sink detail", es: "Detalle de lavabo vessel de cantera" },
        caption: { en: "Hand-carved cantera rosa vessel with California Faucets Descanso faucet", es: "Lavabo de cantera rosa tallado a mano con grifo California Faucets Descanso" },
      },
      {
        src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
        alt: { en: "Hotel Cantera courtyard", es: "Patio del Hotel Cantera" },
        caption: { en: "19th-century cantera mansion courtyard", es: "Patio de la mansión de cantera del siglo XIX" },
      },
    ],
    brands: ["California Faucets", "Counter Cultures Artisanal", "Badeloft", "Brizo"],
    fixtures: [
      { product: "Descanso Single-Hole Faucet", brand: "California Faucets", location: { en: "16 guest rooms", es: "16 habitaciones" }, slug: "california-faucets-descanso" },
      { product: "Freestanding Bathtub", brand: "Badeloft", location: { en: "Suites", es: "Suites" }, slug: "badeloft-freestanding-bathtub" },
      { product: "Wall-Mount Tub Filler", brand: "Brizo", location: { en: "Suites", es: "Suites" }, slug: "brizo-wall-mount-tub-filler" },
    ],
    stats: [
      { label: { en: "Guest Rooms", es: "Habitaciones" }, value: "16" },
      { label: { en: "Artisan Sinks", es: "Lavabos Artesanales" }, value: "16" },
      { label: { en: "Building Age", es: "Antigüedad" }, value: "1880s" },
      { label: { en: "Completion", es: "Terminación" }, value: "2023" },
    ],
  },
  {
    slug: "casa-del-parque",
    title: "Casa del Parque",
    location: { en: "San Miguel de Allende", es: "San Miguel de Allende" },
    architect: "Arq. Martín Ramírez",
    type: { en: "Residential", es: "Residencial" },
    year: 2024,
    description: {
      en: "A modern residence featuring Emtek door hardware throughout, Kohler Strive kitchen sinks, and Mistoa artisanal basins in the powder rooms.",
      es: "Una residencia moderna con herrajes Emtek, tarjas Kohler Strive y lavabos artesanales Mistoa en los medios baños.",
    },
    longDescription: {
      en: "Casa del Parque is a 3,600 sq ft modern residence perched above Parque Benito Juárez in San Miguel de Allende. Architect Martín Ramírez designed the home to frame views of the park's ancient trees from every room, using a restrained material palette of whitewashed stucco, terrazzo floors, and black steel window frames.\n\nThe hardware specification is all Emtek — Hampton Edition door knobs in Flat Black for all interior doors, with matching deadbolts on the entry. The kitchen features a Kohler Strive 24\" undermount sink with a Delta Trinsic pull-down faucet in Matte Black, continuing the monochromatic theme.\n\nThe two powder rooms are where the project comes alive: each features a Mistoa Surco artisanal basin in a different colorway — Carbon for the ground floor and Azul Profundo for the upper level — paired with California Faucets Christopher faucets in Matte Black.",
      es: "Casa del Parque es una residencia moderna de 335 m² sobre el Parque Benito Juárez en San Miguel de Allende. El arquitecto Martín Ramírez diseñó la casa para enmarcar vistas de los árboles antiguos del parque desde cada habitación, usando una paleta contenida de estuco encalado, pisos de terrazo y marcos de acero negro.\n\nLa especificación de herrajes es toda Emtek — perillas Hampton Edition en Negro Mate para todas las puertas interiores, con cerrojos coordinados en la entrada. La cocina presenta un fregadero Kohler Strive 24\" de bajo montar con una mezcladora Delta Trinsic extraíble en Negro Mate, continuando el tema monocromático.\n\nLos dos medios baños son donde el proyecto cobra vida: cada uno presenta un lavabo artesanal Mistoa Surco en un color diferente — Carbon para la planta baja y Azul Profundo para el nivel superior — combinado con grifos California Faucets Christopher en Negro Mate.",
    },
    heroImage: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1920&q=80",
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80",
        alt: { en: "Casa del Parque living area", es: "Sala de Casa del Parque" },
        caption: { en: "Open living area with park views through steel-frame windows", es: "Sala abierta con vistas al parque a través de ventanas de acero" },
      },
      {
        src: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80",
        alt: { en: "Emtek door hardware", es: "Herraje Emtek de puerta" },
        caption: { en: "Emtek Hampton Edition knobs in Flat Black", es: "Perillas Emtek Hampton Edition en Negro Mate" },
      },
      {
        src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",
        alt: { en: "Kitchen with Kohler sink", es: "Cocina con fregadero Kohler" },
        caption: { en: "Kohler Strive 24\" sink with Delta Trinsic faucet in Matte Black", es: "Fregadero Kohler Strive 24\" con mezcladora Delta Trinsic en Negro Mate" },
      },
      {
        src: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80",
        alt: { en: "Powder room with Mistoa basin", es: "Medio baño con lavabo Mistoa" },
        caption: { en: "Mistoa Surco basin in Azul Profundo with California Faucets Christopher faucet", es: "Lavabo Mistoa Surco en Azul Profundo con grifo California Faucets Christopher" },
      },
    ],
    brands: ["Emtek", "Kohler", "Mistoa", "California Faucets", "Delta"],
    fixtures: [
      { product: "Hampton Edition Door Knob", brand: "Emtek", location: { en: "All interior doors", es: "Todas las puertas interiores" }, slug: "emtek-hampton-knob" },
      { product: "Strive 24\" Undermount Kitchen Sink", brand: "Kohler", location: { en: "Kitchen", es: "Cocina" }, slug: "kohler-strive-24-sink" },
      { product: "Trinsic Pull-Down Kitchen Faucet", brand: "Delta", location: { en: "Kitchen", es: "Cocina" }, slug: "delta-trinsic-pull-down" },
      { product: "Surco Basin", brand: "Mistoa", location: { en: "2 powder rooms", es: "2 medios baños" }, slug: "mistoa-surco-basin" },
      { product: "Christopher Single-Hole Faucet", brand: "California Faucets", location: { en: "Powder rooms", es: "Medios baños" }, slug: "california-faucets-christopher" },
    ],
    stats: [
      { label: { en: "Square Feet", es: "Metros Cuadrados" }, value: "3,600 ft² / 335 m²" },
      { label: { en: "Bathrooms", es: "Baños" }, value: "3 + 2 powder" },
      { label: { en: "Fixtures Specified", es: "Accesorios Especificados" }, value: "28" },
      { label: { en: "Completion", es: "Terminación" }, value: "2024" },
    ],
  },
];

export const getProjectBySlug = (slug: string): Project | undefined =>
  PROJECTS.find((p) => p.slug === slug);
