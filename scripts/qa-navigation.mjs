import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(import.meta.dirname, "..");
const pages = [
  { name: "home", file: resolve(projectRoot, "home/index.html"), route: "/home/index.html" },
  { name: "flexcel", file: resolve(projectRoot, "flexcel/index.html"), route: "/flexcel/index.html" },
  { name: "services", file: resolve(projectRoot, "services/index.html"), route: "/services/index.html" },
  { name: "about", file: resolve(projectRoot, "about/index.html"), route: "/about/index.html" },
  { name: "knowledge-hub", file: resolve(projectRoot, "knowledge-hub/index.html"), route: "/knowledge-hub/index.html" },
  { name: "privacy", file: resolve(projectRoot, "privacy/index.html"), route: "/privacy/index.html" }
];
const failures = [];
const staticAudit = [];
const externalUrls = new Set();

function cleanText(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function parseAnchors(html) {
  const anchors = [];
  const pattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const href = match[1].match(/\bhref="([^"]*)"/i)?.[1] ?? "";
    anchors.push({ href, label: cleanText(match[2]), sourceIndex: anchors.length });
  }
  return anchors;
}

async function fileExists(file) {
  try { await access(file); return true; } catch { return false; }
}

for (const page of pages) {
  const html = await readFile(page.file, "utf8");
  const anchors = parseAnchors(html);
  const records = [];

  for (const anchor of anchors) {
    const record = { ...anchor, category: "" };
    if (!anchor.href || anchor.href === "#") {
      failures.push(`${page.name}: empty/no-op href on “${anchor.label}”`);
      record.category = "invalid";
    } else if (/^https?:/i.test(anchor.href)) {
      record.category = "external";
      externalUrls.add(anchor.href);
    } else if (/^(tel|mailto):/i.test(anchor.href)) {
      record.category = "protocol";
      if (/^tel:/i.test(anchor.href) && !/^tel:\+\d{10,15}$/.test(anchor.href)) failures.push(`${page.name}: malformed telephone link ${anchor.href}`);
      if (/^mailto:/i.test(anchor.href) && !/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(anchor.href)) failures.push(`${page.name}: malformed email link ${anchor.href}`);
    } else {
      record.category = anchor.href.startsWith("#") ? "fragment" : "internal";
      const [pathPart, fragment = ""] = anchor.href.split("#");
      if (pathPart && /\/$/.test(pathPart)) failures.push(`${page.name}: folder-only route ${anchor.href}`);
      const targetFile = pathPart ? resolve(dirname(page.file), decodeURIComponent(pathPart)) : page.file;
      if (!(await fileExists(targetFile))) failures.push(`${page.name}: missing local target ${anchor.href}`);
      if (pathPart && extname(targetFile).toLowerCase() !== ".html") failures.push(`${page.name}: internal page link is not an explicit HTML file ${anchor.href}`);
      if (fragment && await fileExists(targetFile)) {
        const targetHtml = await readFile(targetFile, "utf8");
        const decoded = decodeURIComponent(fragment);
        if (!targetHtml.includes(`id="${decoded}"`)) failures.push(`${page.name}: missing fragment target ${anchor.href}`);
      }
    }
    records.push(record);
  }

  staticAudit.push({ page: page.name, anchors: records.length, records });
}

const rootHtml = await readFile(resolve(projectRoot, "index.html"), "utf8");
const refreshTarget = rootHtml.match(/http-equiv="refresh"\s+content="[^"]*url=([^";]+)"/i)?.[1]?.trim();
if (refreshTarget !== "./home/index.html") failures.push(`root: unsafe refresh target ${refreshTarget || "missing"}`);
if (!rootHtml.includes('href="./home/index.html"')) failures.push("root: fallback Home link is not explicit");

const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9950 + Math.floor(Math.random() * 40);
const profileDir = resolve(process.env.TEMP || projectRoot, `digiprod-navigation-profile-${Date.now()}`);
const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  "about:blank"
], { stdio: "ignore", windowsHide: true });

const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

async function retry(task, attempts = 40) {
  let error;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { return await task(); } catch (current) {
      error = current;
      await delay(150);
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
await new Promise((resolveSocket, rejectSocket) => {
  socket.addEventListener("open", resolveSocket, { once: true });
  socket.addEventListener("error", rejectSocket, { once: true });
});

let messageId = 0;
const pending = new Map();
const waiters = new Map();
let pageErrors = [];
let documentResponses = [];

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

  if (message.method === "Runtime.exceptionThrown") pageErrors.push(message.params.exceptionDetails.text || "Runtime exception");
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") pageErrors.push(message.params.entry.text);
  if (message.method === "Network.responseReceived" && message.params.type === "Document") {
    documentResponses.push({ url: message.params.response.url, status: message.params.response.status });
  }

  const listeners = waiters.get(message.method);
  if (listeners?.length) listeners.shift()(message.params);
});

function command(method, params = {}) {
  const id = ++messageId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolveCommand, rejectCommand) => pending.set(id, { resolve: resolveCommand, reject: rejectCommand }));
}

function waitEvent(method, timeout = 12000) {
  return new Promise((resolveEvent, rejectEvent) => {
    const timer = setTimeout(() => rejectEvent(new Error(`Timed out waiting for ${method}`)), timeout);
    const complete = (params) => { clearTimeout(timer); resolveEvent(params); };
    const listeners = waiters.get(method) || [];
    listeners.push(complete);
    waiters.set(method, listeners);
  });
}

async function evaluate(expression) {
  const response = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

async function navigate(url, width = 1440, reduceMotion = true) {
  pageErrors = [];
  documentResponses = [];
  await command("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: reduceMotion ? "reduce" : "no-preference" }]
  });
  await command("Emulation.setDeviceMetricsOverride", {
    width,
    height: width <= 430 ? 844 : 1000,
    deviceScaleFactor: 1,
    mobile: width <= 430,
    screenWidth: width,
    screenHeight: width <= 430 ? 844 : 1000
  });
  const loaded = waitEvent("Page.loadEventFired");
  await command("Page.navigate", { url });
  await loaded;
  await delay(140);
}

async function clickAndWait(index) {
  const loaded = waitEvent("Page.loadEventFired");
  await evaluate(`document.querySelectorAll('a')[${index}].click()`);
  await loaded;
  await delay(100);
}

function pageUrl(page, mode) {
  return mode === "http" ? `http://127.0.0.1:8080${page.route}` : pathToFileURL(page.file).href;
}

function expectedUrl(base, href) {
  return new URL(href, base).href;
}

async function pageState() {
  return evaluate(`(() => ({
    url: location.href,
    title: document.title,
    textLength: document.body?.innerText.trim().length || 0,
    directoryListing: /^Index of\b/i.test(document.title) || /^Index of\b/i.test(document.body?.innerText.trim() || ''),
    page: document.body?.dataset.page || '',
    hash: location.hash
  }))()`);
}

await command("Page.enable");
await command("Runtime.enable");
await command("Log.enable");
await command("Network.enable");

const browserAudit = [];

for (const mode of ["http", "file"]) {
  for (const page of pages) {
    const base = pageUrl(page, mode);
    await navigate(base);
    const links = await evaluate(`[...document.querySelectorAll('a')].map((link, index) => ({
      index,
      href: link.getAttribute('href') || '',
      label: link.textContent.trim().replace(/\\s+/g, ' '),
      option: link.dataset.enquiryOption || '',
      challenge: link.dataset.challenge || ''
    }))`);
    let fragmentClicks = 0;
    let internalClicks = 0;

    for (const link of links) {
      if (!link.href.startsWith("#") || link.href === "#") continue;
      const result = await evaluate(`(async () => {
        const link = document.querySelectorAll('a')[${link.index}];
        const selector = link.getAttribute('href');
        const target = document.querySelector(selector);
        document.documentElement.style.scrollBehavior = 'auto';
        link.click();
        await new Promise(resolve => setTimeout(resolve, 90));
        const rect = target.getBoundingClientRect();
        const form = document.querySelector('.enquiry-form');
        const active = document.activeElement;
        return {
          hash: location.hash,
          targetExists: Boolean(target),
          targetNearViewport: rect.bottom > 0 && rect.top < innerHeight,
          skipFocused: !link.classList.contains('skip-link') || active === target,
          enquiryFocused: selector !== '#enquiry' || (target.contains(active) && active.type !== 'hidden'),
          option: form?.elements.help_type?.value || '',
          challenge: form?.elements.primary_challenge?.value || '',
          context: form?.elements.cta_context?.value || ''
        };
      })()`);
      fragmentClicks += 1;
      if (!result.targetExists || result.hash !== link.href || !result.targetNearViewport) failures.push(`${mode}/${page.name}: fragment click failed for “${link.label}” (${link.href})`);
      if (!result.skipFocused) failures.push(`${mode}/${page.name}: skip link did not focus main`);
      if (!result.enquiryFocused) failures.push(`${mode}/${page.name}: enquiry CTA did not focus a visible field: “${link.label}”`);
      if (link.option && result.option !== link.option) failures.push(`${mode}/${page.name}: wrong enquiry option for “${link.label}”`);
      if (link.challenge && result.challenge !== link.challenge) failures.push(`${mode}/${page.name}: wrong challenge for “${link.label}”`);
      if (link.option && result.context !== link.label) failures.push(`${mode}/${page.name}: missing CTA context for “${link.label}”`);
      if (pageErrors.length) failures.push(`${mode}/${page.name}: errors after fragment click “${link.label}”: ${pageErrors.join("; ")}`);
    }

    const internalLinks = links.filter((link) => link.href && !link.href.startsWith("#") && !/^(https?:|tel:|mailto:)/i.test(link.href));
    await navigate(base);
    const dispatchedInternalClicks = await evaluate(`(() => {
      const indexes = ${JSON.stringify(internalLinks.map((link) => link.index))};
      let count = 0;
      const stopNavigation = event => {
        const link = event.target.closest('a');
        if (!link || !indexes.includes([...document.querySelectorAll('a')].indexOf(link))) return;
        event.preventDefault();
        count += 1;
      };
      document.addEventListener('click', stopNavigation, true);
      indexes.forEach(index => document.querySelectorAll('a')[index].click());
      document.removeEventListener('click', stopNavigation, true);
      return count;
    })()`);
    if (dispatchedInternalClicks !== internalLinks.length) failures.push(`${mode}/${page.name}: not every internal anchor dispatched a click`);

    const uniqueInternalLinks = [...new Map(internalLinks.map((link) => [link.href, link])).values()];
    for (const link of uniqueInternalLinks) {
      await navigate(base);
      await clickAndWait(link.index);
      const state = await pageState();
      const expected = expectedUrl(base, link.href);
      internalClicks += 1;
      if (state.url !== expected) failures.push(`${mode}/${page.name}: “${link.label}” went to ${state.url}, expected ${expected}`);
      if (state.directoryListing) failures.push(`${mode}/${page.name}: directory listing from “${link.label}”`);
      if (!state.title || state.textLength < 40) failures.push(`${mode}/${page.name}: blank destination from “${link.label}”`);
      if (mode === "http" && documentResponses.some((response) => response.status >= 400)) failures.push(`${mode}/${page.name}: HTTP error from “${link.label}”`);
      if (pageErrors.length) failures.push(`${mode}/${page.name}: errors after internal click “${link.label}”: ${pageErrors.join("; ")}`);
    }

    browserAudit.push({ mode, page: page.name, anchors: links.length, fragmentClicks, internalInstances: internalLinks.length, dispatchedInternalClicks, uniqueInternalDestinationsClicked: internalClicks });
  }
}

const rootAudit = [];
for (const mode of ["http", "file"]) {
  const url = mode === "http" ? "http://127.0.0.1:8080/index.html" : pathToFileURL(resolve(projectRoot, "index.html")).href;
  await navigate(url);
  await delay(250);
  const state = await pageState();
  rootAudit.push({ mode, state });
  if (!state.url.endsWith("/home/index.html") || state.directoryListing || !state.title || state.textLength < 40) failures.push(`${mode}: root redirect failed`);
}

const controls = [];
for (const page of pages) {
  await navigate(pageUrl(page, "http"), 390);
  const result = await evaluate(`(async () => {
    const menu = document.querySelector('.menu-toggle');
    menu.click();
    const menuOpened = menu.getAttribute('aria-expanded') === 'true' && menu.getAttribute('aria-label') === 'Close navigation menu';
    menu.click();
    const menuClosed = menu.getAttribute('aria-expanded') === 'false' && menu.getAttribute('aria-label') === 'Open navigation menu';

    const details = [...document.querySelectorAll('details')];
    let detailsPassed = 0;
    for (const detail of details) {
      const summary = detail.querySelector('summary');
      if (detail.open) summary.click();
      summary.click();
      if (detail.open) detailsPassed += 1;
      summary.click();
    }

    let tabsPassed = true;
    const afterTab = document.querySelector('#after-tab');
    if (afterTab) {
      afterTab.click();
      tabsPassed = afterTab.getAttribute('aria-selected') === 'true' && !document.querySelector('#after-panel').hidden;
    }

    const form = document.querySelector('.enquiry-form');
    let invalidPassed = true;
    let submitPassed = true;
    if (form) {
      const submit = form.querySelector('button[type="submit"]');
      submit.click();
      invalidPassed = form.querySelectorAll('[aria-invalid="true"]').length > 0;
      form.elements.name.value = 'Navigation QA';
      form.elements.whatsapp.value = '+91 9876543210';
      form.elements.email.value = 'qa@example.com';
      form.elements.company.value = 'QA Company';
      form.elements.business_size.value = '11-50';
      form.elements.primary_challenge.value = 'manual-work';
      if (!form.elements.help_type.value) form.elements.help_type.value = 'other';
      form.elements.consent.checked = true;
      [...form.querySelectorAll('input,select,textarea')].forEach(field => field.dispatchEvent(new Event('input', { bubbles: true })));
      submit.click();
      await new Promise(resolve => setTimeout(resolve, 820));
      submitPassed = form.querySelector('.form-status').classList.contains('is-success');
    }
    return {
      menuOpened,
      menuClosed,
      details: details.length,
      detailsPassed,
      tabsPassed,
      invalidPassed,
      hasForm: Boolean(form),
      submitPassed,
      buttonCount: document.querySelectorAll('button').length
    };
  })()`);
  controls.push({ page: page.name, ...result });
  if (!result.menuOpened || !result.menuClosed) failures.push(`${page.name}: mobile menu button failed`);
  if (result.details !== result.detailsPassed) failures.push(`${page.name}: one or more summary controls failed`);
  if (!result.tabsPassed) failures.push(`${page.name}: workflow tab buttons failed`);
  if (result.hasForm && (!result.invalidPassed || !result.submitPassed)) failures.push(`${page.name}: submit button states failed`);
  if (pageErrors.length) failures.push(`${page.name}: control test errors ${pageErrors.join("; ")}`);
}

async function historyTest(mode) {
  const home = pageUrl(pages[0], mode);
  await navigate(home);
  const loaded = waitEvent("Page.loadEventFired");
  await evaluate(`document.querySelector('.desktop-nav a[href="../flexcel/index.html"]').click()`);
  await loaded;
  await delay(120);
  let history = await command("Page.getNavigationHistory");
  const backEntry = history.entries[history.currentIndex - 1];
  await command("Page.navigateToHistoryEntry", { entryId: backEntry.id });
  await delay(450);
  const backState = await pageState();
  history = await command("Page.getNavigationHistory");
  const forwardEntry = history.entries.find((entry, index) => index > history.currentIndex && entry.url.includes("/flexcel/index.html"));
  await command("Page.navigateToHistoryEntry", { entryId: forwardEntry.id });
  await delay(450);
  const forwardState = await pageState();
  return { back: backState.page, forward: forwardState.page, backUrl: backState.url, forwardUrl: forwardState.url };
}

const historyAudit = [];
for (const mode of ["http", "file"]) {
  const result = await historyTest(mode);
  historyAudit.push({ mode, ...result });
  if (result.back !== "Home" || result.forward !== "Flexcel") failures.push(`${mode}: cross-page Back/Forward failed`);
}

await navigate(pageUrl(pages[0], "http"));
await evaluate(`document.querySelector('a[href="#workflow"]').click()`);
await delay(100);
await evaluate(`document.querySelector('.operation-hero__actions a[href="#enquiry"]').click()`);
await delay(100);
let fragmentHistory = await command("Page.getNavigationHistory");
const fragmentBack = fragmentHistory.entries[fragmentHistory.currentIndex - 1];
await command("Page.navigateToHistoryEntry", { entryId: fragmentBack.id });
await delay(250);
const fragmentBackHash = await evaluate("location.hash");
fragmentHistory = await command("Page.getNavigationHistory");
const fragmentForward = fragmentHistory.entries.find((entry, index) => index > fragmentHistory.currentIndex && entry.url.endsWith("#enquiry"));
await command("Page.navigateToHistoryEntry", { entryId: fragmentForward.id });
await delay(250);
const fragmentForwardHash = await evaluate("location.hash");
if (fragmentBackHash !== "#workflow" || fragmentForwardHash !== "#enquiry") failures.push("fragment Back/Forward history failed");

await navigate(pageUrl(pages[0], "http"), 1440, false);
const normalMotionEnquiryFocus = await evaluate(`(async () => {
  const link = document.querySelector('.operation-hero__actions a[href="#enquiry"]');
  link.click();
  await new Promise(resolve => setTimeout(resolve, 520));
  const target = document.querySelector('#enquiry');
  return target.contains(document.activeElement) && document.activeElement.type !== 'hidden';
})()`);
if (!normalMotionEnquiryFocus) failures.push("normal-motion enquiry focus failed");

const externalAudit = [];
for (const url of externalUrls) {
  try {
    const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
    externalAudit.push({ url, status: response.status, finalUrl: response.url });
    if (!response.ok) failures.push(`external link returned ${response.status}: ${url}`);
  } catch (error) {
    failures.push(`external link failed: ${url} (${error.message})`);
  }
}

const report = {
  failures,
  staticAudit: staticAudit.map((item) => ({ page: item.page, anchors: item.anchors })),
  browserAudit,
  rootAudit,
  controls,
  historyAudit,
  fragmentHistory: { back: fragmentBackHash, forward: fragmentForwardHash },
  normalMotionEnquiryFocus,
  externalAudit
};
await new Promise((resolveOutput) => process.stdout.write(`${JSON.stringify(report, null, 2)}\n`, resolveOutput));
socket.close();
chrome.kill();
await delay(150);
process.exit(failures.length ? 1 : 0);
