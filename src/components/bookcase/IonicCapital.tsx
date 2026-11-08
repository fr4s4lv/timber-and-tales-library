import { useId } from "react";

/** Archimedean-ish spiral centred at (cx, cy), winding inward. */
function spiralPath(cx: number, cy: number, r0: number, turns: number, mirror: boolean) {
  const steps = 90;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = -Math.PI / 2 + t * turns * Math.PI * 2 * (mirror ? -1 : 1);
    const r = r0 * (1 - t * 0.82);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

export function IonicCapital({ texture }: { texture?: string | undefined }) {
  const raw = useId();
  const id = raw.replace(/[^a-zA-Z0-9_-]/g, "");
  const tex = `tex${id}`;
  const shadeV = `shv${id}`;
  const shadeR = `shr${id}`;
  const W = 150;
  const R = 17;
  const L = { x: 22, y: 30 };
  const Rt = { x: W - 22, y: 30 };
  const eggs = [48, 63, 78, 93, 108].map((x) => x - 3);

  return (
    <svg className="capital-svg" viewBox="0 0 150 58" aria-hidden="true">
      <defs>
        <pattern id={tex} patternUnits="userSpaceOnUse" width="150" height="150">
          <rect width="150" height="150" style={{ fill: "var(--wood-color)" }} />
          {texture ? (
            <image href={texture} width="150" height="150" preserveAspectRatio="xMidYMid slice" />
          ) : null}
        </pattern>
        <linearGradient id={shadeV} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--light)", stopOpacity: 0.32 }} />
          <stop offset="0.45" style={{ stopColor: "var(--light)", stopOpacity: 0.04 }} />
          <stop offset="1" style={{ stopColor: "var(--shade)", stopOpacity: 0.55 }} />
        </linearGradient>
        <radialGradient id={shadeR} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" style={{ stopColor: "var(--light)", stopOpacity: 0.35 }} />
          <stop offset="0.55" style={{ stopColor: "var(--light)", stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: "var(--shade)", stopOpacity: 0.6 }} />
        </radialGradient>
      </defs>

      {/* astragal (beaded collar) */}
      <rect x="37" y="46" width="76" height="8" rx="4" fill={`url(#${tex})`} />
      <rect x="37" y="46" width="76" height="8" rx="4" fill={`url(#${shadeV})`} />
      {Array.from({ length: 10 }).map((_, i) => (
        <ellipse
          key={i}
          cx={41 + i * 7.6}
          cy="50"
          rx="2.6"
          ry="2.4"
          style={{ fill: "var(--trim-light)", opacity: 0.35 }}
        />
      ))}

      {/* echinus with egg-and-dart */}
      <path d="M30 22 H120 Q118 44 75 46 Q32 44 30 22 Z" fill={`url(#${tex})`} />
      <path d="M30 22 H120 Q118 44 75 46 Q32 44 30 22 Z" fill={`url(#${shadeV})`} />
      {eggs.map((x) => (
        <g key={x}>
          <ellipse cx={x + 3} cy="32" rx="5.2" ry="7.5" style={{ fill: "var(--shade)", opacity: 0.45 }} />
          <ellipse cx={x + 3} cy="31.5" rx="4" ry="6.2" fill={`url(#${tex})`} />
          <ellipse cx={x + 3} cy="31.5" rx="4" ry="6.2" fill={`url(#${shadeR})`} />
          <path
            d={`M${x + 10.5} 24 L${x + 10.5} 40`}
            style={{ stroke: "var(--trim)", strokeWidth: 1.2, opacity: 0.9 }}
          />
        </g>
      ))}

      {/* canalis: the band joining the volutes */}
      <path
        d={`M${L.x} ${L.y - R} H${Rt.x} V${Rt.y - 4} Q75 ${L.y + 2} ${L.x} ${L.y - 4} Z`}
        fill={`url(#${tex})`}
      />
      <path
        d={`M${L.x} ${L.y - R} H${Rt.x} V${Rt.y - 4} Q75 ${L.y + 2} ${L.x} ${L.y - 4} Z`}
        fill={`url(#${shadeV})`}
      />
      <path
        d={`M${L.x + 4} ${L.y - R + 5} H${Rt.x - 4}`}
        style={{ stroke: "var(--trim)", strokeWidth: 1, opacity: 0.8 }}
      />

      {/* volutes */}
      {[
        { c: L, mirror: false },
        { c: Rt, mirror: true },
      ].map(({ c, mirror }, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={R} fill={`url(#${tex})`} />
          <circle cx={c.x} cy={c.y} r={R} fill={`url(#${shadeR})`} />
          <path
            d={spiralPath(c.x + (mirror ? -0.6 : 0.6), c.y + 0.8, R - 1.5, 2.6, mirror)}
            fill="none"
            style={{ stroke: "var(--light)", strokeWidth: 1, opacity: 0.25 }}
          />
          <path
            d={spiralPath(c.x, c.y, R - 1.5, 2.6, mirror)}
            fill="none"
            style={{ stroke: "var(--trim)", strokeWidth: 2.1, strokeLinecap: "round" }}
          />
          <circle cx={c.x} cy={c.y} r="3" style={{ fill: "var(--trim-light)" }} />
          <circle cx={c.x} cy={c.y} r={R} fill="none" style={{ stroke: "var(--trim)", strokeWidth: 0.8 }} />
        </g>
      ))}

      {/* abacus */}
      <path d="M4 0 H146 L142 9 H8 Z" fill={`url(#${tex})`} />
      <path d="M4 0 H146 L142 9 H8 Z" fill={`url(#${shadeV})`} />
      <path d="M8 9 H142" style={{ stroke: "var(--trim-light)", strokeWidth: 1, opacity: 0.8 }} />
    </svg>
  );
}
