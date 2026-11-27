'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Menu,
  Plus,
  User,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Smartphone,
  GitFork,
} from 'lucide-react';
import HevonFlowLogo from '@/components/hevon/HevonFlowLogo';

export default function AdminHeader({ admin }) {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('light');
  const dropdownRef = useRef(null);
  const createMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (createMenuRef.current && !createMenuRef.current.contains(e.target)) {
        setCreateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('upsellflow_theme');
      if (savedTheme === 'dark') {
        setTheme('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      } else {
        setTheme('light');
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('upsellflow_theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    } catch {
      // ignore
    }
  };

  const initial = (admin?.name || 'Admin').charAt(0).toUpperCase();

  useEffect(() => {
    setDropdownOpen(false);
    setCreateMenuOpen(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('adminGlobalSearchInput')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    }
  };

  return (
    <header className="topbar">
      <div className="d-flex align-items-center gap-2">
        <button
          className="hevon-icon-btn d-lg-none"
          id="sidebarToggleBtn"
          type="button"
          aria-label="Abrir Menu"
          onClick={() => {
            const sidebar = document.getElementById('mainSidebar');
            const backdrop = document.getElementById('sidebarBackdrop');
            if (sidebar) sidebar.classList.toggle('show');
            if (backdrop) backdrop.classList.toggle('show');
          }}
        >
          <Menu size={16} />
        </button>
        <Link href="/admin/dashboard" className="d-flex align-items-center d-lg-none text-decoration-none">
          <HevonFlowLogo surface="auto" height={22} />
        </Link>
      </div>

      <div className="d-flex align-items-center">
        <div className="search-container d-none d-sm-block">
          <Search size={14} className="search-icon" />
          <input
            id="adminGlobalSearchInput"
            type="text"
            className="search-input"
            placeholder="Buscar funis e presells..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
          <span className="search-badge">⌘K</span>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 ms-auto">
        <div className="position-relative d-none d-md-block" ref={createMenuRef}>
          <button
            type="button"
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5"
            style={{ height: '32px', padding: '0 11px', fontSize: '12px' }}
          >
            <Plus size={14} />
            <span>Criar</span>
            <ChevronDown
              size={12}
              style={{ transform: createMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
            />
          </button>

          {createMenuOpen && (
            <ul
              className="dropdown-menu border mt-2 show position-absolute list-unstyled m-0"
              style={{
                right: 0,
                minWidth: '188px',
                zIndex: 1050,
                padding: '6px',
                borderRadius: '10px',
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <li>
                <Link
                  href="/admin/presells/create"
                  onClick={() => setCreateMenuOpen(false)}
                  className="dropdown-item d-flex align-items-center gap-2 px-2.5 py-2 rounded-2 fw-medium"
                  style={{ color: 'hsl(var(--popover-foreground))', fontSize: '12px' }}
                >
                  <Smartphone size={14} className="text-primary" />
                  <span>Nova Presell</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/campaigns/create"
                  onClick={() => setCreateMenuOpen(false)}
                  className="dropdown-item d-flex align-items-center gap-2 px-2.5 py-2 rounded-2 fw-medium"
                  style={{ color: 'hsl(var(--popover-foreground))', fontSize: '12px' }}
                >
                  <GitFork size={14} style={{ color: 'hsl(var(--info))' }} />
                  <span>Novo Funil</span>
                </Link>
              </li>
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="hevon-icon-btn"
          title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          aria-label="Alternar Modo Escuro / Claro"
        >
          {theme === 'dark' ? <Sun size={15} style={{ color: 'hsl(var(--warning))' }} /> : <Moon size={15} />}
        </button>

        <span
          className="hevon-badge hevon-badge-success d-none d-md-inline-flex"
          style={{ height: '26px', padding: '0 9px', fontSize: '11px' }}
          title="Sistema Conectado e Operacional"
        >
          <span className="hevon-badge-dot" />
          <span>Operacional</span>
        </span>

        <div className="dropdown position-relative" ref={dropdownRef}>
          <button
            type="button"
            className="d-flex align-items-center text-decoration-none py-1 px-1.5 rounded-2 bg-transparent border-0"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ cursor: 'pointer', color: 'hsl(var(--foreground))', gap: '8px' }}
          >
            <div className="user-avatar-circle">{initial}</div>
            <div className="d-none d-sm-flex flex-column text-start">
              <span className="fw-semibold text-truncate" style={{ maxWidth: '116px', fontSize: '12px', lineHeight: 1.2 }}>
                {admin?.name || 'Admin'}
              </span>
              <span style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))', lineHeight: 1.2 }}>
                {admin?.role === 'super_admin' ? 'Super Admin' : 'Operador'}
              </span>
            </div>
            <ChevronDown size={13} style={{ color: 'hsl(var(--muted-foreground))' }} className="d-none d-sm-inline" />
          </button>

          {dropdownOpen && (
            <ul
              className="dropdown-menu dropdown-menu-end border mt-2 show position-absolute list-unstyled m-0"
              style={{
                right: 0,
                minWidth: '216px',
                zIndex: 1050,
                padding: '6px',
                borderRadius: '10px',
                listStyle: 'none',
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <li style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                <Link
                  href="/admin/profile"
                  prefetch={true}
                  className="dropdown-item d-flex align-items-center gap-2 rounded-2 py-2 px-2.5 text-decoration-none"
                  onClick={() => setDropdownOpen(false)}
                  style={{ fontSize: '12px', fontWeight: 500, color: 'hsl(var(--popover-foreground))' }}
                >
                  <User size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <span>Meu Perfil</span>
                </Link>
              </li>
              <li style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center justify-content-between rounded-2 py-2 px-2.5 border-0 bg-transparent w-100 text-start"
                  onClick={() => {
                    toggleTheme();
                    setDropdownOpen(false);
                  }}
                  style={{ fontSize: '12px', fontWeight: 500, cursor: 'pointer', color: 'hsl(var(--popover-foreground))' }}
                >
                  <div className="d-flex align-items-center gap-2">
                    {theme === 'dark' ? (
                      <Sun size={14} style={{ color: 'hsl(var(--warning))' }} />
                    ) : (
                      <Moon size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                    )}
                    <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
                  </div>
                  <span className="hevon-badge hevon-badge-neutral">{theme === 'dark' ? 'Escuro' : 'Claro'}</span>
                </button>
              </li>
              <li style={{ listStyle: 'none', margin: '4px 0', padding: 0 }}>
                <hr className="dropdown-divider m-0" style={{ borderColor: 'hsl(var(--border))' }} />
              </li>
              <li style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center gap-2 rounded-2 py-2 px-2.5 border-0 bg-transparent w-100 text-start"
                  onClick={handleLogout}
                  style={{ fontSize: '12px', fontWeight: 500, cursor: 'pointer', color: 'hsl(var(--destructive))' }}
                >
                  <LogOut size={14} />
                  <span>Sair do Sistema</span>
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
