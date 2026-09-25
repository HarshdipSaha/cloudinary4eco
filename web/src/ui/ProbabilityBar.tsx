export function ProbabilityBar({
  probabilities,
  chosen,
  labels,
}: {
  probabilities: Record<string, number>;
  chosen: string;
  labels?: Record<string, string>;
}) {
  const entries = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  return (
    <div
      className="flex flex-col gap-1"
      role="img"
      aria-label={entries.map(([k, p]) => `${labels?.[k] ?? k} ${Math.round(p * 100)} percent`).join(", ")}
    >
      <div className="flex h-1.5 w-full overflow-hidden bg-surface-2">
        {entries.map(([k, p]) => (
          <div
            key={k}
            style={{ width: `${p * 100}%`, background: k === chosen ? "var(--measure)" : "var(--grade-1)" }}
            className="h-full border-r border-surface-0 last:border-r-0"
          />
        ))}
      </div>
      <div className="mono flex flex-wrap gap-x-3 text-[12px] text-text-2">
        {entries.slice(0, 4).map(([k, p]) => (
          <span key={k} className={k === chosen ? "text-text" : ""}>
            {labels?.[k] ?? k} {Math.round(p * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}
