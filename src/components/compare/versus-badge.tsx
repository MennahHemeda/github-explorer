const POINTS = 12;
const OUTER = 46;
const INNER = 36;

/** A spiky "VS" burst, like the one between fighters in a game's versus screen. */
const burst = Array.from({ length: POINTS * 2 }, (_, i) => {
  const radius = i % 2 === 0 ? OUTER : INNER;
  const angle = (Math.PI * i) / POINTS - Math.PI / 2;
  return `${(50 + radius * Math.cos(angle)).toFixed(1)},${(50 + radius * Math.sin(angle)).toFixed(1)}`;
}).join(" ");

export function VersusBadge() {
  return (
    <svg viewBox="0 0 100 100" className="mx-auto h-20 w-20 shrink-0" role="img" aria-label="versus">
      <polygon points={burst} transform="translate(3 4)" fill="rgb(46 36 64 / 0.18)" />
      <polygon points={burst} fill="var(--color-peach)" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />
      <text
        x="50"
        y="51"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-game)"
        fontWeight={700}
        fontSize={30}
        fill="var(--ink)"
      >
        VS
      </text>
    </svg>
  );
}
