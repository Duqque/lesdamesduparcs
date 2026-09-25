"""Encode les logos en PNG base64 pour la génération des PDF côté serveur (aucun accès disque à l'exécution)."""
import base64, io
from PIL import Image

def png_b64(src, size):
    im = Image.open(src).convert("RGBA")
    im.thumbnail((size, size), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    return base64.b64encode(buf.getvalue()).decode()

out = "// Généré par scripts/build-pdf-assets.py : ne pas modifier à la main.\n"
out += f'export const LOGO_PNG = "{png_b64("public/logos/dames-du-parc-logo.webp", 300)}";\n'
out += f'export const LOGO_COLOR_PNG = "{png_b64("public/logos/card-logo-color.webp", 300)}";\n'
open("src/lib/server/pdf-assets.ts", "w").write(out)
print(len(out) // 1024, "Ko")
