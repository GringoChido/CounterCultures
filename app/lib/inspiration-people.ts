import type { BilingualText } from "./types";

export type PersonRole = "architect" | "artisan";

export interface InspirationPerson {
  name: string;
  firm?: string;
  role: PersonRole;
  location: BilingualText;
  bio: BilingualText;
  projectSlugs: string[];
}

export const INSPIRATION_PEOPLE: InspirationPerson[] = [
  {
    name: "Studio Arquitectura MX",
    firm: "Arq. Carolina Mendoza · Arq. Sofía Villanueva",
    role: "architect",
    location: { en: "San Miguel de Allende", es: "San Miguel de Allende" },
    bio: {
      en: "A studio that bridges colonial heritage and rigorously modern interiors. Counter Cultures has specified for two of their landmark projects.",
      es: "Un estudio que une la herencia colonial con interiores rigurosamente modernos. Counter Cultures ha especificado para dos de sus proyectos emblemáticos.",
    },
    projectSlugs: ["casa-atelier", "hotel-jardin-de-la-sierra"],
  },
  {
    name: "TAC Arquitectos",
    role: "architect",
    location: { en: "San Miguel de Allende", es: "San Miguel de Allende" },
    bio: {
      en: "Hospitality and commercial work with a moody, material-forward sensibility. Their open-kitchen restaurants demand fixtures that survive 300 covers a night.",
      es: "Hotelería y comercial con una sensibilidad oscura y centrada en materiales. Sus restaurantes de cocina abierta demandan accesorios que sobrevivan 300 cubiertos por noche.",
    },
    projectSlugs: ["restaurante-lumbre"],
  },
  {
    name: "Arq. David Torres Robles",
    role: "architect",
    location: { en: "San Miguel de Allende", es: "San Miguel de Allende" },
    bio: {
      en: "Contemporary interpretations of traditional Mexican ranch architecture — thick adobe, exposed beams, deep portales. He calls when a project needs the right hardware on the right door.",
      es: "Interpretaciones contemporáneas de la arquitectura ranchera mexicana tradicional — adobe grueso, vigas expuestas, portales profundos. Llama cuando un proyecto necesita el herraje correcto en la puerta correcta.",
    },
    projectSlugs: ["residencia-el-charco"],
  },
  {
    name: "Arq. Martín Ramírez",
    role: "architect",
    location: { en: "San Miguel de Allende", es: "San Miguel de Allende" },
    bio: {
      en: "Restrained palettes — whitewashed stucco, terrazzo, black steel. Counter Cultures supplied the all-Emtek hardware package for his park-facing residence.",
      es: "Paletas contenidas — estuco encalado, terrazo, acero negro. Counter Cultures suministró el paquete completo de herrajes Emtek para su residencia frente al parque.",
    },
    projectSlugs: ["casa-del-parque"],
  },
  {
    name: "Don Miguel",
    firm: "Santa Clara del Cobre",
    role: "artisan",
    location: { en: "Michoacán", es: "Michoacán" },
    bio: {
      en: "Third-generation copper master. His hand-hammered vessel basins anchor entries, powder rooms, and hotel lobbies across our work.",
      es: "Maestro del cobre de tercera generación. Sus lavabos vessel de cobre martillado anclan entradas, medios baños y lobbies de hotel en nuestro trabajo.",
    },
    projectSlugs: ["casa-atelier", "hotel-jardin-de-la-sierra"],
  },
  {
    name: "Taller Piedra Viva",
    role: "artisan",
    location: { en: "Querétaro", es: "Querétaro" },
    bio: {
      en: "Cantera rosa hand-carved into vessel sinks and stone tubs. The sixteen guest-room basins at Hotel Cantera each came from this workshop.",
      es: "Cantera rosa tallada a mano en lavabos vessel y bañeras de piedra. Los dieciséis lavabos de las habitaciones del Hotel Cantera salieron de este taller.",
    },
    projectSlugs: ["boutique-hotel-cantera"],
  },
];
