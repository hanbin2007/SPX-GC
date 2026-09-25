/* ==========================================================================
   CZ · M3 broadcast engine
   - M3 Expressive spring motion (Web Animations API, interruptible per property)
   - Shared-axis text swaps, M3 shape polygons for clip-path morphing
   - SPX handlers (update / play / next / stop) behind a serial command queue
   - Seamless re-take: a graphic replaced on the same SPX layer continues from
     the previous instance's on-air state instead of cutting
   - Cross-layer bus (BroadcastChannel) so graphics can react to each other
   Requires Chromium 95+ (OBS 28+, CasparCG 2.4+). Springs use CSS linear()
   easing on Chromium 113+, with cubic-bezier fallbacks below that.
   ========================================================================== */
(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const root = document.documentElement;

  /* ------------------------------------------------------------------ */
  /* Motion                                                              */
  /* ------------------------------------------------------------------ */

  function springFn(zeta, k) {
    const w0 = Math.sqrt(k);
    if (zeta < 1) {
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      return (t) => 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
    }
    return (t) => 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  }

  const LINEAR_OK = typeof CSS !== "undefined" && CSS.supports && CSS.supports("transition-timing-function", "linear(0, 1)");

  // Same tokens as core/motion.css (see tools/gen-motion.js).
  const SPRINGS = {
    sf: [0.6, 800, "cubic-bezier(0.34, 1.45, 0.64, 1)"],
    sd: [0.8, 380, "cubic-bezier(0.22, 1.12, 0.36, 1)"],
    ss: [0.8, 200, "cubic-bezier(0.22, 1.1, 0.36, 1)"],
    ef: [1, 3800, "cubic-bezier(0.2, 0, 0, 1)"],
    ed: [1, 1600, "cubic-bezier(0.2, 0, 0, 1)"],
    es: [1, 800, "cubic-bezier(0.2, 0, 0, 1)"],
    sg: [0.86, 110, "cubic-bezier(0.16, 1.04, 0.3, 1)"]
  };

  const M = {};
  for (const [name, [zeta, k, fallback]] of Object.entries(SPRINGS)) {
    const fn = springFn(zeta, k);
    let settle = 0;
    for (let t = 0; t < 4; t += 0.001) if (Math.abs(1 - fn(t)) > 0.002) settle = t;
    settle += 0.001;
    const n = Math.max(28, Math.min(72, Math.round(settle * 90)));
    const pts = [];
    for (let i = 0; i <= n; i += 1) pts.push(i === n ? 1 : +fn((settle * i) / n).toFixed(4));
    M[name] = {
      duration: Math.round(settle * 1000),
      easing: LINEAR_OK ? `linear(${pts.join(", ")})` : fallback,
      fn: (p) => (p >= 1 ? 1 : fn(p * settle))
    };
  }

  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i += 1) {
        const dx = sx(t) - x;
        const d = (3 * ax * t + 2 * bx) * t + cx;
        if (Math.abs(dx) < 1e-5 || Math.abs(d) < 1e-6) break;
        t -= dx / d;
      }
      return sy(Math.min(1, Math.max(0, t)));
    };
  }

  const EASE = {
    acc: "cubic-bezier(0.3, 0, 0.8, 0.15)",   // emphasized accelerate (exits)
    dec: "cubic-bezier(0.05, 0.7, 0.1, 1)",   // emphasized decelerate (enters)
    std: "cubic-bezier(0.2, 0, 0, 1)",        // standard
    inout: "cubic-bezier(0.4, 0, 0.2, 1)"
  };
  M.acc = (duration = 240) => ({ duration, easing: EASE.acc, fn: bezier(0.3, 0, 0.8, 0.15) });
  M.dec = (duration = 450) => ({ duration, easing: EASE.dec, fn: bezier(0.05, 0.7, 0.1, 1) });
  M.std = (duration = 300) => ({ duration, easing: EASE.std, fn: bezier(0.2, 0, 0, 1) });
  M.inout = (duration = 500) => ({ duration, easing: EASE.inout, fn: bezier(0.4, 0, 0.2, 1) });

  function motion(m) {
    if (!m) return M.sd;
    return typeof m === "string" ? M[m] : m;
  }

  /* ------------------------------------------------------------------ */
  /* Interruptible per-property tweens                                   */
  /* Each property of each element owns at most one animation. Starting  */
  /* a new tween samples the current on-screen value, cancels the old    */
  /* animation and continues from there, so every choreography can be   */
  /* interrupted at any frame without jumps.                             */
  /* ------------------------------------------------------------------ */

  const RUNNING = new WeakMap();

  function tracks(el) {
    let map = RUNNING.get(el);
    if (!map) {
      map = new Map();
      RUNNING.set(el, map);
    }
    return map;
  }

  function to(el, props, opts = {}) {
    if (!el) return Promise.resolve();
    const m = motion(opts.m);
    const delay = Math.max(0, opts.delay || 0);
    const map = tracks(el);
    const cs = getComputedStyle(el);
    const from = {};
    for (const p of Object.keys(props)) from[p] = opts.from && p in opts.from ? opts.from[p] : cs[p];
    const jobs = [];
    for (const [p, value] of Object.entries(props)) {
      const prev = map.get(p);
      if (prev) prev.cancel();
      el.style[p] = value;
      if (from[p] === value && !opts.from) {
        map.delete(p);
        continue;
      }
      const anim = el.animate([{ [p]: from[p] }, { [p]: value }], {
        duration: m.duration,
        easing: m.easing,
        delay,
        fill: "backwards"
      });
      map.set(p, anim);
      jobs.push(anim.finished.then(() => {
        if (map.get(p) === anim) map.delete(p);
      }, () => {}));
    }
    return Promise.all(jobs);
  }

  function set(el, props) {
    if (!el) return;
    const map = tracks(el);
    for (const [p, value] of Object.entries(props)) {
      const prev = map.get(p);
      if (prev) prev.cancel();
      map.delete(p);
      el.style[p] = value;
    }
  }

  /* One-shot keyframe effect that does not own the property afterwards. */
  function pulse(el, keyframes, opts = {}) {
    if (!el) return Promise.resolve();
    const m = motion(opts.m);
    return el.animate(keyframes, {
      duration: opts.duration || m.duration,
      easing: opts.easing || m.easing,
      delay: opts.delay || 0,
      composite: opts.composite || "replace"
    }).finished.catch(() => {});
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /* ------------------------------------------------------------------ */
  /* Text                                                                */
  /* ------------------------------------------------------------------ */

  function decode(value) {
    if (value === undefined || value === null) return "";
    let s = String(value);
    if (/^(undefined|null)$/i.test(s.trim())) return "";
    if (s.indexOf("&") !== -1) {
      const t = document.createElement("textarea");
      t.innerHTML = s;
      s = t.value;
    }
    // SPX serializes textarea newlines as escaped <br> before playout.
    return s.replace(/<br\s*\/?>|\\n/gi, "\n").trim();
  }

  function current(slot) {
    return slot ? slot.querySelector(":scope > .cz-t:not(.is-leaving)") : null;
  }

  function slotText(slot) {
    const cur = current(slot);
    return cur ? cur.textContent : "";
  }

  function makeSpan(text) {
    const span = document.createElement("span");
    span.className = "cz-t";
    span.textContent = text;
    return span;
  }

  /* Replace text immediately. */
  function snap(slot, text) {
    if (!slot) return null;
    for (const child of [...slot.children]) {
      set(child, { transform: "", opacity: "" });
      child.remove();
    }
    const span = makeSpan(String(text));
    slot.appendChild(span);
    return span;
  }

  /* Shared-axis swap of any node: the outgoing one exits upward
     (accelerate), the incoming one rises from below with a spatial spring. */
  function swapNode(slot, node, opts = {}) {
    if (!slot) return null;
    const cur = current(slot);
    const dir = opts.dir || 1;
    const delay = opts.delay || 0;
    if (cur) {
      cur.classList.add("is-leaving");
      to(cur, { transform: `translateY(${-55 * dir}%)` }, { m: M.acc(200), delay });
      to(cur, { opacity: "0" }, { m: M.acc(110), delay }).then(() => cur.remove());
    }
    node.classList.add("cz-t");
    slot.appendChild(node);
    set(node, { transform: `translateY(${65 * dir}%)`, opacity: "0" });
    to(node, { transform: "translateY(0%)" }, { m: opts.m || "sd", delay: delay + 90 });
    to(node, { opacity: "1" }, { m: "ed", delay: delay + 90 });
    return node;
  }

  /* Replace a slot's content with a node immediately. */
  function snapNode(slot, node) {
    if (!slot) return null;
    for (const child of [...slot.children]) {
      set(child, { transform: "", opacity: "" });
      child.remove();
    }
    node.classList.add("cz-t");
    slot.appendChild(node);
    return node;
  }

  /* Shared-axis swap for text. */
  function swap(slot, text, opts = {}) {
    if (!slot) return null;
    text = String(text);
    const cur = current(slot);
    if (cur && cur.textContent === text && !opts.force) return cur;
    return swapNode(slot, makeSpan(text), opts);
  }

  /* Shrink a span's font until it fits maxWidth (then ellipsis). */
  function fit(span, maxWidth, base, min) {
    if (!span) return 0;
    let size = base;
    span.style.maxWidth = "none";
    span.style.fontSize = `${size}px`;
    while (span.scrollWidth > maxWidth && size > min) {
      size -= 1;
      span.style.fontSize = `${size}px`;
    }
    span.style.maxWidth = `${Math.ceil(maxWidth)}px`;
    return Math.min(span.scrollWidth, Math.ceil(maxWidth));
  }

  /* ------------------------------------------------------------------ */
  /* Shapes (M3 Expressive shape library, radial approximations).         */
  /* Every shape uses the same angular sampling, so any two shapes can   */
  /* morph into each other through clip-path interpolation.              */
  /* ------------------------------------------------------------------ */

  const SHAPES = {
    circle: () => 1,
    cookie12: (t) => 1 - 0.075 * (1 - Math.cos(12 * t)) / 2,
    cookie9: (t) => 1 - 0.1 * (1 - Math.cos(9 * t)) / 2,
    cookie6: (t) => 1 - 0.12 * (1 - Math.cos(6 * t)) / 2,
    sunny8: (t) => 1 - 0.14 * Math.pow((1 - Math.cos(8 * t)) / 2, 0.8),
    clover4: (t) => 1 - 0.36 * Math.pow((1 - Math.cos(4 * t)) / 2, 1.4),
    spark4: (t) => {
      // softened astroid: four-point sparkle with concave sides, rounded tips
      const p = 0.56;
      const r = 1 / Math.pow(Math.pow(Math.abs(Math.cos(t)), p) + Math.pow(Math.abs(Math.sin(t)), p), 1 / p);
      return Math.min(r, 0.9) / 0.9;
    },
    squircle: (t) => {
      const p = 5;
      return 1 / Math.pow(Math.pow(Math.abs(Math.cos(t)), p) + Math.pow(Math.abs(Math.sin(t)), p), 1 / p);
    }
  };
  const SHAPE_POINTS = 120;

  function shapePoints(name, opts = {}) {
    const fn = SHAPES[name] || SHAPES.circle;
    const n = opts.n || SHAPE_POINTS;
    const rot = ((opts.rot || 0) * Math.PI) / 180;
    const pts = [];
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const r = fn(a - rot);
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return pts;
  }

  /* Polygon in % of the element box (for element-sized clip-paths). */
  function shape(name, opts = {}) {
    const s = (opts.scale === undefined ? 1 : opts.scale) * 50;
    return `polygon(${shapePoints(name, opts).map(([x, y]) => `${(50 + x * s).toFixed(3)}% ${(50 + y * s).toFixed(3)}%`).join(", ")})`;
  }

  /* Polygon in px around (cx, cy) with radius r. With hole=true the result is
     a full-frame rectangle with the shape cut out (evenodd). */
  function shapePx(name, cx, cy, r, opts = {}) {
    const pts = shapePoints(name, opts).map(([x, y]) => `${(cx + x * r).toFixed(2)}px ${(cy + y * r).toFixed(2)}px`);
    if (!opts.hole) return `polygon(${pts.join(", ")})`;
    const w = opts.w || 1920, h = opts.h || 1080;
    return `polygon(evenodd, 0px 0px, ${w}px 0px, ${w}px ${h}px, 0px ${h}px, 0px 0px, ${pts.join(", ")}, ${pts[0]}, 0px 0px)`;
  }

  for (const name of Object.keys(SHAPES)) root.style.setProperty(`--shape-${name}`, shape(name));

  /* ------------------------------------------------------------------ */
  /* Resources                                                           */
  /* ------------------------------------------------------------------ */

  function timeout(promise, ms) {
    return Promise.race([promise, wait(ms)]);
  }

  function fonts(text) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const sample = `${text || ""}0123456789:`;
    return timeout(Promise.all([
      document.fonts.load('500 40px "CZ Hans"', sample),
      document.fonts.load('500 40px "CZ Latin"', sample)
    ]).catch(() => {}), 1500);
  }

  function images(extra = []) {
    const list = [...document.images].map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()));
    for (const src of extra) {
      const img = new Image();
      img.src = src;
      list.push(img.decode ? img.decode().catch(() => {}) : Promise.resolve());
    }
    return timeout(Promise.all(list), 1500);
  }

  /* ------------------------------------------------------------------ */
  /* Stage scaling                                                       */
  /* ------------------------------------------------------------------ */

  function fitStage() {
    const stage = document.querySelector(".stage");
    if (!stage) return;
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080) || 1;
    const x = (window.innerWidth - 1920 * scale) / 2;
    const y = (window.innerHeight - 1080 * scale) / 2;
    stage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }
  window.addEventListener("resize", fitStage);

  /* ------------------------------------------------------------------ */
  /* Bus: graphics in the same renderer (program or preview) talk here.  */
  /* ------------------------------------------------------------------ */

  const INSTANCE = Math.random().toString(36).slice(2, 10);

  function scopeName() {
    let top = "";
    try { top = window.top.location.pathname; } catch (error) { top = "x"; }
    let preview = params.get("preview") === "true" || /preview/i.test(top);
    try { if (new URLSearchParams(window.top.location.search).get("preview") === "true") preview = true; } catch (error) { /* cross-origin */ }
    return `czmd3:${preview ? "pvw" : "pgm"}:${top}`;
  }

  const bus = (() => {
    const peers = new Map();         // instance -> { family, on, t }
    const listeners = new Set();
    let channel = null;
    try { channel = new BroadcastChannel(scopeName()); } catch (error) { channel = null; }
    const self = { family: null, on: false };

    function emit(msg) {
      for (const fn of listeners) {
        try { fn(msg); } catch (error) { console.error(error); }
      }
    }

    function post(msg) {
      if (channel) channel.postMessage({ ...msg, from: INSTANCE });
    }

    function status() {
      if (self.family) post({ type: "status", family: self.family, on: self.on });
    }

    if (channel) {
      channel.onmessage = (event) => {
        const msg = event.data || {};
        if (msg.from === INSTANCE) return;
        if (msg.type === "hello") status();
        if (msg.type === "status") {
          const before = active(msg.family);
          peers.set(msg.from, { family: msg.family, on: !!msg.on, t: Date.now() });
          if (active(msg.family) !== before) emit({ type: "change", family: msg.family, on: active(msg.family) });
        }
        emit(msg);
      };
    }

    function active(family) {
      const now = Date.now();
      for (const peer of peers.values()) if (peer.family === family && peer.on && now - peer.t < 2600) return true;
      return false;
    }

    setInterval(() => {
      const now = Date.now();
      for (const [id, peer] of peers) {
        if (now - peer.t > 2600) {
          const before = active(peer.family);
          peers.delete(id);
          if (active(peer.family) !== before) emit({ type: "change", family: peer.family, on: false });
        }
      }
      if (self.on) status();
    }, 1000);

    post({ type: "hello" });

    return {
      post,
      active,
      on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
      announce(family, on) {
        self.family = family;
        if (self.on === on) return;
        self.on = on;
        status();
      },
      /* Calls fn(isOn) now and whenever the family's on-air state changes. */
      watch(family, fn) {
        fn(active(family), true);
        return this.on((msg) => {
          if (msg.type === "change" && msg.family === family) fn(msg.on, false);
        });
      }
    };
  })();

  /* ------------------------------------------------------------------ */
  /* Badge logos and the graphics logo group                             */
  /* The corner bug owns the logo library and publishes the group logo   */
  /* ({type: "grouplogo"}). Badges that follow the group swap together.  */
  /* ------------------------------------------------------------------ */

  function artImage(src, scale = 1) {
    const img = document.createElement("img");
    img.className = "cz-badge__emblem";
    img.alt = "";
    img.src = src;
    const size = 78 * Math.max(0.5, Math.min(1.2, scale || 1));
    img.style.inset = `${(100 - size) / 2}%`;
    img.style.width = `${size}%`;
    img.style.height = `${size}%`;
    return img;
  }

  /* Old art shrinks and turns away, new art pops in on the fast spring. */
  function swapArt(container, img, animate) {
    if (!animate) {
      container.textContent = "";
      if (img) container.appendChild(img);
      return;
    }
    for (const old of [...container.children]) {
      to(old, { transform: "scale(0.5) rotate(40deg)" }, { m: M.acc(200) });
      to(old, { opacity: "0" }, { m: M.acc(150) }).then(() => old.remove());
    }
    if (!img) return;
    container.appendChild(img);
    set(img, { transform: "scale(0.5) rotate(-40deg)", opacity: "0" });
    to(img, { transform: "scale(1) rotate(0deg)" }, { m: "sf", delay: 140 });
    to(img, { opacity: "1" }, { m: "ef", delay: 140 });
  }

  const LOGO_GROUPS = ["1", "2", "3", "4"];

  /* Operator value -> "1".."4" or "school" ("group" from older rundowns = "1"). */
  function logoGroup(value) {
    const v = String(value || "").trim();
    if (v === "school") return "school";
    return LOGO_GROUPS.includes(v) ? v : "1";
  }

  /**
   * Keeps a logo spot in step with a logo group (published by the bug).
   * opts = { art, fallback (school image), live(): bool, onChange(), make?(src, scale) }
   */
  function followLogo(opts) {
    const make = opts.make || artImage;
    const entries = {};         // group -> published logo (null = school)
    let mode = "1";
    let shownKey = null;

    function draw(animate) {
      const e = mode === "school" ? null : entries[mode];
      const img = e && e.kind !== "school" ? e : null;
      const k = img ? `${img.key}|${img.scale || 1}` : "school";
      if (k === shownKey) return;
      shownKey = k;
      swapArt(opts.art, make(img ? img.src : opts.fallback, img ? img.scale : 1), animate);
      if (animate && opts.onChange) opts.onChange();
    }

    bus.on((msg) => {
      if (msg.type !== "grouplogo") return;
      const group = String(msg.group);
      entries[group] = msg.logo || null;
      if (group === mode) draw(opts.live());
    });
    draw(false);

    return {
      setMode(next, animate) {
        mode = logoGroup(next);
        draw(animate);
      },
      snapshot: () => ({ entries }),
      restore(snap) {
        if (snap && snap.entries) Object.assign(entries, snap.entries);
        shownKey = null;
        draw(false);
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Graphic controller                                                  */
  /* ------------------------------------------------------------------ */

  function frameKey() {
    try {
      const frame = window.frameElement;
      if (frame) return frame.id || frame.name || "frame";
    } catch (error) { /* cross-origin parent */ }
    return "top";
  }

  function parse(data) {
    if (!data) return {};
    if (typeof data === "object") return data;
    try { return JSON.parse(data); } catch (error) {
      console.error("CZ: invalid template data", error);
      return {};
    }
  }

  /**
   * def = {
   *   family, defaults,
   *   render(raw, { animate, first }),   // apply data (animated when on air)
   *   enter(), exit()                    // return promises (resolve when settled)
   *   prepare?(raw)                      // async work before render (e.g. load images)
   *   next?(), snapshot?(), restore?(snap, elapsedMs), idle?(),
 *   oneShot?  // true: the graphic returns to idle when enter() settles
   * }
   */
  function graphic(def) {
    const key = `czmd3:take:${frameKey()}`;
    const g = {
      state: "off",
      raw: { ...def.defaults },
      gen: 0,
      touched: false
    };

    // Nothing runs before fonts and images are ready, so every measurement
    // uses final metrics. The off-air layout is re-measured once they are.
    let queue = timeout(Promise.all([fonts(Object.values(def.defaults || {}).join("")), images(def.preload || [])]), 2000)
      .then(() => (def.prepare ? timeout(def.prepare(g.raw), 2000) : null))
      .then(() => { if (g.state === "off") def.render(g.raw, { animate: false, first: false }); })
      .catch((error) => console.error("CZ:", error));
    function enqueue(fn) {
      queue = queue.then(fn).catch((error) => console.error("CZ:", error));
      return queue;
    }

    function saveSnapshot() {
      if (g.state !== "on" && g.state !== "in") return;
      try {
        sessionStorage.setItem(key, JSON.stringify({
          family: def.family,
          t: Date.now(),
          snap: def.snapshot ? def.snapshot() : null
        }));
      } catch (error) { /* storage unavailable */ }
    }

    function clearSnapshot() {
      try { sessionStorage.removeItem(key); } catch (error) { /* ignore */ }
    }

    let heartbeat = null;
    function beat(on) {
      clearInterval(heartbeat);
      heartbeat = on ? setInterval(saveSnapshot, 500) : null;
    }

    function enter() {
      const gen = ++g.gen;
      g.state = "in";
      bus.announce(def.family, true);
      beat(true);
      return Promise.resolve(def.enter()).then(() => {
        if (gen !== g.gen) return;
        if (!def.oneShot) {
          g.state = "on";
          return;
        }
        // Fire-and-forget graphics (SPX out: "none") return to idle by themselves.
        g.state = "off";
        bus.announce(def.family, false);
        beat(false);
        clearSnapshot();
        if (def.idle) def.idle();
      });
    }

    function exit() {
      const gen = ++g.gen;
      g.state = "out";
      bus.announce(def.family, false);
      beat(false);
      clearSnapshot();
      return Promise.resolve(def.exit()).then(() => {
        if (gen !== g.gen) return;
        g.state = "off";
        if (def.idle) def.idle();
      });
    }

    async function applyUpdate(data) {
      g.touched = true;
      const incoming = parse(data);
      const clean = {};
      for (const [k, v] of Object.entries(incoming)) {
        if (k === "comment" || k === "epochID") continue;
        clean[k] = decode(v);
      }
      g.raw = { ...g.raw, ...clean };
      await fonts(Object.values(g.raw).join(""));
      if (def.prepare) await timeout(def.prepare(g.raw), 2000);
      const live = g.state === "in" || g.state === "on";
      def.render(g.raw, { animate: live, first: false });
      if (live) saveSnapshot();
    }

    window.update = (data) => enqueue(() => applyUpdate(data));

    window.play = () => enqueue(() => {
      g.touched = true;
      if (g.state === "in" || g.state === "on") return;
      enter();
    });

    window.stop = () => enqueue(() => {
      g.touched = true;
      if (g.state === "off" || g.state === "out") return;
      exit();
    });

    window.next = () => enqueue(() => {
      g.touched = true;
      if ((g.state === "in" || g.state === "on") && def.next) {
        def.next();
        saveSnapshot();
      }
    });

    window.addEventListener("pagehide", saveSnapshot);

    // Initial render (synchronous, before first paint).
    fitStage();
    def.render(g.raw, { animate: false, first: true });

    // Seamless re-take: the previous graphic on this layer was on air a
    // moment ago and belongs to the same family -> continue from its state.
    let taken = null;
    try { taken = JSON.parse(sessionStorage.getItem(key) || "null"); } catch (error) { taken = null; }
    clearSnapshot();
    if (taken && taken.family === def.family && Date.now() - taken.t < 1500 && def.restore) {
      def.restore(taken.snap || {}, Date.now() - taken.t);
      g.state = "on";
      g.gen += 1;
      bus.announce(def.family, true);
      beat(true);
      // Nothing arrived (e.g. the layer was only reloaded): leave gracefully.
      setTimeout(() => { if (!g.touched) window.stop(); }, 1800);
      // Show the restored state only with its real fonts, never half-drawn.
      timeout(document.fonts ? document.fonts.ready : Promise.resolve(), 300)
        .then(() => root.classList.remove("cz-boot"));
    } else {
      root.classList.remove("cz-boot");
    }

    if (params.has("demo")) {
      enqueue(() => wait(250)).then(() => window.play());
    }

    return g;
  }

  window.CZ = {
    M, EASE, bezier, to, set, pulse, wait,
    decode, swap, snap, swapNode, snapNode, fit, slotText, current,
    SHAPES, shape, shapePx, shapePoints,
    fonts, images, bus, graphic, fitStage,
    artImage, swapArt, followLogo, logoGroup, LOGO_GROUPS,
    params
  };
})();
