(function () {
  "use strict";

  const stage = document.getElementById("stage");
  const strap = document.getElementById("strap");
  const headline = document.getElementById("headline");
  const subline = document.getElementById("subline");
  const section = document.getElementById("section");
  const location = document.getElementById("location");
  const status = document.getElementById("status");
  const defaults = {
    f0: "要闻",
    f1: "城市更新计划发布，公共空间焕发新活力",
    f2: "聚焦民生与城市发展",
    f3: "北京",
    f4: "直播"
  };

  let current = { ...defaults };
  let switchTimer = null;
  let switchGeneration = 0;
  let playGeneration = 0;

  function fitHeadline() {
    let size = 52;
    headline.style.fontSize = `${size}px`;
    while (headline.scrollWidth > headline.clientWidth && size > 36) {
      size -= 1;
      headline.style.fontSize = `${size}px`;
    }
  }

  function applyData(data) {
    current = { ...defaults, ...data };
    section.textContent = String(current.f0 || "要闻");
    headline.textContent = String(current.f1 || "");
    subline.textContent = String(current.f2 || "");
    location.textContent = String(current.f3 || "");
    status.textContent = String(current.f4 || "报道");
    strap.classList.toggle("no-subline", !current.f2);
    strap.classList.toggle("is-live", current.f4 === "直播");
    fitHeadline();
  }

  function parseData(data) {
    if (!data) return {};
    if (typeof data === "object") return data;
    try { return JSON.parse(data); }
    catch (error) {
      console.error("Newsline: invalid SPX data", error);
      return {};
    }
  }

  function clearSwitch() {
    switchGeneration += 1;
    if (switchTimer !== null) clearTimeout(switchTimer);
    switchTimer = null;
    delete strap.dataset.switching;
  }

  function resizeStage() {
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    const x = (window.innerWidth - 1920 * scale) / 2;
    const y = (window.innerHeight - 1080 * scale) / 2;
    stage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }

  window.update = function (data) {
    const next = { ...current, ...parseData(data) };
    clearSwitch();
    if (strap.dataset.state !== "on") {
      applyData(next);
      return;
    }
    const generation = switchGeneration;
    strap.dataset.switching = "true";
    switchTimer = setTimeout(() => {
      if (generation !== switchGeneration) return;
      applyData(next);
      delete strap.dataset.switching;
      switchTimer = null;
    }, 155);
  };

  window.play = function () {
    if (strap.dataset.state === "on") return;
    clearSwitch();
    const generation = ++playGeneration;
    strap.dataset.state = "off";
    void strap.offsetWidth;
    requestAnimationFrame(() => {
      if (generation === playGeneration) strap.dataset.state = "on";
    });
  };

  window.stop = function () {
    playGeneration += 1;
    clearSwitch();
    strap.dataset.state = "off";
  };

  window.next = function () {};

  window.addEventListener("resize", resizeStage);
  applyData(defaults);
  resizeStage();

  if (new URLSearchParams(window.location.search).has("demo")) {
    requestAnimationFrame(() => window.play());
  }
})();
