-- ==============================================================================
-- Migration 16: Super-índices de Performance para Métricas Presell & Analytics
-- Data: 03/10/2026
-- ==============================================================================

-- 1. Índice composto para aceleração de filtros por período e página no Presell Analytics
ALTER TABLE `presell_events` ADD INDEX IF NOT EXISTS `idx_comp_page_created` (`presell_page_id`, `created_at`);

-- 2. Índice composto para listagem ultra-rápida de eventos recentes sem filesort
ALTER TABLE `presell_events` ADD INDEX IF NOT EXISTS `idx_comp_page_id_recent` (`presell_page_id`, `id`);

-- 3. Índice para filtros globais de período e agrupamento de eventos
ALTER TABLE `presell_events` ADD INDEX IF NOT EXISTS `idx_comp_created_event` (`created_at`, `event_type`);

-- 4. Índice para contagem de dispositivos por página e tipo de evento
ALTER TABLE `presell_events` ADD INDEX IF NOT EXISTS `idx_comp_page_dev_event` (`presell_page_id`, `event_type`, `device_type`, `created_at`);

-- 5. Índice para contagem de fontes UTM por página e tipo de evento
ALTER TABLE `presell_events` ADD INDEX IF NOT EXISTS `idx_comp_page_utm_event` (`presell_page_id`, `event_type`, `utm_source`, `created_at`);
