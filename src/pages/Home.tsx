import type { Forecast, Place } from '../api/openMeteo'
import { HourCard } from '../components/Cards'
import { GlossyButton } from '../components/GlossyButton'
import { MetricTile } from '../components/MetricTile'
import { SunArc } from '../components/SunArc'
import { WeatherIcon } from '../components/WeatherIcon'
import { navigate, ROUTE_HREF } from '../hooks/useHashRoute'
import { useNow } from '../hooks/useNow'
import {
  aqiLabel,
  currentHourIndex,
  deg,
  describe,
  formatDuration,
  formatHour,
  formatLongDate,
  formatTime,
  humidityLabel,
  iconFor,
  isHeavyRain,
  isStorm,
  shortPlaceLabel,
  uvLabel,
  visibilityLabel,
  windDirection,
  type IconKind,
} from '../lib/weather'

interface Props {
  place: Place
  forecast: Forecast
  isSaved: boolean
  onToggleSave: () => void
}

interface Alert {
  kind: IconKind
  title: string
  text: string
  calm?: boolean
}

/** A Open-Meteo não publica alertas oficiais; derivamos avisos das próximas 24h. */
function buildAlert(f: Forecast, idx: number): Alert {
  const tz = f.timezone
  const end = Math.min(idx + 24, f.hourly.time.length)
  const range = Array.from({ length: end - idx }, (_, k) => idx + k)
  const maxGust = Math.round(Math.max(...range.map((i) => f.hourly.wind_gusts_10m[i] ?? 0)))
  const storm = range.find((i) => isStorm(f.hourly.weather_code[i]))
  if (storm !== undefined) {
    return {
      kind: 'tempestade',
      title: 'Alerta · Tempestades',
      text: `Pancadas de chuva com trovoadas a partir das ${formatHour(f.hourly.time[storm], tz)}. Rajadas de até ${maxGust} km/h.`,
    }
  }
  const heavy = range.find((i) => isHeavyRain(f.hourly.weather_code[i]))
  if (heavy !== undefined) {
    return {
      kind: 'chuva',
      title: 'Atenção · Chuva forte',
      text: `Chuva forte prevista a partir das ${formatHour(f.hourly.time[heavy], tz)}. Rajadas de até ${maxGust} km/h.`,
    }
  }
  if (maxGust >= 60) {
    return { kind: 'nublado', title: 'Atenção · Ventos fortes', text: `Rajadas de até ${maxGust} km/h nas próximas 24 horas.` }
  }
  if ((f.daily.uv_index_max[0] ?? 0) >= 8) {
    return {
      kind: 'sol',
      title: 'Atenção · Índice UV muito alto',
      text: `UV máximo de ${Math.round(f.daily.uv_index_max[0])} hoje. Use protetor solar e evite o sol entre 10h e 16h.`,
    }
  }
  return {
    kind: 'sol',
    calm: true,
    title: 'Sem alertas · Tempo tranquilo',
    text: 'Nenhum evento severo previsto para as próximas 24 horas.',
  }
}

export function Home({ place, forecast: f, isSaved, onToggleSave }: Props) {
  const tz = f.timezone
  const now = useNow()
  const c = f.current
  const idx = currentHourIndex(f.hourly.time, now)
  const isDay = c.is_day === 1
  const description = describe(c.weather_code, isDay)

  const hours = [
    { label: 'Agora', code: c.weather_code, day: isDay, temp: c.temperature_2m },
    ...[2, 4, 6, 8, 10]
      .map((o) => idx + o)
      .filter((i) => i < f.hourly.time.length)
      .map((i) => ({
        label: formatHour(f.hourly.time[i], tz),
        code: f.hourly.weather_code[i],
        day: f.hourly.is_day[i] === 1,
        temp: f.hourly.temperature_2m[i],
      })),
  ]

  const sunrise = f.daily.sunrise[0]
  const sunset = f.daily.sunset[0]
  const sunProgress = (now - sunrise) / (sunset - sunrise)

  const pressureBefore = f.hourly.pressure_msl[Math.max(0, idx - 3)]
  const pressureDiff = c.pressure_msl - pressureBefore
  const pressureTrend = pressureDiff > 1 ? 'Subindo' : pressureDiff < -1 ? 'Caindo' : 'Estável'
  const visKm = c.visibility / 1000
  const alert = buildAlert(f, idx)

  return (
    <div className="home">
      <div className="home__main">
        <section className="glass glass--strong card current" aria-label="Clima atual">
          <div className="current__top">
            <h1 className="current__place">📍 {shortPlaceLabel(place)}</h1>
            <span className="chip">● Agora · {formatTime(now, tz)}</span>
          </div>
          <p className="current__date">{formatLongDate(now, tz)}</p>
          <div className="current__temp">
            <WeatherIcon kind={iconFor(c.weather_code, isDay)} size={150} label={description} />
            <p className="display-temp">{deg(c.temperature_2m)}</p>
          </div>
          <p className="current__desc">{description}</p>
          <p className="current__meta">
            Sensação de {deg(c.apparent_temperature)} &nbsp;·&nbsp; Máx {deg(f.daily.temperature_2m_max[0])} &nbsp;·&nbsp;
            Mín {deg(f.daily.temperature_2m_min[0])}
          </p>
          <div className="current__spacer" />
          <div className="current__actions">
            <GlossyButton onClick={() => navigate('previsao')}>Ver previsão completa</GlossyButton>
            <GlossyButton cor="verde" onClick={onToggleSave} aria-pressed={isSaved}>
              {isSaved ? '✓  Cidade salva' : '★  Salvar cidade'}
            </GlossyButton>
          </div>
        </section>

        <div className="home__side">
          <section className="glass card hours" aria-labelledby="hours-title">
            <div className="card__title-row">
              <h2 id="hours-title" className="h3">
                Próximas horas
              </h2>
              <a className="link" href={ROUTE_HREF.previsao}>
                Ver 24 horas ›
              </a>
            </div>
            <div className="hours__list">
              {hours.map((h) => (
                <HourCard
                  key={h.label}
                  label={h.label}
                  kind={iconFor(h.code, h.day)}
                  description={describe(h.code, h.day)}
                  temp={deg(h.temp)}
                />
              ))}
            </div>
          </section>

          <section className={`glass alert${alert.calm ? ' alert--calm' : ''}`} aria-live="polite">
            <WeatherIcon kind={alert.kind} size={44} />
            <div className="alert__text">
              <p className="alert__title">{alert.title}</p>
              <p className="caption">{alert.text}</p>
            </div>
            <GlossyButton cor="vidro" onClick={() => navigate('previsao')}>
              Detalhes
            </GlossyButton>
          </section>

          <section className="glass card sun" aria-labelledby="sun-title">
            <SunArc progress={sunProgress} />
            <div className="sun__text">
              <h2 id="sun-title" className="h3">
                Sol e luz do dia
              </h2>
              <p className="body">
                <span>🌅 Nascer&nbsp; {formatTime(sunrise, tz)}</span>
                <span>🌇 Pôr do sol&nbsp; {formatTime(sunset, tz)}</span>
              </p>
              <p className="caption caption--green">{formatDuration(f.daily.daylight_duration[0])} de luz natural hoje</p>
            </div>
          </section>
        </div>
      </div>

      <section className="metrics" aria-label="Métricas">
        <MetricTile
          rotulo="UMIDADE"
          valor={`${Math.round(c.relative_humidity_2m)}%`}
          detalhe={humidityLabel(c.relative_humidity_2m)}
          progresso={c.relative_humidity_2m / 100}
        />
        <MetricTile
          rotulo="VENTO"
          valor={`${Math.round(c.wind_speed_10m)} km/h`}
          detalhe={windDirection(c.wind_direction_10m)}
          progresso={c.wind_speed_10m / 60}
        />
        <MetricTile rotulo="ÍNDICE UV" valor={String(Math.round(c.uv_index))} detalhe={uvLabel(c.uv_index)} progresso={c.uv_index / 11} />
        <MetricTile
          rotulo="PRESSÃO"
          valor={`${Math.round(c.pressure_msl)} hPa`}
          detalhe={pressureTrend}
          progresso={(c.pressure_msl - 980) / 60}
        />
        <MetricTile
          rotulo="VISIBILIDADE"
          valor={`${visKm >= 10 ? Math.round(visKm) : visKm.toFixed(1).replace('.', ',')} km`}
          detalhe={visibilityLabel(visKm)}
          progresso={visKm / 20}
        />
        <MetricTile
          rotulo="QUALIDADE DO AR"
          valor={f.usAqi != null ? String(Math.round(f.usAqi)) : '—'}
          detalhe={f.usAqi != null ? aqiLabel(f.usAqi) : 'Indisponível'}
          progresso={f.usAqi != null ? f.usAqi / 200 : 0}
        />
      </section>
    </div>
  )
}
