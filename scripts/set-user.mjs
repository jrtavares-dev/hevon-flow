import bcrypt from 'bcryptjs';
import pg from 'pg';
import mysql from 'mysql2/promise';

async function setup() {
  const hash = bcrypt.hashSync('admin123', 10);
  console.log('Generated hash for admin123:', hash);

  // 1. Supabase Postgres
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.sousgjlhkomjxzdnnqmn:vDbo15Ruttk0745oG6@aws-1-sa-east-1.pooler.supabase.com:6543/postgres';
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const existing = await pool.query('SELECT * FROM admins WHERE email = $1', ['carlosjunior8@gmail.com']);
    if (existing.rows.length > 0) {
      await pool.query(
        "UPDATE admins SET password = $1, status = 'active', role = 'super_admin' WHERE email = $2",
        [hash, 'carlosjunior8@gmail.com']
      );
      console.log('✓ Atualizado carlosjunior8@gmail.com no Supabase Postgres');
    } else {
      await pool.query(
        "INSERT INTO admins (name, email, password, role, permissions, status) VALUES ($1, $2, $3, $4, $5, $6)",
        ['Carlos Junior', 'carlosjunior8@gmail.com', hash, 'super_admin', '["*"]', 'active']
      );
      console.log('✓ Inserido carlosjunior8@gmail.com no Supabase Postgres');
    }
  } catch (e) {
    console.error('Postgres error:', e.message);
  } finally {
    await pool.end();
  }

  // 2. MySQL
  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'cher_upsell'
    });
    const [rows] = await conn.execute('SELECT * FROM admins WHERE email = ?', ['carlosjunior8@gmail.com']);
    if (rows.length > 0) {
      await conn.execute(
        'UPDATE admins SET password = ?, status = "active", role = "super_admin" WHERE email = ?',
        [hash, 'carlosjunior8@gmail.com']
      );
      console.log('✓ Atualizado carlosjunior8@gmail.com no MySQL');
    } else {
      await conn.execute(
        'INSERT INTO admins (name, email, password, role, permissions, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['Carlos Junior', 'carlosjunior8@gmail.com', hash, 'super_admin', '["*"]', 'active']
      );
      console.log('✓ Inserido carlosjunior8@gmail.com no MySQL');
    }
    await conn.end();
  } catch (e) {
    console.error('MySQL error:', e.message);
  }
}

setup();
