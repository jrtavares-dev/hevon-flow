-- Migration 11: Presell Analytics & Event Tracking
-- Safe & Non-destructive: Creates presell_events table without affecting any existing tables or users.

CREATE TABLE IF NOT EXISTS `presell_events` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `presell_page_id` BIGINT NOT NULL,
  `visitor_id` BIGINT DEFAULT NULL,
  `event_type` VARCHAR(50) NOT NULL,
  `btn_index` INT DEFAULT NULL,
  `btn_text` VARCHAR(255) DEFAULT NULL,
  `utm_source` VARCHAR(255) DEFAULT NULL,
  `utm_medium` VARCHAR(255) DEFAULT NULL,
  `utm_campaign` VARCHAR(255) DEFAULT NULL,
  `utm_content` VARCHAR(255) DEFAULT NULL,
  `utm_term` VARCHAR(255) DEFAULT NULL,
  `src` VARCHAR(255) DEFAULT NULL,
  `device_type` VARCHAR(50) DEFAULT 'desktop',
  `os` VARCHAR(50) DEFAULT NULL,
  `browser` VARCHAR(50) DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `referer` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_presell_page_id` (`presell_page_id`),
  INDEX `idx_visitor_id` (`visitor_id`),
  INDEX `idx_event_type` (`event_type`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_utm_source` (`utm_source`),
  INDEX `idx_device_type` (`device_type`),
  CONSTRAINT `fk_presell_events_page` FOREIGN KEY (`presell_page_id`) REFERENCES `presell_pages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
