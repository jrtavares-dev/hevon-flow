/**
 * HevonStatusBadge — Wrapper semântico de badge (piso 10px, radius 6px, Light + Dark)
 * Variantes: 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'primary' | 'neutral'
 */
const VARIANT_CLASSES = {
  success: 'hevon-badge-success',
  warning: 'hevon-badge-warning',
  danger: 'hevon-badge-danger',
  info: 'hevon-badge-info',
  purple: 'hevon-badge-purple',
  primary: 'hevon-badge-primary',
  neutral: 'hevon-badge-neutral',
};

export default function HevonStatusBadge({
  variant = 'neutral',
  dot = false,
  children,
  className = '',
  title,
}) {
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.neutral;
  return (
    <span className={`hevon-badge ${variantClass} ${className}`} title={title}>
      {dot && <span className="hevon-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
