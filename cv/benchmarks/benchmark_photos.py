"""Run the production registration and metric code on the pre-registered benchmark manifest."""

from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from statistics import median
import sys
from time import perf_counter

import cv2
import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "cv"))

from app.metrics import change_metrics  # noqa: E402
from app.register import prep, register  # noqa: E402
from benchmarks.perturb import apply, corner_error  # noqa: E402
from tests.synth import scene  # noqa: E402

MANIFEST = REPO_ROOT / "cv" / "benchmarks" / "cases.json"


def percent(value: float) -> float:
    return round(value * 100, 2)


def manifest_sha256(path: Path) -> str:
    """Hash of the manifest with normalised line endings, so Windows and Linux checkouts agree."""
    return hashlib.sha256(path.read_bytes().replace(b"\r\n", b"\n")).hexdigest()


def load(src: str) -> np.ndarray:
    if src.startswith("synth:"):
        return scene(int(src.split(":", 1)[1]))
    img = cv2.imread(str(REPO_ROOT / src), cv2.IMREAD_COLOR)
    if img is None:
        raise FileNotFoundError(f"Could not read benchmark photo: {src}")
    return img


def run_case(case: dict) -> dict:
    # prep() first, so register()'s own resize is a no-op and ground-truth homographies stay in the same pixel space.
    baseline = prep(load(case["baseline"]))
    followup_src = prep(load(case["followup"]))
    followup, G = apply(followup_src, case.get("perturb", []))
    self_pair = case["baseline"] == case["followup"]

    started = perf_counter()
    result = register(baseline, followup)
    elapsed_ms = round((perf_counter() - started) * 1000, 1)

    expect = case["expect"]
    row = {
        "name": case["name"],
        "category": case["category"],
        "origin": "synthetic_perturbation" if case.get("perturb") or case["baseline"].startswith("synth:") else "demo_photo",
        "baseline": case["baseline"],
        "followup": case["followup"],
        "perturb": case.get("perturb", []),
        "expected_quality": expect,
        "gated": expect is not None,
        "quality": result.quality,
        "expectation_met": (result.quality in expect) if expect is not None else None,
        "known_limitation": case.get("known_limitation") or case.get("exploratory"),
        "inliers": result.inliers,
        "inlier_ratio": round(result.inlier_ratio, 4),
        "corner_error_px": None,
        "elapsed_ms": elapsed_ms,
        "metrics": None,
    }
    if self_pair and result.homography is not None and result.quality != "failed":
        h, w = baseline.shape[:2]
        H = np.array(result.homography, dtype=np.float64).reshape(3, 3)
        row["corner_error_px"] = round(corner_error(H, G, w, h), 2)
    if result.quality != "failed" and result.aligned is not None and result.valid_mask is not None and result.baseline is not None:
        metrics, _ = change_metrics(result.baseline, result.aligned, result.valid_mask)
        row["metrics"] = {
            "visible_green_cover_before_percent": percent(metrics["vegetation_fraction_before"]),
            "visible_green_cover_after_percent": percent(metrics["vegetation_fraction_after"]),
            "visible_green_cover_delta_percentage_points": percent(metrics["vegetation_delta"]),
            "aligned_area_changed_percent": percent(metrics["changed_area_fraction"]),
            "brightness_shift_lab_l": round(metrics["brightness_shift"], 2),
        }
    return row


def summarise(rows: list[dict]) -> dict:
    out: dict[str, dict] = {}
    for category in sorted({r["category"] for r in rows}):
        rs = [r for r in rows if r["category"] == category]
        errors = [r["corner_error_px"] for r in rs if r["corner_error_px"] is not None]
        out[category] = {
            "cases": len(rs),
            "gated": sum(r["gated"] for r in rs),
            "met": sum(bool(r["expectation_met"]) for r in rs if r["gated"]),
            "quality": dict(Counter(r["quality"] for r in rs)),
            "median_corner_error_px": round(median(errors), 2) if errors else None,
            "max_corner_error_px": round(max(errors), 2) if errors else None,
        }
    return out


def render_markdown(results: dict) -> str:
    lines = [
        "# Photo benchmark results",
        "",
        f"Generated {results['generated_at_utc']} with OpenCV {results['opencv_version']}. Synthetic perturbations test robustness; they are not field photos.",
        "",
        "| Category | Cases | Gated met | Qualities | Median corner error (px) | Max corner error (px) |",
        "|---|---|---|---|---|---|",
    ]
    for category, s in results["summary"].items():
        qualities = ", ".join(f"{k} {v}" for k, v in sorted(s["quality"].items()))
        fmt = lambda v: "—" if v is None else f"{v}"  # noqa: E731
        lines.append(f"| {category} | {s['cases']} | {s['met']}/{s['gated']} | {qualities} | {fmt(s['median_corner_error_px'])} | {fmt(s['max_corner_error_px'])} |")
    limits = [r for r in results["cases"] if r["known_limitation"]]
    if limits:
        lines += ["", "## Not gated", ""]
        lines += [f"- `{r['name']}` ({r['quality']}): {r['known_limitation']}" for r in limits]
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="Write JSON results here (and a .md summary beside it).")
    args = parser.parse_args()

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    rows = [run_case(c) for c in manifest["cases"]]
    results = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "python_version": sys.version.split()[0],
        "opencv_version": cv2.__version__,
        "numpy_version": np.__version__,
        "manifest_sha256": manifest_sha256(MANIFEST),
        "summary": summarise(rows),
        "cases": rows,
    }
    for r in rows:
        mark = "·" if not r["gated"] else ("+" if r["expectation_met"] else "x")
        print(f"{mark} {r['name']:<36} {r['quality']:<7} inliers={r['inliers']:<5} err={r['corner_error_px']}")
    if args.output:
        out = args.output if args.output.is_absolute() else REPO_ROOT / args.output
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        out.with_suffix(".md").write_text(render_markdown(results), encoding="utf-8")

    missed = [r["name"] for r in rows if r["gated"] and not r["expectation_met"]]
    if missed:
        print(f"Expectation missed: {', '.join(missed)}", file=sys.stderr)
    return 1 if missed else 0


if __name__ == "__main__":
    raise SystemExit(main())
