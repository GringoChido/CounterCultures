import type { BilingualText } from "./types";

export interface NotableInstallation {
  slug: string;
  name: BilingualText;
  description: BilingualText;
  /** External destination URL — these are real client properties */
  href: string;
  image: string;
  /** Optional CSS object-position override for awkward crops */
  imagePosition?: string;
}

export const NOTABLE_INSTALLATIONS: NotableInstallation[] = [
  {
    slug: "punta-mita",
    name: { en: "Punta Mita", es: "Punta Mita" },
    description: {
      en: "Luxury resort community on Mexico's Pacific coast — home to Four Seasons and St. Regis properties.",
      es: "Comunidad turística de lujo en la costa del Pacífico de México — sede de Four Seasons y St. Regis.",
    },
    href: "https://www.puntamita.com/es/",
    image: "/Assets/projects/punta-mita.jpg",
  },
  {
    slug: "four-seasons-caye-chapel",
    name: {
      en: "Four Seasons Caye Chapel",
      es: "Four Seasons Caye Chapel",
    },
    description: {
      en: "Private island residences in Belize — bespoke fixtures for a world-class development.",
      es: "Residencias en isla privada en Belice — accesorios a medida para un desarrollo de clase mundial.",
    },
    href: "https://www.fourseasons.com/residences/private_residences/belize/",
    image: "/Assets/projects/caye-chapel.jpeg",
    imagePosition: "center 30%",
  },
  {
    slug: "tequila-express",
    name: { en: "Tequila Express", es: "Tequila Express" },
    description: {
      en: "Mexico's iconic scenic railway through Jalisco's tequila country.",
      es: "El icónico tren escénico de México a través de la región tequilera de Jalisco.",
    },
    href: "https://www.tequilaexpress.mx/",
    image: "/Assets/projects/tequila-express.jpg",
  },
];
