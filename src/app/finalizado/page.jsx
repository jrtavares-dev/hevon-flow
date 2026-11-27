export const metadata = {
  title: 'Processo Finalizado · UpsellFlow',
};

export default function FinalizadoPage() {
  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: '#0f172a',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        margin: 0,
        textAlign: 'center',
        padding: '1rem',
      }}
    >
      <style>{`
        @keyframes bounceSparkle {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-20px); }
          60% { transform: translateY(-10px); }
        }
      `}</style>
      <div
        style={{
          maxWidth: '450px',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '3rem 2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            fontSize: '4.5rem',
            marginBottom: '1.5rem',
            animation: 'bounceSparkle 2s ease-in-out infinite',
          }}
        >
          ✨
        </div>
        <h1 style={{ fontWeight: 800, fontSize: '2.2rem', marginBottom: '1rem', letterSpacing: '-0.5px' }}>
          Tudo Certo!
        </h1>
        <p style={{ opacity: 0.8, marginBottom: '1rem', lineHeight: 1.6, fontSize: '1.1rem' }}>
          Seus pedidos foram processados com sucesso.
        </p>
        <p style={{ fontSize: '0.95rem', opacity: 0.6 }}>
          Em breve você receberá as confirmações por e-mail.
        </p>
      </div>
    </div>
  );
}
