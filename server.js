// server.js - Executado via: node server.js
const http = require('node:http');
const fs = require('node:fs');
const db = require('./conexao_fora'); // Importa a sua conexão centralizada do PostgreSQL

// Função para garantir que as tabelas existam automaticamente no banco
async function inicializarBanco() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS alunos (
                id SERIAL PRIMARY KEY,
                registration VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                course VARCHAR(100),
                email VARCHAR(150)
            );
            CREATE TABLE IF NOT EXISTS gestores (
                id SERIAL PRIMARY KEY,
                registration VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                course VARCHAR(100),
                email VARCHAR(150)
            );
            CREATE TABLE IF NOT EXISTS links (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                url TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS posts (
                id VARCHAR(50) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                summary TEXT,
                category VARCHAR(50),
                visibility TEXT[],
                author_name VARCHAR(255),
                author_id VARCHAR(255),
                reactions JSONB,
                attachmenturl TEXT,
                imageurl TEXT,
                eventdate DATE,
                location VARCHAR(255),
                createdat TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Tabelas verificadas/criadas com sucesso no PostgreSQL!");
    } catch (err) {
        console.error("❌ Erro ao criar as tabelas automaticamente:", err);
    }
}

// Configuração e roteamento do Servidor HTTP Nativo
const server = http.createServer(async (req, res) => {
    const url = req.url;

    // Roteamento de Arquivos Estáticos (Lendo de dentro da pasta www)
    if (url === '/' || url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fs.readFileSync('./www/index.html'));
        return;
    }
    if (url === '/style.css') {
        res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
        res.end(fs.readFileSync('./www/style.css'));
        return;
    }
    if (url === '/script.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
        res.end(fs.readFileSync('./www/script.js'));
        return;
    }

    // ==========================================
    // API: Rota de Login (Alunos e Gestores)
    // ==========================================
    if (url === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const dados = JSON.parse(body);
                
                let usuario = null;
                let tipoUsuario = "aluno";

                // 1. Tenta buscar na tabela de alunos
                const queryAluno = "SELECT * FROM alunos WHERE registration = $1";
                let resultado = await db.query(queryAluno, [dados.rm]);
                
                if (resultado.rows.length > 0) {
                    usuario = resultado.rows[0];
                    tipoUsuario = "aluno";
                } else {
                    // 2. Se não achou nos alunos, tenta buscar na tabela de gestores
                    const queryGestor = "SELECT * FROM gestores WHERE registration = $1";
                    resultado = await db.query(queryGestor, [dados.rm]);
                    if (resultado.rows.length > 0) {
                        usuario = resultado.rows[0];
                        tipoUsuario = "gestao";
                    }
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                
                if (usuario) {
                    if (usuario.password === dados.pass) {
                        res.end(JSON.stringify({ 
                            success: true, 
                            nome: usuario.name, 
                            curso: usuario.course || "Análise e Desenv. de Sistemas", 
                            tipo: tipoUsuario,
                            email: usuario.email 
                        }));
                    } else {
                        res.end(JSON.stringify({ success: false, message: "Senha incorreta!" }));
                    }
                } else {
                    res.end(JSON.stringify({ success: false, message: "Matrícula ou usuário não encontrado!" }));
                }
            } catch (err) {
                console.error(err);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: "Erro ao processar a requisição." }));
            }
        });
        return;
    }

    // ==========================================
    // API: Rota para Cadastrar / Alterar Senha
    // ==========================================
    if (url === '/api/alterar-senha' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const dados = JSON.parse(body);
                const rm = dados.rm;
                const novaSenha = dados.novaSenha;

                let updateQuery = "UPDATE alunos SET password = $1 WHERE registration = $2";
                let resultado = await db.query(updateQuery, [novaSenha, rm]);

                if (resultado.rowCount === 0) {
                    updateQuery = "UPDATE gestores SET password = $1 WHERE registration = $2";
                    resultado = await db.query(updateQuery, [novaSenha, rm]);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });

                if (resultado.rowCount > 0) {
                    res.end(JSON.stringify({ success: true, message: "Senha cadastrada com sucesso!" }));
                } else {
                    res.end(JSON.stringify({ success: false, message: "Matrícula não encontrada no sistema." }));
                }
            } catch (err) {
                console.error("Erro ao alterar senha:", err);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: "Erro ao processar a alteração de senha." }));
            }
        });
        return;
    }

    // ==========================================
    // API: Rota para Buscar Links Úteis
    // ==========================================
    if (url === '/api/links' && req.method === 'GET') {
        try {
            const resultado = await db.query('SELECT * FROM links ORDER BY id ASC');
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(resultado.rows));
        } catch (err) {
            console.error("Erro ao buscar links:", err);
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: "Erro ao buscar links no banco" }));
        }
        return;
    }

    // ==========================================
    // API: Rota para Buscar o Mural (Posts)
    // ==========================================
    if (url === '/api/mural' && req.method === 'GET') {
        try {
            const resultado = await db.query('SELECT * FROM posts ORDER BY createdat DESC');
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(resultado.rows));
        } catch (err) {
            console.error("Erro ao buscar mural:", err);
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: "Erro ao buscar mural no banco" }));
        }
        return;
    }

    // Rota padrão caso acessem um caminho inválido
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Página não encontrada.');
});

// Inicializa o servidor na porta 3000
server.listen(3000, async () => {
    await inicializarBanco();
    console.log("🚀 Servidor rodando na porta 3000 conectado ao seu PostgreSQL local!");
    console.log("🔗 Acesse o aplicativo em: http://localhost:3000");
});