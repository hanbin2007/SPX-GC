/* Opening title sequence, about 10 s.
   0.0  M3 shape morph burst
   1.1  campus drawn from the reference photos: buildings rise, pagoda stacks
        up, trees pop, stone calligraphy reveals, windows light up, 1907 rolls
        to this year
   4.5  camera dives in, the view closes into the emblem's white disc
   5.2  emblem builds: ring draws, colour fields trace then fill, ring letters
        pop in order, seal, sheen
   7.4  lockup with the calligraphy name, English name, title
   10.1 reveal the programme through an opening cookie (or hold) */
(function () {
  "use strict";

  const { to, set, pulse, swap, snap, shape, shapePx, M, bus } = window.CZ;
  const $ = (id) => document.getElementById(id);
  const SVGNS = "http://www.w3.org/2000/svg";

  const el = {
    op: $("op"),
    seed: $("seed"),
    seedShape: $("seedShape"),
    rays: [...document.querySelectorAll(".op-rays > i")],
    ripples: [...document.querySelectorAll(".op-ripples > i")],
    campus: $("campus"),
    cam: $("cam"),
    stoneWord: $("stoneWord"),
    year: $("year"),
    yearLabel: $("yearLabel"),
    yearDigits: $("yearDigits"),
    yearRange: $("yearRange"),
    deco: [...document.querySelectorAll(".op-deco > i")],
    emblem: $("emblem"),
    lockup: $("lockup"),
    word: $("word"),
    en: $("en"),
    rule: $("rule"),
    title: $("title"),
    sub: $("sub")
  };

  /* ---------------- Build the drawings ---------------- */

  el.cam.insertAdjacentHTML("afterbegin", window.CZ_SCENE);
  const scene = el.cam.querySelector("svg");
  const q = (sel) => [...scene.querySelectorAll(sel)];
  const S = {
    sun: q(".sun"),
    far: q(".far"),
    tiers: q(".tier"),
    blds: q(".bld"),
    flags: q(".flag"),
    trees: q(".tree"),
    stone: q(".stone, .pond"),
    wins: q(".win")
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

  /* ---------------- Timeline helpers ---------------- */

  let timers = [];
  let token = 0;
  let finish = null;
  let running = false;
  let endMode = "reveal";
  let hasTitle = true;
  let lockedUp = false;       // emblem has moved to the lockup position

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

  /* ---------------- Year odometer ---------------- */

  function setYear(text, animate) {
    const slots = [...el.yearDigits.children];
    [...text].forEach((ch, i) => {
      if (animate) swap(slots[i], ch, { m: "sf" });
      else snap(slots[i], ch);
    });
  }

  function rollYears(from, toYear, startMs, stepMs) {
    const steps = [];
    const n = 10;
    for (let i = 1; i <= n; i += 1) steps.push(Math.round(from + ((toYear - from) * i) / n));
    steps.forEach((y, i) => at(startMs + i * stepMs, () => setYear(String(y), true)));
  }

  /* ---------------- Poses ---------------- */

  const SEED_SHAPES = ["cookie12", "clover4", "sunny8", "cookie6", "circle"];
  const SEED_COLORS = ["#30b8bd", "#c8f1f2", "#ffffff", "#57cfd3", "#30b8bd"];

  function poseOff() {
    clearTimeline();
    running = false;
    lockedUp = false;
    el.op.style.clipPath = "polygon(0 0, 0 0, 0 0)";
    set(el.seed, { transform: "scale(0) rotate(-90deg)", opacity: "1" });
    set(el.seedShape, { clipPath: shape("circle"), backgroundColor: "#30b8bd" });
    el.rays.forEach((r, i) => set(r, { transform: `rotate(${i * 45}deg) translateY(0px) scaleY(0.2)`, opacity: "0" }));
    el.ripples.forEach((r) => set(r, { transform: "scale(0.2)", opacity: "0" }));
    set(el.campus, { clipPath: "circle(0px at 960px 540px)", opacity: "1" });
    set(el.cam, { transform: "translateX(0px) scale(1)" });
    S.sun.forEach((n) => set(n, { transform: "translateY(180px) rotate(-30deg)", opacity: "0" }));
    S.far.forEach((n) => set(n, { transform: "translateY(240px)" }));
    S.tiers.forEach((n) => set(n, { transform: "translateY(40px) scale(0.4)", opacity: "0" }));
    S.blds.forEach((n) => set(n, { transform: "translateY(520px)" }));
    S.flags.forEach((n) => set(n, { transform: "scaleY(0)" }));
    S.trees.forEach((n) => set(n, { transform: "scale(0)" }));
    S.stone.forEach((n) => set(n, { transform: "translateY(90px)", opacity: "0" }));
    S.wins.forEach((n) => set(n, { fill: "" }));
    set(el.stoneWord, { clipPath: "inset(0% 100% 0% 0%)" });
    set(el.year, { transform: "translateY(30px)", opacity: "0" });
    setYear("1907", false);
    snap(el.yearLabel, "SINCE");
    set(el.yearRange, { opacity: "0" });
    el.deco.forEach((n) => set(n, { transform: "scale(0.6) rotate(-40deg)", opacity: "0" }));
    set(el.emblem, { transform: "translate(0px, 0px) scale(1)", opacity: "0" });
    set(disc, { opacity: "1" });
    for (const f of [teal, navy]) {
      set(f.fill, { opacity: "0" });
      f.strokes.forEach((s) => set(s, { strokeDashoffset: "1", opacity: "1" }));
    }
    set(ring, { strokeDashoffset: "1" });
    letters.forEach((n) => set(n, { transform: "scale(0.2)", opacity: "0" }));
    seal.forEach((n) => set(n, { transform: "translateY(12px)", opacity: "0" }));
    set(sheen, { transform: "rotate(20deg) translateX(0px)" });
    set(el.word, { clipPath: "inset(0% 100% 0% 0%)" });
    set(el.en, { transform: "translateY(18px)", opacity: "0" });
    set(el.rule, { width: "0px" });
    set(el.title, { transform: "translateY(40px)", opacity: "0" });
    set(el.sub, { transform: "translateY(30px)", opacity: "0" });
  }

  /* ---------------- The sequence ---------------- */

  function play() {
    poseOff();
    running = true;
    const year = new Date().getFullYear();

    // 0.0 - cover grows, seed morphs through M3 shapes
    const cover = el.op.animate([
      { clipPath: shapePx("cookie12", 960, 540, 1, { rot: -60 }) },
      { clipPath: shapePx("cookie12", 960, 540, 1200, { rot: 0 }) }
    ], { duration: 700, easing: M.dec().easing, fill: "forwards" });
    cover.finished.then(() => { if (running) { el.op.style.clipPath = "none"; cover.cancel(); } }, () => {});

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
    at(950, () => to(el.seed, { transform: "scale(16) rotate(90deg)" }, { m: M.acc(360) }));

    // 1.1 - campus iris opens
    at(1100, () => {
      to(el.campus, { clipPath: "circle(1150px at 960px 540px)" }, { m: M.dec(900) });
      to(el.cam, { transform: "translateX(-40px) scale(1.04)" }, { m: lin(3400) });
    });
    at(1600, () => set(el.seed, { opacity: "0" }));
    at(1200, () => S.sun.forEach((n) => {
      to(n, { transform: "translateY(0px) rotate(0deg)" }, { m: "ss" });
      to(n, { opacity: "1" }, { m: "es" });
    }));
    S.far.forEach((n, i) => at(1250 + i * 60, () => to(n, { transform: "translateY(0px)" }, { m: "ss" })));
    S.blds.forEach((n, i) => at(1300 + i * 110, () => to(n, { transform: "translateY(0px)" }, { m: "ss" })));
    S.tiers.forEach((n, i) => at(1450 + i * 55, () => {
      to(n, { transform: "translateY(0px) scale(1)" }, { m: "sf" });
      to(n, { opacity: "1" }, { m: "ef" });
    }));
    S.flags.forEach((n, i) => at(2000 + i * 40, () => to(n, { transform: "scaleY(1)" }, { m: "sf" })));
    S.trees.forEach((n, i) => at(2050 + i * 70, () => to(n, { transform: "scale(1)" }, { m: "sf" })));
    at(2250, () => S.stone.forEach((n) => {
      to(n, { transform: "translateY(0px)" }, { m: "sd" });
      to(n, { opacity: "1" }, { m: "ed" });
    }));
    at(2650, () => to(el.stoneWord, { clipPath: "inset(0% 0% 0% 0%)" }, { m: M.dec(800) }));
    at(2200, () => S.wins.forEach((w, i) => {
      const x = parseFloat(w.getAttribute("x")) || 0;
      to(w, { fill: LIT[i] }, { m: M.std(300), delay: (x / 1920) * 1000 + ((i * 37) % 180) });
    }));

    // Year odometer
    at(2400, () => {
      to(el.year, { transform: "translateY(0px)" }, { m: "sd" });
      to(el.year, { opacity: "1" }, { m: "ed" });
    });
    rollYears(1907, year, 2900, 95);
    at(2900 + 10 * 95 + 80, () => {
      swap(el.yearLabel, `建校 ${year - 1907} 年`);
      el.yearRange.textContent = `1907 — ${year}`;
      to(el.yearRange, { opacity: "1" }, { m: "es" });
    });

    // 4.5 - dive in, close into the emblem disc
    at(4450, () => {
      to(el.year, { opacity: "0" }, { m: M.acc(220) });
      to(el.year, { transform: "translateY(-30px)" }, { m: M.acc(260) });
      to(el.cam, { transform: "translateX(0px) scale(1.35)" }, { m: M.inout(750) });
      to(el.campus, { clipPath: "circle(260px at 960px 540px)" }, { m: M.inout(750) });
    });
    at(4950, () => {
      set(el.emblem, { opacity: "1" });
      set(disc, { opacity: "0" });
      to(disc, { opacity: "1" }, { m: M.std(260) });
      el.deco.forEach((n, i) => {
        to(n, { transform: "scale(1) rotate(0deg)" }, { m: "sg", delay: 120 + i * 70 });
        to(n, { opacity: "1" }, { m: "es", delay: 120 + i * 70 });
      });
    });
    at(5250, () => set(el.campus, { opacity: "0" }));

    // 5.2 - emblem build
    at(5150, () => to(ring, { strokeDashoffset: "0" }, { m: M.dec(900) }));
    [[teal, 5250], [navy, 5500]].forEach(([f, t0]) => {
      f.strokes.forEach((s, i) => at(t0 + i * 50, () => to(s, { strokeDashoffset: "0" }, { m: M.inout(650) })));
      at(t0 + 620, () => {
        to(f.fill, { opacity: "1" }, { m: M.std(380) });
        f.strokes.forEach((s) => to(s, { opacity: "0" }, { m: M.std(380), delay: 200 }));
      });
    });
    letters.forEach((n, i) => at(5950 + i * 13, () => {
      to(n, { transform: "scale(1)" }, { m: "sf" });
      to(n, { opacity: "1" }, { m: "ef" });
    }));
    seal.forEach((n, i) => at(6550 + i * 30, () => {
      to(n, { transform: "translateY(0px)" }, { m: "sd" });
      to(n, { opacity: "1" }, { m: "ed" });
    }));
    at(6850, () => {
      to(sheen, { transform: "rotate(20deg) translateX(900px)" }, { m: M.inout(800) });
      pulse(el.emblem, [{ transform: "scale(1)" }, { transform: "scale(1.05)" }, { transform: "scale(1)" }], { duration: 600, easing: "cubic-bezier(0.2,0,0,1)", composite: "add" });
      el.ripples.forEach((r, i) => {
        set(r, { transform: "scale(1.7)", opacity: "0" });
        at(i * 150, () => {
          to(r, { opacity: "0.8" }, { m: "ef" });
          to(r, { transform: "scale(3.6)" }, { m: M.dec(1000) });
        });
        at(300 + i * 150, () => to(r, { opacity: "0" }, { m: M.std(700) }));
      });
    });

    // 7.4 - lockup
    at(7400, () => {
      lockedUp = true;
      to(el.emblem, { transform: "translate(-400px, 0px) scale(0.72)" }, { m: "ss" });
    });
    at(7600, () => to(el.word, { clipPath: "inset(0% 0% 0% 0%)" }, { m: M.dec(900) }));
    at(7900, () => {
      to(el.en, { transform: "translateY(0px)" }, { m: "sd" });
      to(el.en, { opacity: "1" }, { m: "ed" });
    });
    if (hasTitle) {
      at(8050, () => to(el.rule, { width: "420px" }, { m: "sd" }));
      at(8200, () => {
        to(el.title, { transform: "translateY(0px)" }, { m: "ss" });
        to(el.title, { opacity: "1" }, { m: "es" });
      });
      at(8350, () => {
        to(el.sub, { transform: "translateY(0px)" }, { m: "ss" });
        to(el.sub, { opacity: "1" }, { m: "es" });
      });
    }

    return new Promise((resolve) => {
      finish = resolve;
      if (endMode === "reveal") at(10100, () => reveal().then(resolve));
      else at(9700, resolve);
    });
  }

  /* Opening cookie hole from the emblem: shows the programme underneath. */
  let revealing = null;
  function reveal() {
    if (revealing) return revealing;
    clearTimeline();
    bus.announce("opener", false);
    const cx = lockedUp ? 560 : 960;
    const a = M.acc;
    [el.lockup, el.emblem, el.year, ...el.deco].forEach((n, i) => to(n, { opacity: "0" }, { m: a(260), delay: i * 20 }));
    const ease = M.inout().fn;
    revealing = new Promise((resolve) => {
      const t0 = performance.now();
      const dur = 760;
      function frame(now) {
        const p = Math.min(1, (now - t0 - 120) / dur);
        if (p > 0) el.op.style.clipPath = shapePx("cookie12", cx, 540, 1400 * ease(p), { rot: 40 * p, hole: true });
        if (p < 1) requestAnimationFrame(frame);
        else {
          el.op.style.clipPath = "polygon(0 0, 0 0, 0 0)";
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

  // Four digit slots for the odometer
  el.yearDigits.textContent = "";
  for (let i = 0; i < 4; i += 1) {
    const s = document.createElement("span");
    s.className = "cz-slot";
    el.yearDigits.appendChild(s);
  }
  setYear("1907", false);

  window.CZ.graphic({
    family: "opener",
    defaults: { f0: "2026年秋季学期开学典礼", f1: "2026年9月1日 · 学校体育馆", f2: "reveal" },
    preload: ["./img/wordmark-cn.png"],
    render(raw) {
      endMode = raw.f2 === "hold" ? "hold" : "reveal";
      hasTitle = !!(raw.f0 || raw.f1);
      el.lockup.classList.toggle("no-title", !hasTitle);
      window.CZ.fit(snap(el.title, raw.f0 || ""), 1000, 60, 40);
      el.title.style.display = raw.f0 ? "" : "none";
      window.CZ.fit(snap(el.sub, raw.f1 || ""), 1000, 32, 24);
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
