# Brand Images

One folder per brand, matching the cards on `/brands` (https://countercultures.mx/en/brands).

## Folder structure

```
Brand Images/
├── 01_Flagship/          ← 6 featured brands (large cards, 2-column grid)
│   ├── 01_kohler/
│   ├── 02_toto/
│   ├── 03_brizo/
│   ├── 04_blanco/
│   ├── 05_california-faucets/
│   └── 06_sun-valley-bronze/
└── 02_Catalog/           ← 13 secondary brands (small cards, 3-column grid)
    ├── 07_emtek/
    ├── 08_badeloft/
    ├── 09_bante/
    ├── 10_mistoa/
    ├── 11_villeroy-boch/
    ├── 12_aquaspa/
    ├── 13_ebbe/
    ├── 14_delta/
    ├── 15_rohl/
    ├── 16_teka/
    ├── 17_smeg/
    ├── 18_bluestar/
    └── 19_baldwin/
```

## Naming convention (important)

Drop one hero image per folder, named:

```
{slug}-hero.{ext}
```

Examples:
- `01_kohler/kohler-hero.jpg`
- `17_smeg/smeg-hero.webp`
- `11_villeroy-boch/villeroy-boch-hero.png`

The slug must match exactly — that's what the website code looks up. Accepted formats: `.jpg`, `.jpeg`, `.png`, `.webp`.

## Image specs

- **Flagship cards:** minimum 1200×900 px (displayed at ~550×400)
- **Catalog cards:** minimum 800×600 px (displayed at ~350×280)
- **Aspect ratio:** landscape (~4:3 or 16:9)
- **File size:** under 500KB after compression (use WebP if possible)

## How to use this on Drive

1. On `admin@countercultures.com.mx` Drive, create this exact structure under:
   `Counter Cultures > 01_Website_Assets > Brand Images/`
2. Drop one hero image into each brand folder using the naming convention above
3. Once all 19 are in place, ping me and I'll wire them into the code

## Sources for brand images (in priority order)

1. **Dealer media kits** — every brand has one. Roger has the logins. Start here.
   - Kohler: kohlerpro.com → Media Library
   - TOTO: totousa.com → Trade Partners → Image Library
   - BLANCO: blancoamerica.com → Trade Program → Assets
   - SMEG: smegusa.com → Trade → Press & Media
   - Delta: deltafaucet.com → Professional → Brand Assets
   - etc.
2. **Official press / newsroom pages** (publicly downloadable, licensed for editorial use)
3. **Licensed stock** (Adobe Stock, Getty) for brands without accessible media kits
4. **Mexican artisan brands (Mistoa, Bante, AquaSpa)** — request from the brand directly via WhatsApp/email
