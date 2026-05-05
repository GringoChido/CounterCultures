import type { BilingualText } from "./types";

export type HotelRegion = "san-miguel" | "los-cabos" | "quintana-roo";

export interface HotelClient {
  slug: string;
  name: string;
  location: BilingualText;
  region: HotelRegion;
  website: string;
  heroImage: string;
}

export const HOTEL_REGIONS: Record<HotelRegion, BilingualText> = {
  "san-miguel": { en: "San Miguel de Allende", es: "San Miguel de Allende" },
  "los-cabos": { en: "Los Cabos", es: "Los Cabos" },
  "quintana-roo": { en: "Quintana Roo", es: "Quintana Roo" },
};

export const HOTEL_CLIENTS: HotelClient[] = [
  {
    slug: "casa-dragones",
    name: "La Casa Dragones",
    location: { en: "San Miguel de Allende", es: "San Miguel de Allende" },
    region: "san-miguel",
    website: "https://casadragones.com.mx/visitanos/la-casa-dragones",
    heroImage: "/images/projects/hotels/casa-dragones.jpg",
  },
  {
    slug: "belmond-sierra-nevada",
    name: "Belmond Casa de Sierra Nevada",
    location: { en: "San Miguel de Allende", es: "San Miguel de Allende" },
    region: "san-miguel",
    website:
      "https://www.belmond.com/hotels/north-america/mexico/san-miguel-de-allende/belmond-casa-de-sierra-nevada/",
    heroImage: "/images/projects/hotels/belmond-sierra-nevada.jpg",
  },
  {
    slug: "casa-no-name",
    name: "Casa No Name",
    location: { en: "San Miguel de Allende", es: "San Miguel de Allende" },
    region: "san-miguel",
    website: "https://www.casanoname.com.mx/",
    heroImage: "/images/projects/hotels/casa-no-name.jpg",
  },
  {
    slug: "hotel-amparo",
    name: "Hotel Amparo",
    location: { en: "San Miguel de Allende", es: "San Miguel de Allende" },
    region: "san-miguel",
    website:
      "https://www.myboutiquehotel.com/es/boutique-hotels-san-miguel-de-allende/hotel-amparo.html",
    heroImage: "/images/projects/hotels/hotel-amparo.jpg",
  },
  {
    slug: "rosewood-sma",
    name: "Rosewood San Miguel de Allende",
    location: { en: "San Miguel de Allende", es: "San Miguel de Allende" },
    region: "san-miguel",
    website: "https://www.rosewoodhotels.com/en/san-miguel-de-allende",
    heroImage: "/images/projects/hotels/rosewood-sma.jpg",
  },
  {
    slug: "clevia-sma",
    name: "Cleviá, Autograph Collection",
    location: { en: "San Miguel de Allende", es: "San Miguel de Allende" },
    region: "san-miguel",
    website:
      "https://www.marriott.com/en-us/hotels/bjxak-clevia-san-miguel-de-allende-autograph-collection/overview/",
    heroImage: "/images/projects/hotels/clevia-sma.webp",
  },
  {
    slug: "cabo-azul",
    name: "Hilton Vacation Club Cabo Azul",
    location: { en: "Los Cabos", es: "Los Cabos" },
    region: "los-cabos",
    website:
      "https://www.hilton.com/en/hotels/sjdcagv-hilton-vacation-club-cabo-azul-los-cabos/",
    heroImage: "/images/projects/hotels/cabo-azul.jpg",
  },
  {
    slug: "querencia",
    name: "Querencia",
    location: { en: "Los Cabos", es: "Los Cabos" },
    region: "los-cabos",
    website: "https://qcabo.com/",
    heroImage: "/images/projects/hotels/querencia.jpg",
  },
  {
    slug: "one-only-palmilla",
    name: "One&Only Palmilla",
    location: { en: "Los Cabos", es: "Los Cabos" },
    region: "los-cabos",
    website: "https://www.oneandonlyresorts.com/palmilla",
    heroImage: "/images/projects/hotels/one-only-palmilla.webp",
  },
  {
    slug: "el-dorado-golf",
    name: "El Dorado Golf & Beach Club",
    location: { en: "Los Cabos", es: "Los Cabos" },
    region: "los-cabos",
    website: "https://www.eldoradobeachclub.com/",
    heroImage: "/images/projects/hotels/el-dorado-golf.jpg",
  },
  {
    slug: "maroma-belmond",
    name: "Belmond Maroma",
    location: { en: "Riviera Maya", es: "Riviera Maya" },
    region: "quintana-roo",
    website:
      "https://www.belmond.com/hotels/north-america/mexico/riviera-maya/belmond-maroma-resort-and-spa/",
    heroImage: "/images/projects/hotels/maroma-belmond.jpg",
  },
];
