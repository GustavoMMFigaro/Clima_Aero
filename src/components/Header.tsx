import type { Place } from '../api/openMeteo'
import { ROUTE_HREF, type Route } from '../hooks/useHashRoute'
import { SearchField } from './SearchField'
import orbe from '../assets/figma/orbe.svg'

const NAV: { route: Route; label: string }[] = [
  { route: 'inicio', label: 'Início' },
  { route: 'previsao', label: 'Previsão' },
  { route: 'cidades', label: 'Cidades' },
]

interface Props {
  route: Route
  onSelectPlace: (place: Place) => void
}

export function Header({ route, onSelectPlace }: Props) {
  return (
    <header className="header glass">
      <a className="brand" href={ROUTE_HREF.inicio} aria-label="Clima Aero — início">
        <img src={orbe} alt="" width={40} height={40} />
        <span className="brand__text">
          Clima <strong>Aero</strong>
        </span>
      </a>

      <nav className="nav" aria-label="Principal">
        {NAV.map(({ route: r, label }) => (
          <a
            key={r}
            href={ROUTE_HREF[r]}
            className={`nav__item${route === r ? ' nav__item--active' : ''}`}
            aria-current={route === r ? 'page' : undefined}
          >
            <span>{label}</span>
          </a>
        ))}
        <span className="nav__item nav__item--disabled" title="Em breve" aria-disabled="true">
          <span>Radar</span>
        </span>
      </nav>

      <SearchField className="header__search" onSelect={onSelectPlace} />
    </header>
  )
}
