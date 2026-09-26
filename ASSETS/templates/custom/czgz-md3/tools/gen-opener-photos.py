"""Builds the opener's background images.

  python3 tools/gen-opener-photos.py <campus-a> <campus-b>

Each campus photo becomes a dark navy monochrome WebP whose white
sky (every near-white area connected to the top or right edge) is cut out,
so the image can sit on any navy background. Also writes img/burst.webp,
the soft light rays behind the emblem. Needs Pillow and NumPy.
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, "..", "img")
DARK = np.array([4, 12, 30], np.float32)       # near-black navy shadows
LIGHT = np.array([60, 94, 142], np.float32)    # dim blue highlights
RAYS = np.array([200, 241, 242], np.uint8)     # soft teal light rays


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def monochrome(src, out, width=1600):
    im = Image.open(src).convert("RGBA")
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    lum = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    soft = np.asarray(Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
    h, w = lum.shape
    # Sky: near-white regions reachable from the top or right edge.
    mask = Image.fromarray(np.where(soft > 0.9, 255, 0).astype(np.uint8))
    px = mask.load()
    for seed in [(x, 0) for x in range(0, w, 8)] + [(w - 1, y) for y in range(0, h, 8)]:
        if px[seed] == 255:
            ImageDraw.floodfill(mask, seed, 128)
    sky = (np.asarray(mask) == 128).astype(np.float32)
    sky = np.asarray(Image.fromarray((sky * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32) / 255
    alpha = (1 - sky * smoothstep(0.9, 0.985, soft)) * a[..., 3]
    tone = np.clip((lum - 0.08) / 0.86, 0, 1) ** 1.15
    rgb = DARK + (LIGHT - DARK) * tone[..., None]
    rgba = np.concatenate([rgb, (alpha * 255)[..., None]], axis=2).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(os.path.join(IMG, out), "WEBP", quality=74, method=6)


def burst(size=1100):
    r0 = size / 2
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    dx, dy = x - r0 + 0.5, y - r0 + 0.5
    r = np.sqrt(dx * dx + dy * dy) / r0
    ang = np.degrees(np.arctan2(dy, dx)) % 10
    ray = np.clip(1 - np.abs(ang - 1.25) / 1.6, 0, 1)          # a soft 2.5 deg ray every 10 deg
    fade = (1 - smoothstep(0.18, 0.95, r)) * smoothstep(0.05, 0.2, r)
    rgba = np.zeros((size, size, 4), np.uint8)
    rgba[..., :3] = RAYS
    rgba[..., 3] = (ray * fade * 0.16 * 255).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(os.path.join(IMG, "burst.webp"), "WEBP", quality=80, method=6)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    monochrome(sys.argv[1], "photo-campus-a.webp")
    monochrome(sys.argv[2], "photo-campus-b.webp")
    burst()
