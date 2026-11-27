-- Migration: 10_admin_roles_and_permissions.sql
-- Description: Adds permissions JSON and status columns to admins table

ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS permissions LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(permissions) OR permissions IS NULL) AFTER role,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' AFTER permissions;

-- Update existing super admins to have full permissions wildcard
UPDATE admins 
SET role = 'super_admin', 
    permissions = '["*"]', 
    status = 'active' 
WHERE role = 'super_admin' OR id = 1;
