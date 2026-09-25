/* Full-screen card. The whole scene is revealed through a 12-sided cookie
   window growing from the orb, then the content settles in with springs.
   While it is on air the corner bug steps aside (bus family "fullscreen"). */
(function () {
  "use strict";

  const { to, set, swap, snap, current, shapePx, M } = window.CZ;
  const $ = (id) => document.getElementById(id);
  const el = {
    fs: $("fs"),
    deco: [...document.querySelectorAll(".fs-deco > i")],
    badge: $("badgeShape"),
    emblem: $("badgeEmblem"),
    word: $("wordmark"),
    en: $("en"),
    eyebrow: $("eyebrow"),
    eyeCn: $("eyeCn"),
    eyeEn: $("eyeEn"),
    titlebox: $("titlebox"),
    title: $("title"),
    subbox: $("subbox"),
    sub: $("sub"),
    orb: $("orb"),
    orbShape: $("orbShape"),
    moon: $("moon"),
    face: $("face"),
    label: $("orbLabel"),
    digits: $("digits"),
    note: $("orbNote"),
    orbEmblem: $("orbEmblem"),
    orbArt: $("orbArt")
  };

  const CX = 1460;
  const CY = 540;
  const RMAX = 1720;
  const TITLE_LINE = 84 * 1.18;

  const MODES = {
    starting: { cn: "直播即将开始", en: "STARTING SOON", count: "距离开始", zero: "马上开始" },
    break: { cn: "中场休息", en: "BE RIGHT BACK", count: "距离继续", zero: "马上回来" },
    end: { cn: "感谢观看", en: "THANKS FOR WATCHING", count: "倒计时", zero: "时间到" },
    custom: { cn: "", en: "", count: "倒计时", zero: "时间到" }
  };

  let model = null;
  let visible = false;
  let face = "countdown";       // countdown | time | emblem
  let orbRot = 0;
  let digitsText = "";
  let labelText = "";
  let durKey = "";
  let durStart = 0;

  /* ---------------- Cover window ---------------- */

  let coverAnim = null;
  let coverFrom = 0;
  let coverTo = 0;
  let coverP = 0;

  function coverAt(p) {
    if (p >= 1) return "none";
    const r = Math.max(0.5, RMAX * p);
    return shapePx("cookie12", CX, CY, r, { rot: -70 * (1 - p) });
  }

  function coverNow() {
    if (!coverAnim) return coverP;
    const t = coverAnim.effect.getComputedTiming().progress;
    if (t === null || t === undefined) return coverP;
    return coverFrom + (coverTo - coverFrom) * t;
  }

  function cover(p1, m, delay = 0) {
    const p0 = coverNow();
    if (coverAnim) coverAnim.cancel();
    coverFrom = p0;
    coverTo = p1;
    const frames = [];
    const K = 16;
    for (let i = 0; i <= K; i += 1) {
      const p = p0 + ((p1 - p0) * i) / K;
      frames.push({ clipPath: shapePx("cookie12", CX, CY, Math.max(0.5, RMAX * p), { rot: -70 * (1 - p) }) });
    }
    const anim = el.fs.animate(frames, { duration: m.duration, easing: m.easing, delay, fill: "both" });
    coverAnim = anim;
    return anim.finished.then(() => {
      if (coverAnim !== anim) return;
      coverP = p1;
      el.fs.style.clipPath = coverAt(p1);
      anim.cancel();
      coverAnim = null;
    }, () => {});
  }

  /* ---------------- Orb face ---------------- */

  function targetTime(raw) {
    const mins = parseFloat(raw.f5);
    if (mins > 0) {
      if (durKey !== raw.f5 || !durStart) {
        durKey = raw.f5;
        durStart = Date.now();
      }
      return durStart + mins * 60000;
    }
    durKey = "";
    durStart = 0;
    const m = /^(\d{1,2})\s*[:：]\s*(\d{2})$/.exec(raw.f4 || "");
    if (!m) return null;
    const d = new Date();
    d.setHours(Math.min(23, +m[1]), Math.min(59, +m[2]), 0, 0);
    return d.getTime();
  }

  const pad = (n) => String(n).padStart(2, "0");

  function faceState() {
    const modeInfo = MODES[model.mode] || MODES.starting;
    if (face === "time") {
      const d = new Date();
      return { label: "北京时间", digits: `${pad(d.getHours())}:${pad(d.getMinutes())}`, note: "BEIJING TIME" };
    }
    const target = targetTime(model.raw);
    if (target === null) return { label: modeInfo.count, digits: "--:--", note: "MIN · SEC" };
    const left = Math.max(0, Math.ceil((target - Date.now()) / 1000));
    const h = Math.floor(left / 3600);
    const m = Math.floor((left % 3600) / 60);
    const s = left % 60;
    if (left === 0) return { label: modeInfo.zero, digits: "00:00", note: "MIN · SEC" };
    if (h > 0) return { label: modeInfo.count, digits: `${h}:${pad(m)}:${pad(s)}`, note: "HR · MIN · SEC" };
    return { label: modeInfo.count, digits: `${pad(m)}:${pad(s)}`, note: "MIN · SEC" };
  }

  function setDigits(text, animate) {
    const chars = [...text];
    const slots = [...el.digits.children];
    const rebuild = slots.length !== chars.length || slots.some((node, i) => (chars[i] === ":") !== node.classList.contains("colon"));
    if (rebuild) {
      el.digits.textContent = "";
      for (const ch of chars) {
        const node = document.createElement("span");
        if (ch === ":") {
          node.className = "colon";
          node.textContent = ":";
        } else {
          node.className = "cz-slot";
          snap(node, ch);
        }
        el.digits.appendChild(node);
      }
      el.digits.classList.toggle("is-long", chars.length > 5);
      if (animate) to(el.digits, { opacity: "1" }, { m: "ed", from: { opacity: "0" } });
    } else {
      chars.forEach((ch, i) => {
        if (ch === ":") return;
        if (animate) swap(slots[i], ch, { m: "sf", delay: 0 });
        else snap(slots[i], ch);
      });
    }
    digitsText = text;
  }

  function refreshFace(animate) {
    if (face === "emblem") return;
    const st = faceState();
    if (st.label !== labelText) {
      if (animate) swap(el.label, st.label);
      else snap(el.label, st.label);
      labelText = st.label;
    }
    if (st.digits !== digitsText) setDigits(st.digits, animate);
    if (CZ.slotText(el.note) !== st.note) {
      if (animate) swap(el.note, st.note, { delay: 40 });
      else snap(el.note, st.note);
    }
  }

  function showFace(next, animate) {
    const prev = face;
    face = next;
    const isEmblem = face === "emblem";
    if (!isEmblem) refreshFace(animate && prev !== "emblem");
    const f = animate ? to : (n, p) => set(n, p);
    f(el.face, { opacity: isEmblem ? "0" : "1" }, { m: "ed", delay: isEmblem ? 0 : 120 });
    f(el.face, { transform: isEmblem ? "scale(0.8)" : "scale(1)" }, { m: "sd", delay: isEmblem ? 0 : 120 });
    f(el.orbEmblem, { opacity: isEmblem ? "1" : "0" }, { m: "ed", delay: isEmblem ? 120 : 0 });
    f(el.orbEmblem, { transform: isEmblem ? "scale(1) rotate(0deg)" : "scale(0.6) rotate(-40deg)" }, { m: isEmblem ? "sf" : M.acc(200), delay: isEmblem ? 120 : 0 });
  }

  setInterval(() => {
    if (model && face !== "emblem") refreshFace(visible);
  }, 250);

  /* ---------------- Text ---------------- */

  function fitTitle(span) {
    if (!span) return TITLE_LINE;
    let size = 84;
    span.style.fontSize = `${size}px`;
    while (span.offsetHeight > size * 1.18 * 2 + 2 && size > 58) {
      size -= 2;
      span.style.fontSize = `${size}px`;
    }
    return span.offsetHeight;
  }

  function render(raw, opts) {
    const prev = model;
    const live = opts.animate && visible;
    for (const follower of logoSpots) follower.setMode(raw.f8, live);
    const mode = MODES[raw.f0] ? raw.f0 : "starting";
    const info = MODES[mode];
    model = {
      raw,
      mode,
      cn: mode === "custom" ? raw.f7 || "" : info.cn,
      en: mode === "custom" ? "" : info.en,
      title: raw.f1 || "",
      sub: raw.f2 || "",
      face: ["countdown", "time", "emblem"].includes(raw.f3) ? raw.f3 : "countdown",
      light: raw.f6 === "light"
    };

    el.fs.classList.toggle("is-light", model.light);

    if (live) {
      swap(el.eyeCn, model.cn);
      swap(el.eyeEn, model.en, { delay: 40 });
      const t = swap(el.title, model.title, { delay: 60, m: "ss" });
      to(el.titlebox, { height: `${fitTitle(t)}px` }, { m: "sd", delay: 60 });
      swap(el.sub, model.sub, { delay: 120 });
      to(el.subbox, { opacity: model.sub ? "1" : "0" }, { m: "ed", delay: 120 });
      if (!prev || prev.face !== model.face || prev.mode !== model.mode) {
        orbRot += 30;  // one scallop: same silhouette, visible "tick"
        to(el.orbShape, { transform: `rotate(${orbRot}deg)` }, { m: "sd" });
      }
      showFace(model.face, true);
      refreshFace(true);
    } else {
      snap(el.eyeCn, model.cn);
      snap(el.eyeEn, model.en);
      set(el.titlebox, { height: `${fitTitle(snap(el.title, model.title))}px` });
      snap(el.sub, model.sub);
      set(el.subbox, { opacity: model.sub ? "1" : "0" });
      showFace(model.face, false);
      labelText = "";
      digitsText = "";
      refreshFace(false);
    }
  }

  /* ---------------- Poses ---------------- */

  const DECO_DELAY = [140, 300, 380, 440, 360, 420];

  function poseOff() {
    orbRot = 0;
    coverP = 0;
    if (coverAnim) coverAnim.cancel();
    coverAnim = null;
    el.fs.style.clipPath = shapePx("cookie12", CX, CY, 0.5, { rot: -70 });
    el.deco.forEach((node) => set(node, { transform: "scale(0.6) rotate(-30deg)", opacity: "0" }));
    set(el.orb, { transform: "scale(0.3) rotate(-60deg)", opacity: "0" });
    set(el.orbShape, { transform: "rotate(0deg)" });
    set(el.moon, { opacity: "0" });
    set(el.badge, { transform: "scale(0.3) rotate(-120deg)", opacity: "0" });
    set(el.emblem, { transform: "scale(0.5)", opacity: "0" });
    set(el.word, { clipPath: "inset(0% 100% 0% 0%)" });
    set(el.en, { transform: "translateY(16px)", opacity: "0" });
    set(el.eyebrow, { transform: "scale(0.5)", opacity: "0" });
    set(el.title, { transform: "translateY(100%)", opacity: "0" });
    set(el.subbox, { transform: "translateY(24px)" });
    set(el.sub, { opacity: "0" });
  }

  function poseOn() {
    coverP = 1;
    el.fs.style.clipPath = "none";
    el.deco.forEach((node) => set(node, { transform: "scale(1) rotate(0deg)", opacity: "1" }));
    set(el.orb, { transform: "scale(1) rotate(0deg)", opacity: "1" });
    set(el.orbShape, { transform: `rotate(${orbRot}deg)` });
    set(el.moon, { opacity: "1" });
    set(el.badge, { transform: "scale(1) rotate(0deg)", opacity: "1" });
    set(el.emblem, { transform: "scale(1)", opacity: "1" });
    set(el.word, { clipPath: "inset(0% 0% 0% 0%)" });
    set(el.en, { transform: "translateY(0px)", opacity: "1" });
    set(el.eyebrow, { transform: "scale(1)", opacity: "1" });
    set(el.title, { transform: "translateY(0%)", opacity: "1" });
    set(el.subbox, { transform: "translateY(0px)" });
    set(el.sub, { opacity: "1" });
  }

  function enter() {
    visible = true;
    refreshFace(false);
    const jobs = [cover(1, M.dec(900))];
    el.deco.forEach((node, i) => {
      jobs.push(to(node, { transform: "scale(1) rotate(0deg)" }, { m: "sg", delay: DECO_DELAY[i] || 300 }));
      jobs.push(to(node, { opacity: "1" }, { m: "es", delay: DECO_DELAY[i] || 300 }));
    });
    jobs.push(
      to(el.orb, { transform: "scale(1) rotate(0deg)" }, { m: "ss", delay: 180 }),
      to(el.orb, { opacity: "1" }, { m: "ed", delay: 180 }),
      to(el.moon, { opacity: "1" }, { m: "es", delay: 620 }),
      to(el.badge, { transform: "scale(1) rotate(0deg)" }, { m: "sf", delay: 260 }),
      to(el.badge, { opacity: "1" }, { m: "ef", delay: 260 }),
      to(el.emblem, { transform: "scale(1)" }, { m: "sf", delay: 320 }),
      to(el.emblem, { opacity: "1" }, { m: "ef", delay: 320 }),
      to(el.word, { clipPath: "inset(0% 0% 0% 0%)" }, { m: M.dec(700), delay: 340 }),
      to(el.en, { transform: "translateY(0px)" }, { m: "sd", delay: 460 }),
      to(el.en, { opacity: "1" }, { m: "es", delay: 460 }),
      to(el.eyebrow, { transform: "scale(1)" }, { m: "sf", delay: 420 }),
      to(el.eyebrow, { opacity: "1" }, { m: "ef", delay: 420 }),
      to(el.title, { transform: "translateY(0%)" }, { m: "ss", delay: 480 }),
      to(el.title, { opacity: "1" }, { m: "es", delay: 480 }),
      to(el.subbox, { transform: "translateY(0px)" }, { m: "sd", delay: 580 }),
      to(el.sub, { opacity: "1" }, { m: "es", delay: 580 })
    );
    return Promise.all(jobs);
  }

  function exit() {
    visible = false;
    const a = M.acc;
    const jobs = [];
    [el.sub, el.title, el.eyebrow, el.en].forEach((node, i) => {
      jobs.push(to(node, { opacity: "0" }, { m: a(150), delay: i * 25 }));
    });
    jobs.push(
      to(el.title, { transform: "translateY(-30%)" }, { m: a(200), delay: 25 }),
      to(el.word, { clipPath: "inset(0% 100% 0% 0%)" }, { m: a(260), delay: 40 }),
      to(el.badge, { transform: "scale(0.3) rotate(90deg)" }, { m: a(240), delay: 60 }),
      to(el.badge, { opacity: "0" }, { m: a(160), delay: 120 }),
      to(el.emblem, { opacity: "0" }, { m: a(160), delay: 80 }),
      to(el.moon, { opacity: "0" }, { m: a(120) }),
      to(el.orb, { transform: "scale(0.5) rotate(45deg)" }, { m: a(300), delay: 60 }),
      to(el.orb, { opacity: "0" }, { m: a(200), delay: 160 })
    );
    el.deco.forEach((node, i) => {
      jobs.push(to(node, { transform: "scale(0.8) rotate(20deg)" }, { m: a(260), delay: 40 + i * 15 }));
      jobs.push(to(node, { opacity: "0" }, { m: a(200), delay: 80 + i * 15 }));
    });
    jobs.push(cover(0, a(560), 180));
    return Promise.all(jobs);
  }

  poseOff();

  // Brand badge and orb emblem follow the chosen logo group (published by the bug).
  const logoSpots = [
    window.CZ.followLogo({ art: el.emblem, fallback: "./img/emblem.png", live: () => visible }),
    window.CZ.followLogo({
      art: el.orbArt,
      fallback: "./img/emblem.png",
      live: () => visible,
      make(src, scale) {
        const img = document.createElement("img");
        img.alt = "";
        img.src = src;
        const size = 100 * Math.max(0.5, Math.min(1.2, scale || 1));
        img.style.inset = `${(100 - size) / 2}%`;
        img.style.width = `${size}%`;
        img.style.height = `${size}%`;
        return img;
      }
    })
  ];

  window.CZ.graphic({
    family: "fullscreen",
    defaults: {
      f0: "starting",
      f1: "江苏省常州高级中学\n第六十八届田径运动会",
      f2: "2026年10月18日 · 学校田径场",
      f3: "countdown",
      f4: "",
      f5: "5",
      f6: "dark",
      f7: "",
      f8: "1"
    },
    render,
    enter,
    exit,
    idle: poseOff,
    snapshot() {
      return { raw: model && model.raw, durKey, durStart, orbRot, logos: logoSpots[0].snapshot() };
    },
    restore(s) {
      for (const follower of logoSpots) follower.restore(s.logos);
      durKey = s.durKey || "";
      durStart = s.durStart || 0;
      orbRot = s.orbRot || 0;
      if (s.raw) render(s.raw, { animate: false });
      visible = true;
      poseOn();
    }
  });
})();
