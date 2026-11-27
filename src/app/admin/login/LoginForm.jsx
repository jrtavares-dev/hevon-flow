'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import HevonFlowLogo from '@/components/hevon/HevonFlowLogo';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Carrega e-mail salvo previamente (se houver)
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('upsellflow_remember_login');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Credenciais inválidas.');
        setLoading(false);
        return;
      }

      // Lembrar login se marcado
      try {
        if (rememberMe) {
          localStorage.setItem('upsellflow_remember_login', email);
        } else {
          localStorage.removeItem('upsellflow_remember_login');
        }
      } catch {
        // ignore
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch {
      setError('Erro de conexão ao servidor. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="uf-login-page-wrapper">
      {/* ================= CARD CONTAINER COMPORTADO (NÃO 100% DE LARGURA) ================= */}
      <div className="uf-login-card-frame">
        {/* ================= COLUNA ESQUERDA (HERO ESCURO & AMBIENT GLOW) ================= */}
        <div className="uf-login-left-hero">
          {/* Glow de fundo sutil */}
          <div className="uf-hero-glow" />

          <div className="uf-hero-content">
            <div style={{ marginBottom: '1.5rem', marginLeft: '-14px' }}>
              <HevonFlowLogo surface="dark" height={86} />
            </div>

            <h1 className="uf-hero-headline">
              Painel de Controle
              <span className="uf-hero-headline-italic">&amp; Gestão de Funis.</span>
            </h1>

            <p className="uf-hero-description">
              Plataforma operacional de funis, presells de alta conversão e gamificação do ecossistema HEVON.
            </p>
          </div>
        </div>

        {/* ================= COLUNA DIREITA (FORMULÁRIO CLEAN & INTEGRADO) ================= */}
        <div className="uf-login-right-panel">
          {/* Área central do Formulário */}
          <div className="uf-login-form-container">
            {/* Título de Boas-vindas */}
            <div className="uf-welcome-header">
              <h2 className="uf-welcome-title">Entre na sua conta</h2>
              <p className="uf-welcome-subtitle">
                Use seu e-mail e senha para continuar.
              </p>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="uf-error-alert">
                <AlertCircle size={17} className="uf-error-icon" />
                <span>{error}</span>
              </div>
            )}

            {/* Formulário de Login */}
            <form onSubmit={handleSubmit} className="uf-login-form">
              {/* Campo E-mail de Acesso */}
              <div className="uf-form-group">
                <label htmlFor="email" className="uf-field-label">
                  E-mail de Acesso
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  placeholder="admin@upsellflow.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="uf-field-input"
                />
              </div>

              {/* Campo Senha */}
              <div className="uf-form-group">
                <label htmlFor="password" className="uf-field-label">
                  Senha
                </label>
                <div className="uf-password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="uf-field-input uf-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="uf-password-toggle-btn"
                    tabIndex={-1}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              {/* Checkbox Lembrar login */}
              <div className="uf-remember-group">
                <label className="uf-remember-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="uf-remember-checkbox"
                  />
                  <span>Lembrar meu login</span>
                </label>
              </div>

              {/* Botão de Entrar */}
              <button
                type="submit"
                disabled={loading}
                className="uf-submit-btn"
              >
                {loading ? (
                  <>
                    <RotateCw size={17} className="uf-spinner" />
                    <span>Entrando no Sistema...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight size={17} />
                    <span>Entrar no Sistema</span>
                  </>
                )}
              </button>
            </form>

            {/* Rodapé da Direita */}
            <div className="uf-login-footer">
              HEVON FLOW · Sistema de Funil &amp; Presell
            </div>
          </div>
        </div>
      </div>

      {/* ================= ESTILOS DO SPLIT LOGIN (HEVON DESIGN SYSTEM v2.0) ================= */}
      <style jsx global>{`
        .uf-login-page-wrapper {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 2rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background-color: hsl(var(--background));
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .uf-login-card-frame {
          width: 100%;
          max-width: 960px;
          min-height: 540px;
          display: flex;
          border-radius: 14px;
          overflow: hidden;
          background-color: hsl(var(--card));
          border: 1px solid hsl(var(--border) / 0.85);
          box-shadow: var(--shadow-lg);
        }

        /* Coluna esquerda: mesma superfície escura da Sidebar oficial HEVON (#071327) */
        .uf-login-left-hero {
          flex: 1.02;
          background-color: hsl(var(--sidebar-background));
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          position: relative;
          border-right: 1px solid hsl(var(--sidebar-border));
          color: #ffffff;
          overflow: hidden;
        }

        .uf-hero-glow {
          display: none;
        }

        .uf-hero-content {
          max-width: 390px;
          position: relative;
          z-index: 2;
        }

        .uf-hero-kicker {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: hsl(var(--sidebar-primary));
          background: hsl(var(--sidebar-primary) / 0.16);
          border: 1px solid hsl(var(--sidebar-primary) / 0.35);
          border-radius: 6px;
          padding: 3px 9px;
          margin-bottom: 1.5rem;
        }

        .uf-hero-headline {
          font-size: 2.15rem;
          line-height: 1.2;
          font-weight: 600;
          letter-spacing: -0.025em;
          color: #ffffff;
          margin: 0 0 1rem 0;
          display: flex;
          flex-direction: column;
        }

        .uf-hero-headline-italic {
          font-weight: 400;
          color: hsl(220 15% 75%);
          margin-top: 0.25rem;
        }

        .uf-hero-description {
          font-size: 13px;
          line-height: 1.55;
          color: hsl(var(--sidebar-muted));
          margin: 0;
          font-weight: 400;
        }

        /* Coluna direita: semântica Light + Dark Mode */
        .uf-login-right-panel {
          flex: 0.98;
          background-color: hsl(var(--card));
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3rem;
          box-sizing: border-box;
          color: hsl(var(--card-foreground));
        }

        .uf-login-form-container {
          width: 100%;
          max-width: 350px;
          margin: 0 auto;
        }

        .uf-brand-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .uf-brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: hsl(var(--primary));
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--primary-foreground));
          flex-shrink: 0;
        }

        .uf-brand-texts {
          display: flex;
          flex-direction: column;
        }

        .uf-brand-name {
          font-weight: 600;
          font-size: 15px;
          color: hsl(var(--foreground));
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .uf-brand-subtitle {
          font-size: 11px;
          color: hsl(var(--muted-foreground));
          line-height: 1.25;
          margin-top: 2px;
        }

        .uf-welcome-header {
          margin-bottom: 1.25rem;
        }

        .uf-welcome-title {
          font-size: 19px;
          font-weight: 600;
          color: hsl(var(--foreground));
          margin: 0 0 0.25rem 0;
          letter-spacing: -0.02em;
        }

        .uf-welcome-subtitle {
          font-size: 12px;
          color: hsl(var(--muted-foreground));
          margin: 0;
        }

        .uf-error-alert {
          background-color: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.25);
          color: hsl(var(--destructive));
          border-radius: 8px;
          padding: 0.6rem 0.8rem;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .uf-error-icon {
          flex-shrink: 0;
        }

        .uf-login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .uf-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .uf-field-label {
          font-size: 11px;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0;
        }

        .uf-field-input {
          width: 100%;
          height: 38px;
          background: hsl(var(--card));
          border: 1px solid hsl(var(--input));
          border-radius: 8px;
          padding: 0 0.85rem;
          font-size: 13px;
          color: hsl(var(--foreground));
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          font-family: inherit;
        }

        .uf-field-input::placeholder {
          color: hsl(var(--muted-foreground));
          opacity: 0.7;
        }

        .uf-field-input:focus {
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 2px hsl(var(--ring) / 0.18);
        }

        .uf-password-wrapper {
          position: relative;
          width: 100%;
        }

        .uf-password-input {
          padding-right: 4.5rem;
        }

        .uf-password-toggle-btn {
          position: absolute;
          right: 0.65rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 11px;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          cursor: pointer;
          padding: 0.2rem 0.4rem;
          border-radius: 6px;
        }

        .uf-password-toggle-btn:hover {
          color: hsl(var(--foreground));
        }

        .uf-remember-group {
          display: flex;
          align-items: center;
          margin-top: -0.15rem;
        }

        .uf-remember-label {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 12px;
          color: hsl(var(--muted-foreground));
          cursor: pointer;
          user-select: none;
        }

        .uf-remember-checkbox {
          width: 14px;
          height: 14px;
          border-radius: 4px;
          accent-color: hsl(var(--primary));
          cursor: pointer;
        }

        /* Ação primária única oficial HEVON */
        .uf-submit-btn {
          width: 100%;
          height: 38px;
          background: hsl(var(--primary));
          border: 1px solid hsl(var(--primary));
          border-radius: 8px;
          padding: 0 1rem;
          color: hsl(var(--primary-foreground));
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: opacity 0.15s ease;
          margin-top: 0.25rem;
          font-family: inherit;
        }

        .uf-submit-btn:hover:not(:disabled) {
          opacity: 0.92;
        }

        .uf-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .uf-spinner {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .uf-login-footer {
          font-size: 11px;
          color: hsl(var(--muted-foreground));
          text-align: center;
          width: 100%;
          padding-top: 1.5rem;
        }

        @media (max-width: 900px) {
          .uf-login-page-wrapper {
            padding: 1rem;
          }
          .uf-login-card-frame {
            flex-direction: column;
            max-width: 440px;
            min-height: auto;
          }
          .uf-login-left-hero {
            flex: none;
            padding: 2rem 1.75rem;
            text-align: center;
            border-right: none;
            border-bottom: 1px solid hsl(var(--sidebar-border));
          }
          .uf-hero-headline {
            font-size: 1.75rem;
          }
          .uf-login-right-panel {
            flex: none;
            padding: 2rem 1.75rem;
          }
        }
      `}</style>
    </div>
  );
}
