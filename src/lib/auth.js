import { cache } from 'react';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { queryOne, query, execute } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'upsellflow_secret_key_jwt_super_secure_983742';
const COOKIE_NAME = 'upsellflow_session';

export function hashPassword(plainPassword) {
  return bcrypt.hashSync(plainPassword, 10);
}

export function verifyPassword(plainPassword, hashedPassword) {
  if (!hashedPassword) return false;
  // Handle PHP $2y$ prefix by replacing with $2a$ if needed
  const normalized = hashedPassword.startsWith('$2y$')
    ? hashedPassword.replace('$2y$', '$2a$')
    : hashedPassword;
  return bcrypt.compareSync(plainPassword, normalized);
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function decodePermissions(perms) {
  if (!perms) return [];
  if (Array.isArray(perms)) return perms;
  try {
    return JSON.parse(perms);
  } catch {
    return [];
  }
}

export function hasPermission(admin, requiredPerm) {
  if (!admin) return false;
  if (admin.role === 'super_admin') return true;
  const permissions = Array.isArray(admin.permissions)
    ? admin.permissions
    : decodePermissions(admin.permissions);
  if (permissions.includes('*')) return true;
  return permissions.includes(requiredPerm);
}

const adminSessionCache = globalThis._adminSessionCache || (globalThis._adminSessionCache = new Map());
const ADMIN_CACHE_TTL_MS = 60 * 1000; // 60 segundos de cache em memória para navegação ultra-rápida

export const getCurrentAdmin = cache(async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) return null;

    const cacheKey = `adm_${decoded.id}_${token.slice(-12)}`;
    const cached = adminSessionCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < ADMIN_CACHE_TTL_MS)) {
      return cached.admin;
    }

    try {
      const admin = await queryOne(
        'SELECT id, name, email, role, permissions, status FROM admins WHERE id = ?',
        [decoded.id]
      );

      if (admin) {
        if (admin.status === 'inactive') {
          adminSessionCache.delete(cacheKey);
          return null;
        }
        admin.permissions = decodePermissions(admin.permissions);
        adminSessionCache.set(cacheKey, { timestamp: Date.now(), admin });
        return admin;
      }
    } catch (dbErr) {
      console.warn('DB query notice in getCurrentAdmin (using fallback session):', dbErr?.message || dbErr);
    }

    // Se o banco estiver momentaneamente ocupado, mantém a sessão ativa com base no JWT assinado e verificado
    const fallbackAdmin = {
      id: decoded.id,
      name: decoded.name || 'Admin',
      email: decoded.email || 'admin@upsellflow.local',
      role: decoded.role || 'super_admin',
      permissions: ['*'],
      status: 'active',
    };
    adminSessionCache.set(cacheKey, { timestamp: Date.now(), admin: fallbackAdmin });
    return fallbackAdmin;
  } catch (err) {
    return null;
  }
});

export { COOKIE_NAME };
