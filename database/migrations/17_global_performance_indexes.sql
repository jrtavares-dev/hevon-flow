-- Migration 17: Performance Indexes for Sub-Millisecond Dashboard, Sessions, and Campaigns
-- UpsellFlow High-Speed Database Optimization

-- 1. Upsell Sessions Indexes
ALTER TABLE upsell_sessions ADD INDEX IF NOT EXISTS idx_sessions_created_desc (created_at DESC);
ALTER TABLE upsell_sessions ADD INDEX IF NOT EXISTS idx_sessions_status_created (status, created_at);
ALTER TABLE upsell_sessions ADD INDEX IF NOT EXISTS idx_sessions_campaign_rev (campaign_id, revenue);

-- 2. Events Indexes
ALTER TABLE events ADD INDEX IF NOT EXISTS idx_events_created_desc (created_at DESC);
ALTER TABLE events ADD INDEX IF NOT EXISTS idx_events_session (upsell_session_id, created_at);
ALTER TABLE events ADD INDEX IF NOT EXISTS idx_events_type_created (event_type, created_at);

-- 3. Visitors Index
ALTER TABLE visitors ADD INDEX IF NOT EXISTS idx_visitors_seen_ip (first_seen, ip_address);

-- 4. Campaigns Indexes
ALTER TABLE campaigns ADD INDEX IF NOT EXISTS idx_campaigns_status_created (status, created_at);
ALTER TABLE campaigns ADD INDEX IF NOT EXISTS idx_campaigns_created_desc (created_at DESC);

-- 5. Campaign Levels Index
ALTER TABLE campaign_levels ADD INDEX IF NOT EXISTS idx_levels_campaign_order (campaign_id, level_order);

-- 6. Webhook Logs & Orders Indexes
ALTER TABLE webhook_logs ADD INDEX IF NOT EXISTS idx_webhook_logs_created (created_at DESC);
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_orders_status_created (status, created_at);
ALTER TABLE custom_domains ADD INDEX IF NOT EXISTS idx_custom_domains_status (status);
