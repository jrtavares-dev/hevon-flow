'use client';

import React from 'react';
import DashboardRevenueChart from './DashboardRevenueChart';

/**
 * AnalyticsChart — Wrapper compatível com a assinatura legada { timeSeries: { labels, views, clicks } }
 * usando o gráfico minimalista HEVON (sem gridlines, máximo 2 cores, legenda inferior esquerda).
 */
export default function AnalyticsChart({
  timeSeries = { labels: [], views: [], clicks: [] },
  height = 230,
}) {
  const labels = timeSeries?.labels || [];
  const views = timeSeries?.views || [];
  const clicks = timeSeries?.clicks || [];

  return (
    <DashboardRevenueChart
      labels={labels}
      values={views}
      secondaryValues={clicks}
      height={height}
      unitLabel="Visualizações"
      secondaryLabel="Cliques CTA"
      valuePrefix=""
      valueSuffix=""
      decimals={0}
    />
  );
}
