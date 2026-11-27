CREATE TABLE IF NOT EXISTS visitors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    visitor_hash VARCHAR(64) NOT NULL UNIQUE,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    visitor_id BIGINT NULL,
    upsell_session_id BIGINT NULL,
    campaign_id BIGINT NULL,
    campaign_level_id BIGINT NULL,
    event_type VARCHAR(50) NOT NULL, -- page_view, scroll, cta_click, timer_expired, checkout_started
    event_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE SET NULL,
    FOREIGN KEY (upsell_session_id) REFERENCES upsell_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
    FOREIGN KEY (campaign_level_id) REFERENCES campaign_levels(id) ON DELETE SET NULL
);

-- Associate upsell_sessions with visitors
ALTER TABLE upsell_sessions
ADD COLUMN visitor_id BIGINT NULL AFTER campaign_id,
ADD CONSTRAINT fk_upsell_sessions_visitor_id FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE SET NULL;
