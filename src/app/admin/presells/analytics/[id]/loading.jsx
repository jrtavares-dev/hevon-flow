export default function AnalyticsLoading() {
  return (
    <div className="w-100" style={{ opacity: 0.95 }}>
      {/* Top glowing micro progress bar */}
      <div className="top-route-progress" />

      {/* Header Skeleton */}
      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-start align-items-xl-center gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="skeleton-shimmer rounded-circle" style={{ width: '42px', height: '42px' }} />
          <div className="skeleton-shimmer rounded-circle" style={{ width: '42px', height: '42px' }} />
          <div>
            <div className="d-flex align-items-center gap-2 mb-1.5">
              <div className="skeleton-shimmer" style={{ width: '180px', height: '24px', borderRadius: '6px' }} />
              <div className="skeleton-shimmer" style={{ width: '60px', height: '20px', borderRadius: '12px' }} />
            </div>
            <div className="skeleton-shimmer" style={{ width: '280px', height: '14px', borderRadius: '4px' }} />
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="skeleton-shimmer" style={{ width: '220px', height: '36px', borderRadius: '20px' }} />
          <div className="skeleton-shimmer" style={{ width: '80px', height: '36px', borderRadius: '8px' }} />
        </div>
      </div>

      {/* 5 KPI Cards Grid Skeleton */}
      <div className="row g-3 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="col-12 col-sm-6 col-xl">
            <div className="card border-0 shadow-sm p-3 h-100 bg-white" style={{ borderRadius: '14px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="skeleton-shimmer" style={{ width: '38px', height: '38px', borderRadius: '10px' }} />
                <div className="skeleton-shimmer" style={{ width: '55px', height: '18px', borderRadius: '10px' }} />
              </div>
              <div className="skeleton-shimmer mb-2" style={{ width: '85px', height: '13px', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ width: '110px', height: '28px', borderRadius: '6px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Breakdown Row Skeleton */}
      <div className="row g-4 mb-4">
        {/* Main Line Chart Skeleton */}
        <div className="col-lg-8">
          <div className="card h-100 shadow-sm border-0 bg-white" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom">
              <div className="d-flex align-items-center gap-2">
                <div className="skeleton-shimmer" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                <div className="skeleton-shimmer" style={{ width: '200px', height: '18px', borderRadius: '6px' }} />
              </div>
              <div className="skeleton-shimmer" style={{ width: '120px', height: '24px', borderRadius: '6px' }} />
            </div>
            <div className="card-body p-4 d-flex flex-column justify-content-center" style={{ minHeight: '280px' }}>
              <div className="skeleton-shimmer w-100" style={{ height: '220px', borderRadius: '12px' }} />
            </div>
          </div>
        </div>

        {/* Devices / Distribution Skeleton */}
        <div className="col-lg-4">
          <div className="card h-100 shadow-sm border-0 bg-white" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom">
              <div className="d-flex align-items-center gap-2">
                <div className="skeleton-shimmer" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                <div className="skeleton-shimmer" style={{ width: '160px', height: '18px', borderRadius: '6px' }} />
              </div>
            </div>
            <div className="card-body p-3">
              <div className="row g-2 mb-3">
                {[1, 2, 3].map((d) => (
                  <div key={d} className="col-4">
                    <div className="p-2 border rounded-3 bg-light text-center">
                      <div className="skeleton-shimmer mx-auto mb-1" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                      <div className="skeleton-shimmer mx-auto mb-1" style={{ width: '40px', height: '16px', borderRadius: '4px' }} />
                      <div className="skeleton-shimmer mx-auto" style={{ width: '30px', height: '10px', borderRadius: '3px' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="d-flex flex-column gap-2 mt-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="p-2 border rounded-2 bg-white">
                    <div className="d-flex justify-content-between mb-1">
                      <div className="skeleton-shimmer" style={{ width: '90px', height: '14px', borderRadius: '4px' }} />
                      <div className="skeleton-shimmer" style={{ width: '50px', height: '14px', borderRadius: '4px' }} />
                    </div>
                    <div className="skeleton-shimmer w-100" style={{ height: '4px', borderRadius: '2px' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Geolocation Section Skeleton */}
      <div className="row g-4 mb-4">
        {[1, 2].map((g) => (
          <div key={g} className="col-lg-6">
            <div className="card h-100 shadow-sm border-0 bg-white" style={{ borderRadius: '16px' }}>
              <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="skeleton-shimmer" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                  <div className="skeleton-shimmer" style={{ width: '180px', height: '18px', borderRadius: '6px' }} />
                </div>
              </div>
              <div className="card-body p-3">
                <div className="d-flex flex-column gap-2">
                  {[1, 2, 3, 4].map((r) => (
                    <div key={r} className="p-2.5 border rounded-2 bg-white d-flex justify-content-between align-items-center">
                      <div className="skeleton-shimmer" style={{ width: '130px', height: '16px', borderRadius: '4px' }} />
                      <div className="skeleton-shimmer" style={{ width: '100px', height: '16px', borderRadius: '4px' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
