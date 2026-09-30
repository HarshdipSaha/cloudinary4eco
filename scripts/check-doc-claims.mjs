// Keeps prose honest: every pinned number must match its source, and every path a document names must exist.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const read = (root, path) => readFileSync(join(root, path), "utf8");

/** Claim key -> function(root) returning the true value as a string. */
export const CLAIMS = {
  "video.frames_per_import": (root) => {
    const m = read(root, "web/src/pipeline/public-video.ts").match(/FRAME_RATIOS\s*=\s*\[([^\]]*)\]/);
    if (!m) throw new Error("FRAME_RATIOS not found in web/src/pipeline/public-video.ts");
    return String(m[1].split(",").filter((s) => s.trim()).length);
  },
};

/** Checks that compare committed result artifacts with their inputs. Filled in by the accuracy work. */
export const FINGERPRINTS = [];

/** Gitignored files that docs legitimately tell readers to create; they never exist in a clean checkout. */
const LOCAL_ONLY = new Set(["web/.env", "cv/.env"]);

const MARKER = /<!--\s*claim:([\w.:-]+)\s*-->(.*?)<!--\s*\/claim\s*-->/gs;
const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const REPO_PATH = /`((?:web|cv|docs|scripts|\.github)\/[^`\s]+)`/g;

export function checkMarkdown(root, file, claims = CLAIMS) {
  const text = read(root, file);
  const problems = [];

  for (const [, key, raw] of text.matchAll(MARKER)) {
    const resolveClaim = claims[key];
    if (!resolveClaim) {
      problems.push(`${file}: unknown claim "${key}"`);
      continue;
    }
    const expected = resolveClaim(root);
    if (raw.trim() !== expected) problems.push(`${file}: claim ${key} says "${raw.trim()}" but source says "${expected}"`);
  }

  for (const [, target] of text.matchAll(LINK)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#")) continue;
    const path = decodeURIComponent(target.split("#")[0].split("?")[0]);
    if (!path) continue;
    const full = path.startsWith("/") ? join(root, path) : join(root, posix.dirname(file), path);
    if (!existsSync(full)) problems.push(`${file}: link target "${target}" does not exist`);
  }

  for (const [, rawPath] of text.matchAll(REPO_PATH)) {
    if (/[<>{}*]|\.\.\./.test(rawPath)) continue; // placeholders and globs are not concrete paths
    const path = rawPath.replace(/:\d+(-\d+)?$/, "").replace(/[.,;:]$/, "");
    if (LOCAL_ONLY.has(path)) continue;
    if (!existsSync(join(root, path))) problems.push(`${file}: path "${path}" does not exist`);
  }
  return problems;
}

export function documentsToCheck(root) {
  const docs = existsSync(join(root, "docs"))
    ? readdirSync(join(root, "docs"), { withFileTypes: true })
        .filter((d) => d.isFile() && d.name.endsWith(".md"))
        .map((d) => `docs/${d.name}`)
    : [];
  return ["README.md", ...docs, "cv/benchmarks/README.md", "web/calibration/README.md"].filter((f) => existsSync(join(root, f)));
}

export function checkRepo(root = ROOT, claims = CLAIMS, fingerprints = FINGERPRINTS) {
  const problems = documentsToCheck(root).flatMap((file) => checkMarkdown(root, file, claims));
  for (const check of fingerprints) problems.push(...check(root));
  return problems;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const problems = checkRepo();
  for (const p of problems) console.error(`✗ ${p}`);
  console.log(problems.length ? `${problems.length} documentation claim problem(s).` : "Documentation claims verified.");
  process.exit(problems.length ? 1 : 0);
}
