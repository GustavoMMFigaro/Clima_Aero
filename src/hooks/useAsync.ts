import { useCallback, useEffect, useRef, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  error: Error | null
  loading: boolean
  reload: () => void
}

/**
 * Executa `fn` sempre que `key` muda (cancelando a requisição anterior) e,
 * opcionalmente, a cada `refreshMs` milissegundos.
 */
export function useAsync<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  key: string,
  refreshMs?: number,
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  })

  // Ao trocar de chave (ex.: outra cidade), descarta os dados antigos para não
  // exibir informações da cidade anterior; atualizações periódicas mantêm os dados.
  const [prevKey, setPrevKey] = useState(key)
  if (prevKey !== key) {
    setPrevKey(key)
    setData(null)
  }

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fnRef.current(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
    // a chave identifica a requisição; `fn` mais recente fica em fnRef.
  }, [key, tick])

  useEffect(() => {
    if (!refreshMs) return
    const id = window.setInterval(() => setTick((t) => t + 1), refreshMs)
    return () => window.clearInterval(id)
  }, [refreshMs])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, error, loading, reload }
}
