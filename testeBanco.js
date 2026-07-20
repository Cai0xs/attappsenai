require('dotenv').config();

const db = require('./conexao_fora');

async function testarConexao() {

    try {

        console.log('🔄 Testando conexão...');

        const resultado = await db.query(`
            SELECT
                NOW() AS data_hora,
                current_database() AS banco,
                current_user AS usuario,
                version() AS versao
        `);

        console.log('\n✅ CONEXÃO REALIZADA COM SUCESSO!\n');

        console.log('Banco:', resultado.rows[0].banco);
        console.log('Usuário:', resultado.rows[0].usuario);
        console.log('Data/Hora:', resultado.rows[0].data_hora);
        console.log('Versão:', resultado.rows[0].versao);

    } catch (erro) {

        console.error('\n❌ ERRO NA CONEXÃO:\n');

        console.error('Mensagem:', erro.message);

        if (erro.code) {
            console.error('Código:', erro.code);
        }

    } finally {

        await db.end();
        console.log('\n🔌 Conexão encerrada.');

    }
}

testarConexao();