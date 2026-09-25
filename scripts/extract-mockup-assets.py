"""Découpe les placeholders photo/logo depuis la maquette de référence.
Usage: python3 scripts/extract-mockup-assets.py <maquette.webp>
À remplacer par les vraies photographies / logos officiels.
"""
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

src = Image.open(sys.argv[1]).convert("RGB")
OUT = "public"

def photo(box, name, scale=3, quality=82, sharpen=True):
    im = src.crop(box)
    im = im.resize((im.width * scale, im.height * scale), Image.LANCZOS)
    if sharpen:
        im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=70, threshold=2))
    im.save(f"{OUT}/images/{name}.webp", "WEBP", quality=quality, method=6)
    print(name, im.size)

def round_logo(box, name, size=512, feather=6):
    im = src.crop(box).convert("RGBA")
    w, h = im.size
    d = min(w, h)
    im = im.crop(((w - d) // 2, (h - d) // 2, (w - d) // 2 + d, (h - d) // 2 + d))
    im = im.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((2, 2, size - 2, size - 2), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather / 2))
    im.putalpha(mask)
    im.save(f"{OUT}/logos/{name}.webp", "WEBP", quality=90, method=6)
    print(name)

photo((440, 78, 1196, 512), "hero-supportrices-parc", scale=2, quality=84)
photo((300, 532, 472, 802), "match-parc-des-princes", scale=3)
photo((487, 574, 717, 694), "evenement-soiree-des-dames", scale=3)
photo((733, 574, 963, 694), "communaute-supportrices", scale=3)
photo((979, 574, 1195, 694), "boutique-echarpes-maillots", scale=3)
photo((640, 200, 1196, 512), "citation-tribune-parc", scale=2)
for i, y in enumerate((592, 672, 754, 835), 1):
    photo((1234, y, 1303, y + 65), f"actu-{i}", scale=3, quality=84)

round_logo((34, 10, 172, 144), "dames-du-parc-logo", size=280)
round_logo((56, 583, 124, 651), "team-psg", size=256, feather=4)
round_logo((188, 579, 246, 641), "team-om", size=256, feather=10)
