-- Migration 13: Advanced Growth Suite (Cloaker, Video VSL Delay, A/B Testing)
-- Safe & Non-destructive migration for presell_pages and presell_events

-- 1. Video & Pitch Delay columns for presell_pages
ALTER TABLE `presell_pages`
  ADD COLUMN IF NOT EXISTS `video_type` varchar(50) DEFAULT 'none' AFTER `destination_url`,
  ADD COLUMN IF NOT EXISTS `video_url` text DEFAULT NULL AFTER `video_type`,
  ADD COLUMN IF NOT EXISTS `video_autoplay` tinyint(1) DEFAULT 1 AFTER `video_url`,
  ADD COLUMN IF NOT EXISTS `video_sound_banner` tinyint(1) DEFAULT 1 AFTER `video_autoplay`,
  ADD COLUMN IF NOT EXISTS `pitch_delay_enabled` tinyint(1) DEFAULT 0 AFTER `video_sound_banner`,
  ADD COLUMN IF NOT EXISTS `pitch_delay_seconds` int(11) DEFAULT 0 AFTER `pitch_delay_enabled`,
  ADD COLUMN IF NOT EXISTS `pitch_delay_resume` tinyint(1) DEFAULT 1 AFTER `pitch_delay_seconds`;

-- 2. Cloaker & Anti-Bot Shield columns for presell_pages
ALTER TABLE `presell_pages`
  ADD COLUMN IF NOT EXISTS `cloak_enabled` tinyint(1) DEFAULT 0 AFTER `custom_body_code`,
  ADD COLUMN IF NOT EXISTS `cloak_mode` varchar(50) DEFAULT 'white_page' AFTER `cloak_enabled`,
  ADD COLUMN IF NOT EXISTS `cloak_white_url` text DEFAULT NULL AFTER `cloak_mode`,
  ADD COLUMN IF NOT EXISTS `cloak_white_headline` varchar(255) DEFAULT 'Artigo Informativo' AFTER `cloak_white_url`,
  ADD COLUMN IF NOT EXISTS `cloak_white_content` text DEFAULT NULL AFTER `cloak_white_headline`,
  ADD COLUMN IF NOT EXISTS `cloak_allowed_countries` varchar(100) DEFAULT 'BR' AFTER `cloak_white_content`,
  ADD COLUMN IF NOT EXISTS `cloak_filter_bots` tinyint(1) DEFAULT 1 AFTER `cloak_allowed_countries`,
  ADD COLUMN IF NOT EXISTS `cloak_filter_vpn` tinyint(1) DEFAULT 1 AFTER `cloak_filter_bots`;

-- 3. A/B Testing columns for presell_pages
ALTER TABLE `presell_pages`
  ADD COLUMN IF NOT EXISTS `ab_test_enabled` tinyint(1) DEFAULT 0 AFTER `cloak_filter_vpn`,
  ADD COLUMN IF NOT EXISTS `ab_headline_b` varchar(255) DEFAULT NULL AFTER `ab_test_enabled`,
  ADD COLUMN IF NOT EXISTS `ab_subheadline_b` varchar(255) DEFAULT NULL AFTER `ab_headline_b`,
  ADD COLUMN IF NOT EXISTS `ab_button_text_b` varchar(255) DEFAULT NULL AFTER `ab_subheadline_b`,
  ADD COLUMN IF NOT EXISTS `ab_button_subtext_b` varchar(255) DEFAULT NULL AFTER `ab_button_text_b`,
  ADD COLUMN IF NOT EXISTS `ab_button_color_b` varchar(50) DEFAULT NULL AFTER `ab_button_subtext_b`,
  ADD COLUMN IF NOT EXISTS `ab_button_text_color_b` varchar(50) DEFAULT NULL AFTER `ab_button_color_b`,
  ADD COLUMN IF NOT EXISTS `ab_avatar_url_b` text DEFAULT NULL AFTER `ab_button_text_color_b`;

-- 4. Event tracking extensions for presell_events
ALTER TABLE `presell_events`
  ADD COLUMN IF NOT EXISTS `variation` varchar(10) DEFAULT 'A' AFTER `btn_text`,
  ADD COLUMN IF NOT EXISTS `is_bot` tinyint(1) DEFAULT 0 AFTER `variation`,
  ADD COLUMN IF NOT EXISTS `cloak_action` varchar(50) DEFAULT NULL AFTER `is_bot`;

-- 5. Indexes for fast analytics
ALTER TABLE `presell_events`
  ADD KEY IF NOT EXISTS `idx_variation` (`variation`),
  ADD KEY IF NOT EXISTS `idx_is_bot` (`is_bot`);
