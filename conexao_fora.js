require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('connect', () => {
    console.log('✅ Banco PostgreSQL do Render conectado com sucesso!');
});

pool.on('error', (err) => {
    console.error('❌ Erro inesperado no banco:', err);
});

module.exports = pool;