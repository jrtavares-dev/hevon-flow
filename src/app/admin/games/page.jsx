import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { HevonPageHeader, HevonStatusBadge } from '@/components/hevon';
import {
  Gamepad2,
  Puzzle,
  Sparkles,
  Trophy,
  Dices,
  CircleDot,
  Gift,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Flame,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminGamesHubPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const games = [
    {
      id: 'puzzle',
      title: 'Quebra-Cabeça Premiado',
      subtitle: 'Álbuns colecionáveis de 9 peças com entrega automática de prêmios via PIX.',
      icon: Puzzle,
      iconColor: 'hsl(var(--primary))',
      iconBg: 'hsl(var(--primary) / 0.1)',
      accentGradient: 'hsl(var(--primary))',
      btnGradient: 'hsl(var(--primary))',
      btnShadow: 'none',
      status: 'active',
      badgeText: 'Ativo & Operacional',
      features: [
        '9 peças colecionáveis por álbum',
        'Travas de segurança para peças raras',
        'Controle de orçamento diário (Budget)',
        'Resgate instantâneo via PIX ou envio',
      ],
      link: '/admin/puzzles',
      buttonText: 'Gerenciar Quebra-Cabeças',
    },
    {
      id: 'wheel',
      title: 'Roleta da Sorte (Spin to Win)',
      subtitle: 'Roleta de prêmios, cupons de desconto e cashback para aumentar conversão.',
      icon: CircleDot,
      iconColor: '#d97706',
      iconBg: 'rgba(245, 158, 11, 0.12)',
      accentGradient: '#d97706',
      btnGradient: '#d97706',
      btnShadow: '0 4px 12px rgba(245, 158, 11, 0.28)',
      status: 'active',
      badgeText: 'Ativo & Operacional',
      features: [
        'Fatias configuráveis com probabilidades',
        'Gatilho de Exit-Intent ou pós-compra',
        'Cupons de 1-clique aplicados no upsell',
        'Efeitos sonoros e animação física',
      ],
      link: '/admin/wheel',
      buttonText: 'Gerenciar Roleta',
      disabled: false,
    },
    {
      id: 'scratch',
      title: 'Raspadinha Digital (Scratch Card)',
      subtitle: 'Experiência sensorial onde o comprador raspa e ganha bônus exclusivos.',
      icon: Flame,
      iconColor: '#db2777',
      iconBg: 'rgba(236, 72, 153, 0.12)',
      accentGradient: '#db2777',
      btnGradient: '#db2777',
      btnShadow: '0 4px 12px rgba(236, 72, 153, 0.28)',
      status: 'active',
      badgeText: 'Ativo & Operacional',
      features: [
        'Raspagem interativa touch e mouse',
        'Regra de 3 símbolos idênticos',
        'Sinergia com Quebra-Cabeças',
        'Compatibilidade 100% PWA mobile',
      ],
      link: '/admin/scratch',
      buttonText: 'Gerenciar Raspadinha',
      disabled: false,
    },
    {
      id: 'mystery_box',
      title: 'Caixa Misteriosa (Mystery Box)',
      subtitle: 'Escolha de 1 entre 3 caixas surpresa com prêmios e animação 3D imersiva.',
      icon: Gift,
      iconColor: '#059669',
      iconBg: 'rgba(16, 185, 129, 0.12)',
      accentGradient: '#059669',
      btnGradient: '#059669',
      btnShadow: '0 4px 12px rgba(16, 185, 129, 0.28)',
      status: 'active',
      badgeText: 'Ativo & Operacional',
      features: [
        'Gamificação instantânea pós-checkout',
        'Animação de unboxing 3D com suspense',
        'Sinergia com Quebra-Cabeças',
        'Integração direta com o checkout',
      ],
      link: '/admin/mystery-box',
      buttonText: 'Gerenciar Caixas',
      disabled: false,
    },
  ];

  return (
    <div className="w-100">
      <HevonPageHeader
        title="Central de Jogos & Gamificação"
        subtitle="Gerencie jogos interativos, probabilidades, prêmios e ofertas pós-compra."
        badge={<HevonStatusBadge variant="primary">Gamification Suite</HevonStatusBadge>}
        actions={
          <>
            <Link
              href="/admin/puzzles/rewards"
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5"
            >
              <Trophy size={14} />
              <span>Prêmios &amp; Resgates</span>
            </Link>
            <Link
              href="/admin/puzzles"
              className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5"
            >
              <Puzzle size={14} />
              <span>Quebra-Cabeças</span>
            </Link>
          </>
        }
      />

      {/* Hero Banner */}
      <div
        className="card border shadow-sm rounded-4 p-4 mb-4"
        style={{
          background: 'var(--surface-card, #151821)',
          color: 'var(--text-main, #f3f5f8)',
          borderColor: 'var(--border-subtle, rgba(255, 255, 255, 0.07))',
        }}
      >
        <div className="row align-items-center g-3">
          <div className="col-12 col-md-8">
            <span
              className="badge rounded-pill fw-bold px-3 py-1 mb-2 d-inline-flex align-items-center gap-1"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '11px',
              }}
            >
              Ecossistema Modular
            </span>
            <h3 className="fw-bold mb-2" style={{ color: 'var(--text-main, #f3f5f8)' }}>
              Escale a Retenção e o LTV dos seus Clientes
            </h3>
            <p className="mb-0 small" style={{ color: 'var(--text-muted, #94a3b8)', maxWidth: '650px', lineHeight: 1.5 }}>
              Cada jogo foi projetado para transformar compradores em fãs fiéis. Conecte vendas do funil de 1 clique, presells e checkouts a experiências interativas que incentivam novas compras contínuas.
            </p>
          </div>
          <div className="col-12 col-md-4 text-md-end">
            <Link
              href="/puzzle"
              target="_blank"
              className="btn btn-primary fw-bold px-4 py-2.5 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
            >
              <span>Abrir App do Jogador</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of Games: 4 em uma linha */}
      <div className="row g-3 g-xl-4">
        {games.map((g) => {
          const IconComponent = g.icon;
          return (
            <div key={g.id} className="col-12 col-sm-6 col-lg-3 col-xl-3">
              <div className="game-hub-card">
                {/* Top decorative accent color bar */}
                <div
                  style={{
                    height: '4px',
                    width: '100%',
                    background: g.accentGradient,
                  }}
                />

                <div
                  style={{
                    padding: '24px 22px 20px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    flex: 1,
                  }}
                >
                  <div>
                    {/* Top Row: Icon & Status Badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '18px',
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '14px',
                          background: g.iconBg,
                          color: g.iconColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 4px 12px ${g.iconBg}`,
                        }}
                      >
                        <IconComponent size={24} />
                      </div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 11px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: 'rgba(16, 185, 129, 0.08)',
                          color: '#059669',
                          border: '1px solid rgba(16, 185, 129, 0.22)',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#10b981',
                            boxShadow: '0 0 6px #10b981',
                          }}
                        />
                        {g.badgeText}
                      </span>
                    </div>

                    {/* Game Title */}
                    <h3
                      style={{
                        fontSize: '16.5px',
                        fontWeight: '800',
                        color: 'var(--text-main, #0f172a)',
                        lineHeight: '1.35',
                        minHeight: '44px',
                        margin: '0 0 8px 0',
                        display: 'flex',
                        alignItems: 'flex-start',
                      }}
                    >
                      {g.title}
                    </h3>

                    {/* Subtitle */}
                    <p
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--text-muted, #64748b)',
                        lineHeight: '1.5',
                        minHeight: '56px',
                        margin: '0 0 18px 0',
                      }}
                    >
                      {g.subtitle}
                    </p>

                    {/* Features list container */}
                    <div
                      style={{
                        background: 'var(--surface-subtle, #f8fafc)',
                        border: '1px solid var(--border-subtle, #f1f5f9)',
                        borderRadius: '14px',
                        padding: '14px 16px',
                        marginBottom: '20px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '10.5px',
                          fontWeight: '800',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--text-dim, #94a3b8)',
                          marginBottom: '10px',
                        }}
                      >
                        Recursos Inclusos
                      </div>
                      <ul
                        style={{
                          listStyle: 'none',
                          margin: 0,
                          padding: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '9px',
                        }}
                      >
                        {g.features.map((feat, i) => (
                          <li
                            key={i}
                            style={{
                              fontSize: '11.8px',
                              color: 'var(--text-secondary, #334155)',
                              lineHeight: '1.4',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                            }}
                          >
                            <CheckCircle2
                              size={14}
                              style={{
                                color: g.iconColor,
                                flexShrink: 0,
                                marginTop: '1.5px',
                              }}
                            />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div
                    style={{
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border-subtle, #f1f5f9)',
                    }}
                  >
                    {g.disabled ? (
                      <span
                        className="text-muted small d-flex align-items-center justify-content-center gap-1 text-center"
                        style={{ fontSize: '12px' }}
                      >
                        <Lock size={14} />
                        <span>Em breve</span>
                      </span>
                    ) : (
                      <Link
                        href={g.link}
                        className="btn game-hub-btn w-100 fw-bold d-inline-flex align-items-center justify-content-center gap-2 shadow-sm"
                        style={{
                          height: '42px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          background: g.btnGradient,
                          border: 'none',
                          color: '#ffffff',
                          boxShadow: g.btnShadow,
                        }}
                      >
                        <span>{g.buttonText}</span>
                        <ArrowRight size={15} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
