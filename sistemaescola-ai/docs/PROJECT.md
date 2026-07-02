# Sistema para cadastrar alunos, cursos e matrículas

## Objetivos
- Criar um sistema que permita realizar, consultar, atualizar e gerenciar matrículas de alunos de forma rápida, segura e organizada.
 
## Usuários
- Alunos;
- Professores;
- Funcionários da secretaria;
- Diretor;

## Arquitetura

# MVC
- Controller: 
    ### AlunoController.java
    ### MatriculaController.java
    ### TurmaController.java
    ### ProfessorController.java
    ### NotaController.java
    ### UsuarioController.java
    ### CursoController.java
    ### BackupController.java
    ### HistoricoEscolarController.java
    ### LoginController.java

- Service: 
    ### AlunoService.java
    ### MatriculaService.java
    ### TurmaService.java
    ### ProfessorService.java
    ### NotaService.java
    ### UsuarioService.java
    ### CursoService.java
    ### BackupService.java
    ### HistoricoEscolarService.java
    ### LoginService.java

- Repository:
    ### AlunoRepository.java
    ### MatriculaRepository.java
    ### TurmaRepository.java
    ### ProfessorRepository.java
    ### NotaRepository.java
    ### UsuarioRepository.java
    ### CursoRepository.java
    ### BackupRepository.java
    ### HistoricoEscolarRepository.java
    ### LoginRepository.java

- Model/Entity:
    ### Aluno.java
    ### Matricula.java
    ### Turma.java
    ### Professor.java
    ### Nota.java
    ### Usuario.java
    ### Curso.java
    ### Backup.java
    ### HistoricoEscolar.java
    ### Login.java

- DTO:
    ## Request 
        ### AlunoRequest.java
        ### MatriculaRequest.java
        ### TumaRequest.java
        ### ProfessorRequest.java
        ### NotaRequest.java
        ### UsuarioRequest.java
        ### CursoRequest.java
        ### BackupRequest.java
        ### HistoricoEscolarRequest.java
        ### LoginRequest.java
    ## Response
        ### AlunoResponse.java
        ### MatriculaResponse.java
        ## TurmaResponse.java
        ### ProfessorResponse.java
        ### NotaResponse.java
        ### UsuarioResponse.java
        ### CursoResponse.java
        ### BackupResponse.java
        ### HistoricoEscolarResponse.java
        ### LoginResponse.java


## Entidades principais
- alunos: id, nome, cpf, idade, endereco, login e senha
- matriculas: id, numero, ano
- cursos: id, nome, semestres
- turmas: id, nome, coordenador
- notas: id, valor 
- professores: id, nome
- usuarios: id, nome, login, senha, perfil
- disciplinas: id, nome, cargaHoraria
- historicoEscolar: id, aluno, nota, disciplina, curso, ano, turma.

## Regras de negócio
- O aluno ele não pode se matricular em uma matéria se ele não tiver feito a anterior. 

- Se o aluno estiver inadimplente com a mensalidade, o sistema tem que bloquear a matrícula dele automático.

- Aluno aprovado com notas acima de 7, caso contrário reprovado.

## Banco de dados
- MySQL

## Endpoints principais
- GET /alunos – Listar alunos
- POST /aluno – Cadastrar aluno
- PUT /aluno/{id} – Atualizar aluno
- DELETE /aluno/{id} – Excluir aluno

- GET /matriculas – Listar matrículas
- POST /matricula – Realizar matrícula
- PUT /matricula/{id} – Atualizar matrícula
- DELETE /matricula/{id} – Cancelar matrícula

- GET /cursos – Listar cursos
- POST /curso – Cadastrar curso
- PUT /curso/{id} – Atualizar curso
- DELETE /curso/{id} – Cancelar curso

- GET /turmas – Listar turmas
- POST /turma – Cadastrar turma
- PUT /turma/{id} – Atualizar turma
- DELETE /turma/{id} – Cancelar turma

- GET /usuarios – Listar usuários
- POST /usuario – Cadastrar usuário
- PUT /usuario/{id} – Atualizar usuario
- DELETE /usuario/{id} – Cancelar usuario

- POST /login – Realizar login
- POST /logout – Encerrar sessão

- GET /disciplinas – Listar disciplinas
- POST /disciplina – Cadastrar disciplina
- PUT /disciplina/{id} – Atualizar disciplina
- DELETE /disciplina/{id} – Cancelar disciplina

- GET /notas – Listar notas
- POST /nota – Cadastrar nota
- PUT /nota/{id} – Atualizar nota
- DELETE /nota/{id} – Cancelar nota

# FLuxos

- Cadastro de Aluno - Usuário: Secretaria
 ## Usuário envia/AlunoRequest dados do aluno

 ## AlunoController recebe a requisição

 ## AlunoService valida as regras de negócio

 ## AlunoRepository salva no Banco de Dados

 ## API retorna/AlunoResponse aluno cadastrado

- Cadastro de Notas – Usuários: Professor/Funcionário
# Usuário envia/NotaRequest as notas

# NotaController: recebe a requisição

# NotaService: valida as notas e as regras acadêmicas

# NotaRepository: salva as notas no Banco de Dados

# API: retorna/NotaResponse a confirmação do lançamento

- Cadastro de Curso – Usuários: Diretor/Funcionário
# Usuário envia/CursoRequest os dados do curso

# CursoController: recebe a requisição e encaminha para o serviço

# CursoService: valida os dados do curso

# CursoRepository: salva os dados no Banco de Dados

# API: retorna/CursoResponse a confirmação do cadastro

- Cadastro de matrícula – Usuário: Funcionário
# Usuário envia/MatriculaRequest os dados do aluno, curso e número da matrícula

# MatriculaController: recebe a requisição e encaminha para o serviço

# MatriculaService: valida os dados da matrícula

# MatriculaRepository: salva os dados no Banco de Dados

# API: retorna/MatrículaResponse a confirmação da matrícula

- Executar backup - Usuário: Diretor
# Usuário executa/BackupRequest de todos os dados

# BackupController: recebe a requisição e encaminha para o serviço

# BackupService: valida os dados de backup

# BackupRepository: salva os dados externamente

# API: retorna/BackupResponse a confirmação do backup.

- Gerar Histórico Escolar - Usuários: Alunos e Funcionários
# Usuário gera/HistoricoEscolarRequest do aluno com base na matrícula

# HistoricoEscolarController: recebe a requisição e encaminha para o serviço.

# HistoricoEscolarService: valida as notas caso aprovado

# HistoricoEscolarRepository: salva os dados no Banco de Dados

# API: retorna/HistoricoEscolarResponse o arquivo em PDF.

- Login - Usuários: Alunos, Funcionários e Diretor
# Usuário envia/LoginRequest usuário e senha

# LoginController: recebe a requisição e encaminha para o serviço

# LoginService: valida as autenticações

# LoginRepository: salva logs de acesso no Banco de Dados

# API: retorna/LoginResponse a confirmação de Login.

- Cadastro de Professor : Usuário Diretor
# Usuário envia/ProfessorRequest dados no novo professor

# ProfessorController recebe a requisição e encaminha para o serviço 

# ProfessorService valida as regras

# ProfessorRepository salva no Banco de Dados

# A API retorna/ProfessorResponse com a confirmação do cadastro.

- Abertura de Turma : Usuário: Funcionário da  Secretaria
# Usuário envia a TurmaRequest para nova turma

# TurmaController recebe a requisição e encaminha para o serviço 

# TurmaService valida o curso e as vagas

# TurmaRepository salva no Banco de Dados

# A API retorna/TurmaResponse a confirmação de nova turma.

- Cadastro de Usuário : Usuário: Diretor
# admin envia o UsuarioRequest com os dados de acesso

# UsuarioController recebe a requisição e encaminha para o serviço

# UsuarioService valida as permissões e telas de acessos

# UsuarioRepository salva no Banco de Dados

# A API retorna/UsuarioResponse confirmação de novo usuário.



# O Controller está fazendo apenas o papel dele? 
R: Sim. Os Controllers recebem as requisições dos usuários e encaminham para os Services, sem concentrar regras de negócio.

# O Service está concentrando as regras? 
Sim. Os Services realizam validações, aplicam regras de negócio e processam as informações antes de acessar os dados.

# O Repository está apenas acessando dados? 
Sim. Os Repositories são responsáveis apenas pelas operações de consulta, inserção, atualização e remoção de dados no banco.

# Existe alguma classe fazendo coisa demais? 
Não. A arquitetura foi organizada em camadas, onde cada classe possui uma responsabilidade específica:
Controller: recebe requisições.
Service: aplica regras de negócio.
Repository: acessa dados.
Model/Entity: representa os dados do sistema.
Request/Response: transporta informações entre cliente e API.
Dessa forma, o sistema segue o Princípio da Responsabilidade Única (SRP) do SOLID, evitando que uma única classe concentre múltiplas responsabilidades.
 