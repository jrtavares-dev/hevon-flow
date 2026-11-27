-- ====================================================================
-- Migrations Aditivas e Idempotentes — UpsellFlow (Fase 02: DB-02)
-- Índices para aceleração de dashboards, relatórios e webhook lookups
-- ====================================================================

-- 1. Tabela de eventos de funil
CREATE INDEX IF NOT EXISTS idx_events_session_type ON public.events (upsell_session_id, event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events (created_at DESC);

-- 2. Tabela de sessões de upsell
CREATE INDEX IF NOT EXISTS idx_upsell_sessions_created ON public.upsell_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upsell_sessions_status ON public.upsell_sessions (status, created_at DESC);

-- 3. Tabela de pedidos
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders (status, created_at DESC);

-- 4. Tabela de logs de webhook
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON public.webhook_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON public.webhook_logs (status);
