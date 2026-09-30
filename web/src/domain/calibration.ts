export interface Scored {
  probabilities: Record<string, number>;
  label: string;
}

const top = (s: Scored) => Object.entries(s.probabilities).sort((a, b) => b[1] - a[1])[0]!;

export function accuracy(xs: Scored[]) {
  return xs.length ? xs.filter((s) => top(s)[0] === s.label).length / xs.length : 0;
}

export function brier(xs: Scored[]) {
  if (!xs.length) return 0;
  return (
    xs.reduce(
      (sum, s) =>
        sum +
        Object.entries(s.probabilities).reduce(
          (a, [k, p]) => a + (p - (k === s.label ? 1 : 0)) ** 2,
          0
        ),
      0
    ) / xs.length
  );
}

export function reliabilityBins(xs: Scored[], n = 10) {
  const bins = Array.from({ length: n }, (_, i) => ({
    lo: i / n,
    hi: (i + 1) / n,
    count: 0,
    correct: 0,
    confSum: 0,
  }));
  for (const s of xs) {
    const [k, p] = top(s);
    const b = bins[Math.min(n - 1, Math.floor(p * n))]!;
    b.count++;
    b.confSum += p;
    if (k === s.label) b.correct++;
  }
  return bins.map((b) => ({
    lo: Math.round(b.lo * 100) / 100,
    hi: b.hi,
    count: b.count,
    accuracy: b.count ? b.correct / b.count : 0,
    confidence: b.count ? b.confSum / b.count : 0,
  }));
}

export function ece(xs: Scored[], n = 10) {
  if (!xs.length) return 0;
  return reliabilityBins(xs, n).reduce(
    (a, b) => a + (b.count / xs.length) * Math.abs(b.accuracy - b.confidence),
    0
  );
}

export function pickThreshold(xs: Scored[], target: number) {
  const cands = [...new Set(xs.map((s) => top(s)[1]))].sort((a, b) => a - b);
  for (const t of cands) {
    const kept = xs.filter((s) => top(s)[1] >= t);
    const acc = accuracy(kept);
    if (kept.length && acc >= target) return { threshold: t, coverage: kept.length / xs.length, accuracy: acc };
  }
  return { threshold: 1, coverage: 0, accuracy: 0 };
}

/** 95% Wilson score interval for an observed proportion; honest about small samples, unlike p ± 0 at 100%. */
export function wilsonInterval(p: number, n: number) {
  if (n <= 0) return { low: 0, high: 1 };
  const z = 1.96;
  const z2 = z * z;
  const centre = (p + z2 / (2 * n)) / (1 + z2 / n);
  const margin = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
  return { low: Math.max(0, centre - margin), high: Math.min(1, centre + margin) };
}
