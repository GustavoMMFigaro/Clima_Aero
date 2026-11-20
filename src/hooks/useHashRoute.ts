import { useEffect, useState } from 'react'

export type Route = 'inicio' | 'previsao' | 'cidades'

function parse(hash: string): Route {
  if (hash.startsWith('#/previsao')) return 'previsao'
  if (hash.startsWith('#/cidades')) return 'cidades'
  return 'inicio'
}

export const ROUTE_HREF: Record<Route, string> = {
  inicio: '#/',
  previsao: '#/previsao',
  cidades: '#/cidades',
}

export function navigate(route: Route) {
  window.location.hash = ROUTE_HREF[route]
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(window.location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
