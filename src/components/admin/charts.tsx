import { cn } from "@/lib/cn";

interface Series {
  label: string;
  color: string;
  values: number[];
}

const W = 640;
const H = 220;
const P = { l: 44, r: 12, t: 12, b: 26 };

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

/** Courbes (une ou deux séries) : SVG rendu côté serveur, avec info-bulles natives. */
export function LineChart({ labels, series, format = (n) => String(n), className }: { labels: string[]; series: Series[]; format?: (n: number) => string; className?: string }) {
  const max = niceMax(Math.max(...series.flatMap((s) => s.values), 0));
  const n = Math.max(labels.length, 2);
  const x = (i: number) => P.l + (i * (W - P.l - P.r)) / (n - 1);
  const y = (v: number) => H - P.b - (v / max) * (H - P.t - P.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const every = Math.ceil(labels.length / 7);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={series.map((s) => s.label).join(" et ")} className={cn("h-auto w-full", className)}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={y(max * t)} y2={y(max * t)} stroke="rgba(255,255,255,0.08)" />
          <text x={P.l - 8} y={y(max * t) + 4} textAnchor="end" fontSize="10.5" fill="#a9b4c8">{format(Math.round(max * t))}</text>
        </g>
      ))}
      {labels.map((l, i) => (i % every === 0 ? <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10.5" fill="#a9b4c8">{l}</text> : null))}
      {series.map((s) => {
        const pts = s.values.map((v, i) => `${x(i)},${y(v)}`);
        return (
          <g key={s.label}>
            <path d={`M${x(0)},${y(0)} L${pts.join(" L")} L${x(s.values.length - 1)},${y(0)} Z`} fill={s.color} opacity="0.1" />
            <polyline points={pts.join(" ")} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={labels.length > 40 ? 0 : 3} fill={s.color}>
                <title>{`${labels[i]} · ${s.label} : ${format(v)}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function BarChart({ labels, values, color = "#d90f2c", format = (n) => String(n), className }: { labels: string[]; values: number[]; color?: string; format?: (n: number) => string; className?: string }) {
  const max = niceMax(Math.max(...values, 0));
  const bw = (W - P.l - P.r) / Math.max(labels.length, 1);
  const y = (v: number) => H - P.b - (v / max) * (H - P.t - P.b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Histogramme" className={cn("h-auto w-full", className)}>
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={y(max * t)} y2={y(max * t)} stroke="rgba(255,255,255,0.08)" />
          <text x={P.l - 8} y={y(max * t) + 4} textAnchor="end" fontSize="10.5" fill="#a9b4c8">{format(Math.round(max * t))}</text>
        </g>
      ))}
      {values.map((v, i) => (
        <g key={i}>
          <rect x={P.l + i * bw + bw * 0.18} y={y(v)} width={bw * 0.64} height={Math.max(y(0) - y(v), 0)} rx="3" fill={color}>
            <title>{`${labels[i]} : ${format(v)}`}</title>
          </rect>
          <text x={P.l + i * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize="10.5" fill="#a9b4c8">{labels[i]}</text>
        </g>
      ))}
    </svg>
  );
}

/** Répartition en barres horizontales avec pourcentage. */
export function Breakdown({ rows, format = (n) => String(n) }: { rows: Array<{ label: string; value: number; color?: string }>; format?: (n: number) => string }) {
  const total = rows.reduce((n, r) => n + r.value, 0) || 1;
  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 font-body text-[13.5px]">
            <span className="text-white/85">{r.label}</span>
            <span className="tabular-nums text-white">{format(r.value)} <span className="text-mist">({Math.round((r.value / total) * 100)} %)</span></span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
            <div className="h-full rounded-full" style={{ width: `${(r.value / total) * 100}%`, background: r.color ?? "#d90f2c" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
