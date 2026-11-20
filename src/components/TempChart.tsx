import { useId } from 'react'

interface Point {
  label: string
  temp: number
}

const W = 618
const TOP = 35 // linha de rótulos de temperatura
const H = 220 // área do gráfico
const X0 = 20
const X1 = 598

/** Curva suave (Catmull-Rom → Bézier). */
function smooth(pts: [number, number][]): string {
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

export function TempChart({ points }: { points: Point[] }) {
  const id = useId()
  if (points.length < 2) return null
  const temps = points.map((p) => p.temp)
  const max = Math.max(...temps)
  const min = Math.min(...temps)
  const range = max - min || 1
  const step = (X1 - X0) / (points.length - 1)
  const xy: [number, number][] = points.map((p, i) => [X0 + i * step, TOP + 52 + ((max - p.temp) / range) * 125])
  const line = smooth(xy)
  const area = `${line} L${X1} ${TOP + H} L${X0} ${TOP + H} Z`

  return (
    <svg
      className="temp-chart"
      viewBox={`0 0 ${W} ${TOP + H + 35}`}
      role="img"
      aria-label={`Temperatura nas próximas horas: ${points.map((p) => `${p.label} ${Math.round(p.temp)}°`).join(', ')}`}
    >
      <defs>
        <linearGradient id={`${id}-area`} x1="0" y1={TOP} x2="0" y2={TOP + H} gradientUnits="userSpaceOnUse">
          <stop stopColor="#00BFFF" stopOpacity="0.35" />
          <stop offset="1" stopColor="#32CD32" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={`${id}-line`} x1={X0} y1="0" x2={X1} y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00BFFF" />
          <stop offset="1" stopColor="#32CD32" />
        </linearGradient>
      </defs>

      {[60, 120, 180].map((y) => (
        <line key={y} x1="0" x2={W} y1={TOP + y} y2={TOP + y} stroke="#0B3A5C" strokeOpacity="0.12" />
      ))}

      <path d={area} fill={`url(#${id}-area)`} />
      <path d={line} fill="none" stroke={`url(#${id}-line)`} strokeWidth="4" strokeLinecap="round" />

      {xy.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="6" fill="white" stroke="#00BFFF" strokeWidth="3" />
          <text className="temp-chart__temp" x={x} y="16" textAnchor="middle">
            {Math.round(points[i].temp)}°
          </text>
          <text className="temp-chart__hour" x={x} y={TOP + H + 27} textAnchor="middle">
            {points[i].label}
          </text>
        </g>
      ))}
    </svg>
  )
}
