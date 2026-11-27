import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { HevonPageHeader, HevonStatusBadge, HevonEmptyState } from '@/components/hevon';
import { Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminSearchPage({ searchParams }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const { q } = (await searchParams) || {};
  const queryStr = (q || '').trim();

  let campaigns = [];
  let presells = [];

  if (queryStr) {
    const like = `%${queryStr}%`;
    [campaigns, presells] = await Promise.all([
      query(
        'SELECT id, name, slug, status FROM campaigns WHERE name LIKE ? OR slug LIKE ? ORDER BY id DESC LIMIT 20',
        [like, like]
      ).catch(() => []),
      query(
        'SELECT id, name, slug, status FROM presell_pages WHERE name LIKE ? OR slug LIKE ? ORDER BY id DESC LIMIT 20',
        [like, like]
      ).catch(() => []),
    ]);
  }

  const total = campaigns.length + presells.length;

  return (
    <div className="w-100">
      <HevonPageHeader
        title="Resultados da Busca"
        subtitle={`${total} resultado(s) em Funis e Páginas Presell.`}
        badge={queryStr ? <HevonStatusBadge variant="primary">"{queryStr}"</HevonStatusBadge> : null}
      />

      {total === 0 ? (
        <div className="hevon-card">
          <HevonEmptyState
            icon={Search}
            title="Nenhum resultado encontrado"
            description="Tente pesquisar pelo nome ou slug de um funil ou página presell."
          />
        </div>
      ) : (
        <div className="row g-3">
          {presells.length > 0 && (
            <div className="col-lg-6">
              <div className="hevon-card overflow-hidden">
                <div className="px-4 py-3" style={{ borderBottom: '1px solid hsl(var(--border) / 0.65)' }}>
                  <div className="hevon-eyebrow">Páginas Presell</div>
                  <h2 className="hevon-section-title">{presells.length} encontrada(s)</h2>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 hevon-table-compact">
                    <thead>
                      <tr>
                        <th>Página</th>
                        <th>Status</th>
                        <th className="text-end">Abrir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {presells.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div className="hevon-data-primary">{p.name}</div>
                            <div className="hevon-data-secondary hevon-mono">/p/{p.slug}</div>
                          </td>
                          <td>
                            <HevonStatusBadge variant={p.status === 'active' ? 'success' : 'neutral'} dot>
                              {p.status === 'active' ? 'Ativa' : 'Inativa'}
                            </HevonStatusBadge>
                          </td>
                          <td className="text-end">
                            <Link href={`/admin/presells/analytics/${p.id}`} className="btn btn-sm btn-outline-secondary">
                              Analytics
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {campaigns.length > 0 && (
            <div className="col-lg-6">
              <div className="hevon-card overflow-hidden">
                <div className="px-4 py-3" style={{ borderBottom: '1px solid hsl(var(--border) / 0.65)' }}>
                  <div className="hevon-eyebrow">Funis &amp; Campanhas</div>
                  <h2 className="hevon-section-title">{campaigns.length} encontrado(s)</h2>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 hevon-table-compact">
                    <thead>
                      <tr>
                        <th>Funil</th>
                        <th>Status</th>
                        <th className="text-end">Abrir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <div className="hevon-data-primary">{c.name}</div>
                            <div className="hevon-data-secondary hevon-mono">/{c.slug}</div>
                          </td>
                          <td>
                            <HevonStatusBadge variant={c.status === 'active' ? 'success' : 'neutral'} dot>
                              {c.status === 'active' ? 'Ativo' : 'Inativo'}
                            </HevonStatusBadge>
                          </td>
                          <td className="text-end">
                            <Link href={`/admin/campaigns/edit/${c.id}`} className="btn btn-sm btn-outline-secondary">
                              Editar
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
