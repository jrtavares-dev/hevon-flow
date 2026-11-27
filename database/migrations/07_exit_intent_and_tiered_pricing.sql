ALTER TABLE campaign_levels
ADD COLUMN IF NOT EXISTS exit_intent_enabled TINYINT(1) DEFAULT 1 AFTER social_proof_text,
ADD COLUMN IF NOT EXISTS exit_intent_title VARCHAR(255) NULL AFTER exit_intent_enabled,
ADD COLUMN IF NOT EXISTS exit_intent_discount_price DECIMAL(10,2) NULL AFTER exit_intent_title,
ADD COLUMN IF NOT EXISTS exit_intent_cta_text VARCHAR(255) NULL AFTER exit_intent_discount_price,
ADD COLUMN IF NOT EXISTS tiered_pricing_json TEXT NULL AFTER exit_intent_cta_text;
