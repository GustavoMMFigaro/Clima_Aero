import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { searchPlaces, type Place } from '../api/openMeteo'
import { regionLabel } from '../lib/weather'
import { GlossyButton } from './GlossyButton'
import lupa from '../assets/figma/lupa.svg'

interface Props {
  placeholder?: string
  onSelect: (place: Place) => void
  /** id do <form>, para que botões externos possam enviar a busca. */
  formId?: string
  className?: string
}

export function SearchField({ placeholder = 'Buscar cidade…', onSelect, formId, className = '' }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [message, setMessage] = useState<string | null>(null)
  const listId = useId()
  const rootRef = useRef<HTMLFormElement>(null)

  // Sugestões com debounce enquanto o usuário digita.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    const controller = new AbortController()
    const t = window.setTimeout(() => {
      searchPlaces(q, controller.signal)
        .then((r) => {
          setResults(r)
          setActive(r.length ? 0 : -1)
          setMessage(r.length ? null : 'Nenhuma cidade encontrada')
        })
        .catch((e: unknown) => {
          if (!controller.signal.aborted) setMessage(e instanceof Error ? e.message : 'Erro na busca')
        })
    }, 300)
    return () => {
      controller.abort()
      window.clearTimeout(t)
    }
  }, [query])

  // Fecha a lista ao clicar fora.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  function choose(place: Place) {
    onSelect(place)
    setQuery('')
    setResults([])
    setOpen(false)
    setActive(-1)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    const ready = q.length >= 2 ? (results[active] ?? results[0]) : undefined
    if (ready) return choose(ready)
    try {
      const r = await searchPlaces(q)
      if (r[0]) choose(r[0])
      else {
        setMessage('Nenhuma cidade encontrada')
        setOpen(true)
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro na busca')
      setOpen(true)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault()
      setActive((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && query.trim().length >= 2 && (results.length > 0 || !!message)

  return (
    <form ref={rootRef} id={formId} className={`search glass glass--strong ${className}`} onSubmit={onSubmit} role="search">
      <img className="search__icon" src={lupa} alt="" width={20} height={20} />
      <input
        className="search__input"
        type="text"
        value={query}
        placeholder={placeholder}
        aria-label={placeholder.replace('…', '')}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={active >= 0 && showList ? `${listId}-${active}` : undefined}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      <GlossyButton type="submit" size="sm">
        Ir
      </GlossyButton>

      {showList && (
        <ul className="search__list glass glass--strong" id={listId} role="listbox">
          {results.map((p, i) => (
            <li
              key={`${p.id}-${i}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`search__option${i === active ? ' is-active' : ''}`}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => choose(p)}
              onMouseEnter={() => setActive(i)}
            >
              <span className="search__name">{p.name}</span>
              <span className="search__region">{regionLabel(p)}</span>
            </li>
          ))}
          {message && results.length === 0 && <li className="search__message">{message}</li>}
        </ul>
      )}
    </form>
  )
}
