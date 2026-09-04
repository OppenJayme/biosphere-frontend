import type { CATALOGING_TREND } from "@/lib/dummy-data/dashboard";

export function CatalogingTrendChart({
  data,
}: {
  data: readonly (typeof CATALOGING_TREND)[number][];
}) {
  const width = 560;
  const height = 200;
  const paddingLeft = 28;
  const paddingBottom = 22;
  const paddingTop = 10;
  const max = 4;

  const chartWidth = width - paddingLeft;
  const chartHeight = height - paddingBottom - paddingTop;

  const points = data.map((d, i) => ({
    x: paddingLeft + (i / (data.length - 1)) * chartWidth,
    y: paddingTop + chartHeight - (d.value / max) * chartHeight,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const baseline = paddingTop + chartHeight;
  const areaPath = `${linePath} L${points[points.length - 1].x},${baseline} L${points[0].x},${baseline} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="Records cataloged over the last 12 months"
    >
      <defs>
        <linearGradient id="catalogingArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c5c42" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#2c5c42" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 1, 2, 3, 4].map((tick) => {
        const y = paddingTop + chartHeight - (tick / max) * chartHeight;
        return (
          <g key={tick}>
            <line x1={paddingLeft} x2={width} y1={y} y2={y} stroke="#eceded" strokeWidth={1} />
            <text x={paddingLeft - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#71717a">
              {tick}k
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
