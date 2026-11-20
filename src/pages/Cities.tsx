import { fetchCitySummaries, type CitySummary, type Place } from '../api/openMeteo'
import { StatusCard } from '../components/Cards'
import { GlossyButton } from '../components/GlossyButton'
import { SearchField } from '../components/SearchField'
import { WeatherIcon } from '../components/WeatherIcon'
import { useAsync } from '../hooks/useAsync'
import { useNow } from '../hooks/useNow'
import { deg, describe, formatTime, iconFor, regionLabel } from '../lib/weather'

interface Props {
  myPlace: Place | null
  saved: Place[]
  onAdd: (place: Place) => void
  onRemove: (place: Place) => void
  onOpen: (place: Place) => void
}

export function Cities({ myPlace, saved, onAdd, onRemove, onOpen }: Props) {
  const places = myPlace ? [myPlace, ...saved] : saved
  const key = places.map((p) => p.id).join('|')
  const { data, error, loading, reload } = useAsync(
    (signal) =>
      fetchCitySummaries(places, signal).then(
        (list): Record<string, CitySummary> => Object.fromEntries(places.map((p, i) => [p.id, list[i]])),
      ),
    key,
    10 * 60_000,
  )
  const now = useNow()

  return (
    <div className="cities">
      <div className="page-title">
        <div className="page-title__text">
          <h1 className="h1">Minhas cidades</h1>
          <p className="body">Acompanhe o tempo nos lugares que importam para você</p>
        </div>
        <SearchField
          formId="add-city"
          className="cities__search"
          placeholder="Digite uma cidade para adicionar…"
          onSelect={onAdd}
        />
        <GlossyButton cor="verde" type="submit" form="add-city">
          ＋&nbsp; Adicionar cidade
        </GlossyButton>
      </div>

      {error && !data ? (
        <StatusCard error={error} onRetry={reload} />
      ) : places.length === 0 ? (
        <div className="glass glass--strong status-card">
          <p className="status-card__title">Nenhuma cidade salva</p>
          <p className="status-card__text">Use a busca acima para adicionar cidades.</p>
        </div>
      ) : (
        <ul className="cities__grid" aria-busy={loading}>
          {places.map((p, i) => {
            const s: CitySummary | undefined = data?.[p.id]
            const isMine = !!myPlace && i === 0
            const description = s ? describe(s.weatherCode, s.isDay) : ''
            return (
              <li key={`${p.id}-${i}`} className={`glass city-card${isMine ? ' city-card--mine' : ''}`}>
                <div className="city-card__top">
                  <div>
                    <button className="city-card__open" onClick={() => onOpen(p)}>
                      {p.name}
                    </button>
                    <p className="caption">{isMine ? `Sua localização · ${regionLabel(p)}` : regionLabel(p)}</p>
                  </div>
                  <div className="city-card__aside">
                    {s && <span className="caption caption--blue">{formatTime(now, s.timezone)}</span>}
                    {!isMine && (
                      <button className="city-card__remove" onClick={() => onRemove(p)} aria-label={`Remover ${p.name}`}>
                        ×
                      </button>
                    )}
                  </div>
                </div>
                {s ? (
                  <>
                    <div className="city-card__weather">
                      <WeatherIcon kind={iconFor(s.weatherCode, s.isDay)} size={80} label={description} />
                      <span className="city-temp">{deg(s.temperature)}</span>
                    </div>
                    <p className="city-card__desc">{description}</p>
                    <p className="caption">
                      Máx {deg(s.max)} &nbsp;·&nbsp; Mín {deg(s.min)}
                    </p>
                  </>
                ) : (
                  <p className="caption city-card__loading">Carregando…</p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {myPlace && <p className="caption caption--green legend">●&nbsp; Em destaque verde: sua localização atual</p>}
    </div>
  )
}
