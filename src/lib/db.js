import mysql from 'mysql2/promise';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Carregar .env se não estiver rodando dentro do Next.js (ex: scripts CLI)
if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq !== -1) {
          const k = trimmed.slice(0, eq).trim();
          let v = trimmed.slice(eq + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          if (!process.env[k]) process.env[k] = v;
        }
      }
    }
  } catch {}
}

const { Pool } = pg;

// Configurar parser do PostgreSQL para converter BIGINT (INT8) para Number em JS
if (pg.types) {
  pg.types.setTypeParser(pg.types.builtins.INT8, (val) => (val === null ? null : Number(val)));
}

// Prevent multiple pools across Fast Refresh in Next.js development
const globalForDb = globalThis;

/**
 * Verifica se a aplicação está configurada para usar PostgreSQL (Supabase)
 */
export function isPostgres() {
  return Boolean(
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.POSTGRES_URL
  );
}

/**
 * Pool de conexão MySQL (Legado / XAMPP)
 */
export function getMySqlPool() {
  if (!globalForDb._mysqlPool) {
    const host = process.env.DB_HOST || '127.0.0.1';
    const port = Number(process.env.DB_PORT || 3306);
    const user = process.env.DB_USERNAME || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_DATABASE || 'cher_upsell';
    const connectionLimit = Number(process.env.DB_POOL_LIMIT || 30);

    globalForDb._mysqlPool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit,
      maxIdle: Math.min(connectionLimit, 15),
      idleTimeout: 30000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      timezone: '-03:00',
      dateStrings: true,
    });
  }
  return globalForDb._mysqlPool;
}

/**
 * Pool de conexão PostgreSQL (Supabase Transaction/Session Pooler)
 */
/**
 * Pool de conexão PostgreSQL (Supabase Transaction Pooler)
 */
export function getPostgresPool() {
  // Em desenvolvimento local, relê o .env caso tenha sido atualizado sem reiniciar o servidor
  if (process.env.NODE_ENV !== 'production') {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed.startsWith('DATABASE_URL=')) {
            let v = trimmed.slice('DATABASE_URL='.length).trim();
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
              v = v.slice(1, -1);
            }
            if (v && process.env.DATABASE_URL !== v) {
              process.env.DATABASE_URL = v;
            }
          }
        }
      }
    } catch {}
  }

  let connectionString =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.POSTGRES_URL;

  // Se a URL do banco mudou (ex: migração do Supabase para VPS no .env), recria o Pool e limpa caches em memória
  if (globalForDb._pgPool && globalForDb._pgPoolUrl && globalForDb._pgPoolUrl !== connectionString) {
    try {
      globalForDb._pgPool.end().catch(() => {});
    } catch {}
    globalForDb._pgPool = null;
    if (globalForDb._presellAnalyticsCache) globalForDb._presellAnalyticsCache.clear();
    if (globalForDb._presellsCache) globalForDb._presellsCache.clear();
    if (globalForDb._dashboardCache) globalForDb._dashboardCache.clear();
  }

  if (!globalForDb._pgPool) {
    globalForDb._pgPoolUrl = connectionString;

    // Se a VPS já migrou para o PostgreSQL local, garante que novos deploys via ZIP nunca voltem para o Supabase
    try {
      const localLockPaths = [
        '/home/cherminho.app/.upsellflow_local_db',
        path.resolve(process.cwd(), '.local_db_url'),
      ];
      for (const lp of localLockPaths) {
        if (fs.existsSync(lp)) {
          const savedLocalUrl = fs.readFileSync(lp, 'utf8').trim();
          if (savedLocalUrl.startsWith('postgresql://') || savedLocalUrl.startsWith('postgres://')) {
            connectionString = savedLocalUrl;
            break;
          }
        }
      }
    } catch {}

    // Supabase Pooler: se a porta configurada for 5432 (Session Mode com limite rígido de 15 conexões),
    // redireciona automaticamente para a porta 6543 (Transaction Mode / PgBouncer com suporte a milhares de conexões simultâneas)
    if (connectionString && connectionString.includes('pooler.supabase.com:5432')) {
      connectionString = connectionString.replace('pooler.supabase.com:5432', 'pooler.supabase.com:6543');
    }

    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    const isNoSslHost = isLocalhost || connectionString.includes('sslmode=disable');
    const maxConnections = Number(process.env.DB_POOL_LIMIT || (isLocalhost ? 50 : 25));

    // Configuração TLS parametrizada com suporte a certificado CA (SEC-04)
    let sslConfig = false;
    if (!isNoSslHost) {
      const customCaPath = process.env.PG_SSL_CA_PATH || path.join(process.cwd(), 'certs', 'supabase-ca.crt');
      const caCert = process.env.PG_SSL_CA || (fs.existsSync(customCaPath) ? fs.readFileSync(customCaPath, 'utf8') : null);

      if (caCert) {
        sslConfig = {
          rejectUnauthorized: true,
          ca: caCert,
        };
      } else {
        sslConfig = { rejectUnauthorized: false };
      }
    }

    globalForDb._pgPool = new Pool({
      connectionString,
      ssl: sslConfig,
      max: maxConnections,
      min: isLocalhost ? 5 : 2,
      idleTimeoutMillis: isLocalhost ? 30000 : 15000, // Recicla antes do Supavisor derrubar conexões ociosas
      connectionTimeoutMillis: isLocalhost ? 5000 : 8000,
      statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS || 25000),
      query_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS || 25000),
      allowExitOnIdle: false,
      keepAlive: true,
      keepAliveInitialDelayMillis: 3000,
    });

    // Auto-recuperação de erros transitórios em clientes em segundo plano
    globalForDb._pgPool.on('error', (err) => {
      console.warn('PostgreSQL pool event (auto-recovered):', err?.message || err);
    });

    // Pré-aquecimento da conexão em segundo plano para eliminar cold-start
    setTimeout(() => {
      globalForDb._pgPool.query('SELECT 1').catch(() => {});
    }, 50);
  }
  return globalForDb._pgPool;
}

/**
 * Retorna o Pool ativo (Postgres se configurado, senão MySQL)
 */
export function getPool() {
  if (isPostgres()) {
    return getPostgresPool();
  }
  return getMySqlPool();
}

/**
 * Adapta queries escritas em MySQL para o dialeto do PostgreSQL
 */
export function adaptSqlForPostgres(sql, params = []) {
  let text = sql;

  // 1. Remover index hints do MySQL (USE INDEX, FORCE INDEX, IGNORE INDEX)
  text = text.replace(/\b(?:USE|FORCE|IGNORE)\s+INDEX\s*\([^)]*\)/gi, '');

  // 2. Converter CURDATE() para CURRENT_DATE
  text = text.replace(/\bCURDATE\(\)/gi, 'CURRENT_DATE');

  // 3. Converter intervalos de data DATE_SUB(NOW(), INTERVAL X DAY)
  text = text.replace(/DATE_SUB\s*\(\s*NOW\(\)\s*,\s*INTERVAL\s+(\d+|\$\d+|\?)\s+DAY\s*\)/gi, "(NOW() - INTERVAL '$1 days')");
  text = text.replace(/DATE_SUB\s*\(\s*CURDATE\(\)\s*,\s*INTERVAL\s+(\d+|\$\d+|\?)\s+DAY\s*\)/gi, "(CURRENT_DATE - INTERVAL '$1 days')");
  text = text.replace(/\bINTERVAL\s+(\d+)\s+DAY\b/gi, "INTERVAL '$1 days'");

  // 4. Converter HOUR(col) para EXTRACT(HOUR FROM col AT TIME ZONE 'America/Sao_Paulo')
  text = text.replace(/\bHOUR\s*\(\s*([^)]+)\s*\)/gi, "EXTRACT(HOUR FROM $1 AT TIME ZONE 'America/Sao_Paulo')::integer");

  // 5. Converter DATE_FORMAT para TO_CHAR ajustado para o fuso horário de São Paulo
  text = text.replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'%Y-%m-%d'\s*\)/gi, "TO_CHAR($1 AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')");
  text = text.replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'%d\/%m'\s*\)/gi, "TO_CHAR($1 AT TIME ZONE 'America/Sao_Paulo', 'DD/MM')");
  text = text.replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'%Y-%m-01 00:00:00'\s*\)/gi, "TO_CHAR($1 AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-01 00:00:00')");

  // 6. Converter UPSERT específico do ip_cache
  if (/INSERT\s+INTO\s+ip_cache/i.test(text) && /ON\s+DUPLICATE\s+KEY\s+UPDATE/i.test(text)) {
    text = text.replace(
      /ON\s+DUPLICATE\s+KEY\s+UPDATE\s+city\s*=\s*VALUES\s*\(\s*city\s*\)\s*,\s*region\s*=\s*VALUES\s*\(\s*region\s*\)/gi,
      'ON CONFLICT (ip_address) DO UPDATE SET city = EXCLUDED.city, region = EXCLUDED.region'
    );
  }

  // 7. Converter comparações booleanas literais comuns do MySQL (ex: enabled = 1, enabled = 0)
  const boolColsPattern = '(?:enabled|timer_enabled|social_proof_enabled|exit_intent_enabled|ab_testing_enabled|redirect_after_payment|finish_funnel|pass_utm_params|video_autoplay|video_sound_banner|pitch_delay_enabled|pitch_delay_resume|cloak_enabled|cloak_filter_bots|cloak_filter_vpn|ab_test_enabled|is_bot)';
  text = text.replace(new RegExp(`\\b(${boolColsPattern})\\s*=\\s*1\\b`, 'gi'), '$1 = TRUE');
  text = text.replace(new RegExp(`\\b(${boolColsPattern})\\s*=\\s*0\\b`, 'gi'), '$1 = FALSE');
  text = text.replace(new RegExp(`\\b1\\s*=\\s*(${boolColsPattern})\\b`, 'gi'), 'TRUE = $1');
  text = text.replace(new RegExp(`\\b0\\s*=\\s*(${boolColsPattern})\\b`, 'gi'), 'FALSE = $1');
  text = text.replace(new RegExp(`\\b(${boolColsPattern})\\s*(?:<>|!=)\\s*1\\b`, 'gi'), '$1 = FALSE');
  text = text.replace(new RegExp(`\\b(${boolColsPattern})\\s*(?:<>|!=)\\s*0\\b`, 'gi'), '$1 = TRUE');

  // 8. Converter placeholders: ? para $1, $2, $3...
  let paramIndex = 1;
  text = text.replace(/\?/g, () => `$${paramIndex++}`);

  return { text, values: params };
}

/**
 * Executa uma consulta e retorna a lista de linhas (rows)
 * Com retry automático em caso de falha transitória de pooler/conexão
 */
export async function query(sql, params = []) {
  if (isPostgres()) {
    const pool = getPostgresPool();
    const { text, values } = adaptSqlForPostgres(sql, params);
    
    let attempts = 0;
    while (attempts < 4) {
      try {
        const res = await pool.query(text, values);
        return res.rows;
      } catch (err) {
        attempts++;
        const isTransient = /timeout|Connection terminated|max client|max clients|too many clients|too many connections|SN00340|57P01|53300|ECONNRESET|ETIMEDOUT|ECONNREFUSED/i.test(err.message || '');
        if (isTransient && attempts < 4) {
          await new Promise((r) => setTimeout(r, 150 * attempts));
          continue;
        }
        throw err;
      }
    }
  }

  const p = getMySqlPool();
  const [rows] = await p.query(sql, params);
  return rows;
}

/**
 * Executa uma consulta e retorna a primeira linha ou null
 */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
}

/**
 * Executa comando INSERT, UPDATE ou DELETE
 * No PostgreSQL, adiciona RETURNING id automaticamente em INSERTs para compatibilidade com insertId
 */
export async function execute(sql, params = []) {
  if (isPostgres()) {
    const pool = getPostgresPool();
    let querySql = sql;

    const isInsert = /^\s*INSERT\s+INTO/i.test(querySql);
    const hasReturning = /RETURNING/i.test(querySql);

    if (isInsert && !hasReturning) {
      querySql += ' RETURNING id';
    }

    const { text, values } = adaptSqlForPostgres(querySql, params);

    let attempts = 0;
    while (attempts < 4) {
      try {
        const res = await pool.query(text, values);
        const insertId = res.rows && res.rows.length > 0 && res.rows[0].id ? Number(res.rows[0].id) : null;

        return {
          insertId,
          affectedRows: res.rowCount,
          rowCount: res.rowCount,
          rows: res.rows,
        };
      } catch (err) {
        attempts++;
        const isTransient = /timeout|Connection terminated|max client|max clients|too many clients|too many connections|SN00340|57P01|53300|ECONNRESET|ETIMEDOUT|ECONNREFUSED/i.test(err.message || '');
        if (isTransient && attempts < 4) {
          await new Promise((r) => setTimeout(r, 150 * attempts));
          continue;
        }
        throw err;
      }
    }
  }

  const p = getMySqlPool();
  const [result] = await p.execute(sql, params);
  return result;
}

export default {
  getPool,
  getMySqlPool,
  getPostgresPool,
  isPostgres,
  query,
  queryOne,
  execute,
};
