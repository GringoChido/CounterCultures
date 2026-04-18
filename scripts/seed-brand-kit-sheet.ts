/**
 * Week 2 Day 1 — Brand Kit Sheet seed.
 *
 * Creates a new Google Sheet "Brand Kit" inside the Counter Cultures
 * Brand Kit folder, seeds a `brands` tab with the 25-column schema
 * agreed with Joshua, and pre-populates 73 rows:
 *   - 71 unique brands extracted from /Users/joshuasemolik/Desktop/BRANDS.docx
 *   - + BLANCO and BlueStar (present on current storefront, not in doc)
 *
 * Idempotent: aborts if a "Brand Kit" spreadsheet already lives in the folder.
 * Shares the Sheet with jsemolik@gmail.com as editor on creation.
 *
 * Run with: npx tsx scripts/seed-brand-kit-sheet.ts
 */

import { google } from "googleapis";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

// "Brand Kit" folder inside the "Counter Cultures" Shared Drive.
// Born fresh in the Shared Drive per the hybrid-architecture rule (brief §5a).
// The legacy personal-Drive folder 1MO4DV-aWqqjNPcpEAwU5_bEXATZzvQYZ is deprecated.
const BRAND_KIT_FOLDER_ID = "11dN5ngdFuLWvOKMfyRKk0tjCjXHgjSjj";
const SHEET_TITLE = "Brand Kit";
const TAB_TITLE = "brands";

const HEADER = [
  "slug",
  "name",
  "tagline_en",
  "tagline_es",
  "description_en",
  "description_es",
  "origin_country",
  "origin_country_name",
  "website_url",
  "external_url",
  "stocked_state",
  "primary_category_slug",
  "category_slugs",
  "logo_drive_id",
  "hero_drive_id",
  "brand_folder_drive_id",
  "featured_product_ids",
  "featured_project_slugs",
  "nom_status_summary",
  "is_artisan",
  "is_featured",
  "display_order",
  "created_at",
  "updated_at",
  "updated_by",
] as const;

type CategorySlug =
  | "faucetry-showers"
  | "door-cabinet-hardware"
  | "bathroom-sinks"
  | "kitchen-sinks"
  | "drains"
  | "toilets"
  | "bathtubs"
  | "appliances"
  | "other";

interface BrandSeed {
  slug: string;
  name: string;
  descriptionEn: string;
  primaryCategorySlug: CategorySlug;
  categorySlugs: CategorySlug[];
  originCountry?: string;
  originCountryName?: string;
  isFeatured?: boolean;
  displayOrder?: number;
}

// ── Source data: doc sections verbatim ──────────────────────────────────

interface DocRow {
  name: string;
  description: string;
  origin?: string; // ISO-2 where confidently inferable; else undefined
  originName?: string;
}

const FAUCETRY_SHOWERS: DocRow[] = [
  { name: "Delta", description: "Known for innovative designs, Delta offers a wide range of faucets and showerheads that combine functionality with style.", origin: "US", originName: "United States" },
  { name: "Dornbracht", description: "A luxury brand specializing in high-end bathroom and kitchen faucets with contemporary designs and advanced technology.", origin: "DE", originName: "Germany" },
  { name: "Alape", description: "A German manufacturer focusing on stylish washbasins and furniture for bathrooms, emphasizing design and craftsmanship.", origin: "DE", originName: "Germany" },
  { name: "Amba Products", description: "Known for high-quality towel warmers and bathroom accessories designed to enhance comfort and luxury." },
  { name: "Atlas Homewares", description: "Offers an array of decorative cabinet hardware, including knobs and pulls that add elegance to home interiors.", origin: "US", originName: "United States" },
  { name: "Baldwin Hardware", description: "Renowned for its craftsmanship in door hardware, Baldwin offers a variety of stylish products including handles, locks, and knobs.", origin: "US", originName: "United States" },
  { name: "Brizo", description: "A luxury brand under Delta Faucet, Brizo emphasizes fashion-forward style and innovative features in its faucets.", origin: "US", originName: "United States" },
  { name: "California Faucets", description: "Specializes in customizable bathroom and kitchen fixtures, combining luxury with sustainable practices.", origin: "US", originName: "United States" },
  { name: "Kohler", description: "A leading global designer of kitchen and bath products known for quality and innovation, including stylish sinks and faucets.", origin: "US", originName: "United States" },
  { name: "KWC", description: "A Swiss brand known for its precision-engineered faucets with a focus on design and functionality.", origin: "CH", originName: "Switzerland" },
  { name: "Teka", description: "Offers a comprehensive range of faucets, sinks, and kitchen appliances that combine style and functionality.", origin: "ES", originName: "Spain" },
  { name: "Grohe", description: "A global leader in sanitary fittings, Grohe focuses on delivering quality, technology, and design in its faucets and showers.", origin: "DE", originName: "Germany" },
  { name: "Hansgrohe", description: "Renowned for high-quality shower systems and faucets, Hansgrohe combines innovative technology with elegant designs.", origin: "DE", originName: "Germany" },
  { name: "JSG Oceana", description: "Offers artisanal sinks and bowls, known for their unique designs and use of high-quality materials." },
  { name: "LaCava", description: "Provides luxurious bathroom fixtures with an emphasis on clean lines and modern aesthetics." },
  { name: "Rohl", description: "Known for high-end kitchen and bath fixtures inspired by historical styles and traditional craftsmanship." },
  { name: "Rubinet", description: "A Canadian brand that combines innovative technology with high-quality materials in its faucet designs.", origin: "CA", originName: "Canada" },
  { name: "Santec", description: "Focuses on elegant and functional kitchen and bath fixtures, blending classic styles with modern needs." },
  { name: "Sigma", description: "A manufacturer of bathroom fixtures known for innovative designs and customizable options.", origin: "US", originName: "United States" },
  { name: "Sun Valley Bronze Hardware", description: "Offers handcrafted, rustic door and cabinet hardware that emphasizes durability and craftsmanship.", origin: "US", originName: "United States" },
  { name: "Thermasol", description: "Specializes in steam shower products that enhance relaxation and wellness in the home.", origin: "US", originName: "United States" },
  { name: "Watermark", description: "Known for solid brass bath fixtures that combine luxurious design with high-quality engineering.", origin: "US", originName: "United States" },
  { name: "Waterstone", description: "Focuses on kitchen faucets and accessories that blend traditional designs with modern technology.", origin: "US", originName: "United States" },
  { name: "Viega", description: "Offers innovative plumbing and heating solutions, including high-quality fixtures for kitchens and bathrooms.", origin: "DE", originName: "Germany" },
];

const DOOR_CABINET_HARDWARE: DocRow[] = [
  { name: "Acorn Manufacturing", description: "Offers a range of handcrafted decorative hardware, known for its classic and rustic styles.", origin: "US", originName: "United States" },
  { name: "Ashley Norton", description: "Specializes in high-end decorative hardware for doors and cabinetry, combining quality materials with stylish designs." },
  { name: "Belwith Products", description: "Known for stylish and functional cabinet hardware including knobs, pulls, and backplates to enhance interior design.", origin: "US", originName: "United States" },
  { name: "Berenson", description: "Offers a wide variety of cabinet hardware including stylish knobs, pulls, and other decorative options." },
  { name: "Classic Brass", description: "A premium brand that provides cabinet hardware and bathroom fittings, known for its quality craftsmanship." },
  { name: "Colonial Bronze", description: "Specializes in premium decorative hardware including hinges, knobs, and pulls with a focus on timeless design." },
  { name: "Deltana", description: "Provides comprehensive hardware solutions, including both decorative and functional hardware.", origin: "US", originName: "United States" },
  { name: "Sun Valley Bronze", description: "Offers handcrafted rustic and decorative hardware including knobs, pulls, and hinges.", origin: "US", originName: "United States" },
  { name: "Emtek", description: "Focuses on customizable cabinet and door hardware, allowing for personalized designs and styles.", origin: "US", originName: "United States" },
  { name: "Hardware Renaissance", description: "Known for high-quality decorative hardware, including unique designs in door knobs and cabinet pulls." },
  { name: "IDH by St. Simons", description: "Offers a wide range of decorative and functional hardware with a focus on quality and craftsmanship." },
  { name: "Rocky Mountain Hardware", description: "Handcrafts luxury door and cabinet hardware, known for its attention to detail and unique designs.", origin: "US", originName: "United States" },
  { name: "Siro Designs", description: "Provides a variety of elegant cabinet handles and accessories that emphasize quality and style." },
  { name: "S. Parker Hardware", description: "A manufacturer of high-quality, innovative hardware solutions for both residential and commercial applications." },
];

const BATHROOM_SINKS: DocRow[] = [
  { name: "Alno", description: "Offers a collection of unique and stylish bathroom sinks that enhance the overall aesthetic of bathroom spaces." },
  { name: "Badeloft", description: "Specializes in premium stone sinks and bathtubs known for their sleek modern designs.", origin: "DE", originName: "Germany" },
  { name: "Cheviot", description: "Known for producing durable and stylish porcelain and cast iron sinks made for both traditional and contemporary bathrooms." },
  { name: "Dornbracht", description: "This brand combines cutting-edge technology with elegant designs in its bathroom collections." },
  { name: "Franke", description: "Renowned for their high-quality sinks, Franke offers stylish and functional options for both kitchens and bathrooms.", origin: "CH", originName: "Switzerland" },
  { name: "ICERA", description: "Provides modern, innovative bathroom fixtures including high-efficiency toilets and stylish sinks." },
  { name: "Kohler", description: "A well-known name offering a wide range of bathroom sinks that combine function, style, and innovation." },
  { name: "Julien", description: "Offers high-end sinks with customization options to fit any bathroom decor and need.", origin: "CA", originName: "Canada" },
  { name: "Native Trails", description: "Specializes in artisan sinks made from recycled materials, focusing on eco-friendly designs that enhance bathroom spaces.", origin: "US", originName: "United States" },
  { name: "Sietto", description: "Known for its colorful and artistic sink designs that add a creative touch to bathrooms." },
  { name: "Stone Forest", description: "Offers unique stone sinks that are handcrafted, adding a natural and luxurious element to bathrooms.", origin: "US", originName: "United States" },
  { name: "Victoria & Albert", description: "Renowned for its beautiful freestanding and undermount sinks, combining traditional craftsmanship with modern design.", origin: "GB", originName: "United Kingdom" },
];

const KITCHEN_SINKS: DocRow[] = [
  { name: "Blaze Products", description: "Offers durable outdoor kitchen sinks designed for grilling and cooking outside." },
  { name: "Elkay", description: "A leader in kitchen sinks, known for quality craftsmanship and innovative designs that fit various kitchen styles.", origin: "US", originName: "United States" },
  { name: "Franke", description: "Provides a variety of sinks catering to both kitchens and bathrooms, emphasizing hygiene and design." },
  { name: "Houzer", description: "Offers stylish and functional kitchen sinks that blend durability with aesthetic appeal." },
  { name: "Kingston Brass", description: "Known for vintage-style kitchen sinks that combine functionality and timeless design.", origin: "US", originName: "United States" },
  { name: "Sietto", description: "Adds artistic flair to kitchen spaces with its vibrant and creatively designed sinks." },
  { name: "Stone Forest", description: "Provides natural stone kitchen sinks that add an organic touch and unique style to any kitchen." },
  { name: "Teka", description: "Offers a wide range of kitchen sinks and appliances with a focus on modern design and innovation." },
];

const DRAINS: DocRow[] = [
  { name: "Ebbe America", description: "Specializes in innovative and stylish drainage solutions tailored for various flooring styles.", origin: "US", originName: "United States" },
  { name: "Infinity Drain", description: "Known for contemporary linear drainage systems that enhance the aesthetics and functionality of bathrooms and kitchens.", origin: "US", originName: "United States" },
  { name: "QuickDrain", description: "Offers advanced drainage solutions including linear drains designed for efficient water management." },
];

const TOILETS: DocRow[] = [
  { name: "Duravit", description: "Renowned for stylish, functional bathroom fixtures including high-quality toilets that emphasize user comfort.", origin: "DE", originName: "Germany" },
  { name: "R&T", description: "Provides high-quality toilets that combine performance with modern design aesthetics." },
  { name: "TOTO", description: "A leading manufacturer known for high-performance toilets and eco-friendly designs that prioritize hygiene and comfort.", origin: "JP", originName: "Japan" },
  { name: "Grohe", description: "Offers a range of beautifully designed toilets known for their quality, innovation, and functional features." },
  // "Kohl" in the source doc is a typo of Kohler — skipping to avoid a duplicate row.
  { name: "Villeroy & Boch", description: "Offers premium bathroom fixtures, including toilets that combine modern design with historical craftsmanship.", origin: "DE", originName: "Germany" },
];

const BATHTUBS: DocRow[] = [
  { name: "Aquaspa", description: "Specializes in luxurious soaking and whirlpool bathtubs designed for ultimate relaxation." },
  { name: "Badeloft", description: "Offers exquisite bathtubs crafted from solid surface materials, known for elegant designs and durability." },
  { name: "Jacuzzi", description: "A pioneer in whirlpool technology, known for its luxurious bathtubs that provide ultimate relaxation and comfort.", origin: "US", originName: "United States" },
  { name: "Maax", description: "Offers a variety of stylish and functional bathtubs, including freestanding and alcove models designed for comfort.", origin: "CA", originName: "Canada" },
  { name: "MTI Baths", description: "Specializes in high-quality, customizable bathtubs and sinks, blending luxury with functionality.", origin: "US", originName: "United States" },
];

const APPLIANCES: DocRow[] = [
  { name: "Teka", description: "Provides a wide range of kitchen sinks and appliances with a focus on modern design and innovation." },
  { name: "Bosch", description: "Renowned for high-quality kitchen appliances, including dishwashers, ovens, and cooktops designed for efficiency.", origin: "DE", originName: "Germany" },
  { name: "KitchenAid", description: "Known for its kitchen appliances, including mixers and ovens, combining versatile designs with professional quality.", origin: "US", originName: "United States" },
  { name: "Samsung", description: "Offers a wide variety of high-tech kitchen and home appliances, blending innovation with modern design.", origin: "KR", originName: "South Korea" },
  { name: "Smeg", description: "An Italian brand known for its stylish and retro-inspired kitchen appliances that offer both functionality and charm.", origin: "IT", originName: "Italy" },
];

const OTHER: DocRow[] = [
  { name: "Ginger", description: "Offers a collection of decorative bath accessories, focusing on high-quality materials and stylish designs." },
  { name: "Jason", description: "Provides a variety of bathroom accessories and fixtures that emphasize quality and innovation." },
  { name: "Robern", description: "Specializes in custom cabinetry and storage solutions for bathrooms, focusing on functionality and modern design.", origin: "US", originName: "United States" },
  { name: "Grohe", description: "A global leader in sanitary fittings with products for both bath and shower systems that combine technology with design." },
  { name: "Hansgrohe", description: "Offers a wide range of shower systems and faucets that emphasize both modern design and eco-friendly features." },
  { name: "Panasonic", description: "Provides advanced water treatment and heating solutions, including tankless water heaters and energy-efficient products.", origin: "JP", originName: "Japan" },
  { name: "Watermark", description: "Known for premium bath fixtures that combine luxurious designs with high-quality engineering." },
  { name: "Original Mission Tile", description: "Offers handcrafted ceramic tiles inspired by historical designs, perfect for unique surfaces." },
];

// ── Not in BRANDS.docx but on current storefront — keep coverage ────────

const EXTRA_STOREFRONT: BrandSeed[] = [
  {
    slug: "blanco",
    name: "BLANCO",
    descriptionEn:
      "German engineering meets kitchen design. BLANCO's patented Silgranit material is heat, scratch, and stain resistant, trusted by architects specifying high-traffic kitchens.",
    primaryCategorySlug: "kitchen-sinks",
    categorySlugs: ["kitchen-sinks"],
    originCountry: "DE",
    originCountryName: "Germany",
    isFeatured: true,
    displayOrder: 4,
  },
  {
    slug: "bluestar",
    name: "BlueStar",
    descriptionEn:
      "American-made professional ranges, cooktops, and wall ovens with open-burner performance and over 1,000 color finishes — the chef's range for residential kitchens.",
    primaryCategorySlug: "appliances",
    categorySlugs: ["appliances"],
    originCountry: "US",
    originCountryName: "United States",
  },
];

// ── Slug normalization ──────────────────────────────────────────────────

// Where we want a specific slug (typically to match pre-staged hero asset paths
// under /public/Assets/brand-images/).
const SLUG_OVERRIDES: Record<string, string> = {
  "Sun Valley Bronze Hardware": "sun-valley-bronze",
  "Sun Valley Bronze": "sun-valley-bronze",
  "Baldwin Hardware": "baldwin",
  "Ebbe America": "ebbe",
  "Villeroy & Boch": "villeroy-boch",
  "S. Parker Hardware": "s-parker",
  "IDH by St. Simons": "idh-st-simons",
  "R&T": "r-and-t",
  "MTI Baths": "mti-baths",
};

const defaultSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const slugFor = (name: string): string =>
  SLUG_OVERRIDES[name] ?? defaultSlug(name);

// ── Flagship featured set (from public/Assets/brand-images/01_Flagship) ─

const FLAGSHIP: Record<string, number> = {
  kohler: 1,
  toto: 2,
  brizo: 3,
  blanco: 4,
  "california-faucets": 5,
  "sun-valley-bronze": 6,
};

// ── Merge doc sections into deduped brand list ──────────────────────────

const CATEGORY_SECTIONS: Array<[CategorySlug, DocRow[]]> = [
  ["faucetry-showers", FAUCETRY_SHOWERS],
  ["door-cabinet-hardware", DOOR_CABINET_HARDWARE],
  ["bathroom-sinks", BATHROOM_SINKS],
  ["kitchen-sinks", KITCHEN_SINKS],
  ["drains", DRAINS],
  ["toilets", TOILETS],
  ["bathtubs", BATHTUBS],
  ["appliances", APPLIANCES],
  ["other", OTHER],
];

const buildSeed = (): BrandSeed[] => {
  const bySlug = new Map<string, BrandSeed>();

  for (const [categorySlug, rows] of CATEGORY_SECTIONS) {
    for (const row of rows) {
      const slug = slugFor(row.name);
      const existing = bySlug.get(slug);
      if (existing) {
        if (!existing.categorySlugs.includes(categorySlug)) {
          existing.categorySlugs.push(categorySlug);
        }
        // Prefer the first-seen description + origin; later sections only extend categories.
        if (!existing.originCountry && row.origin) {
          existing.originCountry = row.origin;
          existing.originCountryName = row.originName;
        }
        continue;
      }
      // Canonical display name: strip trailing "Hardware" only for the Sun Valley case
      // where we explicitly slug-overrode; otherwise keep the doc's name verbatim.
      const name =
        slug === "sun-valley-bronze"
          ? "Sun Valley Bronze"
          : slug === "baldwin"
            ? "Baldwin"
            : slug === "ebbe"
              ? "Ebbe"
              : row.name;
      bySlug.set(slug, {
        slug,
        name,
        descriptionEn: row.description,
        primaryCategorySlug: categorySlug,
        categorySlugs: [categorySlug],
        originCountry: row.origin,
        originCountryName: row.originName,
      });
    }
  }

  // Inject the two extras
  for (const extra of EXTRA_STOREFRONT) {
    if (!bySlug.has(extra.slug)) bySlug.set(extra.slug, extra);
  }

  // Apply flagship flags + display order
  for (const [slug, order] of Object.entries(FLAGSHIP)) {
    const b = bySlug.get(slug);
    if (b) {
      b.isFeatured = true;
      b.displayOrder = order;
    }
  }

  return Array.from(bySlug.values()).sort((a, b) => {
    const ao = a.displayOrder ?? 999;
    const bo = b.displayOrder ?? 999;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name);
  });
};

// ── Main ────────────────────────────────────────────────────────────────

const requireEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return v;
};

const main = async () => {
  const clientEmail = requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });

  const drive = google.drive({ version: "v3", auth });
  const sheets = google.sheets({ version: "v4", auth });

  // 1. Idempotency check
  const existing = await drive.files.list({
    q: `'${BRAND_KIT_FOLDER_ID}' in parents and name = '${SHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
    fields: "files(id, name, webViewLink)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const hits = existing.data.files ?? [];
  if (hits.length > 0) {
    console.error(`\n✗ "${SHEET_TITLE}" Sheet already exists in Brand Kit folder:`);
    for (const f of hits) console.error(`   ${f.id}  ${f.webViewLink}`);
    console.error(`\n  Delete it or rename if you meant to reseed. Aborting to avoid duplicates.\n`);
    process.exit(1);
  }

  // 2. Seed data
  const seed = buildSeed();
  console.log(`\nSeeding ${seed.length} brands into "${SHEET_TITLE}"…\n`);

  // 3. Create the Sheet
  const createRes = await drive.files.create({
    requestBody: {
      name: SHEET_TITLE,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [BRAND_KIT_FOLDER_ID],
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });
  const sheetId = createRes.data.id!;
  const sheetUrl = createRes.data.webViewLink!;
  console.log(`  created spreadsheet ${sheetId}`);

  // 4. Rename default tab to "brands", freeze header row, bold + fill header
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const firstSheet = meta.data.sheets![0];
  const firstSheetId = firstSheet.properties!.sheetId!;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId: firstSheetId,
              title: TAB_TITLE,
              gridProperties: { frozenRowCount: 1 },
            },
            fields: "title,gridProperties.frozenRowCount",
          },
        },
        {
          repeatCell: {
            range: {
              sheetId: firstSheetId,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                backgroundColor: { red: 0.92, green: 0.92, blue: 0.92 },
              },
            },
            fields: "userEnteredFormat(textFormat,backgroundColor)",
          },
        },
      ],
    },
  });

  // 5. Write header + seed rows
  const now = new Date().toISOString();
  const rows: string[][] = [
    [...HEADER],
    ...seed.map((b) => [
      b.slug,
      b.name,
      "", // tagline_en (Joshua fills)
      "", // tagline_es
      b.descriptionEn,
      "", // description_es
      b.originCountry ?? "",
      b.originCountryName ?? "",
      "", // website_url (Joshua fills)
      "", // external_url
      "", // stocked_state (Roger tags Day 2)
      b.primaryCategorySlug,
      b.categorySlugs.join("|"),
      "", // logo_drive_id
      "", // hero_drive_id
      "", // brand_folder_drive_id
      "", // featured_product_ids
      "", // featured_project_slugs
      "unknown", // nom_status_summary
      "FALSE", // is_artisan (all 73 are import brands for Week 2)
      b.isFeatured ? "TRUE" : "FALSE",
      b.displayOrder != null ? String(b.displayOrder) : "",
      now,
      now,
      "seed-script",
    ]),
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${TAB_TITLE}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });

  console.log(`  wrote ${rows.length - 1} data rows + header`);

  // Access is covered by Shared Drive membership — no per-file share needed.

  console.log(`\n✓ Done.\n`);
  console.log(`  Sheet ID:  ${sheetId}`);
  console.log(`  URL:       ${sheetUrl}`);
  console.log(`\n  Add to .env.local:`);
  console.log(`    GOOGLE_BRAND_KIT_SHEET_ID=${sheetId}\n`);
};

main().catch((err) => {
  console.error("\n✗ Seed failed:", err);
  process.exit(1);
});
