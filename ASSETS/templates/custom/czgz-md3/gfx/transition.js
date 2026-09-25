/* Stinger transition (SPX out: "none"). Fully covered from ~0.7 s; the bus
   broadcasts {type:"cover"} at that moment, which is the safe point to cut
   cameras in the vision mixer. */
(function () {
  "use strict";

  const { to, set, shapePx, M, bus } = window.CZ;
  const $ = (id) => document.getElementById(id);
  const el = {
    teal: $("teal"),
    navy: $("navy"),
    badge: $("badgeShape"),
    emblem: $("badgeEmblem"),
    word: $("word")
  };

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
    to(el.word, { opacity: "0" }, { m: a(160), delay });
    to(el.word, { transform: "translateY(-14px)" }, { m: a(200), delay });
    to(el.emblem, { opacity: "0" }, { m: a(160), delay });
    to(el.badge, { transform: "scale(0.2) rotate(90deg)" }, { m: a(260), delay });
    to(el.badge, { opacity: "0" }, { m: a(160), delay: delay + 100 });
  }

  function poseOff() {
    cancelAnimationFrame(raf);
    raf = 0;
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

  poseOff();

  window.CZ.graphic({
    family: "transition",
    oneShot: true,
    defaults: { f0: "normal", f1: "1" },
    render(raw) {
      hold = HOLDS[raw.f0] || HOLDS.normal;
      showWord = raw.f1 !== "0" && raw.f1 !== "false";
      el.word.style.display = showWord ? "" : "none";
    },
    enter,
    exit,
    idle: poseOff
  });
})();
