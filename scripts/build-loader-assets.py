"""Génère les textures du loader 3D : logo (couleur, relief, matière) et fond du Parc des Princes.
Sources : scripts/source/*.jpg. Sorties : public/loader/*.webp. Nécessite Pillow, numpy, scipy."""
import os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "scripts", "source")
OUT = os.path.join(ROOT, "public", "loader")
os.makedirs(OUT, exist_ok=True)
N = 1024


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def weave(size, period):
    """Tissage carbone (armure toile) : hauteur 0-1."""
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    u, v = x / period, y / period
    fu, fv = u % 1.0, v % 1.0
    parity = ((np.floor(u) + np.floor(v)) % 2) == 0
    horiz = np.sin(np.pi * fv)  # fil horizontal : section arrondie selon v
    vert = np.sin(np.pi * fu)
    h = np.where(parity, horiz, vert)
    # léger fibrage le long du fil
    fib = 0.5 + 0.5 * np.sin(2 * np.pi * np.where(parity, u, v) * 6)
    return np.clip(0.8 * h + 0.2 * fib * h, 0, 1)


def build_logo():
    im = Image.open(os.path.join(SRC, "logo-dames-du-parc.jpg")).convert("RGB").resize((N, N), Image.LANCZOS)
    rgb = np.asarray(im).astype(np.float32) / 255.0
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

    yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
    dist = np.hypot(xx - (N - 1) / 2, yy - (N - 1) / 2)
    R = N / 2 - 3
    mask = np.clip((R - dist) / 1.5 + 0.5, 0, 1)
    rn = dist / R

    white = smoothstep(0.62, 0.85, np.minimum(np.minimum(r, g), b))
    red = smoothstep(0.16, 0.34, r - np.maximum(g, b)) * (1 - white)
    navy = np.clip(1 - white - red, 0, 1)

    # Relief : marine en creux, rouge en relief moyen, blanc (lettres, fleurs de lys, filets) en relief haut, rebord biseauté
    h = 0.30 + 0.24 * red + 0.46 * white
    h = gaussian_filter(h, 2.2)
    h *= 0.30 + 0.70 * smoothstep(1.0, 0.925, rn)
    wv = weave(N, 24)
    navy_s = gaussian_filter(navy, 1.5)
    h_total = h + 0.032 * (wv - 0.5) * navy_s

    gy, gx = np.gradient(h_total)
    S = 9.0
    nx, ny, nz = -gx * S, gy * S, np.ones_like(h_total)
    ln = np.sqrt(nx**2 + ny**2 + nz**2)
    normal = np.stack([nx / ln, ny / ln, nz / ln], -1) * 0.5 + 0.5

    # Albédo : marine profond, tissage carbone cuit dans la teinte
    shade = 0.74 + 0.32 * wv
    alb = rgb.copy()
    navy3 = navy_s[..., None]
    alb = alb * (1 - navy3) + (alb * 0.74 * shade[..., None]) * navy3
    alb = alb * (1 - 0.05 * white[..., None])
    color = np.dstack([np.clip(alb, 0, 1), mask])

    rough = 0.14 * white + 0.30 * red + (0.40 + 0.28 * (1 - wv)) * navy
    metal = 0.50 * white + 0.90 * red + 0.40 * navy
    ao = 1 - 0.18 * (1 - wv) * navy_s
    orm = np.stack([ao, rough, metal], -1)

    def save(arr, name, q=92, lossless=False):
        img = Image.fromarray((np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8))
        img.save(os.path.join(OUT, name), "WEBP", quality=q, method=6, lossless=lossless)
        print(name, os.path.getsize(os.path.join(OUT, name)) // 1024, "Ko")

    save(color, "logo-color.webp", 93)
    save(normal, "logo-normal.webp", 93)
    save(orm, "logo-orm.webp", 90)

    # Tuile de carbone pour le chant de la médaille (256 px, 8 répétitions du motif)
    t = weave(256, 32)
    base = np.stack([0.05 + 0.13 * t, 0.06 + 0.14 * t, 0.09 + 0.20 * t], -1)
    save(base, "carbon.webp", 90)


def build_stadium():
    im = Image.open(os.path.join(SRC, "parc-des-princes.jpg")).convert("RGB").resize((1920, 1080), Image.LANCZOS)
    im.save(os.path.join(OUT, "parc.webp"), "WEBP", quality=80, method=6)
    print("parc.webp", os.path.getsize(os.path.join(OUT, "parc.webp")) // 1024, "Ko")


build_logo()
build_stadium()
