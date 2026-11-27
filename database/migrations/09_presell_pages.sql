-- Migration 09: Presell Pages Module
CREATE TABLE IF NOT EXISTS presell_pages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    
    -- Visual & Media
    avatar_url TEXT NULL,
    background_url TEXT NULL,
    bg_overlay_opacity INT DEFAULT 75,
    accent_color VARCHAR(50) DEFAULT '#22c55e',
    glow_color VARCHAR(50) DEFAULT '#22c55e',
    button_color VARCHAR(50) DEFAULT '#22c55e',
    button_text_color VARCHAR(50) DEFAULT '#000000',
    
    -- Texts & Copywriting
    badge_text VARCHAR(255) DEFAULT 'COMUNIDADE OFICIAL',
    headline VARCHAR(255) DEFAULT 'Cherminho',
    subheadline VARCHAR(255) DEFAULT 'ACESSO EXCLUSIVO',
    button_text VARCHAR(255) DEFAULT 'ENTRAR NA COMUNIDADE',
    button_subtext VARCHAR(255) DEFAULT '100% gratuito · direto no WhatsApp',
    footer_text TEXT NULL,
    
    -- Destination & Behavior
    destination_url VARCHAR(1000) NOT NULL,
    pass_utm_params BOOLEAN DEFAULT TRUE,
    button_animation VARCHAR(50) DEFAULT 'pulse',
    
    -- Tracking & Pixels
    meta_pixel_id VARCHAR(100) NULL,
    ga4_measurement_id VARCHAR(100) NULL,
    tiktok_pixel_id VARCHAR(100) NULL,
    custom_head_code TEXT NULL,
    custom_body_code TEXT NULL,
    
    -- Metrics
    views_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
