// server.js - Executado via: node server.js
const http = require('node:http');
const fs = require('node:fs');
const db = require('./conexao'); // Importa a sua conexão centralizada do PostgreSQL

// Configuração e roteamento do Servidor HTTP Nativo (com async adicionado)
const server = http.createServer(async (req, res) => {
    const url = req.url;

    // Roteamento de Arquivos Estáticos (Entrega o Frontend para o Navegador)
    if (url === '/' || url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fs.readFileSync('./index.html'));
        return;
    }
    if (url === '/style.css') {
        res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
        res.end(fs.readFileSync('./style.css'));
        return;
    }
    if (url === '/script.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
        res.end(fs.readFileSync('./script.js'));
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
                    // Validação da senha (compara com a coluna password do banco)
                    if (usuario.password === dados.pass) {
                        res.end(JSON.stringify({ 
                            success: true, 
                            nome: usuario.name, 
                            curso: usuario.course || "Administração / Gestão",
                            tipo: tipoUsuario
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

    // Rota padrão caso acessem um caminho inválido
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Página não encontrada.');
});

// Inicializa o servidor na porta 3000
server.listen(3000, () => {
    console.log("🚀 Servidor rodando na porta 3000 conectado ao seu PostgreSQL local!");
    console.log("🔗 Acesse o aplicativo em: http://localhost:3000");
});