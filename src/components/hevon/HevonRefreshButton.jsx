'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function HevonRefreshButton({ label = 'Atualizar' }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5"
      title="Atualizar dados agora"
    >
      <RefreshCw size={13} className={isPending ? 'uf-spinner' : ''} />
      <span>{isPending ? 'Atualizando...' : label}</span>
    </button>
  );
}
