/* Corner bug with live status and clock. Hides itself while a full-screen
   card is on air (the card carries the branding) and returns afterwards. */
(function () {
  "use strict";

  const { to, set, swap, snap, fit, current, M, bus } = window.CZ;
  const $ = (id) => document.getElementById(id);
  const el = {
    badge: $("badgeShape"),
    emblem: $("badgeEmblem"),
    plate: $("plate"),
    word: $("wordmark"),
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
  const PLATE_W = 26 + 198 + 30;

  let model = { mode: "live", event: "", clock: true, name: true };
  let W = { plate: PLATE_W, event: 0, live: 0, clock: 0 };
  let visible = false;
  let wanted = false;
  let ducked = false;
  let time = "";
  let rot = 0;

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

  function measure() {
    W.plate = model.name ? PLATE_W : 0;
    W.event = model.event ? Math.ceil(fit(current(el.eventSlot), 380, 28, 22)) + 52 : 0;
    W.live = model.mode in MODES ? Math.ceil(el.liveIn.offsetWidth) + 22 + 24 : 0;
    W.clock = model.clock ? Math.ceil(el.clockIn.offsetWidth) + 44 : 0;
    el.plate.classList.toggle("has-next", W.plate > 0 && W.event > 0);
    el.live.classList.toggle("is-alone", !W.clock);
    el.clock.classList.toggle("is-alone", !W.live);
  }

  /* Segment geometry: width + the gap that follows it. */
  function segs(animate, delay = 0) {
    const f = animate ? (n, p, o) => to(n, p, o) : (n, p) => set(n, p);
    f(el.plate, { width: `${W.plate}px`, marginRight: `${W.plate && W.event ? 8 : 0}px` }, { m: "sd", delay });
    f(el.plate, { opacity: W.plate ? "1" : "0" }, { m: "ed", delay });
    f(el.event, { width: `${W.event}px` }, { m: "sd", delay });
    f(el.event, { opacity: W.event ? "1" : "0" }, { m: "ed", delay });
    f(el.live, { width: `${W.live}px`, marginRight: `${W.live && W.clock ? 6 : 0}px` }, { m: "sd", delay });
    f(el.live, { opacity: W.live ? "1" : "0" }, { m: "ed", delay });
    f(el.clock, { width: `${W.clock}px` }, { m: "sd", delay });
    f(el.clock, { opacity: W.clock ? "1" : "0" }, { m: "ed", delay });
  }

  function render(raw, opts) {
    const prev = model;
    model = {
      mode: raw.f0 in MODES ? raw.f0 : "none",
      event: raw.f1 || "",
      clock: raw.f2 !== "0" && raw.f2 !== "false",
      name: raw.f3 !== "0" && raw.f3 !== "false"
    };
    const live = opts.animate && visible;
    const words = MODES[model.mode] || MODES[prev.mode] || MODES.live;
    el.live.dataset.mode = model.mode;
    if (live) {
      swap(el.eventSlot, model.event);
      swap(el.liveCn, words[0]);
      swap(el.liveEn, words[1], { delay: 40 });
    } else {
      snap(el.eventSlot, model.event);
      snap(el.liveCn, words[0]);
      snap(el.liveEn, words[1]);
    }
    measure();
    if (live) {
      segs(true);
      if (prev.event !== model.event || prev.mode !== model.mode) {
        rot += 30;
        to(el.badge, { transform: `scale(1) rotate(${rot}deg)` }, { m: "sd" });
      }
    }
  }

  function poseOff() {
    rot = 0;
    set(el.badge, { transform: "scale(0.3) rotate(-120deg)", opacity: "0" });
    set(el.emblem, { transform: "scale(0.5)", opacity: "0" });
    set(el.plate, { width: "0px", marginRight: "0px", opacity: "0" });
    set(el.word, { clipPath: "inset(0% 100% 0% 0%)" });
    set(el.event, { width: "0px", opacity: "0" });
    set(el.eventSlot, { transform: "translateY(100%)", opacity: "0" });
    set(el.live, { width: "52px", marginRight: "0px", opacity: "0", transform: "scale(0.4)" });
    set(el.liveIn, { opacity: "0" });
    set(el.clock, { width: "0px", opacity: "0" });
    set(el.clockIn, { transform: "translateY(100%)", opacity: "0" });
  }

  function poseOn() {
    set(el.badge, { transform: `scale(1) rotate(${rot}deg)`, opacity: "1" });
    set(el.emblem, { transform: "scale(1)", opacity: "1" });
    set(el.word, { clipPath: "inset(0% 0% 0% 0%)" });
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
    return Promise.all([
      to(el.badge, { transform: `scale(1) rotate(${rot}deg)` }, { m: "sf" }),
      to(el.badge, { opacity: "1" }, { m: "ef" }),
      to(el.emblem, { transform: "scale(1)" }, { m: "sf", delay: 70 }),
      to(el.emblem, { opacity: "1" }, { m: "ef", delay: 70 }),
      to(el.plate, { width: `${W.plate}px`, marginRight: `${W.plate && W.event ? 8 : 0}px` }, { m: "sd", delay: 100 }),
      to(el.plate, { opacity: W.plate ? "1" : "0" }, { m: "ef", delay: 100 }),
      to(el.word, { clipPath: "inset(0% 0% 0% 0%)" }, { m: M.dec(520), delay: 190 }),
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
      to(el.word, { clipPath: "inset(0% 100% 0% 0%)" }, { m: a(260), delay: 60 }),
      to(el.plate, { width: "0px", marginRight: "0px" }, { m: a(280), delay: 120 }),
      to(el.plate, { opacity: "0" }, { m: a(120), delay: 300 }),
      to(el.emblem, { transform: "scale(0.5)" }, { m: a(220), delay: 280 }),
      to(el.emblem, { opacity: "0" }, { m: a(160), delay: 320 }),
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

  setClock(clockText(), false);
  poseOff();

  window.CZ.graphic({
    family: "bug",
    defaults: { f0: "live", f1: "", f2: "1", f3: "1" },
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
      return { raw: model, rot };
    },
    restore(s) {
      const m = s.raw || model;
      render({ f0: m.mode, f1: m.event, f2: m.clock ? "1" : "0", f3: m.name ? "1" : "0" }, { animate: false });
      rot = s.rot || 0;
      wanted = true;
      if (ducked) return;
      visible = true;
      poseOn();
    }
  });
})();
