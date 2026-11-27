/**
 * HevonPageHeader — Cabeçalho padronizado minimalista (título, subtítulo, badge e ações).
 * Sem hero gigante. Segue border-b border-border/60 pb-5.
 */
export default function HevonPageHeader({
  title,
  subtitle,
  badge,
  actions,
  className = '',
}) {
  return (
    <div className={`hevon-page-header ${className}`}>
      <div style={{ minWidth: 0 }}>
        <div className="d-flex align-items-center flex-wrap gap-2">
          <h1 className="hevon-page-title">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="hevon-page-subtitle">{subtitle}</p>}
      </div>
      {actions && (
        <div className="d-flex align-items-center flex-wrap gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
