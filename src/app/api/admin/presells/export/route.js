import { getCurrentAdmin } from '@/lib/auth';
import { getEventsForExport } from '@/lib/models/presell';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30d';
  const pageId = searchParams.get('id') || null;
  const limit = Math.min(parseInt(searchParams.get('limit') || '5000', 10), 10000);

  const events = await getEventsForExport(pageId, period, limit);

  const filename = `upsellflow_presell_analytics_${pageId ? `page_${pageId}_` : 'geral_'}${new Date()
    .toISOString()
    .replace(/[-:T.]/g, '')
    .slice(0, 15)}.csv`;

  // UTF-8 BOM for Excel
  let csvContent = '\uFEFF';

  // Header row
  const headers = [
    'ID Evento',
    'Data e Hora (BRT)',
    'Página Presell',
    'Slug da Página',
    'Tipo de Evento',
    'Variação A/B',
    'Botão Clicado',
    'Dispositivo',
    'Sistema Operacional',
    'Navegador',
    'Cidade',
    'Estado (UF)',
    'País',
    'Endereço IP',
    'UTM Source (Origem)',
    'UTM Medium (Mídia)',
    'UTM Campaign (Campanha)',
    'UTM Content (Conteúdo)',
    'UTM Term (Termo)',
    'SRC (Identificador)',
    'Referer (Origem Tráfego)',
    'É Robô/Bot?',
    'Ação do Cloaker',
  ];

  csvContent += headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(';') + '\r\n';

  for (const ev of events) {
    const dateTime = ev.created_at
      ? new Date(ev.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      : '-';

    const eventType = ev.event_type === 'view' ? 'Visualização de Página' : 'Clique em Botão';
    const btnText = ev.btn_text || (ev.event_type === 'click' ? `Botão ${Number(ev.btn_index || 0) + 1}` : '-');

    const row = [
      ev.id,
      dateTime,
      ev.page_name || 'Página Excluída',
      ev.page_slug || '-',
      eventType,
      ev.variation || 'A',
      btnText,
      ev.device_type || 'desktop',
      ev.os || 'Outro',
      ev.browser || 'Outro',
      ev.city || 'Não identificada',
      ev.state_uf || '-',
      ev.country || 'Brasil',
      ev.ip_address || '-',
      ev.utm_source || '-',
      ev.utm_medium || '-',
      ev.utm_campaign || '-',
      ev.utm_content || '-',
      ev.utm_term || '-',
      ev.src || '-',
      ev.referer || '-',
      ev.is_bot ? 'SIM' : 'NÃO',
      ev.cloak_action || '-',
    ];

    csvContent += row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(';') + '\r\n';
  }

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache, no-store',
    },
  });
}
