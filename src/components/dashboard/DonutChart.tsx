import type { COLLECTION_BY_TYPE } from "@/lib/dummy-data/dashboard";

export function DonutChart({
  data,
  total,
}: {
  data: readonly (typeof COLLECTION_BY_TYPE)[number][];
  total: number;
}) {
  const size = 168;
  const stroke = 24;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const startPcts = data.map((_, i) =>
    data.slice(0, i).reduce((sum, s) => sum + s.pct, 0),
  );

  return (
    <div className="flex flex-col items-center gap-5 xl:flex-row xl:items-start">
      <div className="relative mx-auto shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#eef1e4"
            strokeWidth={stroke}
          />
          {data.map((segment, i) => {
            const dash = (segment.pct / 100) * circumference;
            const dashOffset = -((startPcts[i] / 100) * circumference);
            return (
              <circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={dashOffset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold text-zinc-900">{total.toLocaleString()}</span>
          <span className="text-xs text-zinc-500">Total</span>
        </div>
      </div>

      <ul className="w-full flex-1 space-y-2 text-sm">
        {data.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="min-w-0 flex-1 truncate text-zinc-700">{segment.label}</span>
            <span className="shrink-0 text-xs text-zinc-500">
              {segment.value.toLocaleString()} ({segment.pct}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
