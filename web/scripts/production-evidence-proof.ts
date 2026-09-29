import { chromium, type Browser, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import jsQR from "jsqr";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE_URL = (process.env.SAAKSHYA_BASE_URL ?? "https://saakshya-web.vercel.app").replace(/\/$/, "");
const PRODUCTION_PROOF = process.env.PRODUCTION_PROOF === "1";
const PROJECT_ID = process.env.SAAKSHYA_PROOF_PROJECT_ID ?? "yamuna-green";
const SITE_ID = required("SAAKSHYA_PROOF_SITE_ID");
const BASELINE_ASSET_ID = required("SAAKSHYA_PROOF_BASELINE_ASSET_ID");
const FOLLOWUP_ASSET_ID = required("SAAKSHYA_PROOF_FOLLOWUP_ASSET_ID");
const VIDEO_IMPORT_ID = required("PUBLIC_VIDEO_IMPORT_ID");
const EXPECTED_QR = `${BASE_URL}/w/plot-d`;
const SOURCE_VIDEO = process.env.PUBLIC_VIDEO_PROOF_URL ?? "https://res.cloudinary.com/demo/video/upload/dog.mp4";
const DEPLOYMENT_SHA = process.env.SAAKSHYA_DEPLOYMENT_SHA ?? "unknown";
const ARTIFACT_DIR = join(process.cwd(), "artifacts", "production-evidence-proof");

type ConsoleIssue = { kind: "console" | "pageerror"; message: string; page: string };
type FixtureResult = {
  assetId: string;
  siteId: string | null;
  source: string | null;
  status: string | null;
  statusReason: string | null;
  flags: unknown[];
  decisionStatuses: string[];
};

const issues: ConsoleIssue[] = [];

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required proof target: ${name}`);
  return value;
}

function assertProductionOrigin() {
  const parsed = new URL(BASE_URL);
  if (PRODUCTION_PROOF && (parsed.protocol !== "https:" || /^(localhost|127\.|10\.|192\.168\.)/i.test(parsed.hostname))) {
    throw new Error(`Production proof requires a public HTTPS SAAKSHYA_BASE_URL; received ${BASE_URL}`);
  }
}

function assetPath(assetId: string) {
  return assetId.split("/").map(encodeURIComponent).join("/");
}

function attachDiagnostics(page: Page) {
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      issues.push({ kind: "console", message: message.text(), page: page.url() });
    }
  });
  page.on("pageerror", (error) => {
    issues.push({ kind: "pageerror", message: error.message, page: page.url() });
  });
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: join(ARTIFACT_DIR, `${name}.png`), fullPage: true });
}

async function getJson(page: Page, path: string) {
  const response = await page.request.get(`${BASE_URL}${path}`);
  if (!response.ok()) throw new Error(`${path} returned HTTP ${response.status()}`);
  return response.json() as Promise<any>;
}

async function verifyQr(browser: Browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  attachDiagnostics(page);
  await page.goto(`${BASE_URL}/plaque/plot-d`, { waitUntil: "networkidle" });

  const qr = page.locator("[data-witness-url]");
  await qr.waitFor();
  const encoded = await qr.getAttribute("data-witness-url");
  if (encoded !== EXPECTED_QR) throw new Error(`QR data-witness-url mismatch: ${encoded}`);
  const link = page.locator(`a[href="${EXPECTED_QR}"]`);
  if ((await link.count()) !== 1) throw new Error("The plaque does not expose exactly one canonical witness link.");

  const qrSvg = qr.locator("svg");
  const qrPng = await qrSvg.screenshot({ path: join(ARTIFACT_DIR, "qr-plot-d.png"), scale: "device" });
  const decoded = PNG.sync.read(qrPng);
  const result = jsQR(new Uint8ClampedArray(decoded.data), decoded.width, decoded.height);
  if (!result) throw new Error("Could not decode the rendered Plot D QR pixels.");
  if (result.data !== EXPECTED_QR) throw new Error(`Decoded QR mismatch: ${result.data}`);
  await screenshot(page, "qr-plaque");
  await page.close();
  return { encoded, decoded: result.data };
}

async function verifyMobileWitness(browser: Browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    permissions: ["camera"],
  });
  const page = await context.newPage();
  attachDiagnostics(page);
  await page.goto(`${BASE_URL}/w/plot-d`, { waitUntil: "networkidle" });
  const start = page.getByRole("button", { name: "Start camera" });
  await start.waitFor();
  await start.click();
  await page.waitForTimeout(2500);
  const liveCamera = await page.locator('button[aria-label="Take photo"]').isVisible().catch(() => false);
  const fallback = await page.getByRole("button", { name: "Take photo with camera" }).isVisible().catch(() => false);
  if (!liveCamera && !fallback) throw new Error("Witness page exposed neither a live camera action nor its explicit camera fallback.");
  await screenshot(page, "mobile-witness-camera");
  await context.close();
  return { liveCamera, fallback };
}

async function verifyFixture(page: Page, assetId: string): Promise<FixtureResult> {
  const data = await getJson(page, `/api/review/${assetPath(assetId)}`);
  const evidence = data.evidence;
  if (!evidence || evidence.assetId !== assetId) throw new Error(`Fixture ${assetId} was not returned by the review API.`);
  if (evidence.siteId !== SITE_ID) throw new Error(`Fixture ${assetId} belongs to ${evidence.siteId ?? "no site"}, expected ${SITE_ID}.`);
  if (!evidence.status || typeof evidence.status !== "string") throw new Error(`Fixture ${assetId} has no evidence status.`);
  const allowed = new Set(["accepted", "needs_review", "set_aside", "pending"]);
  if (!allowed.has(evidence.status)) throw new Error(`Fixture ${assetId} returned unsupported status ${evidence.status}.`);
  return {
    assetId,
    siteId: evidence.siteId,
    source: evidence.source,
    status: evidence.status,
    statusReason: evidence.statusReason,
    flags: evidence.flags ?? [],
    decisionStatuses: (data.decisions ?? []).map((decision: { status?: string }) => decision.status).filter(Boolean),
  };
}

async function verifyPhotoSurfaces(browser: Browser, baseline: FixtureResult, followup: FixtureResult) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  attachDiagnostics(page);
  const surfaces = [
    ["intake", "/intake", /Intake|baseline|followup/i],
    ["reading", `/sites/${encodeURIComponent(SITE_ID)}`, /BASELINE|CURRENT|reading|pending/i],
    ["review", "/review", /Review|needs review|pending|accepted/i],
    ["search", "/search", /Search Evidence|evidence/i],
  ] as const;
  const surfaceResults: Record<string, string> = {};
  for (const [name, path, expected] of surfaces) {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
    const text = await page.locator("body").innerText();
    if (!expected.test(text)) throw new Error(`${name} surface did not expose its expected evidence UI.`);
    surfaceResults[name] = text.slice(0, 4000);
    await screenshot(page, `surface-${name}`);
  }
  await page.goto(`${BASE_URL}/search`, { waitUntil: "networkidle" });
  const baselineCard = page.locator(`[role="button"]`).filter({ has: page.locator(`img[alt="${baseline.assetId}"]`) }).first();
  const followupCard = page.locator(`[role="button"]`).filter({ has: page.locator(`img[alt="${followup.assetId}"]`) }).first();
  if ((await baselineCard.count()) !== 1 || (await followupCard.count()) !== 1) {
    throw new Error("Search did not render both explicit photo fixture cards.");
  }
  await followupCard.click();
  await page.getByText(/Evidence receipt/i).waitFor({ timeout: 10000 }).catch(() => undefined);
  await screenshot(page, "receipt-photo-followup");
  await page.close();
  return surfaceResults;
}

async function verifyVideo(browser: Browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  attachDiagnostics(page);
  const result = await getJson(page, `/api/search?projectId=${encodeURIComponent(PROJECT_ID)}&siteId=${encodeURIComponent(SITE_ID)}&source=web_video`);
  const items = result.items ?? [];
  const frames = items.filter((item: any) => item.row?.videoImportId === VIDEO_IMPORT_ID);
  if (frames.length !== 3) throw new Error(`Expected exactly 3 frames for ${VIDEO_IMPORT_ID}; found ${frames.length}.`);
  for (const frame of frames) {
    if (frame.row.source !== "web_video") throw new Error(`Video frame ${frame.assetId} has source ${frame.row.source}.`);
    if (!(typeof frame.row.frameSecond === "number" && frame.row.frameSecond > 0)) throw new Error(`Video frame ${frame.assetId} has no offset.`);
    if (!String(frame.row.comment ?? "").includes(SOURCE_VIDEO)) throw new Error(`Video frame ${frame.assetId} lost source URL provenance.`);
  }
  const first = frames[0];
  const receipt = await getJson(page, `/api/review/${assetPath(first.assetId)}`);
  const imported = receipt.publicVideoImport;
  if (!imported || imported.id !== VIDEO_IMPORT_ID || imported.sourceUrl !== SOURCE_VIDEO) {
    throw new Error("Video receipt did not preserve the shared import source.");
  }
  const missing = new Set(receipt.evidence?.missingSignals ?? []);
  if (!missing.has("capture_time") || !missing.has("gps")) throw new Error("Video receipt did not preserve missing capture-time/GPS limitations.");

  await page.goto(`${BASE_URL}/search`, { waitUntil: "networkidle" });
  const card = page.locator(`[role="button"]`).filter({ has: page.locator(`img[alt="${first.assetId}"]`) }).first();
  if ((await card.count()) !== 1) throw new Error("Search did not render the imported video frame.");
  await card.click();
  await page.getByText(/capture time and GPS unavailable unless separately verified/i).waitFor({ timeout: 10000 });
  await screenshot(page, "receipt-public-video");
  await page.close();
  return {
    importId: VIDEO_IMPORT_ID,
    sourceUrl: imported.sourceUrl,
    frameCount: frames.length,
    frames: frames.map((frame: any) => ({ assetId: frame.assetId, frameSecond: frame.row.frameSecond, status: frame.row.status, missingSignals: frame.row.missingSignals })),
    receiptMissingSignals: [...missing],
  };
}

async function main() {
  assertProductionOrigin();
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const qr = await verifyQr(browser);
    const mobile = await verifyMobileWitness(browser);
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    attachDiagnostics(desktop);
    const baseline = await verifyFixture(desktop, BASELINE_ASSET_ID);
    const followup = await verifyFixture(desktop, FOLLOWUP_ASSET_ID);
    const surfaces = await verifyPhotoSurfaces(browser, baseline, followup);
    const video = await verifyVideo(browser);
    const output = {
      ok: true,
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      deploymentSha: DEPLOYMENT_SHA,
      qr,
      mobile,
      fixtures: { baseline, followup },
      surfaces: Object.fromEntries(Object.entries(surfaces).map(([key, value]) => [key, value.slice(0, 500)])),
      video,
      issues,
      artifacts: ARTIFACT_DIR,
    };
    await writeFile(join(ARTIFACT_DIR, "results.json"), JSON.stringify(output, null, 2));
    console.log(JSON.stringify(output, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch(async (error) => {
  const failure = { ok: false, generatedAt: new Date().toISOString(), baseUrl: BASE_URL, deploymentSha: DEPLOYMENT_SHA, error: error instanceof Error ? error.message : String(error), issues, artifacts: ARTIFACT_DIR };
  await mkdir(ARTIFACT_DIR, { recursive: true });
  await writeFile(join(ARTIFACT_DIR, "results.json"), JSON.stringify(failure, null, 2));
  console.error(JSON.stringify(failure, null, 2));
  process.exitCode = 1;
});
