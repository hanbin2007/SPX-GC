/* Opening title sequence, about 49 s in nine scenes, cut to its music
   (about 124 BPM; times below are music time, beats in brackets). Nothing on
   screen is ever at rest. Every cut lands on a beat, and every scene holds
   its text long enough to read.

   S1  0.0  M3 shape morph burst on the intro's pickup notes
       -> rotating cookie iris with a soft-teal rim, on the first stab (4)
   S2  2.4  "SINCE 1907": the digits land one per beat (6-9), calligraphy
            name on the stab at 10, English name at 11, a pulse on 12
       -> fly through the "0": the hole is half open on beat 17
   S3  8.7  campus at sunset: buildings rise one per beat, pagoda stacks up,
            trees pop, flags wave, night falls, windows light up; credits
            top left from beat 20
       -> tile wave covers on the hit after the gap (34)
   S4 16.9  day/night time-lapse, a full day while the odometer rolls 1907 to
            this year (rolling from beat 36, "建校 N 年" from beat 41)
       -> doors close as the new section comes in (26.25 s)
   S5 26.3  pagoda close-up, the tower dark; its lamps light tier by tier
            as the credits come in right of the tower (55), the spire flashes
       -> curtain of capsules covers on beat 64
   S6 30.9  name-stone close-up: the calligraphy is carved, English caption,
            credits along the water
       -> two beats craning up to the moon as it waxes, two beats warping in
   S7 38.1  on the biggest section change the moon becomes the emblem's disc:
            shockwave, decoration, the emblem builds (79-83)
       -> at 41.1 s the bands sweep in and it moves into the lockup
   S8 41.1  lockup: calligraphy name, English name, wavy rule, title, subtitle,
            anniversary chip; jumps on the heaviest hit (88) and breathes on
            the closing hits (91, 94, 96)
   S9 49.0  as the music dies away: a slow layered reveal onto the programme
            (holding instead, the last hit (98) lands as a shockwave) */
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
    credits: $("credits"),
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
  let titleShown = false;     // the title letters have risen this take
  let creditText = null;          // what the rows were built from
  let creditNext = "";            // latest field value; built at the next play

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
    const ease = opts.ease || M.inout().fn;
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

  // The sequence is cut to its music (media/opener-bgm.ogg, about 124 BPM
  // with a slight drift, so the beats are a measured list, not a formula).
  // BEATS[n] is beat n in ms from the first note, from
  // tools/gen-opener-beats.py. The music: pickup notes (beats 0-3), four
  // opening stabs on 4, 5, 10 and 12, the groove from 18, a hit after a gap
  // on 34, section changes on 50 and 78 (the biggest), the bass dropping out
  // on 85-87 before the heaviest hit on 88, closing hits on 91, 94, 96 and
  // the last one on 98.
  const BEATS = [
    414, 901, 1389, 1877, 2364, 2852, 3339, 3827, 4315, 4802,
    5290, 5775, 6259, 6747, 7232, 7716, 8202, 8686, 9171, 9653,
    10137, 10622, 11107, 11592, 12074, 12558, 13043, 13525, 14009, 14494,
    14976, 15458, 15942, 16427, 16912, 17397, 17879, 18360, 18845, 19330,
    19812, 20293, 20775, 21257, 21741, 22226, 22711, 23196, 23678, 24160,
    24641, 25123, 25605, 26087, 26569, 27050, 27532, 28014, 28496, 28978,
    29460, 29941, 30423, 30905, 31387, 31866, 32345, 32826, 33308, 33790,
    34272, 34751, 35230, 35711, 36193, 36675, 37157, 37639, 38121, 38600,
    39078, 39560, 40042, 40524, 41006, 41485, 41961, 42437, 42913, 43391,
    43871, 44349, 44831, 45310, 45786, 46263, 46741, 47223, 47702, 48178,
    48657, 49138, 49620
  ];
  // Beat n; fractions interpolate between beats.
  function b(n) {
    const i = Math.max(0, Math.min(BEATS.length - 2, Math.floor(n)));
    return Math.round(BEATS[i] + (BEATS[i + 1] - BEATS[i]) * (n - i));
  }
  const STEP = 120;                     // about a sixteenth note
  const PICKUPS = [52, 691, 1173, 1428, 1666];   // the intro's pickup notes
  // Wipes: how long each takes to cover the frame, so the cut is on the beat.
  const COVER = { tiles: 640, doors: 460, curtain: 640 };
  const MARGIN = 40;                    // covered this long before the cut (a frame at 30 fps)
  const T = {
    s2: b(4), s2Label: b(4.5), s2Stops: [b(6), b(7), b(8), b(9)], s2Word: b(10), s2En: b(11), s2Hit: b(12),
    s3: b(17), firstLight: b(26),
    s4Cover: b(34), yearIn: b(35), roll0: b(36), roll1: b(41), label: b(41), yearOut: b(52),
    lapse: b(34), cruise: b(35), brake: b(46), stop: b(50),
    // The new section comes in on the pickup a third of a beat before 54.
    s5Cover: 26250, lamps: b(55), glint: b(60),
    s6Cover: b(64), carve: b(65), captionIn: b(67),
    crane: b(74), wax: b(75), warp: b(76), arrive: b(78),
    build: [b(79), b(80), b(81), b(82), b(83)],   // teal, navy, letters, seal, sheen
    lockup: 41100, sweep: 41100,         // the bands sweep in at 41.1 s
    heavy: b(88),                        // the heaviest hit
    accents: [b(91), b(94), b(96)],
    finalHit: b(98),
    end: 49000                           // the reveal starts as the music dies away
  };
  T.open = T.s3;
  T.run = 450;                           // the fly-through is half open on its beat
  T.s4 = T.s4Cover - COVER.tiles;
  T.s5 = T.s5Cover - COVER.doors;
  T.s6 = T.s6Cover - COVER.curtain;
  // Credits per scene: [from beat, until beat] (sunset, pagoda, name stone).
  // Their exit (about 0.5 s) finishes before the next wipe starts.
  const CREDIT_BEATS = [[20, 31.5], [55, 60.5], [66, 73]];

  // Camera framings of the campus drawing (the camera scales about 960, 540).
  const CAM = {
    s3From: "translate(40px, 0px) scale(1.04)",
    s3To: "translate(-70px, 0px) scale(1.1)",
    s4From: "translate(80px, 60px) scale(1.12)",
    s4To: "translate(-80px, 60px) scale(1.12)",
    // Pushed in with the tower left of centre: the moon leaves the frame and
    // the sky right of the tower is clear for the credits.
    pagodaFrom: "translate(-1300px, 340px) scale(2.4)",
    pagodaTo: "translate(-1330px, 350px) scale(2.5)",
    stoneFrom: "translate(-12px, -739px) scale(2.4)",      // centred on (965, 848)
    stoneTo: "translate(-12px, -770px) scale(2.5)",
    moon: "translate(-232px, 203px) scale(1.45)"          // centred on (1120, 400)
  };

  /* ---------------- Sky clock ---------------- */

  // The orbit drifts through sunset in S3, speeds up into a time-lapse of
  // a full day in S4, then brakes onto night.
  const ORBIT = { a0: 62, a1: 110, a2: 540 };   // sun angle from the zenith, clockwise
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

  // Trapezoid velocity (linear ramps), so the wheels speed up and brake.
  function rollProgress(x, a = 0.15, b = 0.4) {
    x = clamp01(x);
    const area = 1 - a / 2 - b / 2;
    if (x < a) return (x * x) / (2 * a) / area;
    if (x <= 1 - b) return (a / 2 + (x - a)) / area;
    return (area - ((1 - x) * (1 - x)) / (2 * b)) / area;
  }

  // Slot machine for S2: every wheel spins fast from the start and brakes
  // onto its digit over the last 0.8 s, landing on its stab.
  function bigWheels(t) {
    return BIG_TARGET.map((d, i) => {
      const dur = T.s2Stops[i] - T.s2;
      const turns = Math.max(2, Math.round(dur / 450));
      const p = rollProgress((t - T.s2) / dur, Math.min(0.2, 200 / dur), Math.min(0.6, 800 / dur));
      return d - 10 * turns * (1 - p);
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

  // Each wipe is covered just before its beat and opens from it.
  function tileWipe(onCovered) {
    TILES.forEach((t) => {
      at(t.d * 26, () => to(t.el, { transform: "scale(1) rotate(0deg)" }, { m: M.inout(COVER.tiles - 11 * 26 - MARGIN) }));
      at(COVER.tiles + t.d * 14, () => to(t.el, { transform: "scale(0) rotate(90deg)" }, { m: M.dec(400) }));
    });
    at(COVER.tiles, onCovered);
  }

  function doorWipe(onCovered) {
    to(el.doorL, { transform: "translateX(0px)" }, { m: M.inout(COVER.doors - MARGIN) });
    to(el.doorR, { transform: "translateX(0px)" }, { m: M.inout(COVER.doors - MARGIN) });
    at(COVER.doors, onCovered);
    at(COVER.doors + 40, () => {
      to(el.doorL, { transform: "translateX(-1060px)" }, { m: M.dec(620) });
      to(el.doorR, { transform: "translateX(1060px)" }, { m: M.dec(620) });
    });
  }

  function curtainWipe(onCovered) {
    PILLS.forEach((p, i) => {
      at(i * 40, () => to(p, { transform: "translateY(0px)" }, { m: M.inout(COVER.curtain - 6 * 40 - MARGIN) }));
      at(COVER.curtain + i * 20, () => to(p, { transform: "translateY(1900px)" }, { m: M.dec(460) }));
    });
    at(COVER.curtain, onCovered);
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

  /* Credits: "职务 | 姓名" per line, several names split by spaces, up to
     nine. They are shared out in order over three scenes (sunset, pagoda,
     name stone), up to three each. Each scene shows its credits together as
     a group of straps in the package's style (light scheme): one logo badge,
     then rows of [teal role][white name card], each row unrolling half a
     beat after the one before, all leaving together. */
  const { fit } = window.CZ;
  const CS = { KPAD: 26, PAD_L: 30, PAD_R: 72, SEG: 8, COLLAPSED: 20 };
  // Row width budget per group, px: right of the tower is narrow; along the
  // water the rows share the width.
  const CS_WIDTH = [1100, 520, 1600];
  const groups = [...document.querySelectorAll(".op-csg")].map((g) => ({
    el: g,
    badge: g.querySelector(".cz-badge__shape"),
    art: g.querySelector(".cz-badge__art"),
    rows: g.querySelector(".op-cs__rows"),
    items: [],
    shown: false,
    rot: 0
  }));
  const ROW = '<div class="op-cs__kicker"><div class="op-cs__kin"><span class="op-cs__role"></span></div></div>' +
    '<div class="op-cs__card"><div class="op-cs__deco"></div><div class="op-cs__inner"><div class="op-cs__line">' +
    '<div class="op-cs__lin"><span class="op-cs__name"></span></div></div></div></div>';

  function parseCredits(text) {
    return String(text || "").split(/\r?\n/).map((line) => {
      const m = line.match(/^([^|｜]*)[|｜](.*)$/);
      const role = (m ? m[1] : "").trim();
      const names = (m ? m[2] : line).trim().split(/[\s、，,/|｜]+/).filter(Boolean);
      return { role, name: names.join("\u3000") };
    }).filter((c) => c.name).slice(0, 9);
  }

  function buildCredits(list) {
    const counts = [0, 1, 2].map((g) => Math.floor(list.length / 3) + (g < list.length % 3 ? 1 : 0));
    let k = 0;
    groups.forEach((g, gi) => {
      const mine = list.slice(k, (k += counts[gi]));
      const budget = gi === 2 ? CS_WIDTH[2] / Math.max(1, mine.length) - 16 : CS_WIDTH[gi];
      g.rows.textContent = "";
      g.el.style.display = mine.length ? "" : "none";   // shown before measuring
      g.items = mine.map((c) => {
        const row = document.createElement("div");
        row.className = "op-cs__row";
        row.innerHTML = ROW;
        const q = (sel) => row.querySelector(sel);
        q(".op-cs__role").textContent = c.role;
        q(".op-cs__name").textContent = c.name;
        g.rows.appendChild(row);
        const it = { kicker: q(".op-cs__kicker"), kin: q(".op-cs__kin"), card: q(".op-cs__card"), deco: q(".op-cs__deco"), lin: q(".op-cs__lin") };
        it.k = c.role ? Math.ceil(fit(q(".op-cs__role"), 300, 30, 22)) + CS.KPAD * 2 : 0;
        const room = budget - (it.k ? it.k + CS.SEG : 0) - CS.PAD_L - CS.PAD_R;
        it.c = Math.ceil(fit(q(".op-cs__name"), Math.max(120, room), 44, 26)) + CS.PAD_L + CS.PAD_R;
        return it;
      });
    });
  }

  function poseCredits() {
    groups.forEach((g) => {
      g.shown = false;
      g.rot = 0;
      set(g.badge, { transform: "scale(0.3) rotate(-120deg)", opacity: "0" });
      set(g.art, { transform: "scale(0.5)", opacity: "0" });
      g.items.forEach((it) => {
        set(it.kicker, { width: "0px", marginRight: "0px", opacity: "0" });
        set(it.kin, { transform: "translateY(100%)", opacity: "0" });
        set(it.card, { width: `${CS.COLLAPSED}px`, opacity: "0", transform: "translateX(-18px)" });
        set(it.deco, { transform: "rotate(-40deg) scale(0.6)", opacity: "0" });
        set(it.lin, { transform: "translateY(100%)", opacity: "0" });
      });
    });
  }

  function badgeIn(g) {
    g.shown = true;
    to(g.badge, { transform: "scale(1) rotate(0deg)" }, { m: "sf" });
    to(g.badge, { opacity: "1" }, { m: "ef" });
    to(g.art, { transform: "scale(1)" }, { m: "sf", delay: 70 });
    to(g.art, { opacity: "1" }, { m: "ef", delay: 70 });
  }

  // A row unrolls as the name strap does: role segment, then the card, then the words rise.
  function rowIn(it) {
    const hasK = it.k > 0;
    const tc = hasK ? 80 : 20;
    to(it.kicker, { width: `${it.k}px`, marginRight: `${hasK ? CS.SEG : 0}px` }, { m: "sd" });
    to(it.kicker, { opacity: hasK ? "1" : "0" }, { m: "ef" });
    to(it.kin, { transform: "translateY(0%)" }, { m: "sd", delay: 120 });
    to(it.kin, { opacity: "1" }, { m: "ed", delay: 120 });
    to(it.card, { width: `${it.c}px`, transform: "translateX(0px)" }, { m: "sd", delay: tc });
    to(it.card, { opacity: "1" }, { m: "ef", delay: tc });
    to(it.deco, { transform: "rotate(0deg) scale(1)" }, { m: "ss", delay: tc + 80 });
    to(it.deco, { opacity: "1" }, { m: "es", delay: tc + 80 });
    to(it.lin, { transform: "translateY(0%)" }, { m: "sd", delay: tc + 110 });
    to(it.lin, { opacity: "1" }, { m: "ed", delay: tc + 110 });
  }

  function groupOut(g) {
    if (!g.shown) return;
    g.shown = false;
    const a = M.acc;
    g.items.forEach((it, i) => {
      const d = i * 40;
      to(it.lin, { transform: "translateY(-70%)" }, { m: a(200), delay: d });
      to(it.lin, { opacity: "0" }, { m: a(150), delay: d });
      to(it.kin, { transform: "translateY(-70%)" }, { m: a(200), delay: d + 40 });
      to(it.kin, { opacity: "0" }, { m: a(150), delay: d + 40 });
      to(it.deco, { opacity: "0" }, { m: a(160), delay: d });
      to(it.card, { width: `${CS.COLLAPSED}px`, transform: "translateX(-18px)" }, { m: a(280), delay: d + 90 });
      to(it.card, { opacity: "0" }, { m: a(120), delay: d + 260 });
      to(it.kicker, { width: "0px", marginRight: "0px" }, { m: a(260), delay: d + 130 });
      to(it.kicker, { opacity: "0" }, { m: a(120), delay: d + 280 });
    });
    const d = g.items.length * 40;
    to(g.art, { transform: "scale(0.5)" }, { m: a(220), delay: d + 190 });
    to(g.art, { opacity: "0" }, { m: a(160), delay: d + 230 });
    to(g.badge, { transform: `scale(0.3) rotate(${g.rot + 90}deg)` }, { m: a(260), delay: d + 210 });
    to(g.badge, { opacity: "0" }, { m: a(170), delay: d + 290 });
  }

  // Each badge follows the logo group (published by the corner bug), like the name strap.
  const logos = groups.map((g) => window.CZ.followLogo({
    art: g.art,
    fallback: "./img/emblem.png",
    live: () => g.shown,
    onChange: () => {
      g.rot += 30;   // one scallop of the 12-sided cookie
      to(g.badge, { transform: `scale(1) rotate(${g.rot}deg)` }, { m: "sd" });
    }
  }));

  // A scene's credits: badge on the first beat, a row every half beat, out on the last.
  function cueCredits(gi, from, until, cue) {
    const g = groups[gi];
    if (!g.items.length) return;
    cue(b(from), () => badgeIn(g));
    g.items.forEach((it, i) => cue(b(from + i / 2) + 80, () => rowIn(it)));
    cue(b(until), () => groupOut(g));
  }

  function poseOff() {
    clearTimeline();
    running = false;
    if (bgm && !bgm.paused) fadeMusic(250);
    lockedUp = false;
    titleShown = false;
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
    poseCredits();
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
    set(el.credits, { opacity: "1" });
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
    // Credits edited while on air are rebuilt here, not under running cues.
    if (creditNext !== creditText) {
      creditText = creditNext;
      buildCredits(parseCredits(creditText));
    }
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

    /* S1 - cover grows over the dark campus photo; the seed morphs on the
       intro's pickup notes, then the first stab opens S2 */
    const cover = el.op.animate([
      { clipPath: shapePx("cookie12", 960, 540, 1, { rot: -60 }) },
      { clipPath: shapePx("cookie12", 960, 540, 1200, { rot: 0 }) }
    ], { duration: 700, easing: M.dec().easing, fill: "forwards" });
    cover.finished.then(() => { if (running) { el.op.style.clipPath = "none"; cover.cancel(); } }, () => {});
    to(el.photo, { opacity: "0.85" }, { m: M.std(900) });
    to(el.motes, { opacity: "1" }, { m: M.std(900) });

    to(el.seed, { transform: "scale(1) rotate(0deg)" }, { m: "sf", delay: 80 });
    SEED_SHAPES.forEach((sh, i) => cue(PICKUPS[i], () => {
      to(el.seedShape, { clipPath: shape(sh) }, { m: "sf" });
      to(el.seedShape, { backgroundColor: SEED_COLORS[i] }, { m: "ef" });
      pulse(el.seed, [{ transform: "scale(1)" }, { transform: "scale(1.18) rotate(20deg)" }, { transform: "scale(1)" }], { duration: 260, easing: "cubic-bezier(0.2,0,0,1)", composite: "add" });
    }));
    // Each property gets one animation at a time, so follow-ups are scheduled.
    el.rays.forEach((r, i) => {
      cue(PICKUPS[2] + i * 20, () => {
        to(r, { opacity: "1" }, { m: "ef" });
        to(r, { transform: `rotate(${i * 45 + 22}deg) translateY(-120px) scaleY(1)` }, { m: "sf" });
      });
      cue(PICKUPS[3] + i * 20, () => {
        to(r, { opacity: "0" }, { m: M.acc(220) });
        to(r, { transform: `rotate(${i * 45 + 30}deg) translateY(-260px) scaleY(0.3)` }, { m: M.acc(260) });
      });
    });
    el.ripples.forEach((r, i) => {
      const ti = PICKUPS[[0, 2, 4][i]];
      cue(ti, () => {
        to(r, { opacity: "0.9" }, { m: "ef" });
        to(r, { transform: "scale(3.2)" }, { m: M.dec(900) });
      });
      cue(ti + 320, () => to(r, { opacity: "0" }, { m: M.std(600) }));
    });
    cue(T.s2 - 300, () => to(el.seed, { transform: "scale(16) rotate(90deg)" }, { m: M.acc(360) }));

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
    // The digits land one per beat.
    T.s2Stops.forEach((ts, i) => cue(ts, () => pulse(bigOdo.wheels[i].col, [
      { transform: "translateY(0px)" }, { transform: "translateY(-16px)" }, { transform: "translateY(0px)" }
    ], { duration: 360, easing: "cubic-bezier(0.2,0,0,1)" })));
    cue(T.s2Word, () => to(el.s2word, { clipPath: "inset(0% 0% 0% 0%)" }, { m: M.dec(800) }));
    cue(T.s2Hit, () => pulse(el.s2in, [{ transform: "scale(1)" }, { transform: "scale(1.03)" }, { transform: "scale(1)" }], { duration: 420, easing: "cubic-bezier(0.2,0,0,1)", composite: "add" }));
    cue(T.s2En, () => {
      to(el.s2en, { transform: "translateY(0px)" }, { m: "sd" });
      to(el.s2en, { opacity: "1" }, { m: "ed" });
      to(el.s2en, { letterSpacing: "0.42em" }, { m: lin(T.s3 - T.s2En + 600) });
    });

    /* S2 -> S3: fly through the "0" into the campus at sunset; the hole is
       half open on the beat */
    cue(T.s3 - T.run, () => {
      act("s23");
      el.campus.style.clipPath = "none";
      to(el.cam, { transform: CAM.s3To }, { m: lin(T.s4Cover - T.s3 + T.run) });
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
    S.far.forEach((n, i) => cue(b(18) + i * STEP, () => to(n, { transform: "translateY(0px)" }, { m: "ss" })));
    S.blds.forEach((n, i) => cue(b(19 + i), () => to(n, { transform: "translateY(0px)" }, { m: "ss" })));
    S.tiers.forEach((n, i) => cue(b(21) + i * STEP, () => {
      to(n, { transform: "translateY(0px) scale(1)" }, { m: "sf" });
      to(n, { opacity: "1" }, { m: "ef" });
    }));
    S.flags.forEach((n, i) => cue(b(23) + i * STEP / 2, () => to(n, { transform: "scaleY(1)" }, { m: "sf" })));
    S.trees.forEach((n, i) => cue(b(23) + i * STEP, () => to(n, { transform: "scale(1)" }, { m: "sf" })));
    cue(b(24), () => S.stone.forEach((n) => {
      to(n, { transform: "translateY(0px)" }, { m: "sd" });
      to(n, { opacity: "1" }, { m: "ed" });
    }));

    // Credits, top left over the sunset sky.
    cueCredits(0, ...CREDIT_BEATS[0], cue);

    /* S3 -> S4: tile wave */
    cue(T.s4, () => tileWipe(() => {
      poseCredits();
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
      // The tower is dark when the doors open: lamps off at once, no fade.
      PAGODA.flat().forEach((w) => { w.style.transition = "none"; w.style.fill = ""; });
      requestAnimationFrame(() => PAGODA.flat().forEach((w) => { w.style.transition = ""; }));
    }));

    /* S5 - pagoda close-up: the lamps light tier by tier, starting with the
       credits; the spire flashes */
    PAGODA.forEach((wins, i) => cue(T.lamps + i * STEP, () => wins.forEach((w, k) => {
      w.style.fill = (i + k) % 3 === 0 ? "#c8f1f2" : "#ffe3a3";
    })));
    // Credits right of the tower.
    cueCredits(1, ...CREDIT_BEATS[1], cue);
    cue(T.glint, () => {
      to(S.glint, { opacity: "1" }, { m: M.std(300) });
      pulse(S.glint, [{ transform: "scale(0.2)" }, { transform: "scale(1.6)" }, { transform: "scale(1)" }], { duration: 600, easing: "cubic-bezier(0.2,0,0,1)" });
    });

    /* S5 -> S6: curtain */
    cue(T.s6, () => curtainWipe(() => {
      poseCredits();
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
    cueCredits(2, ...CREDIT_BEATS[2], cue);
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
    cue(T.wax, () => tweenAttr(SKY.moonCut, "cx", 34, 224, T.warp - T.wax - 20));
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
    // Letters are looked up when they rise, so an on-air title edit shows.
    cue(W + 680, () => {
      titleShown = true;
      titleChars.forEach((c, i) => {
        to(c, { transform: "translateY(0em)" }, { m: "sf", delay: i * 38 });
        to(c, { opacity: "1" }, { m: "ef", delay: i * 38 });
      });
    });
    cue(W + 980, () => {
      to(el.sub, { transform: "translateY(0px)" }, { m: "ss" });
      to(el.sub, { opacity: "1" }, { m: "es" });
    });
    cue(W + 1180, () => {
      to(el.chip, { transform: "scale(1)" }, { m: "sf" });
      to(el.chip, { opacity: "1" }, { m: "ef" });
    });

    // The heaviest hit lands on the finished lockup.
    cue(T.heavy, () => {
      pulse(el.mark, [{ transform: "scale(1)" }, { transform: "scale(1.07)" }, { transform: "scale(1)" }], { duration: 520, easing: "cubic-bezier(0.2,0,0,1)", composite: "add" });
      pulse(el.chip, [{ transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }], { duration: 520, easing: "cubic-bezier(0.2,0,0,1)", composite: "add" });
    });
    // Then it breathes with the closing hits.
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
    // The campus rushes past faster and faster, fastest on the arrival beat.
    to(el.campus, { transform: `translate(${(960 - m.x).toFixed(1)}px, ${(540 - m.y).toFixed(1)}px) scale(2.9)` }, { m: { duration, easing: "cubic-bezier(0.55, 0, 0.3, 1)" } });
    to(el.campus, { opacity: "0" }, { m: M.std(duration * 0.48), delay: duration * 0.33 });

    // Streaks shoot out of the moon and travel with it.
    set(el.warp, { transform: `translate(${(m.x - 960).toFixed(1)}px, ${(m.y - 540).toFixed(1)}px)` });
    to(el.warp, { transform: "translate(0px, 0px)" }, { m: glide });
    STREAKS.forEach((s, i) => {
      for (let rep = 0; rep < 3; rep += 1) {
        at((rep * 330 + ((i * 97) % 260)) * duration / 1470, () => {
          const len = 1 + ((i * 7 + rep * 3) % 5) * 0.25;
          pulse(s.el, [
            { opacity: 0, transform: `rotate(${s.angle}deg) translateY(-${Math.round(r + 30)}px) scaleY(0.2)` },
            { opacity: 0.9, offset: 0.25 },
            { opacity: 0, transform: `rotate(${s.angle}deg) translateY(-1100px) scaleY(${len.toFixed(2)})` }
          ], { duration: duration * 0.49, easing: "cubic-bezier(0.5, 0, 1, 1)" });
        });
      }
    });

    // The dark photo background returns behind it.
    to(el.photo, { opacity: "0.85" }, { m: M.std(900), delay: duration * 0.34 });
  }

  /* Layered reveal: the cover opens a cookie hole from the mark while teal and
     soft-teal rims trail inside it; the mark flies at the camera. */
  let revealing = null;
  function reveal() {
    if (revealing) return revealing;
    clearTimeline();
    // Stopped before the sequence started (still waiting for the music):
    // nothing is on screen yet, so there is nothing to reveal.
    if (!el.op.classList.contains("is-live")) {
      running = false;
      if (bgm && !bgm.paused) fadeMusic(250);
      bus.announce("opener", false);
      return Promise.resolve();
    }
    const tk = token;
    // Stopped before the music's final hit: fade it out with the reveal.
    if (bgm && !bgm.paused && bgm.currentTime * 1000 < T.finalHit - 400) fadeMusic(900);
    bus.announce("opener", false);
    const cx = lockedUp ? 560 : 960;
    const a = M.acc;
    to(el.lockup, { opacity: "0" }, { m: a(520) });
    to(el.lockup, { transform: "translateY(-36px)" }, { m: a(620) });
    to(el.mark, { transform: lockedUp ? "translate(-400px, 0px) scale(1.25)" : "translate(0px, 0px) scale(1.6)" }, { m: a(1000) });
    to(el.mark, { opacity: "0" }, { m: a(700), delay: 260 });
    [el.year, el.caption, el.credits, el.moonDisc, el.sweep, el.sweepSoft, ...el.deco].forEach((n, i) => to(n, { opacity: "0" }, { m: a(260), delay: i * 18 }));
    // The hole starts opening on the hit and takes its time clearing the frame.
    revealing = layeredIris([el.op, el.rimTeal, el.rimSoft], cx, 540, { dur: 1700, ease: M.std().fn }).then(() => {
      revealing = null;
      if (tk !== token) return;           // played again while revealing
      el.op.classList.remove("is-live");
      running = false;
    });
    return revealing;
  }

  poseOff();

  window.CZ.graphic({
    family: "opener",
    defaults: { f0: "2026年秋季学期开学典礼", f1: "2026年9月1日 · 学校体育馆", f2: "reveal", f3: "1", f4: "", f5: "1" },
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
      if (!titleShown) poseTitle();
      logos.forEach((l, i) => l.setMode(raw.f5 || "1", groups[i].shown));
      creditNext = String(raw.f4 || "");
      if (!running && creditNext !== creditText) {
        creditText = creditNext;
        buildCredits(parseCredits(creditText));
        poseCredits();
      }
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
      // Unless it was played again in the meantime, reset for the next take.
      return done.then(() => { if (!running) poseOff(); });
    },
    idle() {
      if (!running) poseOff();
    }
  });
})();
