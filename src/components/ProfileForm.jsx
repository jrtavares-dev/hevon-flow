'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Users,
  Check,
  X,
  LayoutDashboard,
  Smartphone,
  GitFork,
  Clock,
  Globe,
  Plug,
  Save,
  RotateCw,
  Gamepad2,
} from 'lucide-react';

const MODULES = [
  { key: 'dashboard', name: 'Dashboard & Visão Geral', icon: LayoutDashboard },
  { key: 'presells', name: 'Presell Pages (Comunidades)', icon: Smartphone },
  { key: 'campaigns', name: 'Funis & Campanhas de Upsell', icon: GitFork },
  { key: 'games', name: 'Gamificação & Jogos', icon: Gamepad2 },
  { key: 'sessions', name: 'Sessões & Recuperação', icon: Clock },
  { key: 'domains', name: 'Domínios Personalizados', icon: Globe },
  { key: 'integrations', name: 'Integrações & Webhooks', icon: Plug },
  { key: 'users', name: 'Gestão de Usuários & Equipe', icon: Users },
];

export default function ProfileForm({ admin }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [flashSuccess, setFlashSuccess] = useState('');
  const [flashError, setFlashError] = useState('');

  const [form, setForm] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFlashSuccess('');
    setFlashError('');

    if (form.new_password && form.new_password !== form.confirm_password) {
      setFlashError('A confirmação da nova senha não confere.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFlashError(data.message || 'Erro ao atualizar perfil.');
        setLoading(false);
        return;
      }

      setFlashSuccess('Perfil atualizado com sucesso!');
      setForm({ ...form, current_password: '', new_password: '', confirm_password: '' });
      router.refresh();
      setTimeout(() => setFlashSuccess(''), 4000);
    } catch {
      setFlashError('Erro de conexão ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  let userPerms = [];
  try {
    userPerms = typeof admin?.permissions === 'string' ? JSON.parse(admin?.permissions) : (admin?.permissions || []);
  } catch {}

  const isSuper = admin?.role === 'super_admin' || userPerms.includes('*');

  return (
    <div className="w-100">
      {flashSuccess && (
        <div className="alert alert-success d-flex align-items-center gap-2 border-0 shadow-sm rounded-4 mb-4 p-3" role="alert">
          <CheckCircle2 size={18} className="text-success" />
          <div className="fw-semibold small">{flashSuccess}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setFlashSuccess('')} />
        </div>
      )}

      {flashError && (
        <div className="alert alert-danger d-flex align-items-center gap-2 border-0 shadow-sm rounded-4 mb-4 p-3" role="alert">
          <AlertCircle size={18} className="text-danger" />
          <div className="fw-semibold small">{flashError}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setFlashError('')} />
        </div>
      )}

      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center mb-4 gap-3">
        <div>
          <h1 className="page-title mb-0 fs-3 fw-bold">Meu Perfil</h1>
          <p className="text-muted small mt-1 mb-0" style={{ fontSize: '12.5px' }}>
            Gerencie suas credenciais de acesso, e-mail e segurança da sua conta no UpsellFlow.
          </p>
        </div>
        {isSuper && (
          <Link href="/admin/users" className="btn btn-outline-primary shadow-sm">
            <Users size={16} />
            <span>Gerenciar Usuários da Equipe</span>
          </Link>
        )}
      </div>

      <div className="row g-4">
        {/* Left Column: Avatar & Roles */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center p-4 d-flex flex-column align-items-center justify-content-center">
              <div
                className="user-avatar-circle mb-3 position-relative"
                style={{
                  width: '84px',
                  height: '84px',
                  fontSize: '2.1rem',
                  borderRadius: '22px',
                  background: isSuper ? 'var(--brand-gradient)' : '#0284c7',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
                }}
              >
                {(admin?.name || 'A').charAt(0).toUpperCase()}
                <span
                  className="online-dot position-absolute"
                  style={{
                    width: '18px',
                    height: '18px',
                    bottom: '-3px',
                    right: '-3px',
                    borderRadius: '50%',
                    background: '#10b981',
                    border: '3px solid #ffffff',
                  }}
                />
              </div>

              <h4 className="fw-bold text-dark mb-1 fs-5">{admin?.name}</h4>
              <p className="text-muted small mb-2">{admin?.email}</p>

              <div className="mb-3">
                {isSuper ? (
                  <span
                    className="badge px-3 py-2 rounded-pill fw-bold d-inline-flex align-items-center gap-1"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#dc2626',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      fontSize: '11.5px',
                    }}
                  >
                    <ShieldCheck size={14} /> Super Administrador
                  </span>
                ) : (
                  <span
                    className="badge px-3 py-2 rounded-pill fw-semibold d-inline-flex align-items-center gap-1"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-secondary, #94a3b8)',
                      border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
                      fontSize: '11.5px',
                    }}
                  >
                    <User size={14} /> Operador
                  </span>
                )}
              </div>

              <hr className="w-100 my-3" style={{ borderColor: '#f1f5f9' }} />

              <div className="w-100 text-start">
                <h6 className="fw-bold text-uppercase text-muted small mb-3" style={{ letterSpacing: '0.06em', fontSize: '11px' }}>
                  Módulos Liberados na Conta
                </h6>
                <div className="d-flex flex-column gap-2">
                  {isSuper ? (
                    <div
                      className="p-3 rounded-3 small fw-bold d-flex align-items-center gap-2"
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#059669',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Acesso Irrestrito a Todos os Módulos</span>
                    </div>
                  ) : (
                    MODULES.map((m) => {
                      const has = userPerms.includes(m.key);
                      const IconComp = m.icon;
                      return (
                        <div
                          key={m.key}
                          className={`d-flex align-items-center justify-content-between p-2 rounded-3 ${
                            has ? 'bg-light border' : 'opacity-40'
                          }`}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <IconComp size={15} className="text-primary" />
                            <span className="small fw-semibold text-dark">{m.name}</span>
                          </div>
                          {has ? (
                            <span className="badge rounded-pill bg-success-subtle text-success" style={{ fontSize: '10.5px' }}>
                              Liberado
                            </span>
                          ) : (
                            <span className="badge rounded-pill bg-secondary-subtle text-muted" style={{ fontSize: '10.5px' }}>
                              Bloqueado
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Update Form */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2">
              <User size={18} className="text-primary" />
              <h5 className="mb-0 fs-6 fw-bold text-dark">Alterar Dados do Perfil</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label fw-bold small text-muted">
                    Nome Completo *
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="email" className="form-label fw-bold small text-muted">
                    E-mail de Acesso *
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0"
                      id="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <hr className="my-4" style={{ borderColor: '#f1f5f9' }} />

                <h6 className="fw-bold text-dark mb-3 fs-6 d-flex align-items-center gap-2">
                  <Lock size={16} className="text-primary" />
                  <span>Alteração de Senha</span>
                </h6>

                <div className="row g-3">
                  <div className="col-12">
                    <label htmlFor="current_password" className="form-label fw-bold small text-muted">
                      Senha Atual (Obrigatória apenas para alterar a senha)
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="current_password"
                      placeholder="Digite sua senha atual..."
                      value={form.current_password}
                      onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="new_password" className="form-label fw-bold small text-muted">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="new_password"
                      placeholder="Mínimo 6 caracteres..."
                      value={form.new_password}
                      onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="confirm_password" className="form-label fw-bold small text-muted">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirm_password"
                      placeholder="Repita a nova senha..."
                      value={form.confirm_password}
                      onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary px-4 fw-bold shadow-sm d-inline-flex align-items-center gap-2"
                  >
                    {loading ? <RotateCw size={16} className="spin" /> : <Save size={16} />}
                    <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
