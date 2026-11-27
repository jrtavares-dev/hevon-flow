import { AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * HevonSummaryPanel — Painel de resumo persistente antes da ação (Baseline 3).
 * Sempre lista explicitamente `faltando: string[]` quando a ação primária estiver desabilitada.
 */
export default function HevonSummaryPanel({
  title = 'Resumo da configuração',
  subtitle,
  items = [],
  faltando = [],
  primaryAction,
  secondaryAction,
  className = '',
}) {
  const hasMissing = Array.isArray(faltando) && faltando.length > 0;

  return (
    <aside className={`hevon-summary-panel ${className}`}>
      <div className="mb-3">
        <div className="hevon-eyebrow mb-1">Resumo</div>
        <h3 className="hevon-section-title">{title}</h3>
        {subtitle && <p className="hevon-data-secondary mb-0 mt-1">{subtitle}</p>}
      </div>

      {items.length > 0 && (
        <dl className="mb-3 d-flex flex-column gap-2" style={{ margin: 0 }}>
          {items.map((item, idx) => (
            <div
              key={item.label || idx}
              className="d-flex justify-content-between align-items-baseline gap-2 pb-2"
              style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)' }}
            >
              <dt className="hevon-data-secondary fw-normal m-0">{item.label}</dt>
              <dd className="hevon-body fw-semibold m-0 text-end hevon-tabular">
                {item.value ?? '—'}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {hasMissing ? (
        <div className="hevon-summary-missing mb-3">
          <div className="d-flex align-items-center gap-1.5 fw-semibold mb-1">
            <AlertCircle size={13} />
            <span>Pendências para liberar</span>
          </div>
          <ul className="mb-0 ps-3" style={{ fontSize: '11px', lineHeight: 1.5 }}>
            {faltando.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div
          className="d-flex align-items-center gap-1.5 mb-3 px-2.5 py-2 rounded-2"
          style={{
            background: 'rgba(16, 185, 129, 0.09)',
            border: '1px solid rgba(16, 185, 129, 0.22)',
            color: 'hsl(var(--success))',
            fontSize: '11.5px',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={14} />
          <span>Pronto para salvar</span>
        </div>
      )}

      <div className="d-flex flex-column gap-2">
        {primaryAction}
        {secondaryAction}
      </div>
    </aside>
  );
}
