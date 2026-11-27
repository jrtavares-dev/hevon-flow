ALTER TABLE campaigns
ADD COLUMN meta_pixel_id VARCHAR(50) NULL AFTER status,
ADD COLUMN meta_access_token VARCHAR(255) NULL AFTER meta_pixel_id,
ADD COLUMN ga4_measurement_id VARCHAR(50) NULL AFTER meta_access_token,
ADD COLUMN gtm_id VARCHAR(50) NULL AFTER ga4_measurement_id;
