import type { Place } from '../api/openMeteo'

export type IconKind = 'sol' | 'parcial' | 'nublado' | 'chuva' | 'tempestade' | 'noite'

// Códigos WMO usados pela Open-Meteo.
const DESCRIPTIONS: Record<number, string> = {
  0: 'Céu limpo',
  1: 'Poucas nuvens',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina com geada',
  51: 'Garoa fraca',
  53: 'Garoa',
  55: 'Garoa forte',
  56: 'Garoa congelante',
  57: 'Garoa congelante forte',
  61: 'Chuva fraca',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  66: 'Chuva congelante',
  67: 'Chuva congelante forte',
  71: 'Neve fraca',
  73: 'Neve moderada',
  75: 'Neve forte',
  77: 'Grãos de neve',
  80: 'Pancadas de chuva',
  81: 'Pancadas de chuva moderadas',
  82: 'Pancadas de chuva fortes',
  85: 'Pancadas de neve',
  86: 'Pancadas de neve fortes',
  95: 'Trovoadas',
  96: 'Trovoadas com granizo',
  99: 'Trovoadas com granizo forte',
}

export function describe(code: number, isDay = true): string {
  if (code === 0 && isDay) return 'Ensolarado'
  return DESCRIPTIONS[code] ?? 'Indefinido'
}

export function iconFor(code: number, isDay = true): IconKind {
  if (code >= 95) return 'tempestade'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'chuva'
  if (code <= 2 && !isDay) return 'noite'
  if (code === 0 || code === 1) return 'sol'
  if (code === 2) return 'parcial'
  return 'nublado'
}

export const isStorm = (code: number) => code >= 95
export const isHeavyRain = (code: number) => code === 65 || code === 67 || code === 82

// ---------- Datas e horas no fuso da cidade ----------

const fmtCache = new Map<string, Intl.DateTimeFormat>()
function fmt(timeZone: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = timeZone + JSON.stringify(opts)
  let f = fmtCache.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat('pt-BR', { timeZone, ...opts })
    fmtCache.set(key, f)
  }
  return f
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "08:30" */
export function formatTime(unix: number, timeZone: string): string {
  return fmt(timeZone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(unix * 1000)
}

/** "10h" */
export function formatHour(unix: number, timeZone: string): string {
  return `${fmt(timeZone, { hour: '2-digit', hourCycle: 'h23' }).format(unix * 1000)}h`
}

/** "Quinta-feira, 19 de novembro" */
export function formatLongDate(unix: number, timeZone: string): string {
  return capitalize(fmt(timeZone, { weekday: 'long', day: 'numeric', month: 'long' }).format(unix * 1000))
}

/** "Sex, 21" */
export function formatShortDay(unix: number, timeZone: string): string {
  const parts = fmt(timeZone, { weekday: 'short', day: 'numeric' }).formatToParts(unix * 1000)
  const weekday = parts.find((p) => p.type === 'weekday')?.value.replace('.', '') ?? ''
  const day = parts.find((p) => p.type === 'day')?.value ?? ''
  return `${capitalize(weekday)}, ${day}`
}

/** "segunda-feira" */
export function formatWeekday(unix: number, timeZone: string): string {
  return capitalize(fmt(timeZone, { weekday: 'long' }).format(unix * 1000))
}

/** 47760 s -> "13h16" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return `${h}h${String(m).padStart(2, '0')}`
}

export const deg = (t: number) => `${Math.round(t)}°`

/** Índice do último horário que já começou (a "hora atual"). */
export function currentHourIndex(times: number[], nowUnix: number): number {
  let idx = 0
  for (let i = 0; i < times.length; i++) {
    if (times[i] <= nowUnix) idx = i
    else break
  }
  return idx
}

// ---------- Métricas ----------

const DIRECTIONS = ['Norte', 'Nordeste', 'Leste', 'Sudeste', 'Sul', 'Sudoeste', 'Oeste', 'Noroeste']
export const windDirection = (degrees: number) => DIRECTIONS[Math.round(degrees / 45) % 8]

export function humidityLabel(h: number): string {
  if (h < 30) return 'Ar seco'
  if (h < 60) return 'Confortável'
  if (h < 80) return 'Úmido'
  return 'Muito úmido'
}

export function uvLabel(uv: number): string {
  if (uv < 3) return 'Baixo'
  if (uv < 6) return 'Moderado'
  if (uv < 8) return 'Alto · use protetor'
  if (uv < 11) return 'Muito alto · evite o sol'
  return 'Extremo'
}

export function visibilityLabel(km: number): string {
  if (km >= 10) return 'Céu aberto'
  if (km >= 4) return 'Boa'
  if (km >= 1) return 'Moderada'
  return 'Neblina'
}

export function aqiLabel(aqi: number): string {
  if (aqi <= 50) return 'Boa'
  if (aqi <= 100) return 'Moderada'
  if (aqi <= 150) return 'Ruim p/ sensíveis'
  if (aqi <= 200) return 'Ruim'
  if (aqi <= 300) return 'Muito ruim'
  return 'Perigosa'
}

// ---------- Nomes de lugares ----------

const UF: Record<string, string> = {
  Acre: 'AC', Alagoas: 'AL', Amapá: 'AP', Amazonas: 'AM', Bahia: 'BA', Ceará: 'CE',
  'Distrito Federal': 'DF', 'Espírito Santo': 'ES', Goiás: 'GO', Maranhão: 'MA',
  'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG', Pará: 'PA',
  Paraíba: 'PB', Paraná: 'PR', Pernambuco: 'PE', Piauí: 'PI', 'Rio de Janeiro': 'RJ',
  'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS', Rondônia: 'RO', Roraima: 'RR',
  'Santa Catarina': 'SC', 'São Paulo': 'SP', Sergipe: 'SE', Tocantins: 'TO',
}

/** "Londrina, PR" / "Lisboa, Portugal" */
export function shortPlaceLabel(p: Place): string {
  if (p.countryCode?.toUpperCase() === 'BR' && p.admin1 && UF[p.admin1]) return `${p.name}, ${UF[p.admin1]}`
  if (p.country && p.country !== p.name) return `${p.name}, ${p.country}`
  return p.name
}

/** "Paraná, Brasil" / "Portugal" */
export function regionLabel(p: Place): string {
  // No Brasil o estado é sempre exibido ("São Paulo, Brasil"); fora dele, só quando difere do nome.
  const keepAdmin = p.countryCode?.toUpperCase() === 'BR'
  const parts = [p.admin1, p.country].filter(
    (s): s is string => !!s && (s !== p.name || (keepAdmin && s === p.admin1)),
  )
  return [...new Set(parts)].join(', ')
}

/** Distância aproximada em km, para evitar cidades duplicadas. */
export function distanceKm(a: Place, b: Place): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export const samePlace = (a: Place, b: Place) => distanceKm(a, b) < 5
