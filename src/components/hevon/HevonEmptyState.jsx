/**
 * HevonEmptyState — Estado vazio objetivo e contextual (nunca genérico para casos opostos).
 */
export default function HevonEmptyState({
  icon: Icon,
  title = 'Nenhum dado disponível',
  description = '',
  action = null,
  className = '',
}) {
  return (
    <div className={`hevon-empty-state ${className}`}>
      {Icon && (
        <div
          className="d-flex align-items-center justify-content-center rounded-3 mb-1"
          style={{
            width: 36,
            height: 36,
            background: 'hsl(var(--muted) / 0.7)',
            color: 'hsl(var(--muted-foreground))',
            border: '1px solid hsl(var(--border) / 0.6)',
          }}
        >
          <Icon size={17} />
        </div>
      )}
      <div className="hevon-data-primary">{title}</div>
      {description && (
        <p className="hevon-data-secondary mb-0" style={{ maxWidth: 420 }}>
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
