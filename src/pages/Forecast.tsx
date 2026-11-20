import { useState } from 'react'
import type { Forecast as ForecastData, Place } from '../api/openMeteo'
import { DayRow } from '../components/Cards'
import { GlossyButton } from '../components/GlossyButton'
import { MetricTile } from '../components/MetricTile'
import { TempChart } from '../components/TempChart'
import { useNow } from '../hooks/useNow'
import {
  currentHourIndex,
  deg,
  describe,
  formatHour,
  formatShortDay,
  formatTime,
  formatWeekday,
  iconFor,
  shortPlaceLabel,
} from '../lib/weather'

const PERIODS = [7, 10, 16] as const
type Period = (typeof PERIODS)[number]

interface Props {
  place: Place
  forecast: ForecastData
}

export function Forecast({ place, forecast: f }: Props) {
  const [period, setPeriod] = useState<Period>(7)
  const now = useNow()
  const tz = f.timezone
  const d = f.daily
  const days = Math.min(period, d.time.length)
  const range = Array.from({ length: days }, (_, i) => i)

  const scaleMin = Math.min(...range.map((i) => d.temperature_2m_min[i]))
  const scaleMax = Math.max(...range.map((i) => d.temperature_2m_max[i]))
  const hottest = range.reduce((a, b) => (d.temperature_2m_max[b] > d.temperature_2m_max[a] ? b : a), 0)
  const coldest = range.reduce((a, b) => (d.temperature_2m_min[b] < d.temperature_2m_min[a] ? b : a), 0)
  const rainTotal = range.reduce((s, i) => s + (d.precipitation_sum[i] ?? 0), 0)
  const rainyDays = range.filter((i) => (d.precipitation_sum[i] ?? 0) >= 1).length

  // 8 pontos a cada 3 horas, começando na próxima hora cheia.
  const idx = currentHourIndex(f.hourly.time, now)
  const chart = Array.from({ length: 8 }, (_, k) => idx + 1 + k * 3)
    .filter((i) => i < f.hourly.time.length)
    .map((i) => ({ label: formatHour(f.hourly.time[i], tz), temp: f.hourly.temperature_2m[i] }))

  const dayLabel = (i: number) => (i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : formatShortDay(d.time[i], tz))
  const summaryDay = (i: number) => (i <= 1 ? dayLabel(i) : `${formatWeekday(d.time[i], tz)}, ${formatShortDay(d.time[i], tz).split(', ')[1]}`)

  return (
    <div className="forecast">
      <div className="page-title">
        <div className="page-title__text">
          <h1 className="h1">Previsão do tempo</h1>
          <p className="body">
            {shortPlaceLabel(place)} · atualizado às {formatTime(f.fetchedAt / 1000, tz)}
          </p>
        </div>
        <div className="glass period" role="group" aria-label="Período">
          {PERIODS.map((p) => (
            <GlossyButton key={p} cor={period === p ? 'azul' : 'vidro'} aria-pressed={period === p} onClick={() => setPeriod(p)}>
              {p} dias
            </GlossyButton>
          ))}
        </div>
      </div>

      <div className="forecast__grid">
        <section className="glass card days" aria-labelledby="days-title">
          <h2 id="days-title" className="h3">
            Próximos {days} dias
          </h2>
          <ul className="days__list">
            {range.map((i) => (
              <DayRow
                key={d.time[i]}
                day={dayLabel(i)}
                kind={iconFor(d.weather_code[i])}
                description={describe(d.weather_code[i])}
                rain={d.precipitation_probability_max[i]}
                min={d.temperature_2m_min[i]}
                max={d.temperature_2m_max[i]}
                scaleMin={scaleMin}
                scaleMax={scaleMax}
              />
            ))}
          </ul>
        </section>

        <section className="glass card chart-card" aria-labelledby="chart-title">
          <div className="card__title-row">
            <h2 id="chart-title" className="h3">
              Temperatura nas próximas 24h
            </h2>
            <span className="body">°C</span>
          </div>
          <TempChart points={chart} />
          <div className="summary">
            <MetricTile
              rotulo="MÁXIMA DO PERÍODO"
              valor={deg(d.temperature_2m_max[hottest])}
              detalhe={summaryDay(hottest)}
              progresso={(d.temperature_2m_max[hottest] + 10) / 50}
            />
            <MetricTile
              rotulo="MÍNIMA DO PERÍODO"
              valor={deg(d.temperature_2m_min[coldest])}
              detalhe={summaryDay(coldest)}
              progresso={(d.temperature_2m_min[coldest] + 10) / 50}
            />
            <MetricTile
              rotulo="CHUVA ACUMULADA"
              valor={`${Math.round(rainTotal)} mm`}
              detalhe={rainyDays === 0 ? 'Sem chuva prevista' : `${rainyDays} ${rainyDays === 1 ? 'dia' : 'dias'} com chuva`}
              progresso={rainTotal / 100}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
