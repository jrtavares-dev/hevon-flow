/**
 * HevonIconButton — Área clicável padronizada (32x32) para ícones de ação com tooltip.
 */
export default function HevonIconButton({
  title,
  onClick,
  disabled = false,
  danger = false,
  children,
  className = '',
  type = 'button',
}) {
  return (
    <button
      type={type}
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`hevon-icon-btn ${danger ? 'hevon-icon-btn-danger' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
