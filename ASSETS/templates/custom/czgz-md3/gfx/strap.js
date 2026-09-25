/* Lower-third strap shared by CZ_NAME and CZ_CAPTION.
   Both map their fields onto one model { side, kicker, title, tag, sub }, so
   taking one after the other on the same layer morphs between them. */
(function () {
  "use strict";

  const { to, set, swap, snap, fit, current, M, bus } = window.CZ;

  const BADGE = 132;
  const BADGE_GAP = 10;
  const SEG = 8;
  const PAD_L = 38;
  const PAD_R = 96;
  const TAG_GAP = 18;
  const TAG_PAD = 18;
  const KICK_PAD = 34;
  const MIN_W = 300;
  const SAFE = 96;
  const COLLAPSED = 28;

  window.CZStrap = function (config) {
    const $ = (id) => document.getElementById(id);
    const el = {
      zone: $("zone"),
      strap: $("strap"),
      badge: $("badgeShape"),
      emblem: $("badgeEmblem"),
      kicker: $("kicker"),
      kickerIn: $("kickerIn"),
      kickerSlot: $("kickerSlot"),
      card: $("card"),
      deco: $("deco"),
      l1in: $("line1In"),
      title: $("title"),
      tag: $("tag"),
      tagSlot: $("tagSlot"),
      l2: $("line2"),
      l2in: $("line2In"),
      sub: $("sub")
    };

    const EMPTY = { side: "left", kicker: "", title: "", tag: "", sub: "", logo: "1" };
    let model = { ...EMPTY };
    let L = { kickerW: 0, tagW: 0, cardW: MIN_W };
    let rot = 0;
    let decoRot = 0;
    let visible = false;   // what the graphic is currently showing
    let sideToken = 0;
    let switching = false;
    let pending = null;

    const sign = () => (model.side === "right" ? -1 : 1);

    function applySide(side) {
      el.strap.classList.toggle("is-right", side === "right");
    }

    function measure(m) {
      let kickerW = 0;
      if (m.kicker) kickerW = Math.ceil(fit(current(el.kickerSlot), 320, 34, 26)) + KICK_PAD * 2;
      const maxCard = 1920 - SAFE * 2 - BADGE - BADGE_GAP - (kickerW ? kickerW + SEG : 0);
      let tagW = 0;
      if (m.tag) tagW = Math.ceil(fit(current(el.tagSlot), 300, 24, 20)) + TAG_PAD * 2;
      const titleMax = maxCard - PAD_L - PAD_R - (tagW ? tagW + TAG_GAP : 0);
      const titleW = fit(current(el.title), titleMax, 50, 36);
      const subW = m.sub ? fit(current(el.sub), maxCard - PAD_L - PAD_R, 30, 24) : 0;
      const content = Math.max(titleW + (tagW ? tagW + TAG_GAP : 0), subW);
      return {
        kickerW,
        tagW,
        cardW: Math.max(MIN_W, Math.min(maxCard, Math.ceil(content + PAD_L + PAD_R)))
      };
    }

    /* Geometry that follows content (animated while on air). */
    function layout(animate, delay = 0) {
      const apply = animate ? (node, props, opts) => to(node, props, opts) : (node, props) => set(node, props);
      const hasK = L.kickerW > 0;
      const hasT = L.tagW > 0;
      const hasS = !!model.sub;
      apply(el.tag, { width: `${L.tagW}px`, marginLeft: `${hasT ? TAG_GAP : 0}px` }, { m: "sd", delay });
      apply(el.l2, { height: `${hasS ? 40 : 0}px`, marginTop: `${hasS ? 4 : 0}px` }, { m: "sd", delay });
      if (visible) {
        apply(el.kicker, { width: `${L.kickerW}px`, [sign() > 0 ? "marginRight" : "marginLeft"]: `${hasK ? SEG : 0}px` }, { m: "sd", delay });
        apply(el.kicker, { opacity: hasK ? "1" : "0" }, { m: "ed", delay });
        apply(el.card, { width: `${L.cardW}px` }, { m: "sd", delay });
      }
    }

    function tick() {
      rot += 30;       // one scallop of the 12-sided cookie: lands on the same silhouette
      decoRot += 40;   // one lobe of the 9-sided cookie
      to(el.badge, { transform: `scale(1) rotate(${rot}deg)` }, { m: "sd" });
      to(el.deco, { transform: `rotate(${decoRot}deg) scale(1)` }, { m: "ss" });
    }

    function poseOff() {
      const s = sign();
      rot = 0;
      decoRot = 0;
      set(el.badge, { transform: "scale(0.3) rotate(-120deg)", opacity: "0" });
      set(el.emblem, { transform: "scale(0.5)", opacity: "0" });
      set(el.kicker, { width: "0px", marginRight: "0px", marginLeft: "0px", opacity: "0" });
      set(el.kickerIn, { transform: "translateY(100%)", opacity: "0" });
      set(el.card, { width: `${COLLAPSED}px`, opacity: "0", transform: `translateX(${-18 * s}px)` });
      set(el.deco, { transform: "rotate(-40deg) scale(0.6)", opacity: "0" });
      set(el.l1in, { transform: "translateY(100%)", opacity: "0" });
      set(el.l2in, { transform: "translateY(100%)", opacity: "0" });
      set(el.tag, { transform: "scale(0.4)", opacity: "0" });
    }

    function poseOn() {
      const hasK = L.kickerW > 0;
      set(el.badge, { transform: `scale(1) rotate(${rot}deg)`, opacity: "1" });
      set(el.emblem, { transform: "scale(1)", opacity: "1" });
      set(el.kicker, { width: `${L.kickerW}px`, opacity: hasK ? "1" : "0", marginRight: "0px", marginLeft: "0px" });
      set(el.kicker, { [sign() > 0 ? "marginRight" : "marginLeft"]: `${hasK ? SEG : 0}px` });
      set(el.kickerIn, { transform: "translateY(0%)", opacity: "1" });
      set(el.card, { width: `${L.cardW}px`, opacity: "1", transform: "translateX(0px)" });
      set(el.deco, { transform: `rotate(${decoRot}deg) scale(1)`, opacity: "1" });
      set(el.l1in, { transform: "translateY(0%)", opacity: "1" });
      set(el.l2in, { transform: "translateY(0%)", opacity: "1" });
      set(el.tag, { transform: "scale(1)", opacity: "1" });
    }

    function doEnter() {
      visible = true;
      const hasK = L.kickerW > 0;
      const tk = 80;
      const tc = hasK ? 160 : 100;
      const side = sign() > 0 ? "marginRight" : "marginLeft";
      return Promise.all([
        to(el.badge, { transform: `scale(1) rotate(${rot}deg)` }, { m: "sf" }),
        to(el.badge, { opacity: "1" }, { m: "ef" }),
        to(el.emblem, { transform: "scale(1)" }, { m: "sf", delay: 70 }),
        to(el.emblem, { opacity: "1" }, { m: "ef", delay: 70 }),
        to(el.kicker, { width: `${L.kickerW}px`, [side]: `${hasK ? SEG : 0}px` }, { m: "sd", delay: tk }),
        to(el.kicker, { opacity: hasK ? "1" : "0" }, { m: "ef", delay: tk }),
        to(el.kickerIn, { transform: "translateY(0%)" }, { m: "sd", delay: tk + 120 }),
        to(el.kickerIn, { opacity: "1" }, { m: "ed", delay: tk + 120 }),
        to(el.card, { width: `${L.cardW}px`, transform: "translateX(0px)" }, { m: "sd", delay: tc }),
        to(el.card, { opacity: "1" }, { m: "ef", delay: tc }),
        to(el.deco, { transform: `rotate(${decoRot}deg) scale(1)` }, { m: "ss", delay: tc + 80 }),
        to(el.deco, { opacity: "1" }, { m: "es", delay: tc + 80 }),
        to(el.l1in, { transform: "translateY(0%)" }, { m: "sd", delay: tc + 110 }),
        to(el.l1in, { opacity: "1" }, { m: "ed", delay: tc + 110 }),
        to(el.l2in, { transform: "translateY(0%)" }, { m: "sd", delay: tc + 170 }),
        to(el.l2in, { opacity: "1" }, { m: "ed", delay: tc + 170 }),
        to(el.tag, { transform: "scale(1)" }, { m: "sf", delay: tc + 240 }),
        to(el.tag, { opacity: "1" }, { m: "ef", delay: tc + 240 })
      ]);
    }

    function doExit() {
      visible = false;
      const a = M.acc;
      const s = sign();
      return Promise.all([
        to(el.l2in, { transform: "translateY(-70%)" }, { m: a(200) }),
        to(el.l2in, { opacity: "0" }, { m: a(150) }),
        to(el.tag, { transform: "scale(0.6)" }, { m: a(180), delay: 20 }),
        to(el.tag, { opacity: "0" }, { m: a(140), delay: 20 }),
        to(el.l1in, { transform: "translateY(-70%)" }, { m: a(200), delay: 40 }),
        to(el.l1in, { opacity: "0" }, { m: a(150), delay: 40 }),
        to(el.kickerIn, { transform: "translateY(-70%)" }, { m: a(200), delay: 40 }),
        to(el.kickerIn, { opacity: "0" }, { m: a(150), delay: 40 }),
        to(el.deco, { opacity: "0" }, { m: a(160) }),
        to(el.card, { width: `${COLLAPSED}px`, transform: `translateX(${-18 * s}px)` }, { m: a(280), delay: 90 }),
        to(el.card, { opacity: "0" }, { m: a(120), delay: 260 }),
        to(el.kicker, { width: "0px", marginRight: "0px", marginLeft: "0px" }, { m: a(260), delay: 130 }),
        to(el.kicker, { opacity: "0" }, { m: a(120), delay: 280 }),
        to(el.emblem, { transform: "scale(0.5)" }, { m: a(220), delay: 230 }),
        to(el.emblem, { opacity: "0" }, { m: a(160), delay: 270 }),
        to(el.badge, { transform: `scale(0.3) rotate(${rot + 90}deg)` }, { m: a(260), delay: 250 }),
        to(el.badge, { opacity: "0" }, { m: a(170), delay: 330 })
      ]);
    }

    function flushPending() {
      if (!switching) return;
      switching = false;
      const target = pending;
      pending = null;
      model = { ...EMPTY };
      renderModel(target, false);
    }

    function renderModel(next, animate) {
      const incoming = { ...EMPTY, ...next };
      if (switching) {
        pending = incoming;   // a side change is in flight; apply when it lands
        return;
      }
      const prev = model;
      const live = animate && visible;

      if (live && prev.side !== incoming.side) {
        // Changing sides on air: leave, flip, come back in.
        switching = true;
        pending = incoming;
        const token = ++sideToken;
        doExit().then(() => {
          if (token !== sideToken) return;
          flushPending();
          poseOff();
          doEnter();
        });
        return;
      }

      model = incoming;
      if (live) {
        if (prev.kicker !== model.kicker) swap(el.kickerSlot, model.kicker, { delay: 0 });
        if (prev.title !== model.title) swap(el.title, model.title, { delay: 30 });
        if (prev.tag !== model.tag) swap(el.tagSlot, model.tag, { delay: 60 });
        if (prev.sub !== model.sub) swap(el.sub, model.sub, { delay: 90 });
      } else {
        applySide(model.side);
        snap(el.kickerSlot, model.kicker);
        snap(el.title, model.title);
        snap(el.tagSlot, model.tag);
        snap(el.sub, model.sub);
      }

      badgeLogo.setMode(model.logo, live);
      L = measure(model);
      layout(live);
      if (live && ["kicker", "title", "tag", "sub"].some((k) => prev[k] !== model[k])) tick();
    }

    bus.watch("ticker", (on) => el.zone.classList.toggle("is-lifted", on));

    // Badge logo follows the chosen logo group (published by the corner bug).
    const badgeLogo = window.CZ.followLogo({
      art: el.emblem,
      fallback: "./img/emblem.png",
      live: () => visible,
      onChange: tick
    });

    poseOff();

    return window.CZ.graphic({
      family: "strap",
      defaults: config.defaults,
      render(raw, opts) {
        renderModel(config.model(raw), opts.animate);
      },
      enter() {
        sideToken += 1;
        if (switching) {
          flushPending();
          poseOff();
        }
        return doEnter();
      },
      exit() {
        sideToken += 1;
        return doExit().then(flushPending);
      },
      idle() {
        poseOff();
      },
      snapshot() {
        return { model, L, rot, decoRot, logo: badgeLogo.snapshot() };
      },
      restore(snapData) {
        badgeLogo.restore(snapData.logo);
        if (snapData.model) renderModel(snapData.model, false);
        if (snapData.L) L = snapData.L;
        rot = snapData.rot || 0;
        decoRot = snapData.decoRot || 0;
        visible = true;
        layout(false);
        poseOn();
      }
    });
  };
})();
