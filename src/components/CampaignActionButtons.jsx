'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Copy, Trash2, PlusCircle } from 'lucide-react';

export default function CampaignActionButtons({ campaign }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClone = async () => {
    if (!confirm(`Deseja duplicar a campanha "${campaign.name}" e todos os seus níveis?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(data.message || 'Erro ao duplicar campanha.');
      }
    } catch {
      alert('Erro de conexão ao duplicar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir a campanha "${campaign.name}"? Todos os níveis serão removidos!`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(data.message || 'Erro ao excluir campanha.');
      }
    } catch {
      alert('Erro de conexão ao excluir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <Link
        href={`/admin/campaigns/edit/${campaign.id}`}
        className="btn btn-secondary btn-sm"
        title="Editar Campanha & Níveis"
      >
        <Edit size={14} />
        <span>Editar</span>
      </Link>

      <button
        onClick={handleClone}
        disabled={loading}
        className="btn btn-secondary btn-sm"
        title="Duplicar Campanha"
      >
        <Copy size={14} />
      </button>

      <button
        onClick={handleDelete}
        disabled={loading}
        className="btn btn-danger btn-sm"
        title="Excluir Campanha"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
