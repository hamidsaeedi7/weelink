"use client";

interface DataPoint { date: string; count: number }

export function MiniChart({ data, color = "#F97316" }: { data: DataPoint[]; color?: string }) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.count), 1);
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - (d.count / max) * 100,
    ...d,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x} 100 L 0 100 Z`;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color.replace("#", "")})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BarChart({ data, color = "#F97316" }: { data: DataPoint[]; color?: string }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  const visible = data.slice(-14);

  return (
    <div className="flex items-end gap-0.5 h-full w-full">
      {visible.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
          <div
            className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80"
            style={{
              height: `${Math.max((d.count / max) * 100, 2)}%`,
              background: d.count === 0 ? "rgba(255,255,255,0.05)" : color,
              opacity: d.count === 0 ? 0.3 : 1,
            }}
          />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
            {d.count} بازدید
          </div>
        </div>
      ))}
    </div>
  );
}
