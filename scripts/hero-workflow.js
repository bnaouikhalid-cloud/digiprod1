(function () {
  "use strict";

  const root = document.querySelector("[data-operation-flow]");
  if (!root) return;

  const map = root.querySelector("[data-operation-map]");
  const routes = root.querySelector("[data-operation-routes]");
  const route = root.querySelector("[data-operation-route]");
  const signal = root.querySelector("[data-operation-signal]");
  const nodes = Array.from(root.querySelectorAll("[data-operation-node]"));
  const ports = Array.from(root.querySelectorAll("[data-operation-port]"));
  const status = root.querySelector("[data-operation-status]");
  const toggle = root.querySelector("[data-operation-toggle]");
  const toggleLabel = toggle?.querySelector("b");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cycleDuration = 10500;

  let geometryFrame = 0;
  let playbackTimer = 0;
  let cycleStart = 0;
  let elapsed = 0;
  let currentStep = -2;
  let isIntersecting = false;
  let motionEnabled = false;
  let userPaused = false;

  const statusCopy = [
    "Order captured",
    "Excel updated",
    "Tally synchronized",
    "Data validated",
    "Approval triggered",
    "Live report updated"
  ];

  function updateGeometry() {
    geometryFrame = 0;
    if (!map || !routes || !route || !signal || ports.length < 2) return;

    const mapRect = map.getBoundingClientRect();
    if (mapRect.width < 2 || mapRect.height < 2) return;

    const points = ports.map(function (port) {
      const rect = port.getBoundingClientRect();
      return {
        x: rect.left - mapRect.left + rect.width / 2,
        y: rect.top - mapRect.top + rect.height / 2
      };
    });

    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const point = points[index];
      const middleY = (previous.y + point.y) / 2;
      path += ` C ${previous.x.toFixed(2)} ${middleY.toFixed(2)}, ${point.x.toFixed(2)} ${middleY.toFixed(2)}, ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    }

    routes.setAttribute("viewBox", `0 0 ${mapRect.width.toFixed(2)} ${mapRect.height.toFixed(2)}`);
    route.setAttribute("d", path);
    signal.setAttribute("d", path);
    root.classList.add("is-geometry-ready");
  }

  function scheduleGeometry() {
    if (geometryFrame) window.cancelAnimationFrame(geometryFrame);
    geometryFrame = window.requestAnimationFrame(updateGeometry);
  }

  function stepAt(time) {
    if (time < 350 || time >= 9850) return -1;
    if (time < 1650) return 0;
    if (time < 3050) return 1;
    if (time < 4450) return 2;
    if (time < 5950) return 3;
    if (time < 7450) return 4;
    if (time < 9000) return 5;
    return 6;
  }

  function applyStep(step) {
    if (step === currentStep) return;
    currentStep = step;
    root.dataset.activeStep = String(step);

    nodes.forEach(function (node, index) {
      node.classList.toggle("is-active", index === step);
      node.classList.toggle("is-complete", step >= nodes.length || index < step);
    });

    root.classList.toggle("is-cycle-complete", step >= nodes.length);
    root.classList.toggle("is-resetting", step < 0);

    if (!status) return;
    if (step < 0) status.textContent = "Ready for next order";
    else if (step >= nodes.length) status.textContent = "Workflow complete";
    else status.textContent = statusCopy[step];
  }

  function scheduleNextStep() {
    playbackTimer = 0;
    if (!root.classList.contains("is-running")) return;

    const now = performance.now();
    elapsed = (now - cycleStart) % cycleDuration;
    applyStep(stepAt(elapsed));

    const boundaries = [350, 1650, 3050, 4450, 5950, 7450, 9000, 9850, cycleDuration];
    const nextBoundary = boundaries.find(function (boundary) {
      return boundary > elapsed + 1;
    }) || cycleDuration;
    playbackTimer = window.setTimeout(scheduleNextStep, Math.max(16, nextBoundary - elapsed + 4));
  }

  function stopPlayback() {
    if (!playbackTimer) return;
    elapsed = (performance.now() - cycleStart) % cycleDuration;
    window.clearTimeout(playbackTimer);
    playbackTimer = 0;
  }

  function startPlayback() {
    if (playbackTimer) return;
    cycleStart = performance.now() - elapsed;
    scheduleNextStep();
  }

  function applyPlaybackState() {
    const shouldRun = motionEnabled && isIntersecting && !document.hidden && !userPaused;
    root.classList.toggle("is-running", shouldRun);

    if (!motionEnabled) {
      stopPlayback();
      root.dataset.flowMode = "static";
      return;
    }

    root.dataset.flowMode = shouldRun ? "running" : "paused";
    if (shouldRun) startPlayback();
    else stopPlayback();
  }

  function setMotionMode() {
    motionEnabled = !reducedMotion.matches && "IntersectionObserver" in window;
    root.classList.toggle("is-motion-ready", motionEnabled);
    root.classList.toggle("is-static", !motionEnabled);

    if (!motionEnabled) {
      elapsed = 0;
      applyStep(nodes.length);
      if (status) status.textContent = "All systems synchronized";
      if (toggle) toggle.disabled = true;
    } else {
      currentStep = -2;
      elapsed = 0;
      cycleStart = 0;
      applyStep(-1);
      if (toggle) toggle.disabled = false;
    }

    applyPlaybackState();
  }

  toggle?.addEventListener("click", function () {
    if (!motionEnabled) return;
    userPaused = !userPaused;
    toggle.setAttribute("aria-pressed", String(userPaused));
    toggle.setAttribute("aria-label", userPaused ? "Resume workflow animation" : "Pause workflow animation");
    if (toggleLabel) toggleLabel.textContent = userPaused ? "Play" : "Pause";
    applyPlaybackState();
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target !== root) return;
        isIntersecting = entry.isIntersecting && entry.intersectionRatio > 0.04;
        applyPlaybackState();
      });
    }, { threshold: [0, 0.05, 0.2, 0.5] });
    observer.observe(root);
  }

  if ("ResizeObserver" in window && map) {
    const resizeObserver = new ResizeObserver(scheduleGeometry);
    resizeObserver.observe(map);
  }

  document.addEventListener("visibilitychange", applyPlaybackState);
  window.addEventListener("resize", scheduleGeometry, { passive: true });

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", setMotionMode);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(setMotionMode);
  }

  if (document.fonts?.ready) document.fonts.ready.then(scheduleGeometry).catch(function () {});
  window.addEventListener("load", scheduleGeometry, { once: true });

  setMotionMode();
  scheduleGeometry();
})();
