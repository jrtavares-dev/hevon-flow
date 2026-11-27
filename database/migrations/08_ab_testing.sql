ALTER TABLE campaign_levels
ADD COLUMN IF NOT EXISTS ab_testing_enabled TINYINT(1) DEFAULT 0 AFTER tiered_pricing_json,
ADD COLUMN IF NOT EXISTS ab_variant_b_headline VARCHAR(255) NULL AFTER ab_testing_enabled,
ADD COLUMN IF NOT EXISTS ab_variant_b_price DECIMAL(10,2) NULL AFTER ab_variant_b_headline,
ADD COLUMN IF NOT EXISTS ab_variant_b_video VARCHAR(255) NULL AFTER ab_variant_b_price;

ALTER TABLE upsell_sessions
ADD COLUMN IF NOT EXISTS variant CHAR(1) DEFAULT 'A' AFTER status;
