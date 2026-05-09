// ==========================================
// CONFIGURAÇÕES INICIAIS DO SUPABASE
// ==========================================

// Colei a URL e a KEY públicas que peguei nas configurações do projeto lá no Supabase
const SUPABASE_URL = 'https://fazysaycvldmxpquuokw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhenlzYXljdmxkbXhwcXV1b2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTI2MzksImV4cCI6MjA5MzkyODYzOX0.NaDzS6UvOzklC1d_qRe9W_FijW4pZOTf7ZKfpifbx-Y';

// Isso aqui é obrigatório na documentação do Supabase pra API REST funcionar
const HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

// Variável pra eu saber qual analista fez o login pra poder vincular o ID dele nos chamados
let usuarioLogado = null;


// ==========================================
// 1. FUNÇÕES DA TELA DE LOGIN E CADASTRO
// ==========================================

// Função simples pra esconder o formulário de login e mostrar o de cadastro (e vice-versa)
function alternarTelasAuth(telaParaMostrar) {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');

    // Mostra só a tela que a gente pediu
    document.getElementById(telaParaMostrar).classList.remove('hidden');
}

// CREATE (Criar Usuário)
// Tem que ser async porque a gente precisa esperar (await) o banco responder
async function cadastrarUsuario() {
    // Pegando os valores que o usuário digitou nas caixinhas
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-senha').value;

    // Validação básica pra não mandar pro banco vazio
    if (nome == "" || email == "" || senha == "") {
        Swal.fire('Opa!', 'Preencha todos os campos pra cadastrar.', 'warning');
        return; // Para a função aqui
    }

    try {
        // Disparando o POST pro Supabase
        const resposta = await fetch(`${SUPABASE_URL}/rest/v1/analistas`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({
                nome: nome,
                email: email,
                senha: senha,
                cargo: 'Suporte Técnico' // Coloquei cargo padrão pra facilitar
            })
        });

        if (resposta.ok) {
            Swal.fire('Boa!', 'Cadastro feito com sucesso. Faça login.', 'success');
            alternarTelasAuth('login-form'); // Volta pra tela de login
        } else {
            console.log("Deu erro ao salvar:", await resposta.json());
            Swal.fire('Erro', 'Não foi possível cadastrar (E-mail já existe?)', 'error');
        }
    } catch (erro) {
        alert("Erro de conexão com o Supabase");
    }
}

// READ (Verificar se o usuário existe para fazer o Login)
async function fazerLogin() {
    const emailDigitado = document.getElementById('login-email').value;
    const senhaDigitada = document.getElementById('login-senha').value;

    if (emailDigitado == "" || senhaDigitada == "") {
        Swal.fire('Aviso', 'Digite e-mail e senha!', 'warning');
        return;
    }

    try {
        // Busca na tabela verificando se o e-mail E a senha batem com o que tá no banco (eq = equals/igual)
        const resposta = await fetch(`${SUPABASE_URL}/rest/v1/analistas?email=eq.${emailDigitado}&senha=eq.${senhaDigitada}`, {
            method: 'GET',
            headers: HEADERS
        });

        // Transforma o retorno em JSON (vira uma lista/array)
        const listaDeUsuarios = await resposta.json();
        console.log("Retorno do login:", listaDeUsuarios);

        // Se a lista tiver pelo menos 1 item, é porque achou o usuário
        if (listaDeUsuarios.length > 0) {
            // Guarda as informações daquele usuário na nossa variável global
            usuarioLogado = listaDeUsuarios[0];

            // Esconde a área pública e mostra o painel restrito
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');

            // Coloca o nome dele na tela
            document.getElementById('user-greeting').innerText = `Analista: ${usuarioLogado.nome}`;

            // Puxa os chamados pra preencher a tabela
            carregarChamados();
        } else {
            Swal.fire('Acesso Negado', 'E-mail ou senha errados.', 'error');
        }
    } catch (erro) {
        Swal.fire('Erro', 'Caiu a conexão com o banco.', 'error');
    }
}

// Botão de Sair (Limpa os dados e volta pro login)
function fazerLogout() {
    usuarioLogado = null; // Zera o usuário

    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');

    // Limpa as caixinhas de input
    document.getElementById('login-email').value = '';
    document.getElementById('login-senha').value = '';
}


// ==========================================
// 2. FUNÇÕES DO CRUD DOS CHAMADOS
// ==========================================

// CREATE (Criar Chamado)
async function criarChamado() {
    const titulo = document.getElementById('chamado-titulo').value;
    const urgencia = document.getElementById('chamado-urgencia').value;
    const descricao = document.getElementById('chamado-descricao').value;

    if (titulo == "" || descricao == "") {
        Swal.fire('Aviso', 'Escreve o título e a descrição do problema!', 'warning');
        return;
    }

    // Montando o pacote de dados que vai pro Supabase
    const dadosDoChamado = {
        titulo: titulo,
        descricao: descricao,
        urgencia: urgencia,
        status: 'Aberto',
        analista_id: usuarioLogado.id // FK obrigatória: Linka o chamado com quem tá logado
    };

    try {
        const resposta = await fetch(`${SUPABASE_URL}/rest/v1/chamados`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(dadosDoChamado)
        });

        if (resposta.ok) {
            Swal.fire('Pronto!', 'Chamado salvo no banco de dados.', 'success');

            // Limpa as caixas de texto
            document.getElementById('chamado-titulo').value = '';
            document.getElementById('chamado-descricao').value = '';

            // Atualiza a tabela pra mostrar o chamado novo
            carregarChamados();
        }
    } catch (erro) {
        Swal.fire('Erro', 'Deu ruim na hora de salvar.', 'error');
    }
}

// READ (Listar os chamados na tabela)
async function carregarChamados() {
    try {
        // Puxa todos os chamados. O order=id.desc traz do mais novo pro mais velho
        const resposta = await fetch(`${SUPABASE_URL}/rest/v1/chamados?order=id.desc`, {
            method: 'GET',
            headers: HEADERS
        });

        const listaDeChamados = await resposta.json();
        console.log("Chamados carregados do banco:", listaDeChamados);

        // Pega a tabela no HTML e limpa ela antes de preencher de novo
        const corpoTabela = document.getElementById('tabela-chamados');
        corpoTabela.innerHTML = '';

        // Faz um loop (laço de repetição) em todos os chamados que vieram do banco
        listaDeChamados.forEach(function (chamado) {

            // Criando a linha da tabela (tr)
            const linha = document.createElement('tr');
            linha.className = 'border-b hover:bg-slate-50'; // Classes do Tailwind pra ficar bonito

            // Preenchendo a linha com os dados (td)
            linha.innerHTML = `
                <td class="p-3 text-slate-500">#${chamado.id}</td>
                <td class="p-3 font-semibold text-slate-700">${chamado.titulo}</td>
                <td class="p-3 text-sm font-bold">${chamado.urgencia}</td>
                <td class="p-3 font-medium text-blue-600">${chamado.status}</td>
                <td class="p-3">
                    <button onclick="atualizarStatus(${chamado.id})" class="text-blue-500 hover:text-blue-700 mr-3">Resolver</button>
                    <button onclick="deletarChamado(${chamado.id})" class="text-red-500 hover:text-red-700">Deletar</button>
                </td>
            `;

            // Joga a linha dentro da tabela
            corpoTabela.appendChild(linha);
        });
    } catch (erro) {
        console.error('Erro no carregarChamados:', erro);
    }
}

// UPDATE (Mudar o status do chamado pra Resolvido/Fechado)
async function atualizarStatus(idDoChamado) {
    try {
        // O PATCH serve pra atualizar só uma parte da tabela (no caso, o status)
        const resposta = await fetch(`${SUPABASE_URL}/rest/v1/chamados?id=eq.${idDoChamado}`, {
            method: 'PATCH',
            headers: HEADERS,
            body: JSON.stringify({ status: 'Fechado' })
        });

        if (resposta.ok) {
            Swal.fire('Sucesso', 'Você fechou este chamado.', 'success');
            carregarChamados(); // Atualiza a tela pra mostrar a mudança
        }
    } catch (erro) {
        Swal.fire('Erro', 'Não consegui atualizar.', 'error');
    }
}

// DELETE (Excluir o chamado do banco)
async function deletarChamado(idDoChamado) {
    // Usando o SweetAlert pra perguntar se o cara tem certeza
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

    // Se ele clicou em "Sim, pode apagar"
    if (confirmacao.isConfirmed) {
        try {
            const resposta = await fetch(`${SUPABASE_URL}/rest/v1/chamados?id=eq.${idDoChamado}`, {
                method: 'DELETE',
                headers: HEADERS
            });

            if (resposta.ok) {
                Swal.fire('Deletado!', 'Sumiu do banco.', 'success');
                carregarChamados(); // Atualiza a tela pra sumir a linha
            }
        } catch (erro) {
            Swal.fire('Erro', 'Problema ao deletar.', 'error');
        }
    }
}