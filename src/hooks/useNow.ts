import { useEffect, useState } from 'react'

/** Horário atual (unix, em segundos), atualizado periodicamente. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now() / 1000)
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now() / 1000), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
