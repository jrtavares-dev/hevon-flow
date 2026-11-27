# HEVON FLOW — Funis, Presells & Gamificação

Módulo web em **Next.js 15 + React 19 + PostgreSQL** contendo:

- **Dashboard Executivo** (`/admin/dashboard`) com atualização em tempo real
- **Funis & Campanhas** (`/admin/campaigns`) — fluxos de upsell/downsell pós-compra
- **Páginas Presell** (`/admin/presells`) — construtor de páginas + analytics em tempo real
- **Jogos & Gamificação** (`/admin/games`) — Roleta da Sorte, Raspadinha (com múltiplos produtos randomizados), Caixa Misteriosa e Quebra-Cabeça

## Como rodar localmente

1. Copie `.env.example` para `.env` e configure `DATABASE_URL` e `JWT_SECRET`:
   ```bash
   cp .env.example .env
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Aplique as migrations SQL da pasta `database/migrations/` no seu PostgreSQL.
4. Crie o usuário administrador inicial:
   ```bash
   node scripts/set-user.mjs
   ```
5. Inicie em desenvolvimento ou produção:
   ```bash
   npm run dev
   # ou
   npm run build && npm run start
   ```
