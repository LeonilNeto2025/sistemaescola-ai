# Sistema Escolar AI

Aplicação web completa para gestão escolar com interface dinâmica, autenticação por perfil e persistência de dados.

## 📋 Recursos
- Backend Node.js com Express e segurança com helmet
- Frontend responsivo em HTML/CSS/JavaScript
- Autenticação por perfil (Diretor, Secretário, Professor, Aluno)
- Dashboard personalizado por tipo de usuário
- Persistência de dados em JSON
- Sistema de backup automático
- Geração de relatórios e logs de acesso
- Validações de dados (CPF, e-mail, telefone, idade)

## 🚀 Como rodar com Docker (Recomendado)

```bash
docker-compose up --build
```

A aplicação estará disponível em `http://localhost:3000`.

## 🛠️ Como rodar localmente (sem Docker)

```bash
npm install
npm start
```

A aplicação estará disponível em `http://localhost:3000`.

## 👥 Usuários de teste

### Usuários padrão
- **Diretor**: `admin` / `123`
- **Secretário**: `neto.secretaria` / `neto123`
- **Professor**: `carlos.silva` / `123`
- **Aluno**: `ana.aluna` / `aluno123`

### Usuários de teste adicionais
- **Professor**: `professor.teste` / `prof123`
- **Aluno**: `aluno.teste` / `aluno123`
- **Secretaria**: `secretaria.teste` / `sec123`
- **Diretor**: `diretor.teste` / `diretor123`

## 📁 Estrutura do projeto

```
├── server.js                 # Servidor Express principal
├── index.html               # Página inicial do frontend
├── package.json             # Dependências e scripts do projeto
├── Dockerfile               # Configuração Docker
├── docker-compose.yml       # Orquestração de containers
├── app/                     # Dados e backups
│   ├── dados.json          # Banco de dados JSON
│   ├── logs.json           # Logs de acesso
│   └── backup-*.json       # Backups automáticos
├── css/                     # Estilos CSS
│   └── style.css           # Stylesheet principal
├── js/                      # Scripts do frontend
│   └── app.js              # Lógica da aplicação
├── docs/                    # Documentação
│   ├── PRD.md              # Especificações de produto
│   ├── PROJECT.md          # Descrição do projeto
│   ├── SPECS.md            # Especificações técnicas
│   └── SKILLS.md           # Habilidades do sistema
└── prompts/                 # Configurações de prompts
    └── system-instruction.txt
```

## 📝 Arquivos importantes

- **server.js** - Servidor Express com rotas de API e autenticação
- **app/dados.json** - Base de dados principal em JSON
- **css/style.css** - Design system azul, verde e amarelo
- **js/app.js** - Lógica da SPA (Single Page Application)

## 📚 Documentação

Acesse os arquivos em `docs/` para mais informações:
- `PRD.md` - Requisitos e especificações de produto
- `PROJECT.md` - Descrição geral do projeto
- `SPECS.md` - Especificações técnicas detalhadas
- `SKILLS.md` - Funcionalidades e habilidades do sistema

## ⚙️ Tecnologias

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Segurança**: Helmet, CSRF protection, session cookies
- **Dados**: JSON
- **DevOps**: Docker, Docker Compose
   