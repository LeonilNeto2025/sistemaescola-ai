# Sistema Escolar AI

Aplicação web completa para gestão escolar com base no PRD, SPECS, SKILLS e PROJECT.

## O que foi gerado
- Backend Node.js com Express (`server.js`)
- Frontend SPA leve em HTML/CSS/JavaScript (`public/index.html`, `public/css/style.css`, `public/js/app.js`)
- Persistência simplificada em JSON (`public/app/dados.json`)
- Login por perfil, dashboard personalizado e telas de cadastro
- Relatórios, backup, geração de histórico em PDF e logs de acesso
- Validações de CPF, e-mail, telefone e idade
- Design system azul, verde e amarelo com botões de ação e redundância de sair/cancelar
- Segurança básica com session cookies, helmet e validações de entrada

## Instalação e execução
```bash
cd c:\dev\sistemaescola-ai
npm install
npm start
```
Abra o navegador em `http://localhost:3000`.

## Usuários de teste
- Diretor: `admin` / `123`
- Funcionário da Secretaria: `neto.secretaria` / `neto123`
- Professor: `carlos.silva` / `123`
- Aluno: `ana.aluna` / `aluno123`

## Estrutura do projeto
- `server.js` - servidor Express com API REST e autenticação de sessão
- `package.json` - dependências e scripts
- `public/` - frontend, CSS e scripts do cliente
- `public/app/dados.json` - dados armazenados em JSON

## Observações
- O sistema é uma aplicação de demonstração pronta para rodar localmente.
- Há backup gerado em arquivo JSON no diretório `app/`.
- O histórico escolar pode ser exportado em PDF no frontend.
   