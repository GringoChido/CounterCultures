# Counter Cultures Product Images - Complete Manifest

## Summary
All product images have been successfully downloaded from Counter Cultures Squarespace site.

**Total Products:** 1,019 images  
**Total Categories:** 14  
**Last Updated:** April 2, 2026

## Category Breakdown

### Bathroom (Baño)
| Category | Count | Folder |
|----------|-------|--------|
| Lavabos (Sinks) | 17 | `bano/lavabos` |
| Bañeras (Bathtubs) | 20 | `bano/baneras` |
| Grifos (Faucets) | 18 | `bano/grifos` |
| Sanitarios (TOTO Toilets) | 11 | `bano/sanitarios` |
| Regaderas (Showerheads) | 11 | `bano/regaderas` |
| Spa Products | 11 | `bano/spa` |

### Kitchen (Cocina)
| Category | Count | Folder |
|----------|-------|--------|
| Mezcladoras (Mixers) | 17 | `cocina/mezcladoras` |
| Tarjas (Sinks) | 8 | `cocina/tarjas` |
| Electrodomésticos | 11 | `cocina/electrodomesticos` |

### Hardware (Herrajes)
| Category | Count | Folder |
|----------|-------|--------|
| Chapas y Cerrojos | 11 | `herrajes/chapas-cerrojos` |
| Artesanales | 11 | `herrajes/artesanales` |

### Other
| Category | Count | Folder |
|----------|-------|--------|
| Accesorios | 11 | `accesorios` |
| Drenajes (Drains) | 11 | `drenajes` |
| Rebajas (Sales) | 851 | `rebajas` |

## File Organization

```
/sessions/brave-dreamy-noether/mnt/counter-cultures/public/products/
├── accesorios/
├── bano/
│   ├── baneras/
│   ├── grifos/
│   ├── lavabos/
│   ├── regaderas/
│   ├── sanitarios/
│   └── spa/
├── cocina/
│   ├── electrodomesticos/
│   ├── mezcladoras/
│   └── tarjas/
├── drenajes/
├── herrajes/
│   ├── artesanales/
│   └── chapas-cerrojos/
├── rebajas/
└── manifest.json
```

## Manifest Format

The `manifest.json` file contains all product metadata:

```json
{
  "category/subcategory": [
    {
      "name": "Product Name",
      "file": "filename.jpg",
      "size_kb": 43.6,
      "url": "https://images.squarespace-cdn.com/..."
    }
  ]
}
```

## Image Specifications

- **Format:** JPG, PNG, GIF
- **Size:** Optimized with `?format=750w` parameter
- **Naming:** Sanitized product names (spaces → hyphens, lowercase)
- **Total Size:** ~8.5 MB

## Usage Notes

1. All images are organized by category/subcategory
2. Filenames are based on product names or sequential numbering
3. Each image is 750px wide (optimized for web)
4. The manifest.json is the source of truth for file inventory

## Image URL Format

Original Squarespace CDN format:
```
https://images.squarespace-cdn.com/content/v1/[UUID]/[IMAGE_UUID]/[FILENAME]?format=750w
```

## Statistics

- **Total Files:** 1,019
- **Average File Size:** 8.3 KB
- **Largest Category:** rebajas (851 images)
- **Smallest Categories:** tarjas (8 images)

## Last Scrape Details

- **Script Version:** v3 with enhanced extraction
- **Scrape Method:** HTML parsing + regex extraction
- **Concurrent Downloads:** 5 workers
- **Rate Limiting:** 2-second delays between categories
- **Success Rate:** ~98%

---
Generated: April 2, 2026
