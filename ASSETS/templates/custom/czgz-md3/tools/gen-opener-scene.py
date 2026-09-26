"""Generates gfx/opener-scene.js: the campus illustration used by CZ_OPENER.

Flat M3-style vector drawing inspired by the campus (teaching buildings,
Tianning pagoda, inscription stone with pond, trees). Every animatable piece
carries a class the opener animates: .sky-star, .sun, .moon, .far, .bld,
.tier, .win, .tree, .stone, .pond, .flag; .sky-day, .sky-dusk, .stars,
.sun-pos, .moon-pos and .day-wash drive the day/night cycle.
Usage: python3 tools/gen-opener-scene.py
"""
import math, os

W, H = 1920, 1080
GROUND = 868
out = []
def a(s): out.append(s)

def cookie(cx, cy, r, n=9, amp=0.1, rot=0, pts=72):
    p = []
    for i in range(pts):
        t = i / pts * 2 * math.pi
        rr = r * (1 - amp * (1 - math.cos(n * (t - rot))) / 2)
        p.append(f"{cx + rr*math.cos(t):.1f},{cy + rr*math.sin(t):.1f}")
    return " ".join(p)

def spark(cx, cy, r):
    p = []
    for i in range(48):
        t = i / 48 * 2 * math.pi
        c, s = abs(math.cos(t)), abs(math.sin(t))
        rr = 1 / ((c ** 0.56 + s ** 0.56) ** (1 / 0.56))
        rr = min(rr, 0.9) / 0.9
        p.append(f"{cx + r*rr*math.cos(t):.1f},{cy + r*rr*math.sin(t):.1f}")
    return " ".join(p)

C = dict(
    far="#1d4379", farWin="#16355f",
    body="#2c5794", side="#234a82", band="#3a68a8", roof="#1a3a6a",
    win="#16335d", glass="#244c86",
    teal="#30b8bd", teal2="#1f9aa0", teal3="#57cfd3", trunk="#16345c",
    stone="#e9eef5", stoneShade="#c9d5e5", pond="#1f4a86", pondHi="#57cfd3",
    ground="#15325d", ground2="#1b3d6d",
)

a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" class="op-scene">')
a('<defs>'
  '<linearGradient id="opSky" x1="0" y1="0" x2="0" y2="1">'
  '<stop offset="0" stop-color="#0b1d3a"/><stop offset="0.62" stop-color="#15356a"/><stop offset="1" stop-color="#23508f"/>'
  '</linearGradient>'
  '<linearGradient id="opSkyDay" x1="0" y1="0" x2="0" y2="1">'
  '<stop offset="0" stop-color="#2d6cb5"/><stop offset="0.55" stop-color="#5fa6de"/><stop offset="0.82" stop-color="#9fd6ec"/><stop offset="1" stop-color="#c8f1f2"/>'
  '</linearGradient>'
  '<linearGradient id="opDusk" x1="0" y1="0" x2="0" y2="1">'
  '<stop offset="0.3" stop-color="#ff9f8a" stop-opacity="0"/><stop offset="0.66" stop-color="#ff9f8a" stop-opacity="0.55"/><stop offset="0.8" stop-color="#ffc49a" stop-opacity="0.95"/>'
  '</linearGradient>'
  '<radialGradient id="opGlow" cx="0.5" cy="0.5" r="0.5">'
  '<stop offset="0" stop-color="#fff4d6" stop-opacity="0.55"/><stop offset="1" stop-color="#fff4d6" stop-opacity="0"/>'
  '</radialGradient>'
  '<radialGradient id="opMoonGlow" cx="0.5" cy="0.5" r="0.5">'
  '<stop offset="0" stop-color="#c8f1f2" stop-opacity="0.35"/><stop offset="1" stop-color="#c8f1f2" stop-opacity="0"/>'
  '</radialGradient>'
  '<mask id="opMoonCut"><circle cx="0" cy="0" r="80" fill="#fff"/><circle cx="34" cy="-24" r="70" fill="#000"/></mask>'
  '</defs>')
# Sky layers. The opener crossfades them from the sun's height (day/night cycle).
a(f'<rect class="sky" width="{W}" height="{H}" fill="url(#opSky)"/>')
a(f'<rect class="sky-day" width="{W}" height="{H}" fill="url(#opSkyDay)" opacity="0"/>')
a(f'<rect class="sky-dusk" width="{W}" height="{H}" fill="url(#opDusk)" opacity="0"/>')

# stars
import random
random.seed(7)
a('<g class="stars">')
for i in range(26):
    x = random.uniform(40, W - 40); y = random.uniform(40, 520); r = random.uniform(4, 11)
    a(f'<polygon class="sky-star" points="{spark(x, y, r)}" fill="#c8f1f2" opacity="0.8"/>')
a('</g>')

# Sun (sunny 8) and crescent moon, drawn around the origin; the opener moves
# them along an elliptical orbit behind the skyline.
sun = []
for i in range(96):
    t = i / 96 * 2 * math.pi
    rr = 1 - 0.12 * ((1 - math.cos(8 * t)) / 2) ** 0.8
    sun.append(f"{110*rr*math.cos(t):.1f},{110*rr*math.sin(t):.1f}")
a('<g class="sun-pos"><circle class="sun-glow" r="300" fill="url(#opGlow)"/>'
  f'<g class="sun"><polygon points="{" ".join(sun)}" fill="#fff1c7"/></g></g>')
a('<g class="moon-pos"><circle r="220" fill="url(#opMoonGlow)"/>'
  '<g class="moon"><circle r="80" fill="#eef6ff" mask="url(#opMoonCut)"/></g></g>')

# far skyline silhouettes
a('<g class="far-layer">')
for (x, w, h) in [(1040, 120, 180), (1150, 90, 140), (1690, 140, 200), (1820, 120, 150), (240, 150, 120), (410, 110, 160)]:
    a(f'<g class="far"><rect x="{x}" y="{GROUND-h}" width="{w}" height="{h}" rx="6" fill="{C["far"]}"/>')
    for yy in range(GROUND - h + 18, GROUND - 14, 26):
        for xx in range(x + 14, x + w - 14, 22):
            a(f'<rect class="win far-win" x="{xx}" y="{yy}" width="10" height="12" rx="2" fill="{C["farWin"]}"/>')
    a('</g>')
a('</g>')

# pagoda (13 tiers) at x=1560
a('<g class="pagoda">')
px, base = 1560, GROUND - 150
tiers = 13
tw0, tw1 = 150, 62
th0, th1 = 44, 28
y = base
for i in range(tiers):
    f = i / (tiers - 1)
    tw = tw0 + (tw1 - tw0) * f
    th = th0 + (th1 - th0) * f
    ew = tw + 34 - 10 * f
    y -= th
    body = f'<rect x="{px - tw/2:.1f}" y="{y + 8:.1f}" width="{tw:.1f}" height="{th - 8:.1f}" fill="{C["body"]}"/>'
    wins = "".join(f'<rect class="win" x="{px - tw/2 + 8 + k*(tw-16)/4:.1f}" y="{y + 14:.1f}" width="{(tw-16)/4 - 6:.1f}" height="{max(6, th-22):.1f}" rx="2" fill="{C["win"]}"/>' for k in range(4))
    ex0, ex1 = px - ew/2, px + ew/2
    eave = (f'<path d="M{ex0 - 8:.1f} {y + 2:.1f} Q{ex0 + 6:.1f} {y + 12:.1f} {px - tw/2:.1f} {y + 12:.1f} '
            f'L{px + tw/2:.1f} {y + 12:.1f} Q{ex1 - 6:.1f} {y + 12:.1f} {ex1 + 8:.1f} {y + 2:.1f} '
            f'L{px + tw/2 - 6:.1f} {y - 4:.1f} L{px - tw/2 + 6:.1f} {y - 4:.1f} Z" fill="{C["roof"]}"/>')
    a(f'<g class="tier">{body}{wins}{eave}</g>')
# spire
a(f'<g class="tier spire"><rect x="{px-3}" y="{y-110}" width="6" height="110" fill="{C["roof"]}"/>'
  f'<circle cx="{px}" cy="{y-40}" r="12" fill="#c8a95a"/><circle cx="{px}" cy="{y-66}" r="9" fill="#c8a95a"/>'
  f'<circle cx="{px}" cy="{y-88}" r="7" fill="#c8a95a"/><circle cx="{px}" cy="{y-112}" r="5" fill="#e3c77a"/></g>')
# pagoda base hall
a(f'<g class="tier"><rect x="{px-120}" y="{base}" width="240" height="150" fill="{C["side"]}"/>'
  f'<path d="M{px-160} {base+6} L{px-120} {base-20} L{px+120} {base-20} L{px+160} {base+6} Z" fill="{C["roof"]}"/></g>')
a('</g>')

def building(x, w, top, floors, kind="plain"):
    h = GROUND - top
    a(f'<g class="bld">')
    a(f'<rect x="{x}" y="{top}" width="{w}" height="{h}" fill="{C["body"]}"/>')
    a(f'<rect x="{x + w - 18}" y="{top}" width="18" height="{h}" fill="{C["side"]}"/>')
    # roof: shallow hip with overhang
    a(f'<path d="M{x-22} {top+4} L{x+10} {top-26} L{x+w-10} {top-26} L{x+w+22} {top+4} Z" fill="{C["roof"]}"/>')
    fh = (h - 30) / floors
    for fl in range(floors):
        yy = top + 18 + fl * fh
        a(f'<rect x="{x}" y="{yy + fh - 6:.1f}" width="{w}" height="4" fill="{C["band"]}"/>')
        n = max(3, int((w - 40) / 46))
        gap = (w - 40) / n
        for k in range(n):
            wx = x + 20 + k * gap + 6
            if kind == "glass" and n // 3 <= k < n - n // 3:
                continue
            a(f'<rect class="win" x="{wx:.1f}" y="{yy + 8:.1f}" width="{gap - 14:.1f}" height="{fh - 22:.1f}" rx="3" fill="{C["win"]}"/>')
    if kind == "glass":
        n = max(3, int((w - 40) / 46)); gap = (w - 40) / n
        gx0 = x + 20 + (n // 3) * gap; gx1 = x + 20 + (n - n // 3) * gap
        a(f'<rect x="{gx0:.1f}" y="{top+14}" width="{gx1-gx0:.1f}" height="{h-120}" fill="{C["glass"]}"/>')
        for k in range(1, 6):
            xx = gx0 + (gx1 - gx0) * k / 6
            a(f'<rect x="{xx:.1f}" y="{top+14}" width="3" height="{h-120}" fill="{C["band"]}"/>')
        for k in range(1, floors):
            yy = top + 14 + (h - 120) * k / floors
            a(f'<rect class="win glass-row" x="{gx0+4:.1f}" y="{yy-14:.1f}" width="{gx1-gx0-8:.1f}" height="10" rx="3" fill="{C["win"]}"/>')
        # entrance
        a(f'<rect x="{gx0-20:.1f}" y="{GROUND-100}" width="{gx1-gx0+40:.1f}" height="100" fill="{C["side"]}"/>')
        a(f'<rect class="win" x="{gx0+10:.1f}" y="{GROUND-70}" width="{gx1-gx0-20:.1f}" height="70" rx="4" fill="{C["win"]}"/>')
    a('</g>')

a('<g class="mid-layer">')
building(1120, 300, 432, 7)
building(40, 520, 470, 8, "glass")
building(600, 240, 560, 6)
building(870, 210, 540, 6)
a('</g>')

# gate pavilion near pagoda
a(f'<g class="bld"><rect x="1330" y="{GROUND-120}" width="360" height="120" fill="{C["side"]}"/>'
  f'<path d="M1300 {GROUND-112} L1350 {GROUND-160} L1670 {GROUND-160} L1720 {GROUND-112} Z" fill="{C["roof"]}"/>'
  + "".join(f'<rect x="{1350 + k*70}" y="{GROUND-110}" width="16" height="110" fill="{C["band"]}"/>' for k in range(5))
  + '</g>')

# ground
a(f'<rect x="0" y="{GROUND}" width="{W}" height="{H-GROUND}" fill="{C["ground"]}"/>')
a(f'<rect x="0" y="{GROUND}" width="{W}" height="10" fill="{C["ground2"]}"/>')

# flags (banner poles)
a('<g class="flags">')
for k, x in enumerate(range(90, 560, 58)):
    col = C["teal"] if k % 2 == 0 else "#d8e4fa"
    a(f'<g class="flag"><rect x="{x}" y="{GROUND-120}" width="4" height="120" fill="{C["trunk"]}"/>'
      f'<rect x="{x+4}" y="{GROUND-116}" width="18" height="48" rx="9" fill="{col}"/></g>')
a('</g>')

# trees (cookie canopies)
a('<g class="trees">')
for (x, r, hgt, col, n) in [(560, 62, 110, C["teal2"], 9), (660, 48, 90, C["teal"], 7), (1090, 70, 130, C["teal2"], 9),
                            (1280, 52, 100, C["teal"], 7), (300, 56, 96, C["teal"], 9), (1760, 64, 118, C["teal2"], 9),
                            (1850, 44, 86, C["teal"], 7), (1440, 40, 84, C["teal3"], 6)]:
    cy = GROUND - hgt
    a(f'<g class="tree"><rect x="{x-5}" y="{cy}" width="10" height="{hgt}" rx="4" fill="{C["trunk"]}"/>'
      f'<polygon points="{cookie(x, cy, r, n, 0.12)}" fill="{col}"/>'
      f'<polygon points="{cookie(x - r*0.25, cy - r*0.2, r*0.45, 6, 0.1)}" fill="#ffffff" opacity="0.12"/></g>')
a('</g>')

# pond + stone
a(f'<g class="pond"><rect x="600" y="{GROUND+54}" width="720" height="96" rx="48" fill="{C["pond"]}"/>'
  + "".join(f'<rect class="ripple" x="{660 + k*130}" y="{GROUND+88 + (k%2)*22}" width="{70 + (k%3)*20}" height="6" rx="3" fill="{C["pondHi"]}" opacity="0.5"/>' for k in range(5))
  + '</g>')
stone = (f'M690 {GROUND+70} C660 {GROUND+20} 690 {GROUND-58} 760 {GROUND-70} '
         f'C860 {GROUND-92} 1020 {GROUND-80} 1140 {GROUND-86} '
         f'C1210 {GROUND-90} 1250 {GROUND-50} 1240 {GROUND+10} '
         f'C1232 {GROUND+62} 1200 {GROUND+84} 1120 {GROUND+86} '
         f'L780 {GROUND+88} C730 {GROUND+88} 700 {GROUND+84} 690 {GROUND+70} Z')
a(f'<g class="stone"><path d="{stone}" fill="{C["stone"]}"/>'
  f'<path d="M700 {GROUND+60} C760 {GROUND+80} 1100 {GROUND+80} 1236 {GROUND+30} L1232 {GROUND+60} C1200 {GROUND+84} 1100 {GROUND+86} 780 {GROUND+88} C730 {GROUND+88} 704 {GROUND+80} 700 {GROUND+60} Z" fill="{C["stoneShade"]}"/></g>')
# Daylight wash: lifts the whole drawing during the day.
a(f'<rect class="day-wash" width="{W}" height="{H}" fill="#d9efff" opacity="0" style="mix-blend-mode: soft-light"/>')
a('</svg>')

svg = "".join(out)
js = ("/* Generated by tools/gen-opener-scene.py - campus illustration for CZ_OPENER. */\n"
      "window.CZ_SCENE = " + repr(svg).replace("\\'", "'") + ";\n")
here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, "..", "gfx", "opener-scene.js"), "w", encoding="utf-8") as fh:
    fh.write(js)
print(len(js))
