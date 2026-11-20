import { useEffect, useState } from 'react'

export function useLocalStorage<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw !== null) return JSON.parse(raw) as T
    } catch {
      // armazenamento indisponível (modo privado, etc.)
    }
    return typeof initial === 'function' ? (initial as () => T)() : initial
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignora: a página continua funcionando sem persistência
    }
  }, [key, value])

  return [value, setValue] as const
}
