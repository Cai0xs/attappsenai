// server.js - Executado via: node server.js
const http = require('node:http');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

// Inicializa o banco de dados SQLite nativo do Node (Cria o arquivo senai.db automaticamente)
const db = new DatabaseSync('senai.db');

// Cria a tabela de alunos se ela não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS alunos (
    rm TEXT PRIMARY KEY,
    senha TEXT,
    nome TEXT,
    curso TEXT
  )
`);

// Verifica se o banco está vazio para inserir os dados de teste iniciais
const verificarTabela = db.prepare("SELECT COUNT(*) as total FROM alunos").get();
if (verificarTabela.total === 0) {
    const insert = db.prepare("INSERT INTO alunos (rm, senha, nome, curso) VALUES (?, ?, ?, ?)");
    
    // Inserindo dados de teste profissionais (Seu login de acesso)
    insert.run('12345', 'senai123', 'Caio Silva', 'Análise e Desenv. de Sistemas');
    insert.run('67890', 'aluno2026', 'Mariana Costa', 'Redes de Computadores');
    
    console.log("👉 Banco de dados SQLite criado e populado com alunos de teste!");
}

// Configuração e roteamento do Servidor HTTP Nativo
const server = http.createServer((req, res) => {
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
    // API: Rota de Login (Consulta o SQLite)
    // ==========================================
    if (url === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const dados = JSON.parse(body);
                
                // Consulta segura utilizando Prepared Statements para evitar SQL Injection
                const query = db.prepare("SELECT * FROM alunos WHERE rm = ? AND senha = ?");
                const usuario = query.get(dados.rm, dados.pass);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                if (usuario) {
                    res.end(JSON.stringify({ success: true, nome: usuario.nome, curso: usuario.curso }));
                } else {
                    res.end(JSON.stringify({ success: false, message: "Apenas alunos matriculados têm acesso!" }));
                }
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: "Erro ao processar a requisição." }));
            }
        });
        return;
    }

    // ==========================================
    // API: Rota de Troca de Senha
    // ==========================================
    if (url === '/api/alterar-senha' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const dados = JSON.parse(body);
                
                // Verifica primeiro se o aluno de fato existe no SQLite
                const queryVerificar = db.prepare("SELECT * FROM alunos WHERE rm = ?");
                const usuarioExistente = queryVerificar.get(dados.rm);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                if (usuarioExistente) {
                    // Executa a atualização da senha direto no banco
                    const update = db.prepare("UPDATE alunos SET senha = ? WHERE rm = ?");
                    update.run(dados.novaSenha, dados.rm);
                    res.end(JSON.stringify({ success: true, message: "Senha alterada com sucesso!" }));
                } else {
                    res.end(JSON.stringify({ success: false, message: "RM não cadastrado no sistema do SENAI." }));
                }
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: "Erro ao processar alteração." }));
            }
        });
        return;
    }

    // Rota padrão caso acessem um caminho inválido
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Página não encontrada.');
});

// Inicializa o servidor na porta 3000
server.listen(3000, () => {
    console.log("🚀 Servidor Node.js puro rodando com SQLite nativo!");
    console.log("🔗 Acesse o aplicativo em: http://localhost:3000");
});