import HevonSkeleton from './HevonSkeleton';

/**
 * HevonMetricCard — Card de KPI limpo sem ícones decorativos (Baseline 4).
 * Exatamente 3 linhas: rótulo 10px uppercase → número grande 24px/600 tabular-nums → 1 linha curta de contexto.
 * Respeita Zero ≠ Vazio ≠ Carregando: usa Skeleton em loading e "—" quando indisponível.
 */
export default function HevonMetricCard({
  label,
  value,
  context,
  loading = false,
  tone = 'default', // 'default' | 'primary' | 'success' | 'warning' | 'danger'
  className = '',
}) {
  const toneColor =
    tone === 'primary'
      ? 'hsl(var(--primary))'
      : tone === 'success'
      ? 'hsl(var(--success))'
      : tone === 'warning'
      ? 'hsl(var(--warning))'
      : tone === 'danger'
      ? 'hsl(var(--destructive))'
      : 'hsl(var(--foreground))';

  const displayValue =
    value === null || value === undefined || value === '' ? '—' : value;

  return (
    <div className={`hevon-metric-card ${className}`}>
      <span className="hevon-metric-label">{label}</span>
      {loading ? (
        <>
          <HevonSkeleton width={110} height={28} />
          <HevonSkeleton width={140} height={13} />
        </>
      ) : (
        <>
          <div className="hevon-metric-value" style={{ color: toneColor }}>
            {displayValue}
          </div>
          {context && <div className="hevon-metric-context">{context}</div>}
        </>
      )}
    </div>
  );
}
