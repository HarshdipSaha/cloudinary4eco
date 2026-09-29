"""Run the production registration and metric code on the demo photo pair."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
from time import perf_counter

import cv2
import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "cv"))

from app.metrics import change_metrics  # noqa: E402
from app.register import register  # noqa: E402


def percent(value: float) -> float:
    return round(value * 100, 2)


def run_case(name: str, baseline_path: Path, followup_path: Path, expected_quality: str) -> dict:
    baseline = cv2.imread(str(baseline_path), cv2.IMREAD_COLOR)
    followup = cv2.imread(str(followup_path), cv2.IMREAD_COLOR)
    if baseline is None:
        raise FileNotFoundError(f"Could not read benchmark photo: {baseline_path}")
    if followup is None:
        raise FileNotFoundError(f"Could not read benchmark photo: {followup_path}")

    started = perf_counter()
    result = register(baseline, followup)
    elapsed_ms = round((perf_counter() - started) * 1000, 1)

    row = {
        "name": name,
        "baseline": baseline_path.relative_to(REPO_ROOT).as_posix(),
        "followup": followup_path.relative_to(REPO_ROOT).as_posix(),
        "expected_quality": expected_quality,
        "quality": result.quality,
        "expectation_met": result.quality == expected_quality,
        "inliers": result.inliers,
        "inlier_ratio": round(result.inlier_ratio, 4),
        "elapsed_ms": elapsed_ms,
        "metrics": None,
    }

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


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional path for a JSON results file; results are always printed to stdout.",
    )
    args = parser.parse_args()

    photos = REPO_ROOT / "web" / "test-images"
    results = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "python_version": sys.version.split()[0],
        "opencv_version": cv2.__version__,
        "numpy_version": np.__version__,
        "cases": [
            run_case(
                "same_scene_baseline_followup",
                photos / "baseline.jpg",
                photos / "followup.jpg",
                "good",
            ),
            run_case(
                "unrelated_photo_negative_control",
                photos / "baseline.jpg",
                photos / "other_site.jpg",
                "failed",
            ),
        ],
    }
    rendered = json.dumps(results, indent=2)
    print(rendered)
    if args.output:
        output = args.output if args.output.is_absolute() else REPO_ROOT / args.output
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(rendered + "\n", encoding="utf-8")

    return 0 if all(case["expectation_met"] for case in results["cases"]) else 1


if __name__ == "__main__":
    raise SystemExit(main())
