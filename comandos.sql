-- Criando a Tabela 1: Analistas (Agora com a coluna SENHA)
CREATE TABLE analistas (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    cargo TEXT NOT NULL
);

-- Criando a Tabela 2: Chamados (Tem mais de 5 atributos e uma Foreign Key)
CREATE TABLE chamados (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT DEFAULT 'Aberto',
    urgencia TEXT DEFAULT 'Média',
    data_abertura DATE DEFAULT CURRENT_DATE,
    analista_id INTEGER REFERENCES analistas(id) ON DELETE SET NULL
);

-- Inserindo os Analistas de teste (com a senha 123456)
INSERT INTO analistas (nome, email, senha, cargo) VALUES
('Calison Nunes', 'calison@fatec.com', '123456', 'Analista de Infraestrutura'),
('Kesia Rocha', 'kesia@fatec.com', '123456', 'Suporte Técnico'),
('George Soares', 'george@fatec.com', '123456', 'Suporte Técnico');

-- Inserindo os Chamados de teste já vinculados aos analistas
INSERT INTO chamados (titulo, descricao, status, urgencia, analista_id) VALUES
('Acesso bloqueado', 'Usuário solicitou reset de senha no Sistema.', 'Fechado', 'Alta', 3),
('Erro de extração', 'Falha ao baixar o relatório automatizado no sistema.', 'Aberto', 'Média', 2),
('Erro em Servidor', 'Servidor constando alto uso de CPU.', 'Em Andamento', 'Alta', 1);