/**
 * HevonFormSection — Marcador numerado de seção em formulários (Baseline 3).
 * Apenas tipografia e separação limpa — não é card aninhado.
 */
export default function HevonFormSection({
  step,
  title,
  description,
  children,
  className = '',
}) {
  return (
    <section className={`hevon-form-section ${className}`}>
      {step && <div className="hevon-form-section-eyebrow">{step}</div>}
      {title && <h2 className="hevon-form-section-title">{title}</h2>}
      {description && <p className="hevon-form-section-desc">{description}</p>}
      <div>{children}</div>
    </section>
  );
}
