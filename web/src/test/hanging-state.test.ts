import { describe, it, expect } from "vitest";
import { initialHP, hpReducer, keyToAction } from "@/ui/hanging/state";

describe("hanging protocol state", () => {
  it("switches modes with 1-4", () => {
    let s = initialHP;
    s = hpReducer(s, keyToAction("2", "down")!);
    expect(s.mode).toBe("flicker");
    s = hpReducer(s, keyToAction("4", "down")!);
    expect(s.mode).toBe("difference");
  });
  it("shows the prior only while Space is held, in any mode", () => {
    let s = hpReducer(initialHP, keyToAction(" ", "down")!);
    expect(s.showingPrior).toBe(true);
    s = hpReducer(s, keyToAction(" ", "up")!);
    expect(s.showingPrior).toBe(false);
  });
  it("toggles alignment evidence with E", () => {
    expect(hpReducer(initialHP, keyToAction("e", "down")!).showPoints).toBe(!initialHP.showPoints);
  });
  it("nudges the wipe with arrows only in wipe mode, clamped 0..100", () => {
    let s = hpReducer(initialHP, { type: "mode", mode: "wipe" });
    for (let i = 0; i < 30; i++) s = hpReducer(s, keyToAction("ArrowRight", "down")!);
    expect(s.wipe).toBe(100);
    expect(hpReducer({ ...initialHP, mode: "side" }, keyToAction("ArrowRight", "down")!).wipe).toBe(initialHP.wipe);
  });
  it("ignores unrelated keys", () => {
    expect(keyToAction("x", "down")).toBeNull();
  });
});
