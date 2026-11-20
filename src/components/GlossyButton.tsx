import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Variantes do componente "Botão Glossy" do Figma. */
  cor?: 'azul' | 'verde' | 'vidro'
  size?: 'md' | 'sm'
}

export function GlossyButton({ cor = 'azul', size = 'md', className = '', children, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={`btn-glossy btn-glossy--${cor}${size === 'sm' ? ' btn-glossy--sm' : ''} ${className}`}
      {...rest}
    >
      <span>{children}</span>
    </button>
  )
}
