// --- ESTADO GLOBAL ---
let abaAtual = "mural";
let filtroTagAtivo = "todos";
let listaGlobalCards = []; // Armazena os dados para a busca por palavra-chave
let dadosUsuario = {
    nome: "",
    rm: "",
    tipo: "aluno",
    curso: "",
    turma: "",
    turno: "",
    email: ""
};

// --- TEMA ---
document.addEventListener("DOMContentLoaded", () => {
    const temaSalvo = localStorage.getItem("app-theme") || "light";
    document.documentElement.setAttribute("data-theme", temaSalvo);
    const iconeTema = document.querySelector("#theme-toggle i");
    if(iconeTema) iconeTema.className = temaSalvo === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
});

function alternarTema() {
    const novoTema = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", novoTema);
    localStorage.setItem("app-theme", novoTema);
    document.querySelector("#theme-toggle i").className = novoTema === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
}

// --- LOGIN, CADASTRO E RECUPERAÇÃO ---
function alternarTelaCadastro(mostrar) {
    const loginInputs = document.getElementById('login-inputs');
    const registerInputs = document.getElementById('register-inputs');
    document.getElementById("login-error").innerText = "";

    if (mostrar) {
        loginInputs.style.display = 'none';
        registerInputs.style.display = 'block';
    } else {
        loginInputs.style.display = 'block';
        registerInputs.style.display = 'none';
    }
}

function mostrarCadastro() {
    alternarTelaCadastro(true);
}

function mostrarLogin() {
    alternarTelaCadastro(false);
}

async function salvarCadastro() {
    const rm = document.getElementById('reg-rm').value.trim();
    const novaSenha = document.getElementById('reg-password').value;
    const erroElemento = document.getElementById("login-error");
    erroElemento.style.color = "";
    
    const apenasAlfanumerico = /^[a-zA-Z0-9]+$/;

    if (!apenasAlfanumerico.test(rm)) {
        erroElemento.innerText = "A matrícula deve conter apenas letras e números!";
        return;
    }

    if (!novaSenha) {
        erroElemento.innerText = "Preencha a senha para cadastrar.";
        return;
    }

    // Validação estrita: A senha deve conter exatamente 8 caracteres
    if (novaSenha.length !== 8) {
        erroElemento.innerText = "A senha deve conter exatamente 8 caracteres!";
        return;
    }

    try {
        const resposta = await fetch('/api/alterar-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rm, novaSenha })
        });

        const resultado = await resposta.json();

        if (resultado.success) {
            erroElemento.style.color = "green";
            erroElemento.innerText = resultado.message || "Cadastro realizado com sucesso!";
            setTimeout(() => {
                erroElemento.style.color = "";
                erroElemento.innerText = "";
                mostrarLogin();
            }, 2000);
        } else {
            erroElemento.innerText = resultado.message || "Matrícula não encontrada.";
        }
    } catch (err) {
        erroElemento.innerText = "Erro de conexão com o servidor.";
    }
}

async function efetuarLogin() {
    const loginInput = document.getElementById("login-rm").value.trim();
    const passInput = document.getElementById("login-password").value;
    const erroElemento = document.getElementById("login-error");
    erroElemento.style.color = "";

    if (!loginInput || !passInput) {
        erroElemento.innerText = "Preencha todos os campos.";
        return;
    }

    const apenasAlfanumerico = /^[a-zA-Z0-9]+$/;
    if (!apenasAlfanumerico.test(loginInput)) {
        erroElemento.innerText = "A matrícula deve conter apenas letras e números!";
        return;
    }

    try {
        const resposta = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rm: loginInput, pass: passInput })
        });

        const resultado = await resposta.json();

        if (resultado.success) {
            dadosUsuario = {
                nome: resultado.nome || "Aluno SENAI",
                rm: loginInput,
                tipo: resultado.tipo || "aluno",
                curso: resultado.curso || "Análise e Desenv. de Sistemas",
                turma: "Turma A",
                turno: "Noite",
                email: `aluno.${loginInput}@aluno.senai.br`
            };

            erroElemento.innerText = "";
            document.getElementById("login-screen").classList.remove("active");
            document.getElementById("app-screen").classList.add("active");
            document.getElementById("welcome-text").innerText = "Olá, Sou seu Comunic!";
            document.getElementById("user-info").innerText = dadosUsuario.curso;
            
            renderizarConteudoComSkeleton();
        } else {
            erroElemento.innerText = resultado.message || "Matrícula ou senha incorretos / não cadastrados.";
        }
    } catch (err) {
        erroElemento.innerText = "Erro de conexão com o servidor Node.js.";
    }
}

function fecharSessao() {
    document.getElementById("login-rm").value = "";
    document.getElementById("login-password").value = "";
    document.getElementById("login-error").innerText = "";
    document.getElementById("app-screen").classList.remove("active");
    document.getElementById("login-screen").classList.add("active");
}

// --- RENDERIZAÇÃO ---
function renderizarConteudoComSkeleton() {
    const area = document.getElementById("content-area");
    area.innerHTML = `<div class="skeleton-card" style="height:150px; margin-bottom:10px;"></div>`.repeat(2);
    
    const filtros = document.getElementById("quick-filters");
    if(filtros) filtros.style.display = (abaAtual === "perfil") ? "none" : "flex";
    
    setTimeout(() => {
        if (abaAtual === "perfil") {
            renderizarPerfil(area);
        } else {
            area.innerHTML = `
                <div style="margin-bottom: 15px; position: relative; display: flex; align-items: center;">
                    <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 15px; color: var(--text-secondary);"></i>
                    <input type="text" id="input-busca-geral" placeholder="Pesquisar..." onkeyup="filtrarConteudoPorPalavraChave()" style="width: 100%; padding: 12px 15px 12px 45px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-primary); outline: none; font-size: 14px;">
                </div>
                <div id="cards-resultado-container"></div>
            `;
            carregarDadosDaSecao();
        }
    }, 400);
}

// --- CARREGAMENTO DE DADOS DA SEÇÃO ---
async function carregarDadosDaSecao() {
    listaGlobalCards = []; 

    if (abaAtual === "mural") {
        try {
            const resposta = await fetch('/api/mural');
            const dadosDoBanco = await resposta.json();

            listaGlobalCards = dadosDoBanco.map(post => ({
                id: post.id,
                titulo: post.title,
                desc: post.summary,
                categoria: "mural",
                tag: (post.category || "").toLowerCase().includes("gest") ? "gest" : 
                     (post.category || "").toLowerCase().includes("prof") ? "prof" : 
                     (post.category || "").toLowerCase().includes("vaga") ? "job" : "todos",
                location: post.location,
                eventDate: post.eventdate,
                imageUrl: post.imageurl
            }));
        } catch (err) {
            console.error("Erro ao carregar o mural do banco:", err);
            listaGlobalCards = [];
        }
    } else if (abaAtual === "links") {
        try {
            const resposta = await fetch('/api/links');
            const dadosDoBanco = await resposta.json();

            listaGlobalCards = dadosDoBanco.map(link => ({
                id: link.id,
                titulo: link.name,
                desc: link.description,
                url: link.url,
                tag: "geral",
                tipo: "Link",
                categoria: "links"
            }));
        } catch (err) {
            console.error("Erro ao carregar os links do banco:", err);
            listaGlobalCards = [];
        }
    } else {
        listaGlobalCards = []; 
    }

    renderizarCardsFiltrados(listaGlobalCards);
}

function renderizarCardsFiltrados(itens) {
    const containerCards = document.getElementById("cards-resultado-container");
    if (!containerCards) return;

    const filtrados = itens.filter(i => {
        if (abaAtual === "links") {
            return i.categoria === "links";
        }
        if (abaAtual === "mural") {
            return i.categoria === "mural" && (filtroTagAtivo === "todos" || i.tag === filtroTagAtivo);
        }
        return i.categoria === abaAtual && (filtroTagAtivo === "todos" || i.tag === filtroTagAtivo);
    });
    
    containerCards.innerHTML = filtrados.length ? filtrados.map(c => `
        <div class="card" style="margin-bottom: 12px; padding: 15px;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h3 style="font-size: 16px; color: var(--text-primary);">${c.titulo}</h3>
            </div>
            <p class="card-desc" style="margin-bottom: 10px; color: var(--text-secondary); font-size: 14px;">${c.desc || ''}</p>
            
            ${c.location ? `<p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;"><i class="fa-solid fa-location-dot"></i> Local: ${c.location}</p>` : ''}
            ${c.eventDate ? `<p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;"><i class="fa-solid fa-calendar"></i> Data: ${new Date(c.eventDate).toLocaleDateString('pt-BR')}</p>` : ''}

            ${c.url ? `
                <div style="margin-top: 8px; font-size: 13px;">
                    <a href="${c.url}" target="_blank" style="color: var(--laranja-senai, #ff6b00); text-decoration: none; word-break: break-all; display: inline-flex; align-items: center; gap: 5px;">
                        <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 11px;"></i> ${c.url}
                    </a>
                </div>
            ` : ''}
        </div>`).join('') : `<p style="text-align:center; padding:30px; color:var(--text-secondary);">Nenhum registro encontrado nesta seção.</p>`;
}

function filtrarConteudoPorPalavraChave() {
    const termo = document.getElementById("input-busca-geral").value.toLowerCase().trim();

    const filtrados = listaGlobalCards.filter(i => {
        const titulo = (i.titulo || "").toLowerCase();
        const desc = (i.desc || "").toLowerCase();
        return titulo.includes(termo) || desc.includes(termo);
    });

    renderizarCardsFiltrados(filtrados);
}

function renderizarPerfil(container) {
    const iniciais = dadosUsuario.nome ? dadosUsuario.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "CS";
    const isProf = (dadosUsuario.tipo === "professor");
    const isGestao = (dadosUsuario.tipo === "gestao");

    container.innerHTML = `
        <div class="card" style="padding: 20px 15px; position: relative;">
            <div style="position: absolute; top: 15px; right: 15px; display: flex; gap: 14px; font-size: 16px;">
                <button onclick="executarAtualizacaoPerfil(this)" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; transition: color 0.2s, transform 0.5s ease;">
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
                <button onclick="abrirModalPerfil()" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; transition: color 0.2s;">
                    <i class="fa-solid fa-gear"></i>
                </button>
            </div>
            <div style="text-align: center; margin-top: 10px;">
                <div style="width: 75px; height: 75px; background: var(--laranja-senai); color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 12px auto; font-size: 26px; font-weight: bold; box-shadow: 0 4px 10px rgba(255,107,0,0.25);">
                    ${iniciais}
                </div>
                <h3 style="font-size: 18px; margin-bottom: 4px; color: var(--text-primary);">${dadosUsuario.nome}</h3>
                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 15px;">${isGestao ? 'Administrador' : (isProf ? 'Docente' : 'RM: ' + dadosUsuario.rm)}</p>
            </div>
            <div style="border-top: 1px solid var(--border-color); padding-top: 15px; text-align: left; font-size: 13.5px;">
                ${!isGestao ? `<p style="margin-bottom: 8px; color: var(--text-secondary);"><strong>Curso:</strong> ${dadosUsuario.curso}</p>` : ''}
                ${!isProf && !isGestao ? `
                    <p style="margin-bottom: 8px; color: var(--text-secondary);"><strong>Turma:</strong> ${dadosUsuario.turma}</p>
                    <p style="margin-bottom: 8px; color: var(--text-secondary);"><strong>Turno:</strong> ${dadosUsuario.turno}</p>
                ` : ''}
                <p style="color: var(--text-secondary);"><strong>E-mail:</strong> ${dadosUsuario.email}</p>
            </div>
        </div>
    `;
}

function executarAtualizacaoPerfil(botao) {
    botao.style.transform = "rotate(360deg)";
    setTimeout(() => { botao.style.transform = "rotate(0deg)"; }, 500);
    renderizarConteudoComSkeleton();
}

function abrirModalPerfil() {
    document.getElementById("edit-nome").value = dadosUsuario.nome;
    document.getElementById("edit-curso").value = dadosUsuario.curso;
    document.getElementById("edit-turma").value = dadosUsuario.turma;
    document.getElementById("edit-turno").value = dadosUsuario.turno;
    document.getElementById("modal-overlay").style.display = "flex";
}

function fecharModalPerfil() { document.getElementById("modal-overlay").style.display = "none"; }

function salvarConfiguracoesPerfil() {
    dadosUsuario.nome = document.getElementById("edit-nome").value;
    dadosUsuario.curso = document.getElementById("edit-curso").value;
    dadosUsuario.turma = document.getElementById("edit-turma").value;
    dadosUsuario.turno = document.getElementById("edit-turno").value;

    document.getElementById("welcome-text").innerText = "Olá, Sou seu Comunic!";
    document.getElementById("user-info").innerText = dadosUsuario.curso;

    fecharModalPerfil();
    renderizarPerfil(document.getElementById("content-area"));
}

function mudarTab(id, e) {
    abaAtual = id;
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    e.currentTarget.classList.add("active");
    renderizarConteudoComSkeleton();
}

function filtrarPorTag(tag, btn) {
    filtroTagAtivo = tag;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderizarCardsFiltrados(listaGlobalCards);
}

function abrirNotificacoes() {
    const container = document.getElementById("sidebar-content");
    const minhasNotificacoes = [];
    container.innerHTML = minhasNotificacoes.length ? `<div style="padding: 10px;">${minhasNotificacoes.map(n => `<div class="card" style="margin-bottom: 15px; cursor: pointer;"><div class="card-header"><h3 style="font-size: 14px;">${n.titulo}</h3><span class="tag ${n.tag}" style="font-size: 9px; padding: 3px 6px;">${n.tipo}</span></div><p class="card-desc" style="font-size: 12px; margin-top: 5px;">${n.desc}</p></div>`).join('')}</div>` : `<p style="text-align:center; padding:20px; color:var(--text-secondary);">Sem notificações recentes.</p>`;
    document.getElementById("sidebar-overlay").style.display = "block";
    document.getElementById("notification-sidebar").classList.add("open");
}

function fecharNotificacoes() {
    document.getElementById("sidebar-overlay").style.display = "none";
    document.getElementById("notification-sidebar").classList.remove("open");
}