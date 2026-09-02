const CX = 100;
const CY = 100;
const RADIUS = 80;
const STROKE = 14;
const MAX_LEVEL = 5;

// Zone boundaries mirror computeTrafficLight() in lib/scoring.ts (RED < 2.0, YELLOW < 3.0, GREEN >= 3.0).
const ZONES: { from: number; to: number; className: string }[] = [
  { from: 0, to: 2, className: "stroke-red-600" },
  { from: 2, to: 3, className: "stroke-yellow-500" },
  { from: 3, to: MAX_LEVEL, className: "stroke-green-600" },
];

function angleForValue(value: number): number {
  const clamped = Math.min(Math.max(value, 0), MAX_LEVEL);
  return 180 - (clamped / MAX_LEVEL) * 180;
}

function pointOnArc(value: number, radius: number): { x: number; y: number } {
  const rad = (angleForValue(value) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

function zonePath(from: number, to: number): string {
  const start = pointOnArc(from, RADIUS);
  const end = pointOnArc(to, RADIUS);
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`;
}

export function OverallMaturityGauge({ level }: { level: number | null }) {
  if (level == null) return null;

  const needleTip = pointOnArc(level, RADIUS - STROKE / 2 - 6);
  const title = `Overall maturity: ${level.toFixed(1)} / 5`;

  return (
    <svg viewBox="0 0 200 110" width={160} height={88} role="img" aria-label={title}>
      <title>{title}</title>
      {ZONES.map((zone) => (
        <path
          key={zone.className}
          d={zonePath(zone.from, zone.to)}
          className={zone.className}
          fill="none"
          strokeWidth={STROKE}
        />
      ))}
      <line
        x1={CX}
        y1={CY}
        x2={needleTip.x}
        y2={needleTip.y}
        className="stroke-foreground"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={CX} cy={CY} r={5} className="fill-foreground" />
    </svg>
  );
}
