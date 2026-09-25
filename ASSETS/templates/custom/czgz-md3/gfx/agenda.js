/* Agenda card. SPX "Continue" (next) advances the current item; the active
   indicator travels with a spatial spring and the finished item turns into a
   check. Updating the list on air cross-fades rows and springs the height. */
(function () {
  "use strict";

  const { to, set, swap, snap, fit, current, pulse, M } = window.CZ;
  const $ = (id) => document.getElementById(id);
  const el = {
    card: $("card"),
    head: $("head"),
    badge: $("badgeShape"),
    emblem: $("badgeEmblem"),
    title: $("title"),
    sub: $("sub"),
    count: $("count"),
    countNow: $("countNow"),
    countAll: $("countAll"),
    list: $("list"),
    ind: $("indicator"),
    indPill: $("indicatorPill")
  };

  const ROW = 76;
  const ROW_GAP = 4;
  const HEAD = 132;
  const PAD_BOTTOM = 18;
  const MAX_ROWS = 9;
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  let items = [];
  let cur = 0;           // 1-based current item, 0 = none, items.length + 1 = all done
  let visible = false;
  let rows = [];
  let rot = 0;
  let listToken = 0;

  function parseItems(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, MAX_ROWS)
      .map((line) => {
        const m = /^(.{1,12}?)\s*[|｜]\s*(.+)$/.exec(line);
        return m ? { time: m[1].trim(), text: m[2].trim() } : { time: "", text: line };
      });
  }

  function heightFor(n) {
    return HEAD + (n ? n * ROW + (n - 1) * ROW_GAP : 0) + PAD_BOTTOM;
  }

  function buildRows() {
    el.list.querySelectorAll(".ag-row").forEach((row) => row.remove());
    rows = items.map((item, i) => {
      const row = document.createElement("div");
      row.className = "ag-row";
      row.innerHTML = `<div class="ag-bubble"><span></span>${CHECK}</div>${item.time ? '<div class="ag-time"></div>' : ""}<div class="ag-text"></div>`;
      row.querySelector(".ag-bubble > span").textContent = String(i + 1);
      if (item.time) row.querySelector(".ag-time").textContent = item.time;
      row.querySelector(".ag-text").textContent = item.text;
      el.list.appendChild(row);
      return row;
    });
  }

  function rowTop(i) {
    return i * (ROW + ROW_GAP);
  }

  function applyStates(animate) {
    rows.forEach((row, i) => {
      row.classList.toggle("is-done", i + 1 < cur);
      row.classList.toggle("is-current", i + 1 === cur);
    });
    const hasCur = cur >= 1 && cur <= items.length;
    const f = animate ? to : (n, p) => set(n, p);
    if (hasCur) f(el.ind, { transform: `translateY(${rowTop(cur - 1)}px)` }, { m: "sd" });
    f(el.ind, { opacity: hasCur && visible ? "1" : "0" }, { m: "ed" });
    const now = String(Math.min(Math.max(cur, 0), items.length));
    if (animate) swap(el.countNow, now, { m: "sf" });
    else snap(el.countNow, now);
    if (animate) swap(el.countAll, `/ ${items.length}`);
    else snap(el.countAll, `/ ${items.length}`);
  }

  function rowsIn(delay) {
    rows.forEach((row, i) => {
      set(row, { transform: "translateY(18px)", opacity: "0" });
      to(row, { transform: "translateY(0px)" }, { m: "sd", delay: delay + i * 45 });
      to(row, { opacity: "1" }, { m: "ed", delay: delay + i * 45 });
    });
    return delay + rows.length * 45;
  }

  function render(raw, opts) {
    const live = opts.animate && visible;
    const nextItems = parseItems(raw.f2);
    const nextCur = Math.max(0, Math.min(nextItems.length + 1, parseInt(raw.f3, 10) || 0));
    const changed = JSON.stringify(nextItems) !== JSON.stringify(items);

    if (live) {
      swap(el.title, raw.f0 || "");
      swap(el.sub, raw.f1 || "", { delay: 40 });
    } else {
      snap(el.title, raw.f0 || "");
      snap(el.sub, raw.f1 || "");
    }
    fit(current(el.title), 380, 38, 30);
    fit(current(el.sub), 380, 24, 20);

    if (!changed) {
      if (nextCur !== cur) {
        cur = nextCur;
        applyStates(live);
        if (live) stretch();
      }
      return;
    }

    items = nextItems;
    cur = nextCur;
    if (!live) {
      buildRows();
      applyStates(false);
      set(el.card, { height: `${heightFor(items.length)}px` });
      return;
    }

    // On air: fade old rows, rebuild, spring the height, stagger new rows in.
    const token = ++listToken;
    rows.forEach((row, i) => {
      to(row, { opacity: "0" }, { m: M.acc(140), delay: i * 15 });
    });
    to(el.ind, { opacity: "0" }, { m: M.acc(120) });
    setTimeout(() => {
      if (token !== listToken || !visible) return;
      buildRows();
      applyStates(false);
      set(el.ind, { opacity: "0" });
      to(el.card, { height: `${heightFor(items.length)}px` }, { m: "sd" });
      const end = rowsIn(60);
      if (cur >= 1 && cur <= items.length) to(el.ind, { opacity: "1" }, { m: "ed", delay: end });
      rot += 30;
      to(el.badge, { transform: `scale(1) rotate(${rot}deg)` }, { m: "sd" });
    }, 180 + rows.length * 15);
  }

  function stretch() {
    pulse(el.indPill, [
      { transform: "scale(1, 1)" },
      { transform: "scale(0.96, 1.14)", offset: 0.35 },
      { transform: "scale(1, 1)" }
    ], { duration: 420, easing: "cubic-bezier(0.2, 0, 0, 1)" });
  }

  function clipFor(open) {
    const h = heightFor(items.length);
    const bottom = open ? 0 : Math.max(0, h - HEAD);
    return `inset(0px 0px ${bottom}px 0px round 42px)`;
  }

  function poseOff() {
    rot = 0;
    set(el.card, { transform: "translateX(64px) scale(0.96)", opacity: "0", clipPath: clipFor(false) });
    set(el.badge, { transform: "scale(0.3) rotate(-120deg)", opacity: "0" });
    set(el.emblem, { transform: "scale(0.5)", opacity: "0" });
    set(el.head.querySelector(".ag-heading"), { transform: "translateX(-16px)", opacity: "0" });
    set(el.count, { transform: "scale(0.4)", opacity: "0" });
    set(el.ind, { opacity: "0" });
    set(el.indPill, { transform: "scaleX(0.2)" });
    rows.forEach((row) => set(row, { transform: "translateY(18px)", opacity: "0" }));
  }

  function poseOn() {
    set(el.card, { transform: "translateX(0px) scale(1)", opacity: "1", clipPath: clipFor(true) });
    set(el.badge, { transform: `scale(1) rotate(${rot}deg)`, opacity: "1" });
    set(el.emblem, { transform: "scale(1)", opacity: "1" });
    set(el.head.querySelector(".ag-heading"), { transform: "translateX(0px)", opacity: "1" });
    set(el.count, { transform: "scale(1)", opacity: "1" });
    set(el.indPill, { transform: "scaleX(1)" });
    rows.forEach((row) => set(row, { transform: "translateY(0px)", opacity: "1" }));
    applyStates(false);
  }

  function enter() {
    visible = true;
    applyStates(false);
    set(el.ind, { opacity: "0" });
    const heading = el.head.querySelector(".ag-heading");
    const end = rowsIn(240);
    const hasCur = cur >= 1 && cur <= items.length;
    return Promise.all([
      to(el.card, { transform: "translateX(0px) scale(1)" }, { m: "sd" }),
      to(el.card, { opacity: "1" }, { m: "ef" }),
      to(el.card, { clipPath: clipFor(true) }, { m: M.dec(640), delay: 140 }),
      to(el.badge, { transform: `scale(1) rotate(${rot}deg)` }, { m: "sf", delay: 90 }),
      to(el.badge, { opacity: "1" }, { m: "ef", delay: 90 }),
      to(el.emblem, { transform: "scale(1)" }, { m: "sf", delay: 150 }),
      to(el.emblem, { opacity: "1" }, { m: "ef", delay: 150 }),
      to(heading, { transform: "translateX(0px)" }, { m: "sd", delay: 150 }),
      to(heading, { opacity: "1" }, { m: "ed", delay: 150 }),
      to(el.count, { transform: "scale(1)" }, { m: "sf", delay: 260 }),
      to(el.count, { opacity: "1" }, { m: "ef", delay: 260 }),
      to(el.ind, { opacity: hasCur ? "1" : "0" }, { m: "ed", delay: end }),
      to(el.indPill, { transform: "scaleX(1)" }, { m: "sf", delay: end })
    ]);
  }

  function exit() {
    visible = false;
    listToken += 1;
    const a = M.acc;
    const heading = el.head.querySelector(".ag-heading");
    const n = rows.length;
    const jobs = rows.map((row, i) => to(row, { opacity: "0" }, { m: a(130), delay: (n - 1 - i) * 18 }));
    jobs.push(
      to(el.ind, { opacity: "0" }, { m: a(120) }),
      to(el.card, { clipPath: clipFor(false) }, { m: a(300), delay: 80 + n * 10 }),
      to(el.count, { transform: "scale(0.4)" }, { m: a(200), delay: 200 }),
      to(el.count, { opacity: "0" }, { m: a(140), delay: 220 }),
      to(heading, { opacity: "0" }, { m: a(140), delay: 240 }),
      to(el.emblem, { opacity: "0" }, { m: a(140), delay: 260 }),
      to(el.badge, { transform: `scale(0.3) rotate(${rot + 90}deg)` }, { m: a(240), delay: 260 }),
      to(el.badge, { opacity: "0" }, { m: a(160), delay: 300 }),
      to(el.card, { transform: "translateX(64px) scale(0.96)" }, { m: a(260), delay: 320 }),
      to(el.card, { opacity: "0" }, { m: a(160), delay: 400 })
    );
    return Promise.all(jobs);
  }

  poseOff();

  window.CZ.graphic({
    family: "agenda",
    defaults: {
      f0: "今日议程",
      f1: "2026年秋季学期开学典礼",
      f2: "08:30 | 升国旗、奏唱国歌\n08:40 | 校长开学致辞\n09:00 | 优秀学生表彰\n09:20 | 教师代表发言\n09:35 | 新生代表发言\n09:50 | 校歌合唱",
      f3: "1"
    },
    render,
    enter,
    exit,
    next() {
      if (cur > items.length) return;
      cur += 1;
      applyStates(true);
      stretch();
    },
    idle: poseOff,
    snapshot() {
      return { items, cur, rot, raw: { f0: CZ.slotText(el.title), f1: CZ.slotText(el.sub) } };
    },
    restore(s) {
      items = s.items || [];
      cur = s.cur || 0;
      rot = s.rot || 0;
      snap(el.title, (s.raw && s.raw.f0) || "");
      snap(el.sub, (s.raw && s.raw.f1) || "");
      buildRows();
      set(el.card, { height: `${heightFor(items.length)}px` });
      visible = true;
      poseOn();
    }
  });
})();
