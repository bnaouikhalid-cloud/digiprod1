import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9800 + Math.floor(Math.random() * 100);
const outputDir = join(tmpdir(), "digiprod-operation-hero-qa");
const profileDir = join(tmpdir(), "digiprod-operation-hero-profile-" + Date.now());
await mkdir(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--remote-debugging-port=" + port,
  "--user-data-dir=" + profileDir,
  "about:blank"
], { stdio: "ignore", windowsHide: true });

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function retry(task, attempts = 40) {
  let error;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await task();
    } catch (current) {
      error = current;
      await delay(150);
    }
  }
  throw error;
}

const target = await retry(async () => {
  const response = await fetch("http://127.0.0.1:" + port + "/json/new?about:blank", { method: "PUT" });
  if (!response.ok) throw new Error("Chrome target error " + response.status);
  return response.json();
});

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let messageId = 0;
const pending = new Map();
const waiters = new Map();
let pageErrors = [];

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
    return;
  }

  if (message.method === "Runtime.exceptionThrown") {
    pageErrors.push(message.params.exceptionDetails.text || "Runtime exception");
  }
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
    pageErrors.push(message.params.entry.text);
  }

  const listeners = waiters.get(message.method);
  if (listeners?.length) listeners.shift()(message.params);
});

function command(method, params = {}) {
  const id = ++messageId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function waitEvent(method, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out waiting for " + method)), timeout);
    const complete = (params) => {
      clearTimeout(timer);
      resolve(params);
    };
    const listeners = waiters.get(method) || [];
    listeners.push(complete);
    waiters.set(method, listeners);
  });
}

async function evaluate(expression) {
  const response = await command("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

async function setReducedMotion(reduce) {
  await command("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }]
  });
}

async function navigate(width, reduce = false) {
  pageErrors = [];
  const height = width <= 430 ? 844 : 1000;
  await command("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width <= 430,
    screenWidth: width,
    screenHeight: height
  });
  await setReducedMotion(reduce);
  const loaded = waitEvent("Page.loadEventFired");
  await command("Page.navigate", { url: "http://127.0.0.1:8080/home/" });
  await loaded;
  await evaluate("document.fonts.ready.then(function () { return new Promise(function (resolve) { setTimeout(resolve, 260); }); })");
}

async function revealFlow() {
  await evaluate("(function () { var root = document.querySelector('[data-operation-flow]'); root.scrollIntoView({ block: 'center' }); return new Promise(function (resolve) { setTimeout(resolve, 480); }); })()");
}

async function captureFlow(name) {
  const clip = await evaluate("(function () { var rect = document.querySelector('[data-operation-flow]').getBoundingClientRect(); return { x: rect.left, y: rect.top + scrollY, width: rect.width, height: rect.height }; })()");
  const screenshot = await command("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { ...clip, scale: 1 }
  });
  await writeFile(join(outputDir, name), Buffer.from(screenshot.data, "base64"));
}

await command("Page.enable");
await command("Runtime.enable");
await command("Log.enable");

const widths = [360, 390, 430, 768, 1024, 1280, 1440, 1920];
const responsive = [];
const failures = [];

for (const width of widths) {
  await navigate(width);

  const cta = await evaluate("(function () { var element = document.querySelector('.operation-hero__actions .button--primary'); var rect = element.getBoundingClientRect(); var x = rect.left + rect.width / 2; var y = rect.top + rect.height / 2; var hit = y >= 0 && y <= innerHeight ? document.elementFromPoint(x, y) : null; return { visible: rect.width > 0 && rect.height > 0, inEarlyViewport: rect.top < innerHeight, hit: hit === element || element.contains(hit), label: element.textContent.trim(), href: element.getAttribute('href') }; })()");

  await revealFlow();
  const geometry = await evaluate("(function () { var root = document.querySelector('[data-operation-flow]'); var map = root.querySelector('[data-operation-map]'); var panelRect = root.getBoundingClientRect(); var mapRect = map.getBoundingClientRect(); var elements = Array.from(root.querySelectorAll('[data-operation-node]')); var nodes = elements.map(function (element) { var rect = element.getBoundingClientRect(); var label = element.querySelector('.operation-event__copy strong'); return { name: element.dataset.operationNode, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, clipped: element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1, labelClipped: label.scrollWidth > label.clientWidth + 1 }; }); var overlaps = []; for (var left = 0; left < nodes.length; left += 1) { for (var right = left + 1; right < nodes.length; right += 1) { var a = nodes[left]; var b = nodes[right]; var overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left); var overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); if (overlapWidth > 2 && overlapHeight > 2) overlaps.push(a.name + '/' + b.name); } } var flowAnimations = root.getAnimations({ subtree: true }).filter(function (animation) { return animation.animationName === 'operationSignal' || animation.animationName === 'operationSpineScan'; }); var path = root.querySelector('[data-operation-route]').getAttribute('d') || ''; var signal = root.querySelector('[data-operation-signal]').getAttribute('d') || ''; var traceStyle = getComputedStyle(root.querySelector('.operation-trace')); return { mode: root.dataset.flowMode, panel: { left: panelRect.left, right: panelRect.right, width: panelRect.width, height: panelRect.height }, mapHeight: mapRect.height, withinPanel: nodes.every(function (node) { return node.left >= panelRect.left - 2 && node.right <= panelRect.right + 2 && node.top >= panelRect.top - 2 && node.bottom <= panelRect.bottom + 2; }), clippedNodes: nodes.filter(function (node) { return node.clipped; }).map(function (node) { return node.name; }), clippedLabels: nodes.filter(function (node) { return node.labelClipped; }).map(function (node) { return node.name; }), overlaps: overlaps, routesReady: path.length > 20 && signal === path, runningAnimations: flowAnimations.filter(function (animation) { return animation.playState === 'running'; }).length, durations: flowAnimations.map(function (animation) { return animation.effect.getTiming().duration; }), columns: traceStyle.gridTemplateColumns.split(' ').length, documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, rootOverflow: root.scrollWidth > root.clientWidth + 1 }; })()");

  await setReducedMotion(true);
  await delay(100);
  await captureFlow("operation-hero-" + width + ".png");

  responsive.push({ width, cta, geometry, errors: [...pageErrors] });
  if (!cta.visible || !cta.inEarlyViewport || !cta.hit) failures.push(width + ": primary CTA is not visible and cleanly clickable early");
  if (cta.label !== "Find My Automation Opportunity" || cta.href !== "#enquiry") failures.push(width + ": primary CTA content or target changed");
  if (!geometry.withinPanel) failures.push(width + ": a workflow event falls outside the visual");
  if (geometry.clippedLabels.length) failures.push(width + ": cropped workflow labels " + geometry.clippedLabels.join(", "));
  if (geometry.overlaps.length) failures.push(width + ": overlapping workflow events " + geometry.overlaps.join(", "));
  if (!geometry.routesReady) failures.push(width + ": connected workflow route is not ready");
  if (geometry.mode !== "running" || geometry.runningAnimations !== 2) failures.push(width + ": expected two purposeful workflow animations while in view");
  if (geometry.durations.some(function (duration) { return duration !== 10500; })) failures.push(width + ": animation duration is not 10.5 seconds");
  if (width <= 768 && geometry.columns !== 1) failures.push(width + ": mobile/tablet trace is not a single vertical sequence");
  if (width >= 1024 && geometry.columns !== 2) failures.push(width + ": wide trace did not retain the two-sided operational composition");
  if (geometry.documentOverflow || geometry.rootOverflow) failures.push(width + ": horizontal overflow detected");
  if (pageErrors.length) failures.push(width + ": console/runtime errors " + pageErrors.join("; "));
}

await navigate(1440);
await revealFlow();
const sequence = await evaluate("(async function () { var root = document.querySelector('[data-operation-flow]'); var seen = []; var started = performance.now(); while (performance.now() - started < 10600) { var step = Number(root.dataset.activeStep); if (!seen.includes(step)) seen.push(step); await new Promise(function (resolve) { setTimeout(resolve, 60); }); } return seen; })()");
for (const expected of [0, 1, 2, 3, 4, 5, 6]) {
  if (!sequence.includes(expected)) failures.push("workflow sequence never reached step " + expected);
}
const ordered = [0, 1, 2, 3, 4, 5, 6].every(function (step, index, values) {
  if (index === 0) return true;
  return sequence.indexOf(values[index - 1]) < sequence.indexOf(step);
});
if (!ordered) failures.push("workflow stages did not run in the intended order");

await navigate(1440);
await revealFlow();
const manualPause = await evaluate("(async function () { var root = document.querySelector('[data-operation-flow]'); var button = root.querySelector('[data-operation-toggle]'); var animation = root.getAnimations({ subtree: true }).find(function (item) { return item.animationName === 'operationSignal'; }); button.click(); var pausedStep = root.dataset.activeStep; var pausedStart = animation.currentTime; await new Promise(function (resolve) { setTimeout(resolve, 620); }); var pausedEnd = animation.currentTime; var stillStep = root.dataset.activeStep; var pausedMode = root.dataset.flowMode; button.click(); await new Promise(function (resolve) { setTimeout(resolve, 720); }); return { pausedStep: pausedStep, stillStep: stillStep, pausedStart: pausedStart, pausedEnd: pausedEnd, resumedTime: animation.currentTime, pausedMode: pausedMode, resumedMode: root.dataset.flowMode, label: button.getAttribute('aria-label') }; })()");
if (manualPause.pausedMode !== "paused" || manualPause.resumedMode !== "running" || manualPause.pausedStep !== manualPause.stillStep || Math.abs(manualPause.pausedEnd - manualPause.pausedStart) > 35 || manualPause.resumedTime - manualPause.pausedEnd < 500 || manualPause.label !== "Pause workflow animation") {
  failures.push("manual pause/resume control failed");
}

const viewportPause = await evaluate("(async function () { var root = document.querySelector('[data-operation-flow]'); var animation = root.getAnimations({ subtree: true }).find(function (item) { return item.animationName === 'operationSignal'; }); document.querySelector('#workflow').scrollIntoView({ block: 'start' }); await new Promise(function (resolve) { setTimeout(resolve, 420); }); var pausedStart = animation.currentTime; var mode = root.dataset.flowMode; await new Promise(function (resolve) { setTimeout(resolve, 560); }); var pausedEnd = animation.currentTime; root.scrollIntoView({ block: 'center' }); await new Promise(function (resolve) { setTimeout(resolve, 720); }); return { mode: mode, pausedStart: pausedStart, pausedEnd: pausedEnd, resumedTime: animation.currentTime, resumedMode: root.dataset.flowMode }; })()");
if (viewportPause.mode !== "paused" || viewportPause.resumedMode !== "running" || Math.abs(viewportPause.pausedEnd - viewportPause.pausedStart) > 35 || viewportPause.resumedTime - viewportPause.pausedEnd < 250) {
  failures.push("offscreen pause/resume behavior failed");
}

const reduced = [];
for (const width of [390, 768, 1440]) {
  await navigate(width, true);
  await revealFlow();
  const state = await evaluate("(function () { var root = document.querySelector('[data-operation-flow]'); var button = root.querySelector('[data-operation-toggle]'); var nodes = Array.from(root.querySelectorAll('[data-operation-node]')); var path = root.querySelector('[data-operation-route]').getAttribute('d') || ''; return { width: innerWidth, mode: root.dataset.flowMode, step: Number(root.dataset.activeStep), completed: nodes.filter(function (node) { return node.classList.contains('is-complete'); }).length, running: root.getAnimations({ subtree: true }).filter(function (animation) { return animation.playState === 'running' && animation.effect.getTiming().iterations === Infinity; }).length, buttonHidden: getComputedStyle(button).display === 'none', buttonDisabled: button.disabled, routeReady: path.length > 20, completeVisible: Number.parseFloat(getComputedStyle(root.querySelector('[data-operation-complete]')).opacity) > 0.9 }; })()");
  reduced.push(state);
  if (state.mode !== "static" || state.step !== 6 || state.completed !== 6 || state.running || !state.buttonHidden || !state.buttonDisabled || !state.routeReady || !state.completeVisible) {
    failures.push(width + ": reduced-motion static workflow failed");
  }
}

await navigate(1440);
await revealFlow();
await evaluate("(function () { window.__operationHeroLayoutShift = 0; new PerformanceObserver(function (list) { list.getEntries().forEach(function (entry) { if (!entry.hadRecentInput) window.__operationHeroLayoutShift += entry.value; }); }).observe({ type: 'layout-shift' }); var rect = document.querySelector('[data-operation-flow]').getBoundingClientRect(); window.__operationHeroInitialRect = { width: rect.width, height: rect.height }; })()");
await delay(10800);
const stability = await evaluate("(function () { var root = document.querySelector('[data-operation-flow]'); var rect = root.getBoundingClientRect(); return { initial: window.__operationHeroInitialRect, final: { width: rect.width, height: rect.height }, cls: window.__operationHeroLayoutShift, mode: root.dataset.flowMode, step: Number(root.dataset.activeStep) }; })()");
if (Math.abs(stability.initial.width - stability.final.width) > 0.5 || Math.abs(stability.initial.height - stability.final.height) > 0.5 || stability.cls > 0.01 || pageErrors.length) {
  failures.push("full-loop layout stability or runtime check failed");
}

console.log(JSON.stringify({
  failures,
  responsive,
  sequence,
  manualPause,
  viewportPause,
  reduced,
  stability,
  screenshots: outputDir
}, null, 2));

socket.close();
chrome.kill();
process.exitCode = failures.length ? 1 : 0;
