import { query, queryOne, execute } from '../db.js';
import crypto from 'crypto';

export async function findSessionByToken(token) {
  return await queryOne('SELECT * FROM upsell_sessions WHERE token = ? LIMIT 1', [token]);
}

export async function findSessionById(id) {
  return await queryOne('SELECT * FROM upsell_sessions WHERE id = ? LIMIT 1', [id]);
}

export async function createSession(campaignId, customerData = {}) {
  // Find first enabled level of campaign
  let firstLevel = await queryOne(
    'SELECT id FROM campaign_levels WHERE campaign_id = ? AND enabled = TRUE ORDER BY level_order ASC, id ASC LIMIT 1',
    [campaignId]
  );

  let currentLevelId = firstLevel ? firstLevel.id : null;

  if (!currentLevelId) {
    // Auto-create initial level if none exists
    const campaign = await queryOne('SELECT name FROM campaigns WHERE id = ?', [campaignId]);
    const cName = campaign ? campaign.name : 'Oferta';
    const ins = await execute(
      `INSERT INTO campaign_levels (campaign_id, name, internal_name, level_order, enabled, theme_name, headline, subheadline, price, cta_text, created_at)
       VALUES (?, 'Oferta Principal', 'Nível 1', 1, TRUE, 'green', ?, 'Aproveite esta condição única adicionando ao seu pedido com apenas 1 clique.', 97.00, 'SIM! QUERO APROVEITAR ESSA OFERTA', NOW())`,
      [campaignId, `ESPERE! Oferta Especial Exclusiva de Upsell (${cName})`]
    );
    currentLevelId = ins.insertId;
  }

  const token = crypto.randomBytes(16).toString('hex');
  const variant = Math.random() < 0.5 ? 'A' : 'B';

  await execute(
    `INSERT INTO upsell_sessions (
      token, campaign_id, current_level_id, customer_name, customer_email, customer_phone, customer_doc,
      variant, utm_source, utm_medium, utm_campaign, utm_content, utm_term, src, status, revenue, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, 'active', 0.00, NOW()
    )`,
    [
      token,
      campaignId,
      currentLevelId,
      customerData.customer_name || customerData.name || null,
      customerData.customer_email || customerData.email || null,
      customerData.customer_phone || customerData.phone || null,
      customerData.customer_doc || customerData.doc || null,
      variant,
      customerData.utm_source || null,
      customerData.utm_medium || null,
      customerData.utm_campaign || null,
      customerData.utm_content || null,
      customerData.utm_term || null,
      customerData.src || null,
    ]
  );

  return await findSessionByToken(token);
}

export async function advanceSessionToNextLevel(sessionId) {
  const session = await findSessionById(sessionId);
  if (!session || session.status !== 'active') return false;

  const currentLevel = await queryOne(
    'SELECT next_level_id, finish_funnel FROM campaign_levels WHERE id = ? LIMIT 1',
    [session.current_level_id]
  );

  if (!currentLevel || currentLevel.finish_funnel) {
    return await completeSession(sessionId);
  }

  if (currentLevel.next_level_id) {
    await execute('UPDATE upsell_sessions SET current_level_id = ? WHERE id = ?', [
      currentLevel.next_level_id,
      sessionId,
    ]);
    return true;
  }

  // Fallback: next level by order
  const currentOrderRow = await queryOne('SELECT level_order FROM campaign_levels WHERE id = ?', [
    session.current_level_id,
  ]);
  const currentOrder = currentOrderRow?.level_order ?? 0;

  const nextLevel = await queryOne(
    `SELECT id FROM campaign_levels 
     WHERE campaign_id = ? AND level_order > ? AND enabled = TRUE 
     ORDER BY level_order ASC, id ASC LIMIT 1`,
    [session.campaign_id, currentOrder]
  );

  if (nextLevel) {
    await execute('UPDATE upsell_sessions SET current_level_id = ? WHERE id = ?', [nextLevel.id, sessionId]);
    return true;
  }

  return await completeSession(sessionId);
}

export async function completeSession(sessionId) {
  await execute("UPDATE upsell_sessions SET status = 'completed' WHERE id = ?", [sessionId]);
  return true;
}

export async function addSessionRevenue(sessionId, amount) {
  await execute('UPDATE upsell_sessions SET revenue = revenue + ? WHERE id = ?', [parseFloat(amount) || 0, sessionId]);
  return true;
}

export async function createOrder({ sessionId, levelId, productId = null, amount, status = 'pending', externalOrderId = null }) {
  const result = await execute(
    `INSERT INTO orders (upsell_session_id, campaign_level_id, product_id, amount, status, external_order_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [sessionId, levelId, productId, parseFloat(amount) || 0, status, externalOrderId]
  );
  return result.insertId;
}

export async function updateOrderStatus(orderId, status) {
  await execute('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
  return true;
}
