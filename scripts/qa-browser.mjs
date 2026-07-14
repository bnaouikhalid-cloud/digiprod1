import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9300 + Math.floor(Math.random() * 500);
const outputDir = join(tmpdir(), "digiprod-qa-cdp");
const profileDir = join(tmpdir(), `digiprod-qa-profile-${Date.now()}`);
await mkdir(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  "about:blank"
], { stdio: "ignore", windowsHide: true });

async function retry(task, attempts = 40) {
  let error;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { return await task(); } catch (current) {
      error = current;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  throw error;
}

const target = await retry(async () => {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  if (!response.ok) throw new Error(`Chrome target error ${response.status}`);
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
  if (message.method === "Log.entryAdded" && ["error", "warning"].includes(message.params.entry.level)) {
    pageErrors.push(`${message.params.entry.level}: ${message.params.entry.text}`);
  }

  const list = waiters.get(message.method);
  if (list?.length) list.shift()(message.params);
});

function command(method, params = {}) {
  const id = ++messageId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function waitEvent(method, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeout);
    const complete = (params) => { clearTimeout(timer); resolve(params); };
    const list = waiters.get(method) || [];
    list.push(complete);
    waiters.set(method, list);
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

async function navigate(url, width, height = 900) {
  pageErrors = [];
  await command("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width <= 430,
    screenWidth: width,
    screenHeight: height
  });
  const loaded = waitEvent("Page.loadEventFired");
  await command("Page.navigate", { url });
  await loaded;
  await evaluate("document.fonts.ready.then(() => new Promise(resolve => setTimeout(resolve, 180)))");
}

await command("Page.enable");
await command("Runtime.enable");
await command("Log.enable");

const base = "http://127.0.0.1:8080";
const pages = ["home", "flexcel", "services", "about", "knowledge-hub", "privacy"];
const widths = [360, 390, 430, 768, 1024, 1280, 1440, 1920];
const responsive = [];

for (const page of pages) {
  for (const width of widths) {
    await navigate(`${base}/${page}/`, width);
    const state = await evaluate(`(() => ({
      page: document.body.dataset.page,
      innerWidth: window.innerWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      h1Count: document.querySelectorAll('h1').length,
      duplicateIds: [...document.querySelectorAll('[id]')].map(el => el.id).filter((id, index, ids) => ids.indexOf(id) !== index),
      brokenImages: [...document.images].filter(img => !img.complete || !img.naturalWidth).map(img => img.src),
      menuVisible: getComputedStyle(document.querySelector('.menu-toggle')).display !== 'none',
      stickyBarVisibleMode: getComputedStyle(document.querySelector('.mobile-enquiry-bar')).display !== 'none',
      fonts: { outfit: document.fonts.check('16px Outfit'), inter: document.fonts.check('16px Inter') }
    }))()`);
    responsive.push({ ...state, width, errors: [...pageErrors] });
  }
}

const interactions = [];
for (const page of pages) {
  await navigate(`${base}/${page}/`, 390, 844);
  const menu = await evaluate(`(() => {
    const button = document.querySelector('.menu-toggle');
    button.click();
    const open = button.getAttribute('aria-expanded') === 'true' && document.querySelector('.mobile-drawer').classList.contains('is-open');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    const closed = button.getAttribute('aria-expanded') === 'false' && !document.querySelector('.mobile-drawer').classList.contains('is-open');
    return { open, closed };
  })()`);

  const form = await evaluate(`(async () => {
    const form = document.querySelector('.enquiry-form');
    if (!form) return { present: false };
    const trigger = document.querySelector('[data-enquiry-option]');
    trigger.click();
    const preselected = form.elements.help_type.value;
    form.requestSubmit();
    const invalidCount = form.querySelectorAll('[aria-invalid="true"]').length;
    form.elements.name.value = 'QA Test';
    form.elements.whatsapp.value = '+91 9876543210';
    form.elements.email.value = 'qa@example.com';
    form.elements.company.value = 'QA Company';
    form.elements.business_size.value = '11-50';
    form.elements.primary_challenge.value = 'manual-work';
    if (!form.elements.help_type.value) form.elements.help_type.value = 'other';
    form.elements.consent.checked = true;
    [...form.querySelectorAll('input,select,textarea')].forEach(field => field.dispatchEvent(new Event('input', { bubbles: true })));
    form.requestSubmit();
    await new Promise(resolve => setTimeout(resolve, 850));
    return {
      present: true,
      preselected,
      invalidCount,
      success: form.querySelector('.form-status').classList.contains('is-success'),
      source: form.elements.source_page.value,
      context: form.elements.cta_context.value,
      labelsValid: [...form.querySelectorAll('label[for]')].every(label => document.getElementById(label.htmlFor))
    };
  })()`);

  let tabs = null;
  if (page === "flexcel") {
    tabs = await evaluate(`(() => {
      const after = document.querySelector('#after-tab');
      after.click();
      return {
        selected: after.getAttribute('aria-selected') === 'true',
        afterVisible: !document.querySelector('#after-panel').hidden,
        beforeHidden: document.querySelector('#before-panel').hidden
      };
    })()`);
  }

  interactions.push({ page, menu, form, tabs, errors: [...pageErrors] });
}

for (const page of pages) {
  for (const [label, width, height] of [["desktop", 1440, 1000], ["mobile", 390, 844]]) {
    await navigate(`${base}/${page}/`, width, height);
    const screenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(join(outputDir, `${page}-${label}.png`), Buffer.from(screenshot.data, "base64"));
  }
}

const failures = [];
for (const item of responsive) {
  if (item.innerWidth !== item.width) failures.push(`${item.page} ${item.width}: innerWidth ${item.innerWidth}`);
  if (item.scrollWidth > item.clientWidth || item.bodyScrollWidth > item.clientWidth) failures.push(`${item.page} ${item.width}: horizontal overflow ${item.scrollWidth}/${item.bodyScrollWidth}`);
  if (item.h1Count !== 1) failures.push(`${item.page} ${item.width}: h1 count ${item.h1Count}`);
  if (item.duplicateIds.length) failures.push(`${item.page} ${item.width}: duplicate ids`);
  if (item.brokenImages.length) failures.push(`${item.page} ${item.width}: broken images`);
  if (!item.fonts.outfit || !item.fonts.inter) failures.push(`${item.page} ${item.width}: font load failed`);
  if (item.errors.length) failures.push(`${item.page} ${item.width}: console/runtime errors`);
  if ((item.width <= 1024) !== item.menuVisible) failures.push(`${item.page} ${item.width}: menu breakpoint mismatch`);
  if ((item.width <= 768) !== item.stickyBarVisibleMode) failures.push(`${item.page} ${item.width}: sticky CTA breakpoint mismatch`);
}
for (const item of interactions) {
  if (!item.menu.open || !item.menu.closed) failures.push(`${item.page}: mobile menu interaction failed`);
  if (item.form.present && !item.form.preselected) failures.push(`${item.page}: CTA preselection failed`);
  if (item.form.present && !item.form.invalidCount) failures.push(`${item.page}: form invalid state failed`);
  if (item.form.present && !item.form.success) failures.push(`${item.page}: form success state failed`);
  if (item.form.present && (!item.form.source || !item.form.context)) failures.push(`${item.page}: tracking fields failed`);
  if (item.form.present && !item.form.labelsValid) failures.push(`${item.page}: form label association failed`);
  if (item.errors.length) failures.push(`${item.page}: interaction errors`);
  if (item.tabs && (!item.tabs.selected || !item.tabs.afterVisible || !item.tabs.beforeHidden)) failures.push(`${item.page}: tabs failed`);
}

const report = { failures, responsive, interactions, screenshots: outputDir };
console.log(JSON.stringify(report, null, 2));

socket.close();
chrome.kill();
process.exitCode = failures.length ? 1 : 0;
