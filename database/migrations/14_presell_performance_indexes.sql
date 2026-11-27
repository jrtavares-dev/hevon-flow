-- Migration 14: Presell Analytics Performance Indexes
-- Safe & Non-destructive: Adds composite indexes to drastically speed up analytics dashboards and reporting queries

-- 1. Index for page-specific event queries filtered by date
CREATE INDEX IF NOT EXISTS `idx_comp_page_event_created` ON `presell_events` (`presell_page_id`, `event_type`, `created_at`);

-- 2. Index for global event metrics filtered by date
CREATE INDEX IF NOT EXISTS `idx_comp_event_created` ON `presell_events` (`event_type`, `created_at`);

-- 3. Index for global unique visitors counting
CREATE INDEX IF NOT EXISTS `idx_comp_event_vis` ON `presell_events` (`event_type`, `visitor_id`, `created_at`);

-- 4. Index for per-page unique visitors counting
CREATE INDEX IF NOT EXISTS `idx_comp_page_event_vis` ON `presell_events` (`presell_page_id`, `event_type`, `visitor_id`, `created_at`);

-- 5. Index for button click breakdowns
CREATE INDEX IF NOT EXISTS `idx_comp_page_event_btn` ON `presell_events` (`presell_page_id`, `event_type`, `btn_index`, `created_at`);

-- 6. Index for device type breakdowns (mobile vs desktop vs tablet)
CREATE INDEX IF NOT EXISTS `idx_comp_event_device` ON `presell_events` (`event_type`, `device_type`, `created_at`);

-- 7. Index for UTM source analysis
CREATE INDEX IF NOT EXISTS `idx_comp_created_utm` ON `presell_events` (`created_at`, `utm_source`);

-- 8. Index for geographic state/region analysis
CREATE INDEX IF NOT EXISTS `idx_comp_created_region` ON `presell_events` (`created_at`, `region`);
