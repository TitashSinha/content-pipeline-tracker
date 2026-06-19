// Lightweight SVG donut chart with animated transitions.
// segments: [{ value, color }] — pass onSegmentClick(i) to make slices clickable.
export default function Donut({ segments, size = 130, stroke = 18, onSegmentClick }) {
  const sum = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        {sum > 0 &&
          segments.map((seg, i) => {
            const len = (seg.value / sum) * circumference;
            const dash = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
                onClick={onSegmentClick ? () => onSegmentClick(i) : undefined}
                style={{
                  transition: 'stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease',
                  cursor: onSegmentClick ? 'pointer' : undefined,
                }}
              />
            );
            offset += len;
            return dash;
          })}
      </g>
      <text x="50%" y="48%" textAnchor="middle" className="donut-num">{sum}</text>
      <text x="50%" y="62%" textAnchor="middle" className="donut-cap">total</text>
    </svg>
  );
}
