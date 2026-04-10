#!/bin/bash
# Downloads product images from Squarespace CDN to local public/products/ directories.
# Skips images that already exist.
#
# Usage:
#   chmod +x scripts/download-images.sh
#   ./scripts/download-images.sh

set -e

BASE="https://images.squarespace-cdn.com/content/v1/674defb44061325485b100b3"
DIR="public/products"

download() {
  local url="$1"
  local dest="$2"
  if [ -f "$dest" ] && [ -s "$dest" ]; then
    echo "SKIP (exists): $dest"
    return
  fi
  mkdir -p "$(dirname "$dest")"
  echo "DOWNLOADING: $dest"
  curl -sL "$url" -o "$dest" || echo "FAILED: $url"
}

echo "=== Downloading Sanitarios (TOTO Toilets) ==="
download "$BASE/6f8c43bb-d398-4c92-aa91-68c8250957af/8.9.jpg" "$DIR/bano/sanitarios/TOTO-Connelly-WASHLET-S5.jpg"
download "$BASE/5a701178-078f-4043-b7d9-8b9af2c89d30/8.8.jpg" "$DIR/bano/sanitarios/TOTO-Connelly-WASHLET-S2.jpg"
download "$BASE/410f2695-4953-4463-bea7-1915c0eb603b/Inodoro+de+ceramica+blanco+dos+piezas+con+bidet+electrico+14.jpg" "$DIR/bano/sanitarios/TOTO-Drake-WASHLET-S7-Universal.jpg"
download "$BASE/b848d252-2613-4d3b-a207-2ad7166abe59/Inodoro+de+ceramica+blanco+dos+piezas+con+bidet+electrico+13.jpg" "$DIR/bano/sanitarios/TOTO-Drake-WASHLET-S7.jpg"

echo ""
echo "=== Downloading Regaderas (Showers) ==="
download "$BASE/54d0bb62-a36e-4531-9c72-c24221db3365/Brizo+Tradicional+Para+Tina+Y+Ducha+Con+Tempassure%C2%AE+Thermostatic.jpg" "$DIR/bano/regaderas/Brizo-Tradicional-Tempassure.jpg"
download "$BASE/72b430cc-9abc-4ec6-a2a8-4bb47a5057eb/mando+para+temperatura.jpg" "$DIR/bano/regaderas/CF-Jalama-StyleTherm.jpg"
download "$BASE/82644f5c-5c51-4581-8713-0627bb34e36f/mando+dual+de+volumen+para+regadera.jpg" "$DIR/bano/regaderas/CF-DelMar-StyleTherm.jpg"
download "$BASE/dcadf452-54b9-4380-845b-247fd6d5d959/trim+thermostatic+verde.jpg" "$DIR/bano/regaderas/CF-StyleTherm-Trim.jpg"
download "$BASE/ebc385be-16b1-428b-9bf8-d2e00dac9c7c/Captura+de+pantalla+2025-11-10+130601.jpg" "$DIR/bano/regaderas/CF-StyleTherm-System.jpg"
download "$BASE/3450830a-a537-4a8a-b216-1e4796c360d7/regadera+de+presion+plateada.jpg" "$DIR/bano/regaderas/CF-Descanso-Pressure.jpg"
download "$BASE/bd95d386-0cf4-4eeb-ad8c-0609aa4c76eb/Captura+de+pantalla+2025-11-07+161952.jpg" "$DIR/bano/regaderas/CF-Rainscape-Cascada.jpg"
download "$BASE/34570706-af1a-4956-8d88-06f57eaf384d/Captura+de+pantalla+2025-11-07+161819.jpg" "$DIR/bano/regaderas/CF-Rainscape-Empotrable.jpg"

echo ""
echo "=== Downloading Accesorios (Accessories) ==="
download "$BASE/aed123bf-cd70-4ec1-8976-704a420fb957/para+papel+moderno+.jpg" "$DIR/accesorios/CF-Tamalpais-Portarrollos.jpg"
download "$BASE/831b2d5c-7426-4f31-8db1-bbfa1bb060ce/vertical+para+papel+de+ba%C3%B1o.jpg" "$DIR/accesorios/CF-Tamalpais-Vertical.jpg"
download "$BASE/dbbb44bd-cd51-44bc-826f-e98046eebbc5/para+papel+de+ba%C3%B1o+plateado+brillante+4.jpg" "$DIR/accesorios/CF-Tiburon-Soporte.jpg"
download "$BASE/1ac1ec7f-c26f-44de-b6bf-44844e13b2f3/para+papel+de+ba%C3%B1o+brilloso+.jpg" "$DIR/accesorios/CF-Tiburon-Soporte-2.jpg"
download "$BASE/62993003-a318-4c66-8726-07f84e057671/Captura+de+pantalla+2025-11-12+145036.jpg" "$DIR/accesorios/CF-TerraMar-Soporte.jpg"
download "$BASE/a58e5be4-3150-4daf-b635-07544874d758/para+papel+de+ba%C3%B1o+gruesa.jpg" "$DIR/accesorios/CF-RinconBay-Portarrollos.jpg"
download "$BASE/241b09a8-05ba-4864-b93f-2169cbf3ef9f/ring+para+papel+de+ba%C3%B1o.jpg" "$DIR/accesorios/CF-RinconBay-Soporte.jpg"
download "$BASE/157a527b-7338-4a60-b47a-52610cd0a920/para+papel+clasico.jpg" "$DIR/accesorios/CF-Cardiff-Portarrollos.jpg"
download "$BASE/0937ae8e-3d61-40f7-adf1-9cd29fa77c96/para+papel+de+ba%C3%B1o+vertical.jpg" "$DIR/accesorios/CF-Descanso-Vertical.jpg"
download "$BASE/9e613104-eaec-4004-b4c0-684f3cf51466/soporte+para+ba%C3%B1o+.jpg" "$DIR/accesorios/CF-Descanso-Portarrollos.jpg"

echo ""
echo "=== Downloading Drenajes (Drains) ==="
download "$BASE/1d0681ab-86eb-45a6-8e03-1b3bcf90297b/rejilla+dorada+.jpg" "$DIR/drenajes/CF-Neo-StyleDrain.jpg"
download "$BASE/4d4ada1e-9151-43a5-85d4-3e55db5ade20/rejida+dorada+lineas+ondes+.jpg" "$DIR/drenajes/CF-DecoSwirl-StyleDrain.jpg"
download "$BASE/18d5ec89-e61c-475e-8bfc-2f3c729bc75d/rejilla+dorada+de+ondas.jpg" "$DIR/drenajes/CF-Wave-StyleDrain.jpg"
download "$BASE/2180ae94-6f2c-44f8-8a90-c01f5890874f/rejilla+de+ba%C3%B1o+florada+.jpg" "$DIR/drenajes/CF-Fleur-StyleDrain.jpg"
download "$BASE/5f14fa22-cdd2-4267-b1d2-33dc98e2ddee/Captura+de+pantalla+2025-11-05+133206.jpg" "$DIR/drenajes/CF-Strathmore-StyleDrain.jpg"
download "$BASE/3d45409b-f4c7-4278-9f19-968f94bc6eb3/drenajenegro.png" "$DIR/drenajes/Drenaje-Contracanasta-Negro.png"
download "$BASE/f60b7e93-755f-4828-a789-c124ece52f1c/bn.PNG" "$DIR/drenajes/Ebbe-E4802-Lattice.png"
download "$BASE/d7e664f9-1278-4cd5-92e4-37a400f15c6a/E4803-BG-Quadra-Brushed-Gold-In-Context-600x607.jpg" "$DIR/drenajes/Ebbe-E4803-Quadra.jpg"
download "$BASE/cc42ad1d-173a-4554-8cb8-6b12e7cf18c3/E4405.png" "$DIR/drenajes/Ebbe-E4805-Splash.png"

echo ""
echo "=== Downloading Herrajes (Hardware) ==="
download "$BASE/05f9142e-d2b0-458e-8fda-8d9b00fbe80d/Captura+de+pantalla+2026-04-01+a+la%28s%29+12.32.13%E2%80%AFp.m..png" "$DIR/herrajes/chapas-cerrojos/Emtek-L-Select-Knurled.png"
download "$BASE/8212be20-e59a-46f7-8a88-e384613dff05/cerradura+para+puerta+cafe+moderna.jpg" "$DIR/herrajes/chapas-cerrojos/SVB-Contemporary-Entry.jpg"
download "$BASE/9e105370-59fd-4ddc-af5b-7767c7940030/juego+de+cerradura+para+puerta+negro+deslavado+.jpg" "$DIR/herrajes/chapas-cerrojos/SVB-Arch-Entry.jpg"
download "$BASE/2c72c472-5570-4739-95a3-c5026ab2776a/chapa+para+interior+sencilla+circular+.jpg" "$DIR/herrajes/chapas-cerrojos/SVB-BevelEdge-Entry.jpg"
download "$BASE/ff0faf8f-3170-40af-93ec-1b4a6f623150/chapa+para+interior.jpg" "$DIR/herrajes/chapas-cerrojos/SVB-Hampton-Entry.jpg"
download "$BASE/9373433a-908a-4826-8efe-a07acc03b6bf/juego+de+chapa+moderna+cuadrada+dorada.jpg" "$DIR/herrajes/chapas-cerrojos/SVB-Textures-Entry.jpg"
download "$BASE/98dfe3bd-726f-4130-82f9-44cd485e3e3f/juego+de+chapa+para+puerta+completo+negro.jpg" "$DIR/herrajes/chapas-cerrojos/SVB-Texture-Entry.jpg"

download "$BASE/e58d26d2-71c9-4031-9ee1-d8eae097fad2/Tocadordepuertabronce.jpg" "$DIR/herrajes/artesanales/Tocador-Tradicional-Bronce.jpg"
download "$BASE/55b6e4a1-a9b0-45f8-a0d0-aaeeff91b45e/Thumbnails+Productos+Roger+%2818%29.png" "$DIR/herrajes/artesanales/Toca-Puertas-Tradicional.png"
download "$BASE/320bda05-045b-495c-8a12-623961de2cac/BronceTocadelaPuertaLiondoorknockerBroncebronze.jpg" "$DIR/herrajes/artesanales/Toca-Puertas-Leon.jpg"
download "$BASE/3177449f-872f-42bd-9a72-903958252ea5/TocalaPuertaBronce.jpg" "$DIR/herrajes/artesanales/Toca-Puertas-Diablo.jpg"
download "$BASE/8d907d68-0efb-490b-b4be-e4c6570c814e/Tocadordepuertamanobronce.jpg" "$DIR/herrajes/artesanales/Toca-Puertas-Mano.jpg"

echo ""
echo "=== Download Complete ==="
echo "Total images in public/products/:"
find public/products -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" \) | wc -l
