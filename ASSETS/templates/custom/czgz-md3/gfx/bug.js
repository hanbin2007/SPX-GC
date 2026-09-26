/* Corner bug: project logo library + live status + clock.
   The built-in school identity and project logos each have their own group
   membership. Every group runs its own carousel here and is
   published on the bus ({type: "grouplogo", group}); each graphic picks the
   group its logo follows, so all graphics in a group switch together. The
   bug itself is one such member (its badge + name plate, or a white plate
   for wide logos). Hides itself while a full-screen card is on air. */
(function () {
  "use strict";

  const { to, set, swap, snap, swapNode, snapNode, fit, current, artImage, swapArt, logoGroup, LOGO_GROUPS, M, bus } = window.CZ;
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
  const SLOTS = [1, 2, 3, 4, 5, 6];   // slot n uses fields f{n}0 … f{n}5
  const SCALES = [0.7, 0.85, 1, 1.1, 1.2];
  const BADGE = 92;
  const BADGE_GAP = 10;
  const PLATE_PAD = 26 + 30;
  const WORDMARK_W = Math.round((34 * 1094) / 188);
  const WIDE = 1.35;          // aspect ratio above which a logo gets its own plate
  const WIDE_H = 44;
  const WIDE_MAX_W = 380;

  let model = { mode: "live", event: "", clock: true, name: true, bugGroup: "1" };
  let school = { key: "school", kind: "school", sig: "school", secs: 0, scale: 1 };
  const groups = {};          // group id -> { list, idx, auto, interval, timer, published }
  let groupIds = [...LOGO_GROUPS];
  for (const g of groupIds) groups[g] = { list: [school], idx: 0, auto: true, interval: 8, timer: null, published: null };
  let shown = null;           // entry currently drawn in the badge / plate
  let W = { badge: BADGE, plate: PLATE_PAD + WORDMARK_W, event: 0, live: 0, clock: 0, light: false };
  let visible = false;
  let wanted = false;
  let ducked = false;
  let time = "";
  let rot = 0;

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

  /* "1 3", "1,3", "13" -> ["1", "3"] */
  function groupsOf(v) {
    return LOGO_GROUPS.filter((g) => String(v || "").includes(g));
  }

  function secsOf(v) {
    const n = parseFloat(v);
    return n > 0 ? Math.max(3, n) : 0;
  }

  function slotConfig(raw, n) {
    const src = (raw[`f${n}0`] || "").trim();
    if (!src || src === "none" || src === "-") return null;
    const nameField = (raw[`f${n}1`] || "").trim();
    const scale = SCALES.includes(parseFloat(raw[`f${n}3`])) ? parseFloat(raw[`f${n}3`]) : 1;
    return {
      key: src,
      kind: "image",
      src,
      label: nameField === "-" ? "" : nameField || nameFrom(src),
      style: ["badge", "plate"].includes(raw[`f${n}2`]) ? raw[`f${n}2`] : "auto",
      scale,
      secs: secsOf(raw[`f${n}4`]),
      groups: groupsOf(raw[`f${n}5`] === undefined ? "1" : raw[`f${n}5`])
    };
  }

  function requested(raw) {
    return SLOTS.map((n) => slotConfig(raw, n)).filter(Boolean);
  }

  function libraryOf(raw) {
    if (raw.fLogoLibrary) {
      try {
        const library = JSON.parse(raw.fLogoLibrary);
        if (library && Array.isArray(library.groups) && library.groups.length && Array.isArray(library.logos)) {
          return library;
        }
      } catch (error) { console.error("CZ: invalid project logo library", error); }
    }
    return {
      groups: LOGO_GROUPS.map((id, index) => ({
        id, mode: raw[`f${70 + index * 2}`] === "manual" ? "manual" : "auto",
        interval: secsOf(raw[`f${71 + index * 2}`]) || 8
      })),
      school: { groups: groupsOf(raw.f4), dwell: raw.f5 || "" },
      logos: requested(raw).map((entry, index) => ({
        id: `legacy-${index}`, src: entry.src, label: entry.label,
        style: entry.style, scale: entry.scale, dwell: entry.secs || "", groups: entry.groups
      }))
    };
  }

  /* One list per group; logos that fail to load are left out and an empty
     group falls back to the school identity. */
  function buildLogos(library) {
    school = { key: "school", kind: "school", sig: "school", secs: secsOf(library.school?.dwell), scale: 1, groups: library.school?.groups || [] };
    const list = [school];
    for (const logo of library.logos) {
      if (!logo.src) continue;
      const entry = {
        key: logo.id, kind: "image", src: logo.src,
        label: logo.label === "-" ? "" : logo.label || nameFrom(logo.src),
        style: logo.style || "auto", scale: Number(logo.scale) || 1,
        secs: secsOf(logo.dwell), groups: logo.groups || []
      };
      const size = cache.get(entry.src);
      if (!size) continue;
      const wide = entry.style === "plate" || (entry.style === "auto" && size.w / size.h > WIDE);
      list.push({ ...entry, w: size.w, h: size.h, wide, sig: [entry.key, entry.label, wide, entry.scale].join("|") });
    }
    const lists = {};
    for (const g of library.groups.map((group) => group.id)) {
      const members = list.filter((e) => e.groups.includes(g));
      lists[g] = members.length ? members : [school];
    }
    return lists;
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
      let h = Math.min(56, WIDE_H * entry.scale);
      let w = (h * entry.w) / entry.h;
      const maxW = WIDE_MAX_W * Math.max(1, entry.scale);
      if (w > maxW) {
        w = maxW;
        h = (w * entry.h) / entry.w;
      }
      img.style.width = `${Math.round(w)}px`;
      img.style.height = `${Math.round(h)}px`;
      return img;
    }
    if (!model.name || !entry.label) return null;
    const span = document.createElement("span");
    span.className = "bug-plate__name";
    span.textContent = entry.label;
    return span;
  }

  function artNode(entry) {
    if (entry.wide) return null;
    return entry.kind === "school" ? artImage("./img/emblem-mark.png", 1) : artImage(entry.src, entry.scale);
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
    shown = entry;
    const art = artNode(entry);
    const node = plateNode(entry);
    const wasBadge = W.badge > 0;
    W.badge = art ? BADGE : 0;
    W.light = !!entry.wide;
    el.plate.classList.toggle("is-light", W.light);

    if (!animate) {
      swapArt(el.art, art, false);
      if (node) snapNode(el.plateSlot, node);
      else el.plateSlot.textContent = "";
      W.plate = plateWidth(node);
      return;
    }

    // Badge art
    swapArt(el.art, art, true);

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
  }

  function bugEntry() {
    if (model.bugGroup === "school") return school;
    const grp = groups[model.bugGroup];
    return grp?.list[grp.idx] || school;
  }

  /* ---------------- Logo groups ---------------- */

  function publish(g, force) {
    const grp = groups[g];
    if (!grp) return;
    const entry = grp.list[grp.idx] || school;
    if (entry.sig === grp.published && !force) return;
    grp.published = entry.sig;
    bus.post({
      type: "grouplogo",
      group: g,
      logo: entry.kind === "school" ? { key: "school", kind: "school" } : { key: entry.key, kind: "image", src: entry.src, scale: entry.scale }
    });
  }

  function scheduleGroup(g) {
    const grp = groups[g];
    if (!grp) return;
    clearTimeout(grp.timer);
    grp.timer = null;
    if (!grp.auto || grp.list.length < 2) return;
    grp.timer = setTimeout(() => stepGroup(g, 1), (grp.list[grp.idx].secs || grp.interval) * 1000);
  }

  function stepGroup(g, n) {
    const grp = groups[g];
    if (!grp || grp.list.length < 2) return;
    grp.idx = (grp.idx + n + grp.list.length * 10) % grp.list.length;
    publish(g);
    scheduleGroup(g);
    if (model.bugGroup === g) drawLogo(bugEntry(), visible);
  }

  // A graphic that just loaded asks who is around: tell it every group logo.
  bus.on((msg) => {
    if (msg.type === "hello") for (const g of groupIds) publish(g, true);
  });

  /* ---------------- Render ---------------- */

  function render(raw, opts) {
    const prev = model;
    model = {
      mode: raw.f0 in MODES ? raw.f0 : "none",
      event: raw.f1 || "",
      clock: raw.f2 !== "0" && raw.f2 !== "false",
      name: raw.f3 !== "0" && raw.f3 !== "false",
      bugGroup: logoGroup(raw.f6)
    };
    const live = opts.animate && visible;

    // Group carousels: keep showing the current logo if it is still listed.
    const library = libraryOf(raw);
    const lists = buildLogos(library);
    const nextIds = library.groups.map((group) => group.id);
    for (const g of groupIds) if (!nextIds.includes(g)) {
      clearTimeout(groups[g].timer);
      bus.post({ type: "grouplogo", group: g, logo: { key: "school", kind: "school" } });
      delete groups[g];
    }
    groupIds = nextIds;
    for (const group of library.groups) {
      const g = group.id;
      const grp = groups[g] ||= { list: [school], idx: 0, auto: true, interval: 8, timer: null, published: null };
      const cur = grp.list[grp.idx];
      const keep = cur ? lists[g].findIndex((e) => e.key === cur.key) : -1;
      grp.list = lists[g];
      grp.idx = keep >= 0 ? keep : 0;
      grp.auto = group.mode !== "manual";
      grp.interval = secsOf(group.interval) || 8;
      publish(g);
      scheduleGroup(g);
    }
    const entry = bugEntry();
    const redraw = !shown || shown.sig !== entry.sig || prev.name !== model.name;

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

  // Full-screen card or opener on air -> step aside; come back once it is leaving.
  const cover = { fullscreen: false, opener: false };
  for (const family of Object.keys(cover)) {
    bus.watch(family, (on, initial) => {
      cover[family] = on;
      ducked = cover.fullscreen || cover.opener;
      if (!initial) sync(ducked ? 0 : 260);
    });
  }

  setInterval(() => {
    const t = clockText();
    if (t !== time) setClock(t, visible);
  }, 1000);

  /* Manual switching, callable from SPX (button field / invoke) or a page. */
  /* Manual switching, called from SPX button fields (invoke) or a page:
     czGroupStep(g) advances logo group g; czLogoStep() the bug's own group. */
  window.czGroupStep = (g) => stepGroup(logoGroup(g), 1);
  window.czLogoStep = () => {
    if (model.bugGroup !== "school") stepGroup(model.bugGroup, 1);
  };

  setClock(clockText(), false);
  poseOff();

  window.CZ.graphic({
    family: "bug",
    defaults: { f0: "live", f1: "", f2: "1", f3: "1", f4: "", f5: "", f6: "1", f70: "auto", f71: "8", f72: "auto", f73: "8", f74: "auto", f75: "8", f76: "auto", f77: "8" },
    preload: ["./img/emblem-mark.png"],
    prepare(raw) {
      return Promise.all(libraryOf(raw).logos.filter((logo) => logo.src).map((logo) => measureImage(logo.src)));
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
      const state = {};
      for (const g of groupIds) state[g] = { list: groups[g].list, idx: groups[g].idx, auto: groups[g].auto, interval: groups[g].interval };
      return { model, school, groupIds, groups: state, rot };
    },
    restore(s) {
      if (s.model) model = s.model;
      if (s.school) school = s.school;
      groupIds = s.groupIds || Object.keys(s.groups || {});
      for (const g of groupIds) {
        const saved = s.groups && s.groups[g];
        if (!saved || !saved.list || !saved.list.length) continue;
        groups[g] ||= { list: [school], idx: 0, auto: true, interval: 8, timer: null, published: null };
        Object.assign(groups[g], { list: saved.list, idx: Math.min(saved.idx || 0, saved.list.length - 1), auto: saved.auto, interval: saved.interval });
        for (const e of saved.list) if (e.kind === "image") cache.set(e.src, { w: e.w, h: e.h });
        publish(g, true);
        scheduleGroup(g);
      }
      rot = s.rot || 0;
      const words = MODES[model.mode] || MODES.live;
      el.live.dataset.mode = model.mode;
      snap(el.eventSlot, model.event);
      snap(el.liveCn, words[0]);
      snap(el.liveEn, words[1]);
      drawLogo(bugEntry(), false);
      measureRight();
      wanted = true;
      if (ducked) return;
      visible = true;
      poseOn();
    }
  });
})();
