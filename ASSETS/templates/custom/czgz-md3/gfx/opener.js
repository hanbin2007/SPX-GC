/* Opening title sequence, about 28 s in nine scenes. Nothing on screen is
   ever at rest: every element runs either a scripted move or an idle loop.
   Every scene change is a large, continuous transition.

   S1  0.0  M3 shape morph burst over the dark campus photo
       -> rotating cookie iris with a soft-teal rim
   S2  1.3  "SINCE 1907": four wheels spin and stop one by one on 1907,
            calligraphy name and English name under it
       -> the camera flies through the "0": the scene zooms past while a
          cookie hole with teal and soft-teal rims opens onto the campus
   S3  4.3  campus at sunset: buildings rise, pagoda stacks up, trees pop
            and sway, flags wave, night falls, windows light up
       -> tile wave: a grid of M3 shapes sweeps diagonally across
   S4  7.8  day/night time-lapse, two full days while the odometer rolls
            1907 to this year ("建校 N 年")
       -> doors with rounded edges close and open again
   S5 11.5  pagoda close-up: lamps light tier by tier, the spire flashes
       -> curtain: capsules drop through the frame
   S6 14.8  name-stone close-up: the calligraphy is carved, English caption
       -> crane up to the moon, it waxes full; the camera warps into it and
          the moon flies to the centre to become the emblem's disc
   S7 20.4  shockwave, decoration flies in, the emblem builds
       -> the mark slides left, two capsule bands sweep and retract
   S8 22.7  lockup: calligraphy name, English name, wavy rule, title letter
            by letter, subtitle, anniversary chip
   S9 26.6  layered reveal onto the programme (or hold, still alive) */
(function () {
  "use strict";

  const { to, set, pulse, swap, snap, shape, shapePx, shapePoints, M, bus } = window.CZ;
  const $ = (id) => document.getElementById(id);
  const SVGNS = "http://www.w3.org/2000/svg";

  const el = {
    op: $("op"),
    rimSoft: $("rimSoft"),
    rimTeal: $("rimTeal"),
    photo: $("photo"),
    motes: $("motes"),
    seed: $("seed"),
    seedShape: $("seedShape"),
    iris: $("iris"),
    rays: [...document.querySelectorAll(".op-rays > i")],
    ripples: [...document.querySelectorAll(".op-ripples > i")],
    campus: $("campus"),
    cam: $("cam"),
    stoneWord: $("stoneWord"),
    carve: $("carve"),
    caption: $("caption"),
    year: $("year"),
    yearLabel: $("yearLabel"),
    yearDigits: $("yearDigits"),
    yearRange: $("yearRange"),
    s2: $("s2"),
    s2rimSoft: $("s2rimSoft"),
    s2rimTeal: $("s2rimTeal"),
    s2in: $("s2in"),
    s2motes: $("s2motes"),
    s2ring: $("s2ring"),
    s2deco: [...document.querySelectorAll(".op-s2__deco > i")],
    s2label: $("s2label"),
    s2digits: $("s2digits"),
    s2word: $("s2word"),
    s2en: $("s2en"),
    tiles: $("tiles"),
    doorL: $("doorL"),
    doorR: $("doorR"),
    curtain: $("curtain"),
    warp: $("warp"),
    moonDisc: $("moonDisc"),
    deco: [...document.querySelectorAll(".op-deco > i")],
    mark: $("mark"),
    burst: $("burst"),
    orbit: $("orbit"),
    orbitLine: $("orbitLine"),
    emblem: $("emblem"),
    lockup: $("lockup"),
    word: $("word"),
    en: $("en"),
    rule: $("rule"),
    wave: $("wave"),
    title: $("title"),
    sub: $("sub"),
    chip: $("chip"),
    chipText: $("chipText"),
    sweep: $("sweep"),
    sweepSoft: $("sweepSoft")
  };

  /* ---------------- Build the drawings ---------------- */

  el.cam.insertAdjacentHTML("afterbegin", window.CZ_SCENE);
  const scene = el.cam.querySelector("svg");
  const q = (sel) => [...scene.querySelectorAll(sel)];
  const S = {
    sun: q(".sun, .moon"),
    far: q(".far"),
    tiers: q(".tier"),
    blds: q(".bld"),
    flags: q(".flag"),
    trees: q(".tree"),
    stone: q(".stone, .pond"),
    wins: q(".win"),
    glint: scene.querySelector(".glint")
  };
  const SKY = {
    day: scene.querySelector(".sky-day"),
    dusk: scene.querySelector(".sky-dusk"),
    stars: scene.querySelector(".stars"),
    wash: scene.querySelector(".day-wash"),
    clouds: scene.querySelector(".clouds"),
    sunPos: scene.querySelector(".sun-pos"),
    moonPos: scene.querySelector(".moon-pos"),
    moon: scene.querySelector(".moon"),
    moonCut: scene.querySelector("#opMoonCut circle:last-child")
  };
  // Lit window colours: mostly teal-soft, some warm.
  const LIT = S.wins.map((w, i) => ((i * 7) % 10 < 3 ? "#ffe3a3" : "#c8f1f2"));
  // Pagoda lamps, bottom tier first (the generator draws them bottom up).
  const PAGODA = S.tiers.map((t) => [...t.querySelectorAll(".win")]).filter((w) => w.length);

  const E = window.CZ_EMBLEM;
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("viewBox", "0 0 487 487");
  function node(tag, attrs, parent) {
    const n = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    (parent || svg).appendChild(n);
    return n;
  }
  const defs = node("defs", {});
  const clip = node("clipPath", { id: "opDisc" }, defs);
  node("circle", { cx: 243.5, cy: 243.5, r: 243.5 }, clip);
  const grad = node("linearGradient", { id: "opSheen", x1: "0", y1: "0", x2: "1", y2: "0" }, defs);
  node("stop", { offset: "0", "stop-color": "#fff", "stop-opacity": "0" }, grad);
  node("stop", { offset: "0.5", "stop-color": "#fff", "stop-opacity": "0.75" }, grad);
  node("stop", { offset: "1", "stop-color": "#fff", "stop-opacity": "0" }, grad);

  const disc = node("circle", { cx: 243.5, cy: 243.5, r: 243.5, fill: "#ffffff" });
  function field(parts, color) {
    const g = node("g", {});
    const fill = node("path", { d: parts.join(""), fill: color, "fill-rule": "evenodd", opacity: "0" }, g);
    const strokes = parts.map((d) => node("path", { d, class: "e-stroke", stroke: color, pathLength: "1" }, g));
    return { fill, strokes };
  }
  const teal = field(E.teal, "#30b8bd");
  const navy = field(E.navy, "#1a3e71");
  const ring = node("circle", {
    cx: 243.5, cy: 243.5, r: 240.9, fill: "none", stroke: "#332c2b", "stroke-width": 5.3,
    pathLength: "1", "stroke-dasharray": "1 1", "stroke-dashoffset": "1",
    transform: "rotate(135 243.5 243.5)"
  });
  const letters = E.letters.map((d) => node("path", { d, fill: "#332c2b", "fill-rule": "evenodd", class: "e-letter" }));
  const seal = E.seal.map((d) => node("path", { d, fill: "#332c2b", "fill-rule": "evenodd", class: "e-seal" }));
  const sheenG = node("g", { "clip-path": "url(#opDisc)" });
  const sheen = node("rect", { x: "-260", y: "-160", width: "180", height: "800", fill: "url(#opSheen)" }, sheenG);
  el.emblem.appendChild(svg);

  // Wavy rule: a sine long enough to scroll by one wavelength forever.
  (function () {
    const LAMBDA = 32, AMP = 5.5, pts = [];
    for (let x = 0; x <= 544; x += 2) {
      pts.push(`${x} ${(10 + AMP * Math.sin((x / LAMBDA) * Math.PI * 2)).toFixed(2)}`);
    }
    el.wave.setAttribute("d", `M${pts.join(" L")}`);
  })();

  // Dashed cookie ring behind the "1907" digits.
  el.s2ring.setAttribute("d", `M${shapePoints("cookie12").map(([x, y]) => `${(x * 400).toFixed(1)} ${(y * 400).toFixed(1)}`).join(" L")}Z`);

  // Motes: small M3 shapes rising through a background, always moving.
  function makeMotes(container, count, seed0) {
    let seed = seed0;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const kinds = ["circle", "spark4", "clover4", "cookie12", "sunny8", "circle"];
    const colors = ["#c8f1f2", "#30b8bd", "#ffffff", "#57cfd3"];
    for (let i = 0; i < count; i += 1) {
      const m = document.createElement("i");
      const size = 8 + rnd() * 20;
      m.style.left = `${(rnd() * 1920).toFixed(0)}px`;
      m.style.top = `${(260 + rnd() * 900).toFixed(0)}px`;
      m.style.width = m.style.height = `${size.toFixed(1)}px`;
      m.style.background = colors[i % colors.length];
      m.style.clipPath = `var(--shape-${kinds[i % kinds.length]})`;
      m.style.setProperty("--o", (0.18 + rnd() * 0.42).toFixed(2));
      m.style.animationDuration = `${(9 + rnd() * 10).toFixed(1)}s`;
      m.style.animationDelay = `${(-rnd() * 19).toFixed(1)}s`;
      container.appendChild(m);
    }
  }
  makeMotes(el.motes, 26, 20260901);
  makeMotes(el.s2motes, 14, 19070101);

  // Decoration enters from outside, flying in towards its place.
  const DECO_FROM = el.deco.map((n) => {
    const cx = n.offsetLeft + n.offsetWidth / 2;
    const cy = n.offsetTop + n.offsetHeight / 2;
    return `translate(${((cx - 960) * 0.7).toFixed(0)}px, ${((cy - 540) * 0.7).toFixed(0)}px) scale(0.3) rotate(-150deg)`;
  });

  // Warp streaks for the moon match-cut.
  const STREAKS = Array.from({ length: 30 }, (_, i) => {
    const s = document.createElement("i");
    el.warp.appendChild(s);
    return { el: s, angle: i * 12 + ((i * 53) % 9) };
  });

  // Tile wave: 8 x 5 cells, each covered by a 380 px M3 shape (big enough
  // that neighbours overlap even at the shapes' narrowest).
  const TILE_SHAPES = ["cookie12", "cookie9", "sunny8", "circle"];
  const TILE_COLORS = ["#30b8bd", "#244a82", "#c8f1f2"];
  const TILES = [];
  for (let r = 0; r < 5; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const t = document.createElement("i");
      t.style.left = `${120 + 240 * c - 190}px`;
      t.style.top = `${108 + 216 * r - 190}px`;
      t.style.background = TILE_COLORS[(c + r) % 3];
      t.style.clipPath = shape(TILE_SHAPES[(c * 3 + r) % 4]);
      el.tiles.appendChild(t);
      TILES.push({ el: t, d: c + (4 - r) });     // bottom-left first
    }
  }

  // Curtain: seven capsules, 280 px apart, 340 px wide.
  const PILL_COLORS = ["#30b8bd", "#244a82", "#c8f1f2", "#1a3e71"];
  const PILLS = Array.from({ length: 7 }, (_, i) => {
    const p = document.createElement("i");
    p.style.left = `${i * 280 - 30}px`;
    p.style.background = PILL_COLORS[i % PILL_COLORS.length];
    el.curtain.appendChild(p);
    return p;
  });

  /* ---------------- Timeline helpers ---------------- */

  let timers = [];
  let token = 0;
  let finish = null;
  let running = false;
  let endMode = "reveal";
  let hasTitle = true;
  let lockedUp = false;       // the mark has moved to the lockup position
  let titleChars = [];

  function at(ms, fn) {
    const t = token;
    timers.push(setTimeout(() => { if (t === token) fn(); }, ms));
  }

  function clearTimeline() {
    token += 1;
    timers.forEach(clearTimeout);
    timers = [];
  }

  const lin = (duration) => ({ duration, easing: "linear" });
  const HIDDEN = "polygon(0 0, 0 0, 0 0)";
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  // Which layers are on screen: s1, s2, s23, campus, warp, mark.
  const act = (name) => { el.op.dataset.act = name; };

  /* Background music. The timeline starts when the music does, so the cuts
     stay on the beat. If the browser refuses to play (autoplay rules), the
     sequence runs silently on its own clock. */
  const bgm = $("bgm");
  let bgmVolume = 1;
  let fading = 0;
  function startMusic() {
    if (!bgm) return Promise.resolve(0);
    cancelAnimationFrame(fading);
    bgm.pause();
    bgm.currentTime = 0;
    if (bgmVolume <= 0) return Promise.resolve(0);
    bgm.volume = bgmVolume;
    const started = bgm.play();
    if (!started) return Promise.resolve(0);
    return Promise.race([started.then(() => true, () => false), window.CZ.wait(800).then(() => false)])
      .then((ok) => (ok ? bgm.currentTime * 1000 : 0));
  }
  function fadeMusic(duration) {
    if (!bgm || bgm.paused) return;
    cancelAnimationFrame(fading);
    const from = bgm.volume;
    const t0 = performance.now();
    (function frame(now) {
      const p = clamp01((now - t0) / duration);
      bgm.volume = from * (1 - p);
      if (p < 1) fading = requestAnimationFrame(frame);
      else bgm.pause();
    })(t0);
  }

  // Position of an element's centre in stage pixels.
  function centreOf(n) {
    const box = el.op.getBoundingClientRect();
    const k = box.width / 1920 || 1;
    const b = n.getBoundingClientRect();
    return { x: (b.left + b.width / 2 - box.left) / k, y: (b.top + b.height / 2 - box.top) / k, r: b.width / 2 / k };
  }

  // Attribute tween on its own frame loop (for SVG attributes).
  function tweenAttr(n, attr, from, toValue, duration) {
    const tk = token;
    const ease = M.inout().fn;
    const t0 = performance.now();
    (function frame(now) {
      if (tk !== token) return;
      const p = clamp01((now - t0) / duration);
      n.setAttribute(attr, (from + (toValue - from) * ease(p)).toFixed(2));
      if (p < 1) requestAnimationFrame(frame);
    })(t0);
  }

  // Layered cookie iris: layers[0] opens a hole; the layers under it (the
  // rims) fill the hole with colour until their own, later holes open.
  function layeredIris(layers, cx, cy, opts = {}) {
    const dur = opts.dur || 1050;
    const lags = opts.lags || [0, 0.07, 0.13];
    const last = lags[lags.length - 1];
    const far = Math.max(...[[0, 0], [1920, 0], [0, 1080], [1920, 1080]].map(([x, y]) => Math.hypot(x - cx, y - cy)));
    const rMax = far / 0.9 + 40;
    const ease = M.inout().fn;
    const tk = token;
    return new Promise((resolve) => {
      const t0 = performance.now();
      function frame(now) {
        if (tk !== token) return resolve();
        const p = (now - t0 - (opts.delay || 0)) / dur;
        layers.forEach((layer, i) => {
          if (i > 0 && p > 0 && p <= lags[i]) {
            layer.style.clipPath = "none";
            return;
          }
          const u = clamp01((p - lags[i]) / (1 - last));
          if (u > 0) layer.style.clipPath = shapePx("cookie12", cx, cy, rMax * ease(u), { rot: 50 * u, hole: true });
        });
        if (p < 1) requestAnimationFrame(frame);
        else {
          layers.forEach((layer) => { layer.style.clipPath = HIDDEN; });
          resolve();
        }
      }
      requestAnimationFrame(frame);
    });
  }

  /* ---------------- Cues ---------------- */

  // The sequence is cut to its music (media/opener-bgm.ogg, 123 BPM). BEATS
  // are the beat times in ms from the first note, found with
  // tools/gen-opener-beats.py; every scene change lands on a section change
  // of the music and the accents inside the scenes land on beats.
  const BEATS = [
    232, 778, 1289, 1776, 2276, 2763, 3262, 3750, 4249, 4737,
    5236, 5735, 6235, 6711, 7210, 7709, 8197, 8696, 9183, 9683,
    10182, 10658, 11146, 11645, 12132, 12608, 13108, 13595, 14095, 14582,
    15081, 15569, 16057, 16556, 17055, 17543, 18030, 18518, 19017, 19493,
    19981, 20480, 20979, 21467, 21954, 22442, 22941, 23429, 23917, 24404,
    24903, 25391, 25890, 26366, 26865, 27365, 27852, 28328, 28828, 29327,
    29814, 30302, 30790, 31266, 31672, 32102, 32520, 32996, 33483, 33971,
    34447, 34934
  ];
  const b = (i) => BEATS[i];
  const STEP = 122;                     // a sixteenth note
  const T = {
    s2: b(2), s2Label: b(3), s2Stops: [b(4), b(5), b(6), b(7)], s2Word: b(8), s2En: b(9),
    s3: b(10) - 120, firstLight: b(15),
    s4Cover: b(18), yearIn: b(19), roll0: b(22), roll1: b(26), label: b(26), yearOut: b(29),
    lapse: b(18), cruise: b(19), brake: b(25), stop: b(28),
    s5Cover: b(30), lamps: b(32), glint: b(36),
    s6Cover: b(38), carve: b(39), captionIn: b(41),
    crane: b(44), wax: b(45), warp: b(47), arrive: b(50),
    build: [b(51), b(52), b(53), b(54), b(55)],   // teal, navy, letters, seal, sheen
    lockup: b(58), sweep: b(58),
    accents: [b(61), b(65), b(66)],
    finalHit: b(69),
    end: b(69) - 220                     // the hole bursts open on the final hit
  };
  T.open = b(10);
  T.s4 = T.s4Cover - 930;                // the wipes cover the frame on the beat
  T.s5 = T.s5Cover - 580;
  T.s6 = T.s6Cover - 830;

  // Camera framings of the campus drawing (the camera scales about 960, 540).
  const CAM = {
    s3From: "translate(40px, 0px) scale(1.04)",
    s3To: "translate(-70px, 0px) scale(1.1)",
    s4From: "translate(80px, 60px) scale(1.12)",
    s4To: "translate(-80px, 60px) scale(1.12)",
    pagodaFrom: "translate(-836px, 133px) scale(1.9)",    // centred on (1400, 470)
    pagodaTo: "translate(-880px, 140px) scale(2)",
    stoneFrom: "translate(-12px, -739px) scale(2.4)",      // centred on (965, 848)
    stoneTo: "translate(-12px, -770px) scale(2.5)",
    moon: "translate(-232px, 203px) scale(1.45)"          // centred on (1120, 400)
  };

  /* ---------------- Sky clock ---------------- */

  // The orbit drifts through sunset in S3, speeds up into a time-lapse of
  // two full days in S4, then brakes onto night.
  const ORBIT = { a0: 62, a1: 110, a2: 900 };   // sun angle from the zenith, clockwise
  const V0 = (ORBIT.a1 - ORBIT.a0) / (T.lapse - T.open);
  const UP = T.cruise - T.lapse;
  const DOWN = T.stop - T.brake;
  const VMAX = (ORBIT.a2 - ORBIT.a1 - V0 * UP / 2) / (UP / 2 + (T.brake - T.cruise) + DOWN / 2);
  const A_CRUISE = ORBIT.a1 + V0 * UP + (VMAX - V0) * UP / 2;
  const A_BRAKE = A_CRUISE + VMAX * (T.brake - T.cruise);

  // Speed ramps are smoothsteps, so the angle is their exact integral.
  function orbitAngle(t) {
    if (t <= T.open) return ORBIT.a0;
    if (t < T.lapse) return ORBIT.a0 + V0 * (t - T.open);
    if (t < T.cruise) {
      const u = (t - T.lapse) / UP;
      return ORBIT.a1 + V0 * (t - T.lapse) + (VMAX - V0) * UP * (u * u * u - u * u * u * u / 2);
    }
    if (t < T.brake) return A_CRUISE + VMAX * (t - T.cruise);
    if (t < T.stop) {
      const u = (t - T.brake) / DOWN;
      return A_BRAKE + VMAX * DOWN * (u - u * u * u + u * u * u * u / 2);
    }
    return ORBIT.a2;
  }

  // Each window switches on once it is dark enough; its threshold grows
  // left to right, so lights come on left to right at dusk and go off
  // right to left at dawn. The first night also waits for the buildings.
  const WIN = S.wins.map((w, i) => {
    const x = (parseFloat(w.getAttribute("x")) || 0) / 1920;
    const jitter = ((i * 37) % 100) / 100;
    return { th: 0.3 + 0.45 * x + 0.15 * jitter, gate: T.firstLight + x * 900 + jitter * 250, lit: false };
  });

  function applySky(angle, t) {
    const r = (angle * Math.PI) / 180;
    const c = Math.cos(r);
    const s = Math.sin(r);
    const day = smooth(-0.05, 0.45, c);
    const night = 1 - day;
    SKY.day.setAttribute("opacity", day.toFixed(3));
    SKY.dusk.setAttribute("opacity", (0.95 * clamp01(1 - Math.abs(c - 0.12) / 0.3)).toFixed(3));
    SKY.stars.setAttribute("opacity", smooth(0.4, 1, night).toFixed(3));
    SKY.wash.setAttribute("opacity", (0.6 * day).toFixed(3));
    SKY.clouds.setAttribute("opacity", (0.16 + 0.5 * day).toFixed(3));
    // Elliptical orbit, centred right of the middle to keep clear of the year.
    SKY.sunPos.setAttribute("transform", `translate(${(1120 + 820 * s).toFixed(1)} ${(1000 - 680 * c).toFixed(1)})`);
    SKY.moonPos.setAttribute("transform", `translate(${(1120 - 820 * s).toFixed(1)} ${(1000 + 680 * c).toFixed(1)})`);
    WIN.forEach((w, i) => {
      const lit = night > w.th && t >= w.gate;
      if (lit === w.lit) return;
      w.lit = lit;
      S.wins[i].style.fill = lit ? LIT[i] : "";
    });
  }

  /* ---------------- Odometers ---------------- */

  // Vertical-only blur per wheel, scaled by how fast it spins.
  const blurSvg = document.createElementNS(SVGNS, "svg");
  blurSvg.setAttribute("width", "0");
  blurSvg.setAttribute("height", "0");
  blurSvg.style.position = "absolute";
  document.body.appendChild(blurSvg);

  // Four wheels, each a 0-9-0 strip rolling upward.
  function makeOdometer(container, cell, prefix) {
    container.textContent = "";
    const wheels = [];
    for (let k = 0; k < 4; k += 1) {
      const col = document.createElement("span");
      col.className = "op-odo";
      const strip = document.createElement("span");
      strip.innerHTML = "0123456789".split("").concat("0").map((d) => `<b>${d}</b>`).join("");
      col.appendChild(strip);
      container.appendChild(col);
      const filter = node("filter", { id: `${prefix}${k}`, x: "-5%", y: "-5%", width: "110%", height: "110%" }, blurSvg);
      const blur = node("feGaussianBlur", { stdDeviation: "0 0" }, filter);
      wheels.push({ col, strip, blur, id: filter.id, pos: 0, blurred: false });
    }
    function place(w, pos, dt) {
      const shown = ((pos % 10) + 10) % 10;
      w.strip.style.transform = `translateY(${(-shown * cell).toFixed(2)}px)`;
      let sd = 0;
      if (dt) {
        let moved = pos - w.pos;
        if (moved < -5) moved += 10;
        sd = Math.min(12, (Math.abs(moved) * cell * 0.3 * 16.7) / dt);
      }
      if (sd > 0.4) {
        w.blur.setAttribute("stdDeviation", `0 ${sd.toFixed(2)}`);
        if (!w.blurred) w.strip.style.filter = `url(#${w.id})`;
        w.blurred = true;
      } else if (w.blurred) {
        w.strip.style.filter = "";
        w.blurred = false;
      }
      w.pos = pos;
    }
    return {
      wheels,
      positions(list, dt) { list.forEach((p, i) => place(wheels[i], p, dt)); },
      // Mechanical odometer: the units wheel turns continuously, every other
      // wheel only moves while all the wheels below it roll over from 9 to 0.
      value(v, dt) {
        for (let k = 0; k < 4; k += 1) {
          const unit = Math.pow(10, k);
          const carry = k === 0 ? v % 10 - Math.floor(v % 10) : clamp01((v % unit) - (unit - 1));
          place(wheels[3 - k], (Math.floor(v / unit) % 10) + carry, dt);
        }
      }
    };
  }
  const yearOdo = makeOdometer(el.yearDigits, 176, "opYearBlur");
  const bigOdo = makeOdometer(el.s2digits, 300, "opBigBlur");
  const BIG_TARGET = [1, 9, 0, 7];
  const BIG_TURNS = [2, 3, 4, 5];

  // Trapezoid velocity (linear ramps), so the wheels speed up and brake.
  function rollProgress(x, a = 0.15, b = 0.4) {
    x = clamp01(x);
    const area = 1 - a / 2 - b / 2;
    if (x < a) return (x * x) / (2 * a) / area;
    if (x <= 1 - b) return (a / 2 + (x - a)) / area;
    return (area - ((1 - x) * (1 - x)) / (2 * b)) / area;
  }

  // Slot machine for S2: every wheel spins upward and eases onto its digit.
  function bigWheels(t) {
    return BIG_TARGET.map((d, i) => {
      const p = clamp01((t - T.s2) / (T.s2Stops[i] - T.s2));
      return d - 10 * BIG_TURNS[i] * Math.pow(1 - p, 3);
    });
  }

  // One frame clock for everything continuous before the pagoda scene.
  function runClock(year, lead) {
    const tk = token;
    const t0 = performance.now() - lead;
    let last = t0;
    function frame(now) {
      if (tk !== token) return;
      const t = now - t0;
      const dt = Math.max(1, now - last);
      last = now;
      if (t < T.s2Stops[3] + 120) bigOdo.positions(bigWheels(t), dt);
      if (t >= T.open) applySky(orbitAngle(t), t);
      if (t >= T.roll0) yearOdo.value(1907 + (year - 1907) * rollProgress((t - T.roll0) / (T.roll1 - T.roll0)), dt);
      if (t < T.s5Cover) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------------- Wipes ---------------- */

  function tileWipe(onCovered) {
    TILES.forEach((t) => {
      at(t.d * 45, () => to(t.el, { transform: "scale(1) rotate(0deg)" }, { m: M.dec(420) }));
      at(950 + t.d * 45, () => to(t.el, { transform: "scale(0) rotate(90deg)" }, { m: M.acc(380) }));
    });
    at(930, onCovered);
  }

  function doorWipe(onCovered) {
    to(el.doorL, { transform: "translateX(0px)" }, { m: M.inout(560) });
    to(el.doorR, { transform: "translateX(0px)" }, { m: M.inout(560) });
    at(580, onCovered);
    at(700, () => {
      to(el.doorL, { transform: "translateX(-1060px)" }, { m: M.inout(640) });
      to(el.doorR, { transform: "translateX(1060px)" }, { m: M.inout(640) });
    });
  }

  function curtainWipe(onCovered) {
    PILLS.forEach((p, i) => {
      at(i * 55, () => to(p, { transform: "translateY(0px)" }, { m: M.dec(480) }));
      at(860 + i * 55, () => to(p, { transform: "translateY(1900px)" }, { m: M.acc(460) }));
    });
    at(830, onCovered);
  }

  /* ---------------- Poses ---------------- */

  const SEED_SHAPES = ["cookie12", "clover4", "sunny8", "cookie6", "circle"];
  const SEED_COLORS = ["#30b8bd", "#c8f1f2", "#ffffff", "#57cfd3", "#30b8bd"];
  const SWEEP_IN = "inset(0% 100% 0% 0% round 240px)";
  const SWEEP_FULL = "inset(0% 0% 0% 0% round 240px)";
  const SWEEP_OUT = "inset(0% 0% 0% 100% round 240px)";

  function poseTitle() {
    titleChars.forEach((c) => set(c, { transform: "translateY(0.7em)", opacity: "0" }));
  }

  function poseOff() {
    clearTimeline();
    running = false;
    if (bgm && !bgm.paused) fadeMusic(250);
    lockedUp = false;
    el.op.classList.remove("is-live");
    act("s1");
    el.op.style.clipPath = HIDDEN;
    [el.rimSoft, el.rimTeal, el.s2rimSoft, el.s2rimTeal].forEach((n) => { n.style.clipPath = HIDDEN; });
    set(el.photo, { opacity: "0" });
    set(el.motes, { opacity: "0" });
    // S1
    set(el.seed, { transform: "scale(0) rotate(-90deg)", opacity: "1" });
    set(el.seedShape, { clipPath: shape("circle"), backgroundColor: "#30b8bd" });
    el.rays.forEach((r, i) => set(r, { transform: `rotate(${i * 45}deg) translateY(0px) scaleY(0.2)`, opacity: "0" }));
    el.ripples.forEach((r) => set(r, { transform: "scale(0.2)", opacity: "0" }));
    el.iris.getAnimations().forEach((a) => a.cancel());
    set(el.iris, { clipPath: HIDDEN });
    // S2
    el.s2.getAnimations().forEach((a) => a.cancel());
    set(el.s2, { clipPath: HIDDEN });
    set(el.s2in, { transform: "scale(1)", opacity: "1" });
    el.s2in.style.transformOrigin = "";
    el.s2deco.forEach((n) => set(n, { transform: "scale(0) rotate(-120deg)" }));
    set(el.s2label, { transform: "scale(0.4)", opacity: "0" });
    set(el.s2digits, { transform: "translateY(60px)", opacity: "0" });
    bigOdo.positions([0, 0, 0, 0]);
    set(el.s2word, { clipPath: "inset(0% 100% 0% 0%)" });
    set(el.s2en, { transform: "translateY(20px)", opacity: "0", letterSpacing: "0.34em" });
    // Campus
    el.campus.getAnimations().forEach((a) => a.cancel());
    set(el.campus, { clipPath: HIDDEN, transform: "translate(0px, 0px) scale(1)", opacity: "1" });
    el.campus.style.transformOrigin = "";
    set(el.cam, { transform: CAM.s3From });
    S.sun.forEach((n) => set(n, { transform: "scale(0.3) rotate(-45deg)", opacity: "0" }));
    S.far.forEach((n) => set(n, { transform: "translateY(240px)" }));
    S.tiers.forEach((n) => set(n, { transform: "translateY(40px) scale(0.4)", opacity: "0" }));
    S.blds.forEach((n) => set(n, { transform: "translateY(520px)" }));
    S.flags.forEach((n) => set(n, { transform: "scaleY(0)" }));
    S.trees.forEach((n) => set(n, { transform: "scale(0)" }));
    S.stone.forEach((n) => set(n, { transform: "translateY(90px)", opacity: "0" }));
    set(S.glint, { opacity: "0" });
    WIN.forEach((w) => { w.lit = false; });
    S.wins.forEach((n) => { n.style.fill = ""; });
    SKY.moonPos.setAttribute("opacity", "1");
    SKY.moonCut.setAttribute("cx", "34");
    applySky(ORBIT.a0, 0);
    set(el.stoneWord, { clipPath: "inset(0% 100% 0% 0%)" });
    set(el.carve, { transform: "translateX(0px)", opacity: "0" });
    set(el.caption, { transform: "translateY(24px)", opacity: "0", letterSpacing: "0.2em" });
    set(el.year, { transform: "translateY(30px)", opacity: "0" });
    yearOdo.value(1907);
    snap(el.yearLabel, "SINCE");
    set(el.yearRange, { opacity: "0" });
    // Wipes
    TILES.forEach((t) => set(t.el, { transform: "scale(0) rotate(-90deg)" }));
    set(el.doorL, { transform: "translateX(-1060px)" });
    set(el.doorR, { transform: "translateX(1060px)" });
    PILLS.forEach((p) => set(p, { transform: "translateY(-1900px)" }));
    // Match-cut
    set(el.warp, { transform: "translate(0px, 0px)" });
    STREAKS.forEach((s) => set(s.el, { opacity: "0" }));
    set(el.moonDisc, { transform: "translate(0px, 0px) scale(1)", opacity: "0", backgroundColor: "#eef6ff" });
    // Emblem and lockup
    el.deco.forEach((n, i) => set(n, { transform: DECO_FROM[i], opacity: "0" }));
    set(el.mark, { transform: "translate(0px, 0px) scale(1)", opacity: "0" });
    set(el.burst, { opacity: "0", transform: "scale(0.6)" });
    set(el.orbit, { opacity: "0", transform: "scale(0.8)" });
    set(el.orbitLine, { strokeDashoffset: "1" });
    set(disc, { opacity: "1" });
    for (const f of [teal, navy]) {
      set(f.fill, { opacity: "0" });
      f.strokes.forEach((s) => set(s, { strokeDashoffset: "1", opacity: "1" }));
    }
    set(ring, { strokeDashoffset: "1" });
    letters.forEach((n) => set(n, { transform: "scale(0.2)", opacity: "0" }));
    seal.forEach((n) => set(n, { transform: "translateY(12px)", opacity: "0" }));
    set(sheen, { transform: "rotate(20deg) translateX(0px)" });
    set(el.lockup, { transform: "translateY(0px)", opacity: "1" });
    set(el.word, { clipPath: "inset(0% 100% 0% 0%)" });
    set(el.en, { transform: "translateY(18px)", opacity: "0" });
    set(el.rule, { width: "0px" });
    poseTitle();
    set(el.sub, { transform: "translateY(30px)", opacity: "0" });
    set(el.chip, { transform: "scale(0.6)", opacity: "0" });
    set(el.sweep, { clipPath: SWEEP_IN });
    set(el.sweepSoft, { clipPath: SWEEP_IN });
  }

  // Expanding cookie as keyframes; the lobes slide as it grows.
  function cookieFrames(r0, r1, rot) {
    return Array.from({ length: 9 }, (_, i) => {
      const p = i / 8;
      return { clipPath: shapePx("cookie12", 960, 540, Math.max(0.5, r0 + (r1 - r0) * p), { rot: rot * p }) };
    });
  }

  /* ---------------- The sequence ---------------- */

  function play() {
    poseOff();
    running = true;
    const tk = token;
    return startMusic().then((lead) => {
      if (tk !== token) return null;
      return sequence(lead);
    });
  }

  function sequence(lead) {
    el.op.classList.add("is-live");
    const year = new Date().getFullYear();
    // Cues are in music time; lead is how far the music already is.
    const cue = (ms, fn) => at(Math.max(0, ms - lead), fn);
    runClock(year, lead);

    /* S1 - cover grows over the dark campus photo; the seed morphs */
    const cover = el.op.animate([
      { clipPath: shapePx("cookie12", 960, 540, 1, { rot: -60 }) },
      { clipPath: shapePx("cookie12", 960, 540, 1200, { rot: 0 }) }
    ], { duration: 700, easing: M.dec().easing, fill: "forwards" });
    cover.finished.then(() => { if (running) { el.op.style.clipPath = "none"; cover.cancel(); } }, () => {});
    to(el.photo, { opacity: "0.85" }, { m: M.std(900) });
    to(el.motes, { opacity: "1" }, { m: M.std(900) });

    to(el.seed, { transform: "scale(1) rotate(0deg)" }, { m: "sf", delay: 80 });
    SEED_SHAPES.forEach((s, i) => cue([0, b(0), 505, b(1), 1034][i], () => {
      to(el.seedShape, { clipPath: shape(s) }, { m: "sf" });
      to(el.seedShape, { backgroundColor: SEED_COLORS[i] }, { m: "ef" });
      pulse(el.seed, [{ transform: "scale(1)" }, { transform: "scale(1.18) rotate(20deg)" }, { transform: "scale(1)" }], { duration: 260, easing: "cubic-bezier(0.2,0,0,1)", composite: "add" });
    }));
    // Each property gets one animation at a time, so follow-ups are scheduled.
    el.rays.forEach((r, i) => {
      cue(b(0) + i * 20, () => {
        to(r, { opacity: "1" }, { m: "ef" });
        to(r, { transform: `rotate(${i * 45 + 22}deg) translateY(-120px) scaleY(1)` }, { m: "sf" });
      });
      cue(b(1) + i * 20, () => {
        to(r, { opacity: "0" }, { m: M.acc(220) });
        to(r, { transform: `rotate(${i * 45 + 30}deg) translateY(-260px) scaleY(0.3)` }, { m: M.acc(260) });
      });
    });
    el.ripples.forEach((r, i) => {
      cue([0, b(0), b(1)][i], () => {
        to(r, { opacity: "0.9" }, { m: "ef" });
        to(r, { transform: "scale(3.2)" }, { m: M.dec(900) });
      });
      cue([0, b(0), b(1)][i] + 320, () => to(r, { opacity: "0" }, { m: M.std(600) }));
    });
    cue(900, () => to(el.seed, { transform: "scale(16) rotate(90deg)" }, { m: M.acc(360) }));

    /* S1 -> S2: rotating cookie iris with a soft-teal rim running just ahead */
    const irisTiming = { duration: 1150, easing: M.dec().easing, fill: "forwards" };
    cue(T.s2 - 110, () => el.iris.animate(cookieFrames(0, 1260, 70), irisTiming));
    cue(T.s2, () => {
      const a = el.s2.animate(cookieFrames(0, 1260, 70), irisTiming);
      a.finished.then(() => {
        if (!running) return;
        el.s2.style.clipPath = "none";
        a.cancel();
        el.iris.getAnimations().forEach((x) => x.cancel());
        el.iris.style.clipPath = HIDDEN;
        set(el.seed, { opacity: "0" });
        act("s2");
      }, () => {});
    });

    /* S2 - "SINCE 1907" */
    let zero = { x: 960, y: 540 };
    cue(T.s2, () => {
      // The camera pushes in on the "0", which the next transition flies through.
      const c = centreOf(bigOdo.wheels[2].col);
      if (c.r) zero = { x: c.x, y: c.y - 60 };      // the digits start 60 px low
      el.s2in.style.transformOrigin = `${zero.x.toFixed(1)}px ${zero.y.toFixed(1)}px`;
      to(el.s2in, { transform: "scale(1.07)" }, { m: lin(T.s3 - T.s2) });
      to(el.s2digits, { transform: "translateY(0px)" }, { m: "ss" });
      to(el.s2digits, { opacity: "1" }, { m: "es" });
      el.s2deco.forEach((n, i) => to(n, { transform: "scale(1) rotate(0deg)" }, { m: "sg", delay: 150 + i * 90 }));
    });
    cue(T.s2Label, () => {
      to(el.s2label, { transform: "scale(1)" }, { m: "sf" });
      to(el.s2label, { opacity: "1" }, { m: "ef" });
    });
    T.s2Stops.forEach((ts, i) => cue(ts + 20, () => pulse(bigOdo.wheels[i].col, [
      { transform: "translateY(0px)" }, { transform: "translateY(-16px)" }, { transform: "translateY(0px)" }
    ], { duration: 360, easing: "cubic-bezier(0.2,0,0,1)" })));
    cue(T.s2Word, () => to(el.s2word, { clipPath: "inset(0% 0% 0% 0%)" }, { m: M.dec(1000) }));
    cue(T.s2En, () => {
      to(el.s2en, { transform: "translateY(0px)" }, { m: "sd" });
      to(el.s2en, { opacity: "1" }, { m: "ed" });
      to(el.s2en, { letterSpacing: "0.42em" }, { m: lin(T.s3 - T.s2En + 600) });
    });

    /* S2 -> S3: fly through the "0" into the campus at sunset */
    cue(T.s3, () => {
      act("s23");
      el.campus.style.clipPath = "none";
      to(el.cam, { transform: CAM.s3To }, { m: lin(T.s4Cover - T.s3) });
      to(el.s2in, { transform: "scale(4.2)" }, { m: M.acc(900) });
      to(el.s2in, { opacity: "0" }, { m: M.std(420), delay: 420 });
      layeredIris([el.s2, el.s2rimTeal, el.s2rimSoft], zero.x, zero.y, { dur: 1000 }).then(() => {
        if (running && el.op.dataset.act === "s23") act("campus");
      });
    });

    /* S3 - campus rises at sunset, night falls, windows light up */
    cue(T.s3 + 100, () => S.sun.forEach((n) => {
      to(n, { transform: "scale(1) rotate(0deg)" }, { m: "ss" });
      to(n, { opacity: "1" }, { m: "es" });
    }));
    S.far.forEach((n, i) => cue(b(10) + i * STEP, () => to(n, { transform: "translateY(0px)" }, { m: "ss" })));
    S.blds.forEach((n, i) => cue(b(11 + i), () => to(n, { transform: "translateY(0px)" }, { m: "ss" })));
    S.tiers.forEach((n, i) => cue(b(12) + i * STEP, () => {
      to(n, { transform: "translateY(0px) scale(1)" }, { m: "sf" });
      to(n, { opacity: "1" }, { m: "ef" });
    }));
    S.flags.forEach((n, i) => cue(b(14) + i * STEP / 2, () => to(n, { transform: "scaleY(1)" }, { m: "sf" })));
    S.trees.forEach((n, i) => cue(b(14) + i * STEP, () => to(n, { transform: "scale(1)" }, { m: "sf" })));
    cue(b(15), () => S.stone.forEach((n) => {
      to(n, { transform: "translateY(0px)" }, { m: "sd" });
      to(n, { opacity: "1" }, { m: "ed" });
    }));

    /* S3 -> S4: tile wave */
    cue(T.s4, () => tileWipe(() => {
      set(el.cam, { transform: CAM.s4From });
      to(el.cam, { transform: CAM.s4To }, { m: lin(T.s5Cover - T.s4Cover) });
    }));

    /* S4 - day/night time-lapse with the year odometer */
    cue(T.yearIn, () => {
      to(el.year, { transform: "translateY(0px)" }, { m: "sd" });
      to(el.year, { opacity: "1" }, { m: "ed" });
    });
    cue(T.label, () => {
      swap(el.yearLabel, `建校 ${year - 1907} 年`);
      el.yearRange.textContent = `1907 — ${year}`;
      to(el.yearRange, { opacity: "1" }, { m: "es" });
      pulse(el.yearDigits, [{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }], { duration: 420, easing: "cubic-bezier(0.2,0,0,1)", composite: "add" });
    });
    cue(T.yearOut, () => {
      to(el.year, { opacity: "0" }, { m: M.acc(300) });
      to(el.year, { transform: "translateY(-40px)" }, { m: M.acc(360) });
    });

    /* S4 -> S5: doors */
    cue(T.s5, () => doorWipe(() => {
      set(el.cam, { transform: CAM.pagodaFrom });
      to(el.cam, { transform: CAM.pagodaTo }, { m: lin(T.s6Cover - T.s5Cover) });
      PAGODA.flat().forEach((w) => { w.style.fill = ""; });
    }));

    /* S5 - pagoda close-up: lamps light tier by tier, the spire flashes */
    PAGODA.forEach((wins, i) => cue(T.lamps + i * STEP, () => wins.forEach((w, k) => {
      w.style.fill = (i + k) % 3 === 0 ? "#c8f1f2" : "#ffe3a3";
    })));
    cue(T.glint, () => {
      to(S.glint, { opacity: "1" }, { m: M.std(300) });
      pulse(S.glint, [{ transform: "scale(0.2)" }, { transform: "scale(1.6)" }, { transform: "scale(1)" }], { duration: 600, easing: "cubic-bezier(0.2,0,0,1)" });
    });

    /* S5 -> S6: curtain */
    cue(T.s6, () => curtainWipe(() => {
      set(S.glint, { opacity: "0" });
      set(el.cam, { transform: CAM.stoneFrom });
      to(el.cam, { transform: CAM.stoneTo }, { m: lin(T.crane - T.s6Cover) });
    }));

    /* S6 - the name stone: calligraphy carved, English caption */
    cue(T.carve, () => {
      to(el.stoneWord, { clipPath: "inset(0% 0% 0% 0%)" }, { m: M.inout(1400) });
      set(el.carve, { opacity: "1" });
      to(el.carve, { transform: "translateX(440px)" }, { m: M.inout(1400) });
      at(1300, () => to(el.carve, { opacity: "0" }, { m: M.std(300) }));
    });
    cue(T.captionIn, () => {
      to(el.caption, { transform: "translateY(0px)" }, { m: "sd" });
      to(el.caption, { opacity: "1" }, { m: "ed" });
      to(el.caption, { letterSpacing: "0.3em" }, { m: lin(T.crane - T.captionIn + 400) });
    });

    /* S6 -> S7: crane up to the moon, it waxes full, warp into it */
    cue(T.crane, () => {
      to(el.caption, { opacity: "0" }, { m: M.acc(300) });
      to(el.caption, { transform: "translateY(-30px)" }, { m: M.acc(360) });
      to(el.cam, { transform: CAM.moon }, { m: M.inout(T.warp - T.crane) });
    });
    cue(T.wax, () => tweenAttr(SKY.moonCut, "cx", 34, 224, 750));
    cue(T.warp, () => { act("warp"); warp(T.arrive - T.warp); });

    /* S7 - arrival: shockwave, decoration flies in, emblem builds */
    cue(T.arrive, () => {
      act("mark");
      set(el.mark, { opacity: "1" });
      to(el.burst, { opacity: "1" }, { m: M.std(1000) });
      to(el.burst, { transform: "scale(1)" }, { m: "ss" });
      to(el.moonDisc, { opacity: "0" }, { m: M.std(260), delay: 60 });
      pulse(el.mark, [{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }], { duration: 700, easing: "cubic-bezier(0.2,0,0,1)", composite: "add" });
      el.ripples.forEach((r, i) => {
        set(r, { transform: "scale(1.7)", opacity: "0" });
        at(i * 140, () => {
          to(r, { opacity: "0.85" }, { m: "ef" });
          to(r, { transform: "scale(4.6)" }, { m: M.dec(1200) });
        });
        at(320 + i * 140, () => to(r, { opacity: "0" }, { m: M.std(800) }));
      });
      el.deco.forEach((n, i) => {
        to(n, { transform: "translate(0px, 0px) scale(1) rotate(0deg)" }, { m: "sg", delay: 60 + i * 55 });
        to(n, { opacity: "1" }, { m: "es", delay: 60 + i * 55 });
      });
      to(el.orbit, { opacity: "1" }, { m: M.std(600), delay: 250 });
      to(el.orbit, { transform: "scale(1)" }, { m: "ss", delay: 250 });
      to(el.orbitLine, { strokeDashoffset: "0" }, { m: M.inout(1500), delay: 350 });
    });
    const B = T.arrive;
    cue(B, () => to(ring, { strokeDashoffset: "0" }, { m: M.dec(900) }));
    [[teal, T.build[0]], [navy, T.build[1]]].forEach(([f, t0]) => {
      f.strokes.forEach((s, i) => cue(t0 + i * 50, () => to(s, { strokeDashoffset: "0" }, { m: M.inout(650) })));
      cue(t0 + 620, () => {
        to(f.fill, { opacity: "1" }, { m: M.std(380) });
        f.strokes.forEach((s) => to(s, { opacity: "0" }, { m: M.std(380), delay: 200 }));
      });
    });
    letters.forEach((n, i) => cue(T.build[2] + i * 13, () => {
      to(n, { transform: "scale(1)" }, { m: "sf" });
      to(n, { opacity: "1" }, { m: "ef" });
    }));
    seal.forEach((n, i) => cue(T.build[3] + i * 30, () => {
      to(n, { transform: "translateY(0px)" }, { m: "sd" });
      to(n, { opacity: "1" }, { m: "ed" });
    }));
    cue(T.build[4], () => {
      sheenLoop();
      pulse(el.emblem, [{ transform: "scale(1)" }, { transform: "scale(1.05)" }, { transform: "scale(1)" }], { duration: 600, easing: "cubic-bezier(0.2,0,0,1)", composite: "add" });
    });

    /* S7 -> S8: the mark slides left, bands sweep across and retract */
    cue(T.lockup, () => {
      lockedUp = true;
      to(el.mark, { transform: "translate(-400px, 0px) scale(0.72)" }, { m: "ss" });
    });
    const W = T.sweep;
    cue(W - 80, () => to(el.sweepSoft, { clipPath: SWEEP_FULL }, { m: M.dec(560) }));
    cue(W, () => to(el.sweep, { clipPath: SWEEP_FULL }, { m: M.dec(520) }));
    cue(W + 480, () => to(el.sweep, { clipPath: SWEEP_OUT }, { m: M.inout(640) }));
    cue(W + 590, () => to(el.sweepSoft, { clipPath: SWEEP_OUT }, { m: M.inout(660) }));
    // Text moves into place under the bands and is uncovered as they retract.
    cue(W + 520, () => to(el.word, { clipPath: "inset(0% 0% 0% 0%)" }, { m: M.dec(900) }));
    cue(W + 600, () => {
      to(el.en, { transform: "translateY(0px)" }, { m: "sd" });
      to(el.en, { opacity: "1" }, { m: "ed" });
    });
    cue(W + 700, () => to(el.rule, { width: "480px" }, { m: M.dec(900) }));
    titleChars.forEach((c, i) => cue(W + 680 + i * 38, () => {
      to(c, { transform: "translateY(0em)" }, { m: "sf" });
      to(c, { opacity: "1" }, { m: "ef" });
    }));
    cue(W + 980, () => {
      to(el.sub, { transform: "translateY(0px)" }, { m: "ss" });
      to(el.sub, { opacity: "1" }, { m: "es" });
    });
    cue(W + 1180, () => {
      to(el.chip, { transform: "scale(1)" }, { m: "sf" });
      to(el.chip, { opacity: "1" }, { m: "ef" });
    });

    // The lockup breathes with the kicks.
    T.accents.forEach((t) => cue(t, () => {
      pulse(el.mark, [{ transform: "scale(1)" }, { transform: "scale(1.035)" }, { transform: "scale(1)" }], { duration: 380, easing: "cubic-bezier(0.2,0,0,1)", composite: "add" });
      pulse(el.chip, [{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }], { duration: 380, easing: "cubic-bezier(0.2,0,0,1)", composite: "add" });
    }));

    return new Promise((resolve) => {
      finish = resolve;
      if (endMode === "reveal") cue(T.end, () => reveal().then(resolve));
      else cue(T.finalHit, () => {
        // Holding: the final hit lands as a shockwave around the mark.
        el.ripples.forEach((r, i) => {
          set(r, { transform: "translate(-400px, 0px) scale(1.2)", opacity: "0" });
          at(i * 110, () => {
            to(r, { opacity: "0.8" }, { m: "ef" });
            to(r, { transform: "translate(-400px, 0px) scale(3.6)" }, { m: M.dec(1100) });
          });
          at(260 + i * 110, () => to(r, { opacity: "0" }, { m: M.std(700) }));
        });
        pulse(el.mark, [{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 520, easing: "cubic-bezier(0.2,0,0,1)", composite: "add" });
        resolve();
      });
    });
  }

  function sheenLoop() {
    set(sheen, { transform: "rotate(20deg) translateX(0px)" });
    to(sheen, { transform: "rotate(20deg) translateX(900px)" }, { m: M.inout(900) });
    at(4200, sheenLoop);
  }

  /* Match-cut: the moon (full by now) becomes the emblem's white disc. The
     campus rushes past towards the camera, centred on the moon. */
  function warp(duration) {
    const m = centreOf(SKY.moon);
    const r = m.r || 86;
    const glide = { duration, easing: "cubic-bezier(0.65, 0, 0.25, 1)" };

    SKY.moonPos.setAttribute("opacity", "0");
    set(el.moonDisc, { transform: `translate(${(m.x - 960).toFixed(1)}px, ${(m.y - 540).toFixed(1)}px) scale(${(r / 260).toFixed(4)})`, opacity: "1" });
    to(el.moonDisc, { transform: "translate(0px, 0px) scale(1)" }, { m: glide });
    to(el.moonDisc, { backgroundColor: "#ffffff" }, { m: M.std(900) });

    el.campus.style.transformOrigin = `${m.x.toFixed(1)}px ${m.y.toFixed(1)}px`;
    to(el.campus, { transform: `translate(${(960 - m.x).toFixed(1)}px, ${(540 - m.y).toFixed(1)}px) scale(2.9)` }, { m: { duration, easing: "cubic-bezier(0.55, 0, 0.3, 1)" } });
    to(el.campus, { opacity: "0" }, { m: M.std(700), delay: 480 });

    // Streaks shoot out of the moon and travel with it.
    set(el.warp, { transform: `translate(${(m.x - 960).toFixed(1)}px, ${(m.y - 540).toFixed(1)}px)` });
    to(el.warp, { transform: "translate(0px, 0px)" }, { m: glide });
    STREAKS.forEach((s, i) => {
      for (let rep = 0; rep < 3; rep += 1) {
        at(rep * 330 + ((i * 97) % 260), () => {
          const len = 1 + ((i * 7 + rep * 3) % 5) * 0.25;
          pulse(s.el, [
            { opacity: 0, transform: `rotate(${s.angle}deg) translateY(-${Math.round(r + 30)}px) scaleY(0.2)` },
            { opacity: 0.9, offset: 0.25 },
            { opacity: 0, transform: `rotate(${s.angle}deg) translateY(-1100px) scaleY(${len.toFixed(2)})` }
          ], { duration: 720, easing: "cubic-bezier(0.5, 0, 1, 1)" });
        });
      }
    });

    // The dark photo background returns behind it.
    to(el.photo, { opacity: "0.85" }, { m: M.std(900), delay: 500 });
  }

  /* Layered reveal: the cover opens a cookie hole from the mark while teal and
     soft-teal rims trail inside it; the mark flies at the camera. */
  let revealing = null;
  function reveal() {
    if (revealing) return revealing;
    clearTimeline();
    // Stopped before the music's final hit: fade it out with the reveal.
    if (bgm && !bgm.paused && bgm.currentTime * 1000 < T.finalHit - 400) fadeMusic(900);
    bus.announce("opener", false);
    const cx = lockedUp ? 560 : 960;
    const a = M.acc;
    to(el.lockup, { opacity: "0" }, { m: a(300) });
    to(el.lockup, { transform: "translateY(-36px)" }, { m: a(380) });
    to(el.mark, { transform: lockedUp ? "translate(-400px, 0px) scale(1.25)" : "translate(0px, 0px) scale(1.6)" }, { m: a(620) });
    to(el.mark, { opacity: "0" }, { m: a(420), delay: 160 });
    [el.year, el.caption, el.moonDisc, el.sweep, el.sweepSoft, ...el.deco].forEach((n, i) => to(n, { opacity: "0" }, { m: a(260), delay: i * 18 }));
    revealing = layeredIris([el.op, el.rimTeal, el.rimSoft], cx, 540, { dur: 1050, delay: 100 }).then(() => {
      el.op.classList.remove("is-live");
      running = false;
      revealing = null;
    });
    return revealing;
  }

  poseOff();

  window.CZ.graphic({
    family: "opener",
    defaults: { f0: "2026年秋季学期开学典礼", f1: "2026年9月1日 · 学校体育馆", f2: "reveal", f3: "1" },
    preload: ["./img/wordmark-cn.png", "./img/photo-campus-a.webp", "./img/photo-campus-b.webp", "./img/burst.webp"],
    render(raw) {
      endMode = raw.f2 === "hold" ? "hold" : "reveal";
      bgmVolume = raw.f3 === undefined || raw.f3 === "" ? 1 : Math.min(1, Math.max(0, parseFloat(raw.f3) || 0));
      hasTitle = !!(raw.f0 || raw.f1);
      el.lockup.classList.toggle("no-title", !hasTitle);
      // Title, split into letters that rise one after another.
      el.title.textContent = "";
      const span = document.createElement("span");
      span.textContent = raw.f0 || "";
      el.title.appendChild(span);
      window.CZ.fit(span, 1000, 60, 40);
      const text = span.textContent;
      span.textContent = "";
      titleChars = [...text].map((ch) => {
        const c = document.createElement("span");
        c.className = "op-ch";
        c.textContent = ch;
        span.appendChild(c);
        return c;
      });
      if (!running) poseTitle();
      el.title.style.display = raw.f0 ? "" : "none";
      window.CZ.fit(snap(el.sub, raw.f1 || ""), 1000, 32, 24);
      const year = new Date().getFullYear();
      el.chipText.textContent = `建校 ${year - 1907} 年 · 1907—${year}`;
    },
    enter: play,
    exit() {
      if (!running && !revealing) return Promise.resolve();
      const done = reveal();
      if (finish) finish();
      return done.then(poseOff);
    },
    idle() {
      if (!running) poseOff();
    }
  });
})();
