"use client";

export interface ReliabilityBin {
  lo: number;
  hi: number;
  count: number;
  accuracy: number;
  confidence: number;
}

export function ReliabilityDiagram({
  bins,
  width = 280,
  height = 200,
}: {
  bins: ReliabilityBin[];
  width?: number;
  height?: number;
}) {
  const padding = { top: 20, right: 20, bottom: 35, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[320px] select-none"
        aria-label="Reliability diagram comparing model confidence to observed empirical accuracy"
      >
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          <line
            x1={0}
            y1={chartH}
            x2={chartW}
            y2={chartH}
            stroke="var(--line)"
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={chartH}
            stroke="var(--line)"
            strokeWidth={1}
          />

          {/* Perfect calibration diagonal: (0, chartH) -> (chartW, 0) */}
          <line
            x1={0}
            y1={chartH}
            x2={chartW}
            y2={0}
            stroke="var(--text-3)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />

          {/* Bars */}
          {bins.map((b, i) => {
            if (b.count === 0) return null;
            const barW = (b.hi - b.lo) * chartW;
            const barX = b.lo * chartW;
            const barH = b.accuracy * chartH;
            const barY = chartH - barH;

            return (
              <g key={i}>
                <rect
                  x={barX + 2}
                  y={barY}
                  width={Math.max(2, barW - 4)}
                  height={barH}
                  fill="var(--measure)"
                  opacity={0.85}
                  rx={1}
                />
                {/* Count label */}
                <text
                  x={barX + barW / 2}
                  y={barY - 4}
                  textAnchor="middle"
                  className="font-mono text-[9px] fill-text-2"
                >
                  n={b.count}
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          <text
            x={0}
            y={chartH + 16}
            textAnchor="start"
            className="font-mono text-[10px] fill-text-3"
          >
            0.0
          </text>
          <text
            x={chartW / 2}
            y={chartH + 16}
            textAnchor="middle"
            className="font-mono text-[10px] fill-text-3"
          >
            0.5
          </text>
          <text
            x={chartW}
            y={chartH + 16}
            textAnchor="end"
            className="font-mono text-[10px] fill-text-3"
          >
            1.0
          </text>
          <text
            x={chartW / 2}
            y={chartH + 30}
            textAnchor="middle"
            className="text-[10px] fill-text-2"
          >
            Stated Confidence →
          </text>

          {/* Y axis labels */}
          <text
            x={-6}
            y={chartH}
            textAnchor="end"
            dominantBaseline="middle"
            className="font-mono text-[10px] fill-text-3"
          >
            0
          </text>
          <text
            x={-6}
            y={chartH / 2}
            textAnchor="end"
            dominantBaseline="middle"
            className="font-mono text-[10px] fill-text-3"
          >
            0.5
          </text>
          <text
            x={-6}
            y={4}
            textAnchor="end"
            dominantBaseline="middle"
            className="font-mono text-[10px] fill-text-3"
          >
            1.0
          </text>
        </g>
      </svg>
      <span className="font-mono text-[11px] text-text-3 mt-1">
        Observed Accuracy vs Confidence
      </span>
    </div>
  );
}
