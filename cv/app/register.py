"""Aligns a follow-up photo onto its site baseline with a robust homography."""
from dataclasses import dataclass, field

import cv2
import numpy as np

MAX_SIDE = 1600
RATIO = 0.75
RANSAC_PX = 4.0
MAX_POINTS = 200


@dataclass
class Registration:
    quality: str
    inliers: int
    inlier_ratio: float
    homography: list[float] | None
    aligned: np.ndarray | None = None
    valid_mask: np.ndarray | None = None
    baseline: np.ndarray | None = None
    inlier_points: list[tuple[float, float]] = field(default_factory=list)


def prep(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    s = min(1.0, MAX_SIDE / max(h, w))
    if s < 1.0:
        img = cv2.resize(img, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)
    return img


def grade_quality(inliers: int, ratio: float, H: np.ndarray | None) -> str:
    if H is None:
        return "failed"
    det = float(np.linalg.det(H[:2, :2]))
    if not (0.2 <= det <= 5.0):
        return "failed"
    if inliers >= 40 and ratio >= 0.35:
        return "good"
    if inliers >= 15 and ratio >= 0.2:
        return "weak"
    return "failed"


def _gray(img: np.ndarray) -> np.ndarray:
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(g)


def register(baseline: np.ndarray, followup: np.ndarray) -> Registration:
    b = prep(baseline)
    f = prep(followup)
    sift = cv2.SIFT_create(nfeatures=4000)
    kb, db = sift.detectAndCompute(_gray(b), None)
    kf, df = sift.detectAndCompute(_gray(f), None)
    failed = Registration("failed", 0, 0.0, None, baseline=b)
    if db is None or df is None or len(kb) < 8 or len(kf) < 8:
        return failed

    pairs = cv2.BFMatcher(cv2.NORM_L2).knnMatch(df, db, k=2)
    good = [p[0] for p in pairs if len(p) == 2 and p[0].distance < RATIO * p[1].distance]
    if len(good) < 8:
        return failed

    src = np.float32([kf[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    dst = np.float32([kb[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
    H, mask = cv2.findHomography(src, dst, cv2.USAC_MAGSAC, RANSAC_PX)
    if H is None or mask is None:
        return failed

    inliers = int(mask.sum())
    ratio = inliers / len(good)
    quality = grade_quality(inliers, ratio, H)
    h, w = b.shape[:2]
    pts = dst[mask.ravel() == 1].reshape(-1, 2)
    step = max(1, len(pts) // MAX_POINTS)
    inlier_points = [(float(x / w), float(y / h)) for x, y in pts[::step][:MAX_POINTS]]

    if quality == "failed":
        return Registration("failed", inliers, ratio, H.flatten().tolist(), baseline=b, inlier_points=[])

    aligned = cv2.warpPerspective(f, H, (w, h))
    valid = cv2.warpPerspective(np.full(f.shape[:2], 255, np.uint8), H, (w, h)) > 0
    valid = cv2.erode(valid.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    return Registration(quality, inliers, ratio, H.flatten().tolist(), aligned, valid, b, inlier_points)
