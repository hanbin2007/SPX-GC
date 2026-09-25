/* Corner bug: rotating logo group + live status + clock.
   Left group cycles through the school identity and any logos added to
   ./logos/ (auto interval or manual). Square logos sit in the emblem badge
   with their name beside it; wide logos get a white plate of their own.
   Hides itself while a full-screen card is on air and returns afterwards. */
(function () {
  "use strict";

  const { to, set, swap, snap, swapNode, snapNode, fit, current, M, bus } = window.CZ;
  const $ = (id) => document.getElementById(id);
  const el = {
    badgeWrap: $("badgeWrap"),
    badge: $("badgeShape"),
    art: $("art"),
    plate: $("plate"),
    plateSlot: $("plateSlot"),
    event: $("event"),
    eventSlot: $("eventSlot"),
    live: $("live"),
    liveIn: $("liveIn"),
    liveCn: $("liveCn"),
    liveEn: $("liveEn"),
    clock: $("clock"),
    clockIn: $("clockIn"),
    digits: [$("d0"), $("d1"), $("d2"), $("d3")]
  };

  const MODES = {
    live: ["直播", "LIVE"],
    replay: ["回放", "REPLAY"],
    record: ["录播", "RECORDED"]
  };
  const LOGO_FIELDS = ["f5", "f6", "f7", "f8", "f9", "f10"];
  const SCHOOL = { key: "school", kind: "school", name: "江苏省常州高级中学" };
  const BADGE = 92;
  const BADGE_GAP = 10;
  const PLATE_PAD = 26 + 30;
  const WORDMARK_W = Math.round((34 * 1094) / 188);
  const WIDE = 1.35;          // aspect ratio above which a logo gets its own plate
  const WIDE_H = 44;
  const WIDE_MAX_W = 380;

  let model = { mode: "live", event: "", clock: true, name: true, auto: true, interval: 8 };
  let logos = [SCHOOL];
  let idx = 0;
  let shown = null;           // entry currently drawn in the badge / plate
  let W = { badge: BADGE, plate: PLATE_PAD + WORDMARK_W, event: 0, live: 0, clock: 0, light: false };
  let visible = false;
  let wanted = false;
  let ducked = false;
  let time = "";
  let rot = 0;
  let timer = null;

  /* ---------------- Logos ---------------- */

  const cache = new Map();    // src -> { w, h } | null (failed)

  function nameFrom(src) {
    const str = String(src);
    // "blob:...#名称.png" (preview console) carries its file name after "#"
    let base = str.startsWith("blob:") && str.includes("#") ? str.slice(str.indexOf("#") + 1) : str.split(/[\\/]/).pop() || "";
    try { base = decodeURIComponent(base); } catch (error) { /* keep raw */ }
    return base
      .replace(/\.[^.]+$/, "")
      .replace(/^\d+\s*[-_.、\s]\s*/, "")
      .trim();
  }

  function measureImage(src) {
    if (cache.has(src)) return Promise.resolve(cache.get(src));
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const size = { w: img.naturalWidth || 1, h: img.naturalHeight || 1 };
        cache.set(src, size);
        resolve(size);
      };
      img.onerror = () => {
        cache.set(src, null);
        resolve(null);
      };
      img.src = src;
    });
  }

  function requested(raw) {
    const list = [];
    if (raw.f4 !== "0" && raw.f4 !== "false") list.push(SCHOOL);
    for (const f of LOGO_FIELDS) {
      const v = (raw[f] || "").trim();
      if (v && v !== "none" && v !== "-") list.push({ key: v, kind: "image", src: v, name: nameFrom(v) });
    }
    return list;
  }

  /* Build the carousel list; logos that fail to load are left out. */
  function buildLogos(raw) {
    const list = [];
    for (const entry of requested(raw)) {
      if (entry.kind === "school") {
        list.push(entry);
        continue;
      }
      const size = cache.get(entry.src);
      if (!size) continue;
      list.push({ ...entry, w: size.w, h: size.h, wide: size.w / size.h > WIDE });
    }
    return list.length ? list : [SCHOOL];
  }

  /* ---------------- Clock ---------------- */

  function clockText() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function setClock(text, animate) {
    for (let i = 0; i < 4; i += 1) {
      if (animate) swap(el.digits[i], text[i], { delay: i * 40, m: "sf" });
      else snap(el.digits[i], text[i]);
    }
    time = text;
  }

  /* ---------------- Geometry ---------------- */

  function plateNode(entry) {
    if (entry.kind === "school") {
      if (!model.name) return null;
      const mark = document.createElement("i");
      mark.className = "cz-wordmark is-short bug-plate__mark";
      return mark;
    }
    if (entry.wide) {
      const img = document.createElement("img");
      img.className = "bug-plate__logo";
      img.alt = "";
      img.src = entry.src;
      let h = WIDE_H;
      let w = (h * entry.w) / entry.h;
      if (w > WIDE_MAX_W) {
        w = WIDE_MAX_W;
        h = (w * entry.h) / entry.w;
      }
      img.style.width = `${Math.round(w)}px`;
      img.style.height = `${Math.round(h)}px`;
      return img;
    }
    if (!model.name || !entry.name) return null;
    const span = document.createElement("span");
    span.className = "bug-plate__name";
    span.textContent = entry.name;
    return span;
  }

  function artNode(entry) {
    if (entry.wide) return null;
    const img = document.createElement("img");
    img.className = "cz-badge__emblem";
    img.alt = "";
    img.src = entry.kind === "school" ? "./img/emblem.png" : entry.src;
    return img;
  }

  function plateWidth(node) {
    if (!node) return 0;
    if (node.classList.contains("bug-plate__mark")) return PLATE_PAD + WORDMARK_W;
    if (node.tagName === "IMG") return PLATE_PAD + parseFloat(node.style.width);
    return PLATE_PAD + Math.ceil(fit(node, 360, 28, 22));
  }

  function measureRight() {
    W.event = model.event ? Math.ceil(fit(current(el.eventSlot), 380, 28, 22)) + 52 : 0;
    W.live = model.mode in MODES ? Math.ceil(el.liveIn.offsetWidth) + 22 + 24 : 0;
    W.clock = model.clock ? Math.ceil(el.clockIn.offsetWidth) + 44 : 0;
    el.plate.classList.toggle("has-next", W.plate > 0 && W.event > 0);
    el.plate.classList.toggle("is-first", !W.badge);
    el.live.classList.toggle("is-alone", !W.clock);
    el.clock.classList.toggle("is-alone", !W.live);
  }

  /* Segment geometry: width + the gap that follows it. */
  function segs(animate, delay = 0) {
    const f = animate ? (n, p, o) => to(n, p, o) : (n, p) => set(n, p);
    f(el.badgeWrap, { width: `${W.badge}px`, marginRight: `${W.badge && (W.plate || W.event) ? BADGE_GAP : 0}px` }, { m: "sd", delay });
    f(el.plate, { width: `${W.plate}px`, marginRight: `${W.plate && W.event ? 8 : 0}px` }, { m: "sd", delay });
    f(el.plate, { opacity: W.plate ? "1" : "0" }, { m: "ed", delay });
    f(el.event, { width: `${W.event}px` }, { m: "sd", delay });
    f(el.event, { opacity: W.event ? "1" : "0" }, { m: "ed", delay });
    f(el.live, { width: `${W.live}px`, marginRight: `${W.live && W.clock ? 6 : 0}px` }, { m: "sd", delay });
    f(el.live, { opacity: W.live ? "1" : "0" }, { m: "ed", delay });
    f(el.clock, { width: `${W.clock}px` }, { m: "sd", delay });
    f(el.clock, { opacity: W.clock ? "1" : "0" }, { m: "ed", delay });
  }

  /* Draw a logo entry. Animated: badge ticks one scallop, the old art
     shrinks away, segments spring to the new widths, new content rises. */
  function drawLogo(entry, animate) {
    const prev = shown;
    shown = entry;
    const art = artNode(entry);
    const node = plateNode(entry);
    const wasBadge = W.badge > 0;
    W.badge = art ? BADGE : 0;
    W.light = !!entry.wide;
    el.plate.classList.toggle("is-light", W.light);

    if (!animate) {
      el.art.textContent = "";
      if (art) el.art.appendChild(art);
      if (node) snapNode(el.plateSlot, node);
      else el.plateSlot.textContent = "";
      W.plate = plateWidth(node);
      return;
    }

    // Badge art
    for (const old of [...el.art.children]) {
      to(old, { transform: "scale(0.5) rotate(40deg)" }, { m: M.acc(200) });
      to(old, { opacity: "0" }, { m: M.acc(150) }).then(() => old.remove());
    }
    if (art) {
      el.art.appendChild(art);
      set(art, { transform: "scale(0.5) rotate(-40deg)", opacity: "0" });
      to(art, { transform: "scale(1) rotate(0deg)" }, { m: "sf", delay: 140 });
      to(art, { opacity: "1" }, { m: "ef", delay: 140 });
    }

    // Badge shape: tick when it stays, pop in/out when a wide logo comes or goes
    if (art && wasBadge) {
      rot += 30;
      to(el.badge, { transform: `scale(1) rotate(${rot}deg)` }, { m: "sd" });
    } else if (art) {
      to(el.badge, { transform: `scale(1) rotate(${rot}deg)` }, { m: "sf", delay: 60 });
      to(el.badge, { opacity: "1" }, { m: "ef", delay: 60 });
    } else {
      to(el.badge, { transform: `scale(0.3) rotate(${rot + 90}deg)` }, { m: M.acc(240) });
      to(el.badge, { opacity: "0" }, { m: M.acc(160), delay: 60 });
    }

    // Plate content
    if (node) swapNode(el.plateSlot, node, { delay: 40 });
    else {
      for (const old of [...el.plateSlot.children]) {
        to(old, { opacity: "0" }, { m: M.acc(120) }).then(() => old.remove());
      }
    }
    W.plate = plateWidth(node);
    measureRight();
    segs(true);
    if (prev && prev.key !== entry.key) bus.post({ type: "logo", key: entry.key });
  }

  function schedule() {
    clearTimeout(timer);
    timer = null;
    if (!visible || !model.auto || logos.length < 2) return;
    timer = setTimeout(() => step(1), Math.max(3, model.interval) * 1000);
  }

  function step(n) {
    if (logos.length < 2) return;
    idx = (idx + n + logos.length * 10) % logos.length;
    if (visible) drawLogo(logos[idx], true);
    else drawLogo(logos[idx], false);
    schedule();
  }

  /* ---------------- Render ---------------- */

  function render(raw, opts) {
    const prev = model;
    const interval = parseFloat(raw.f12);
    model = {
      mode: raw.f0 in MODES ? raw.f0 : "none",
      event: raw.f1 || "",
      clock: raw.f2 !== "0" && raw.f2 !== "false",
      name: raw.f3 !== "0" && raw.f3 !== "false",
      auto: raw.f11 !== "manual",
      interval: interval > 0 ? interval : 8
    };
    const live = opts.animate && visible;

    // Logo list: keep showing the current logo if it is still in the list.
    const list = buildLogos(raw);
    const curKey = shown ? shown.key : null;
    const keep = list.findIndex((e) => e.key === curKey);
    logos = list;
    idx = keep >= 0 ? keep : 0;
    const entry = logos[idx];
    const redraw = !shown || shown.key !== entry.key || prev.name !== model.name;

    const words = MODES[model.mode] || MODES[prev.mode] || MODES.live;
    el.live.dataset.mode = model.mode;
    if (live) {
      swap(el.eventSlot, model.event);
      swap(el.liveCn, words[0]);
      swap(el.liveEn, words[1], { delay: 40 });
      if (redraw) drawLogo(entry, true);
      measureRight();
      segs(true);
      if (!redraw && (prev.event !== model.event || prev.mode !== model.mode) && W.badge) {
        rot += 30;
        to(el.badge, { transform: `scale(1) rotate(${rot}deg)` }, { m: "sd" });
      }
      schedule();
    } else {
      snap(el.eventSlot, model.event);
      snap(el.liveCn, words[0]);
      snap(el.liveEn, words[1]);
      drawLogo(entry, false);
      measureRight();
    }
  }

  /* ---------------- Poses ---------------- */

  function poseOff() {
    rot = 0;
    set(el.badgeWrap, { width: `${W.badge}px`, marginRight: `${W.badge ? BADGE_GAP : 0}px` });
    set(el.badge, { transform: "scale(0.3) rotate(-120deg)", opacity: "0" });
    set(el.art, { transform: "scale(0.5)", opacity: "0" });
    set(el.plate, { width: "0px", marginRight: "0px", opacity: "0" });
    set(el.plateSlot, { clipPath: "inset(0% 100% 0% 0%)" });
    set(el.event, { width: "0px", opacity: "0" });
    set(el.eventSlot, { transform: "translateY(100%)", opacity: "0" });
    set(el.live, { width: "52px", marginRight: "0px", opacity: "0", transform: "scale(0.4)" });
    set(el.liveIn, { opacity: "0" });
    set(el.clock, { width: "0px", opacity: "0" });
    set(el.clockIn, { transform: "translateY(100%)", opacity: "0" });
  }

  function poseOn() {
    set(el.badge, { transform: `scale(${W.badge ? 1 : 0.3}) rotate(${rot}deg)`, opacity: W.badge ? "1" : "0" });
    set(el.art, { transform: "scale(1)", opacity: "1" });
    set(el.plateSlot, { clipPath: "inset(0% 0% 0% 0%)" });
    set(el.eventSlot, { transform: "translateY(0%)", opacity: "1" });
    set(el.live, { transform: "scale(1)" });
    set(el.liveIn, { opacity: "1" });
    set(el.clockIn, { transform: "translateY(0%)", opacity: "1" });
    segs(false);
  }

  function doEnter() {
    visible = true;
    const t = clockText();
    if (t !== time) setClock(t, false);
    const hasBadge = W.badge > 0;
    schedule();
    return Promise.all([
      to(el.badgeWrap, { width: `${W.badge}px`, marginRight: `${W.badge && (W.plate || W.event) ? BADGE_GAP : 0}px` }, { m: "sd" }),
      to(el.badge, { transform: `scale(${hasBadge ? 1 : 0.3}) rotate(${rot}deg)` }, { m: "sf" }),
      to(el.badge, { opacity: hasBadge ? "1" : "0" }, { m: "ef" }),
      to(el.art, { transform: "scale(1)" }, { m: "sf", delay: 70 }),
      to(el.art, { opacity: "1" }, { m: "ef", delay: 70 }),
      to(el.plate, { width: `${W.plate}px`, marginRight: `${W.plate && W.event ? 8 : 0}px` }, { m: "sd", delay: 100 }),
      to(el.plate, { opacity: W.plate ? "1" : "0" }, { m: "ef", delay: 100 }),
      to(el.plateSlot, { clipPath: "inset(0% 0% 0% 0%)" }, { m: M.dec(520), delay: 190 }),
      to(el.event, { width: `${W.event}px` }, { m: "sd", delay: 170 }),
      to(el.event, { opacity: W.event ? "1" : "0" }, { m: "ef", delay: 170 }),
      to(el.eventSlot, { transform: "translateY(0%)" }, { m: "sd", delay: 280 }),
      to(el.eventSlot, { opacity: "1" }, { m: "ed", delay: 280 }),
      to(el.live, { transform: "scale(1)" }, { m: "sf", delay: 140 }),
      to(el.live, { opacity: W.live ? "1" : "0" }, { m: "ef", delay: 140 }),
      to(el.live, { width: `${W.live}px`, marginRight: `${W.live && W.clock ? 6 : 0}px` }, { m: "sd", delay: 230 }),
      to(el.liveIn, { opacity: "1" }, { m: "ed", delay: 290 }),
      to(el.clock, { width: `${W.clock}px` }, { m: "sd", delay: 280 }),
      to(el.clock, { opacity: W.clock ? "1" : "0" }, { m: "ef", delay: 280 }),
      to(el.clockIn, { transform: "translateY(0%)" }, { m: "sd", delay: 360 }),
      to(el.clockIn, { opacity: "1" }, { m: "ed", delay: 360 })
    ]);
  }

  function doExit() {
    visible = false;
    schedule();
    const a = M.acc;
    return Promise.all([
      to(el.clockIn, { opacity: "0" }, { m: a(120) }),
      to(el.clockIn, { transform: "translateY(-60%)" }, { m: a(180) }),
      to(el.clock, { width: "0px" }, { m: a(260), delay: 60 }),
      to(el.clock, { opacity: "0" }, { m: a(120), delay: 220 }),
      to(el.liveIn, { opacity: "0" }, { m: a(120), delay: 40 }),
      to(el.live, { width: "52px", marginRight: "0px" }, { m: a(240), delay: 100 }),
      to(el.live, { transform: "scale(0.4)" }, { m: a(200), delay: 260 }),
      to(el.live, { opacity: "0" }, { m: a(140), delay: 300 }),
      to(el.eventSlot, { opacity: "0" }, { m: a(120) }),
      to(el.eventSlot, { transform: "translateY(-60%)" }, { m: a(180) }),
      to(el.event, { width: "0px" }, { m: a(260), delay: 60 }),
      to(el.event, { opacity: "0" }, { m: a(120), delay: 220 }),
      to(el.plateSlot, { clipPath: "inset(0% 100% 0% 0%)" }, { m: a(260), delay: 60 }),
      to(el.plate, { width: "0px", marginRight: "0px" }, { m: a(280), delay: 120 }),
      to(el.plate, { opacity: "0" }, { m: a(120), delay: 300 }),
      to(el.art, { transform: "scale(0.5)" }, { m: a(220), delay: 280 }),
      to(el.art, { opacity: "0" }, { m: a(160), delay: 320 }),
      to(el.badge, { transform: `scale(0.3) rotate(${rot + 90}deg)` }, { m: a(260), delay: 300 }),
      to(el.badge, { opacity: "0" }, { m: a(170), delay: 380 })
    ]);
  }

  let pendingSync = null;
  function sync(delay = 0) {
    clearTimeout(pendingSync);
    const show = wanted && !ducked;
    if (show === visible) return Promise.resolve();
    if (!show) return doExit();
    return new Promise((resolve) => {
      pendingSync = setTimeout(() => resolve(wanted && !ducked && !visible ? doEnter() : null), delay);
    });
  }

  // Full-screen card on air -> step aside; come back once it is leaving.
  bus.watch("fullscreen", (on, initial) => {
    ducked = on;
    if (!initial) sync(on ? 0 : 260);
  });

  setInterval(() => {
    const t = clockText();
    if (t !== time) setClock(t, visible);
  }, 1000);

  /* Manual switching, callable from SPX (button field / invoke) or a page. */
  window.czLogoStep = (n) => step(parseInt(n, 10) || 1);
  window.czLogoShow = (i) => {
    const target = Math.max(0, Math.min(logos.length - 1, (parseInt(i, 10) || 1) - 1));
    if (target === idx) return;
    idx = target;
    drawLogo(logos[idx], visible);
    schedule();
  };

  setClock(clockText(), false);
  poseOff();

  window.CZ.graphic({
    family: "bug",
    defaults: { f0: "live", f1: "", f2: "1", f3: "1", f4: "1", f5: "", f6: "", f7: "", f8: "", f9: "", f10: "", f11: "auto", f12: "8" },
    preload: ["./img/emblem.png"],
    prepare(raw) {
      return Promise.all(requested(raw).filter((e) => e.kind === "image").map((e) => measureImage(e.src)));
    },
    render,
    enter() {
      wanted = true;
      return sync();
    },
    exit() {
      wanted = false;
      return sync();
    },
    idle() {
      if (!visible) poseOff();
    },
    snapshot() {
      return { model, logos, idx, rot };
    },
    restore(s) {
      if (s.model) model = s.model;
      if (s.logos && s.logos.length) {
        logos = s.logos;
        for (const e of logos) if (e.kind === "image") cache.set(e.src, { w: e.w, h: e.h });
      }
      idx = Math.min(s.idx || 0, logos.length - 1);
      rot = s.rot || 0;
      const words = MODES[model.mode] || MODES.live;
      el.live.dataset.mode = model.mode;
      snap(el.eventSlot, model.event);
      snap(el.liveCn, words[0]);
      snap(el.liveEn, words[1]);
      drawLogo(logos[idx], false);
      measureRight();
      wanted = true;
      if (ducked) return;
      visible = true;
      poseOn();
      schedule();
    }
  });
})();
