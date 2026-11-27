/**
 * HevonFlowLogo — Logo oficial HEVON FLOW (/images/hevon-flow-logo.png)
 * - surface="dark": usada sobre superfícies escuras fixas (Sidebar #071327, Login Hero #071327)
 * - surface="auto": adapta-se automaticamente ao Light Mode (pill escuro #071327 para alto contraste das letras prateadas)
 *   e ao Dark Mode (fundo transparente integrado)
 */
export default function HevonFlowLogo({
  height = 32,
  surface = 'dark',
  className = '',
  style = {},
}) {
  const img = (
    <img
      src="/images/hevon-flow-logo.png"
      alt="HEVON FLOW"
      style={{
        height: `${height}px`,
        width: 'auto',
        maxWidth: '100%',
        display: 'block',
        objectFit: 'contain',
        userSelect: 'none',
        ...style,
      }}
      draggable={false}
    />
  );

  if (surface === 'auto') {
    return <span className={`hevon-logo-auto-wrap ${className}`}>{img}</span>;
  }

  return <span className={`d-inline-flex align-items-center ${className}`}>{img}</span>;
}
