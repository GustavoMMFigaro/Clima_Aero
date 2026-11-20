import type { IconKind } from '../lib/weather'
import { WeatherIcon } from './WeatherIcon'
import { GlossyButton } from './GlossyButton'

/** Componente "Card/Hora" do Figma. */
export function HourCard({ label, kind, description, temp }: { label: string; kind: IconKind; description: string; temp: string }) {
  return (
    <div className="glass hour-card">
      <p className="hour-card__label">{label}</p>
      <WeatherIcon kind={kind} size={48} label={description} />
      <p className="hour-card__temp">{temp}</p>
    </div>
  )
}

interface DayRowProps {
  day: string
  kind: IconKind
  description: string
  rain: number | null
  min: number
  max: number
  /** Faixa de temperatura de toda a semana, para posicionar a barra. */
  scaleMin: number
  scaleMax: number
}

/** Componente "Linha/Dia" do Figma. */
export function DayRow({ day, kind, description, rain, min, max, scaleMin, scaleMax }: DayRowProps) {
  const range = scaleMax - scaleMin || 1
  const left = ((min - scaleMin) / range) * 100
  const width = Math.max(6, ((max - min) / range) * 100)
  return (
    <li className="glass day-row">
      <span className="day-row__day">{day}</span>
      <WeatherIcon kind={kind} size={40} label={description} />
      <span className="day-row__desc">{description}</span>
      <span className="day-row__rain" title="Chance de chuva">
        {rain != null && rain > 0 ? `💧 ${rain}%` : ''}
      </span>
      <span className="day-row__min">{Math.round(min)}°</span>
      <span className="day-row__bar" aria-hidden>
        <span style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }} />
      </span>
      <span className="day-row__max">{Math.round(max)}°</span>
    </li>
  )
}

/** Cartão de vidro para estados de carregamento e erro. */
export function StatusCard({ loading, error, onRetry }: { loading?: boolean; error?: Error | null; onRetry?: () => void }) {
  return (
    <div className="glass glass--strong status-card" role={error ? 'alert' : 'status'}>
      {error ? (
        <>
          <WeatherIcon kind="tempestade" size={64} />
          <p className="status-card__title">Não foi possível carregar o tempo</p>
          <p className="status-card__text">{error.message}</p>
          {onRetry && <GlossyButton onClick={onRetry}>Tentar novamente</GlossyButton>}
        </>
      ) : loading ? (
        <>
          <div className="status-card__spin">
            <WeatherIcon kind="parcial" size={64} />
          </div>
          <p className="status-card__title">Carregando previsão…</p>
        </>
      ) : null}
    </div>
  )
}
