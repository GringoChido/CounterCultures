#!/usr/bin/env node

// Generate new product entries for SAMPLE_PRODUCTS in app/lib/constants.ts
// Run: node scripts/generate-new-products.mjs > /tmp/new-products.ts

const products = [];
let nextId = 173;

function addProduct(p) {
  products.push({
    id: String(nextId++),
    sku: p.sku,
    slug: p.slug,
    brand: p.brand,
    name: p.name,
    nameEn: p.nameEn,
    category: p.category,
    subcategory: p.subcategory,
    price: Math.round(p.price),
    currency: "MXN",
    finishes: p.finishes,
    image: p.image,
    artisanal: p.artisanal || false,
    description: p.description,
    descriptionEn: p.descriptionEn,
  });
}

function cycleImage(basePath, index, total = 9) {
  const n = (index % total) + 1;
  return `${basePath}/product-${n}.jpg`;
}

// ─── BATHROOM: SINKS (IDs 173-177) ───
const vbSinkImages = [
  "/products/bano/lavabos/VB-Architectura-Rectangular.png",
  "/products/bano/lavabos/VB-Architectura-Rectangular.png",
  "/products/bano/lavabos/VB-Architectura-Ovalado.png",
  "/products/bano/lavabos/VB-Architectura-Ovalado.png",
  "/products/bano/lavabos/VB-Architectura-Ovalado.png",
];

const bathroomSinks = [
  {
    sku: "VB-ARCH-RECT-001",
    slug: "villeroy-boch-architectura-rectangular-sobrepuesto",
    name: "Lavabo Rectangular Sobrepuesto Villeroy & Boch Architectura",
    nameEn: "Villeroy & Boch Architectura Rectangular Countertop Basin",
    price: 5098.20,
    description: "Lavabo rectangular sobrepuesto de la coleccion Architectura de Villeroy & Boch, lineas limpias y acabado premium.",
    descriptionEn: "Rectangular countertop basin from Villeroy & Boch's Architectura collection, clean lines and premium finish.",
  },
  {
    sku: "VB-ARCH-RECT-002",
    slug: "villeroy-boch-architectura-rectangular-encastre",
    name: "Lavabo Rectangular de Encastre para Bano Villeroy & Boch Architectura",
    nameEn: "Villeroy & Boch Architectura Rectangular Built-In Basin",
    price: 4993.80,
    description: "Lavabo rectangular de encastre Architectura, ideal para instalaciones empotradas con diseno minimalista.",
    descriptionEn: "Architectura rectangular built-in basin, ideal for recessed installations with minimalist design.",
  },
  {
    sku: "VB-ARCH-CIRC-001",
    slug: "villeroy-boch-architectura-circular-sobrepuesto",
    name: "Lavabo Circular Sobrepuesto para Bano - Villeroy & Boch Architectura",
    nameEn: "Villeroy & Boch Architectura Circular Countertop Basin",
    price: 5504.23,
    description: "Lavabo circular sobrepuesto de porcelana, forma suave y elegante de la coleccion Architectura.",
    descriptionEn: "Circular porcelain countertop basin, soft elegant form from the Architectura collection.",
  },
  {
    sku: "VB-ARCH-CIRC-002",
    slug: "villeroy-boch-architectura-circular-encastre",
    name: "Lavabo Circular de Encastre Villeroy & Boch",
    nameEn: "Villeroy & Boch Circular Built-In Basin",
    price: 4600,
    description: "Lavabo circular de encastre Villeroy & Boch, acabado liso y geometria perfecta.",
    descriptionEn: "Villeroy & Boch circular built-in basin, smooth finish and perfect geometry.",
  },
  {
    sku: "VB-ARCH-CIRC-003",
    slug: "villeroy-boch-architectura-circular-bajocubierta",
    name: "Lavabo Circular de Bajocubierta para Bano Villeroy & Boch Architectura",
    nameEn: "Villeroy & Boch Architectura Circular Undermount Basin",
    price: 3880.20,
    description: "Lavabo circular de bajocubierta Architectura, instalacion limpia y perfil bajo.",
    descriptionEn: "Architectura circular undermount basin, clean installation and low profile.",
  },
];

bathroomSinks.forEach((s, i) => {
  addProduct({
    ...s,
    brand: "Villeroy & Boch",
    category: "bathroom",
    subcategory: "sinks",
    finishes: ["White Alpin", "Star White"],
    image: vbSinkImages[i],
  });
});

// ─── BATHROOM: FAUCETS (IDs 178-182) ───
const bathroomFaucets = [
  {
    sku: "CF-SOLIMAR-001",
    slug: "california-faucets-solimar-extended",
    brand: "California Faucets",
    name: "Grifo Extendido Para Lavabo California Faucets Solimar",
    nameEn: "California Faucets Solimar Extended Lavatory Faucet",
    price: 42550.25,
    description: "Grifo extendido de la serie Solimar de California Faucets, ideal para lavabos tipo vessel.",
    descriptionEn: "Extended faucet from California Faucets' Solimar series, ideal for vessel sinks.",
  },
  {
    sku: "BRIZO-ROOK-001",
    slug: "brizo-rook-cross-handle-faucet",
    brand: "Brizo",
    name: "Grifo para Bano con Manijas de Cruz Brizo Rook",
    nameEn: "Brizo Rook Cross Handle Bathroom Faucet",
    price: 21066.48,
    description: "Grifo de lavabo Brizo Rook con manijas de cruz, diseno transitional elegante.",
    descriptionEn: "Brizo Rook lavatory faucet with cross handles, elegant transitional design.",
  },
  {
    sku: "BRIZO-SIDERNA-WM-001",
    slug: "brizo-siderna-wall-mount-faucet",
    brand: "Brizo",
    name: "Grifo para Bano De Pared Brizo Siderna",
    nameEn: "Brizo Siderna Wall-Mount Bathroom Faucet",
    price: 21590.24,
    description: "Grifo de pared Brizo Siderna, estetica moderna y minimalista para banos contemporaneos.",
    descriptionEn: "Brizo Siderna wall-mount faucet, modern minimalist aesthetic for contemporary bathrooms.",
  },
  {
    sku: "BRIZO-SIDERNA-WS-001",
    slug: "brizo-siderna-widespread-faucet",
    brand: "Brizo",
    name: "Grifo Ancho para Bano Brizo Siderna",
    nameEn: "Brizo Siderna Widespread Bathroom Faucet",
    price: 19335.24,
    description: "Grifo widespread Brizo Siderna, lineas angulares y presencia escultorica.",
    descriptionEn: "Brizo Siderna widespread faucet, angular lines and sculptural presence.",
  },
  {
    sku: "BRIZO-VIRAGE-WM-001",
    slug: "brizo-virage-wall-mount-two-handle",
    brand: "Brizo",
    name: "Grifo De Pared De Dos Palancas Brizo Virage",
    nameEn: "Brizo Virage Two-Handle Wall-Mount Faucet",
    price: 15200.74,
    description: "Grifo de pared de dos palancas Brizo Virage, inspiracion Art Deco con acabado premium.",
    descriptionEn: "Brizo Virage two-handle wall-mount faucet, Art Deco inspiration with premium finish.",
  },
];

bathroomFaucets.forEach((f, i) => {
  addProduct({
    ...f,
    category: "bathroom",
    subcategory: "faucets",
    finishes: ["Polished Chrome", "Brilliance Luxe Nickel", "Matte Black", "Brilliance Polished Nickel"],
    image: cycleImage("/products/bano/grifos", i),
  });
});

// ─── BATHROOM: SPA (IDs 183-189) ───
const spaProducts = [
  { sku: "AQUA-FALLS-001", slug: "aquaspa-falls-spa-hidromasaje", name: "AquaSpa - Falls Spa con Hidromasaje", nameEn: "AquaSpa Falls Hydrotherapy Spa", price: 220632.25, description: "Spa Falls de AquaSpa con sistema de hidromasaje de multiples chorros para relajacion total.", descriptionEn: "AquaSpa Falls spa with multi-jet hydrotherapy system for total relaxation." },
  { sku: "AQUA-OCTAGON-001", slug: "aquaspa-octagon-spa-hidromasaje", name: "AquaSpa - Octagon Spa con Hidromasaje", nameEn: "AquaSpa Octagon Hydrotherapy Spa", price: 200781.25, description: "Spa octagonal AquaSpa con hidromasaje, diseno geometrico para espacios exteriores.", descriptionEn: "AquaSpa octagonal spa with hydrotherapy, geometric design for outdoor spaces." },
  { sku: "AQUA-OCEAN-001", slug: "aquaspa-ocean-spa-hidromasaje", name: "AquaSpa - Ocean Spa Con Hidromasaje", nameEn: "AquaSpa Ocean Hydrotherapy Spa", price: 208577.25, description: "Spa Ocean de AquaSpa, amplio y con sistema de hidromasaje avanzado.", descriptionEn: "AquaSpa Ocean spa, spacious with advanced hydrotherapy system." },
  { sku: "AQUA-HEAVEN-001", slug: "aquaspa-heaven-spa-hidromasaje", name: "AquaSpa - Spa Heaven Con Hidromasaje", nameEn: "AquaSpa Heaven Hydrotherapy Spa", price: 217848.25, description: "Spa Heaven de AquaSpa, experiencia de lujo con multiples zonas de hidromasaje.", descriptionEn: "AquaSpa Heaven spa, luxury experience with multiple hydrotherapy zones." },
  { sku: "AQUA-PARADISE-001", slug: "aquaspa-paradise-spa-hidromasaje", name: "AquaSpa - Paradise Spa Hidromasaje", nameEn: "AquaSpa Paradise Hydrotherapy Spa", price: 286615.25, description: "Spa Paradise de AquaSpa, capacidad para 6 personas con sistema de chorros premium.", descriptionEn: "AquaSpa Paradise spa, 6-person capacity with premium jet system." },
  { sku: "AQUA-JUMBO-001", slug: "aquaspa-jumbo-spa-hidromasaje", name: "AquaSpa - Jumbo Spa con Hidromasaje", nameEn: "AquaSpa Jumbo Hydrotherapy Spa", price: 289362.25, description: "El spa mas grande de AquaSpa, ideal para familias con sistema de hidromasaje completo.", descriptionEn: "AquaSpa's largest spa, ideal for families with complete hydrotherapy system." },
  { sku: "AQUA-DUBAI-001", slug: "aquaspa-dubai-spa-hidromasaje", name: "AquaSpa - Dubai Spa con Hidromasaje", nameEn: "AquaSpa Dubai Hydrotherapy Spa", price: 184930.25, description: "Spa Dubai de AquaSpa, diseno compacto con hidromasaje de alto rendimiento.", descriptionEn: "AquaSpa Dubai spa, compact design with high-performance hydrotherapy." },
];

spaProducts.forEach((s, i) => {
  addProduct({
    ...s,
    brand: "AquaSpa",
    category: "bathroom",
    subcategory: "spa",
    finishes: ["White", "Grey"],
    image: cycleImage("/products/bano/spa", i),
  });
});

// ─── BATHROOM: TOILETS (IDs 190-271) ───
const totoFinishes = ["Cotton White", "Bone", "Colonial White", "Sedona Beige", "Ebony"];

const toiletData = [
  { sku: "TOTO-CONN-S5-001", slug: "toto-connelly-washlet-s5-inodoro-de-dos-piezas-128-gpf09-gpf", name: "TOTO Connelly WASHLET+ S5 Inodoro de dos piezas 1.28 GPF/0.9 GPF", nameEn: "TOTO Connelly WASHLET+ S5 Two-Piece Toilet 1.28 GPF/0.9 GPF", price: 45170 },
  { sku: "TOTO-CONN-S2-001", slug: "toto-connelly-washlet-s2-inodoro-de-dos-piezas-128-gpf09-gpf", name: "TOTO Connelly WASHLET+ S2 Inodoro de dos piezas 1.28 GPF/0.9 GPF", nameEn: "TOTO Connelly WASHLET+ S2 Two-Piece Toilet 1.28 GPF/0.9 GPF", price: 40739 },
  { sku: "TOTO-DRAKE-S7-UH-001", slug: "toto-drake-washlet-s7-indoro-de-dos-piezas-128-gpf-altura-universal", name: "TOTO Drake WASHLET+ S7 Inodoro de dos piezas 1.28 GPF Altura Universal", nameEn: "TOTO Drake WASHLET+ S7 Two-Piece Toilet 1.28 GPF Universal Height", price: 52200 },
  { sku: "TOTO-DRAKE-S7-001", slug: "toto-drake-washlet-s7-inodoro-de-dos-piezas-128-gpf", name: "TOTO Drake WASHLET+ S7 Inodoro de dos piezas 1.28 GPF", nameEn: "TOTO Drake WASHLET+ S7 Two-Piece Toilet 1.28 GPF", price: 50854 },
  { sku: "TOTO-DRAKE-S5-16-UH-001", slug: "toto-drake-washlet-s5-inodoro-de-dos-piezas-16-gpf-altura-universal", name: "TOTO Drake WASHLET+ S5 Inodoro de dos piezas 1.6 GPF Altura Universal", nameEn: "TOTO Drake WASHLET+ S5 Two-Piece Toilet 1.6 GPF Universal Height", price: 33338 },
  { sku: "TOTO-DRAKE-S5-16-001", slug: "toto-drake-washlet-s5-inodoro-de-dos-piezas-16-gpf", name: "TOTO Drake WASHLET+ S5 Inodoro de dos piezas 1.6 GPF", nameEn: "TOTO Drake WASHLET+ S5 Two-Piece Toilet 1.6 GPF", price: 31992 },
  { sku: "TOTO-DRAKE-S5-128-001", slug: "toto-drake-washlet-s5-inodoro-de-dos-piezas-128-gpf", name: "TOTO Drake WASHLET+ S5 Inodoro de dos piezas 1.28 GPF", nameEn: "TOTO Drake WASHLET+ S5 Two-Piece Toilet 1.28 GPF", price: 31946 },
  { sku: "TOTO-DRAKE-S2-16-UH-001", slug: "toto-drake-washlet-s2-inodoro-de-dos-piezas-16-gpf-altura-universal", name: "TOTO Drake WASHLET+ S2 Inodoro de dos piezas 1.6 GPF Altura Universal", nameEn: "TOTO Drake WASHLET+ S2 Two-Piece Toilet 1.6 GPF Universal Height", price: 28907 },
  { sku: "TOTO-DRAKE-RND-001", slug: "toto-drake-inodoro-de-dos-piezas-128-gpf-round-bowl-universal-height", name: "TOTO Drake Inodoro de dos piezas 1.28 GPF Round Bowl Universal Height", nameEn: "TOTO Drake Two-Piece Toilet 1.28 GPF Round Bowl Universal Height", price: 27561 },
  { sku: "TOTO-CONN-EB-001", slug: "toto-connelly-inodoro-de-dos-piezas-128-gpf-09-gpf-elongated-bowl", name: "TOTO Connelly Inodoro de dos piezas 1.28 GPF 0.9 GPF Elongated Bowl", nameEn: "TOTO Connelly Two-Piece Toilet 1.28 GPF 0.9 GPF Elongated Bowl", price: 20323 },
  { sku: "TOTO-DRAKE-EL-UH-001", slug: "toto-drake-inodoro-de-dos-piezas-128-gpf-taza-alargada-altura-universal", name: "TOTO Drake Inodoro de dos piezas 1.28 GPF Taza Alargada Altura Universal", nameEn: "TOTO Drake Two-Piece Toilet 1.28 GPF Elongated Bowl Universal Height", price: 14523 },
  { sku: "TOTO-DRAKE-EL-001", slug: "toto-drake-inodoro-de-dos-piezas-128-gpf-elongated-bowl", name: "TOTO Drake Inodoro de dos piezas 1.28 GPF Elongated Bowl", nameEn: "TOTO Drake Two-Piece Toilet 1.28 GPF Elongated Bowl", price: 13177 },
  { sku: "TOTO-DRKT-S7A-UH-001", slug: "toto-drake-transitional-washlet-s7a-inodoro-de-dos-piezas-128-gpf-altura-universal", name: "TOTO Drake Transitional WASHLET+ S7A Inodoro de dos piezas 1.28 GPF Altura Universal", nameEn: "TOTO Drake Transitional WASHLET+ S7A Two-Piece Toilet 1.28 GPF Universal Height", price: 57652 },
  { sku: "TOTO-DRKT-S7A-001", slug: "drake-transitional-washlet-s7a-inodoro-de-so-piezas-128-gpf", name: "Drake Transitional WASHLET+ S7A Inodoro de dos piezas 1.28 GPF", nameEn: "Drake Transitional WASHLET+ S7A Two-Piece Toilet 1.28 GPF", price: 56306 },
  { sku: "TOTO-DRKT-S7-UH-001", slug: "toto-drake-transitional-washlet-s7-inodoro-de-dos-piezas-128-gpf-altura-universal", name: "TOTO Drake Transitional WASHLET+ S7 Inodoro de dos piezas 1.28 GPF Altura Universal", nameEn: "TOTO Drake Transitional WASHLET+ S7 Two-Piece Toilet 1.28 GPF Universal Height", price: 53684 },
  { sku: "TOTO-DRKT-BASE-001", slug: "toto-drake-transitional-inodoro-de-dos-piezas-128-gpf-asiento-alargado", name: "TOTO Drake Transitional Inodoro de dos piezas 1.28 GPF Asiento Alargado", nameEn: "TOTO Drake Transitional Two-Piece Toilet 1.28 GPF Elongated Seat", price: 14662 },
  { sku: "TOTO-DRKII-S7A-128-001", slug: "toto-drake-ii-washlet-s7a-inodoro-de-dos-piezas-128-gpf", name: "TOTO Drake II WASHLET+ S7A Inodoro de dos piezas 1.28 GPF", nameEn: "TOTO Drake II WASHLET+ S7A Two-Piece Toilet 1.28 GPF", price: 64821 },
  { sku: "TOTO-DRKII-S7A-10-001", slug: "toto-drake-ii-washlet-s7a-inodoro-de-dos-piezas-10-gpf", name: "TOTO Drake II WASHLET+ S7A Inodoro de dos piezas 1.0 GPF", nameEn: "TOTO Drake II WASHLET+ S7A Two-Piece Toilet 1.0 GPF", price: 65494 },
  { sku: "TOTO-DRKII-S7-128-001", slug: "toto-drake-ii-washlet-s7-inodoro-de-dos-piezas-128-gpf", name: "TOTO Drake II WASHLET+ S7 Inodoro de dos piezas 1.28 GPF", nameEn: "TOTO Drake II WASHLET+ S7 Two-Piece Toilet 1.28 GPF", price: 60853 },
  { sku: "TOTO-DRKII-S7-10-001", slug: "toto-drake-ii-washlet-s7-inodoro-de-dos-piezas-10-gpf", name: "TOTO Drake II WASHLET+ S7 Inodoro de dos piezas 1.0 GPF", nameEn: "TOTO Drake II WASHLET+ S7 Two-Piece Toilet 1.0 GPF", price: 61526 },
  { sku: "TOTO-DRKII-S5-001", slug: "toto-drake-ii-washlet-s5-inodoro-de-dos-piezas-128-gpf", name: "TOTO Drake II WASHLET+ S5 Inodoro de dos piezas 1.28 GPF", nameEn: "TOTO Drake II WASHLET+ S5 Two-Piece Toilet 1.28 GPF", price: 41945 },
  { sku: "TOTO-DRKII-S2-001", slug: "toto-drake-ii-washlet-s2-inodoro-de-dos-piezas-128-gpf", name: "TOTO Drake II WASHLET+ S2 Inodoro de dos piezas 1.28 GPF", nameEn: "TOTO Drake II WASHLET+ S2 Two-Piece Toilet 1.28 GPF", price: 37514 },
  { sku: "TOTO-DRKII-C5-001", slug: "toto-drake-ii-washlet-c5-inodoro-de-dos-piezas-128-gpf", name: "TOTO Drake II WASHLET+ C5 Inodoro de dos piezas 1.28 GPF", nameEn: "TOTO Drake II WASHLET+ C5 Two-Piece Toilet 1.28 GPF", price: 40995 },
  { sku: "TOTO-DRKII-C2-001", slug: "toto-drake-ii-washlet-c2-inodoro-de-dos-piezas-128-gpf", name: "TOTO Drake II WASHLET+ C2 Inodoro de dos piezas 1.28 GPF", nameEn: "TOTO Drake II WASHLET+ C2 Two-Piece Toilet 1.28 GPF", price: 38210 },
  { sku: "TOTO-DRKII-EL-001", slug: "toto-drake-ii-inodoro-de-dos-piezas-128-gpf-taza-alargada", name: "TOTO Drake II Inodoro de dos piezas 1.28 GPF Taza Alargada", nameEn: "TOTO Drake II Two-Piece Toilet 1.28 GPF Elongated Bowl", price: 20323 },
  { sku: "TOTO-DRKII-BASE-001", slug: "toto-drake-ii-inodoro-de-dos-piezas-128-gpf", name: "TOTO Drake II Inodoro de dos piezas 1.28 GPF", nameEn: "TOTO Drake II Two-Piece Toilet 1.28 GPF", price: 20648 },
  { sku: "TOTO-CONN-WC-SLIM-001", slug: "toto-connelly-inodoro-de-dos-piezas-128-gpf-09-gpf-washlet-connection-asiento-delgado", name: "TOTO Connelly Inodoro de dos piezas 1.28 GPF 0.9 GPF WASHLET+ Asiento Delgado", nameEn: "TOTO Connelly Two-Piece Toilet 1.28 GPF 0.9 GPF WASHLET+ Slim Seat", price: 30647 },
  { sku: "TOTO-CONN-WC-001", slug: "toto-connelly-inodoro-de-dos-piezas-128-gpf-09-gpf-washlet-connection", name: "TOTO Connelly Inodoro de dos piezas 1.28 GPF 0.9 GPF WASHLET+ Connection", nameEn: "TOTO Connelly Two-Piece Toilet 1.28 GPF 0.9 GPF WASHLET+ Connection", price: 26100 },
  { sku: "TOTO-CONN-S7A-001", slug: "toto-connelly-washlet-s7a-inodoro-de-dos-piezas-128-gpf-09-gpf", name: "TOTO Connelly WASHLET+ S7A Inodoro de dos piezas 1.28 GPF 0.9 GPF", nameEn: "TOTO Connelly WASHLET+ S7A Two-Piece Toilet 1.28 GPF 0.9 GPF", price: 72337 },
  { sku: "TOTO-CONN-S7-001", slug: "toto-connelly-washlet-s7-inodoro-de-dos-piezas-128-gpf-09-gpf", name: "TOTO Connelly WASHLET+ S7 Inodoro de dos piezas 1.28 GPF 0.9 GPF", nameEn: "TOTO Connelly WASHLET+ S7 Two-Piece Toilet 1.28 GPF 0.9 GPF", price: 68370 },
  { sku: "TOTO-CONN-S550E-001", slug: "toto-connelly-washlet-s550e-inodoro-de-dos-piezas-128-gpf-09-gpf", name: "TOTO Connelly WASHLET+ S550e Inodoro de dos piezas 1.28 GPF 0.9 GPF", nameEn: "TOTO Connelly WASHLET+ S550e Two-Piece Toilet 1.28 GPF 0.9 GPF", price: 67303 },
  { sku: "TOTO-CONN-S500E-001", slug: "toto-connelly-washlet-s500e-inodoro-de-doz-piezas-128-gpf-09-gpf", name: "TOTO Connelly WASHLET+ S500e Inodoro de dos piezas 1.28 GPF 0.9 GPF", nameEn: "TOTO Connelly WASHLET+ S500e Two-Piece Toilet 1.28 GPF 0.9 GPF", price: 61016 },
  { sku: "TOTO-CARLII-S7A-10-001", slug: "toto-carlyle-ii-washlet-s7a-inodoro-de-una-pieza-10-gpf", name: "TOTO Carlyle II WASHLET+ S7A Inodoro de una pieza 1.0 GPF", nameEn: "TOTO Carlyle II WASHLET+ S7A One-Piece Toilet 1.0 GPF", price: 73033 },
  { sku: "TOTO-CARLII-S7-128-001", slug: "toto-carlyle-ii-washlet-s7-inodoro-de-una-pieza-128-gpf", name: "TOTO Carlyle II WASHLET+ S7 Inodoro de una pieza 1.28 GPF", nameEn: "TOTO Carlyle II WASHLET+ S7 One-Piece Toilet 1.28 GPF", price: 68556 },
  { sku: "TOTO-CARLII-S7-10-001", slug: "toto-carlyle-ii-washlet-s7-inodoro-de-una-pieza-10-gpf", name: "TOTO Carlyle II WASHLET+ S7 Inodoro de una pieza 1.0 GPF", nameEn: "TOTO Carlyle II WASHLET+ S7 One-Piece Toilet 1.0 GPF", price: 69066 },
  { sku: "TOTO-CARLII-S5-001", slug: "toto-carlyle-ii-washlet-s5-inodoro-de-una-pieza-128-gpf", name: "TOTO Carlyle II WASHLET+ S5 Inodoro de una pieza 1.28 GPF", nameEn: "TOTO Carlyle II WASHLET+ S5 One-Piece Toilet 1.28 GPF", price: 45356 },
  { sku: "TOTO-CARLII-S2-001", slug: "toto-carlyle-ii-washlet-s2-inodoro-de-una-pieza-128-gpf", name: "TOTO Carlyle II WASHLET+ S2 Inodoro de una pieza 1.28 GPF", nameEn: "TOTO Carlyle II WASHLET+ S2 One-Piece Toilet 1.28 GPF", price: 40924 },
  { sku: "TOTO-CARLII-WC-001", slug: "68-toto-carlyle-ii-inodoro-de-una-pieza-128-gpf-washlet-connection", name: "TOTO Carlyle II Inodoro de una pieza 1.28 GPF WASHLET+ Connection", nameEn: "TOTO Carlyle II One-Piece Toilet 1.28 GPF WASHLET+ Connection", price: 23292 },
  { sku: "TOTO-CARLII-1G-S5-001", slug: "toto-carlyle-ii-1g-washlet-s5-inodoro-de-una-pieza-10-gpf", name: "TOTO Carlyle II 1G WASHLET+ S5 Inodoro de una pieza 1.0 GPF", nameEn: "TOTO Carlyle II 1G WASHLET+ S5 One-Piece Toilet 1.0 GPF", price: 45866 },
  { sku: "TOTO-CARLII-1G-S2-001", slug: "toto-carlyle-ii-1g-washlet-s2-inodoro-de-una-pieza-10-gpf", name: "TOTO Carlyle II 1G WASHLET+ S2 Inodoro de una pieza 1.0 GPF", nameEn: "TOTO Carlyle II 1G WASHLET+ S2 One-Piece Toilet 1.0 GPF", price: 41435 },
  { sku: "TOTO-CONN-C5-001", slug: "toto-connelly-washlet-c5-inodoro-de-dos-piezas-128-gpf-09-gpf", name: "TOTO Connelly WASHLET+ C5 Inodoro de dos piezas 1.28 GPF 0.9 GPF", nameEn: "TOTO Connelly WASHLET+ C5 Two-Piece Toilet 1.28 GPF 0.9 GPF", price: 44219 },
  { sku: "TOTO-CONN-C2-001", slug: "toto-connelly-washlet-c2-inodoro-de-dos-piezas-128-gpf-09-gpf", name: "TOTO Connelly WASHLET+ C2 Inodoro de dos piezas 1.28 GPF 0.9 GPF", nameEn: "TOTO Connelly WASHLET+ C2 Two-Piece Toilet 1.28 GPF 0.9 GPF", price: 41435 },
  { sku: "TOTO-CAROLII-S7A-001", slug: "toto-carolina-ii-washlet-s7a-inodoro-de-una-pieza-128-gpf", name: "TOTO Carolina II WASHLET+ S7A Inodoro de una pieza 1.28 GPF", nameEn: "TOTO Carolina II WASHLET+ S7A One-Piece Toilet 1.28 GPF", price: 78091 },
  { sku: "TOTO-CAROLII-S7-001", slug: "toto-carolina-ii-washlet-s7-inodoro-de-una-pieza-128-gpf", name: "TOTO Carolina II WASHLET+ S7 Inodoro de una pieza 1.28 GPF", nameEn: "TOTO Carolina II WASHLET+ S7 One-Piece Toilet 1.28 GPF", price: 74124 },
  { sku: "TOTO-CAROLII-S2-001", slug: "toto-carolina-ii-washlet-s2-inodoro-de-una-pieza-128-gpf", name: "TOTO Carolina II WASHLET+ S2 Inodoro de una pieza 1.28 GPF", nameEn: "TOTO Carolina II WASHLET+ S2 One-Piece Toilet 1.28 GPF", price: 50784 },
  { sku: "TOTO-CAROLII-C5-001", slug: "toto-carolina-ii-washlet-c5-inodoro-de-una-pieza-128-gpf", name: "TOTO Carolina II WASHLET+ C5 Inodoro de una pieza 1.28 GPF", nameEn: "TOTO Carolina II WASHLET+ C5 One-Piece Toilet 1.28 GPF", price: 54264 },
  { sku: "TOTO-CARLII-1G-WC-001", slug: "toto-compare-product-carlyle-ii-1g-inodoro-de-una-pieza-10-gpf-washlet-connection", name: "TOTO Carlyle II 1G Inodoro de una pieza 1.0 GPF WASHLET+ Connection", nameEn: "TOTO Carlyle II 1G One-Piece Toilet 1.0 GPF WASHLET+ Connection", price: 23733 },
  { sku: "TOTO-CARLII-1G-C5-001", slug: "toto-carlyle-ii-1g-washlet-c5-inodoro-de-una-pieza-10-gpf", name: "TOTO Carlyle II 1G WASHLET+ C5 Inodoro de una pieza 1.0 GPF", nameEn: "TOTO Carlyle II 1G WASHLET+ C5 One-Piece Toilet 1.0 GPF", price: 44915 },
  { sku: "TOTO-CARLII-1G-C2-001", slug: "toto-carlyle-ii-1g-washlet-c2-inodoro-de-una-pieza-10-gpf", name: "TOTO Carlyle II 1G WASHLET+ C2 Inodoro de una pieza 1.0 GPF", nameEn: "TOTO Carlyle II 1G WASHLET+ C2 One-Piece Toilet 1.0 GPF", price: 42131 },
  { sku: "TOTO-CARLII-C5-001", slug: "toto-carlyle-ii-washlet-c5-inodoro-de-una-pieza-128-gpf", name: "TOTO Carlyle II WASHLET+ C5 Inodoro de una pieza 1.28 GPF", nameEn: "TOTO Carlyle II WASHLET+ C5 One-Piece Toilet 1.28 GPF", price: 44404 },
  { sku: "TOTO-CARLII-C2-001", slug: "toto-carlyle-ii-washlet-c2-inodoro-de-una-pieza-128-gpf", name: "TOTO Carlyle II WASHLET+ C2 Inodoro de una pieza 1.28 GPF", nameEn: "TOTO Carlyle II WASHLET+ C2 One-Piece Toilet 1.28 GPF", price: 41620 },
  { sku: "TOTO-AQIV-1P-WC-001", slug: "toto-aquia-iv-inodoro-de-una-pieza-128-gpf-09-gpf-taza-alargada-washlet-connection", name: "TOTO Aquia IV Inodoro de una pieza 1.28 GPF 0.9 GPF WASHLET+ Connection", nameEn: "TOTO Aquia IV One-Piece Toilet 1.28 GPF 0.9 GPF WASHLET+ Connection", price: 29672 },
  { sku: "TOTO-AQIV-1P-SLIM-001", slug: "toto-aquia-iv-inodoro-de-una-pieza-128-gpf-09-gpf-taza-alargada-washlet-asiento-delgado", name: "TOTO Aquia IV Inodoro de una pieza 1.28 GPF 0.9 GPF WASHLET+ Asiento Delgado", nameEn: "TOTO Aquia IV One-Piece Toilet 1.28 GPF 0.9 GPF WASHLET+ Slim Seat", price: 38372 },
  { sku: "TOTO-AQIV-CUBE-S5-001", slug: "toto-aquia-iv-cube-washlet-s5-inodoro-de-dos-piezas-128-gpf09-gpf", name: "TOTO Aquia IV Cube WASHLET+ S5 Inodoro de dos piezas 1.28 GPF/0.9 GPF", nameEn: "TOTO Aquia IV Cube WASHLET+ S5 Two-Piece Toilet 1.28 GPF/0.9 GPF", price: 45889 },
  { sku: "TOTO-CAROLII-WC-001", slug: "toto-carolina-ii-inodoro-de-una-pieza-taza-alargada-128-gpf-coneccin-washlet", name: "TOTO Carolina II Inodoro de una pieza Taza Alargada 1.28 GPF WASHLET+", nameEn: "TOTO Carolina II One-Piece Toilet Elongated Bowl 1.28 GPF WASHLET+", price: 31946 },
  { sku: "TOTO-CARLII-S7A-128-001", slug: "toto-carlyle-ii-washlet-s7a-inodoro-de-una-pieza-128-gpf", name: "TOTO Carlyle II WASHLET+ S7A Inodoro de una pieza 1.28 GPF", nameEn: "TOTO Carlyle II WASHLET+ S7A One-Piece Toilet 1.28 GPF", price: 68231 },
  { sku: "TOTO-AQIV-1P-S5-001", slug: "toto-aquia-iv-washlet-s5-inodoro-de-una-pieza-128-gpf09-gpf", name: "TOTO Aquia IV WASHLET+ S5 Inodoro de una pieza 1.28 GPF/0.9 GPF", nameEn: "TOTO Aquia IV WASHLET+ S5 One-Piece Toilet 1.28 GPF/0.9 GPF", price: 52571 },
  { sku: "TOTO-AQIV-1P-S2-001", slug: "toto-aquia-iv-washlet-s2-inodoro-de-una-pieza-128-gpf09-gpf", name: "TOTO Aquia IV WASHLET+ S2 Inodoro de una pieza 1.28 GPF/0.9 GPF", nameEn: "TOTO Aquia IV WASHLET+ S2 One-Piece Toilet 1.28 GPF/0.9 GPF", price: 48140 },
  { sku: "TOTO-AQIV-UH-WC-001", slug: "toto-aquia-iv-inodoro-128-gpf-09-gpf-altura-universal-coneccin-washlet", name: "TOTO Aquia IV Inodoro 1.28 GPF 0.9 GPF Altura Universal WASHLET+", nameEn: "TOTO Aquia IV Toilet 1.28 GPF 0.9 GPF Universal Height WASHLET+", price: 22457 },
  { sku: "TOTO-AQIV-CUBE-UH-001", slug: "ah4o8ppn0gj0otans4tmjjblmklmmi", name: "TOTO Aquia IV Cube Toilet 1.28 GPF 0.9 GPF Altura Universal", nameEn: "TOTO Aquia IV Cube Toilet 1.28 GPF 0.9 GPF Universal Height", price: 26819 },
  { sku: "TOTO-AQIV-CUBE-S7A-001", slug: "4h142grropa8oexjouw62f3kb2m6ow", name: "TOTO Aquia IV Cube WASHLET+ S7A Inodoro de dos piezas 1.28 GPF 0.9 GPF", nameEn: "TOTO Aquia IV Cube WASHLET+ S7A Two-Piece Toilet 1.28 GPF 0.9 GPF", price: 73056 },
  { sku: "TOTO-AQIV-CUBE-S7-001", slug: "aquia-iv-cube-washlet-s7-inodoro-de-dos-piezas-128-gpf-09-gpf", name: "TOTO Aquia IV Cube WASHLET+ S7 Inodoro de dos piezas 1.28 GPF 0.9 GPF", nameEn: "TOTO Aquia IV Cube WASHLET+ S7 Two-Piece Toilet 1.28 GPF 0.9 GPF", price: 69089 },
  { sku: "TOTO-AQIV-CUBE-S550E-001", slug: "toto-aquia-iv-cube-washlet-s550e-inodoro-de-dos-piezas-128-gpf-09-gpf", name: "TOTO Aquia IV Cube WASHLET+ S550e Inodoro de dos piezas 1.28 GPF 0.9 GPF", nameEn: "TOTO Aquia IV Cube WASHLET+ S550e Two-Piece Toilet 1.28 GPF 0.9 GPF", price: 69275 },
  { sku: "TOTO-AQIV-CUBE-S500E-001", slug: "toto-aquia-iv-cube-washlet-s500e-inodoro-de-dos-piezas-128-gpf-09-gpf", name: "TOTO Aquia IV Cube WASHLET+ S500e Inodoro de dos piezas 1.28 GPF 0.9 GPF", nameEn: "TOTO Aquia IV Cube WASHLET+ S500e Two-Piece Toilet 1.28 GPF 0.9 GPF", price: 67512 },
  { sku: "TOTO-AQIV-CUBE-C5-001", slug: "toto-aquia-iv-cube-washlet-c5-inodoro-de-dos-piezas-128-gpf-09-gpf", name: "TOTO Aquia IV Cube WASHLET+ C5 Inodoro de dos piezas 1.28 GPF 0.9 GPF", nameEn: "TOTO Aquia IV Cube WASHLET+ C5 Two-Piece Toilet 1.28 GPF 0.9 GPF", price: 44938 },
  { sku: "TOTO-AQIV-CUBE-C2-001", slug: "toto-aquia-iv-cube-washlet-c2-inodoro-de-dos-piezas-128-gpf-09-gpf", name: "TOTO Aquia IV Cube WASHLET+ C2 Inodoro de dos piezas 1.28 GPF 0.9 GPF", nameEn: "TOTO Aquia IV Cube WASHLET+ C2 Two-Piece Toilet 1.28 GPF 0.9 GPF", price: 42154 },
  { sku: "TOTO-AQIV-ARC-S5-001", slug: "compare-product-aquia-iv-arc-washlet-s5-inodoro-de-dos-piezas-128-gpf09-gpf", name: "TOTO Aquia IV Arc WASHLET+ S5 Inodoro de dos piezas 1.28 GPF/0.9 GPF", nameEn: "TOTO Aquia IV Arc WASHLET+ S5 Two-Piece Toilet 1.28 GPF/0.9 GPF", price: 45889 },
  { sku: "TOTO-AQIV-EL-UH-001", slug: "toto-aquia-iv-inodoro-128-gpf-09-gpf-taza-alargada-altura-universal", name: "TOTO Aquia IV Inodoro 1.28 GPF 0.9 GPF Taza Alargada Altura Universal", nameEn: "TOTO Aquia IV Toilet 1.28 GPF 0.9 GPF Elongated Bowl Universal Height", price: 22411 },
  { sku: "TOTO-AQIV-EL-001", slug: "toto-aquia-iv-toilet-128-gpf-09-gpf-taza-alargada", name: "TOTO Aquia IV Toilet 1.28 GPF 0.9 GPF Taza Alargada", nameEn: "TOTO Aquia IV Toilet 1.28 GPF 0.9 GPF Elongated Bowl", price: 21065 },
  { sku: "TOTO-AQIV-ARC-S2-001", slug: "toto-aquia-iv-arc-washlet-s2-inodoro-de-dos-piezas-128-gpf09-gpf", name: "TOTO Aquia IV Arc WASHLET+ S2 Inodoro de dos piezas 1.28 GPF/0.9 GPF", nameEn: "TOTO Aquia IV Arc WASHLET+ S2 Two-Piece Toilet 1.28 GPF/0.9 GPF", price: 41458 },
  { sku: "TOTO-AQIV-ARC-UH-WC-001", slug: "aquia-iv-arc-inodoro-128-gpf-09-gpf-altura-universal-coneccin-washlet", name: "Aquia IV Arc Inodoro 1.28 GPF 0.9 GPF Altura Universal WASHLET+", nameEn: "Aquia IV Arc Toilet 1.28 GPF 0.9 GPF Universal Height WASHLET+", price: 26819 },
  { sku: "TOTO-AQIV-ARC-S7A-UH-001", slug: "toto-aquia-iv-arc-washlet-s7a-inodoro-de-dos-piezas-128-gpf-09-gpf-altura-universal", name: "TOTO Aquia IV Arc WASHLET+ S7A Inodoro de dos piezas 1.28 GPF 0.9 GPF Altura Universal", nameEn: "TOTO Aquia IV Arc WASHLET+ S7A Two-Piece Toilet 1.28 GPF 0.9 GPF Universal Height", price: 68765 },
  { sku: "TOTO-AQIV-S7A-UH-001", slug: "toto-aquia-iv-washlet-s7a-inodoro-de-dos-piezas-128-gpf-09-gpf-altura-universal", name: "TOTO Aquia IV WASHLET+ S7A Inodoro de dos piezas 1.28 GPF 0.9 GPF Altura Universal", nameEn: "TOTO Aquia IV WASHLET+ S7A Two-Piece Toilet 1.28 GPF 0.9 GPF Universal Height", price: 67210 },
  { sku: "TOTO-AQIV-S7A-001", slug: "toto-aquia-iv-washlet-s7a-inodoro-de-dos-piezas-128-gpf-09-gpf", name: "TOTO Aquia IV WASHLET+ S7A Inodoro de dos piezas 1.28 GPF 0.9 GPF", nameEn: "TOTO Aquia IV WASHLET+ S7A Two-Piece Toilet 1.28 GPF 0.9 GPF", price: 65864 },
  { sku: "TOTO-AQIV-1P-S7A-001", slug: "toto-aquia-iv-washlet-s7a-inodoro-de-una-pieza-128-gpf-09-gpf", name: "TOTO Aquia IV WASHLET+ S7A Inodoro de una pieza 1.28 GPF 0.9 GPF", nameEn: "TOTO Aquia IV WASHLET+ S7A One-Piece Toilet 1.28 GPF 0.9 GPF", price: 75446 },
  { sku: "TOTO-AP-S7A-AF-001", slug: "toto-inodoro-suspendido-ap-washlet-s7a-128-gpf-09-gpf-auto-flush", name: "TOTO AP Inodoro Suspendido WASHLET+ S7A 1.28 GPF 0.9 GPF Auto Flush", nameEn: "TOTO AP Wall-Hung Toilet WASHLET+ S7A 1.28 GPF 0.9 GPF Auto Flush", price: 103588 },
  { sku: "TOTO-AP-S5-001", slug: "toto-ap-inodoro-suspendido-washlet-s5-128-gpf09-gpf", name: "TOTO AP Inodoro Suspendido WASHLET+ S5 1.28 GPF/0.9 GPF", nameEn: "TOTO AP Wall-Hung Toilet WASHLET+ S5 1.28 GPF/0.9 GPF", price: 69739 },
  { sku: "TOTO-AP-S2-001", slug: "toto-ap-inodoro-suspendido-washlet-s2-128-gpf09-gpf", name: "TOTO AP Inodoro Suspendido WASHLET+ S2 1.28 GPF/0.9 GPF", nameEn: "TOTO AP Wall-Hung Toilet WASHLET+ S2 1.28 GPF/0.9 GPF", price: 65308 },
  { sku: "TOTO-AP-C5-001", slug: "toto-ap-inodoro-suspendido-washlet-c5-128-gpf-09-gpf", name: "TOTO AP Inodoro Suspendido WASHLET+ C5 1.28 GPF 0.9 GPF", nameEn: "TOTO AP Wall-Hung Toilet WASHLET+ C5 1.28 GPF 0.9 GPF", price: 68788 },
  { sku: "TOTO-AIMES-WC-001", slug: "toto-aimes-one-piece-toilet-128gpf-taza-alargada-coneccin-washlet", name: "TOTO Aimes One-Piece Toilet 1.28GPF Taza Alargada WASHLET+", nameEn: "TOTO Aimes One-Piece Toilet 1.28 GPF Elongated Bowl WASHLET+", price: 32178 },
  { sku: "TOTO-AQIV-S7-UH-001", slug: "toto-aquia-iv-washlet-s7-inodoro-de-dos-piezas-128-gpf-09-gpf-altura-universal", name: "TOTO Aquia IV WASHLET+ S7 Inodoro de dos piezas 1.28 GPF 0.9 GPF Altura Universal", nameEn: "TOTO Aquia IV WASHLET+ S7 Two-Piece Toilet 1.28 GPF 0.9 GPF Universal Height", price: 67535 },
  { sku: "TOTO-AQIV-S7-001", slug: "aquia-iv-washlet-s7-inodoro-de-dos-piezas-128-gpf-09-gpf", name: "TOTO Aquia IV WASHLET+ S7 Inodoro de dos piezas 1.28 GPF 0.9 GPF", nameEn: "TOTO Aquia IV WASHLET+ S7 Two-Piece Toilet 1.28 GPF 0.9 GPF", price: 66189 },
];

toiletData.forEach((t, i) => {
  addProduct({
    ...t,
    brand: "TOTO",
    category: "bathroom",
    subcategory: "toilets",
    finishes: totoFinishes,
    image: cycleImage("/products/bano/sanitarios", i),
    description: t.name.includes("una pieza")
      ? "Inodoro TOTO de una pieza con tecnologia WASHLET integrada, descarga eficiente y diseno premium."
      : t.name.includes("Suspendido")
      ? "Inodoro TOTO suspendido con tecnologia WASHLET, diseno de pared para banos modernos."
      : "Inodoro TOTO de dos piezas con tecnologia WASHLET, descarga eficiente y asiento premium.",
    descriptionEn: t.nameEn.includes("One-Piece")
      ? "TOTO one-piece toilet with integrated WASHLET technology, efficient flush and premium design."
      : t.nameEn.includes("Wall-Hung")
      ? "TOTO wall-hung toilet with WASHLET technology, wall-mounted design for modern bathrooms."
      : "TOTO two-piece toilet with WASHLET technology, efficient flush and premium seat.",
  });
});

// ─── BATHROOM: SHOWERS (IDs 272-302) ───
const showerFinishes = ["Polished Chrome", "Satin Nickel", "Matte Black", "Oil Rubbed Bronze"];

const showerData = [
  { sku: "CF-JALAMA-TH-001", slug: "cf-jalama-styletherm-thermostatic-trim", brand: "California Faucets", name: "Mando termostatica StyleTherm 3/4\" CF Jalama Series", nameEn: "California Faucets Jalama StyleTherm 3/4\" Thermostatic Trim", price: 21100 },
  { sku: "CF-DELMAR-TH-001", slug: "cf-del-mar-styletherm-dual-volume", brand: "California Faucets", name: "Mando StyleTherm con control de volumen dual CF Del Mar", nameEn: "California Faucets Del Mar StyleTherm Dual Volume Control", price: 17102 },
  { sku: "CF-STYLETHERM-TRIM-001", slug: "cf-styletherm-thermostatic-trim-34", brand: "California Faucets", name: "Moldura termostatica StyleTherm 3/4\" CF", nameEn: "California Faucets StyleTherm 3/4\" Thermostatic Trim", price: 18371 },
  { sku: "CF-STYLETHERM-SYS-001", slug: "cf-styletherm-thermostatic-shower-system-34", brand: "California Faucets", name: "Sistema de ducha termostatico Styletherm 3/4\" CF", nameEn: "California Faucets StyleTherm 3/4\" Thermostatic Shower System", price: 99880 },
  { sku: "CF-DESCANSO-PB-001", slug: "cf-descanso-pressure-balance-shower", brand: "California Faucets", name: "Sistema de ducha con equilibrio de presion CF Descanso", nameEn: "California Faucets Descanso Pressure Balance Shower System", price: 25777 },
  { sku: "CF-RAINSCAPE-CAS-001", slug: "cf-rainscape-14x7-cascade", brand: "California Faucets", name: "Ducha empotrada Rainscape 14\"x7\" Cascada CF", nameEn: "California Faucets Rainscape 14\"x7\" Cascade Flush Mount Shower", price: 37855 },
  { sku: "CF-RAINSCAPE-FM-001", slug: "cf-rainscape-14x7-flush-mount", brand: "California Faucets", name: "Cabezal de ducha empotrable Rainscape 14\"x7\" CF", nameEn: "California Faucets Rainscape 14\"x7\" Flush Mount Showerhead", price: 43881 },
  { sku: "CF-RAINSCAPE-EM-001", slug: "cf-rainscape-14x7-recessed", brand: "California Faucets", name: "Cabezal de ducha empotrado Rainscape 14\"x7\" CF", nameEn: "California Faucets Rainscape 14\"x7\" Recessed Showerhead", price: 26950 },
  { sku: "CF-RAINSCAPE-14-001", slug: "cf-rainscape-14x14-recessed", brand: "California Faucets", name: "Cabezal de ducha empotrado Rainscape 14\"x14\"", nameEn: "California Faucets Rainscape 14\"x14\" Recessed Showerhead", price: 43880 },
  { sku: "CF-MORRO-PB-001", slug: "cf-morro-bay-pressure-balance-shower", brand: "California Faucets", name: "Sistema de ducha equilibrio presion CF Morroy Bay", nameEn: "California Faucets Morro Bay Pressure Balance Shower System", price: 24800 },
  { sku: "CF-DESCANSO-TH12-001", slug: "cf-descanso-styletherm-12-shower-system", brand: "California Faucets", name: "Sistema de ducha termostatica StyleTherm 1/2\" CF Descanso", nameEn: "California Faucets Descanso StyleTherm 1/2\" Thermostatic Shower System", price: 68020 },
  { sku: "CF-MONTEREY-TH12-001", slug: "cf-monterey-styletherm-12-shower-system", brand: "California Faucets", name: "Sistema de ducha termostatico Styletherm 1/2\" CF Monterey", nameEn: "California Faucets Monterey StyleTherm 1/2\" Thermostatic Shower System", price: 52522 },
  { sku: "CF-PB-SYS-001", slug: "cf-pressure-balance-shower-system", brand: "California Faucets", name: "Sistema de ducha con equilibrio de presion", nameEn: "California Faucets Pressure Balance Shower System", price: 24089 },
  { sku: "CF-STYLETHERM-KIT-001", slug: "cf-styletherm-12-shower-kit", brand: "California Faucets", name: "Kit de ducha termostatico Styletherm 1/2 CF", nameEn: "California Faucets StyleTherm 1/2\" Thermostatic Shower Kit", price: 27623 },
  { sku: "CC-ALLISTON-001", slug: "counter-cultures-alliston-exposed-pipe-shower", brand: "Counter Cultures", name: "Ducha Alliston con Tuberia Expuesta Laton Pulido", nameEn: "Alliston Exposed Pipe Shower Polished Brass", price: 22000 },
  { sku: "BRIZO-CHARLOTTE-SH-001", slug: "brizo-charlotte-medium-flow-shower", brand: "Brizo", name: "Ducha Charlotte Brizo Flujo Medio", nameEn: "Brizo Charlotte Medium Flow Shower", price: 18980 },
  { sku: "BRIZO-BALIZA-SH-001", slug: "brizo-baliza-medium-flow-shower", brand: "Brizo", name: "Ducha Flujo Medio Brizo Baliza", nameEn: "Brizo Baliza Medium Flow Shower", price: 15723 },
  { sku: "BRIZO-CHARLOTTE-TS-001", slug: "brizo-charlotte-shower-tub-filler", brand: "Brizo", name: "Regadera y Llenador de Tina Flujo Medio Brizo Charlotte", nameEn: "Brizo Charlotte Medium Flow Shower and Tub Filler", price: 24367 },
  { sku: "BRIZO-LITZE-TH-001", slug: "brizo-litze-tempassure-thermostatic-shower-valve", brand: "Brizo", name: "Valvula para Ducha Trim Tempassure Thermostatico Brizo Litze", nameEn: "Brizo Litze TempAssure Thermostatic Shower Valve Trim", price: 11860 },
  { sku: "BRIZO-LOKI-PB-001", slug: "brizo-loki-pressure-balance-shower-short", brand: "Brizo", name: "Regadera Con Equilibrio De Presion Brizo Loki Corto", nameEn: "Brizo Loki Short Pressure Balance Shower", price: 13092 },
  { sku: "BRIZO-LOKI-PB-TF-001", slug: "brizo-loki-pressure-balance-shower-tub-filler", brand: "Brizo", name: "Regadera y Llenador de Tina Con Equilibrio De Presion Brizo Loki", nameEn: "Brizo Loki Pressure Balance Shower and Tub Filler", price: 16036 },
  { sku: "BRIZO-ODIN-MF-001", slug: "brizo-odin-medium-flow-shower", brand: "Brizo", name: "Regadera para Ducha Flujo Medio Brizo Odin", nameEn: "Brizo Odin Medium Flow Shower", price: 22665 },
  { sku: "BRIZO-ODIN-MF-002", slug: "brizo-odin-solo-medium-flow-shower", brand: "Brizo", name: "Brizo Odin Solo Regadera Flujo Medio", nameEn: "Brizo Odin Solo Medium Flow Shower", price: 17581 },
  { sku: "BRIZO-SIDERNA-TH-SH-001", slug: "brizo-siderna-tempassure-thermostatic-shower", brand: "Brizo", name: "Regadera Brizo Siderna Con Tempassure Thermostatic Solo Para Ducha", nameEn: "Brizo Siderna TempAssure Thermostatic Shower Only", price: 18813 },
  { sku: "BRIZO-SIDERNA-TH-TS-001", slug: "brizo-siderna-tempassure-thermostatic-tub-shower", brand: "Brizo", name: "Ducha Brizo Siderna Con Tempassure Thermostatic Para Tina Y Regadera", nameEn: "Brizo Siderna TempAssure Thermostatic Tub and Shower", price: 24388 },
  { sku: "BRIZO-TRAD-TH-001", slug: "brizo-traditional-short-tempassure-shower", brand: "Brizo", name: "Regadera Brizo Tradicional Corto Para Ducha Con Tempassure Thermostatic", nameEn: "Brizo Traditional Short TempAssure Thermostatic Shower", price: 12398 },
  { sku: "BRIZO-VESI-TH-TS-001", slug: "brizo-vesi-tempassure-thermostatic-tub-shower", brand: "Brizo", name: "Regadera Brizo Vesi Para Tina Y Ducha Con Tempassure Thermostatic", nameEn: "Brizo Vesi TempAssure Thermostatic Tub and Shower", price: 16056 },
  { sku: "BRIZO-VESI-PB-TS-001", slug: "brizo-vesi-pressure-balance-tub-shower", brand: "Brizo", name: "Regadera Brizo Vesi Ajustable Para Tina/Ducha Con Canal De Balance De Presion", nameEn: "Brizo Vesi Adjustable Pressure Balance Tub/Shower", price: 10260 },
  { sku: "BRIZO-VESI-PB-001", slug: "brizo-vesi-short-pressure-balance-shower", brand: "Brizo", name: "Regadera Corta Con Canal De Balance De Presion Brizo Vesi", nameEn: "Brizo Vesi Short Pressure Balance Shower", price: 8123 },
  { sku: "BRIZO-VESI-TH-001", slug: "brizo-vesi-short-tempassure-thermostatic-shower", brand: "Brizo", name: "Brizo Vesi Regadera Corta Con Tempassure Thermostatic", nameEn: "Brizo Vesi Short TempAssure Thermostatic Shower", price: 12208 },
  { sku: "BRIZO-VIRAGE-TH-TS-001", slug: "brizo-virage-tempassure-thermostatic-tub-shower", brand: "Brizo", name: "Regadera Brizo Virage Para Tina Y Ducha Con Tempassure Thermostatic", nameEn: "Brizo Virage TempAssure Thermostatic Tub and Shower", price: 17528 },
];

showerData.forEach((s, i) => {
  addProduct({
    ...s,
    category: "bathroom",
    subcategory: "showers",
    finishes: showerFinishes,
    image: cycleImage("/products/bano/regaderas", i),
    description: s.brand === "California Faucets"
      ? "Sistema de ducha California Faucets con acabados artesanales y tecnologia termostatica avanzada."
      : s.brand === "Counter Cultures"
      ? "Ducha con tuberia expuesta en laton pulido, estilo clasico para banos con caracter."
      : "Regadera Brizo con tecnologia de control de temperatura y diseno premium.",
    descriptionEn: s.brand === "California Faucets"
      ? "California Faucets shower system with artisan finishes and advanced thermostatic technology."
      : s.brand === "Counter Cultures"
      ? "Exposed pipe shower in polished brass, classic style for bathrooms with character."
      : "Brizo shower with temperature control technology and premium design.",
  });
});

// ─── BATHROOM: ACCESSORIES (IDs 303-343) ───
const accFinishes = ["Polished Chrome", "Satin Nickel", "Antique Brass", "Oil Rubbed Bronze", "Matte Black", "Polished Brass"];

const accessoryData = [
  { sku: "CF-TAMAL-TP-001", slug: "cf-tamalpais-toilet-paper-holder", name: "Portarrollos de papel higienico CF Tamalpais Series", nameEn: "California Faucets Tamalpais Toilet Paper Holder", price: 4841 },
  { sku: "CF-TAMAL-TPV-001", slug: "cf-tamalpais-vertical-toilet-paper-holder", name: "Portarrollos vertical para papel higienico CF Tamalpais", nameEn: "California Faucets Tamalpais Vertical Toilet Paper Holder", price: 5400 },
  { sku: "CF-TIBUR-TP-001", slug: "cf-tiburon-toilet-paper-holder", name: "Soporte para papel higienico CF Tiburon Series", nameEn: "California Faucets Tiburon Toilet Paper Holder", price: 7750 },
  { sku: "CF-TIBUR-TP-002", slug: "cf-tiburon-toilet-paper-holder-variant", name: "Soporte para papel higienico CF Tiburon Series", nameEn: "California Faucets Tiburon Toilet Paper Holder Variant", price: 6390 },
  { sku: "CF-TERRA-TP-001", slug: "cf-terra-mar-toilet-paper-holder", name: "Soporte para papel higienico CF Terra Mar Series", nameEn: "California Faucets Terra Mar Toilet Paper Holder", price: 3730 },
  { sku: "CF-RINCON-TP-001", slug: "cf-rincon-bay-toilet-paper-holder", name: "Portarrollos de papel higienico CF Rincon Bay", nameEn: "California Faucets Rincon Bay Toilet Paper Holder", price: 6947 },
  { sku: "CF-RINCON-TP-002", slug: "cf-rincon-bay-toilet-paper-holder-hooded", name: "Soporte para papel higienico CF Rincon Bay", nameEn: "California Faucets Rincon Bay Hooded Toilet Paper Holder", price: 7650 },
  { sku: "CF-CARDIFF-TP-001", slug: "cf-cardiff-toilet-paper-holder", name: "Portarrollos de papel higienico CF Cardiff Series", nameEn: "California Faucets Cardiff Toilet Paper Holder", price: 8690 },
  { sku: "CF-DESC-TPV-001", slug: "cf-descanso-vertical-toilet-paper-holder", name: "Soporte vertical para papel higienico CF Descanso Series", nameEn: "California Faucets Descanso Vertical Toilet Paper Holder", price: 4793 },
  { sku: "CF-DESC-TP-001", slug: "cf-descanso-toilet-paper-holder", name: "Portarrollos de papel higienico CF Descanso Series", nameEn: "California Faucets Descanso Toilet Paper Holder", price: 4575 },
  { sku: "CF-MORRO-TPV-001", slug: "cf-morro-bay-vertical-toilet-paper-holder", name: "Soporte vertical repuesto papel higienico CF Morro Bay", nameEn: "California Faucets Morro Bay Vertical Spare Toilet Paper Holder", price: 7290 },
  { sku: "CF-MORRO-TP-001", slug: "cf-morro-bay-toilet-paper-holder", name: "Portarrollos de papel higienico CF Morroy Bay Series", nameEn: "California Faucets Morro Bay Toilet Paper Holder", price: 6656 },
  { sku: "CF-BELCANTO-HK-001", slug: "cf-bel-canto-towel-hook", name: "Gancho para toalla CF Bel Canto Series", nameEn: "California Faucets Bel Canto Towel Hook", price: 4841 },
  { sku: "CF-ARPEGGIO-RH-001", slug: "cf-arpeggio-robe-hook", name: "Gancho para bata CF Arpeggio", nameEn: "California Faucets Arpeggio Robe Hook", price: 10359 },
  { sku: "CF-GRUBB-RH-001", slug: "cf-christopher-grubb-robe-hook", name: "Gancho para bata CF Christopher Grubb", nameEn: "California Faucets Christopher Grubb Robe Hook", price: 4925 },
  { sku: "CF-DESC-RH-001", slug: "cf-descanso-robe-hook", name: "Gancho para bata CF Descanso Series", nameEn: "California Faucets Descanso Robe Hook", price: 6584 },
  { sku: "CF-TAMAL-RH-001", slug: "cf-tamalpais-robe-hook", name: "Gancho para bata CF Tamalpais Series", nameEn: "California Faucets Tamalpais Robe Hook", price: 4066 },
  { sku: "CF-TERRA-RH-001", slug: "cf-terra-mar-robe-hook", name: "Gancho para bata CF Terra Mar Series", nameEn: "California Faucets Terra Mar Robe Hook", price: 4066 },
  { sku: "CF-TIBUR-RH-001", slug: "cf-tiburon-robe-hook", name: "Gancho para bata CF Tiburon Series", nameEn: "California Faucets Tiburon Robe Hook", price: 4260 },
  { sku: "CF-DSTREET-RH-001", slug: "cf-d-street-robe-hook", name: "Gancho para bata CF D-Street Series", nameEn: "California Faucets D-Street Robe Hook", price: 2396 },
  { sku: "CF-MARIMAR-RH-001", slug: "cf-marimar-robe-hook", name: "Gancho para bata CF Marimar Series", nameEn: "California Faucets Marimar Robe Hook", price: 5230 },
  { sku: "CF-RINCON-RH-001", slug: "cf-rincon-bay-robe-hook", name: "Gancho para bata CF Rincon Bay Series", nameEn: "California Faucets Rincon Bay Robe Hook", price: 4672 },
  { sku: "CF-SANELIJO-RH-001", slug: "cf-san-elijo-robe-hook", name: "Gancho para bata CF San Elijo Series", nameEn: "California Faucets San Elijo Robe Hook", price: 5230 },
  { sku: "CF-CARDIFF-RH-001", slug: "cf-cardiff-robe-hook", name: "Gancho para Bata CF Cardiff Series", nameEn: "California Faucets Cardiff Robe Hook", price: 3730 },
  { sku: "CF-DESC-RH-002", slug: "cf-descanso-robe-hook-variant", name: "Gancho para bata CF Descanso Series", nameEn: "California Faucets Descanso Robe Hook Variant", price: 3752 },
  { sku: "CF-MORRO-RH-001", slug: "cf-morro-robe-hook", name: "Gancho para bata CF Morroy Series", nameEn: "California Faucets Morro Robe Hook", price: 4260 },
  { sku: "CF-ARPEGGIO-TB-001", slug: "cf-arpeggio-24-towel-bar", name: "Barra de toalla 24\" CF Arpeggio Series", nameEn: "California Faucets Arpeggio 24\" Towel Bar", price: 8020 },
  { sku: "CF-TAMAL-TB-001", slug: "cf-tamalpais-24-towel-bar", name: "Barra de toalla 24\" CF Tamalpais Series", nameEn: "California Faucets Tamalpais 24\" Towel Bar", price: 5550 },
  { sku: "CF-TERRA-TB-001", slug: "cf-terra-mar-24-towel-bar", name: "Barra de Toalla 24\" CF Terra Mar Series", nameEn: "California Faucets Terra Mar 24\" Towel Bar", price: 6660 },
  { sku: "CF-TIBUR-TB-001", slug: "cf-tiburon-24-towel-bar", name: "Barra de Toalla 24\" CF Tiburon Series", nameEn: "California Faucets Tiburon 24\" Towel Bar", price: 8278 },
  { sku: "CF-DSTREET-TB-001", slug: "cf-d-street-24-towel-bar", name: "Barra de toalla 24\" CF D Street Series", nameEn: "California Faucets D Street 24\" Towel Bar", price: 3670 },
  { sku: "CF-MARIMAR-TB-001", slug: "cf-marimar-24-towel-bar", name: "Barra de toalla 24\" CF Marimar Series", nameEn: "California Faucets Marimar 24\" Towel Bar", price: 9343 },
  { sku: "CF-MONTEREY-TB-001", slug: "cf-monterey-24-towel-bar", name: "Barra para toalla 24\" CF Monterey Series", nameEn: "California Faucets Monterey 24\" Towel Bar", price: 7479 },
  { sku: "CF-RINCON-TB-001", slug: "cf-rincon-bay-24-towel-bar", name: "Barra de Toalla 24\" CF Rincon Bay Series", nameEn: "California Faucets Rincon Bay 24\" Towel Bar", price: 7479 },
  { sku: "CF-SANELIJO-TB-001", slug: "cf-san-elijo-24-towel-bar", name: "Barra de toalla 24\" CF San Elijo Series", nameEn: "California Faucets San Elijo 24\" Towel Bar", price: 12345 },
  { sku: "CF-CARDIFF-TB-001", slug: "cf-cardiff-24-towel-bar", name: "Barra de toalla 24\" CF Cardiff Series", nameEn: "California Faucets Cardiff 24\" Towel Bar", price: 7479 },
  { sku: "CF-DESC-TB-001", slug: "cf-descanso-24-towel-bar", name: "Barra de Toalla 24\" CF Descanso Series", nameEn: "California Faucets Descanso 24\" Towel Bar", price: 7237 },
  { sku: "CF-MORRO-TB-001", slug: "cf-morro-bay-24-towel-bar", name: "Barra de Toalla 24\" CF Morroy-Bay Series", nameEn: "California Faucets Morro Bay 24\" Towel Bar", price: 8810 },
  { sku: "ART-GANCHO-MURO-001", slug: "artisanal-bronze-wall-hook", name: "Gancho 100% Bronce para Muro de Bano", nameEn: "100% Bronze Bathroom Wall Hook", price: 754, brand: "Artisanal", artisanal: true },
  { sku: "ART-TOALLERO-001", slug: "artisanal-antique-bronze-towel-bar", name: "Toallero de Bronce Antiguo", nameEn: "Antique Bronze Towel Bar", price: 17400, brand: "Artisanal", artisanal: true },
  { sku: "ART-PORTAPAPEL-001", slug: "artisanal-bronze-toilet-paper-holder", name: "Porta Papel Higienico de Bronce", nameEn: "Bronze Toilet Paper Holder", price: 1740, brand: "Artisanal", artisanal: true },
];

accessoryData.forEach((a, i) => {
  const isArtisanal = a.artisanal || false;
  addProduct({
    ...a,
    brand: a.brand || "California Faucets",
    category: "bathroom",
    subcategory: "accessories",
    finishes: isArtisanal ? ["Natural Copper", "Dark Antique", "Nickel Plated"] : accFinishes,
    image: isArtisanal ? cycleImage("/products/herrajes/artesanales", i) : cycleImage("/products/accesorios", i),
    description: isArtisanal
      ? "Accesorio de bano artesanal de bronce hecho a mano por artesanos mexicanos."
      : a.name.includes("Portarrollos") || a.name.includes("Soporte para papel")
      ? "Portarrollos de papel higienico California Faucets, disponible en multiples acabados artesanales."
      : a.name.includes("Gancho")
      ? "Gancho decorativo California Faucets, acabado premium para banos de diseno."
      : "Barra de toalla 24\" California Faucets, solida construccion en laton con acabados premium.",
    descriptionEn: isArtisanal
      ? "Handcrafted artisanal bronze bathroom accessory made by Mexican artisans."
      : a.nameEn.includes("Toilet Paper")
      ? "California Faucets toilet paper holder, available in multiple artisan finishes."
      : a.nameEn.includes("Hook")
      ? "California Faucets decorative hook, premium finish for designer bathrooms."
      : "California Faucets 24\" towel bar, solid brass construction with premium finishes.",
  });
});

// ─── BATHROOM: DRAINS (IDs 344-359) ───
const drainData = [
  { sku: "CF-NEO-SD-001", slug: "cf-neo-styledrain-trim", brand: "California Faucets", name: "Rejilla de ajuste Neo StyleDrain CF", nameEn: "California Faucets Neo StyleDrain Trim", price: 6413, finishes: ["Polished Chrome", "Satin Nickel", "Matte Black", "Oil Rubbed Bronze"] },
  { sku: "CF-DECO-SD-001", slug: "cf-decoswirl-styledrain-trim", brand: "California Faucets", name: "Rejilla de ajuste DecoSwirl StyleDrain", nameEn: "California Faucets DecoSwirl StyleDrain Trim", price: 6413, finishes: ["Polished Chrome", "Satin Nickel", "Matte Black", "Oil Rubbed Bronze"] },
  { sku: "CF-WAVE-SD-001", slug: "cf-wave-styledrain-trim", brand: "California Faucets", name: "Rejilla de ajuste Wave StyleDrain CF", nameEn: "California Faucets Wave StyleDrain Trim", price: 6413, finishes: ["Polished Chrome", "Satin Nickel", "Matte Black", "Oil Rubbed Bronze"] },
  { sku: "CF-FLEUR-SD-001", slug: "cf-fleur-styledrain-trim", brand: "California Faucets", name: "Rejilla de ajuste Fleur StyleDrain CF", nameEn: "California Faucets Fleur StyleDrain Trim", price: 6413, finishes: ["Polished Chrome", "Satin Nickel", "Matte Black", "Oil Rubbed Bronze"] },
  { sku: "CF-STRATH-SD-001", slug: "cf-strathmore-styledrain-trim", brand: "California Faucets", name: "Rejilla de ajuste Strathmore StyleDrain CF", nameEn: "California Faucets Strathmore StyleDrain Trim", price: 6413, finishes: ["Polished Chrome", "Satin Nickel", "Matte Black", "Oil Rubbed Bronze"] },
  { sku: "CC-DRAIN-BLK-001", slug: "counter-cultures-black-shower-drain", brand: "Counter Cultures", name: "Drenaje de Ducha Contracanasta Negro", nameEn: "Black Shower Drain Basket Strainer", price: 940, finishes: ["Matte Black"] },
  { sku: "EBBE-E4806-001", slug: "ebbe-e4806-twister-shower-drain", brand: "Ebbe", name: "Drenaje de Ducha Ebbe E4806 Twister", nameEn: "Ebbe E4806 Twister Shower Drain", price: 3420, finishes: ["Brushed Nickel", "Polished Chrome", "Oil Rubbed Bronze"] },
  { sku: "EBBE-E4807-001", slug: "ebbe-e4807-weave-shower-drain", brand: "Ebbe", name: "Drenaje de Ducha Ebbe E4807 Weave", nameEn: "Ebbe E4807 Weave Shower Drain", price: 3256, finishes: ["Brushed Nickel", "Polished Chrome", "Oil Rubbed Bronze"] },
  { sku: "EBBE-E4811-001", slug: "ebbe-e4811-parallel-shower-drain", brand: "Ebbe", name: "Drenaje de Ducha Ebbe E4811 Parallel", nameEn: "Ebbe E4811 Parallel Shower Drain", price: 2826, finishes: ["Brushed Nickel", "Polished Chrome", "Oil Rubbed Bronze"] },
  { sku: "EBBE-E4812-001", slug: "ebbe-e4812-bubbles-shower-drain", brand: "Ebbe", name: "Drenaje para Ducha Ebbe E4812 Bubbles", nameEn: "Ebbe E4812 Bubbles Shower Drain", price: 2826, finishes: ["Brushed Nickel", "Polished Chrome", "Oil Rubbed Bronze"] },
  { sku: "EBBE-E4814-001", slug: "ebbe-e4814-tsunami-drain", brand: "Ebbe", name: "Drenaje Ebbe E4814 Tsunami", nameEn: "Ebbe E4814 Tsunami Drain", price: 2969, finishes: ["Brushed Nickel", "Polished Chrome", "Oil Rubbed Bronze"] },
  { sku: "EBBE-E4815-001", slug: "ebbe-e4815-frames-drain", brand: "Ebbe", name: "Drenaje Ebbe E4815 Frames", nameEn: "Ebbe E4815 Frames Drain", price: 2826, finishes: ["Brushed Nickel", "Polished Chrome", "Oil Rubbed Bronze"] },
  { sku: "EBBE-PRO-001", slug: "ebbe-pro-drain", brand: "Ebbe", name: "Drenaje Ebbe Pro", nameEn: "Ebbe Pro Drain", price: 860, finishes: ["Brushed Nickel", "Polished Chrome"] },
  { sku: "EBBE-E4022-001", slug: "ebbe-pro-e4022-pvc-drain", brand: "Ebbe", name: "Ebbe Pro Drenaje E4022 PVC Coladera", nameEn: "Ebbe Pro E4022 PVC Drain", price: 878, finishes: ["Brushed Nickel", "Polished Chrome"] },
  { sku: "EBBE-E4801-001", slug: "ebbe-pradera-e4801-drain-grate", brand: "Ebbe", name: "Ebbe Rejilla para Drenaje Pradera E4801", nameEn: "Ebbe Pradera E4801 Drain Grate", price: 3208, finishes: ["Brushed Nickel", "Polished Chrome", "Oil Rubbed Bronze"] },
  { sku: "EBBE-E4400-001", slug: "ebbe-square-riser-e4400", brand: "Ebbe", name: "Ebbe Square RISER para drenaje E4400", nameEn: "Ebbe Square Riser for Drain E4400", price: 428, finishes: ["Brushed Nickel"] },
];

drainData.forEach((d, i) => {
  addProduct({
    ...d,
    category: "bathroom",
    subcategory: "drains",
    image: cycleImage("/products/drenajes", i),
    description: d.brand === "California Faucets"
      ? "Rejilla decorativa StyleDrain de California Faucets, disponible en multiples acabados."
      : d.brand === "Counter Cultures"
      ? "Drenaje de ducha tipo contracanasta en acabado negro mate."
      : "Drenaje de ducha Ebbe con diseno decorativo y facil instalacion.",
    descriptionEn: d.brand === "California Faucets"
      ? "California Faucets decorative StyleDrain trim, available in multiple finishes."
      : d.brand === "Counter Cultures"
      ? "Shower drain basket strainer in matte black finish."
      : "Ebbe shower drain with decorative design and easy installation.",
  });
});

// ─── BATHROOM: VALVES (IDs 360-369) ───
const valveData = [
  { sku: "BRIZO-VIRAGE-VLV-001", slug: "brizo-virage-tub-filler-valve", brand: "Brizo", name: "Valvula para llenador de banera Brizo Virage", nameEn: "Brizo Virage Tub Filler Valve", price: 5620, finishes: ["Polished Chrome", "Brilliance Luxe Nickel", "Matte Black"] },
  { sku: "BRIZO-VIRAGE-VLV-002", slug: "brizo-virage-tub-filler-valve-set", brand: "Brizo", name: "Valvula para llenador de tina Brizo Virage", nameEn: "Brizo Virage Tub Filler Valve Set", price: 13225, finishes: ["Polished Chrome", "Brilliance Luxe Nickel", "Matte Black"] },
  { sku: "BRIZO-4HOLE-VLV-001", slug: "brizo-4-hole-valve", brand: "Brizo", name: "Valvula de 4 agujeros Brizo", nameEn: "Brizo 4-Hole Valve", price: 12012, finishes: ["Polished Chrome", "Brilliance Luxe Nickel", "Matte Black"] },
  { sku: "CF-STYLET-12-VLV-001", slug: "cf-styletherm-12-full-port-valve", brand: "California Faucets", name: "Valvula termostatica de paso total StyleTherm 1/2\" CF", nameEn: "California Faucets StyleTherm 1/2\" Full Port Thermostatic Valve", price: 14600, finishes: ["Polished Chrome", "Satin Nickel", "Matte Black", "Oil Rubbed Bronze"] },
  { sku: "CF-STYLET-34-VLV-001", slug: "cf-styletherm-34-pressure-valve", brand: "California Faucets", name: "Valvula de presion StyleTherm 3/4\" CF", nameEn: "California Faucets StyleTherm 3/4\" Pressure Valve", price: 16825, finishes: ["Polished Chrome", "Satin Nickel", "Matte Black", "Oil Rubbed Bronze"] },
  { sku: "CF-FLOOR-2LEG-001", slug: "cf-floor-mount-two-leg-valve", brand: "California Faucets", name: "Valvula para Piso con Dos Piernas CF", nameEn: "California Faucets Floor Mount Two-Leg Valve", price: 9173, finishes: ["Polished Chrome", "Satin Nickel", "Matte Black", "Oil Rubbed Bronze"] },
  { sku: "CF-FLOOR-TF-001", slug: "cf-floor-mount-tub-filler-valve", brand: "California Faucets", name: "Valvula de Piso para Llenador de Banera CF", nameEn: "California Faucets Floor Mount Tub Filler Valve", price: 12320, finishes: ["Polished Chrome", "Satin Nickel", "Matte Black", "Oil Rubbed Bronze"] },
  { sku: "CF-WALL-VLV-001", slug: "cf-wall-mount-faucet-rough-valve", brand: "California Faucets", name: "Valvula de empotrar para grifo de pared CF", nameEn: "California Faucets Wall-Mount Faucet Rough-In Valve", price: 9198, finishes: ["Universal"] },
  { sku: "CF-PB-DUAL-001", slug: "cf-pressure-balance-dual-outlet-valve", brand: "California Faucets", name: "Valvula de equilibrio de presion doble salida 1/2\"", nameEn: "California Faucets 1/2\" Dual Outlet Pressure Balance Valve", price: 8600, finishes: ["Universal"] },
  { sku: "CF-PB1R-001", slug: "cf-pressure-balance-pb1r-valve", brand: "California Faucets", name: "Valvula de equilibrio de presion PB1-R CF", nameEn: "California Faucets PB1-R Pressure Balance Valve", price: 6200, finishes: ["Universal"] },
];

valveData.forEach((v, i) => {
  addProduct({
    ...v,
    category: "bathroom",
    subcategory: "valves",
    image: cycleImage("/products/bano/valvulas", i),
    description: v.brand === "Brizo"
      ? "Valvula Brizo de alta precision para control de agua en instalaciones de bano."
      : "Valvula California Faucets para instalaciones de bano con tecnologia de control avanzada.",
    descriptionEn: v.brand === "Brizo"
      ? "Brizo high-precision valve for water control in bathroom installations."
      : "California Faucets valve for bathroom installations with advanced control technology.",
  });
});

// ─── HARDWARE: DOOR-LOCKS (IDs 370-425) ───
const svbFinishes = ["Silicon Bronze", "Dark Bronze", "Aged Bronze"];
const emtekFinishes = ["Oil Rubbed Bronze", "Satin Nickel", "Polished Chrome", "Flat Black"];

const svbLocks = [
  { sku: "SVB-CONTEMP-001", slug: "svb-contemporary-entry-set", name: "Juego de cerradura SVB Contemporary Collection", nameEn: "Sun Valley Bronze Contemporary Collection Entry Set", price: 79906 },
  { sku: "SVB-ARCH-001", slug: "svb-arch-collection-entry-set", name: "Juego de cerradura SVB Arch Collection", nameEn: "Sun Valley Bronze Arch Collection Entry Set", price: 66056 },
  { sku: "SVB-CONTEMP-GLD-001", slug: "svb-contemporary-gold-entry-set", name: "Juego de cerradura SVB Contemporary Collection", nameEn: "Sun Valley Bronze Contemporary Collection Gold Entry Set", price: 61342 },
  { sku: "SVB-BEVEL-001", slug: "svb-bevel-edge-entry-set", name: "Juego de cerradura SVB Bevel Edge Series", nameEn: "Sun Valley Bronze Bevel Edge Series Entry Set", price: 40636 },
  { sku: "SVB-HAMPTON-001", slug: "svb-hampton-entry-set", name: "Juego de cerradura SVB Hampton Series", nameEn: "Sun Valley Bronze Hampton Series Entry Set", price: 47881 },
  { sku: "SVB-TEXTURE-001", slug: "svb-textures-collection-entry-set", name: "Juego de cerradura SVB Textures Collection", nameEn: "Sun Valley Bronze Textures Collection Entry Set", price: 64050 },
  { sku: "SVB-TEXTURE-002", slug: "svb-texture-collections-entry-set", name: "Juego de cerradura SVB Texture Collections", nameEn: "Sun Valley Bronze Texture Collections Entry Set", price: 64837 },
  { sku: "SVB-MESA-001", slug: "svb-mesa-collection-entry-set", name: "Juego de cerradura SVB Mesa Collection", nameEn: "Sun Valley Bronze Mesa Collection Entry Set", price: 79090 },
  { sku: "SVB-CONTEMP-002", slug: "svb-contemporary-variant-entry-set", name: "Juego de cerradura SVB Contemporary", nameEn: "Sun Valley Bronze Contemporary Entry Set Variant", price: 61746 },
  { sku: "SVB-BANDBOX-001", slug: "svb-bandbox-entry-set", name: "Juego de cerradura SVB BandBox", nameEn: "Sun Valley Bronze BandBox Entry Set", price: 82217 },
  { sku: "SVB-CONTEMP-BARN-001", slug: "svb-contemporary-barn-door-lock", name: "Chapa para puerta corrediza SVB Contemporary", nameEn: "Sun Valley Bronze Contemporary Barn Door Lock", price: 16491 },
  { sku: "SVB-DECO-001", slug: "svb-deco-collection-entry-set", name: "Juego de cerradura SVB Deco Collection", nameEn: "Sun Valley Bronze Deco Collection Entry Set", price: 86128 },
  { sku: "SVB-CORDUROY-001", slug: "svb-corduroy-collection-entry-set", name: "Juego de cerradura SVB Corduroy Collection", nameEn: "Sun Valley Bronze Corduroy Collection Entry Set", price: 89380 },
  { sku: "SVB-ASPEN-001", slug: "svb-aspen-leaf-collection-entry-set", name: "Juego de cerradura SVB Aspen Leaf Collection", nameEn: "Sun Valley Bronze Aspen Leaf Collection Entry Set", price: 59242 },
  { sku: "SVB-BANDBOX-HND-001", slug: "svb-bandbox-handle-entry-set", name: "Juego de cerradura SVB Bandbox (manilla)", nameEn: "Sun Valley Bronze Bandbox Handle Entry Set", price: 61502 },
  { sku: "SVB-GEM-BARN-001", slug: "svb-gem-barn-door-lock", name: "Chapa para puerta corrediza SVB Gem Collection", nameEn: "Sun Valley Bronze Gem Collection Barn Door Lock", price: 25652 },
  { sku: "SVB-CONTEMP-BARN-002", slug: "svb-contemporary-series-barn-door-lock", name: "Chapa para puerta corrediza SVB Contemporary Series", nameEn: "Sun Valley Bronze Contemporary Series Barn Door Lock", price: 27821 },
  { sku: "SVB-CONTEMP-BARN-003", slug: "svb-contemporary-gold-barn-door-lock", name: "Chapa para puerta corrediza SVB Contemporary Collection", nameEn: "Sun Valley Bronze Contemporary Gold Barn Door Lock", price: 22922 },
  { sku: "SVB-CONTEMP-PASS-001", slug: "svb-contemporary-passage-set", name: "Juego de cerradura paso/cerrojo SVB Contemporary", nameEn: "Sun Valley Bronze Contemporary Passage Set", price: 29744 },
  { sku: "SVB-FLEUR-PRIV-001", slug: "svb-fleur-de-lis-privacy-set", name: "Juego de cerradura privacidad SVB Fleur De Lis", nameEn: "Sun Valley Bronze Fleur De Lis Privacy Set", price: 39061 },
  { sku: "SVB-PRIV-001", slug: "svb-privacy-lock-set", name: "Juego de cerradura privacidad SVB", nameEn: "Sun Valley Bronze Privacy Lock Set", price: 36539 },
  { sku: "SVB-ARCH-PRIV-001", slug: "svb-arch-interior-privacy-set", name: "Juego de cerradura interior privacidad SVB Arch", nameEn: "Sun Valley Bronze Arch Interior Privacy Set", price: 33974 },
  { sku: "SVB-CONTEMP-HND-001", slug: "svb-contemporary-handle-lock-set", name: "Juego de cerradura manija SVB Contemporary", nameEn: "Sun Valley Bronze Contemporary Handle Lock Set", price: 57788 },
  { sku: "SVB-HND-002", slug: "svb-handle-lock-set-variant", name: "Juego de cerradura manija SVB", nameEn: "Sun Valley Bronze Handle Lock Set Variant", price: 74674 },
  { sku: "SVB-NOVUS-001", slug: "svb-novus-collection-entry-set", name: "Juego de cerradura SVB Novus Collection", nameEn: "Sun Valley Bronze Novus Collection Entry Set", price: 55364 },
  { sku: "SVB-TRELLIS-001", slug: "svb-trellis-collection-entry-set", name: "Juego de cerradura SVB Trellis Collection", nameEn: "Sun Valley Bronze Trellis Collection Entry Set", price: 80492 },
  { sku: "SVB-ARCH-HND-001", slug: "svb-arch-collection-handle-entry-set", name: "Juego de cerradura SVB Arch Collection (manija)", nameEn: "Sun Valley Bronze Arch Collection Handle Entry Set", price: 76740 },
  { sku: "SVB-KYOTO-001", slug: "svb-kyoto-collection-handle-set", name: "Juego de manija SVB Kyoto Collection", nameEn: "Sun Valley Bronze Kyoto Collection Handle Set", price: 48928 },
  { sku: "SVB-DBLCYL-001", slug: "svb-double-cylinder-lock-set", name: "Juego de cerradura doble cilindro SVB", nameEn: "Sun Valley Bronze Double Cylinder Lock Set", price: 47085 },
  { sku: "SVB-BEVEL-HW-001", slug: "svb-bevel-edge-hardware-set", name: "Juego de herrajes SVB Bevel Edge Collection", nameEn: "Sun Valley Bronze Bevel Edge Hardware Set", price: 34752 },
  { sku: "SVB-BANDBOX-HND-002", slug: "svb-bandbox-collection-handle-entry-set", name: "Juego de cerradura SVB Bandbox Collection (manija)", nameEn: "Sun Valley Bronze Bandbox Collection Handle Entry Set", price: 77648 },
  { sku: "SVB-RIDGE-PASS-001", slug: "svb-ridge-passage-set", name: "Juego de cerradura paso/cerrojo SVB Ridge", nameEn: "Sun Valley Bronze Ridge Passage Set", price: 35347 },
  { sku: "SVB-FLEUR-HND-001", slug: "svb-fleur-de-lis-handle-entry-set", name: "Juego de cerradura SVB Fleur de Lis Collection (manija)", nameEn: "Sun Valley Bronze Fleur de Lis Handle Entry Set", price: 81185 },
  { sku: "SVB-MESA-HND-001", slug: "svb-mesa-collection-handle-entry-set", name: "Juego de cerradura SVB Mesa Collection (manilla)", nameEn: "Sun Valley Bronze Mesa Collection Handle Entry Set", price: 56575 },
  { sku: "SVB-BEVEL-HND-001", slug: "svb-bevel-edge-handle-entry-set", name: "Juego de cerradura SVB Bevel Edge Collection (manija)", nameEn: "Sun Valley Bronze Bevel Edge Handle Entry Set", price: 81063 },
  { sku: "SVB-PASS-001", slug: "svb-passage-lock-set", name: "Juego de cerradura paso/cerrojo SVB", nameEn: "Sun Valley Bronze Passage Lock Set", price: 33247 },
  { sku: "SVB-OVAL-001", slug: "svb-oval-collection-entry-set", name: "Juego de cerradura SVB Oval Collection", nameEn: "Sun Valley Bronze Oval Collection Entry Set", price: 57625 },
  { sku: "SVB-BURLAP-001", slug: "svb-burlap-collection-entry-set", name: "Juego de cerradura SVB Burlap Collection", nameEn: "Sun Valley Bronze Burlap Collection Entry Set", price: 58950 },
  { sku: "SVB-TETON-HND-001", slug: "svb-teton-collection-handle-entry-set", name: "Juego de cerradura SVB Teton Collection (manilla)", nameEn: "Sun Valley Bronze Teton Collection Handle Entry Set", price: 58527 },
  { sku: "SVB-TETON-001", slug: "svb-teton-collection-entry-set", name: "Juego de cerradura SVB Teton Collection", nameEn: "Sun Valley Bronze Teton Collection Entry Set", price: 42396 },
  { sku: "SVB-CORRUGATE-001", slug: "svb-corrugate-collection-entry-set", name: "Juego de cerradura SVB Corrugate Collection", nameEn: "Sun Valley Bronze Corrugate Collection Entry Set", price: 76740 },
];

svbLocks.forEach((l, i) => {
  addProduct({
    ...l,
    brand: "Sun Valley Bronze",
    category: "hardware",
    subcategory: "door-locks",
    finishes: svbFinishes,
    image: cycleImage("/products/herrajes/chapas-cerrojos", i),
    description: l.name.includes("corrediza")
      ? "Chapa para puerta corrediza Sun Valley Bronze, fundida en bronce solido con acabado artesanal."
      : l.name.includes("privacidad")
      ? "Juego de cerradura de privacidad Sun Valley Bronze, bronce solido fundido para interiores."
      : l.name.includes("paso")
      ? "Juego de cerradura de paso Sun Valley Bronze, bronce solido con mecanismo de alta durabilidad."
      : "Juego de cerradura Sun Valley Bronze, fundido en bronce solido con acabado artesanal americano.",
    descriptionEn: l.nameEn.includes("Barn Door")
      ? "Sun Valley Bronze barn door lock, cast in solid bronze with artisan finish."
      : l.nameEn.includes("Privacy")
      ? "Sun Valley Bronze privacy lock set, solid cast bronze for interior doors."
      : l.nameEn.includes("Passage")
      ? "Sun Valley Bronze passage set, solid bronze with high-durability mechanism."
      : "Sun Valley Bronze entry set, cast in solid bronze with American artisan finish.",
  });
});

const emtekLocks = [
  { sku: "EMTEK-KNURL-L-001", slug: "emtek-select-knurled-l-key", name: "Llave de puerta en L Select Knurled Emtek", nameEn: "Emtek Select Knurled L-Shape Door Key", price: 7567 },
  { sku: "EMTEK-HAMMERED-001", slug: "emtek-hammered-egg-door-knob", name: "Perilla para puerta Emtek Hammered Egg", nameEn: "Emtek Hammered Egg Door Knob", price: 5322 },
  { sku: "EMTEK-HAMPTON-001", slug: "emtek-hampton-edition-door-knob", name: "Perilla para puerta Emtek Hampton Edition", nameEn: "Emtek Hampton Edition Door Knob", price: 5322 },
  { sku: "EMTEK-OLDTOWN-001", slug: "emtek-old-town-special-door-knob", name: "Perilla para puerta Emtek Old Town Special", nameEn: "Emtek Old Town Special Door Knob", price: 5322 },
  { sku: "EMTEK-RIBBON-001", slug: "emtek-ribbon-reed-door-knob", name: "Perilla para puerta Emtek Ribbon & Reed", nameEn: "Emtek Ribbon & Reed Door Knob", price: 5322 },
  { sku: "EMTEK-LAURENT-001", slug: "emtek-laurent-edition-door-knob", name: "Perilla para puerta Emtek Laurent Edition", nameEn: "Emtek Laurent Edition Door Knob", price: 5322 },
  { sku: "EMTEK-MADISON-001", slug: "emtek-madison-ivory-door-knob", name: "Perilla para puerta Emtek Madison Ivory", nameEn: "Emtek Madison Ivory Door Knob", price: 4284 },
  { sku: "EMTEK-CONICAL-001", slug: "emtek-conical-walnut-interior-door-knob", name: "Perilla para puerta Interior Emtek Conical Walnut", nameEn: "Emtek Conical Walnut Interior Door Knob", price: 5970 },
  { sku: "EMTEK-MANNING-001", slug: "emtek-manning-edition-door-knob", name: "Perilla para puerta Emtek Manning Edition", nameEn: "Emtek Manning Edition Door Knob", price: 6268 },
  { sku: "EMTEK-TBAR-MARBLE-001", slug: "emtek-t-bar-green-marble-door-knob", name: "Perilla de puerta Emtek T-Bar Green Marble", nameEn: "Emtek T-Bar Green Marble Door Knob", price: 6487 },
  { sku: "EMTEK-RBAR-001", slug: "emtek-r-bar-modern-door-knob", name: "Perilla para puerta Emtek R-Bar Modern Edition", nameEn: "Emtek R-Bar Modern Edition Door Knob", price: 6268 },
  { sku: "EMTEK-MYLES-001", slug: "emtek-myles-edition-door-knob", name: "Perilla para puerta Emtek Myles Edition", nameEn: "Emtek Myles Edition Door Knob", price: 6268 },
  { sku: "EMTEK-TBAR-FAC-001", slug: "emtek-t-bar-faceted-door-knob", name: "Perilla para puerta Emtek T-Bar Faceted", nameEn: "Emtek T-Bar Faceted Door Knob", price: 6268 },
  { sku: "EMTEK-MELON-001", slug: "emtek-melon-edition-gold-door-knob", name: "Perilla para puerta Emtek Melon Edition Gold", nameEn: "Emtek Melon Edition Gold Door Knob", price: 4284 },
  { sku: "EMTEK-VICTORIA-001", slug: "emtek-victoria-edition-door-knob", name: "Perilla para puerta Emtek Victoria Edition", nameEn: "Emtek Victoria Edition Door Knob", price: 5322 },
];

emtekLocks.forEach((l, i) => {
  addProduct({
    ...l,
    brand: "Emtek",
    category: "hardware",
    subcategory: "door-locks",
    finishes: emtekFinishes,
    image: cycleImage("/products/herrajes/chapas-cerrojos", i + svbLocks.length),
    description: l.name.includes("Perilla")
      ? "Perilla decorativa Emtek con diseno unico y acabado premium para puertas interiores y exteriores."
      : "Herraje de puerta Emtek con diseno moderno y mecanismo de alta calidad.",
    descriptionEn: l.nameEn.includes("Knob")
      ? "Emtek decorative door knob with unique design and premium finish for interior and exterior doors."
      : "Emtek door hardware with modern design and high-quality mechanism.",
  });
});

// ─── HARDWARE: PULLS & HOOKS (IDs 426-484) ───
const artisanalFinishes = ["Natural Copper", "Dark Antique", "Nickel Plated"];

const pullsHooksData = [
  { sku: "ART-TOCADOR-TRAD-001", slug: "artisanal-traditional-bronze-door-knocker", name: "Tocador de Puerta Tradicional en Bronce", nameEn: "Traditional Bronze Door Knocker", price: 2200 },
  { sku: "ART-TOCADOR-TRAD-002", slug: "artisanal-traditional-door-knocker", name: "Toca Puertas Tradicional", nameEn: "Traditional Door Knocker", price: 1350 },
  { sku: "ART-TOCADOR-LEON-001", slug: "artisanal-lion-door-knocker", name: "Toca Puertas Leon", nameEn: "Lion Door Knocker", price: 2300 },
  { sku: "ART-TOCADOR-DIABLO-001", slug: "artisanal-devil-door-knocker", name: "Toca Puertas Diablo", nameEn: "Devil Door Knocker", price: 1400 },
  { sku: "ART-TOCADOR-MANO-001", slug: "artisanal-hand-door-knocker", name: "Toca Puertas Mano", nameEn: "Hand Door Knocker", price: 2200 },
  { sku: "ART-GANCHO-MULT-001", slug: "artisanal-multiple-hooks", name: "Ganchos Multiples", nameEn: "Multiple Hooks Rack", price: 680 },
  { sku: "ART-GANCHO-ARO-001", slug: "artisanal-bronze-ring-hook", name: "Gancho De Bronce Modelo Aro", nameEn: "Bronze Ring Hook", price: 680 },
  { sku: "ART-GANCHO-HEX-001", slug: "artisanal-bronze-hex-hook", name: "Gancho De Bronce Modelo Hex", nameEn: "Bronze Hex Hook", price: 680 },
  { sku: "ART-GANCHO-OVAL-001", slug: "artisanal-bronze-oval-hook", name: "Gancho De Bronce Modelo Oval", nameEn: "Bronze Oval Hook", price: 450 },
  { sku: "ART-GANCHO-TRAD-001", slug: "artisanal-traditional-hook", name: "Gancho Tradicional", nameEn: "Traditional Hook", price: 400 },
  { sku: "ART-GANCHO-DOBLE-001", slug: "artisanal-double-iron-hook", name: "Gancho Doble de Hierro", nameEn: "Double Iron Hook", price: 1200 },
  { sku: "ART-GANCHO-DECO-001", slug: "artisanal-art-deco-hook", name: "Gancho Estilo Art Deco", nameEn: "Art Deco Style Hook", price: 480 },
  { sku: "ART-GANCHO-NAUT-001", slug: "artisanal-nautical-hook", name: "Gancho Estilo Nautica", nameEn: "Nautical Style Hook", price: 640 },
  { sku: "ART-GANCHO-CIRC-001", slug: "artisanal-circular-hook", name: "Gancho Circular", nameEn: "Circular Hook", price: 400 },
  { sku: "ART-JAL-LINEAS-001", slug: "artisanal-bronze-pull-with-lines", name: "Jaladera Tradicional de Bronce con Lineas", nameEn: "Traditional Bronze Pull with Lines", price: 140 },
  { sku: "ART-JAL-SEMICUAD-001", slug: "artisanal-semi-square-bronze-pull", name: "Jaladera de Bronce Semi cuadrada", nameEn: "Semi-Square Bronze Pull", price: 200 },
  { sku: "ART-JAL-CUAD-001", slug: "artisanal-square-bronze-pull", name: "Jaladera de Bronce Cuadrada", nameEn: "Square Bronze Pull", price: 200 },
  { sku: "ART-JAL-TUB-001", slug: "artisanal-tubular-bronze-pull", name: "Jaladera de Bronce Tubular", nameEn: "Tubular Bronze Pull", price: 200 },
  { sku: "ART-JAL-NORM-001", slug: "artisanal-normandy-bronze-pull", name: "Jaladera de Bronce Clasica con Detalle Normandy", nameEn: "Classic Bronze Pull with Normandy Detail", price: 270 },
  { sku: "ART-JAL-SIMPLE-001", slug: "artisanal-simple-bronze-pull", name: "Jaladera de Bronce", nameEn: "Simple Bronze Pull", price: 200 },
  { sku: "ART-JAL-RAMA-001", slug: "artisanal-branch-bronze-pull", name: "Jaladera de Bronce con Efecto de Rama", nameEn: "Bronze Pull with Branch Effect", price: 1800 },
  { sku: "ART-JAL-TRENZ-001", slug: "artisanal-braided-bronze-pull", name: "Jaladera de Bronce Trenzada", nameEn: "Braided Bronze Pull", price: 800 },
  { sku: "ART-JAL-TRENZ-FLOR-001", slug: "artisanal-braided-flower-bronze-pull", name: "Jaladera de Bronce Trenzada Flor", nameEn: "Braided Flower Bronze Pull", price: 200 },
  { sku: "ART-JAL-SENC-001", slug: "artisanal-plain-bronze-pull", name: "Jaladera de Bronce Sencilla", nameEn: "Plain Bronze Pull", price: 200 },
  { sku: "ART-JAL-BASECIRC-001", slug: "artisanal-circular-base-bronze-pull", name: "Jaladera de Bronce con Base Circular", nameEn: "Bronze Pull with Circular Base", price: 250 },
  { sku: "ART-JAL-GRUESA-001", slug: "artisanal-thick-square-bronze-pull", name: "Jaladera de Bronce Gruesa Cuadrada", nameEn: "Thick Square Bronze Pull", price: 200 },
  { sku: "ART-JAL-PATITAS-001", slug: "artisanal-rectangular-feet-bronze-pull", name: "Jaladera de Bronce con Patitas Rectangulares", nameEn: "Bronze Pull with Rectangular Feet", price: 350 },
  { sku: "ART-JAL-TIRA-001", slug: "artisanal-strip-bronze-pull", name: "Jaladera en Tira de Bronce", nameEn: "Bronze Strip Pull", price: 450 },
  { sku: "ART-JAL-TRAD-001", slug: "artisanal-traditional-bronze-pull", name: "Jaladera de Bronce Tradicional", nameEn: "Traditional Bronze Pull", price: 340 },
  { sku: "ART-JAL-NORM-002", slug: "artisanal-normandy-detail-bronze-pull", name: "Jaladera de Bronce con Detalle Normandy", nameEn: "Bronze Pull with Normandy Detail", price: 300 },
  { sku: "ART-JAL-ESFER-001", slug: "artisanal-spherical-detail-bronze-pull", name: "Jaladera de Bronce con Detalle Esferico", nameEn: "Bronze Pull with Spherical Detail", price: 700 },
  { sku: "ART-BTN-REDOND-001", slug: "artisanal-rounded-button-pull", name: "Jaladera de Boton Redondeada", nameEn: "Rounded Button Pull", price: 250 },
  { sku: "ART-BTN-CILPLACA-001", slug: "artisanal-cylindrical-button-with-plate", name: "Jaladera de Boton Cilindrica con Placa Circular", nameEn: "Cylindrical Button Pull with Circular Plate", price: 248 },
  { sku: "ART-BTN-CIL-001", slug: "artisanal-cylindrical-button-pull", name: "Jaladera de Boton Cilindrica", nameEn: "Cylindrical Button Pull", price: 190 },
  { sku: "ART-BTN-GOLP-001", slug: "artisanal-hammered-button-pull", name: "Jaladera de Boton con Efecto Golpeado", nameEn: "Hammered Effect Button Pull", price: 250 },
  { sku: "ART-BTN-OVAL-001", slug: "artisanal-oval-button-pull", name: "Jaladera de Boton Ovalada", nameEn: "Oval Button Pull", price: 300 },
  { sku: "ART-BTN-FLOR-001", slug: "artisanal-flower-detail-button-pull", name: "Jaladera de Boton con Detalle de Flor", nameEn: "Flower Detail Button Pull", price: 300 },
  { sku: "ART-BTN-SILFLOR-001", slug: "artisanal-flower-silhouette-button-pull", name: "Jaladera de Boton con Silueta de Flor", nameEn: "Flower Silhouette Button Pull", price: 250 },
  { sku: "ART-JAL-MLUNA-001", slug: "artisanal-half-moon-pull", name: "Jaladera de Media Luna", nameEn: "Half Moon Pull", price: 300 },
  { sku: "ART-JAL-GABRECT-001", slug: "artisanal-rectangular-cabinet-pull", name: "Jaladera para Gabinete Bronce Rectangular", nameEn: "Rectangular Bronze Cabinet Pull", price: 300 },
  { sku: "ART-JAL-TIPOL-001", slug: "artisanal-l-type-bronze-pull", name: "Jaladera de Bronce Tipo L", nameEn: "L-Type Bronze Pull", price: 550 },
  { sku: "ART-BTN-CIRC-001", slug: "artisanal-circular-button-bronze-pull", name: "Jaladera de Bronce de Boton Circular", nameEn: "Circular Bronze Button Pull", price: 300 },
  { sku: "ART-BTN-HEX-001", slug: "artisanal-hexagonal-button-pull", name: "Jaladera de Boton Hexagonal", nameEn: "Hexagonal Button Pull", price: 290 },
  { sku: "ART-BTN-CUAD-001", slug: "artisanal-square-button-bronze-pull", name: "Jaladera de Bronce de Boton Cuadrada", nameEn: "Square Bronze Button Pull", price: 250 },
  { sku: "ART-BTN-FLOR-002", slug: "artisanal-flower-button-bronze-pull", name: "Jaladera de Bronce de Boton Flor", nameEn: "Flower Bronze Button Pull", price: 290 },
  { sku: "ART-BTN-BOLRECT-001", slug: "artisanal-ball-button-rectangular-plate", name: "Jaladera de Boton de Bolita con Placa Rectangular", nameEn: "Ball Button Pull with Rectangular Plate", price: 350 },
  { sku: "ART-BTN-BOLCUAD-001", slug: "artisanal-ball-button-square-plate", name: "Jaladera de Boton de Bolita con Placa Cuadrada", nameEn: "Ball Button Pull with Square Plate", price: 300 },
  { sku: "ART-BTN-ARCOS-001", slug: "artisanal-button-with-arched-plate", name: "Jaladera de Boton con Placa con Arcos", nameEn: "Button Pull with Arched Plate", price: 360 },
  { sku: "ART-BTN-OVALPLC-001", slug: "artisanal-oval-button-with-plate", name: "Jaladera de Bronce Boton Ovalado con Placa", nameEn: "Oval Bronze Button Pull with Plate", price: 320 },
  { sku: "ART-JAL-HIERRO-001", slug: "artisanal-wrought-iron-pull", name: "Jaladera de Hierro Forjado", nameEn: "Wrought Iron Pull", price: 2800 },
  { sku: "ART-JAL-GOTA-RECT-001", slug: "artisanal-drop-pull-rectangular-plate", name: "Jaladera en Forma de Gota con Placa Rectangular", nameEn: "Drop Pull with Rectangular Plate", price: 320 },
  { sku: "ART-JAL-GOTA-CIRC-001", slug: "artisanal-drop-pull-circular-plate", name: "Jaladera en Forma de Gota con Lineas y Placa Circular", nameEn: "Drop Pull with Lines and Circular Plate", price: 320 },
  { sku: "ART-JAL-CONCHA-001", slug: "artisanal-shell-pull", name: "Jaladera de Concha", nameEn: "Shell Pull", price: 300 },
  { sku: "ART-JAL-ESPIRAL-001", slug: "artisanal-spiral-iron-pull", name: "Jaladera de Hierro con Espirales", nameEn: "Iron Pull with Spirals", price: 3300 },
  { sku: "ART-BTN-CLASOVAL-001", slug: "artisanal-classic-oval-button-pull", name: "Jaladera de Boton Clasica Ovalada", nameEn: "Classic Oval Button Pull", price: 450 },
  { sku: "ART-JAL-ROPERO-001", slug: "artisanal-wardrobe-furniture-pull", name: "Jaladera de Ropero o Muebles", nameEn: "Wardrobe and Furniture Pull", price: 350 },
  { sku: "ART-BARRA-CORTINA-001", slug: "artisanal-double-curtain-rod", name: "Barra de Cortina Doble", nameEn: "Double Curtain Rod", price: 930 },
  { sku: "ART-REMATE-ESFER-001", slug: "artisanal-spherical-bronze-finial", name: "Remate Esferico de Bronce", nameEn: "Spherical Bronze Finial", price: 900 },
  { sku: "ART-JAL-CURV-001", slug: "artisanal-curved-bronze-pull", name: "Jaladera de Bronce Curveada", nameEn: "Curved Bronze Pull", price: 200 },
];

pullsHooksData.forEach((p, i) => {
  addProduct({
    ...p,
    brand: "Artisanal",
    category: "hardware",
    subcategory: "pulls-hooks",
    finishes: artisanalFinishes,
    artisanal: true,
    image: cycleImage("/products/herrajes/artesanales", i),
    description: p.name.includes("Toca Puertas") || p.name.includes("Tocador")
      ? "Tocador de puerta artesanal de bronce, fundido y terminado a mano por artesanos mexicanos."
      : p.name.includes("Gancho")
      ? "Gancho artesanal de bronce fundido a mano, ideal para decoracion y organizacion."
      : p.name.includes("Barra") || p.name.includes("Remate")
      ? "Accesorio decorativo artesanal de bronce, fundido a mano por artesanos mexicanos."
      : "Jaladera artesanal de bronce fundido a mano, perfecta para gabinetes y muebles.",
    descriptionEn: p.nameEn.includes("Knocker")
      ? "Artisanal bronze door knocker, hand-cast and finished by Mexican artisans."
      : p.nameEn.includes("Hook")
      ? "Hand-cast artisanal bronze hook, ideal for decoration and organization."
      : p.nameEn.includes("Rod") || p.nameEn.includes("Finial")
      ? "Artisanal decorative bronze accessory, hand-cast by Mexican artisans."
      : "Hand-cast artisanal bronze pull, perfect for cabinets and furniture.",
  });
});

// ─── OUTPUT ───
function formatValue(val) {
  if (val === true) return "true";
  if (val === false) return "false";
  if (typeof val === "number") return String(val);
  if (Array.isArray(val)) {
    return `[${val.map((v) => `"${v}"`).join(", ")}]`;
  }
  if (typeof val === "string") {
    // Escape quotes in strings
    return `"${val.replace(/"/g, '\\"')}"`;
  }
  return String(val);
}

const lines = [];
const sections = [
  { startId: 173, endId: 177, label: "BATHROOM: SINKS (NEW)" },
  { startId: 178, endId: 182, label: "BATHROOM: FAUCETS (NEW)" },
  { startId: 183, endId: 189, label: "BATHROOM: SPA (NEW)" },
  { startId: 190, endId: 271, label: "BATHROOM: TOILETS (NEW)" },
  { startId: 272, endId: 302, label: "BATHROOM: SHOWERS (NEW)" },
  { startId: 303, endId: 343, label: "BATHROOM: ACCESSORIES (NEW)" },
  { startId: 344, endId: 359, label: "BATHROOM: DRAINS (NEW)" },
  { startId: 360, endId: 369, label: "BATHROOM: VALVES (NEW)" },
  { startId: 370, endId: 425, label: "HARDWARE: DOOR-LOCKS (NEW)" },
  { startId: 426, endId: 484, label: "HARDWARE: PULLS, HANDLES & HOOKS (NEW)" },
];

let sectionIdx = 0;

for (const product of products) {
  const id = parseInt(product.id);

  // Check if we need a section header
  if (sectionIdx < sections.length && id === sections[sectionIdx].startId) {
    lines.push(`  // ─── ${sections[sectionIdx].label} ───`);
    sectionIdx++;
  }

  lines.push("  {");
  const fields = [
    "id", "sku", "slug", "brand", "name", "nameEn",
    "category", "subcategory", "price", "currency",
    "finishes", "image", "artisanal", "description", "descriptionEn",
  ];
  for (const field of fields) {
    lines.push(`    ${field}: ${formatValue(product[field])},`);
  }
  lines.push("  },");
}

console.log(lines.join("\n"));
