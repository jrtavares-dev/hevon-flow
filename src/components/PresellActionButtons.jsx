'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Copy, Trash2 } from 'lucide-react';

export default function PresellActionButtons({ presell }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClone = async () => {
    if (!confirm(`Deseja duplicar a página presell "${presell.name}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/presells/${presell.id}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(data.message || 'Erro ao duplicar.');
      }
    } catch {
      alert('Erro de conexão ao duplicar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir a página presell "${presell.name}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/presells/${presell.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(data.message || 'Erro ao excluir.');
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
        href={`/admin/presells/edit/${presell.id}`}
        className="btn btn-secondary btn-sm"
        title="Editar Página"
      >
        <Edit size={14} />
        <span>Editar</span>
      </Link>

      <button
        onClick={handleClone}
        disabled={loading}
        className="btn btn-secondary btn-sm"
        title="Duplicar Página"
      >
        <Copy size={14} />
      </button>

      <button
        onClick={handleDelete}
        disabled={loading}
        className="btn btn-danger btn-sm"
        title="Excluir Página"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
