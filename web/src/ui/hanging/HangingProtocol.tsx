"use client";
import { useEffect, useReducer, useRef } from "react";
import { Plate, type Corner } from "./Plate";
import { hpReducer, initialHP, keyToAction, type HPMode } from "./state";
import { Kbd } from "@/ui/Kbd";

export interface HungImage {
  src: string;
  alt: string;
  corners: Corner;
}
export interface HangingProps {
  aspect: number;
  prior: HungImage;
  current: HungImage;
  differenceSrc: string | null;
  inlierPoints: [number, number][];
}

const MODE_LABEL: Record<HPMode, string> = {
  side: "Side by side",
  flicker: "Flicker",
  wipe: "Wipe",
  difference: "Difference",
};

function Img({ src, alt, hidden }: { src: string; alt: string; hidden?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={hidden ? "" : alt}
      aria-hidden={hidden}
      decoding="async"
      draggable={false}
      className="absolute inset-0 h-full w-full select-none object-fill"
      style={{ opacity: hidden ? 0 : 1 }}
    />
  );
}

function Points({ points }: { points: [number, number][] }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {points.map(([x, y], i) => (
        <span
          key={i}
          className="absolute size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-surface-0 bg-measure"
          style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
        />
      ))}
    </div>
  );
}

export function HangingProtocol(p: HangingProps) {
  const [s, dispatch] = useReducer(hpReducer, initialHP);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const onKey = (phase: "down" | "up") => (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest("textarea, [contenteditable], input:not([type=range])")) return;
      if (target?.matches?.("input[type=range]") && e.key !== " ") return;
      const a = keyToAction(e.key, phase);
      if (!a) return;
      if (e.key === " ") e.preventDefault();
      if (phase === "down" && e.repeat && e.key === " ") return;
      dispatch(a);
    };
    const down = onKey("down");
    const up = onKey("up");
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    const blur = () => dispatch({ type: "hold", on: false });
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  const holdHandlers = {
    onPointerDown: () => dispatch({ type: "hold", on: true }),
    onPointerUp: () => dispatch({ type: "hold", on: false }),
    onPointerLeave: () => dispatch({ type: "hold", on: false }),
  };
  const single = s.mode !== "side" || s.showingPrior;

  return (
    <section ref={root} className="flex flex-col gap-3" aria-label="Registered comparison">
      <div className="flex items-center justify-between gap-4">
        <div role="radiogroup" aria-label="Comparison mode" className="flex border border-line">
          {(Object.keys(MODE_LABEL) as HPMode[]).map((m, i) => (
            <button
              key={m}
              role="radio"
              aria-checked={s.mode === m}
              onClick={() => dispatch({ type: "mode", mode: m })}
              disabled={m === "difference" && !p.differenceSrc}
              className={`h-8 cursor-pointer border-r border-line px-3 last:border-r-0 disabled:cursor-not-allowed disabled:text-text-3 ${
                s.mode === m
                  ? "bg-surface-2 text-text shadow-[inset_0_-2px_0_var(--measure)]"
                  : "text-text-2 hover:text-text"
              }`}
            >
              <span className="mono mr-1.5 text-text-3">{i + 1}</span>
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-[12px] text-text-2">
          <button
            onClick={() => dispatch({ type: "points" })}
            aria-pressed={s.showPoints}
            className={`cursor-pointer ${s.showPoints ? "text-measure" : "hover:text-text"}`}
          >
            Alignment evidence <Kbd>E</Kbd>
          </button>
          <span>
            Hold <Kbd>Space</Kbd> to flicker to prior
          </span>
        </div>
      </div>

      <div aria-live="polite" className="sr-only">
        {s.showingPrior ? "Showing prior" : `Showing ${MODE_LABEL[s.mode]}`}
      </div>

      {!single ? (
        <div className="grid grid-cols-2 gap-3">
          <Plate aspect={p.aspect} corners={p.prior.corners} label={p.prior.alt}>
            <Img {...p.prior} />
            {s.showPoints && <Points points={p.inlierPoints} />}
          </Plate>
          <Plate aspect={p.aspect} corners={p.current.corners} label={p.current.alt}>
            <Img {...p.current} />
            {s.showPoints && <Points points={p.inlierPoints} />}
          </Plate>
        </div>
      ) : (
        <div
          className="mx-auto w-full max-w-[min(100%,calc((100dvh-260px)*var(--a)))]"
          style={{ ["--a" as string]: String(p.aspect) }}
          {...holdHandlers}
        >
          <Plate
            aspect={p.aspect}
            corners={s.showingPrior ? p.prior.corners : p.current.corners}
            label={s.showingPrior ? p.prior.alt : p.current.alt}
          >
            {s.mode === "difference" && p.differenceSrc && !s.showingPrior ? (
              <Img src={p.differenceSrc} alt={`Changed areas between prior and current, highlighted in teal`} />
            ) : (
              <>
                <Img {...p.prior} hidden={!(s.showingPrior || s.mode === "wipe")} />
                <div
                  className="absolute inset-0"
                  style={
                    s.mode === "wipe" && !s.showingPrior
                      ? { clipPath: `inset(0 0 0 ${s.wipe}%)` }
                      : undefined
                  }
                >
                  <Img {...p.current} hidden={s.showingPrior} />
                </div>
              </>
            )}
            {s.mode === "wipe" && !s.showingPrior && (
              <>
                <div
                  aria-hidden
                  className="absolute inset-y-0 w-px bg-measure"
                  style={{ left: `${s.wipe}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={s.wipe}
                  aria-label="Wipe position"
                  onChange={(e) => dispatch({ type: "wipe", value: Number(e.target.value) })}
                  className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
                />
              </>
            )}
            {s.showPoints && <Points points={p.inlierPoints} />}
          </Plate>
        </div>
      )}
    </section>
  );
}
