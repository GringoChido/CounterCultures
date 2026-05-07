/**
 * Pre-staged hero images for brand pages — hand-picked editorial photos
 * served from /public/Assets/BRANDS/. Single source of truth: imported by
 * both the brands list and brand detail pages, plus the resources hub.
 *
 * Adding a slug here only works if the corresponding file exists. If the
 * file is missing, next/image will 404 on hover/scroll.
 */
export const BRAND_HERO_IMAGES: Record<string, string> = {
  // Batch 1 — flagship + early editorial
  kohler: "/Assets/BRANDS/kohler-hero.webp",
  toto: "/Assets/BRANDS/toto-hero.webp",
  brizo: "/Assets/BRANDS/brizo-hero.webp",
  blanco: "/Assets/BRANDS/blanco-hero.webp",
  "california-faucets": "/Assets/BRANDS/california-faucets-hero.webp",
  "sun-valley-bronze": "/Assets/BRANDS/sun-valley-bronze-hero.webp",
  emtek: "/Assets/BRANDS/emtek-hero.avif",
  badeloft: "/Assets/BRANDS/badeloft-hero.webp",
  "villeroy-boch": "/Assets/BRANDS/villeroy-boch-hero.webp",
  aquaspa: "/Assets/BRANDS/aquaspa-hero.webp",
  ebbe: "/Assets/BRANDS/ebbe-hero.webp",
  delta: "/Assets/BRANDS/delta-hero.webp",
  rohl: "/Assets/BRANDS/rohl-hero.webp",
  teka: "/Assets/BRANDS/teka-hero.webp",
  smeg: "/Assets/BRANDS/smeg-hero.webp",
  bluestar: "/Assets/BRANDS/bluestar-hero.webp",
  baldwin: "/Assets/BRANDS/baldwin-hero.webp",

  // Artisan makers (not in the import-list batches but routed via the
  // resources hub Brand Index; pages still need to render).
  bante: "/Assets/BRANDS/bante-hero.avif",
  mistoa: "/Assets/BRANDS/mistoa-hero.webp",

  // Batch 2 — Phase A (auto-downloaded)
  hansgrohe: "/Assets/BRANDS/hansgrohe-hero.webp",
  dornbracht: "/Assets/BRANDS/dornbracht-hero.webp",
  axor: "/Assets/BRANDS/axor-hero.webp",
  grohe: "/Assets/BRANDS/grohe-hero.webp",
  "thompson-traders": "/Assets/BRANDS/thompson-traders-hero.webp",
  "mti-baths": "/Assets/BRANDS/mti-baths-hero.webp",
  "stone-forest": "/Assets/BRANDS/stone-forest-hero.webp",
  gessi: "/Assets/BRANDS/gessi-hero.webp",
  "newport-brass": "/Assets/BRANDS/newport-brass-hero.webp",
  "rocky-mountain-hardware": "/Assets/BRANDS/rocky-mountain-hardware-hero.webp",
  "top-knobs": "/Assets/BRANDS/top-knobs-hero.webp",
  "native-trails": "/Assets/BRANDS/native-trails-hero.webp",

  // Batch 2 — Phase B (Playwright)
  duravit: "/Assets/BRANDS/duravit-hero.webp",
  kallista: "/Assets/BRANDS/kallista-hero.webp",
  robern: "/Assets/BRANDS/robern-hero.webp",
  "perrin-and-rowe": "/Assets/BRANDS/perrin-and-rowe-hero.webp",
  graff: "/Assets/BRANDS/graff-hero.webp",

  // Batch 3 (extraction pass 2)
  "american-standard": "/Assets/BRANDS/american-standard-hero.webp",
  kraus: "/Assets/BRANDS/kraus-hero.webp",
  "atlas-homewares": "/Assets/BRANDS/atlas-homewares-hero.webp",
  "fisher-and-paykel": "/Assets/BRANDS/fisher-and-paykel-hero.webp",
  "wyndham-collection": "/Assets/BRANDS/wyndham-collection-hero.webp",
  bosch: "/Assets/BRANDS/bosch-hero.webp",
  jacuzzi: "/Assets/BRANDS/jacuzzi-hero.webp",
  cheviot: "/Assets/BRANDS/cheviot-hero.webp",
  "buster-punch": "/Assets/BRANDS/buster-punch-hero.webp",
  "nostalgic-warehouse": "/Assets/BRANDS/nostalgic-warehouse-hero.webp",

  // Batch 4 (Playwright extraction pass 3)
  anzzi: "/Assets/BRANDS/anzzi-hero.webp",
  "swiss-madison": "/Assets/BRANDS/swiss-madison-hero.webp",
  ruvati: "/Assets/BRANDS/ruvati-hero.webp",
  dreamline: "/Assets/BRANDS/dreamline-hero.webp",
  linkasink: "/Assets/BRANDS/linkasink-hero.webp",
  "infinity-drain": "/Assets/BRANDS/infinity-drain-hero.webp",
  "ove-decors": "/Assets/BRANDS/ove-decors-hero.webp",

  // Batch 5 (Playwright extraction pass 4)
  pfister: "/Assets/BRANDS/pfister-hero.webp",
  watermark: "/Assets/BRANDS/watermark-hero.webp",
  waterstone: "/Assets/BRANDS/waterstone-hero.webp",
  lacava: "/Assets/BRANDS/lacava-hero.webp",
  "ws-bath-collections": "/Assets/BRANDS/ws-bath-collections-hero.webp",
  amerock: "/Assets/BRANDS/amerock-hero.webp",
  "liberty-hardware": "/Assets/BRANDS/liberty-hardware-hero.webp",
  hafele: "/Assets/BRANDS/hafele-hero.webp",
  "jeffrey-alexander": "/Assets/BRANDS/jeffrey-alexander-hero.webp",
  rusticware: "/Assets/BRANDS/rusticware-hero.webp",
  "emser-tile": "/Assets/BRANDS/emser-tile-hero.webp",
  "hickory-hardware": "/Assets/BRANDS/hickory-hardware-hero.webp",
  "acorn-manufacturing": "/Assets/BRANDS/acorn-manufacturing-hero.webp",
  symmons: "/Assets/BRANDS/symmons-hero.webp",
  "schaub-and-company": "/Assets/BRANDS/schaub-and-company-hero.webp",
  "vesta-fine-hardware": "/Assets/BRANDS/vesta-fine-hardware-hero.webp",
  "hapny-home": "/Assets/BRANDS/hapny-home-hero.webp",
  santec: "/Assets/BRANDS/santec-hero.webp",
  "karran-usa": "/Assets/BRANDS/karran-usa-hero.webp",
  whitehaus: "/Assets/BRANDS/whitehaus-hero.webp",
  shaw: "/Assets/BRANDS/shaw-hero.webp",
  keeler: "/Assets/BRANDS/keeler-hero.webp",
  thermasol: "/Assets/BRANDS/thermasol-hero.webp",
  "hardware-resources": "/Assets/BRANDS/hardware-resources-hero.webp",
  deltana: "/Assets/BRANDS/deltana-hero.webp",
  "ico-bath": "/Assets/BRANDS/ico-bath-hero.webp",

  // Batch 8 (Playwright extraction pass 5)
  sietto: "/Assets/BRANDS/sietto-hero.webp",
  zurn: "/Assets/BRANDS/zurn-hero.webp",
  "cruz-bay-studio": "/Assets/BRANDS/cruz-bay-studio-hero.webp",
  transolid: "/Assets/BRANDS/transolid-hero.webp",
  "amba-products": "/Assets/BRANDS/amba-products-hero.webp",
  "belwith-products": "/Assets/BRANDS/belwith-products-hero.webp",
  mansfield: "/Assets/BRANDS/mansfield-hero.webp",
  "classic-brass": "/Assets/BRANDS/classic-brass-hero.webp",
  "r-christensen": "/Assets/BRANDS/r-christensen-hero.webp",

  // Batch 9 (Playwright extraction pass 6)
  "hardware-renaissance": "/Assets/BRANDS/hardware-renaissance-hero.webp",
  panasonic: "/Assets/BRANDS/panasonic-hero.webp",
  marazzi: "/Assets/BRANDS/marazzi-hero.webp",
  eago: "/Assets/BRANDS/eago-hero.webp",
  kasaware: "/Assets/BRANDS/kasaware-hero.webp",
  "t-and-s-brass": "/Assets/BRANDS/t-and-s-brass-hero.webp",

  // Batch 10 (Playwright extraction pass 7)
  "blaze-products": "/Assets/BRANDS/blaze-products-hero.webp",
  peerless: "/Assets/BRANDS/peerless-hero.webp",
  sloan: "/Assets/BRANDS/sloan-hero.webp",

  // Batch 11 (second-attempt pass)
  sterling: "/Assets/BRANDS/sterling-hero.webp",
  "chicago-faucets": "/Assets/BRANDS/chicago-faucets-hero.webp",
  bereson: "/Assets/BRANDS/bereson-hero.webp",
  ginger: "/Assets/BRANDS/ginger-hero.webp",
  samsung: "/Assets/BRANDS/samsung-hero.webp",

  // Batch 12–13 (deeper page strategies)
  dxv: "/Assets/BRANDS/dxv-hero.webp",
  "original-mission-tile": "/Assets/BRANDS/original-mission-tile-hero.webp",
};
