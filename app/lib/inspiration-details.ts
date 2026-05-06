import type { BilingualText } from "./types";

export interface InspirationDetail {
  src: string;
  alt: BilingualText;
  caption: BilingualText;
  brand: string;
  projectSlug: string;
  projectTitle: string;
}

export const INSPIRATION_DETAILS: InspirationDetail[] = [
  {
    src: "/images/kitchen/faucets.webp",
    alt: {
      en: "Brizo Litze in Luxe Gold over BLANCO Silgranit",
      es: "Brizo Litze en Luxe Gold sobre BLANCO Silgranit",
    },
    caption: {
      en: "Litze pull-down · Luxe Gold · BLANCO Silgranit",
      es: "Litze extraíble · Luxe Gold · BLANCO Silgranit",
    },
    brand: "Brizo · BLANCO",
    projectSlug: "casa-atelier",
    projectTitle: "Casa Atelier",
  },
  {
    src: "/images/bathroom/sinks.webp",
    alt: {
      en: "Hand-hammered copper vessel by Don Miguel",
      es: "Lavabo de cobre martillado por Don Miguel",
    },
    caption: {
      en: "Hand-hammered copper · Santa Clara del Cobre",
      es: "Cobre martillado a mano · Santa Clara del Cobre",
    },
    brand: "Counter Cultures Artisanal",
    projectSlug: "casa-atelier",
    projectTitle: "Casa Atelier",
  },
  {
    src: "/images/bathroom/bathtubs.webp",
    alt: {
      en: "Badeloft freestanding soaker with California Faucets filler",
      es: "Bañera Badeloft con llenador California Faucets",
    },
    caption: {
      en: "Badeloft soaker · California Faucets floor-mount filler",
      es: "Bañera Badeloft · llenador de piso California Faucets",
    },
    brand: "Badeloft · California Faucets",
    projectSlug: "casa-atelier",
    projectTitle: "Casa Atelier",
  },
  {
    src: "/Assets/Santa Clara del Cobre.webp",
    alt: {
      en: "Custom artisanal copper vessel sink — Hotel Jardín lobby",
      es: "Lavabo vessel de cobre artesanal — lobby Hotel Jardín",
    },
    caption: {
      en: "Custom commission · Don Miguel",
      es: "Comisión a medida · Don Miguel",
    },
    brand: "Counter Cultures Artisanal",
    projectSlug: "hotel-jardin-de-la-sierra",
    projectTitle: "Hotel Jardín de la Sierra",
  },
  {
    src: "/images/hardware/brass-lever.webp",
    alt: {
      en: "Sun Valley Bronze Contemporary entry set in Silicon Bronze",
      es: "Cerradura Sun Valley Bronze Contemporary en Bronce al Silicio",
    },
    caption: {
      en: "Contemporary entry set · Silicon Bronze · mesquite",
      es: "Cerradura Contemporary · Bronce al Silicio · mezquite",
    },
    brand: "Sun Valley Bronze",
    projectSlug: "residencia-el-charco",
    projectTitle: "Residencia El Charco",
  },
  {
    src: "/images/kitchen/sinks.webp",
    alt: {
      en: "BLANCO Ikon apron sink with California Faucets Davoli bridge",
      es: "Tarja BLANCO Ikon con mezcladora California Faucets Davoli",
    },
    caption: {
      en: "BLANCO Ikon · Anthracite · CF Davoli bridge",
      es: "BLANCO Ikon · Anthracite · puente CF Davoli",
    },
    brand: "BLANCO · California Faucets",
    projectSlug: "residencia-el-charco",
    projectTitle: "Residencia El Charco",
  },
  {
    src: "/images/bathroom/drains.webp",
    alt: {
      en: "Ebbe Lattice drain with TOTO fixtures",
      es: "Drenaje Ebbe Lattice con accesorios TOTO",
    },
    caption: {
      en: "Ebbe Lattice · matte black · restaurant restroom",
      es: "Ebbe Lattice · negro mate · baño de restaurante",
    },
    brand: "Ebbe · TOTO",
    projectSlug: "restaurante-lumbre",
    projectTitle: "Restaurante Lumbre",
  },
  {
    src: "/Assets/Mistoa Studio.webp",
    alt: {
      en: "Mistoa Surco basin in Azul Profundo with California Faucets Christopher",
      es: "Lavabo Mistoa Surco en Azul Profundo con CF Christopher",
    },
    caption: {
      en: "Mistoa Surco · Azul Profundo · CF Christopher · matte black",
      es: "Mistoa Surco · Azul Profundo · CF Christopher · negro mate",
    },
    brand: "Mistoa · California Faucets",
    projectSlug: "casa-del-parque",
    projectTitle: "Casa del Parque",
  },
  {
    src: "/images/hardware/deadbolt.webp",
    alt: {
      en: "Emtek Hampton Edition knobs in Flat Black",
      es: "Perillas Emtek Hampton Edition en Negro Mate",
    },
    caption: {
      en: "Emtek Hampton · Flat Black · interior doors",
      es: "Emtek Hampton · Negro Mate · puertas interiores",
    },
    brand: "Emtek",
    projectSlug: "casa-del-parque",
    projectTitle: "Casa del Parque",
  },
];
