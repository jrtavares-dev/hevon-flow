/**
 * HevonToolbar — Linha horizontal densa de filtros, busca e abas.
 */
export default function HevonToolbar({ left, right, children, className = '' }) {
  return (
    <div className={`hevon-toolbar ${className}`}>
      {children ? (
        children
      ) : (
        <>
          <div className="d-flex align-items-center flex-wrap gap-2">{left}</div>
          {right && <div className="d-flex align-items-center flex-wrap gap-2">{right}</div>}
        </>
      )}
    </div>
  );
}
