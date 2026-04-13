/**
 * Product Migration Script
 *
 * Merges products from the Shopify export (products_export_1) into the
 * Master Products sheet. Deduplicates by slug/handle, maps categories
 * to our schema, and uses Shopify CDN images (with Drive images where matched).
 */

const { google } = require("googleapis");

const MASTER_SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHOPIFY_SHEET_ID = "1paYtKkDH0oA5PBscXY7AZ4bximCh9D85z1hjqnFiRuc";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
  ],
});

const sheets = google.sheets({ version: "v4", auth });

// ── Category Mapping ─────────────────────────────────────────────────

// Hardware brands (door hardware, locks, pulls)
const HARDWARE_BRANDS = new Set([
  "emtek", "baldwin", "deltana", "sun valley bronze",
]);

// Kitchen brands
const KITCHEN_BRANDS = new Set([
  "teka", "smeg", "bluestar", "insinkererator", "franke",
]);

// Tag-based category rules (checked in order)
const TAG_CATEGORY_RULES = [
  // Explicit space tags
  { match: /Espacio_Baño/i, category: "bathroom" },
  { match: /Espacio_Cocina/i, category: "kitchen" },
  { match: /Espacio_Puerta/i, category: "hardware" },

  // Bathroom-specific tags
  { match: /Baño_/i, category: "bathroom" },
  { match: /Montaje_Piso/i, category: "bathroom" },  // floor-mount = tubs

  // Kitchen-specific tags
  { match: /Cocina_/i, category: "kitchen" },
  { match: /Cubetas_/i, category: "kitchen" },  // sink basins
  { match: /Mandil_/i, category: "kitchen" },    // apron sinks
  { match: /Instalación_Bajocubierta/i, category: "kitchen" },
  { match: /Instalación_Farmhouse/i, category: "kitchen" },
  { match: /Instalación_Sobrecubierta/i, category: "kitchen" },

  // Hardware-specific tags
  { match: /Puerta_/i, category: "hardware" },
  { match: /Entrada_/i, category: "hardware" },
];

// Shopify productCategory → our category
const PRODUCT_CATEGORY_MAP = {
  "Door Hardware": "hardware",
  "Cabinet Hardware": "hardware",
  "Door Frames": "hardware",
  "Door Push Plates": "hardware",
  "Door Knobs": "hardware",
  "Door Stops": "hardware",
  "Locks": "hardware",
  "Faucets": "bathroom",  // default, can be overridden by tags
  "Sinks": "kitchen",     // kitchen sinks in Shopify context
  "Toilets": "bathroom",
  "Bidets": "bathroom",
  "Bathtubs": "bathroom",
  "Shower": "bathroom",
  "Bathroom": "bathroom",
};

// Tag → subcategory mapping
const TAG_SUBCATEGORY_MAP = {
  // Bathroom subcategories
  "Baño_griferia": "faucets",
  "Baño_grifo": "faucets",
  "Baño_Griferia": "faucets",
  "Baño_Accesorios": "accessories",
  "Baño_accesorios": "accessories",
  "Baño_Regadera": "showers",
  "Baño_regadera": "showers",
  "Baño_Tina": "bathtubs",
  "Baño_tina": "bathtubs",
  "Baño_Lavabo": "sinks",
  "Baño_lavabo": "sinks",
  "Baño_Sanitario": "toilets",
  "Baño_sanitario": "toilets",
  "Baño_Válvula": "valves",
  "Baño_valvula": "valves",
  "Baño_Spa": "spa",
  "Baño_spa": "spa",
  "Baño_Drenaje": "drains",
  "Baño_drenaje": "drains",
  "Baño_Llenador": "tub-fillers",
  "Baño_llenador": "tub-fillers",

  // Kitchen subcategories
  "Cocina_Tarja": "sinks",
  "Cocina_tarja": "sinks",
  "Cocina_Mezcladora": "faucets",
  "Cocina_mezcladora": "faucets",
  "Cocina_Campana": "range-hoods",
  "Cocina_campana": "range-hoods",
  "Cocina_Electrodomestico": "appliances",
  "Cocina_electrodomestico": "appliances",
  "Cocina_Dispensador": "soap-dispensers",
  "Cocina_dispensador": "soap-dispensers",
  "Cocina_Llenador": "pot-fillers",
  "Cocina_llenador": "pot-fillers",

  // Hardware subcategories
  "Puerta_Principal": "door-locks",
  "Puerta_principal": "door-locks",
  "Entrada_Manija": "door-locks",
  "Entrada_Llave": "door-locks",
};

// Shopify productCategory → subcategory fallback
const SHOPIFY_SUBCATEGORY_MAP = {
  "Door Hardware": "door-locks",
  "Cabinet Hardware": "pulls-hooks",
  "Door Push Plates": "door-locks",
  "Door Knobs": "door-locks",
  "Door Stops": "door-locks",
  "Door Frames": "door-locks",
  "Locks": "deadbolts",
  "Toilets": "toilets",
  "Bidets": "toilets",
  "Bathtubs": "bathtubs",
  "Shower Heads": "showers",
  "Shower Parts": "showers",
  "Shower Arms": "showers",
  "Faucet Handles": "faucets",
  "Faucet Accessories": "faucets",
  "Bathroom Sink Faucets": "faucets",
  "Bathtub Faucets": "faucets",
  "Bathroom Accessories": "accessories",
  "Bathroom Accessory Sets": "accessories",
  "Kitchen Sinks": "sinks",
  "Kitchen & Utility Sinks": "sinks",
  "Plumbing Valves": "valves",
  "Drain Components": "drains",
  "Drains": "drains",
  "Plumbing Traps": "drains",
  "Plumbing Wastes": "drains",
  "Water Dispensing": "water-dispensers",
  "Garbage Disposal": "appliances",
  "Bathtub Spouts": "tub-fillers",
  "Toilet Trim": "accessories",
};

function classifyProduct(product) {
  const tags = product.tags || "";
  const tagList = tags.split(",").map((t) => t.trim());
  const vendor = (product.vendor || "").toLowerCase();
  const shopCat = product.productCategory || "";
  const title = (product.title || "").toLowerCase();

  let category = null;
  let subcategory = null;

  // 1. Try tag-based subcategory (most specific)
  for (const tag of tagList) {
    if (TAG_SUBCATEGORY_MAP[tag]) {
      subcategory = TAG_SUBCATEGORY_MAP[tag];
      break;
    }
  }

  // 2. Try tag-based category
  for (const rule of TAG_CATEGORY_RULES) {
    if (rule.match.test(tags)) {
      category = rule.category;
      break;
    }
  }

  // 3. Try brand-based category
  if (!category) {
    if (HARDWARE_BRANDS.has(vendor)) category = "hardware";
    else if (KITCHEN_BRANDS.has(vendor)) category = "kitchen";
  }

  // 4. Try Shopify productCategory
  if (!category || !subcategory) {
    for (const [key, cat] of Object.entries(PRODUCT_CATEGORY_MAP)) {
      if (shopCat.includes(key)) {
        if (!category) category = cat;
        break;
      }
    }
    for (const [key, sub] of Object.entries(SHOPIFY_SUBCATEGORY_MAP)) {
      if (shopCat.includes(key)) {
        if (!subcategory) subcategory = sub;
        break;
      }
    }
  }

  // 5. Title-based fallback
  if (!category) {
    if (/grifo|faucet|lavabo|sink|bañ|tub|regadera|shower|sanitario|toilet|bidet|spa/i.test(title)) {
      category = "bathroom";
    } else if (/tarja|cocina|kitchen|campana|hood|electrodomestico|appliance|olla|pot.?fill|dispensador/i.test(title)) {
      category = "kitchen";
    } else if (/cerrojo|lock|chapa|latch|jalader|pull|hook|gancho|knob|manija|handle|deadbolt|entry/i.test(title)) {
      category = "hardware";
    }
  }

  // 6. Vendor-based broad fallback
  if (!category) {
    const bathroomVendors = ["rohl", "california faucets", "toto", "hansgrohe", "delta", "brizo", "kohler", "badeloft", "villeroy & boch", "aqua spa", "aquaspa", "kingston brass", "duravit"];
    const kitchenVendors = ["blanco", "ruvati", "elkay"];
    if (bathroomVendors.includes(vendor)) category = "bathroom";
    else if (kitchenVendors.includes(vendor)) category = "kitchen";
  }

  // 7. Default
  if (!category) category = "bathroom";

  // Subcategory fallback from category
  if (!subcategory) {
    if (category === "hardware") subcategory = "door-locks";
    else if (category === "kitchen") subcategory = "faucets";
    else subcategory = "faucets"; // bathroom default
  }

  return { category, subcategory };
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 500);
}

function normalizeBrand(vendor) {
  if (!vendor) return "Counter Cultures";
  // Normalize casing
  const map = {
    "counter cultures": "Counter Cultures",
    "california faucets": "California Faucets",
    "kingston brass": "Kingston Brass",
    "sun valley bronze": "Sun Valley Bronze",
    "villeroy & boch": "Villeroy & Boch",
    "aqua spa": "Aqua Spa",
    "aquaspa": "Aqua Spa",
    "elements of design": "Elements Of Design",
    "today design house": "Today Design House",
  };
  return map[vendor.toLowerCase()] || vendor;
}

async function main() {
  console.log("=== PRODUCT MIGRATION ===\n");

  // 1. Read Shopify export
  console.log("Reading Shopify export...");
  const allData = await sheets.spreadsheets.values.get({
    spreadsheetId: SHOPIFY_SHEET_ID,
    range: "products_export_1!A2:AZ",
  });
  const data = allData.data.values || [];

  // Parse unique products
  const productMap = new Map();
  for (const row of data) {
    const handle = (row[0] || "").trim();
    if (!handle) continue;
    if (!productMap.has(handle)) {
      productMap.set(handle, {
        handle,
        title: row[1] || "",
        bodyHtml: row[2] || "",
        vendor: row[3] || "",
        productCategory: row[4] || "",
        tags: row[6] || "",
        published: row[7] || "",
        variantSku: row[17] || "",
        variantPrice: row[23] || "",
        images: new Set(),
      });
    }
    const p = productMap.get(handle);
    if (row[32]?.trim()) p.images.add(row[32].trim());
    if (row[50]?.trim()) p.images.add(row[50].trim());
    if (!p.title && row[1]) p.title = row[1];
    if (!p.variantPrice && row[23]) p.variantPrice = row[23];
    if (!p.variantSku && row[17]) p.variantSku = row[17];
    if (!p.vendor && row[3]) p.vendor = row[3];
    if (!p.tags && row[6]) p.tags = row[6];
  }

  console.log(`Parsed ${productMap.size} unique products from Shopify export`);

  // 2. Read existing master sheet
  console.log("Reading existing master sheet...");
  const existingRes = await sheets.spreadsheets.values.get({
    spreadsheetId: MASTER_SHEET_ID,
    range: "Products!A2:R",
  });
  const existingRows = existingRes.data.values || [];
  const existingSlugs = new Set(
    existingRows.map((r) => r[17]?.trim().toLowerCase()).filter(Boolean)
  );
  const maxId = Math.max(
    ...existingRows.map((r) => parseInt(r[0]) || 0),
    0
  );

  console.log(`Existing products: ${existingRows.length} (max ID: ${maxId})`);

  // 3. Filter to new products only
  const allShopify = [...productMap.values()];
  const newProducts = allShopify.filter(
    (p) => !existingSlugs.has(p.handle.toLowerCase())
  );
  console.log(`New products to add: ${newProducts.length}`);

  // 4. Build rows for the master sheet
  const newRows = [];
  const categoryStats = {};
  let nextId = maxId + 1;

  for (const p of newProducts) {
    const { category, subcategory } = classifyProduct(p);
    const brand = normalizeBrand(p.vendor);
    const description = stripHtml(p.bodyHtml);
    const price = parseFloat(p.variantPrice) || 0;
    const imageUrls = [...p.images];
    const primaryImage = imageUrls[0] || "";
    const sku = p.variantSku || `CC-${nextId}`;
    const isArtisanal =
      brand === "Counter Cultures" ||
      (p.tags || "").toLowerCase().includes("artesanal")
        ? "true"
        : "false";

    // Stats
    const key = `${category}/${subcategory}`;
    categoryStats[key] = (categoryStats[key] || 0) + 1;

    // Row: id, sku, brand, name, nameEn, category, subcategory, price,
    //       tradePrice, currency, finishes, images, artisanal,
    //       description, descriptionEn, availability, featured, slug
    newRows.push([
      String(nextId),          // id
      sku,                      // sku
      brand,                    // brand
      p.title,                  // name (Spanish)
      p.title,                  // nameEn (same for now - titles are mostly Spanish)
      category,                 // category
      subcategory,              // subcategory
      String(price),            // price
      "",                       // tradePrice
      "MXN",                    // currency
      "",                       // finishes
      primaryImage,             // images
      isArtisanal,              // artisanal
      description,              // description
      description,              // descriptionEn
      price > 0 ? "in-stock" : "contact",  // availability
      "false",                  // featured
      p.handle,                 // slug
    ]);

    nextId++;
  }

  console.log(`\nCategory distribution of new products:`);
  Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  // 5. Write to master sheet in batches
  console.log(`\nWriting ${newRows.length} rows to Products sheet...`);

  const BATCH_SIZE = 500;
  for (let i = 0; i < newRows.length; i += BATCH_SIZE) {
    const batch = newRows.slice(i, i + BATCH_SIZE);
    await sheets.spreadsheets.values.append({
      spreadsheetId: MASTER_SHEET_ID,
      range: "Products!A:R",
      valueInputOption: "RAW",
      requestBody: { values: batch },
    });
    console.log(`  Wrote batch ${Math.floor(i / BATCH_SIZE) + 1}: rows ${i + 1}-${Math.min(i + BATCH_SIZE, newRows.length)}`);
  }

  // 6. Verify final count
  const finalRes = await sheets.spreadsheets.values.get({
    spreadsheetId: MASTER_SHEET_ID,
    range: "Products!A:A",
  });
  const finalCount = (finalRes.data.values || []).length - 1;
  console.log(`\n=== MIGRATION COMPLETE ===`);
  console.log(`Previous count: ${existingRows.length}`);
  console.log(`Added: ${newRows.length}`);
  console.log(`Final count: ${finalCount}`);
  console.log(`Expected: ${existingRows.length + newRows.length}`);

  if (finalCount === existingRows.length + newRows.length) {
    console.log("✓ COUNT VERIFIED - PERFECT MATCH");
  } else {
    console.log("⚠ COUNT MISMATCH - INVESTIGATE");
  }
}

main().catch((e) => {
  console.error("MIGRATION FAILED:", e.message);
  process.exit(1);
});
