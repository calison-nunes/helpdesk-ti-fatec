// ==========================================
// CONFIGURAÇÕES INICIAIS DO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://fazysaycvldmxpquuokw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhenlzYXljdmxkbXhwcXV1b2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTI2MzksImV4cCI6MjA5MzkyODYzOX0.NaDzS6UvOzklC1d_qRe9W_FijW4pZOTf7ZKfpifbx-Y';

const HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

let usuarioLogado = null;
let chamadosGlobais = [];

// ==========================================
// 0. FUNÇÕES DO DARK MODE
// ==========================================

if (localStorage.getItem('tema-helpdesk') === 'escuro') {
    document.documentElement.classList.add('dark');
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    
    if (document.documentElement.classList.contains('dark')) {
        localStorage.setItem('tema-helpdesk', 'escuro');
    } else {
        localStorage.setItem('tema-helpdesk', 'claro');
    }
}

// ==========================================
// 1. FUNÇÕES DA TELA DE LOGIN E CADASTRO
// ==========================================

function alternarTelasAuth(telaParaMostrar) {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById(telaParaMostrar).classList.remove('hidden');
}

async function cadastrarUsuario() {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-senha').value;

    if (nome == "" || email == "" || senha == "") {
        Swal.fire('Opa!', 'Preencha todos os campos pra cadastrar.', 'warning');
        return; 
    }

    try {
        const resposta = await fetch(`${SUPABASE_URL}/rest/v1/analistas`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({
                nome: nome,
                email: email,
                senha: senha,
                cargo: 'Suporte Técnico' 
            })
        });

        if (resposta.ok) {
            Swal.fire('Boa!', 'Cadastro feito com sucesso. Faça login.', 'success');
            alternarTelasAuth('login-form'); 
        } else {
            console.log("Deu erro ao salvar:", await resposta.json());
            Swal.fire('Erro', 'Não foi possível cadastrar (E-mail já existe?)', 'error');
        }
    } catch (erro) {
        alert("Erro de conexão com o Supabase");
    }
}

async function fazerLogin() {
    const emailDigitado = document.getElementById('login-email').value;
    const senhaDigitada = document.getElementById('login-senha').value;

    if (emailDigitado == "" || senhaDigitada == "") {
        Swal.fire('Aviso', 'Digite e-mail e senha!', 'warning');
        return;
    }

    try {
        const resposta = await fetch(`${SUPABASE_URL}/rest/v1/analistas?email=eq.${emailDigitado}&senha=eq.${senhaDigitada}`, {
            method: 'GET',
            headers: HEADERS
        });

        const listaDeUsuarios = await resposta.json();

        if (listaDeUsuarios.length > 0) {
            usuarioLogado = listaDeUsuarios[0];

            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');
            document.getElementById('user-greeting').innerText = `Analista: ${usuarioLogado.nome}`;

            carregarChamados();
        } else {
            Swal.fire('Acesso Negado', 'E-mail ou senha errados.', 'error');
        }
    } catch (erro) {
        Swal.fire('Erro', 'Caiu a conexão com o banco.', 'error');
    }
}

function fazerLogout() {
    usuarioLogado = null; 

    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');

    document.getElementById('login-email').value = '';
    document.getElementById('login-senha').value = '';
}


// ==========================================
// 2. FUNÇÕES DO CRUD DOS CHAMADOS
// ==========================================

async function criarChamado() {
    const titulo = document.getElementById('chamado-titulo').value;
    const urgencia = document.getElementById('chamado-urgencia').value;
    const descricao = document.getElementById('chamado-descricao').value;

    if (titulo == "" || descricao == "") {
        Swal.fire('Aviso', 'Escreve o título e a descrição do problema!', 'warning');
        return;
    }

    const dadosDoChamado = {
        titulo: titulo,
        descricao: descricao,
        urgencia: urgencia,
        status: 'Aberto',
        analista_id: usuarioLogado.id 
    };

    try {
        const resposta = await fetch(`${SUPABASE_URL}/rest/v1/chamados`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(dadosDoChamado)
        });

        if (resposta.ok) {
            Swal.fire('Pronto!', 'Chamado salvo no banco de dados.', 'success');

            document.getElementById('chamado-titulo').value = '';
            document.getElementById('chamado-descricao').value = '';

            carregarChamados();
        }
    } catch (erro) {
        Swal.fire('Erro', 'Deu ruim na hora de salvar.', 'error');
    }
}

async function carregarChamados() {
    try {
        const resposta = await fetch(`${SUPABASE_URL}/rest/v1/chamados?order=id.desc`, {
            method: 'GET',
            headers: HEADERS
        });

        const listaDeChamados = await resposta.json();
        chamadosGlobais = listaDeChamados; 

        const corpoTabela = document.getElementById('tabela-chamados');
        corpoTabela.innerHTML = '';

        listaDeChamados.forEach(function (chamado) {
            const linha = document.createElement('tr');
            linha.className = 'border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors'; 

            // Cores do Status
            let corStatus = 'text-blue-600 dark:text-blue-400';
            if (chamado.status === 'Fechado') corStatus = 'text-green-600 dark:text-green-400';
            if (chamado.status === 'Em Andamento') corStatus = 'text-amber-500 dark:text-amber-400';

            // Cores da Urgência (Adicionadas as classes dark)
            let corUrgencia = 'text-yellow-600 dark:text-yellow-400'; // Default: Média
            if (chamado.urgencia === 'Alta') corUrgencia = 'text-red-600 dark:text-red-400';
            if (chamado.urgencia === 'Baixa') corUrgencia = 'text-green-600 dark:text-green-400';

            linha.innerHTML = `
                <td class="p-3 text-slate-500 dark:text-slate-400">#${chamado.id}</td>
                <td class="p-3 font-semibold text-slate-700 dark:text-gray-200">${chamado.titulo}</td>
                <td class="p-3 text-sm font-bold ${corUrgencia}">${chamado.urgencia}</td>
                <td class="p-3 font-medium ${corStatus}">${chamado.status}</td>
                <td class="p-3 flex gap-3">
                    <button onclick="verDetalhes(${chamado.id})" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold transition">👁️ Detalhes</button>
                    <button onclick="atualizarStatus(${chamado.id})" class="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition">⚙️ Status</button>
                    <button onclick="deletarChamado(${chamado.id})" class="text-red-500 hover:text-red-700 dark:hover:text-red-400 font-semibold transition">🗑️ Deletar</button>
                </td>
            `;

            corpoTabela.appendChild(linha);
        });
    } catch (erro) {
        console.error('Erro no carregarChamados:', erro);
    }
}

function verDetalhes(idDoChamado) {
    const chamado = chamadosGlobais.find(c => c.id === idDoChamado);
    
    if(chamado) {
        Swal.fire({
            title: `Chamado #${chamado.id}`,
            html: `
                <div class="text-left mt-2">
                    <p><strong>Problema:</strong> ${chamado.titulo}</p>
                    <p class="mt-3"><strong>Descrição detalhada:</strong></p>
                    <p class="mt-1 p-3 bg-gray-100 rounded border border-gray-200 text-gray-700">${chamado.descricao}</p>
                </div>
            `,
            icon: 'info',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Fechar'
        });
    }
}

async function atualizarStatus(idDoChamado) {
    const chamado = chamadosGlobais.find(c => c.id === idDoChamado);
    const statusAtual = chamado ? chamado.status : 'Aberto';

    const { value: novoStatus } = await Swal.fire({
        title: 'Alterar Status do Chamado',
        input: 'select',
        inputOptions: {
            'Aberto': 'Aberto',
            'Em Andamento': 'Em Andamento',
            'Fechado': 'Fechado'
        },
        inputValue: statusAtual,
        inputPlaceholder: 'Selecione o novo status',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Salvar',
        cancelButtonText: 'Cancelar'
    });

    if (novoStatus) {
        try {
            const resposta = await fetch(`${SUPABASE_URL}/rest/v1/chamados?id=eq.${idDoChamado}`, {
                method: 'PATCH',
                headers: HEADERS,
                body: JSON.stringify({ status: novoStatus })
            });

            if (resposta.ok) {
                Swal.fire('Atualizado!', `O chamado agora está como: ${novoStatus}`, 'success');
                carregarChamados();
            }
        } catch (erro) {
            Swal.fire('Erro', 'Não consegui atualizar o status.', 'error');
        }
    }
}

async function deletarChamado(idDoChamado) {
    const confirmacao = await Swal.fire({
        title: 'Certeza?',
        text: "Isso vai apagar direto do banco de dados!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, pode apagar',
        cancelButtonText: 'Cancelar'
    });

    if (confirmacao.isConfirmed) {
        try {
            const resposta = await fetch(`${SUPABASE_URL}/rest/v1/chamados?id=eq.${idDoChamado}`, {
                method: 'DELETE',
                headers: HEADERS
            });

            if (resposta.ok) {
                Swal.fire('Deletado!', 'Sumiu do banco.', 'success');
                carregarChamados(); 
            }
        } catch (erro) {
            Swal.fire('Erro', 'Problema ao deletar.', 'error');
        }
    }
}