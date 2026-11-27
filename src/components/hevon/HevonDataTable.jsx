import HevonSkeleton from './HevonSkeleton';
import HevonEmptyState from './HevonEmptyState';

/**
 * HevonDataTable — Infraestrutura de tabela com 3 densidades oficiais:
 * - compact (48px): listagens operacionais grandes
 * - standard (56px): cadastros, configurações, listas menores
 * - two-line (60–64px): célula com valor principal + contexto empilhado
 */
const DENSITY_CLASS = {
  compact: 'hevon-table-compact',
  standard: 'hevon-table-standard',
  'two-line': 'hevon-table-two-line',
};

export default function HevonDataTable({
  columns = [],
  data = [],
  density = 'compact',
  loading = false,
  skeletonRows = 5,
  rowKey,
  onRowClick,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription = '',
  emptyAction = null,
  footerRow = null,
  className = '',
}) {
  const densityClass = DENSITY_CLASS[density] || DENSITY_CLASS.compact;

  return (
    <div className={`hevon-card overflow-hidden ${className}`}>
      <div className="table-responsive">
        <table className={`table table-hover align-middle mb-0 ${densityClass}`}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.align === 'right' ? 'text-end' : col.align === 'center' ? 'text-center' : ''}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, rIdx) => (
                <tr key={`sk-${rIdx}`}>
                  {columns.map((col, cIdx) => (
                    <td
                      key={`sk-${rIdx}-${col.key || cIdx}`}
                      className={col.align === 'right' ? 'text-end' : col.align === 'center' ? 'text-center' : ''}
                    >
                      <HevonSkeleton
                        width={cIdx === 0 ? '70%' : '55%'}
                        height={14}
                        style={col.align === 'right' ? { marginLeft: 'auto' } : col.align === 'center' ? { margin: '0 auto' } : undefined}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={Math.max(columns.length, 1)} style={{ padding: 0 }}>
                  <HevonEmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              <>
                {data.map((row, idx) => {
                  const key = typeof rowKey === 'function' ? rowKey(row, idx) : row?.[rowKey] ?? idx;
                  const clickable = typeof onRowClick === 'function';
                  return (
                    <tr
                      key={key}
                      onClick={clickable ? () => onRowClick(row) : undefined}
                      className={clickable ? 'hevon-table-row-clickable' : undefined}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`${
                            col.align === 'right' ? 'text-end' : col.align === 'center' ? 'text-center' : ''
                          } ${col.numeric ? 'hevon-tabular' : ''} ${col.className || ''}`}
                        >
                          {typeof col.render === 'function' ? col.render(row, idx) : (row?.[col.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {footerRow}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
