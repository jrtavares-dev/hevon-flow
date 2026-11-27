-- Migration: 12_geolocation_and_demographics.sql
-- Add geolocation and demographic tracking support for presells and sessions

CREATE TABLE IF NOT EXISTS `ip_cache` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL,
  `country` varchar(100) DEFAULT NULL,
  `country_code` varchar(10) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `region_name` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_ip_unique` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add geolocation columns to presell_events if they don't exist
ALTER TABLE `presell_events`
  ADD COLUMN IF NOT EXISTS `city` varchar(100) DEFAULT NULL AFTER `browser`,
  ADD COLUMN IF NOT EXISTS `region` varchar(50) DEFAULT NULL AFTER `city`,
  ADD COLUMN IF NOT EXISTS `country` varchar(50) DEFAULT NULL AFTER `region`;

-- Add indexes if not exists
ALTER TABLE `presell_events`
  ADD KEY IF NOT EXISTS `idx_city` (`city`),
  ADD KEY IF NOT EXISTS `idx_region` (`region`);
