const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const session = require('express-session');
const helmet = require('helmet');
const csurf = require('csurf');
const { v4: uuidv4 } = require('uuid');

const app = express();
const dataPath = path.join(__dirname, 'app', 'dados.json');
const logsPath = path.join(__dirname, 'app', 'logs.json');
const publicPath = path.join(__dirname);

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com', "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      scriptSrcElem: ["'self'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', "'unsafe-inline'"],
      styleSrcElem: ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', "'unsafe-inline'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"]
    }
  }
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'sistema-escola-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 3
  }
}));
app.use(express.static(publicPath));

// CSRF protection for state-changing requests
const csrfProtection = csurf({ cookie: false });
app.use((req, res, next) => {
  if (req.method === 'GET' || req.path.startsWith('/api/')) {
    return next();
  }
  return csrfProtection(req, res, next);
});

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(content);
  } catch (err) {
    console.error('Falha ao ler JSON em', filePath, err);
    return null;
  }
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function assertArray(value) {
  return Array.isArray(value) ? value : [];
}

function loadData() {
  const data = readJson(dataPath) || {};
  data.usuarios = assertArray(data.usuarios);
  data.alunos = assertArray(data.alunos);
  data.cursos = assertArray(data.cursos);
  data.disciplinas = assertArray(data.disciplinas);
  data.matriculas = assertArray(data.matriculas);
  data.notas = assertArray(data.notas);
  data.historicoEscolar = assertArray(data.historicoEscolar);
  data.logs = assertArray(data.logs);

  data.usuarios.forEach((usuario) => {
    if (!usuario.senhaHash && usuario.senha) {
      usuario.senhaHash = hashPassword(usuario.senha);
    }
  });

  return data;
}

function saveData(data) {
  saveJson(dataPath, data);
}

function loadLogs() {
  const logs = readJson(logsPath);
  if (!Array.isArray(logs)) {
    return [];
  }
  return logs;
}

function saveLogs(logs) {
  saveJson(logsPath, logs);
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function secureCompare(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

function sanitize(value) {
  if (typeof value !== 'string') {
    return value;
  }
  return value.replace(/[<>"']/g, '');
}

function validateCPF(cpf) {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^([0-9])\1+$/.test(digits)) {
    return false;
  }
  const calc = (count) => {
    let sum = 0;
    for (let i = 0; i < count; i += 1) {
      sum += Number(digits[i]) * (count + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
}

function validateEmail(email) {
  return typeof email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function validatePhone(phone) {
  return typeof phone === 'string' && /^(\(\d{2}\)\s?\d{4,5}-\d{4})$/.test(phone);
}

function calculateAge(dateString) {
  const birthday = new Date(dateString);
  if (Number.isNaN(birthday.getTime())) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age -= 1;
  }
  return age;
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Acesso não autorizado.' });
  }
  next();
}

function requireProfile(...allowed) {
  return (req, res, next) => {
    const perfil = req.session.user?.perfil;
    if (!perfil || !allowed.includes(perfil)) {
      return res.status(403).json({ error: 'Perfil não autorizado para esta ação.' });
    }
    next();
  };
}

function writeLog(entry) {
  const logs = loadLogs();
  logs.unshift({
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...entry
  });
  saveLogs(logs.slice(0, 200));
}

function normalizeEntity(entity) {
  const normalized = {};
  Object.keys(entity).forEach((key) => {
    normalized[key] = sanitize(entity[key]);
  });
  return normalized;
}

function generateAutoId(prefix, items) {
  const sequence = items.length + 1;
  return `${prefix}${String(sequence).padStart(3, '0')}`;
}

function generateMatriculaNumber(data) {
  const ano = new Date().getFullYear();
  const next = data.matriculas.length + 1;
  return `${ano}${String(next).padStart(4, '0')}`;
}

function getHistoryRecord(alunoId, cursoId, disciplinaId, valor, ano, turma) {
  return {
    id: uuidv4(),
    aluno: alunoId,
    curso: cursoId,
    disciplina: disciplinaId,
    nota: Number(valor),
    ano: ano || new Date().getFullYear(),
    turma: turma || ''
  };
}

app.get('/api/csrf', (req, res) => {
  const token = req.csrfToken ? req.csrfToken() : null;
  res.json({ csrfToken: token });
});

app.get('/api/profile', requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

app.post('/api/login', (req, res) => {
  const { login, senha, perfil } = req.body;
  const data = loadData();
  const user = data.usuarios.find((item) => item.login === String(login).trim());
  if (!user) {
    return res.status(400).json({ error: 'Usuário ou senha inválidos.' });
  }
  const storedHash = user.senhaHash || (user.senha ? hashPassword(user.senha) : '');
  const validPassword = secureCompare(storedHash, hashPassword(senha));
  if (!validPassword) {
    return res.status(400).json({ error: 'Usuário ou senha inválidos.' });
  }
  if (perfil && String(perfil).trim().toUpperCase() !== String(user.perfil).trim().toUpperCase()) {
    return res.status(403).json({ error: 'Perfil selecionado não corresponde ao usuário.' });
  }
  req.session.user = {
    id: user.id,
    nome: user.nome,
    perfil: user.perfil
  };
  writeLog({ user: user.login, action: 'login', details: `Login bem-sucedido como ${user.perfil}` });
  res.json({ user: req.session.user });
});

app.post('/api/logout', requireAuth, (req, res) => {
  writeLog({ user: req.session.user?.id || 'anônimo', action: 'logout', details: 'Sessão encerrada' });
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/usuarios', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO', 'PROFESSOR'), (req, res) => {
  const data = loadData();
  res.json(data.usuarios.map(({ senhaHash, senha, ...rest }) => rest));
});

app.post('/api/usuario', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO'), (req, res) => {
  const data = loadData();
  const usuario = normalizeEntity(req.body);
  if (!usuario.nome || !usuario.login || !usuario.senha || !usuario.perfil) {
    return res.status(400).json({ error: 'Nome, login, senha e perfil são obrigatórios.' });
  }
  if (!['DIRETOR', 'FUNCIONARIO', 'PROFESSOR', 'ALUNO'].includes(usuario.perfil.toUpperCase())) {
    return res.status(400).json({ error: 'Perfil inválido.' });
  }
  if (data.usuarios.some((item) => item.login === usuario.login)) {
    return res.status(400).json({ error: 'Já existe usuário com esse login.' });
  }
  const novo = {
    id: generateAutoId('USR', data.usuarios),
    nome: usuario.nome,
    login: usuario.login,
    senha: usuario.senha,
    senhaHash: hashPassword(usuario.senha),
    perfil: usuario.perfil.toUpperCase()
  };
  data.usuarios.push(novo);
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'cadastro_usuario', details: `Usuário ${novo.login} criado` });
  res.json({ success: true, usuario: { id: novo.id, nome: novo.nome, login: novo.login, perfil: novo.perfil } });
});

app.put('/api/usuario/:id', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO'), (req, res) => {
  const data = loadData();
  const usuario = data.usuarios.find((item) => item.id === String(req.params.id));
  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }
  const payload = normalizeEntity(req.body);
  usuario.nome = payload.nome || usuario.nome;
  if (payload.senha) {
    usuario.senha = payload.senha;
    usuario.senhaHash = hashPassword(payload.senha);
  }
  if (payload.perfil) {
    usuario.perfil = payload.perfil.toUpperCase();
  }
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'editar_usuario', details: `Usuário ${usuario.login} atualizado` });
  res.json({ success: true });
});

app.delete('/api/usuario/:id', requireAuth, requireProfile('DIRETOR'), (req, res) => {
  const data = loadData();
  const index = data.usuarios.findIndex((item) => item.id === String(req.params.id));
  if (index < 0) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }
  const deleted = data.usuarios.splice(index, 1)[0];
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'excluir_usuario', details: `Usuário ${deleted.login} removido` });
  res.json({ success: true });
});

app.get('/api/alunos', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO', 'PROFESSOR', 'ALUNO'), (req, res) => {
  const data = loadData();
  res.json(data.alunos);
});

app.post('/api/aluno', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO'), (req, res) => {
  const data = loadData();
  const aluno = normalizeEntity(req.body);
  if (!aluno.nome || !aluno.login || !aluno.senha || !aluno.cpf || !aluno.dataNascimento || !aluno.endereco || !aluno.celular || !aluno.email) {
    return res.status(400).json({ error: 'Todos os campos do aluno são obrigatórios.' });
  }
  if (data.usuarios.some((item) => item.login === aluno.login)) {
    return res.status(400).json({ error: 'Já existe usuário com este login.' });
  }
  if (!validateCPF(aluno.cpf)) {
    return res.status(400).json({ error: 'CPF inválido.' });
  }
  if (!validatePhone(aluno.celular)) {
    return res.status(400).json({ error: 'Celular deve ter o formato (99) 99999-9999 ou (99) 9999-9999.' });
  }
  if (!validateEmail(aluno.email)) {
    return res.status(400).json({ error: 'E-mail inválido.' });
  }
  const idade = calculateAge(aluno.dataNascimento);
  if (idade === null || idade < 4 || idade > 120) {
    return res.status(400).json({ error: 'Idade do aluno inválida.' });
  }
  aluno.idade = idade;
  aluno.id = generateAutoId('ALU', data.alunos);
  const novoUsuario = {
    id: generateAutoId('USR', data.usuarios),
    nome: aluno.nome,
    login: aluno.login,
    senhaHash: hashPassword(aluno.senha),
    perfil: 'ALUNO'
  };
  delete aluno.senha;
  data.usuarios.push(novoUsuario);
  data.alunos.push(aluno);
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'cadastro_aluno', details: `Aluno ${aluno.nome} cadastrado com login ${aluno.login}` });
  res.json({ success: true, aluno });
});

app.put('/api/aluno/:id', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO'), (req, res) => {
  const data = loadData();
  const aluno = data.alunos.find((item) => item.id === String(req.params.id));
  if (!aluno) {
    return res.status(404).json({ error: 'Aluno não encontrado.' });
  }
  const payload = normalizeEntity(req.body);
  if (payload.cpf && !validateCPF(payload.cpf)) {
    return res.status(400).json({ error: 'CPF inválido.' });
  }
  if (payload.celular && !validatePhone(payload.celular)) {
    return res.status(400).json({ error: 'Celular inválido.' });
  }
  if (payload.email && !validateEmail(payload.email)) {
    return res.status(400).json({ error: 'E-mail inválido.' });
  }
  if (payload.dataNascimento) {
    const idade = calculateAge(payload.dataNascimento);
    if (idade === null || idade < 4 || idade > 120) {
      return res.status(400).json({ error: 'Idade do aluno inválida.' });
    }
    aluno.idade = idade;
    aluno.dataNascimento = payload.dataNascimento;
  }
  aluno.nome = payload.nome || aluno.nome;
  aluno.cpf = payload.cpf || aluno.cpf;
  aluno.endereco = payload.endereco || aluno.endereco;
  aluno.celular = payload.celular || aluno.celular;
  aluno.email = payload.email || aluno.email;
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'editar_aluno', details: `Aluno ${aluno.nome} atualizado` });
  res.json({ success: true, aluno });
});

app.delete('/api/aluno/:id', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO'), (req, res) => {
  const data = loadData();
  const index = data.alunos.findIndex((item) => item.id === String(req.params.id));
  if (index < 0) {
    return res.status(404).json({ error: 'Aluno não encontrado.' });
  }
  const deleted = data.alunos.splice(index, 1)[0];
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'excluir_aluno', details: `Aluno ${deleted.nome} removido` });
  res.json({ success: true });
});

app.get('/api/cursos', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO', 'PROFESSOR', 'ALUNO'), (req, res) => {
  const data = loadData();
  res.json(data.cursos);
});

app.post('/api/curso', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO', 'PROFESSOR'), (req, res) => {
  const data = loadData();
  const curso = normalizeEntity(req.body);
  if (!curso.nome || !curso.semestres) {
    return res.status(400).json({ error: 'Nome e semestres são obrigatórios.' });
  }
  if (Number(curso.semestres) <= 0) {
    return res.status(400).json({ error: 'Semestres deve ser maior que zero.' });
  }
  curso.id = generateAutoId('CUR', data.cursos);
  curso.semestres = Number(curso.semestres);
  data.cursos.push(curso);
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'cadastro_curso', details: `Curso ${curso.nome} cadastrado` });
  res.json({ success: true, curso });
});

app.put('/api/curso/:id', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO', 'PROFESSOR'), (req, res) => {
  const data = loadData();
  const curso = data.cursos.find((item) => item.id === String(req.params.id));
  if (!curso) {
    return res.status(404).json({ error: 'Curso não encontrado.' });
  }
  const payload = normalizeEntity(req.body);
  curso.nome = payload.nome || curso.nome;
  curso.semestres = payload.semestres ? Number(payload.semestres) : curso.semestres;
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'editar_curso', details: `Curso ${curso.nome} atualizado` });
  res.json({ success: true, curso });
});

app.delete('/api/curso/:id', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO', 'PROFESSOR'), (req, res) => {
  const data = loadData();
  const index = data.cursos.findIndex((item) => item.id === String(req.params.id));
  if (index < 0) {
    return res.status(404).json({ error: 'Curso não encontrado.' });
  }
  const deleted = data.cursos.splice(index, 1)[0];
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'excluir_curso', details: `Curso ${deleted.nome} removido` });
  res.json({ success: true });
});

app.get('/api/disciplinas', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO', 'PROFESSOR', 'ALUNO'), (req, res) => {
  const data = loadData();
  res.json(data.disciplinas);
});

app.post('/api/disciplina', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO', 'PROFESSOR'), (req, res) => {
  const data = loadData();
  const disciplina = normalizeEntity(req.body);
  if (!disciplina.nome || !disciplina.cargaHoraria) {
    return res.status(400).json({ error: 'Nome e carga horária são obrigatórios.' });
  }
  if (Number(disciplina.cargaHoraria) <= 0) {
    return res.status(400).json({ error: 'Carga horária deve ser maior que zero.' });
  }
  disciplina.id = generateAutoId('DISC', data.disciplinas);
  disciplina.cargaHoraria = Number(disciplina.cargaHoraria);
  data.disciplinas.push(disciplina);
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'cadastro_disciplina', details: `Disciplina ${disciplina.nome} cadastrada` });
  res.json({ success: true, disciplina });
});

app.put('/api/disciplina/:id', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO', 'PROFESSOR'), (req, res) => {
  const data = loadData();
  const disciplina = data.disciplinas.find((item) => item.id === String(req.params.id));
  if (!disciplina) {
    return res.status(404).json({ error: 'Disciplina não encontrada.' });
  }
  const payload = normalizeEntity(req.body);
  disciplina.nome = payload.nome || disciplina.nome;
  disciplina.cargaHoraria = payload.cargaHoraria ? Number(payload.cargaHoraria) : disciplina.cargaHoraria;
  disciplina.professor = payload.professor || disciplina.professor;
  disciplina.turma = payload.turma || disciplina.turma;
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'editar_disciplina', details: `Disciplina ${disciplina.nome} atualizada` });
  res.json({ success: true, disciplina });
});

app.delete('/api/disciplina/:id', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO', 'PROFESSOR'), (req, res) => {
  const data = loadData();
  const index = data.disciplinas.findIndex((item) => item.id === String(req.params.id));
  if (index < 0) {
    return res.status(404).json({ error: 'Disciplina não encontrada.' });
  }
  const deleted = data.disciplinas.splice(index, 1)[0];
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'excluir_disciplina', details: `Disciplina ${deleted.nome} removida` });
  res.json({ success: true });
});

app.get('/api/matriculas', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO', 'PROFESSOR', 'ALUNO'), (req, res) => {
  const data = loadData();
  res.json(data.matriculas);
});

app.post('/api/matricula', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO'), (req, res) => {
  const data = loadData();
  const payload = normalizeEntity(req.body);
  if (!payload.alunoId || !payload.cursoId) {
    return res.status(400).json({ error: 'Aluno e curso são obrigatórios para matrícula.' });
  }
  const aluno = data.alunos.find((item) => item.id === payload.alunoId);
  const curso = data.cursos.find((item) => item.id === payload.cursoId);
  if (!aluno || !curso) {
    return res.status(400).json({ error: 'Aluno ou curso não encontrados.' });
  }
  if (aluno.inadimplente) {
    return res.status(403).json({ error: 'Aluno inadimplente não pode ser matriculado.' });
  }
  const matricula = {
    id: generateAutoId('MAT', data.matriculas),
    numero: generateMatriculaNumber(data),
    ano: new Date().getFullYear(),
    alunoId: aluno.id,
    cursoId: curso.id,
    dataMatricula: payload.dataMatricula || new Date().toISOString().slice(0, 10)
  };
  data.matriculas.push(matricula);
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'cadastro_matricula', details: `Matrícula ${matricula.numero} registrada para ${aluno.nome}` });
  res.json({ success: true, matricula });
});

app.put('/api/matricula/:id', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO'), (req, res) => {
  const data = loadData();
  const matricula = data.matriculas.find((item) => item.id === String(req.params.id));
  if (!matricula) {
    return res.status(404).json({ error: 'Matrícula não encontrada.' });
  }
  const payload = normalizeEntity(req.body);
  if (payload.alunoId) {
    const aluno = data.alunos.find((item) => item.id === payload.alunoId);
    if (!aluno) return res.status(400).json({ error: 'Aluno não encontrado.' });
    matricula.alunoId = aluno.id;
  }
  if (payload.cursoId) {
    const curso = data.cursos.find((item) => item.id === payload.cursoId);
    if (!curso) return res.status(400).json({ error: 'Curso não encontrado.' });
    matricula.cursoId = curso.id;
  }
  matricula.dataMatricula = payload.dataMatricula || matricula.dataMatricula;
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'editar_matricula', details: `Matrícula ${matricula.numero} atualizada` });
  res.json({ success: true, matricula });
});

app.delete('/api/matricula/:id', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO'), (req, res) => {
  const data = loadData();
  const index = data.matriculas.findIndex((item) => item.id === String(req.params.id));
  if (index < 0) {
    return res.status(404).json({ error: 'Matrícula não encontrada.' });
  }
  const deleted = data.matriculas.splice(index, 1)[0];
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'excluir_matricula', details: `Matrícula ${deleted.numero} cancelada` });
  res.json({ success: true });
});

app.get('/api/notas', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO', 'PROFESSOR', 'ALUNO'), (req, res) => {
  const data = loadData();
  res.json(data.notas);
});

app.post('/api/nota', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO', 'PROFESSOR'), (req, res) => {
  const data = loadData();
  const nota = normalizeEntity(req.body);
  if (!nota.alunoId || !nota.cursoId || !nota.disciplinaId || nota.valor == null) {
    return res.status(400).json({ error: 'Aluno, curso, disciplina e nota são obrigatórios.' });
  }
  const valor = Number(nota.valor);
  if (Number.isNaN(valor) || valor < 0 || valor > 10) {
    return res.status(400).json({ error: 'Valor da nota deve ser entre 0 e 10.' });
  }
  const aluno = data.alunos.find((item) => item.id === nota.alunoId);
  const curso = data.cursos.find((item) => item.id === nota.cursoId);
  const disciplina = data.disciplinas.find((item) => item.id === nota.disciplinaId);
  if (!aluno || !curso || !disciplina) {
    return res.status(400).json({ error: 'Aluno, curso ou disciplina não encontrados.' });
  }
  const novo = {
    id: generateAutoId('NOT', data.notas),
    alunoId: aluno.id,
    cursoId: curso.id,
    disciplinaId: disciplina.id,
    valor
  };
  data.notas.push(novo);
  data.historicoEscolar.push(getHistoryRecord(aluno.id, curso.id, disciplina.id, valor, new Date().getFullYear(), disciplina.turma || ''));
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'cadastro_nota', details: `Nota ${valor} lançada para ${aluno.nome}` });
  res.json({ success: true, nota: novo });
});

app.put('/api/nota/:id', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO', 'PROFESSOR'), (req, res) => {
  const data = loadData();
  const nota = data.notas.find((item) => item.id === String(req.params.id));
  if (!nota) {
    return res.status(404).json({ error: 'Nota não encontrada.' });
  }
  const payload = normalizeEntity(req.body);
  if (payload.alunoId) {
    const aluno = data.alunos.find((item) => item.id === payload.alunoId);
    if (!aluno) return res.status(400).json({ error: 'Aluno não encontrado.' });
    nota.alunoId = aluno.id;
  }
  if (payload.cursoId) {
    const curso = data.cursos.find((item) => item.id === payload.cursoId);
    if (!curso) return res.status(400).json({ error: 'Curso não encontrado.' });
    nota.cursoId = curso.id;
  }
  if (payload.disciplinaId) {
    const disciplina = data.disciplinas.find((item) => item.id === payload.disciplinaId);
    if (!disciplina) return res.status(400).json({ error: 'Disciplina não encontrada.' });
    nota.disciplinaId = disciplina.id;
  }
  if (payload.valor != null) {
    const valor = Number(payload.valor);
    if (Number.isNaN(valor) || valor < 0 || valor > 10) {
      return res.status(400).json({ error: 'Valor da nota deve ser entre 0 e 10.' });
    }
    nota.valor = valor;
  }
  saveData(data);
  writeLog({ user: req.session.user.id, action: 'editar_nota', details: `Nota ${nota.id} atualizada` });
  res.json({ success: true, nota });
});

app.get('/api/historico', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO', 'PROFESSOR', 'ALUNO'), (req, res) => {
  const data = loadData();
  const historico = data.historicoEscolar.map((item) => ({
    ...item,
    alunoNome: data.alunos.find((a) => a.id === item.aluno)?.nome || 'Desconhecido',
    cursoNome: data.cursos.find((c) => c.id === item.curso)?.nome || 'Desconhecido',
    disciplinaNome: data.disciplinas.find((d) => d.id === item.disciplina)?.nome || 'Desconhecido'
  }));
  if (req.session.user.perfil === 'ALUNO') {
    const aluno = data.alunos.find((a) => a.nome.toLowerCase() === req.session.user.nome.toLowerCase());
    if (aluno) {
      return res.json(historico.filter((item) => item.aluno === aluno.id));
    }
  }
  res.json(historico);
});

app.get('/api/relatorios', requireAuth, requireProfile('DIRETOR', 'FUNCIONARIO', 'PROFESSOR'), (req, res) => {
  const data = loadData();
  const relatorio = {
    totalAlunos: data.alunos.length,
    totalCursos: data.cursos.length,
    totalDisciplinas: data.disciplinas.length,
    totalMatriculas: data.matriculas.length,
    totalNotas: data.notas.length,
    ultimaAtualizacao: new Date().toISOString()
  };
  res.json(relatorio);
});

app.get('/api/backup', requireAuth, requireProfile('DIRETOR'), (req, res) => {
  const data = loadData();
  const backupFile = path.join(__dirname, 'app', `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf8');
  writeLog({ user: req.session.user.id, action: 'backup', details: `Backup gerado em ${backupFile}` });
  res.json({ success: true, file: backupFile });
});

app.get('/api/logs', requireAuth, requireProfile('DIRETOR'), (req, res) => {
  const logs = loadLogs();
  res.json(logs);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado em http://localhost:${PORT}`);
});
