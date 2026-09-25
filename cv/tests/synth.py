"""Deterministic synthetic 'field scenes' rich in features, plus known warps."""
import cv2
import numpy as np


def scene(seed: int, w: int = 960, h: int = 720) -> np.ndarray:
    rng = np.random.default_rng(seed)
    img = np.full((h, w, 3), (70, 95, 120), np.uint8)  # dusty ground (BGR)
    for _ in range(140):
        color = tuple(int(c) for c in rng.integers(0, 255, 3))
        kind = rng.integers(0, 3)
        x, y = int(rng.integers(0, w)), int(rng.integers(0, h))
        if kind == 0:
            cv2.rectangle(img, (x, y), (x + int(rng.integers(10, 90)), y + int(rng.integers(10, 90))), color, -1)
        elif kind == 1:
            cv2.circle(img, (x, y), int(rng.integers(5, 40)), color, -1)
        else:
            cv2.line(img, (x, y), (int(rng.integers(0, w)), int(rng.integers(0, h))), color, int(rng.integers(1, 5)))
    noise = rng.normal(0, 6, img.shape).astype(np.int16)
    return np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)


def known_homography(w: int, h: int) -> np.ndarray:
    """~4° rotation, 6% zoom, small shift and slight perspective: a realistic 'same spot, next day' offset."""
    a = np.deg2rad(4.0)
    s = 1.06
    cx, cy = w / 2, h / 2
    rot = np.array([[s * np.cos(a), -s * np.sin(a), 0], [s * np.sin(a), s * np.cos(a), 0], [0, 0, 1]])
    to_c = np.array([[1, 0, -cx], [0, 1, -cy], [0, 0, 1]])
    back = np.array([[1, 0, cx + 25], [0, 1, cy - 18], [0, 0, 1]])
    persp = np.array([[1, 0, 0], [0, 1, 0], [2e-5, -1e-5, 1]])
    return back @ persp @ rot @ to_c


def add_green_patch(img: np.ndarray, frac: float = 0.25) -> np.ndarray:
    out = img.copy()
    h, w = out.shape[:2]
    side_w = int(w * np.sqrt(frac))
    side_h = int(h * np.sqrt(frac))
    y0, x0 = (h - side_h) // 2, (w - side_w) // 2
    out[y0 : y0 + side_h, x0 : x0 + side_w] = (40, 160, 50)  # BGR green foliage
    return out
