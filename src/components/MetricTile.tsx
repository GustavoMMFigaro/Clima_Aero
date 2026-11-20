interface Props {
  rotulo: string
  valor: string
  detalhe: string
  /** 0 a 1 — preenchimento da barra. */
  progresso: number
}

export function MetricTile({ rotulo, valor, detalhe, progresso }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, progresso)) * 100)
  return (
    <div className="glass tile">
      <p className="tile__label">{rotulo}</p>
      <p className="tile__value">{valor}</p>
      <p className="tile__detail">{detalhe}</p>
      <div className="tile__bar" role="presentation">
        <div className="tile__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
