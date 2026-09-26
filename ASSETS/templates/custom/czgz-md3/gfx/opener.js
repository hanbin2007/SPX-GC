/* Opening title sequence, about 20 s. Nothing on screen is ever at rest:
   every element runs either a scripted move or an idle loop.
   0.0  M3 shape morph burst over the monochrome campus photo
   1.0  campus opens through a rotating cookie iris with a soft-teal rim, at
        sunset: buildings rise, pagoda stacks up, trees pop and sway, flags
        wave, clouds drift, windows light up left to right as night falls
   3.6  time-lapse: two full days and nights while the odometer rolls 1907
        to this year, settling on night with "建校 N 年"
   9.7  match-cut: the crescent waxes full, the camera warps into the moon
        and the moon flies to the centre to become the emblem's disc
   11.8 shockwave, decoration flies in; emblem builds: ring draws, colour
        fields trace then fill, ring letters pop in order, seal, sheen;
        orbit ring draws around it
   14.1 lockup: the mark slides left, two bands sweep across and retract to
        reveal the calligraphy name, English name, wavy rule, title (letter
        by letter), subtitle and anniversary chip
   18.4 layered reveal: the mark flies at the camera while a cookie hole with
        teal and soft-teal rims opens onto the programme (or hold, still
        alive) */
(function () {
  "use strict";

  const { to, set, pulse, swap, snap, shape, shapePx, M, bus } = window.CZ;
  const $ = (id) => document.getElementById(id);
  const SVGNS = "http://www.w3.org/2000/svg";

  const el = {
    op: $("op"),
    rimSoft: $("rimSoft"),
    rimTeal: $("rimTeal"),
    bg: $("bg"),
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
    year: $("year"),
    yearLabel: $("yearLabel"),
    yearDigits: $("yearDigits"),
    yearRange: $("yearRange"),
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
    wins: q(".win")
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

  // Motes: small M3 shapes rising through the background, always moving.
  (function () {
    let seed = 20260901;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const kinds = ["circle", "spark4", "clover4", "cookie12", "sunny8", "circle"];
    const colors = ["#c8f1f2", "#30b8bd", "#ffffff", "#57cfd3"];
    for (let i = 0; i < 26; i += 1) {
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
      el.motes.appendChild(m);
    }
  })();

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
  // Which layers are on screen: intro, open (iris), campus, warp, mark.
  const act = (name) => { el.op.dataset.act = name; };
  const HIDDEN = "polygon(0 0, 0 0, 0 0)";

  /* ---------------- Campus clock ---------------- */

  // Campus cues (ms from play). The orbit drifts through sunset, speeds up
  // into a time-lapse of two full days, then brakes onto night.
  const T = {
    open: 1100, firstLight: 2500, yearIn: 3300,
    lapse: 3600, cruise: 4600, brake: 8400, stop: 9600,
    roll0: 3800, roll1: 9400, label: 9550, wax: 9700, yearOut: 10150,
    warp: 10400, arrive: 11750, lockup: 14100, sweep: 14250,
    hold: 18000, end: 18400
  };
  const ORBIT = { a0: 70, a1: 150, a2: 900 };   // sun angle from the zenith, clockwise
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

  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };

  // Each window switches on once it is dark enough; its threshold grows
  // left to right, so lights come on left to right at dusk and go off
  // right to left at dawn. The first night also waits for the buildings.
  const WIN = S.wins.map((w, i) => {
    const x = (parseFloat(w.getAttribute("x")) || 0) / 1920;
    const jitter = ((i * 37) % 100) / 100;
    return { th: 0.3 + 0.45 * x + 0.15 * jitter, gate: T.firstLight + x * 1100 + jitter * 250, lit: false };
  });

  function applySky(angle, t, wax = 0) {
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
    // Before the match-cut the crescent waxes into a full moon.
    SKY.moonCut.setAttribute("cx", (34 + 190 * wax).toFixed(1));
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

  /* ---------------- Year odometer ---------------- */

  const CELL = 176;
  const odo = [];            // strips, thousands first
  // Vertical-only blur per wheel, scaled by how fast it spins.
  const blurSvg = document.createElementNS(SVGNS, "svg");
  blurSvg.setAttribute("width", "0");
  blurSvg.setAttribute("height", "0");
  blurSvg.style.position = "absolute";
  document.body.appendChild(blurSvg);
  el.yearDigits.textContent = "";
  for (let k = 0; k < 4; k += 1) {
    const col = document.createElement("span");
    col.className = "op-odo";
    const strip = document.createElement("span");
    strip.innerHTML = "0123456789".split("").concat("0").map((d) => `<b>${d}</b>`).join("");
    col.appendChild(strip);
    el.yearDigits.appendChild(col);
    const filter = node("filter", { id: `opOdoBlur${k}`, x: "-5%", y: "-5%", width: "110%", height: "110%" }, blurSvg);
    const blur = node("feGaussianBlur", { stdDeviation: "0 0" }, filter);
    odo.push({ strip, blur, id: filter.id, pos: 0, blurred: false });
  }

  // Mechanical odometer: the units wheel turns continuously, every other
  // wheel only moves while all the wheels below it roll over from 9 to 0.
  function setYearValue(v, dt) {
    for (let k = 0; k < 4; k += 1) {
      const unit = Math.pow(10, k);
      const below = v % unit;
      const carry = k === 0 ? v % 10 - Math.floor(v % 10) : clamp01(below - (unit - 1));
      const pos = (Math.floor(v / unit) % 10) + carry;
      const wheel = odo[3 - k];
      wheel.strip.style.transform = `translateY(${(-pos * CELL).toFixed(2)}px)`;
      if (dt) {
        let moved = pos - wheel.pos;
        if (moved < -5) moved += 10;
        const sd = Math.min(12, (Math.abs(moved) * CELL * 0.3 * 16.7) / dt);
        if (sd > 0.4) {
          wheel.blur.setAttribute("stdDeviation", `0 ${sd.toFixed(2)}`);
          if (!wheel.blurred) wheel.strip.style.filter = `url(#${wheel.id})`;
          wheel.blurred = true;
        } else if (wheel.blurred) {
          wheel.strip.style.filter = "";
          wheel.blurred = false;
        }
      } else if (wheel.blurred) {
        wheel.strip.style.filter = "";
        wheel.blurred = false;
      }
      wheel.pos = pos;
    }
  }

  // Trapezoid velocity (linear ramps), so the wheels speed up and brake.
  function rollProgress(x, a = 0.15, b = 0.35) {
    x = clamp01(x);
    const area = 1 - a / 2 - b / 2;
    if (x < a) return (x * x) / (2 * a) / area;
    if (x <= 1 - b) return (a / 2 + (x - a)) / area;
    return (area - ((1 - x) * (1 - x)) / (2 * b)) / area;
  }

  // One frame clock for everything continuous in the campus part.
  function runClock(year) {
    const tk = token;
    const t0 = performance.now();
    let last = t0;
    function frame(now) {
      if (tk !== token) return;
      const t = now - t0;
      const dt = Math.max(1, now - last);
      last = now;
      applySky(orbitAngle(t), t, smooth(T.wax, T.wax + 650, t));
      if (t >= T.roll0) setYearValue(1907 + (year - 1907) * rollProgress((t - T.roll0) / (T.roll1 - T.roll0)), dt);
      if (t < T.warp + 200) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
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
    lockedUp = false;
    el.op.classList.remove("is-live");
    act("intro");
    el.op.style.clipPath = HIDDEN;
    el.rimSoft.style.clipPath = HIDDEN;
    el.rimTeal.style.clipPath = HIDDEN;
    set(el.photo, { opacity: "0" });
    set(el.motes, { opacity: "0" });
    set(el.seed, { transform: "scale(0) rotate(-90deg)", opacity: "1" });
    set(el.seedShape, { clipPath: shape("circle"), backgroundColor: "#30b8bd" });
    el.rays.forEach((r, i) => set(r, { transform: `rotate(${i * 45}deg) translateY(0px) scaleY(0.2)`, opacity: "0" }));
    el.ripples.forEach((r) => set(r, { transform: "scale(0.2)", opacity: "0" }));
    set(el.iris, { clipPath: HIDDEN });
    set(el.campus, { clipPath: HIDDEN, transform: "translate(0px, 0px) scale(1)", opacity: "1" });
    el.campus.style.transformOrigin = "";
    set(el.cam, { transform: "translateX(0px) scale(1)" });
    S.sun.forEach((n) => set(n, { transform: "scale(0.3) rotate(-45deg)", opacity: "0" }));
    S.far.forEach((n) => set(n, { transform: "translateY(240px)" }));
    S.tiers.forEach((n) => set(n, { transform: "translateY(40px) scale(0.4)", opacity: "0" }));
    S.blds.forEach((n) => set(n, { transform: "translateY(520px)" }));
    S.flags.forEach((n) => set(n, { transform: "scaleY(0)" }));
    S.trees.forEach((n) => set(n, { transform: "scale(0)" }));
    S.stone.forEach((n) => set(n, { transform: "translateY(90px)", opacity: "0" }));
    WIN.forEach((w) => { w.lit = false; });
    S.wins.forEach((n) => { n.style.fill = ""; });
    SKY.moonPos.setAttribute("opacity", "1");
    applySky(ORBIT.a0, 0, 0);
    set(el.stoneWord, { clipPath: "inset(0% 100% 0% 0%)" });
    set(el.year, { transform: "translateY(30px)", opacity: "0" });
    setYearValue(1907);
    snap(el.yearLabel, "SINCE");
    set(el.yearRange, { opacity: "0" });
    set(el.warp, { transform: "translate(0px, 0px)" });
    STREAKS.forEach((s) => set(s.el, { opacity: "0" }));
    set(el.moonDisc, { transform: "translate(0px, 0px) scale(1)", opacity: "0", backgroundColor: "#eef6ff" });
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

  // Expanding cookie (optionally a hole) as keyframes; the lobes slide as it grows.
  function cookieFrames(r0, r1, rot, opts = {}) {
    return Array.from({ length: 9 }, (_, i) => {
      const p = i / 8;
      return { clipPath: shapePx("cookie12", opts.cx || 960, opts.cy || 540, Math.max(0.5, r0 + (r1 - r0) * p), { rot: rot * p, hole: opts.hole }) };
    });
  }

  /* ---------------- The sequence ---------------- */

  function play() {
    poseOff();
    running = true;
    el.op.classList.add("is-live");
    const year = new Date().getFullYear();

    // 0.0 - cover grows over the monochrome campus photo; the seed morphs
    const cover = el.op.animate([
      { clipPath: shapePx("cookie12", 960, 540, 1, { rot: -60 }) },
      { clipPath: shapePx("cookie12", 960, 540, 1200, { rot: 0 }) }
    ], { duration: 700, easing: M.dec().easing, fill: "forwards" });
    cover.finished.then(() => { if (running) { el.op.style.clipPath = "none"; cover.cancel(); } }, () => {});
    to(el.photo, { opacity: "0.3" }, { m: M.std(900) });
    to(el.motes, { opacity: "1" }, { m: M.std(900) });

    to(el.seed, { transform: "scale(1) rotate(0deg)" }, { m: "sf", delay: 80 });
    SEED_SHAPES.forEach((s, i) => at(260 + i * 150, () => {
      to(el.seedShape, { clipPath: shape(s) }, { m: "sf" });
      to(el.seedShape, { backgroundColor: SEED_COLORS[i] }, { m: "ef" });
      pulse(el.seed, [{ transform: "scale(1)" }, { transform: "scale(1.18) rotate(20deg)" }, { transform: "scale(1)" }], { duration: 260, easing: "cubic-bezier(0.2,0,0,1)", composite: "add" });
    }));
    // Each property gets one animation at a time, so follow-ups are scheduled.
    el.rays.forEach((r, i) => {
      at(380 + i * 20, () => {
        to(r, { opacity: "1" }, { m: "ef" });
        to(r, { transform: `rotate(${i * 45 + 22}deg) translateY(-120px) scaleY(1)` }, { m: "sf" });
      });
      at(760 + i * 20, () => {
        to(r, { opacity: "0" }, { m: M.acc(220) });
        to(r, { transform: `rotate(${i * 45 + 30}deg) translateY(-260px) scaleY(0.3)` }, { m: M.acc(260) });
      });
    });
    el.ripples.forEach((r, i) => {
      at(300 + i * 160, () => {
        to(r, { opacity: "0.9" }, { m: "ef" });
        to(r, { transform: "scale(3.2)" }, { m: M.dec(900) });
      });
      at(620 + i * 160, () => to(r, { opacity: "0" }, { m: M.std(600) }));
    });
    at(900, () => to(el.seed, { transform: "scale(16) rotate(90deg)" }, { m: M.acc(360) }));

    // 1.0 - rotating cookie iris with a soft-teal rim running just ahead
    const irisTiming = { duration: 1150, easing: M.dec().easing, fill: "forwards" };
    at(T.open - 150, () => act("open"));
    at(T.open - 110, () => el.iris.animate(cookieFrames(0, 1260, 70), irisTiming));
    at(T.open, () => {
      const a = el.campus.animate(cookieFrames(0, 1260, 70), irisTiming);
      a.finished.then(() => {
        if (!running) return;
        el.campus.style.clipPath = "none";
        a.cancel();
        el.iris.getAnimations().forEach((x) => x.cancel());
        el.iris.style.clipPath = HIDDEN;
        set(el.seed, { opacity: "0" });
        act("campus");
      }, () => {});
      to(el.cam, { transform: "translateX(-90px) scale(1.08)" }, { m: lin(T.warp - T.open) });
    });

    // Campus: the clock drives sky, sun, moon, window lights and the odometer.
    runClock(year);
    at(1250, () => S.sun.forEach((n) => {
      to(n, { transform: "scale(1) rotate(0deg)" }, { m: "ss" });
      to(n, { opacity: "1" }, { m: "es" });
    }));
    S.far.forEach((n, i) => at(1300 + i * 120, () => to(n, { transform: "translateY(0px)" }, { m: "ss" })));
    S.blds.forEach((n, i) => at(1500 + i * 220, () => to(n, { transform: "translateY(0px)" }, { m: "ss" })));
    S.tiers.forEach((n, i) => at(1800 + i * 110, () => {
      to(n, { transform: "translateY(0px) scale(1)" }, { m: "sf" });
      to(n, { opacity: "1" }, { m: "ef" });
    }));
    S.flags.forEach((n, i) => at(2900 + i * 80, () => to(n, { transform: "scaleY(1)" }, { m: "sf" })));
    S.trees.forEach((n, i) => at(3000 + i * 140, () => to(n, { transform: "scale(1)" }, { m: "sf" })));
    at(3400, () => S.stone.forEach((n) => {
      to(n, { transform: "translateY(0px)" }, { m: "sd" });
      to(n, { opacity: "1" }, { m: "ed" });
    }));
    at(4200, () => to(el.stoneWord, { clipPath: "inset(0% 0% 0% 0%)" }, { m: M.dec(1200) }));

    // Year odometer rolls through the time-lapse
    at(T.yearIn, () => {
      to(el.year, { transform: "translateY(0px)" }, { m: "sd" });
      to(el.year, { opacity: "1" }, { m: "ed" });
    });
    at(T.label, () => {
      swap(el.yearLabel, `建校 ${year - 1907} 年`);
      el.yearRange.textContent = `1907 — ${year}`;
      to(el.yearRange, { opacity: "1" }, { m: "es" });
      pulse(el.yearDigits, [{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }], { duration: 420, easing: "cubic-bezier(0.2,0,0,1)", composite: "add" });
    });
    at(T.yearOut, () => {
      to(el.year, { opacity: "0" }, { m: M.acc(300) });
      to(el.year, { transform: "translateY(-40px)" }, { m: M.acc(360) });
    });

    // 10.4 - match-cut: warp into the full moon, the moon becomes the emblem disc
    at(T.warp, () => { act("warp"); warp(); });

    // 11.75 - arrival: shockwave, decoration flies in, emblem builds
    at(T.arrive, () => {
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
    at(B, () => to(ring, { strokeDashoffset: "0" }, { m: M.dec(900) }));
    [[teal, B + 100], [navy, B + 350]].forEach(([f, t0]) => {
      f.strokes.forEach((s, i) => at(t0 + i * 50, () => to(s, { strokeDashoffset: "0" }, { m: M.inout(650) })));
      at(t0 + 620, () => {
        to(f.fill, { opacity: "1" }, { m: M.std(380) });
        f.strokes.forEach((s) => to(s, { opacity: "0" }, { m: M.std(380), delay: 200 }));
      });
    });
    letters.forEach((n, i) => at(B + 800 + i * 13, () => {
      to(n, { transform: "scale(1)" }, { m: "sf" });
      to(n, { opacity: "1" }, { m: "ef" });
    }));
    seal.forEach((n, i) => at(B + 1400 + i * 30, () => {
      to(n, { transform: "translateY(0px)" }, { m: "sd" });
      to(n, { opacity: "1" }, { m: "ed" });
    }));
    at(B + 1700, () => {
      sheenLoop();
      pulse(el.emblem, [{ transform: "scale(1)" }, { transform: "scale(1.05)" }, { transform: "scale(1)" }], { duration: 600, easing: "cubic-bezier(0.2,0,0,1)", composite: "add" });
    });

    // 14.1 - lockup: the mark slides left, bands sweep across and retract
    at(T.lockup, () => {
      lockedUp = true;
      to(el.mark, { transform: "translate(-400px, 0px) scale(0.72)" }, { m: "ss" });
    });
    const W = T.sweep;
    at(W - 80, () => to(el.sweepSoft, { clipPath: SWEEP_FULL }, { m: M.dec(560) }));
    at(W, () => to(el.sweep, { clipPath: SWEEP_FULL }, { m: M.dec(520) }));
    at(W + 480, () => to(el.sweep, { clipPath: SWEEP_OUT }, { m: M.inout(640) }));
    at(W + 590, () => to(el.sweepSoft, { clipPath: SWEEP_OUT }, { m: M.inout(660) }));
    // Text moves into place under the bands and is uncovered as they retract.
    at(W + 520, () => to(el.word, { clipPath: "inset(0% 0% 0% 0%)" }, { m: M.dec(900) }));
    at(W + 600, () => {
      to(el.en, { transform: "translateY(0px)" }, { m: "sd" });
      to(el.en, { opacity: "1" }, { m: "ed" });
    });
    at(W + 700, () => to(el.rule, { width: "480px" }, { m: M.dec(900) }));
    titleChars.forEach((c, i) => at(W + 680 + i * 38, () => {
      to(c, { transform: "translateY(0em)" }, { m: "sf" });
      to(c, { opacity: "1" }, { m: "ef" });
    }));
    at(W + 980, () => {
      to(el.sub, { transform: "translateY(0px)" }, { m: "ss" });
      to(el.sub, { opacity: "1" }, { m: "es" });
    });
    at(W + 1180, () => {
      to(el.chip, { transform: "scale(1)" }, { m: "sf" });
      to(el.chip, { opacity: "1" }, { m: "ef" });
    });

    return new Promise((resolve) => {
      finish = resolve;
      if (endMode === "reveal") at(T.end, () => reveal().then(resolve));
      else at(T.hold, resolve);
    });
  }

  function sheenLoop() {
    set(sheen, { transform: "rotate(20deg) translateX(0px)" });
    to(sheen, { transform: "rotate(20deg) translateX(900px)" }, { m: M.inout(900) });
    at(4200, sheenLoop);
  }

  /* Match-cut: the moon (full by now) becomes the emblem's white disc. The
     campus rushes past towards the camera, centred on the moon. */
  function warp() {
    const box = el.op.getBoundingClientRect();
    const k = box.width / 1920 || 1;
    const mb = SKY.moon.getBoundingClientRect();
    const mx = (mb.left + mb.width / 2 - box.left) / k;
    const my = (mb.top + mb.height / 2 - box.top) / k;
    const r = mb.width / 2 / k || 86;
    const glide = { duration: 1350, easing: "cubic-bezier(0.65, 0, 0.25, 1)" };

    SKY.moonPos.setAttribute("opacity", "0");
    set(el.moonDisc, { transform: `translate(${(mx - 960).toFixed(1)}px, ${(my - 540).toFixed(1)}px) scale(${(r / 260).toFixed(4)})`, opacity: "1" });
    to(el.moonDisc, { transform: "translate(0px, 0px) scale(1)" }, { m: glide });
    to(el.moonDisc, { backgroundColor: "#ffffff" }, { m: M.std(900) });

    el.campus.style.transformOrigin = `${mx.toFixed(1)}px ${my.toFixed(1)}px`;
    to(el.campus, { transform: `translate(${(960 - mx).toFixed(1)}px, ${(540 - my).toFixed(1)}px) scale(2.9)` }, { m: { duration: 1350, easing: "cubic-bezier(0.55, 0, 0.3, 1)" } });
    to(el.campus, { opacity: "0" }, { m: M.std(700), delay: 480 });

    // Streaks shoot out of the moon and travel with it.
    set(el.warp, { transform: `translate(${(mx - 960).toFixed(1)}px, ${(my - 540).toFixed(1)}px)` });
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

    // The background returns behind it.
    to(el.photo, { opacity: "0.34" }, { m: M.std(900), delay: 500 });
  }

  /* Layered reveal: the cover opens a cookie hole from the mark while teal and
     soft-teal rims trail inside it; the mark flies at the camera. */
  let revealing = null;
  function reveal() {
    if (revealing) return revealing;
    clearTimeline();
    bus.announce("opener", false);
    const cx = lockedUp ? 560 : 960;
    const a = M.acc;
    to(el.lockup, { opacity: "0" }, { m: a(300) });
    to(el.lockup, { transform: "translateY(-36px)" }, { m: a(380) });
    to(el.mark, { transform: lockedUp ? "translate(-400px, 0px) scale(1.25)" : "translate(0px, 0px) scale(1.6)" }, { m: a(620) });
    to(el.mark, { opacity: "0" }, { m: a(420), delay: 160 });
    [el.year, el.moonDisc, el.sweep, el.sweepSoft, ...el.deco].forEach((n, i) => to(n, { opacity: "0" }, { m: a(260), delay: i * 18 }));
    const ease = M.inout().fn;
    const LAGS = [0, 0.07, 0.13];
    const layers = [el.op, el.rimTeal, el.rimSoft];
    revealing = new Promise((resolve) => {
      const t0 = performance.now();
      const dur = 1050;
      function frame(now) {
        const p = (now - t0 - 100) / dur;
        layers.forEach((layer, i) => {
          const q = Math.min(1, Math.max(0, (p - LAGS[i]) / (1 - LAGS[2])));
          if (i > 0 && p <= LAGS[i] - 0.001 && p > 0) {
            layer.style.clipPath = "none";      // rim fills the frame under the cover until its own hole starts
            return;
          }
          if (q > 0) layer.style.clipPath = shapePx("cookie12", cx, 540, 1750 * ease(q), { rot: 50 * q, hole: true });
        });
        if (p < 1) requestAnimationFrame(frame);
        else {
          layers.forEach((layer) => { layer.style.clipPath = HIDDEN; });
          el.op.classList.remove("is-live");
                running = false;
          revealing = null;
          resolve();
        }
      }
      requestAnimationFrame(frame);
    });
    return revealing;
  }

  poseOff();

  window.CZ.graphic({
    family: "opener",
    defaults: { f0: "2026年秋季学期开学典礼", f1: "2026年9月1日 · 学校体育馆", f2: "reveal" },
    preload: ["./img/wordmark-cn.png", "./img/photo-campus-a.webp", "./img/photo-campus-b.webp"],
    render(raw) {
      endMode = raw.f2 === "hold" ? "hold" : "reveal";
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
