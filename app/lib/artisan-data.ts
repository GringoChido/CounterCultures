export interface ArtisanProfile {
  name: string;
  craft: { en: string; es: string };
  detail: { en: string; es: string };
  image: string;
  href: string;
}

export const artisans: ArtisanProfile[] = [
  {
    name: "Mistoa",
    craft: {
      en: "Ceramic and concrete basins",
      es: "Lavabos de cerámica y concreto",
    },
    detail: {
      en: "Concrete and ceramic basins poured by hand in Querétaro since 2012.",
      es: "Lavabos de concreto y cerámica vaciados a mano en Querétaro desde 2012.",
    },
    image: "/Assets/Mistoa Studio.webp",
    href: "/brands/mistoa",
  },
  {
    name: "Castro",
    craft: {
      en: "Copper and brass",
      es: "Cobre y latón",
    },
    detail: {
      en: "Fourth-generation copper hammerers from Santa Clara del Cobre.",
      es: "Martilladores de cobre de cuarta generación en Santa Clara del Cobre.",
    },
    image: "/Assets/Santa Clara del Cobre.webp",
    href: "/brands/castro",
  },
  {
    name: "Familia Meza",
    craft: {
      en: "Stone",
      es: "Piedra",
    },
    detail: {
      en: "Three generations carving volcanic stone basins in San Miguel.",
      es: "Tres generaciones tallando lavabos de piedra volcánica en San Miguel.",
    },
    image: "/Assets/Stone Artisans.webp",
    href: "/brands/familia-meza",
  },
  {
    name: "Manriquez",
    craft: {
      en: "Cast bronze pulls and accessories",
      es: "Jaladeras y accesorios de bronce fundido",
    },
    detail: {
      en: "A bronze foundry whose lost-wax techniques predate the Mexican Republic.",
      es: "Una fundición de bronce cuyas técnicas de cera perdida preceden a la República Mexicana.",
    },
    image: "/products/odoo/2045767.jpg",
    href: "/brands/manriquez",
  },
];
