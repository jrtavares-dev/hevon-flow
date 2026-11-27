CREATE TABLE IF NOT EXISTS upsell_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(64) NOT NULL UNIQUE,
    campaign_id BIGINT NOT NULL,
    current_level_id BIGINT NULL,
    customer_name VARCHAR(150) NULL,
    customer_email VARCHAR(150) NULL,
    customer_phone VARCHAR(50) NULL,
    customer_doc VARCHAR(50) NULL,
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    revenue DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (current_level_id) REFERENCES campaign_levels(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    upsell_session_id BIGINT NOT NULL,
    campaign_level_id BIGINT NOT NULL,
    external_order_id VARCHAR(100) NULL,
    product_id VARCHAR(100) NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (upsell_session_id) REFERENCES upsell_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_level_id) REFERENCES campaign_levels(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS webhook_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    payload JSON,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
