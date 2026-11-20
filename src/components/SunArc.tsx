import { useId } from 'react'

// Mesmo desenho do "arco do sol" do Figma (220×96), mas com o sol posicionado
// de acordo com o horário real entre o nascer e o pôr do sol.
const DASHED_ARC =
  'M10 90C10 88.8992 10.0284 87.8008 10.0848 86.7053M210 90C210 88.8992 209.972 87.8008 209.915 86.7053M10.7602 80.1518C11.0965 77.9827 11.543 75.8306 12.0972 73.7005M14.0681 67.4137C14.8226 65.3628 15.6791 63.3383 16.6351 61.3449M19.7526 55.5403C20.8685 53.6699 22.0758 51.8332 23.3721 50.0348M27.444 44.8543C28.8562 43.2015 30.3487 41.588 31.9194 40.0177M36.7515 35.5372C37.5799 34.8243 38.4259 34.1222 39.2893 33.4315C40.1105 32.7745 40.9445 32.1302 41.7909 31.4986M46.9803 27.8849C48.7404 26.7419 50.5447 25.6497 52.3897 24.6094M57.9888 21.6718C59.8753 20.7529 61.7975 19.885 63.7521 19.0695M69.6551 16.7998C71.6344 16.1016 73.6417 15.455 75.6737 14.8608M81.7886 13.2494C83.8329 12.7684 85.898 12.3393 87.981 11.9631M94.2303 11.0007C96.3142 10.7344 98.4123 10.5205 100.522 10.3599M106.837 10.04C107.89 10.0134 108.944 10 110 10C111.056 10 112.11 10.0134 113.163 10.04M119.478 10.3599C121.588 10.5205 123.686 10.7344 125.77 11.0007M132.019 11.9631C134.102 12.3393 136.167 12.7684 138.211 13.2494M144.326 14.8608C146.358 15.455 148.366 16.1017 150.345 16.7998M156.248 19.0695C158.203 19.8851 160.125 20.7529 162.011 21.6718M167.61 24.6094C169.455 25.6497 171.26 26.7419 173.02 27.8849M178.209 31.4986C179.055 32.1302 179.889 32.7745 180.711 33.4315C181.574 34.1222 182.42 34.8243 183.248 35.5372M188.081 40.0177C189.651 41.588 191.144 43.2015 192.556 44.8543M196.628 50.0348C197.924 51.8332 199.131 53.6699 200.247 55.5403M203.365 61.3449C204.321 63.3383 205.177 65.3628 205.932 67.4137M207.903 73.7005C208.457 75.8306 208.904 77.9827 209.24 80.1518'

interface Props {
  /** 0 = nascer do sol, 1 = pôr do sol. */
  progress: number
}

export function SunArc({ progress }: Props) {
  const id = useId()
  const p = Math.min(1, Math.max(0, progress))
  const angle = Math.PI * p
  const x = 110 - 100 * Math.cos(angle)
  const y = 90 - 80 * Math.sin(angle)
  const isNight = progress <= 0 || progress >= 1

  return (
    <svg className="sun-arc" width="220" height="96" viewBox="0 0 220 96" fill="none" aria-hidden>
      <path d={DASHED_ARC} strokeWidth="3" stroke="white" strokeOpacity="0.8" />
      {p > 0 && (
        <path
          d={`M10 90A100 80 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`}
          strokeWidth="4"
          strokeLinecap="round"
          stroke={`url(#${id}-arc)`}
        />
      )}
      <path d="M0 90H220" stroke="#0B3A5C" strokeOpacity="0.25" />
      <circle
        cx={x}
        cy={y}
        r="10"
        fill={`url(#${id}-sun)`}
        stroke="white"
        strokeWidth="2"
        opacity={isNight ? 0.45 : 1}
      />
      <defs>
        <linearGradient id={`${id}-arc`} x1="10" y1="0" x2={Math.max(x, 11)} y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00BFFF" />
          <stop offset="1" stopColor="#32CD32" />
        </linearGradient>
        <linearGradient id={`${id}-sun`} x1="0" y1={y - 10} x2="0" y2={y + 10} gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF7B0" />
          <stop offset="1" stopColor="#FFB000" />
        </linearGradient>
      </defs>
    </svg>
  )
}
