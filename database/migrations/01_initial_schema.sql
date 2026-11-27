CREATE TABLE IF NOT EXISTS admins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'super_admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaigns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    description TEXT,
    start_at DATETIME NULL,
    end_at DATETIME NULL,
    default_level_id BIGINT NULL,
    final_redirect_url VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_levels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    internal_name VARCHAR(255) NOT NULL,
    level_order INT NOT NULL DEFAULT 0,
    enabled BOOLEAN DEFAULT TRUE,
    
    -- Theme settings
    theme_name VARCHAR(50) DEFAULT 'green',
    primary_color VARCHAR(50) NULL,
    secondary_color VARCHAR(50) NULL,
    background VARCHAR(255) NULL,
    gradient VARCHAR(255) NULL,
    button_color VARCHAR(50) NULL,
    text_color VARCHAR(50) NULL,
    custom_css TEXT NULL,
    
    -- Content
    badge VARCHAR(255) NULL,
    headline TEXT NULL,
    subheadline TEXT NULL,
    description TEXT NULL,
    image VARCHAR(255) NULL,
    video VARCHAR(255) NULL,
    audio VARCHAR(255) NULL,
    benefits JSON NULL,
    progress_text VARCHAR(255) NULL,
    progress_value INT NULL,
    cta_text VARCHAR(255) NULL,
    
    -- Offer details
    external_checkout_url VARCHAR(500) NULL,
    product_id VARCHAR(255) NULL,
    offer_id VARCHAR(255) NULL,
    price DECIMAL(10,2) NULL,
    original_price DECIMAL(10,2) NULL,
    
    -- Timer
    timer_enabled BOOLEAN DEFAULT FALSE,
    timer_duration INT DEFAULT 300,
    timer_mode VARCHAR(50) DEFAULT 'session',
    timer_expiration_action VARCHAR(50) DEFAULT 'keep_page',
    
    -- Behavior
    next_level_id BIGINT NULL,
    redirect_after_payment BOOLEAN DEFAULT TRUE,
    finish_funnel BOOLEAN DEFAULT FALSE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Insert seed admin user (password is 'password' hashed)
INSERT IGNORE INTO admins (name, email, password) VALUES ('Admin', 'admin@upsellflow.local', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
