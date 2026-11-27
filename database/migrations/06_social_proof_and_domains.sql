ALTER TABLE campaign_levels
ADD COLUMN IF NOT EXISTS social_proof_enabled TINYINT(1) DEFAULT 1 AFTER timer_expiration_action,
ADD COLUMN IF NOT EXISTS social_proof_text VARCHAR(255) NULL AFTER social_proof_enabled;

CREATE TABLE IF NOT EXISTS custom_domains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    status ENUM('pending', 'active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
