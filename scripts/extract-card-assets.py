"""Découpe les logos de la carte membre depuis les rendus de référence (face couleur / verso argenté).
Usage: python3 scripts/extract-card-assets.py <face.webp> <verso.webp>
À remplacer par les fichiers vectoriels officiels.
"""
import sys
from PIL import Image, ImageDraw, ImageFilter

def circle_crop(path, center, radius, name, size, feather=3):
    im = Image.open(path).convert("RGBA")
    cx, cy = center
    im = im.crop((cx - radius, cy - radius, cx + radius, cy + radius)).resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((1, 1, size - 1, size - 1), fill=255)
    im.putalpha(mask.filter(ImageFilter.GaussianBlur(feather)))
    im.save(f"public/logos/{name}.webp", "WEBP", quality=92, method=6)
    print(name, im.size)

circle_crop(sys.argv[1], (760, 435), 238, "card-logo-color", 480)
circle_crop(sys.argv[2], (763, 651), 133, "card-logo-silver", 400)
