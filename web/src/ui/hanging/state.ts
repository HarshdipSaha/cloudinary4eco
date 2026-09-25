export type HPMode = "side" | "flicker" | "wipe" | "difference";
export interface HPState {
  mode: HPMode;
  showingPrior: boolean;
  wipe: number;
  showPoints: boolean;
}
export type HPAction =
  | { type: "mode"; mode: HPMode }
  | { type: "hold"; on: boolean }
  | { type: "wipe"; value: number }
  | { type: "nudge"; by: number }
  | { type: "points" };

export const initialHP: HPState = { mode: "side", showingPrior: false, wipe: 50, showPoints: false };
const MODES: Record<string, HPMode> = { "1": "side", "2": "flicker", "3": "wipe", "4": "difference" };

export function keyToAction(key: string, phase: "down" | "up"): HPAction | null {
  if (key === " ") return { type: "hold", on: phase === "down" };
  if (phase !== "down") return null;
  if (MODES[key]) return { type: "mode", mode: MODES[key]! };
  if (key === "e" || key === "E") return { type: "points" };
  if (key === "ArrowRight") return { type: "nudge", by: 5 };
  if (key === "ArrowLeft") return { type: "nudge", by: -5 };
  return null;
}

export function hpReducer(s: HPState, a: HPAction): HPState {
  switch (a.type) {
    case "mode":
      return { ...s, mode: a.mode };
    case "hold":
      return { ...s, showingPrior: a.on };
    case "points":
      return { ...s, showPoints: !s.showPoints };
    case "wipe":
      return { ...s, wipe: Math.max(0, Math.min(100, a.value)) };
    case "nudge":
      return s.mode === "wipe" ? { ...s, wipe: Math.max(0, Math.min(100, s.wipe + a.by)) } : s;
  }
}
