/* ==========================================================================
   NEWSLINE · Scene runtime
   --------------------------------------------------------------------------
   Implements the SPX "Scene + Transition Logic" model for classic SPX HTML
   templates (see docs.spxgraphics.com → Graphic Templates → Advanced →
   Scene and Transition Logic):

   · Scene            – state shared by every Newsline graphic on air. Each
                        controller broadcasts its state to its sibling layers
                        in the same renderer; every controller derives the
                        same scene environment from what it hears.
   · Item controller  – each template (HEADLINE, NAME, ...) is loaded into
                        an SPX layer and operated like any other graphic.
   · Scene actions    – the rules below, applied locally by each controller.

   Single-item transitions (same layer)
     1. update() while on air  → switch animation, never out-and-in.
     2. Same template played again on the same layer (SPX reloads the
        iframe) → the new page picks up the old one's picture and switches.
     3. next() → step animation (FULLSCREEN reveals points).

   Multi-item transitions (across layers)
     4. Exclusive slots: HEADLINE and NAME share the "lower" slot. The
        newcomer takes over and the incumbent hands off.
     5. Reserved space: while TICKER is on air, lower thirds and fullscreen
        content lift to clear it. The ticker makes room before it enters
        and gives the room back after it leaves.
     6. Suspension: while FULLSCREEN is on air, lower thirds step aside and
        come back when it leaves. Their SPX state is untouched.

   SPX call order (views/view-renderer.handlebars): on Play the renderer
   reloads the layer iframe, then calls update(json) and play() on load.
   Continue → next(). Stop → stop(). Edits while on air → update(json).
   ========================================================================== */
(function () {
  "use strict";

  const NS = "newsline/1";
  const ID = Math.random().toString(36).slice(2, 10);

  // One timing table for CSS and JS. 25 fps grid: 1 frame = 40 ms.
  const T = {
    frame: 40,
    draw: 440,     // signal line draws on
    unfold: 480,   // plates unfold from the line
    text: 560,     // text rises into place
    stagger: 80,
    out: 320,
    swap: 520,     // content switch
    morph: 560,    // plate width morph
    layout: 640,   // lift / settle for reserved space
    handoff: 200,  // slot takeover: newcomer starts while incumbent leaves
    room: 200,     // ticker: others start moving before it enters
    settle: 80,    // wait for sibling layers to answer hello
    carry: 800,    // max age of a same-layer continuity snapshot (SPX reloads in ~100–300 ms)
    fonts: 450     // max wait for web fonts before playing anyway
  };

  const root = document.documentElement;
  Object.entries(T).forEach(([k, v]) => root.style.setProperty(`--t-${k}`, `${v}ms`));

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  /* ------------------------------------------------------------------------
     Text helpers
     ------------------------------------------------------------------------ */
  const decoder = document.createElement("textarea");
  function clean(value) {
    if (value === undefined || value === null) return "";
    let s = String(value);
    if (s === "undefined" || s === "null") return "";
    if (s.includes("&")) { decoder.innerHTML = s; s = decoder.value; }
    return s.replace(/\r\n?/g, "\n").trim();
  }

  function parse(raw) {
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try { return JSON.parse(raw); }
    catch (err) { console.error("[newsline] invalid data from SPX", err, raw); return {}; }
  }

  /* Shrink a swap item's font size until it fits, then ellipsis. */
  function fit(item, { max, size, min, step = 2 }) {
    if (!max) return;
    let s = size;
    item.style.fontSize = `${s}px`;
    item.style.maxWidth = "none";
    while (item.offsetWidth > max && s > min) {
      s -= step;
      item.style.fontSize = `${s}px`;
    }
    if (item.offsetWidth > max) item.style.maxWidth = `${max}px`;
  }

  /* Push new text into a swap host. Old text exits upwards, new text rises
     from below, the host width morphs to the new width.
     opts.wrap: multi-line block text (no width morph). */
  function swap(host, value, opts = {}) {
    const text = clean(value);
    const animate = opts.animate !== false;
    if (opts.wrap) return swapBlock(host, text, animate);
    const current = [...host.children].find((n) => !n.classList.contains("is-exit"));
    if (current && current.dataset.text === text) {
      // same text: on an instant render re-measure (fonts may have arrived)
      if (!animate) {
        if (opts.fit) fit(current, opts.fit);
        host.classList.add("is-instant");
        host.style.width = `${text ? current.offsetWidth : 0}px`;
        void host.offsetWidth;
        host.classList.remove("is-instant");
      }
      return current;
    }

    const item = document.createElement("span");
    item.className = "nl-swap__item";
    item.dataset.text = text;
    item.textContent = text;
    if (animate && current) item.classList.add("is-enter");
    host.appendChild(item);
    if (opts.fit) fit(item, opts.fit);
    const width = text ? item.offsetWidth : 0;

    if (!animate || !current) {
      [...host.children].forEach((n) => { if (n !== item) n.remove(); });
      host.classList.add("is-instant");
      host.style.width = `${width}px`;
      void host.offsetWidth;
      host.classList.remove("is-instant");
      return item;
    }

    void item.offsetWidth;
    current.classList.add("is-exit");
    item.classList.remove("is-enter");
    host.style.width = `${width}px`;
    setTimeout(() => current.remove(), T.swap + T.frame);
    return item;
  }

  function swapBlock(host, text, animate) {
    host.classList.add("nl-swap--wrap");
    const current = [...host.children].find((n) => !n.classList.contains("is-exit"));
    if (current && current.dataset.text === text) return current;
    const item = document.createElement("span");
    item.className = "nl-swap__item";
    item.dataset.text = text;
    item.textContent = text;
    if (!animate || !current) {
      host.textContent = "";
      host.appendChild(item);
      return item;
    }
    item.classList.add("is-enter");
    host.appendChild(item);
    void item.offsetWidth;
    current.classList.add("is-exit");
    item.classList.remove("is-enter");
    setTimeout(() => current.remove(), T.swap + T.frame);
    return item;
  }

  /* Restart a one-shot CSS animation class. */
  function retrigger(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function fontsReady(text) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const sample = (text || "") + "0123456789:";
    const loads = [];
    for (const w of [500, 600, 700]) {
      loads.push(document.fonts.load(`${w} 40px "NL Latin"`, sample));
      if (w !== 600) loads.push(document.fonts.load(`${w} 40px "NL CJK"`, sample));
    }
    return Promise.race([Promise.all(loads).catch(() => {}), wait(T.fonts)]);
  }

  /* ------------------------------------------------------------------------
     Stage: scale the 1920×1080 design to the renderer viewport
     ------------------------------------------------------------------------ */
  function stage(el) {
    const resize = () => {
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080) || 1;
      const x = (window.innerWidth - 1920 * s) / 2;
      const y = (window.innerHeight - 1080 * s) / 2;
      el.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    };
    window.addEventListener("resize", resize);
    resize();
  }

  /* ------------------------------------------------------------------------
     Scene bus
     Inside the SPX web renderer every layer is a same-origin iframe, so the
     scene is exactly the set of sibling frames of one renderer: program,
     preview and OBS instances never talk to each other. Top-level pages
     (e.g. CasparCG HTML producers) fall back to a BroadcastChannel.
     ------------------------------------------------------------------------ */
  const framed = window.parent !== window;
  const layer = (() => {
    try { return framed ? (window.frameElement && window.frameElement.id) || "frame" : "top"; }
    catch (e) { return "frame"; }
  })();
  const scope = (() => {
    try { return framed ? window.parent.location.pathname + window.parent.location.search : location.pathname; }
    catch (e) { return "x"; }
  })();
  const carryKey = `newsline:carry:${scope}:${layer}`;
  const channel = !framed && "BroadcastChannel" in window ? new BroadcastChannel(NS) : null;

  function send(msg) {
    const packet = { ...msg, ns: NS, from: ID, layer };
    if (framed) {
      const frames = window.parent.frames;
      for (let i = 0; i < frames.length; i += 1) {
        if (frames[i] === window) continue;
        try { frames[i].postMessage(packet, "*"); } catch (e) { /* ignore */ }
      }
    } else if (channel) {
      channel.postMessage(packet);
    }
  }

  function listen(handler) {
    const accept = (data) => { if (data && data.ns === NS && data.from !== ID) handler(data); };
    window.addEventListener("message", (e) => accept(e.data));
    if (channel) channel.onmessage = (e) => accept(e.data);
  }

  /* ------------------------------------------------------------------------
     Controller
     ------------------------------------------------------------------------ */
  class Controller {
    /**
     * @param {object} o
     *   kind        unique graphic kind ("headline", "name", ...)
     *   root        element carrying data-show / data-motion
     *   defaults    default field values
     *   render(data, ctx)  apply data to the DOM; ctx.animate = on-air switch
     *   slot        optional exclusive slot name
     *   suspendOn   kinds whose presence suspends this graphic
     *   lift(env)   optional: px offset to clear reserved space
     *   reserve()   optional: {bottom} px this graphic occupies while shown
     *   enterMs / exitMs     total length of the in / out choreography
     *   enterDelay           wait after announcing before animating in
     *   releaseDelay         wait after starting out before releasing space
     *   onShow(shown, motion) / onEnv(env) / onNext(step, ctx) hooks
     */
    constructor(o) {
      this.o = o;
      this.kind = o.kind;
      this.slot = o.slot || null;
      this.el = o.root;
      this.data = { ...o.defaults };
      this.step = 0;
      this.playing = false;   // SPX state: between play() and stop()
      this.armed = false;     // play() finished its pre-roll
      this.shown = false;     // visual state
      this.suspended = false;
      this.peers = new Map();
      this.env = { reserveBottom: 0, fullscreen: false };
      this.gen = 0;
      this.motionTimer = null;

      this.el.dataset.show = "0";
      this.el.dataset.motion = "idle";
      this.el.style.setProperty("--lift", "0px");

      this.render(this.data, { animate: false });

      listen((m) => this.onMessage(m));
      this.settled = wait(T.settle);
      send({ type: "hello", ...this.snapshot() });
      window.addEventListener("pagehide", () => this.onPageHide());

      window.__newsline = this;
    }

    /* ---- scene state ---- */
    snapshot() {
      return {
        kind: this.kind,
        slot: this.slot,
        playing: this.playing,
        shown: this.shown,
        // space is claimed from the moment of intent, so others move first
        reserve: this.playing && !this.suspended && this.o.reserve ? this.o.reserve() : null
      };
    }

    publish() { send({ type: "state", ...this.snapshot() }); }

    onMessage(m) {
      if (m.type === "hello" || m.type === "state") {
        // a fresh page on a layer replaces whatever was there before
        if (m.layer !== "top") {
          for (const [id, p] of this.peers) if (p.layer === m.layer && id !== m.from) this.peers.delete(id);
        }
        this.peers.set(m.from, m);
        if (m.type === "hello") this.publish();
      } else if (m.type === "bye") {
        this.peers.delete(m.from);
      } else if (m.type === "yield") {
        if (this.slot && m.slot === this.slot && this.playing) this.handOff();
        return;
      }
      this.reconcile();
    }

    reconcile() {
      const peers = [...this.peers.values()];
      const reserveBottom = Math.max(0, ...peers.filter((p) => p.reserve).map((p) => p.reserve.bottom || 0));
      const fullscreen = peers.some((p) => p.kind === "fullscreen" && p.playing);
      const env = { reserveBottom, fullscreen };
      const changed = env.reserveBottom !== this.env.reserveBottom || env.fullscreen !== this.env.fullscreen;
      this.env = env;

      if (this.o.lift) this.el.style.setProperty("--lift", `${this.o.lift(env)}px`);
      if (changed && this.o.onEnv) this.o.onEnv.call(this, env);

      const suspended = (this.o.suspendOn || []).some((k) => peers.some((p) => p.kind === k && p.playing));
      if (suspended !== this.suspended) {
        this.suspended = suspended;
        this.sync(suspended ? "exit" : "enter");
      }
    }

    /* ---- visual state ---- */
    /* Returns false when nothing changed visually. */
    sync(motion) {
      const want = this.playing && this.armed && !this.suspended;
      if (want === this.shown) return false;
      this.shown = want;
      clearTimeout(this.motionTimer);
      this.el.dataset.motion = motion;
      this.el.dataset.show = want ? "1" : "0";
      if (this.o.onShow) this.o.onShow.call(this, want, motion);
      const total = want ? (this.o.enterMs || 1000) : (this.o.exitMs || 600);
      this.motionTimer = setTimeout(() => { this.el.dataset.motion = "idle"; }, total);

      if (!want && this.o.releaseDelay) {
        // leave first, then give the space back
        setTimeout(() => { if (!this.shown) this.publish(); }, this.o.releaseDelay);
      } else {
        this.publish();
      }
      return true;
    }

    cut(show) {
      clearTimeout(this.motionTimer);
      this.el.dataset.motion = "cut";
      this.el.dataset.show = show ? "1" : "0";
      this.shown = show;
      void this.el.offsetWidth;
      this.el.dataset.motion = "idle";
      if (this.o.onShow) this.o.onShow.call(this, show, "cut");
    }

    render(data, ctx) {
      this.o.render.call(this, data, { step: this.step, ...ctx });
    }

    /* ---- continuity across an SPX iframe reload ---- */
    onPageHide() {
      send({ type: "bye" });
      try {
        if (this.shown) {
          sessionStorage.setItem(carryKey, JSON.stringify({ kind: this.kind, data: this.data, step: this.step, t: Date.now() }));
        }
      } catch (e) { /* storage unavailable */ }
    }

    takeCarry() {
      try {
        const raw = sessionStorage.getItem(carryKey);
        sessionStorage.removeItem(carryKey);
        if (!raw) return null;
        const c = JSON.parse(raw);
        return c.kind === this.kind && Date.now() - c.t < T.carry ? c : null;
      } catch (e) { return null; }
    }

    handOff() {
      this.playing = false;
      this.armed = false;
      this.gen += 1;
      if (!this.sync("exit")) this.publish();
    }

    /* ---- SPX API ---- */
    async update(raw) {
      const incoming = parse(raw);
      const next = { ...this.data };
      Object.keys(incoming).forEach((k) => { next[k] = incoming[k]; });
      this.data = next;
      if (!this.shown) { this.render(next, { animate: false }); return; }
      const g = (this.updateGen = (this.updateGen || 0) + 1);
      await fontsReady(Object.values(next).join(""));
      if (g !== this.updateGen || this.data !== next) return;
      this.render(next, { animate: this.shown });
    }

    async play() {
      if (this.playing) return;
      this.playing = true;
      this.armed = false;
      this.step = 0;
      const g = (this.gen += 1);

      // 2. same-layer continuity. SPX reloaded this iframe while the same
      // graphic was on air: put the previous picture back in the very first
      // frame, then switch to the new content instead of re-entering.
      const carry = this.takeCarry();
      if (carry) {
        const fresh = this.data;
        this.step = carry.step || 0;
        this.render(carry.data, { animate: false });
        this.armed = true;
        this.cut(true);
        this.publish();
        this.claimSlot();
        await Promise.all([fontsReady(Object.values(carry.data).concat(Object.values(fresh)).join("")), nextFrame()]);
        if (g !== this.gen) return;
        this.render(carry.data, { animate: false });   // re-measure with real fonts
        this.step = 0;
        this.data = fresh;
        await nextFrame();
        if (g !== this.gen) return;
        this.render(fresh, { animate: true, fromCarry: true });
        return;
      }

      await Promise.all([fontsReady(Object.values(this.data).join("")), this.settled]);
      if (g !== this.gen) return;
      this.render(this.data, { animate: false });

      // 4. exclusive slot: ask the incumbent to leave and overlap the handoff
      let delay = this.claimSlot() ? T.handoff : 0;
      // announce intent first so other layers can make room or step aside
      this.publish();
      delay = Math.max(delay, this.o.enterDelay || 0);
      if (delay) await wait(delay);
      if (g !== this.gen) return;

      this.armed = true;
      if (!this.sync("enter")) this.publish();
    }

    claimSlot() {
      if (!this.slot) return false;
      const rivals = [...this.peers.values()].filter((p) => p.slot === this.slot && p.playing);
      if (rivals.length) send({ type: "yield", slot: this.slot });
      return rivals.some((p) => p.shown);
    }

    next() {
      if (!this.playing) return;
      this.step += 1;
      if (this.o.onNext) this.o.onNext.call(this, this.step, { animate: this.shown });
    }

    stop() {
      if (!this.playing) return;           // SPX best practice: no double stop
      this.playing = false;
      this.armed = false;
      this.gen += 1;
      if (!this.sync("exit")) this.publish(); // stopped during pre-roll
    }
  }

  /* ------------------------------------------------------------------------
     Public API
     ------------------------------------------------------------------------ */
  window.Newsline = {
    T,
    clean,
    swap,
    fit,
    retrigger,
    wait,
    stage,
    define(options) {
      const c = new Controller(options);
      window.update = (data) => c.update(data);
      window.play = () => c.play();
      window.next = () => c.next();
      window.stop = () => c.stop();
      const params = new URLSearchParams(location.search);
      if (params.has("autoplay")) requestAnimationFrame(() => c.play());
      return c;
    }
  };
})();
