-- Migration 15: Social Proof Engine for Presell Pages (Live fake purchases notifications / FOMO)
ALTER TABLE `presell_pages`
ADD COLUMN IF NOT EXISTS `social_proof_enabled` TINYINT(1) DEFAULT 1 AFTER `ab_avatar_url_b`,
ADD COLUMN IF NOT EXISTS `social_proof_text` VARCHAR(255) DEFAULT '{name} de {city} acabou de comprar' AFTER `social_proof_enabled`,
ADD COLUMN IF NOT EXISTS `social_proof_interval` VARCHAR(20) DEFAULT 'balanced' AFTER `social_proof_text`,
ADD COLUMN IF NOT EXISTS `social_proof_position` VARCHAR(20) DEFAULT 'bottom-left' AFTER `social_proof_interval`;
