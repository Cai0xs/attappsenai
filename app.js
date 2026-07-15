const db = require('./conexao');

async function conectar() {

    try {

        const resultado = await db.query('SELECT NOW()');

    console.log('Data/Hora do servidor:');
        console.log(resultado.rows[0]);

    } catch (erro) {

        console.error('Erro ao conectar:', erro.message);

    }

}

conectar();