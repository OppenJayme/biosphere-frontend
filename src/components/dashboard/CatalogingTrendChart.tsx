import type { CatalogingTrendPoint } from "@/features/dashboard/types";

function niceMax(rawMax: number): number {
  if (rawMax <= 5) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(rawMax));
  return Math.ceil(rawMax / magnitude) * magnitude;
}

export function CatalogingTrendChart({ data }: { data: CatalogingTrendPoint[] }) {
  const width = 560;
  const height = 200;
  const paddingLeft = 28;
  const paddingBottom = 22;
  const paddingTop = 10;
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const tickCount = 4;

  const chartWidth = width - paddingLeft;
  const chartHeight = height - paddingBottom - paddingTop;

  const points = data.map((d, i) => ({
    x: paddingLeft + (data.length > 1 ? (i / (data.length - 1)) * chartWidth : chartWidth / 2),
    y: paddingTop + chartHeight - (d.value / max) * chartHeight,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const baseline = paddingTop + chartHeight;
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x},${baseline} L${points[0].x},${baseline} Z`
      : "";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="Specimens created over the last 12 months"
    >
      <defs>
        <linearGradient id="catalogingArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c5c42" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#2c5c42" stopOpacity="0" />
        </linearGradient>
      </defs>

      {Array.from({ length: tickCount + 1 }, (_, tick) => tick).map((tick) => {
        const value = (tick / tickCount) * max;
        const y = paddingTop + chartHeight - (tick / tickCount) * chartHeight;
        return (
          <g key={tick}>
            <line x1={paddingLeft} x2={width} y1={y} y2={y} stroke="#eceded" strokeWidth={1} />
            <text x={paddingLeft - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#71717a">
              {Math.round(value)}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#catalogingArea)" />
      <path
        d={linePath}
        fill="none"
        stroke="#2c5c42"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle key={data[i].month} cx={p.x} cy={p.y} r={3.5} fill="#2c5c42" />
      ))}

      {data.map((d, i) => (
        <text key={d.month} x={points[i].x} y={height - 4} textAnchor="middle" fontSize="10" fill="#71717a">
          {d.month}
        </text>
      ))}
    </svg>
  );
}
