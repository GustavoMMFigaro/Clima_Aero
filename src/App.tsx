import { useEffect, useRef, useState } from 'react'
import { fetchForecast, placeId, reverseGeocode, type Place } from './api/openMeteo'
import { StatusCard } from './components/Cards'
import { Header } from './components/Header'
import { useAsync } from './hooks/useAsync'
import { navigate, useHashRoute } from './hooks/useHashRoute'
import { useLocalStorage } from './hooks/useLocalStorage'
import { samePlace } from './lib/weather'
import { Cities } from './pages/Cities'
import { Forecast } from './pages/Forecast'
import { Home } from './pages/Home'

const city = (name: string, admin1: string, country: string, countryCode: string, latitude: number, longitude: number): Place => ({
  id: placeId(latitude, longitude),
  name,
  admin1,
  country,
  countryCode,
  latitude,
  longitude,
})

const LONDRINA = city('Londrina', 'Paraná', 'Brasil', 'BR', -23.3045, -51.1696)

const DEFAULT_SAVED: Place[] = [
  LONDRINA,
  city('São Paulo', 'São Paulo', 'Brasil', 'BR', -23.5475, -46.6361),
  city('Curitiba', 'Paraná', 'Brasil', 'BR', -25.4278, -49.2731),
  city('Rio de Janeiro', 'Rio de Janeiro', 'Brasil', 'BR', -22.9064, -43.1822),
  city('Florianópolis', 'Santa Catarina', 'Brasil', 'BR', -27.5967, -48.5492),
  city('Brasília', 'Distrito Federal', 'Brasil', 'BR', -15.7797, -47.9297),
  city('Lisboa', 'Lisboa', 'Portugal', 'PT', 38.7167, -9.1333),
  city('Tóquio', 'Tóquio', 'Japão', 'JP', 35.6895, 139.6917),
]

export default function App() {
  const route = useHashRoute()
  const [place, setPlace] = useLocalStorage<Place>('clima-aero:cidade', LONDRINA)
  const [saved, setSaved] = useLocalStorage<Place[]>('clima-aero:salvas', DEFAULT_SAVED)
  const [myPlace, setMyPlace] = useState<Place | null>(null)
  const userPicked = useRef(false)

  // Localização do navegador: vira a cidade atual, a menos que o usuário já tenha escolhido outra.
  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const p = await reverseGeocode(coords.latitude, coords.longitude)
        setMyPlace(p)
        if (!userPicked.current) setPlace(p)
      },
      () => {
        // permissão negada ou indisponível: mantém a última cidade
      },
      { timeout: 10_000, maximumAge: 30 * 60_000 },
    )
  }, [setPlace])

  const forecast = useAsync((signal) => fetchForecast(place, signal), place.id, 10 * 60_000)

  function selectPlace(p: Place) {
    userPicked.current = true
    setPlace(p)
    if (route === 'cidades') navigate('inicio')
  }

  const isSaved = saved.some((s) => samePlace(s, place))
  function toggleSave() {
    setSaved((list) => (isSaved ? list.filter((s) => !samePlace(s, place)) : [...list, place]))
  }

  function addCity(p: Place) {
    setSaved((list) => (list.some((s) => samePlace(s, p)) ? list : [...list, p]))
  }

  const savedWithoutMine = myPlace ? saved.filter((s) => !samePlace(s, myPlace)) : saved

  return (
    <div className="page">
      <Header route={route} onSelectPlace={selectPlace} />
      <main className="page__content">
        {route === 'cidades' ? (
          <Cities
            myPlace={myPlace}
            saved={savedWithoutMine}
            onAdd={addCity}
            onRemove={(p) => setSaved((list) => list.filter((s) => !samePlace(s, p)))}
            onOpen={selectPlace}
          />
        ) : !forecast.data ? (
          <StatusCard loading={forecast.loading} error={forecast.error} onRetry={forecast.reload} />
        ) : route === 'previsao' ? (
          <Forecast place={place} forecast={forecast.data} />
        ) : (
          <Home place={place} forecast={forecast.data} isSaved={isSaved} onToggleSave={toggleSave} />
        )}
      </main>
      <footer className="footer caption">
        Dados meteorológicos:{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Open-Meteo.com
        </a>{' '}
        (CC BY 4.0)
      </footer>
    </div>
  )
}
