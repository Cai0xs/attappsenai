
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'PROJETO',
    user: 'postgres',
    password: '123456',

    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
    console.log('✅ Banco PostgreSQL conectado com sucesso!');
});

pool.on('error', (err) => {
    console.error('Erro inesperado no banco:', err);
});

module.exports = pool;