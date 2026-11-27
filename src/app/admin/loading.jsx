import HevonSkeleton from '@/components/hevon/HevonSkeleton';

export default function AdminLoading() {
  return (
    <div className="w-100">
      <div className="top-route-progress" />

      {/* Header Skeleton (HEVON Minimalist Header) */}
      <div className="hevon-page-header">
        <div>
          <HevonSkeleton width={220} height={24} />
          <HevonSkeleton width={320} height={14} style={{ marginTop: 8 }} />
        </div>
        <div className="d-flex gap-2">
          <HevonSkeleton width={110} height={32} radius={8} />
          <HevonSkeleton width={120} height={32} radius={8} />
        </div>
      </div>

      {/* 4 Executive KPI Cards Skeleton (Zero ≠ Vazio ≠ Carregando) */}
      <div className="row g-3 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="col-12 col-sm-6 col-xl-3">
            <div className="hevon-metric-card">
              <HevonSkeleton width={96} height={12} />
              <HevonSkeleton width={132} height={28} />
              <HevonSkeleton width={150} height={12} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Analytical / Table Card Skeleton */}
      <div className="hevon-card overflow-hidden">
        <div
          className="px-4 py-3 d-flex justify-content-between align-items-center"
          style={{ borderBottom: '1px solid hsl(var(--border) / 0.65)' }}
        >
          <HevonSkeleton width={180} height={16} />
          <HevonSkeleton width={160} height={30} radius={8} />
        </div>
        <div className="p-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="d-flex align-items-center justify-content-between py-2.5 px-2 gap-3"
              style={{ borderBottom: row < 5 ? '1px solid hsl(var(--border) / 0.45)' : 'none' }}
            >
              <HevonSkeleton width="28%" height={14} />
              <HevonSkeleton width="18%" height={14} />
              <HevonSkeleton width="14%" height={18} radius={6} />
              <HevonSkeleton width="12%" height={14} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
