/* Ticker crawl. Items are recycled one by one, so an update never restarts
   the crawl: text already on screen finishes, new items follow directly.
   On a same-layer re-take the crawl resumes at the exact position. */
(function () {
  "use strict";

  const { to, set, swap, snap, fit, current, M } = window.CZ;
  const $ = (id) => document.getElementById(id);
  const el = {
    label: $("label"),
    labelSlot: $("labelSlot"),
    icon: $("icon"),
    body: $("body"),
    vp: $("viewport"),
    track: $("track")
  };

  const FULL = 1920 - 96 * 2;
  const H = 64;
  const SPEEDS = { slow: 80, normal: 120, fast: 170 };

  let label = "";
  let items = [];
  let idx = 0;
  let x = 0;
  let speed = SPEEDS.normal;
  let running = false;
  let last = 0;
  let labelW = H;
  let visible = false;

  const vpWidth = () => bodyW() - 48;  // viewport insets: 20 + 28

  function parseItems(text) {
    return String(text || "")
      .split(/\r?\n|\s*\|\|\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function makeItem(text, width) {
    const item = document.createElement("span");
    item.className = "tk-item";
    const t = document.createElement("span");
    t.textContent = text;
    const sep = document.createElement("i");
    sep.className = "cz-spark tk-sep";
    item.append(t, sep);
    el.track.appendChild(item);
    item.style.width = `${width || Math.ceil(item.offsetWidth)}px`; // integer widths: exact recycling
    return item;
  }

  function trackWidth() {
    let w = 0;
    for (const child of el.track.children) w += child.offsetWidth;
    return w;
  }

  function fill() {
    if (!items.length) return;
    const need = vpWidth() + 480;
    let w = trackWidth();
    let guard = 0;
    while (x + w < need && guard < 200) {
      w += makeItem(items[idx % items.length]).offsetWidth;
      idx = (idx + 1) % items.length;
      guard += 1;
    }
  }

  /* Drop queued items that have not reached the screen yet. */
  function dropUnseen() {
    const limit = vpWidth();
    let left = x;
    for (const child of [...el.track.children]) {
      if (left > limit) child.remove();
      left += child.offsetWidth;
    }
  }

  function paint() {
    el.track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
  }

  function frame(ts) {
    if (!running) return;
    const dt = last ? Math.min(50, ts - last) : 16;
    last = ts;
    x -= (speed * dt) / 1000;
    let first = el.track.firstElementChild;
    while (first && x + first.offsetWidth < 0) {
      x += first.offsetWidth;
      first.remove();
      first = el.track.firstElementChild;
    }
    fill();
    paint();
    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    last = 0;
    requestAnimationFrame(frame);
  }

  function halt() {
    running = false;
  }

  function reset() {
    halt();
    el.track.textContent = "";
    idx = 0;
    x = vpWidth();
    paint();
  }

  function measureLabel() {
    const w = label ? fit(current(el.labelSlot), 260, 28, 22) : 0;
    labelW = label ? Math.ceil(w) + 56 + 30 : H;
  }

  function bodyW() {
    return FULL - labelW - 8;
  }

  function render(raw, opts) {
    const live = opts.animate && visible;
    const nextLabel = raw.f0 || "";
    const nextItems = parseItems(raw.f1);
    speed = SPEEDS[raw.f2] || SPEEDS.normal;

    if (live && nextLabel !== label) swap(el.labelSlot, nextLabel);
    else if (!live) snap(el.labelSlot, nextLabel);
    label = nextLabel;
    measureLabel();

    const changed = nextItems.join("\n") !== items.join("\n");
    items = nextItems;
    if (changed) {
      if (live) {
        dropUnseen();
        idx = 0;
        if (!el.track.children.length) x = vpWidth();
        fill();
      } else {
        reset();
      }
    }

    if (live) {
      to(el.label, { width: `${labelW}px` }, { m: "sd" });
      to(el.body, { width: `${bodyW()}px` }, { m: "sd" });
    }
  }

  function poseOff() {
    set(el.label, { width: `${H}px`, transform: "scale(0.4)", opacity: "0" });
    set(el.labelSlot, { opacity: "0", transform: "translateX(-12px)" });
    set(el.body, { width: "0px", opacity: "0" });
    set(el.vp, { opacity: "0" });
  }

  function poseOn() {
    set(el.label, { width: `${labelW}px`, transform: "scale(1)", opacity: "1" });
    set(el.labelSlot, { opacity: "1", transform: "translateX(0px)" });
    set(el.body, { width: `${bodyW()}px`, opacity: "1" });
    set(el.vp, { opacity: "1" });
  }

  function enter() {
    visible = true;
    if (!el.track.children.length) {
      x = vpWidth();
      fill();
      paint();
    }
    setTimeout(() => { if (visible) start(); }, 320);
    return Promise.all([
      to(el.label, { transform: "scale(1)" }, { m: "sf" }),
      to(el.label, { opacity: "1" }, { m: "ef" }),
      to(el.label, { width: `${labelW}px` }, { m: "sd", delay: 110 }),
      to(el.labelSlot, { transform: "translateX(0px)" }, { m: "sd", delay: 200 }),
      to(el.labelSlot, { opacity: "1" }, { m: "ed", delay: 200 }),
      to(el.body, { width: `${bodyW()}px` }, { m: "ss", delay: 150 }),
      to(el.body, { opacity: "1" }, { m: "ef", delay: 150 }),
      to(el.vp, { opacity: "1" }, { m: "es", delay: 300 })
    ]);
  }

  function exit() {
    visible = false;
    const a = M.acc;
    return Promise.all([
      to(el.vp, { opacity: "0" }, { m: a(160) }),
      to(el.body, { width: "0px" }, { m: a(300), delay: 60 }),
      to(el.body, { opacity: "0" }, { m: a(120), delay: 260 }),
      to(el.labelSlot, { opacity: "0" }, { m: a(120), delay: 100 }),
      to(el.labelSlot, { transform: "translateX(-12px)" }, { m: a(160), delay: 100 }),
      to(el.label, { width: `${H}px` }, { m: a(240), delay: 160 }),
      to(el.label, { transform: "scale(0.4)" }, { m: a(200), delay: 340 }),
      to(el.label, { opacity: "0" }, { m: a(150), delay: 380 })
    ]);
  }

  poseOff();

  window.CZ.graphic({
    family: "ticker",
    defaults: {
      f0: "校园快讯",
      f1: "欢迎收看江苏省常州高级中学直播\n第六十八届田径运动会今日上午八时开幕\n高一新生军训汇报表演将于下午两点举行\n本场直播由校学生会融媒体中心制作",
      f2: "normal"
    },
    render,
    enter,
    exit,
    idle() {
      poseOff();
      reset();
    },
    snapshot() {
      return {
        label,
        items,
        idx,
        x,
        speed,
        texts: [...el.track.children].map((c) => [c.firstChild.textContent, c.offsetWidth]),
        labelW
      };
    },
    restore(s, elapsed) {
      label = s.label || "";
      snap(el.labelSlot, label);
      items = s.items || [];
      speed = s.speed || speed;
      labelW = s.labelW || labelW;
      el.track.textContent = "";
      for (const [text, width] of s.texts || []) makeItem(text, width);
      idx = s.idx || 0;
      x = (s.x || 0) - (speed * elapsed) / 1000;
      let first = el.track.firstElementChild;
      while (first && x + first.offsetWidth < 0) {
        x += first.offsetWidth;
        first.remove();
        first = el.track.firstElementChild;
      }
      fill();
      paint();
      visible = true;
      poseOn();
      start();
    }
  });
})();
