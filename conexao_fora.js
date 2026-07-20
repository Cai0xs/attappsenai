require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    // Necessário para conexões externas no Render
  //  ssl: {
     //   rejectUnauthorized: false
 //},

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

pool.on('connect', () => {
    console.log('✅ PostgreSQL conectado com sucesso!');
});

pool.on('error', (err) => {
    console.error('❌ Erro inesperado no pool:', err.message);
});

module.exports = pool;