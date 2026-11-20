import type { IconKind } from '../lib/weather'
import iconeSol from '../assets/figma/icone-sol.svg'
import iconeTempestade from '../assets/figma/icone-tempestade.svg'
import iconeNoite from '../assets/figma/icone-noite.svg'
import solParcial from '../assets/figma/sol-parcial.svg'
import nuvem from '../assets/figma/nuvem.svg'
import nuvemCinza from '../assets/figma/nuvem-cinza.svg'
import gotas from '../assets/figma/gotas.svg'

interface Layer {
  src: string
  /** Posição da camada dentro do ícone (igual ao componente do Figma). */
  inset: string
  /** Sangria do SVG em relação à camada. */
  bleed: string
}

const ART: Record<IconKind, string | Layer[]> = {
  sol: iconeSol,
  tempestade: iconeTempestade,
  noite: iconeNoite,
  parcial: [
    { src: solParcial, inset: '-7.19% 32.81% 32.81% -7.19%', bleed: '-3.57%' },
    { src: nuvem, inset: '37.38% 10.13% 15.6% 16.91%', bleed: '-2.49% -1.61%' },
  ],
  chuva: [
    { src: nuvem, inset: '18.63% 10.13% 34.35% 16.91%', bleed: '-2.49% -1.61%' },
    { src: gotas, inset: '75% 34.38% 9.38% 32.81%', bleed: '-17.5% -8.34%' },
  ],
  nublado: [
    { src: nuvemCinza, inset: '6.16% 24.59% 60.92% 24.33%', bleed: '-2.49% -1.61%' },
    { src: nuvem, inset: '34.25% 10.13% 18.73% 16.91%', bleed: '-2.49% -1.61%' },
  ],
}

interface Props {
  kind: IconKind
  size: number
  label?: string
}

export function WeatherIcon({ kind, size, label }: Props) {
  const art = ART[kind]
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  return (
    <div className="wicon" style={{ width: size, height: size }} {...a11y}>
      {typeof art === 'string' ? (
        <img className="wicon__img" src={art} alt="" />
      ) : (
        <div className="wicon__art">
          {art.map((layer, i) => (
            <div key={i} className="wicon__layer" style={{ inset: layer.inset }}>
              <div className="wicon__layer" style={{ inset: layer.bleed }}>
                <img className="wicon__img" src={layer.src} alt="" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
