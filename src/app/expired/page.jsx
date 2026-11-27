export const metadata = {
  title: 'Oferta Expirada · UpsellFlow',
};

export default function ExpiredPage() {
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
        @keyframes floatHourglass {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
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
            fontSize: '4rem',
            marginBottom: '1.5rem',
            animation: 'floatHourglass 3s ease-in-out infinite',
          }}
        >
          ⏳
        </div>
        <h1 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: '1rem', letterSpacing: '-0.5px' }}>
          Ops, o tempo acabou!
        </h1>
        <p style={{ opacity: 0.8, marginBottom: '2rem', lineHeight: 1.6, fontSize: '1.1rem' }}>
          Infelizmente, esta condição especial expirou e não está mais disponível.
        </p>
      </div>
    </div>
  );
}
