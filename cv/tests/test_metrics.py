import numpy as np
from app.metrics import change_metrics, difference_image, vegetation_fraction
from tests.synth import add_green_patch


def ground(h=600, w=800):
    return np.full((h, w, 3), (70, 95, 120), np.uint8)


def test_vegetation_fraction_counts_green_pixels():
    mask = np.ones((600, 800), bool)
    assert vegetation_fraction(ground(), mask) < 0.01
    assert abs(vegetation_fraction(add_green_patch(ground(), 0.25), mask) - 0.25) < 0.03


def test_change_metrics_detects_new_planting():
    before = ground()
    after = add_green_patch(before, 0.25)
    mask = np.ones(before.shape[:2], bool)
    m, changed = change_metrics(before, after, mask)
    assert abs(m["vegetation_delta"] - 0.25) < 0.03
    assert abs(m["changed_area_fraction"] - 0.25) < 0.05
    assert abs(m["brightness_shift"]) < 15  # a 25% green patch lifts mean lightness a little
    assert changed.shape == mask.shape


def test_pure_lighting_change_is_not_structural_change():
    before = ground()
    after = np.clip(before.astype(int) + 40, 0, 255).astype(np.uint8)
    m, _ = change_metrics(before, after, np.ones(before.shape[:2], bool))
    assert m["brightness_shift"] > 20
    assert m["changed_area_fraction"] < 0.02


def test_difference_image_marks_changed_pixels_in_caliper_teal():
    before = ground()
    changed = np.zeros(before.shape[:2], bool)
    changed[100:200, 100:200] = True
    out = difference_image(before, changed, np.ones_like(changed))
    assert tuple(out[150, 150]) == (161, 179, 95)  # BGR of #5FB3A1
    assert out[400, 400].max() < 120  # unchanged area is darkened
