"""Deterministic change metrics on a registered pair. Numbers, not opinions."""
import cv2
import numpy as np

EXG_THRESHOLD = 0.10
DIFF_THRESHOLD = 25.0
CALIPER_BGR = (161, 179, 95)  # #5FB3A1


def adaptive_exg_threshold(exg: np.ndarray, mask: np.ndarray) -> float:
    """Computes an adaptive ExG threshold using Otsu on positive ExG, with 0.10 floor (SATE / Agronomy prior art)."""
    if not mask.any():
        return EXG_THRESHOLD
    vals = exg[mask]
    if vals.max() <= EXG_THRESHOLD:
        return EXG_THRESHOLD
    exg_norm = np.clip((vals + 1.0) * 127.5, 0, 255).astype(np.uint8)
    val, _ = cv2.threshold(exg_norm, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    thresh = (val / 127.5) - 1.0
    return float(max(thresh, EXG_THRESHOLD))


def vegetation_fraction(img: np.ndarray, mask: np.ndarray) -> float:
    f = img.astype(np.float32)
    b, g, r = f[..., 0], f[..., 1], f[..., 2]
    s = r + g + b + 1e-6
    exg = 2 * g / s - r / s - b / s
    thresh = adaptive_exg_threshold(exg, mask)
    veg = (exg > thresh) & mask
    return float(veg.sum() / max(int(mask.sum()), 1))


def change_metrics(before: np.ndarray, after: np.ndarray, mask: np.ndarray) -> tuple[dict, np.ndarray]:
    vb = vegetation_fraction(before, mask)
    va = vegetation_fraction(after, mask)
    lb = cv2.cvtColor(before, cv2.COLOR_BGR2LAB)[..., 0].astype(np.float32)
    la = cv2.cvtColor(after, cv2.COLOR_BGR2LAB)[..., 0].astype(np.float32)
    shift = float(la[mask].mean() - lb[mask].mean()) if mask.any() else 0.0
    diff = cv2.GaussianBlur(np.abs((la - shift) - lb), (5, 5), 0)
    # Colour change matters too (bare soil -> green at similar lightness).
    ab_b = cv2.cvtColor(before, cv2.COLOR_BGR2LAB)[..., 1:].astype(np.float32)
    ab_a = cv2.cvtColor(after, cv2.COLOR_BGR2LAB)[..., 1:].astype(np.float32)
    chroma = cv2.GaussianBlur(np.linalg.norm(ab_a - ab_b, axis=2), (5, 5), 0)
    changed = ((diff > DIFF_THRESHOLD) | (chroma > DIFF_THRESHOLD)) & mask
    changed = cv2.morphologyEx(changed.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)).astype(bool)
    metrics = {
        "vegetation_fraction_before": vb,
        "vegetation_fraction_after": va,
        "vegetation_delta": va - vb,
        "changed_area_fraction": float(changed.sum() / max(int(mask.sum()), 1)),
        "brightness_shift": shift,
    }
    return metrics, changed


def difference_image(before: np.ndarray, changed: np.ndarray, mask: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(before, cv2.COLOR_BGR2GRAY)
    out = cv2.cvtColor((gray * 0.35).astype(np.uint8), cv2.COLOR_GRAY2BGR)
    out[~mask] = (11, 14, 17)  # room-0 outside the registered area
    out[changed] = CALIPER_BGR
    return out
