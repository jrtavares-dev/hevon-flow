'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  GitFork,
  Smartphone,
  LogOut,
  X,
  Gamepad2,
  ChevronDown,
} from 'lucide-react';
import HevonFlowLogo from '@/components/hevon/HevonFlowLogo';

export default function AdminSidebar({ admin }) {
  const pathname = usePathname();
  const router = useRouter();

  const closeSidebar = () => {
    if (typeof document !== 'undefined') {
      document.getElementById('mainSidebar')?.classList.remove('show');
      document.getElementById('sidebarBackdrop')?.classList.remove('show');
    }
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    }
  };

  const initial = (admin?.name || 'Admin').charAt(0).toUpperCase();
  const roleName = admin?.role === 'super_admin' ? 'Super Admin' : 'Operador';

  const isGameRoute =
    pathname.startsWith('/admin/games') ||
    pathname.startsWith('/admin/wheel') ||
    pathname.startsWith('/admin/scratch') ||
    pathname.startsWith('/admin/mystery-box') ||
    pathname.startsWith('/admin/puzzles');

  const [gamesOpen, setGamesOpen] = useState(isGameRoute);

  useEffect(() => {
    if (isGameRoute) setGamesOpen(true);
  }, [pathname, isGameRoute]);

  const isRouteActive = (route) => {
    if (route === '/admin/dashboard') return pathname === '/admin/dashboard';
    return pathname.startsWith(route);
  };

  const canAccess = (moduleKey) => {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;
    let permissions = admin.permissions;
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch {
        permissions = [];
      }
    }
    if (!Array.isArray(permissions)) return false;
    if (permissions.includes('*')) return true;
    return permissions.includes(moduleKey);
  };

  const hasMarketing = canAccess('campaigns') || canAccess('presells');
  const hasGames = canAccess('games');

  return (
    <>
      <div className="sidebar-backdrop" id="sidebarBackdrop" onClick={closeSidebar}></div>

      <nav className="sidebar" id="mainSidebar">
        <div>
          {/* Brand Logo (HEVON FLOW) */}
          <div className="d-flex align-items-center justify-content-between px-3 py-3">
            <Link
              href="/admin/dashboard"
              onClick={closeSidebar}
              className="d-flex align-items-center text-decoration-none"
              aria-label="HEVON FLOW — Ir para o Dashboard"
            >
              <HevonFlowLogo surface="dark" height={46} />
            </Link>
            <button
              type="button"
              className="btn btn-sm d-lg-none p-1 border-0 bg-transparent"
              onClick={closeSidebar}
              aria-label="Fechar menu"
              title="Fechar menu"
            >
              <X size={18} style={{ color: 'hsl(var(--sidebar-foreground))' }} />
            </button>
          </div>
          <div style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}></div>

          {/* Navigation Links (Edição Modular: Dashboard, Funis, Presells e Jogos) */}
          <div className="pt-2">
            {canAccess('dashboard') && (
              <>
                <p className="sidebar-section-title">Principal</p>
                <ul className="nav flex-column p-0 m-0 list-unstyled">
                  <li className="nav-item">
                    <Link
                      href="/admin/dashboard"
                      prefetch={true}
                      onClick={closeSidebar}
                      className={`nav-link ${isRouteActive('/admin/dashboard') ? 'active' : ''}`}
                    >
                      <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </Link>
                  </li>
                </ul>
              </>
            )}

            {hasMarketing && (
              <>
                <p className="sidebar-section-title">Marketing &amp; Funis</p>
                <ul className="nav flex-column p-0 m-0 list-unstyled">
                  {canAccess('campaigns') && (
                    <li className="nav-item">
                      <Link
                        href="/admin/campaigns"
                        prefetch={true}
                        onClick={closeSidebar}
                        className={`nav-link ${
                          isRouteActive('/admin/campaigns') || isRouteActive('/admin/levels')
                            ? 'active'
                            : ''
                        }`}
                      >
                        <GitFork size={16} />
                        <span>Funis &amp; Campanhas</span>
                      </Link>
                    </li>
                  )}
                  {canAccess('presells') && (
                    <li className="nav-item">
                      <Link
                        href="/admin/presells"
                        prefetch={true}
                        onClick={closeSidebar}
                        className={`nav-link ${isRouteActive('/admin/presells') ? 'active' : ''}`}
                      >
                        <Smartphone size={16} />
                        <span>Páginas Presell</span>
                      </Link>
                    </li>
                  )}
                </ul>
              </>
            )}

            {hasGames && (
              <>
                <p className="sidebar-section-title">Gamificação</p>
                <ul className="nav flex-column p-0 m-0 list-unstyled">
                  <li className="nav-item">
                    <div
                      onClick={() => setGamesOpen(!gamesOpen)}
                      className={`nav-link justify-content-between ${isGameRoute ? 'active' : ''}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <Gamepad2 size={16} />
                        <span>Jogos &amp; Roletas</span>
                      </div>
                      <ChevronDown
                        size={13}
                        style={{
                          transform: gamesOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.15s ease',
                          opacity: 0.7,
                        }}
                      />
                    </div>

                    {gamesOpen && (
                      <ul
                        className="nav flex-column py-1 m-0 list-unstyled"
                        style={{
                          borderLeft: '1px solid hsl(var(--sidebar-border))',
                          marginLeft: '1.35rem',
                          paddingLeft: '0.5rem',
                        }}
                      >
                        <li>
                          <Link
                            href="/admin/games"
                            prefetch={true}
                            onClick={closeSidebar}
                            className={`nav-link sidebar-sublink ${pathname === '/admin/games' ? 'active-sub' : ''}`}
                          >
                            <span>Central Geral</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/admin/wheel"
                            prefetch={true}
                            onClick={closeSidebar}
                            className={`nav-link sidebar-sublink ${pathname.startsWith('/admin/wheel') ? 'active-sub' : ''}`}
                          >
                            <span>Roleta da Sorte</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/admin/scratch"
                            prefetch={true}
                            onClick={closeSidebar}
                            className={`nav-link sidebar-sublink ${pathname.startsWith('/admin/scratch') ? 'active-sub' : ''}`}
                          >
                            <span>Raspadinha</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/admin/mystery-box"
                            prefetch={true}
                            onClick={closeSidebar}
                            className={`nav-link sidebar-sublink ${pathname.startsWith('/admin/mystery-box') ? 'active-sub' : ''}`}
                          >
                            <span>Caixa Misteriosa</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/admin/puzzles"
                            prefetch={true}
                            onClick={closeSidebar}
                            className={`nav-link sidebar-sublink ${pathname.startsWith('/admin/puzzles') ? 'active-sub' : ''}`}
                          >
                            <span>Quebra-cabeça</span>
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Sidebar Footer with User Card & Logout */}
        <div className="sidebar-footer">
          <Link href="/admin/profile" prefetch={true} className="sidebar-user" title="Editar Meu Perfil">
            <div className="user-avatar-circle">
              {initial}
              <span className="online-dot"></span>
            </div>
            <div className="d-flex flex-column text-truncate" style={{ maxWidth: '130px' }}>
              <span
                className="fw-semibold text-truncate"
                style={{ color: 'hsl(var(--sidebar-foreground))', fontSize: '12px' }}
              >
                {admin?.name || 'Administrador'}
              </span>
              <span style={{ fontSize: '10.5px', color: 'hsl(var(--sidebar-muted))', fontWeight: 500 }}>
                {roleName}
              </span>
            </div>
          </Link>
          <button onClick={handleLogout} className="sidebar-logout-btn" title="Sair do Sistema">
            <LogOut size={15} />
          </button>
        </div>
      </nav>
    </>
  );
}
