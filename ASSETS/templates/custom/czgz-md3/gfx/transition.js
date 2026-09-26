/* Stinger transition (SPX out: "none"). Fully covered from ~0.7 s; the bus
   broadcasts {type:"cover"} at that moment, which is the safe point to cut
   cameras in the vision mixer. */
(function () {
  "use strict";

  const { to, set, pulse, shapePx, M, bus } = window.CZ;
  const $ = (id) => document.getElementById(id);
  const el = {
    st: document.querySelector(".st"),
    teal: $("teal"),
    navy: $("navy"),
    badge: $("badgeShape"),
    emblem: $("badgeEmblem"),
    word: $("word"),
    bg: $("bg"),
    photo: $("photo"),
    halo: $("halo"),
    burst: $("burst"),
    orbit: $("orbit"),
    motes: $("motes"),
    streaks: $("streaks"),
    deco: [...document.querySelectorAll(".st-deco > i")]
  };

  /* ---- Background pieces shared with the opener ---- */

  // Motes: small M3 shapes rising, quicker than in the opener so they read
  // within a two-second stinger.
  (function () {
    let seed = 20260926;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const kinds = ["circle", "spark4", "clover4", "cookie12", "sunny8", "circle"];
    const colors = ["#c8f1f2", "#30b8bd", "#ffffff", "#57cfd3"];
    for (let i = 0; i < 22; i += 1) {
      const m = document.createElement("i");
      const size = 8 + rnd() * 18;
      m.style.left = `${(rnd() * 1920).toFixed(0)}px`;
      m.style.top = `${(300 + rnd() * 860).toFixed(0)}px`;
      m.style.width = m.style.height = `${size.toFixed(1)}px`;
      m.style.background = colors[i % colors.length];
      m.style.clipPath = `var(--shape-${kinds[i % kinds.length]})`;
      m.style.setProperty("--o", (0.2 + rnd() * 0.45).toFixed(2));
      m.style.animationDuration = `${(3 + rnd() * 3).toFixed(1)}s`;
      m.style.animationDelay = `${(-rnd() * 6).toFixed(1)}s`;
      el.motes.appendChild(m);
    }
  })();

  // Speed streaks shot out from the centre as the frame closes.
  const STREAKS = Array.from({ length: 24 }, (_, i) => {
    const n = document.createElement("i");
    el.streaks.appendChild(n);
    return { el: n, angle: i * 15 + ((i * 53) % 9) };
  });

  // Decoration flies in from outside and out again when the frame opens.
  const DECO = el.deco.map((n) => {
    const dx = n.offsetLeft + n.offsetWidth / 2 - 960;
    const dy = n.offsetTop + n.offsetHeight / 2 - 540;
    return {
      from: `translate(${(dx * 0.6).toFixed(0)}px, ${(dy * 0.6).toFixed(0)}px) scale(0.3) rotate(-140deg)`,
      out: `translate(${(dx * 0.45).toFixed(0)}px, ${(dy * 0.45).toFixed(0)}px) scale(1.35) rotate(60deg)`
    };
  });
  let bgAnim = null;
  let bgTimer = 0;

  const CX = 960;
  const CY = 540;
  const R = 1260;           // cookie inner radius clears the frame corners
  const HOLDS = { short: 150, normal: 380, long: 900 };

  const coverEase = M.dec().fn;
  const openEase = M.inout().fn;

  let hold = HOLDS.normal;
  let showWord = true;
  let raf = 0;
  let start = 0;
  let revealAt = Infinity;  // ms from start
  let covered = false;
  let finish = null;

  const clamp = (v) => Math.min(1, Math.max(0, v));

  function coverClip(p, rot) {
    if (p <= 0) return "polygon(0 0, 0 0, 0 0)";
    if (p >= 1) return "none";
    return shapePx("cookie12", CX, CY, R * p, { rot });
  }

  function holeClip(p, rot) {
    if (p <= 0) return "none";
    if (p >= 1) return "polygon(0 0, 0 0, 0 0)";
    return shapePx("cookie12", CX, CY, R * p, { rot, hole: true });
  }

  /* Teal (below) leads the cover, navy (on top) leads the opening, so a teal
     rim trails the edge both ways. */
  function layerClip(t, coverLag, openLag) {
    const tc = t - coverLag;
    if (tc < 0) return coverClip(0, 0);
    const reveal = t - (revealAt + 220 + openLag);
    if (reveal < 0) {
      const p = coverEase(clamp(tc / 640));
      return coverClip(p, -50 * (1 - p));
    }
    const q = openEase(clamp(reveal / 660));
    return holeClip(q, 40 * q);
  }

  function frame(now) {
    const t = now - start;
    el.teal.style.clipPath = layerClip(t, 0, 110);
    el.navy.style.clipPath = layerClip(t, 90, 0);
    if (!covered && t >= 730) {
      covered = true;
      bus.post({ type: "cover" });
      if (revealAt === Infinity) beginReveal(Math.max(730 + hold, t));
    }
    if (t > revealAt + 220 + 110 + 660) {
      el.teal.style.clipPath = coverClip(0, 0);
      el.navy.style.clipPath = coverClip(0, 0);
      raf = 0;
      if (finish) finish();
      finish = null;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function beginReveal(at) {
    revealAt = at;
    const delay = Math.max(0, at - (performance.now() - start));
    const a = M.acc;
    // The background keeps drifting through the hold, then rushes at the
    // camera as the hole opens.
    clearTimeout(bgTimer);
    bgTimer = setTimeout(() => {
      if (!raf) return;
      const current = getComputedStyle(el.bg).transform;
      if (bgAnim) bgAnim.cancel();
      bgAnim = null;
      to(el.bg, { transform: "scale(1.3)" }, { m: a(900), from: { transform: current } });
    }, delay);
    el.deco.forEach((n, i) => to(n, { transform: DECO[i].out }, { m: a(700), delay: delay + i * 15 }));
    to(el.word, { opacity: "0" }, { m: a(160), delay });
    to(el.word, { transform: "translateY(-14px)" }, { m: a(200), delay });
    to(el.emblem, { opacity: "0" }, { m: a(160), delay });
    to(el.badge, { transform: "scale(0.2) rotate(90deg)" }, { m: a(260), delay });
    to(el.badge, { opacity: "0" }, { m: a(160), delay: delay + 100 });
  }

  function poseOff() {
    cancelAnimationFrame(raf);
    raf = 0;
    el.st.classList.remove("is-live");
    clearTimeout(bgTimer);
    if (bgAnim) bgAnim.cancel();
    bgAnim = null;
    set(el.bg, { transform: "scale(1.15)" });
    set(el.photo, { transform: "translateX(90px) scale(1.12)", opacity: "0" });
    set(el.halo, { transform: "scale(0.6) rotate(-50deg)" });
    set(el.burst, { opacity: "0" });
    set(el.orbit, { transform: "scale(0.6) rotate(-90deg)", opacity: "0" });
    el.deco.forEach((n, i) => set(n, { transform: DECO[i].from, opacity: "0" }));
    STREAKS.forEach((k) => set(k.el, { opacity: "0" }));
    el.teal.style.clipPath = coverClip(0, 0);
    el.navy.style.clipPath = coverClip(0, 0);
    set(el.badge, { transform: "scale(0.2) rotate(-120deg)", opacity: "0" });
    set(el.emblem, { transform: "scale(0.4)", opacity: "0" });
    set(el.word, { transform: "translateY(18px)", opacity: "0" });
  }

  function enter() {
    poseOff();
    covered = false;
    revealAt = Infinity;
    start = performance.now();
    raf = requestAnimationFrame(frame);
    el.st.classList.add("is-live");
    // Background: the camera pulls back while the frame closes, then keeps
    // drifting until the reveal takes over.
    bgAnim = el.bg.animate([
      { transform: "scale(1.15)", easing: M.dec().easing },
      { transform: "scale(1)", offset: 0.35 },
      { transform: "scale(0.95)" }
    ], { duration: 3000, fill: "forwards" });
    to(el.photo, { opacity: "0.85" }, { m: M.std(500), delay: 120 });
    to(el.photo, { transform: "translateX(-70px) scale(1.03)" }, { m: { duration: 2600, easing: "linear" } });
    to(el.halo, { transform: "scale(1) rotate(0deg)" }, { m: "ss", delay: 120 });
    to(el.burst, { opacity: "1" }, { m: M.std(600), delay: 250 });
    to(el.orbit, { transform: "scale(1) rotate(0deg)" }, { m: "ss", delay: 260 });
    to(el.orbit, { opacity: "1" }, { m: M.std(400), delay: 260 });
    el.deco.forEach((n, i) => {
      to(n, { transform: "translate(0px, 0px) scale(1) rotate(0deg)" }, { m: "sf", delay: 180 + i * 45 });
      to(n, { opacity: "1" }, { m: "ef", delay: 180 + i * 45 });
    });
    // Streaks burst out of the centre just as the frame closes.
    STREAKS.forEach((k, i) => [0, 1].forEach((rep) => {
      const len = 1 + ((i * 7 + rep * 3) % 5) * 0.25;
      pulse(k.el, [
        { opacity: 0, transform: `rotate(${k.angle}deg) translateY(-160px) scaleY(0.2)` },
        { opacity: 0.85, offset: 0.25 },
        { opacity: 0, transform: `rotate(${k.angle}deg) translateY(-1150px) scaleY(${len.toFixed(2)})` }
      ], { duration: 640, easing: "cubic-bezier(0.5, 0, 1, 1)", delay: 380 + rep * 260 + ((i * 97) % 200) });
    }));
    to(el.badge, { transform: "scale(1) rotate(0deg)" }, { m: "sf", delay: 330 });
    to(el.badge, { opacity: "1" }, { m: "ef", delay: 330 });
    to(el.emblem, { transform: "scale(1)" }, { m: "sf", delay: 400 });
    to(el.emblem, { opacity: "1" }, { m: "ef", delay: 400 });
    if (showWord) {
      to(el.word, { transform: "translateY(0px)" }, { m: "sd", delay: 470 });
      to(el.word, { opacity: "1" }, { m: "ed", delay: 470 });
    }
    return new Promise((resolve) => { finish = resolve; });
  }

  /* stop() during the stinger: open up now instead of waiting for the hold. */
  function exit() {
    if (!raf) return Promise.resolve();
    const t = performance.now() - start;
    if (revealAt === Infinity) beginReveal(Math.max(t, 400));
    return new Promise((resolve) => {
      const prev = finish;
      finish = () => { if (prev) prev(); resolve(); };
    });
  }

  // Centre badge follows the chosen logo group (published by the bug).
  const badgeLogo = window.CZ.followLogo({ art: el.emblem, fallback: "./img/emblem.png", live: () => raf !== 0 });

  poseOff();

  window.CZ.graphic({
    family: "transition",
    oneShot: true,
    preload: ["./img/photo-campus-a.webp", "./img/burst.webp"],
    defaults: { f0: "normal", f1: "1", f2: "1" },
    render(raw) {
      badgeLogo.setMode(raw.f2, false);
      hold = HOLDS[raw.f0] || HOLDS.normal;
      showWord = raw.f1 !== "0" && raw.f1 !== "false";
      el.word.style.display = showWord ? "" : "none";
    },
    enter,
    exit,
    idle: poseOff
  });
})();
