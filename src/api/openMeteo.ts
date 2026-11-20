// Cliente da Open-Meteo (https://open-meteo.com) — gratuita e sem chave de API.

export interface Place {
  id: string
  name: string
  admin1?: string
  country?: string
  countryCode?: string
  latitude: number
  longitude: number
}

export function placeId(latitude: number, longitude: number): string {
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}`
}

// ---------- Geocodificação (busca por cidade) ----------

interface GeocodingResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country?: string
  country_code?: string
  admin1?: string
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ name: query, count: '6', language: 'pt', format: 'json' })
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal })
  if (!res.ok) throw new Error(`Falha na busca (${res.status})`)
  const json = (await res.json()) as { results?: GeocodingResult[] }
  return (json.results ?? []).map((r) => ({
    id: placeId(r.latitude, r.longitude),
    name: r.name,
    admin1: r.admin1,
    country: r.country,
    countryCode: r.country_code,
    latitude: r.latitude,
    longitude: r.longitude,
  }))
}

// A Open-Meteo não tem geocodificação reversa; para nomear a localização do
// navegador usamos o endpoint gratuito (sem chave) da BigDataCloud.
export async function reverseGeocode(latitude: number, longitude: number): Promise<Place> {
  const fallback: Place = {
    id: placeId(latitude, longitude),
    name: 'Minha localização',
    latitude,
    longitude,
  }
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      localityLanguage: 'pt',
    })
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`)
    if (!res.ok) return fallback
    const j = (await res.json()) as {
      city?: string
      locality?: string
      principalSubdivision?: string
      countryName?: string
      countryCode?: string
    }
    return {
      ...fallback,
      name: j.city || j.locality || fallback.name,
      admin1: j.principalSubdivision || undefined,
      country: j.countryName || undefined,
      countryCode: j.countryCode || undefined,
    }
  } catch {
    return fallback
  }
}

// ---------- Previsão completa ----------

export interface Forecast {
  timezone: string
  fetchedAt: number
  current: {
    time: number
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    is_day: number
    weather_code: number
    pressure_msl: number
    wind_speed_10m: number
    wind_direction_10m: number
    wind_gusts_10m: number
    visibility: number
    uv_index: number
  }
  hourly: {
    time: number[]
    temperature_2m: number[]
    weather_code: number[]
    is_day: number[]
    precipitation_probability: (number | null)[]
    pressure_msl: number[]
    wind_gusts_10m: number[]
  }
  daily: {
    time: number[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    sunrise: number[]
    sunset: number[]
    daylight_duration: number[]
    precipitation_sum: number[]
    precipitation_probability_max: (number | null)[]
    uv_index_max: number[]
  }
  /** Índice de qualidade do ar (US AQI); null se indisponível. */
  usAqi: number | null
}

export async function fetchForecast(place: Place, signal?: AbortSignal): Promise<Forecast> {
  const coords = { latitude: String(place.latitude), longitude: String(place.longitude) }
  const params = new URLSearchParams({
    ...coords,
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'is_day',
      'weather_code',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'visibility',
      'uv_index',
    ].join(','),
    hourly: [
      'temperature_2m',
      'weather_code',
      'is_day',
      'precipitation_probability',
      'pressure_msl',
      'wind_gusts_10m',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'daylight_duration',
      'precipitation_sum',
      'precipitation_probability_max',
      'uv_index_max',
    ].join(','),
    timezone: 'auto',
    timeformat: 'unixtime',
    forecast_days: '16',
    past_hours: '3',
  })

  const aqParams = new URLSearchParams({ ...coords, current: 'us_aqi', timezone: 'auto' })

  const [res, aqi] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal }),
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${aqParams}`, { signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { current?: { us_aqi?: number | null } } | null) => j?.current?.us_aqi ?? null)
      .catch(() => null),
  ])
  if (!res.ok) throw new Error(`Falha ao carregar a previsão (${res.status})`)
  const json = (await res.json()) as Omit<Forecast, 'fetchedAt' | 'usAqi'>
  return { ...json, fetchedAt: Date.now(), usAqi: aqi }
}

// ---------- Resumo de várias cidades (uma única requisição) ----------

export interface CitySummary {
  timezone: string
  temperature: number
  weatherCode: number
  isDay: boolean
  max: number
  min: number
}

interface MultiResponse {
  timezone: string
  current: { temperature_2m: number; weather_code: number; is_day: number }
  daily: { temperature_2m_max: number[]; temperature_2m_min: number[] }
}

export async function fetchCitySummaries(places: Place[], signal?: AbortSignal): Promise<CitySummary[]> {
  if (places.length === 0) return []
  const params = new URLSearchParams({
    latitude: places.map((p) => p.latitude).join(','),
    longitude: places.map((p) => p.longitude).join(','),
    current: 'temperature_2m,weather_code,is_day',
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '1',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal })
  if (!res.ok) throw new Error(`Falha ao carregar as cidades (${res.status})`)
  const json = (await res.json()) as MultiResponse | MultiResponse[]
  const list = Array.isArray(json) ? json : [json]
  return list.map((r) => ({
    timezone: r.timezone,
    temperature: r.current.temperature_2m,
    weatherCode: r.current.weather_code,
    isDay: r.current.is_day === 1,
    max: r.daily.temperature_2m_max[0],
    min: r.daily.temperature_2m_min[0],
  }))
}
