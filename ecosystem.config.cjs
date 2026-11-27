module.exports = {
  apps: [
    {
      name: 'upsellflow',
      script: 'server.js',
      exec_mode: 'cluster',
      // Na Hostinger KVM 8 (8 vCPUs), 4 workers oferecem o equilíbrio ideal entre throughput,
      // consumo de RAM e número de conexões ao pooler do PostgreSQL (Supabase).
      // Pode ser customizado livremente via PM2_INSTANCES.
      instances: process.env.PM2_INSTANCES ? (isNaN(Number(process.env.PM2_INSTANCES)) ? process.env.PM2_INSTANCES : Number(process.env.PM2_INSTANCES)) : 4,
      autorestart: true,
      watch: false,
      max_memory_restart: process.env.MAX_MEMORY_RESTART || '1200M',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        HOSTNAME: process.env.HOSTNAME || '0.0.0.0',
        DB_POOL_LIMIT: process.env.DB_POOL_LIMIT || 10,
      },
    },
  ],
};
