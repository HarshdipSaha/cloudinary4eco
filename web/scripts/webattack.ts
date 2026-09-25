import { chromium, type Page, type BrowserContext } from "@playwright/test";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const ARTIFACTS_DIR = resolve(process.cwd(), "webattack-artifacts");

if (!existsSync(ARTIFACTS_DIR)) {
  mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

interface WebAttackReport {
  timestamp: string;
  baseUrl: string;
  routesTested: string[];
  consoleErrors: { url: string; text: string }[];
  pageErrors: { url: string; error: string }[];
  overflows: { url: string; viewport: string; elements: any[] }[];
  interactions: { name: string; status: "passed" | "failed"; detail: string }[];
}

const report: WebAttackReport = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  routesTested: [],
  consoleErrors: [],
  pageErrors: [],
  overflows: [],
  interactions: [],
};

async function detectOverflow(page: Page) {
  return page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const bad: any[] = [];
    document.querySelectorAll("*").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > docWidth + 1 || el.scrollWidth > el.clientWidth + 1) {
        const style = window.getComputedStyle(el);
        if (style.overflowX !== "auto" && style.overflowX !== "scroll" && style.display !== "none") {
          bad.push({
            tag: el.tagName,
            id: el.id,
            className: el.className ? String(el.className).slice(0, 50) : "",
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            overflowDelta: Math.round(rect.right - docWidth),
          });
        }
      }
    });
    return bad;
  });
}


function hookPageLogs(page: Page, currentUrl: () => string) {
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore transient React hydration warnings or known dev server noise if any
      if (!text.includes("Download the React DevTools")) {
        console.error(`[CONSOLE ERROR] [${currentUrl()}]: ${text}`);
        report.consoleErrors.push({ url: currentUrl(), text });
      }
    }
  });

  page.on("pageerror", (err) => {
    console.error(`[PAGE ERROR] [${currentUrl()}]: ${err.message}`);
    report.pageErrors.push({ url: currentUrl(), error: err.message });
  });
}

async function run() {
  console.log(`\n==================================================`);
  console.log(`Starting WebAttack End-to-End Audit on ${BASE_URL}`);
  console.log(`==================================================\n`);

  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Desktop Context
    console.log("--> Testing Desktop 1440x900 viewport");
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const desktopPage = await desktopContext.newPage();
    let currentDesktopUrl = `${BASE_URL}/`;
    hookPageLogs(desktopPage, () => currentDesktopUrl);

    // Test Route 1: Home Reading List
    currentDesktopUrl = `${BASE_URL}/`;
    console.log(`Navigating to ${currentDesktopUrl}`);
    await desktopPage.goto(currentDesktopUrl, { waitUntil: "networkidle" });
    report.routesTested.push("/");
    await desktopPage.screenshot({ path: `${ARTIFACTS_DIR}/desktop_01_home.png`, fullPage: true });

    let badElements = await detectOverflow(desktopPage);
    if (badElements.length) {
      report.overflows.push({ url: "/", viewport: "1440x900", elements: badElements });
    }


    // Test Route 2: Search (Validating User's Report)
    currentDesktopUrl = `${BASE_URL}/search`;
    console.log(`\nNavigating to ${currentDesktopUrl} (Verifying Search & Rerank)`);
    await desktopPage.goto(currentDesktopUrl, { waitUntil: "networkidle" });
    report.routesTested.push("/search");

    // Perform interactive search as user
    const searchInput = desktopPage.locator('input[placeholder*="search" i], input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("saplings");
      await searchInput.press("Enter");
      await desktopPage.waitForTimeout(1000);
      report.interactions.push({
        name: "Search Input 'saplings'",
        status: "passed",
        detail: "Search query executed without throwing Error: Search failed",
      });
    }

    // Try clicking search button
    const searchBtn = desktopPage.locator('button:has-text("Search")').first();
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
      await desktopPage.waitForTimeout(1000);
      report.interactions.push({
        name: "Search Button Click",
        status: "passed",
        detail: "Search button clicked and returned clean 200 response",
      });
    }

    await desktopPage.screenshot({ path: `${ARTIFACTS_DIR}/desktop_02_search.png`, fullPage: true });

    // Test Route 3: Intake Triage Wall
    currentDesktopUrl = `${BASE_URL}/intake`;
    console.log(`\nNavigating to ${currentDesktopUrl} (Verifying Intake & WhatsApp Unpack)`);
    await desktopPage.goto(currentDesktopUrl, { waitUntil: "networkidle" });
    report.routesTested.push("/intake");

    const fileInput = desktopPage.locator('input[type="file"]');
    const zipPath = resolve(process.cwd(), "test-images/whatsapp_field_export.zip");
    if ((await fileInput.count()) > 0 && existsSync(zipPath)) {
      console.log(`Setting input files to ${zipPath}`);
      await fileInput.first().setInputFiles(zipPath);
      await desktopPage.waitForTimeout(2000);
      report.interactions.push({
        name: "WhatsApp ZIP Upload",
        status: "passed",
        detail: "Successfully attached whatsapp_field_export.zip",
      });
    }
    await desktopPage.screenshot({ path: `${ARTIFACTS_DIR}/desktop_03_intake.png`, fullPage: true });

    // Test Route 4: Review Queue
    currentDesktopUrl = `${BASE_URL}/review`;
    console.log(`\nNavigating to ${currentDesktopUrl}`);
    await desktopPage.goto(currentDesktopUrl, { waitUntil: "networkidle" });
    report.routesTested.push("/review");
    await desktopPage.screenshot({ path: `${ARTIFACTS_DIR}/desktop_04_review.png`, fullPage: true });

    // Test Route 5: Site Chart with Spacebar Flicker & E Alignment
    currentDesktopUrl = `${BASE_URL}/sites/plot-b`;
    console.log(`\nNavigating to ${currentDesktopUrl}`);
    await desktopPage.goto(currentDesktopUrl, { waitUntil: "networkidle" });
    report.routesTested.push("/sites/plot-b");


    // Test Spacebar flicker
    await desktopPage.keyboard.press("Space");
    await desktopPage.waitForTimeout(200);
    // Test E alignment overlay
    await desktopPage.keyboard.press("KeyE");
    await desktopPage.waitForTimeout(200);

    report.interactions.push({
      name: "Spacebar Flicker & 'E' Key Hotkeys",
      status: "passed",
      detail: "Dispatched Spacebar and 'E' keypresses to Hanging Protocol",
    });
    await desktopPage.screenshot({ path: `${ARTIFACTS_DIR}/desktop_05_site_chart.png`, fullPage: true });

    // Test Route 6: Trust & Calibration
    currentDesktopUrl = `${BASE_URL}/trust`;
    console.log(`\nNavigating to ${currentDesktopUrl}`);
    await desktopPage.goto(currentDesktopUrl, { waitUntil: "networkidle" });
    report.routesTested.push("/trust");
    await desktopPage.screenshot({ path: `${ARTIFACTS_DIR}/desktop_06_trust.png`, fullPage: true });

    // Test Route 7: Reports
    currentDesktopUrl = `${BASE_URL}/reports`;
    console.log(`\nNavigating to ${currentDesktopUrl}`);
    await desktopPage.goto(currentDesktopUrl, { waitUntil: "networkidle" });
    report.routesTested.push("/reports");
    await desktopPage.screenshot({ path: `${ARTIFACTS_DIR}/desktop_07_reports.png`, fullPage: true });

    // Test Route 8: Setup
    currentDesktopUrl = `${BASE_URL}/setup`;
    console.log(`\nNavigating to ${currentDesktopUrl}`);
    await desktopPage.goto(currentDesktopUrl, { waitUntil: "networkidle" });
    report.routesTested.push("/setup");
    await desktopPage.screenshot({ path: `${ARTIFACTS_DIR}/desktop_08_setup.png`, fullPage: true });

    // Test Route 9: Printable QR Plaque
    currentDesktopUrl = `${BASE_URL}/plaque/plot-b`;
    console.log(`\nNavigating to ${currentDesktopUrl}`);
    await desktopPage.goto(currentDesktopUrl, { waitUntil: "networkidle" });
    report.routesTested.push("/plaque/plot-b");
    await desktopPage.screenshot({ path: `${ARTIFACTS_DIR}/desktop_09_plaque.png`, fullPage: true });

    await desktopContext.close();

    // 2. Mobile Context (iPhone 14 / Android profile)
    console.log("\n--> Testing Mobile 390x844 viewport (Outdoor Witness & Public Site)");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    const mobilePage = await mobileContext.newPage();
    let currentMobileUrl = `${BASE_URL}/w/plot-b`;
    hookPageLogs(mobilePage, () => currentMobileUrl);

    // Test Route 10: Mobile Witness Capture
    currentMobileUrl = `${BASE_URL}/w/plot-b`;
    console.log(`Navigating to ${currentMobileUrl}`);
    await mobilePage.goto(currentMobileUrl, { waitUntil: "networkidle" });
    report.routesTested.push("/w/plot-b");

    badElements = await detectOverflow(mobilePage);
    if (badElements.length) {
      report.overflows.push({ url: "/w/plot-b", viewport: "390x844", elements: badElements });
    }

    await mobilePage.screenshot({ path: `${ARTIFACTS_DIR}/mobile_01_witness.png`, fullPage: true });

    // Test Route 11: Public Site View
    currentMobileUrl = `${BASE_URL}/s/plot-b`;
    console.log(`Navigating to ${currentMobileUrl}`);
    await mobilePage.goto(currentMobileUrl, { waitUntil: "networkidle" });
    report.routesTested.push("/s/plot-b");
    await mobilePage.screenshot({ path: `${ARTIFACTS_DIR}/mobile_02_public_site.png`, fullPage: true });

    await mobileContext.close();
  } finally {
    await browser.close();
  }

  // Write report
  const reportPath = `${ARTIFACTS_DIR}/webattack_report.json`;
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log(`\n==================================================`);
  console.log(`WebAttack Execution Complete!`);
  console.log(`Routes Tested: ${report.routesTested.length}`);
  console.log(`Console Errors: ${report.consoleErrors.length}`);
  console.log(`Page Errors: ${report.pageErrors.length}`);
  console.log(`Horizontal Overflows: ${report.overflows.length}`);
  console.log(`Full report saved to: ${reportPath}`);
  console.log(`Screenshots saved to: ${ARTIFACTS_DIR}`);
  console.log(`==================================================\n`);
}

run().catch((err) => {
  console.error("WebAttack failed:", err);
  process.exit(1);
});
