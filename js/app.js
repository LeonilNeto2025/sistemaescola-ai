const mainContent = document.getElementById('mainContent');
const btnLogout = document.getElementById('btnLogout');
const toastContainer = document.getElementById('toastContainer');
let currentUser = null;
let editingAlunoId = null;
let editingCursoId = null;
let editingNotaId = null;
let editingDisciplinaId = null;

const LOCAL_API_URL = 'http://localhost:3000';
const PRODUCTION_API_URL = window.location.origin || 'https://sistemaescola-ai.netlify.app';
const API_URL = (() => {
  if (typeof window === 'undefined') return LOCAL_API_URL;
  if (window.API_URL) {
    return String(window.API_URL).replace(/\/+$/, '');
  }
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return LOCAL_API_URL;
  }
  return String(PRODUCTION_API_URL).replace(/\/+$/, '');
})();

const MOCK_DATA = {
  usuarios: [
    { id: 'USR001', nome: 'Admin Sistema', login: 'admin', senha: '123', perfil: 'DIRETOR' },
    { id: 'USR002', nome: 'Carlos Silva', login: 'carlos.silva', senha: '123', perfil: 'PROFESSOR' },
    { id: 'USR003', nome: 'Neto', login: 'neto.secretaria', senha: 'neto123', perfil: 'FUNCIONARIO' },
    { id: 'USR004', nome: 'Ana Aluna', login: 'ana.aluna', senha: 'aluno123', perfil: 'ALUNO' },
    { id: 'USR005', nome: 'Professor Teste', login: 'professor.teste', senha: 'prof123', perfil: 'PROFESSOR' },
    { id: 'USR006', nome: 'Aluno Teste', login: 'aluno.teste', senha: 'aluno123', perfil: 'ALUNO' },
    { id: 'USR007', nome: 'Funcionário de Secretaria', login: 'secretaria.teste', senha: 'sec123', perfil: 'FUNCIONARIO' },
    { id: 'USR008', nome: 'Diretor Teste', login: 'diretor.teste', senha: 'diretor123', perfil: 'DIRETOR' }
  ],
  cursos: [
    { id: 'CUR001', nome: 'Java', semestres: 4 },
    { id: 'CUR002', nome: 'Internet das Coisas', semestres: 2 },
    { id: 'CUR003', nome: 'Arquitetura de Sistemas', semestres: 3 }
  ],
  disciplinas: [
    { id: 'DISC001', nome: 'Fundamentos Técnicos', cargaHoraria: 100, professor: 'Carlos Silva', turma: 'TUR001' },
    { id: 'DISC002', nome: 'Estrutura de Dados', cargaHoraria: 60, professor: 'Carlos Silva', turma: 'TUR001' },
    { id: 'DISC003', nome: 'Internet das Coisas', cargaHoraria: 40, professor: 'Roberto Souza', turma: 'TUR002' }
  ],
  alunos: [
    { id: 'ALU001', nome: 'Ana Aluna', cpf: '52998224725', dataNascimento: '2005-08-10', idade: 20, endereco: 'Rua das Flores, 120', celular: '(15) 98888-7777', email: 'ana.aluna@gmail.com', login: 'ana.aluna' },
    { id: 'ALU002', nome: 'Rita Santos', cpf: '12345678909', dataNascimento: '2004-04-15', idade: 22, endereco: 'Avenida Brasil, 350', celular: '(15) 99999-9999', email: 'rita.santos@gmail.com', login: 'rita.santos' }
  ],
  matriculas: [
    { id: 'MAT001', numero: '20260001', ano: 2026, alunoId: 'ALU001', cursoId: 'CUR001', dataMatricula: '2026-06-01' }
  ],
  notas: [
    { id: 'NOT001', alunoId: 'ALU001', cursoId: 'CUR001', disciplinaId: 'DISC001', valor: 8.5 }
  ],
  historicoEscolar: [
    { id: 'HIS001', aluno: 'ALU001', curso: 'CUR001', disciplina: 'DISC001', nota: 8.5, ano: 2026, turma: 'TUR001' }
  ],
  logs: []
};

let mockState = JSON.parse(JSON.stringify(MOCK_DATA));
let mockSessionUser = null;

function apiUrl(path = '') {
  if (!path) return API_URL;
  if (/^(https?:)?\/\//i.test(path)) return path;
  return `${API_URL.replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`;
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function readJsonBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (err) {
      return {};
    }
  }
  return body;
}

function getMockResponse(pathname, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const normalizedPath = pathname.startsWith('http') ? new URL(pathname, window.location.origin).pathname : pathname;

  if (normalizedPath === '/api/csrf') {
    return Promise.resolve({ csrfToken: 'mock-csrf-token' });
  }

  if (normalizedPath === '/api/profile') {
    return Promise.resolve({ user: mockSessionUser });
  }

  if (normalizedPath === '/api/login' && method === 'POST') {
    const payload = readJsonBody(options.body);
    const user = mockState.usuarios.find((item) => item.login === String(payload.login || '').trim());
    if (!user || String(payload.senha || '') !== String(user.senha || '')) {
      return Promise.reject(new Error('Usuário ou senha inválidos.'));
    }
    const requestedPerfil = String(payload.perfil || '').trim().toUpperCase();
    if (requestedPerfil && requestedPerfil !== String(user.perfil || '').trim().toUpperCase()) {
      return Promise.reject(new Error('Perfil selecionado não corresponde ao usuário.'));
    }
    mockSessionUser = { id: user.id, nome: user.nome, login: user.login, perfil: String(user.perfil || '').trim().toUpperCase() };
    mockState.logs.unshift({ id: `mock-${Date.now()}`, timestamp: new Date().toISOString(), user: user.login, action: 'login', details: `Login bem-sucedido como ${mockSessionUser.perfil}` });
    return Promise.resolve({ user: mockSessionUser });
  }

  if (normalizedPath === '/api/logout' && method === 'POST') {
    mockSessionUser = null;
    return Promise.resolve({ success: true });
  }

  if (normalizedPath === '/api/usuarios' && method === 'GET') {
    return Promise.resolve(mockState.usuarios.map(({ senha, senhaHash, ...rest }) => rest));
  }

  if (normalizedPath === '/api/usuario' && method === 'POST') {
    const payload = readJsonBody(options.body);
    const newUser = { id: `USR${String(mockState.usuarios.length + 1).padStart(3, '0')}`, nome: payload.nome, login: payload.login, senha: payload.senha, perfil: String(payload.perfil || '').toUpperCase() };
    mockState.usuarios.push(newUser);
    return Promise.resolve({ success: true, usuario: { id: newUser.id, nome: newUser.nome, login: newUser.login, perfil: newUser.perfil } });
  }

  if (normalizedPath === '/api/alunos' && method === 'GET') {
    return Promise.resolve(cloneData(mockState.alunos));
  }

  if (normalizedPath === '/api/aluno' && method === 'POST') {
    const payload = readJsonBody(options.body);
    const aluno = { id: `ALU${String(mockState.alunos.length + 1).padStart(3, '0')}`, ...payload, idade: payload.dataNascimento ? new Date().getFullYear() - new Date(payload.dataNascimento).getFullYear() : '' };
    mockState.alunos.push(aluno);
    mockState.usuarios.push({ id: `USR${String(mockState.usuarios.length + 1).padStart(3, '0')}`, nome: aluno.nome, login: aluno.login, senha: aluno.senha, perfil: 'ALUNO' });
    return Promise.resolve({ success: true, aluno });
  }

  if (normalizedPath.startsWith('/api/aluno/') && method === 'PUT') {
    const payload = readJsonBody(options.body);
    const id = normalizedPath.split('/').pop();
    const aluno = mockState.alunos.find((item) => item.id === id);
    if (!aluno) {
      return Promise.reject(new Error('Aluno não encontrado.'));
    }
    Object.assign(aluno, payload);
    return Promise.resolve({ success: true, aluno });
  }

  if (normalizedPath === '/api/cursos' && method === 'GET') {
    return Promise.resolve(cloneData(mockState.cursos));
  }

  if (normalizedPath === '/api/curso' && method === 'POST') {
    const payload = readJsonBody(options.body);
    const curso = { id: `CUR${String(mockState.cursos.length + 1).padStart(3, '0')}`, ...payload };
    mockState.cursos.push(curso);
    return Promise.resolve({ success: true, curso });
  }

  if (normalizedPath.startsWith('/api/curso/') && method === 'PUT') {
    const payload = readJsonBody(options.body);
    const id = normalizedPath.split('/').pop();
    const curso = mockState.cursos.find((item) => item.id === id);
    if (!curso) {
      return Promise.reject(new Error('Curso não encontrado.'));
    }
    Object.assign(curso, payload);
    return Promise.resolve({ success: true, curso });
  }

  if (normalizedPath === '/api/disciplinas' && method === 'GET') {
    return Promise.resolve(cloneData(mockState.disciplinas));
  }

  if (normalizedPath === '/api/disciplina' && method === 'POST') {
    const payload = readJsonBody(options.body);
    const disciplina = { id: `DISC${String(mockState.disciplinas.length + 1).padStart(3, '0')}`, ...payload };
    mockState.disciplinas.push(disciplina);
    return Promise.resolve({ success: true, disciplina });
  }

  if (normalizedPath.startsWith('/api/disciplina/') && method === 'PUT') {
    const payload = readJsonBody(options.body);
    const id = normalizedPath.split('/').pop();
    const disciplina = mockState.disciplinas.find((item) => item.id === id);
    if (!disciplina) {
      return Promise.reject(new Error('Disciplina não encontrada.'));
    }
    Object.assign(disciplina, payload);
    return Promise.resolve({ success: true, disciplina });
  }

  if (normalizedPath === '/api/matriculas' && method === 'GET') {
    return Promise.resolve(cloneData(mockState.matriculas));
  }

  if (normalizedPath === '/api/matricula' && method === 'POST') {
    const payload = readJsonBody(options.body);
    const matricula = { id: `MAT${String(mockState.matriculas.length + 1).padStart(3, '0')}`, numero: `${new Date().getFullYear()}${String(mockState.matriculas.length + 1).padStart(4, '0')}`, ...payload };
    mockState.matriculas.push(matricula);
    return Promise.resolve({ success: true, matricula });
  }

  if (normalizedPath === '/api/notas' && method === 'GET') {
    return Promise.resolve(cloneData(mockState.notas));
  }

  if (normalizedPath === '/api/nota' && method === 'POST') {
    const payload = readJsonBody(options.body);
    const nota = { id: `NOT${String(mockState.notas.length + 1).padStart(3, '0')}`, ...payload };
    mockState.notas.push(nota);
    mockState.historicoEscolar.push({ id: `HIS${String(mockState.historicoEscolar.length + 1).padStart(3, '0')}`, aluno: payload.alunoId, curso: payload.cursoId, disciplina: payload.disciplinaId, nota: Number(payload.valor), ano: new Date().getFullYear(), turma: '' });
    return Promise.resolve({ success: true, nota });
  }

  if (normalizedPath.startsWith('/api/nota/') && method === 'PUT') {
    const payload = readJsonBody(options.body);
    const id = normalizedPath.split('/').pop();
    const nota = mockState.notas.find((item) => item.id === id);
    if (!nota) {
      return Promise.reject(new Error('Nota não encontrada.'));
    }
    Object.assign(nota, payload);
    return Promise.resolve({ success: true, nota });
  }

  if (normalizedPath === '/api/historico' && method === 'GET') {
    const historico = cloneData(mockState.historicoEscolar).map((item) => ({
      id: item.id,
      alunoNome: mockState.alunos.find((aluno) => aluno.id === item.aluno)?.nome || 'Desconhecido',
      cursoNome: mockState.cursos.find((curso) => curso.id === item.curso)?.nome || 'Desconhecido',
      disciplinaNome: mockState.disciplinas.find((disciplina) => disciplina.id === item.disciplina)?.nome || 'Desconhecido',
      nota: item.nota,
      ano: item.ano,
      turma: item.turma || '-'
    }));
    if (mockSessionUser?.perfil === 'ALUNO') {
      const aluno = mockState.alunos.find((item) => item.nome.toLowerCase() === mockSessionUser.nome.toLowerCase());
      if (aluno) {
        return Promise.resolve(historico.filter((item) => item.alunoNome === aluno.nome));
      }
    }
    return Promise.resolve(historico);
  }

  if (normalizedPath === '/api/relatorios' && method === 'GET') {
    return Promise.resolve({
      totalAlunos: mockState.alunos.length,
      totalCursos: mockState.cursos.length,
      totalDisciplinas: mockState.disciplinas.length,
      totalMatriculas: mockState.matriculas.length,
      totalNotas: mockState.notas.length,
      ultimaAtualizacao: new Date().toISOString()
    });
  }

  if (normalizedPath === '/api/backup' && method === 'GET') {
    return Promise.resolve({ success: true, file: 'backup-mock.json' });
  }

  if (normalizedPath === '/api/logs' && method === 'GET') {
    return Promise.resolve(cloneData(mockState.logs));
  }

  return Promise.reject(new Error('Recurso não disponível no modo estático do Netlify.'));
}

async function fetchJson(url, options = {}) {
  const requestUrl = apiUrl(url);
  const pathname = requestUrl.startsWith('http') ? new URL(requestUrl, window.location.origin).pathname : requestUrl;
  const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

  if (!isLocalhost && pathname.startsWith('/api/')) {
    return getMockResponse(pathname, options);
  }

  console.debug('fetchJson request:', requestUrl);
  const response = await fetch(requestUrl, {
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    ...options
  });

  let data = null;
  try {
    data = await response.json();
  } catch (jsonErr) {
    console.error('fetchJson: failed to parse JSON response', {
      url: requestUrl,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }
    throw jsonErr;
  }

  if (!response.ok) {
    throw new Error(data?.error || `Erro de comunicação com o servidor. HTTP ${response.status}`);
  }
  return data;
}

function createIcon(name) {
  return `<i data-lucide="${name}"></i>`;
}

function replaceLucide() {
  if (window.lucide && typeof lucide.replace === 'function') {
    lucide.replace();
  }
}

function createCard(title, target, kind = 'primary') {
  const className = kind === 'success' ? 'button-success' : kind === 'warn' ? 'button-warn' : 'button-primary';
  return `<button type="button" class="button ${className}" data-action="openSection" data-target="${target}">${createIcon('chevrons-right')} ${title}</button>`;
}

function showMessage(text, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `message ${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = text;
  toastContainer.prepend(toast);
  setTimeout(() => toast.remove(), 4500);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function maskPhone(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

function handleLogout() {
  fetchJson('/api/logout', { method: 'POST' })
    .then(() => {
      currentUser = null;
      btnLogout.hidden = true;
      renderLogin();
      showMessage('Sessão encerrada com sucesso.', 'success');
    })
    .catch((err) => showMessage(err.message, 'error'));
}

btnLogout.addEventListener('click', handleLogout);

mainContent.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'openSection') {
    editingAlunoId = null;
    editingCursoId = null;
    editingDisciplinaId = null;
    openSection(button.dataset.target);
  } else if (action === 'dashboard') {
    editingAlunoId = null;
    editingCursoId = null;
    editingDisciplinaId = null;
    renderDashboard();
  } else if (action === 'logout') {
    handleLogout();
  } else if (action === 'editAluno') {
    editingAlunoId = button.dataset.id;
    editingCursoId = null;
    editingDisciplinaId = null;
    renderAlunos();
  } else if (action === 'cancelEditAluno') {
    editingAlunoId = null;
    renderAlunos();
  } else if (action === 'editCurso') {
    editingCursoId = button.dataset.id;
    editingAlunoId = null;
    editingDisciplinaId = null;
    editingNotaId = null;
    renderCursos();
  } else if (action === 'cancelEditCurso') {
    editingCursoId = null;
    renderCursos();
  } else if (action === 'editDisciplina') {
    editingDisciplinaId = button.dataset.id;
    editingAlunoId = null;
    editingCursoId = null;
    editingNotaId = null;
    renderDisciplinas();
  } else if (action === 'cancelEditDisciplina') {
    editingDisciplinaId = null;
    renderDisciplinas();
  } else if (action === 'editNota') {
    editingNotaId = button.dataset.id;
    editingAlunoId = null;
    editingCursoId = null;
    editingDisciplinaId = null;
    renderNotas();
  } else if (action === 'cancelEditNota') {
    editingNotaId = null;
    renderNotas();
  }
});

function renderLogin() {
  mainContent.innerHTML = `
    <div class="panel">
      <div class="card">
        <div class="section-title">
          ${createIcon('shield-check')}<h2>Login</h2>
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="loginPerfil">Perfil</label>
            <select id="loginPerfil">
              <option value="DIRETOR">Diretor</option>
              <option value="FUNCIONARIO">Funcionário da Secretaria</option>
              <option value="PROFESSOR">Professor</option>
              <option value="ALUNO">Aluno</option>
            </select>
          </div>
          <div class="field">
            <label for="loginUsuario">Usuário</label>
            <input id="loginUsuario" type="text" placeholder="Digite seu login" autocomplete="username" />
          </div>
          <div class="field">
            <label for="loginSenha">Senha</label>
            <input id="loginSenha" type="password" placeholder="Digite sua senha" autocomplete="current-password" />
          </div>
        </div>
        <div class="button-group">
          <button type="button" id="btnEntrar" class="button button-primary">${createIcon('log-in')} Entrar</button>
          <button type="button" id="btnSairLogin" class="button button-danger">${createIcon('x-circle')} Limpar</button>
        </div>
      </div>
    </div>`;
  replaceLucide();

  document.getElementById('btnEntrar').addEventListener('click', async () => {
    const login = document.getElementById('loginUsuario').value.trim();
    const senha = document.getElementById('loginSenha').value.trim();
    const perfil = document.getElementById('loginPerfil').value;
    if (!login || !senha) {
      return showMessage('Preencha usuário e senha.', 'error');
    }
    try {
      await fetchJson('/api/login', {
        method: 'POST',
        body: JSON.stringify({ login, senha, perfil })
      });
      await loadProfile();
      showMessage('Bem-vindo ao Sistema Escolar.', 'success');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  });

  document.getElementById('btnSairLogin').addEventListener('click', () => {
    document.getElementById('loginUsuario').value = '';
    document.getElementById('loginSenha').value = '';
    showMessage('Aplicação pronta para uso, feche o navegador se desejar.', 'success');
  });
}

async function loadProfile() {
  try {
    const data = await fetchJson('/api/profile');
    currentUser = data.user;
    btnLogout.hidden = false;
    renderDashboard();
  } catch (err) {
    currentUser = null;
    btnLogout.hidden = true;
    renderLogin();
  }
}

function renderDashboard() {
  if (!currentUser) {
    return renderLogin();
  }
  let dashboardActions = [];
  switch (currentUser.perfil) {
    case 'DIRETOR':
      dashboardActions = [
        { title: 'Cadastrar Funcionário', target: 'usuarios' },
        { title: 'Relatórios', target: 'relatorios' },
        { title: 'Realizar Backup', target: 'backup' },
        { title: 'Logs', target: 'logs' }
      ];
      break;
    case 'FUNCIONARIO':
      dashboardActions = [
        { title: 'Cadastrar Alunos', target: 'alunos' },
        { title: 'Cadastrar Cursos', target: 'cursos' },
        { title: 'Cadastrar Matrículas', target: 'matriculas' },
        { title: 'Cadastrar Disciplinas', target: 'disciplinas' },
        { title: 'Cadastrar Notas', target: 'notas' },
        { title: 'Histórico Escolar', target: 'historico' }
      ];
      break;
    case 'PROFESSOR':
      dashboardActions = [
        { title: 'Cadastrar Disciplinas', target: 'disciplinas' },
        { title: 'Cadastrar Cursos', target: 'cursos' },
        { title: 'Cadastrar Notas', target: 'notas' },
        { title: 'Relatórios', target: 'relatorios' }
      ];
      break;
    case 'ALUNO':
      dashboardActions = [
        { title: 'Histórico Escolar', target: 'historico' }
      ];
      break;
    default:
      dashboardActions = [];
  }
  mainContent.innerHTML = `
    <div class="panel">
      <div class="card">
        <div class="section-title">${createIcon('user-check')}<h2>Bem-vindo, ${currentUser.nome}</h2></div>
        <p>Perfil: <strong>${currentUser.perfil}</strong></p>
      </div>
      <div class="card">
        <div class="section-title">${createIcon('layout-dashboard')}<h2>Menu principal</h2></div>
        <div class="grid-3">
          ${dashboardActions.map((item) => createCard(item.title, item.target, 'success')).join('')}
        </div>
      </div>
    </div>`;
  replaceLucide();
}

window.openSection = async function openSection(section) {
  switch (section) {
    case 'usuarios':
      return renderUsuarios();
    case 'alunos':
      return renderAlunos();
    case 'cursos':
      return renderCursos();
    case 'disciplinas':
      return renderDisciplinas();
    case 'matriculas':
      return renderMatriculas();
    case 'notas':
      return renderNotas();
    case 'historico':
      return renderHistorico();
    case 'relatorios':
      return renderRelatorios();
    case 'backup':
      return renderBackup();
    case 'logs':
      return renderLogs();
    default:
      renderDashboard();
  }
};

function renderSection(title, content) {
  mainContent.innerHTML = `
    <div class="panel">
      <div class="card">
        <div class="section-title">${createIcon('book-open')}<h2>${title}</h2></div>
        ${content}
        <div class="button-row">
          <button type="button" class="button button-ghost" data-action="dashboard">${createIcon('chevron-left')} Voltar</button>
          <button type="button" class="button button-danger" data-action="logout">${createIcon('log-out')} Sair</button>
        </div>
      </div>
    </div>`;
  replaceLucide();
}

async function renderUsuarios() {
  try {
    const { user } = await fetchJson('/api/profile');
    if (!['DIRETOR', 'FUNCIONARIO'].includes(user.perfil)) {
      return renderDashboard();
    }
    const data = await fetchJson('/api/usuarios');
    const content = `
      <div class="form-grid">
        <div class="field"><label>Nome</label><input id="usuarioNome" type="text" /></div>
        <div class="field"><label>Login</label><input id="usuarioLogin" type="text" /></div>
        <div class="field"><label>Senha</label><input id="usuarioSenha" type="password" /></div>
        <div class="field"><label>Perfil</label><select id="usuarioPerfil"><option value="DIRETOR">Diretor</option><option value="FUNCIONARIO">Funcionário</option><option value="PROFESSOR">Professor</option></select></div>
      </div>
      <div class="button-group">
        <button type="button" class="button button-success" id="btnCadastrarUsuario">${createIcon('user-plus')} Cadastrar</button>
        <button type="button" class="button button-warn" data-action="dashboard">${createIcon('x')} Cancelar</button>
      </div>
      <div class="table-wrapper">
        <table><thead><tr><th>Nome</th><th>Login</th><th>Perfil</th></tr></thead><tbody>${data.map((item) => `<tr><td>${item.nome}</td><td>${item.login}</td><td>${item.perfil}</td></tr>`).join('')}</tbody></table>
      </div>`;
    renderSection('Cadastro de Funcionários', content);
    document.getElementById('btnCadastrarUsuario').addEventListener('click', async () => {
      try {
        const nome = document.getElementById('usuarioNome').value.trim();
        const login = document.getElementById('usuarioLogin').value.trim();
        const senha = document.getElementById('usuarioSenha').value.trim();
        const perfil = document.getElementById('usuarioPerfil').value;
        if (!nome || !login || !senha) {
          return showMessage('Todos os campos do formulário devem ser preenchidos.', 'error');
        }
        await fetchJson('/api/usuario', {
          method: 'POST',
          body: JSON.stringify({ nome, login, senha, perfil })
        });
        showMessage('Funcionário cadastrado com sucesso.', 'success');
        renderUsuarios();
      } catch (err) {
        showMessage(err.message, 'error');
      }
    });
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

async function renderAlunos() {
  try {
    const data = await fetchJson('/api/alunos');
    const alunoParaEditar = editingAlunoId ? data.find((item) => item.id === editingAlunoId) : null;
    const isEditing = Boolean(alunoParaEditar);
    const alunoValues = {
      nome: alunoParaEditar?.nome || '',
      login: alunoParaEditar?.login || '',
      senha: '',
      cpf: alunoParaEditar?.cpf || '',
      dataNascimento: alunoParaEditar?.dataNascimento || '',
      endereco: alunoParaEditar?.endereco || '',
      celular: alunoParaEditar?.celular || '',
      email: alunoParaEditar?.email || ''
    };
    const content = `
      <div class="form-grid">
        <div class="field"><label>Nome</label><input id="alunoNome" type="text" value="${alunoValues.nome}" /></div>
        <div class="field"><label>Login</label><input id="alunoLogin" type="text" autocomplete="username" value="${alunoValues.login}" ${isEditing ? 'readonly' : ''} /></div>
        <div class="field"><label>Senha</label><input id="alunoSenha" type="password" autocomplete="new-password" value="" ${isEditing ? 'placeholder="Deixe em branco para manter a senha"' : ''} /></div>
        <div class="field"><label>CPF</label><input id="alunoCPF" type="text" placeholder="000.000.000-00" value="${alunoValues.cpf}" /></div>
        <div class="field"><label>Data de Nascimento</label><input id="alunoNascimento" type="date" value="${alunoValues.dataNascimento}" /></div>
        <div class="field"><label>Endereço</label><input id="alunoEndereco" type="text" value="${alunoValues.endereco}" /></div>
        <div class="field"><label>Celular</label><input id="alunoCelular" type="tel" placeholder="(99) 99999-9999" value="${alunoValues.celular}" /></div>
        <div class="field"><label>E-mail</label><input id="alunoEmail" type="email" value="${alunoValues.email}" /></div>
      </div>
      <div class="button-group">
        <button type="button" class="button button-success" id="btnCadastrarAluno">${createIcon(isEditing ? 'save' : 'user-plus')} ${isEditing ? 'Salvar alterações' : 'Cadastrar'}</button>
        ${isEditing ? `<button type="button" class="button button-warn" data-action="cancelEditAluno">${createIcon('x')} Cancelar edição</button>` : `<button type="button" class="button button-warn" data-action="dashboard">${createIcon('x')} Voltar</button>`}
      </div>
      <div class="table-wrapper">
        <table><thead><tr><th>Nome</th><th>Login</th><th>CPF</th><th>Idade</th><th>Celular</th><th>E-mail</th><th>Ações</th></tr></thead><tbody>${data.map((item) => `<tr><td>${item.nome}</td><td>${item.login || ''}</td><td>${item.cpf}</td><td>${item.idade || ''}</td><td>${item.celular || ''}</td><td>${item.email || ''}</td><td><button type="button" class="button button-ghost button-small" data-action="editAluno" data-id="${item.id}">${createIcon('edit-2')} Editar</button></td></tr>`).join('')}</tbody></table>
      </div>`;
    renderSection('Cadastro de Alunos', content);
    document.getElementById('alunoCelular').addEventListener('input', (event) => {
      event.target.value = maskPhone(event.target.value);
    });
    document.getElementById('btnCadastrarAluno').addEventListener('click', async () => {
      try {
        const aluno = {
          nome: document.getElementById('alunoNome').value.trim(),
          login: document.getElementById('alunoLogin').value.trim(),
          senha: document.getElementById('alunoSenha').value,
          cpf: document.getElementById('alunoCPF').value.replace(/\D/g, ''),
          dataNascimento: document.getElementById('alunoNascimento').value,
          endereco: document.getElementById('alunoEndereco').value.trim(),
          celular: document.getElementById('alunoCelular').value.trim(),
          email: document.getElementById('alunoEmail').value.trim()
        };
        if (!aluno.nome || !aluno.cpf || !aluno.dataNascimento || !aluno.endereco || !aluno.celular || !aluno.email) {
          return showMessage('Preencha todos os campos obrigatórios do aluno.', 'error');
        }
        if (isEditing) {
          await fetchJson(`/api/aluno/${editingAlunoId}`, { method: 'PUT', body: JSON.stringify({ nome: aluno.nome, cpf: aluno.cpf, dataNascimento: aluno.dataNascimento, endereco: aluno.endereco, celular: aluno.celular, email: aluno.email }) });
          showMessage('Aluno atualizado com sucesso.', 'success');
          editingAlunoId = null;
        } else {
          if (!aluno.login || !aluno.senha) {
            return showMessage('Login e senha são obrigatórios para novo aluno.', 'error');
          }
          await fetchJson('/api/aluno', { method: 'POST', body: JSON.stringify(aluno) });
          showMessage('Aluno cadastrado com sucesso.', 'success');
        }
        renderAlunos();
      } catch (err) {
        showMessage(err.message, 'error');
      }
    });
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

async function renderCursos() {
  try {
    const data = await fetchJson('/api/cursos');
    const cursoParaEditar = editingCursoId ? data.find((item) => item.id === editingCursoId) : null;
    const isEditing = Boolean(cursoParaEditar);
    const cursoValues = {
      nome: cursoParaEditar?.nome || '',
      semestres: cursoParaEditar?.semestres || ''
    };
    const content = `
      <div class="form-grid">
        <div class="field"><label>Nome do Curso</label><input id="cursoNome" type="text" value="${cursoValues.nome}" /></div>
        <div class="field"><label>Semestres</label><input id="cursoSemestres" type="number" min="1" value="${cursoValues.semestres}" /></div>
      </div>
      <div class="button-group">
        <button type="button" class="button button-success" id="btnCadastrarCurso">${createIcon(isEditing ? 'save' : 'book-open')} ${isEditing ? 'Salvar alterações' : 'Cadastrar'}</button>
        ${isEditing ? `<button type="button" class="button button-warn" data-action="cancelEditCurso">${createIcon('x')} Cancelar edição</button>` : `<button type="button" class="button button-warn" data-action="dashboard">${createIcon('x')} Voltar</button>`}
      </div>
      <div class="table-wrapper">
        <table><thead><tr><th>Nome</th><th>Semestres</th><th>Ações</th></tr></thead><tbody>${data.map((item) => `<tr><td>${item.nome}</td><td>${item.semestres}</td><td><button type="button" class="button button-ghost button-small" data-action="editCurso" data-id="${item.id}">${createIcon('edit-2')} Editar</button></td></tr>`).join('')}</tbody></table>
      </div>`;
    renderSection('Cadastro de Cursos', content);
    document.getElementById('btnCadastrarCurso').addEventListener('click', async () => {
      try {
        const nome = document.getElementById('cursoNome').value.trim();
        const semestres = document.getElementById('cursoSemestres').value;
        if (!nome || !semestres) {
          return showMessage('Informe nome e quantidade de semestres.', 'error');
        }
        if (isEditing) {
          await fetchJson(`/api/curso/${editingCursoId}`, { method: 'PUT', body: JSON.stringify({ nome, semestres }) });
          showMessage('Curso atualizado com sucesso.', 'success');
          editingCursoId = null;
        } else {
          await fetchJson('/api/curso', { method: 'POST', body: JSON.stringify({ nome, semestres }) });
          showMessage('Curso cadastrado com sucesso.', 'success');
        }
        renderCursos();
      } catch (err) {
        showMessage(err.message, 'error');
      }
    });
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

async function renderDisciplinas() {
  try {
    const [cursos, professores, turmas, disciplinas] = await Promise.all([
      fetchJson('/api/cursos'),
      fetchJson('/api/usuarios'),
      fetchJson('/api/alunos'),
      fetchJson('/api/disciplinas')
    ]);
    const disciplinaParaEditar = editingDisciplinaId ? disciplinas.find((item) => item.id === editingDisciplinaId) : null;
    const isEditing = Boolean(disciplinaParaEditar);
    const professorOptions = professores.filter((item) => item.perfil === 'PROFESSOR').map((item) => `<option value="${item.nome}" ${disciplinaParaEditar?.professor === item.nome ? 'selected' : ''}>${item.nome}</option>`).join('');
    const turmaOptions = turmas.slice(0, 5).map((item) => `<option value="${item.id}" ${disciplinaParaEditar?.turma === item.id ? 'selected' : ''}>${item.nome || item.id}</option>`).join('');
    const content = `
      <div class="form-grid">
        <div class="field"><label>Nome da Disciplina</label><input id="disciplinaNome" type="text" value="${disciplinaParaEditar?.nome || ''}" /></div>
        <div class="field"><label>Carga Horária</label><input id="disciplinaCarga" type="number" min="1" value="${disciplinaParaEditar?.cargaHoraria || ''}" /></div>
        <div class="field"><label>Professor</label><select id="disciplinaProfessor"><option value="">Selecione</option>${professorOptions}</select></div>
        <div class="field"><label>Turma</label><input id="disciplinaTurma" type="text" placeholder="Ex: Sub-17 A" value="${disciplinaParaEditar?.turma || ''}" /></div>
      </div>
      <div class="button-group">
        <button type="button" class="button button-success" id="btnCadastrarDisciplina">${createIcon(isEditing ? 'save' : 'layers')} ${isEditing ? 'Salvar alterações' : 'Cadastrar'}</button>
        ${isEditing ? `<button type="button" class="button button-warn" data-action="cancelEditDisciplina">${createIcon('x')} Cancelar edição</button>` : `<button type="button" class="button button-warn" data-action="dashboard">${createIcon('x')} Cancelar</button>`}
      </div>
      <div class="table-wrapper">
        <table><thead><tr><th>Nome</th><th>Carga</th><th>Professor</th><th>Turma</th><th>Ações</th></tr></thead><tbody>${disciplinas.map((item) => `<tr><td>${item.nome}</td><td>${item.cargaHoraria}</td><td>${item.professor || '-'}</td><td>${item.turma || '-'}</td><td><button type="button" class="button button-ghost button-small" data-action="editDisciplina" data-id="${item.id}">${createIcon('edit-2')} Editar</button></td></tr>`).join('')}</tbody></table>
      </div>`;
    renderSection('Cadastro de Disciplinas', content);
    document.getElementById('btnCadastrarDisciplina').addEventListener('click', async () => {
      try {
        const nome = document.getElementById('disciplinaNome').value.trim();
        const cargaHoraria = document.getElementById('disciplinaCarga').value;
        const professor = document.getElementById('disciplinaProfessor').value;
        const turma = document.getElementById('disciplinaTurma').value.trim();
        if (!nome || !cargaHoraria) {
          return showMessage('Informe nome e carga horária da disciplina.', 'error');
        }
        if (isEditing) {
          await fetchJson(`/api/disciplina/${editingDisciplinaId}`, { method: 'PUT', body: JSON.stringify({ nome, cargaHoraria, professor, turma }) });
          showMessage('Disciplina atualizada com sucesso.', 'success');
          editingDisciplinaId = null;
        } else {
          await fetchJson('/api/disciplina', { method: 'POST', body: JSON.stringify({ nome, cargaHoraria, professor, turma }) });
          showMessage('Disciplina cadastrada com sucesso.', 'success');
        }
        renderDisciplinas();
      } catch (err) {
        showMessage(err.message, 'error');
      }
    });
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

async function renderMatriculas() {
  try {
    const [alunos, cursos, matriculas] = await Promise.all([
      fetchJson('/api/alunos'),
      fetchJson('/api/cursos'),
      fetchJson('/api/matriculas')
    ]);
    const alunoOptions = alunos.map((item) => `<option value="${item.id}">${item.nome}</option>`).join('');
    const cursoOptions = cursos.map((item) => `<option value="${item.id}">${item.nome}</option>`).join('');
    const content = `
      <div class="form-grid">
        <div class="field"><label>Aluno</label><select id="matriculaAluno"><option value="">Selecione</option>${alunoOptions}</select></div>
        <div class="field"><label>Curso</label><select id="matriculaCurso"><option value="">Selecione</option>${cursoOptions}</select></div>
        <div class="field"><label>Data da Matrícula</label><input id="matriculaData" type="date" value="${formatDate(new Date())}" /></div>
      </div>
      <div class="button-group">
        <button type="button" class="button button-success" id="btnCadastrarMatricula">${createIcon('clipboard-check')} Cadastrar</button>
        <button type="button" class="button button-warn" data-action="dashboard">${createIcon('x')} Cancelar</button>
      </div>
      <div class="table-wrapper">
        <table><thead><tr><th>Matrícula</th><th>Aluno</th><th>Curso</th><th>Data</th></tr></thead><tbody>${matriculas.map((item) => `<tr><td>${item.numero}</td><td>${alunos.find((a) => a.id === item.alunoId)?.nome || 'Desconhecido'}</td><td>${cursos.find((c) => c.id === item.cursoId)?.nome || 'Desconhecido'}</td><td>${item.dataMatricula}</td></tr>`).join('')}</tbody></table>
      </div>`;
    renderSection('Registro de Matrículas', content);
    document.getElementById('btnCadastrarMatricula').addEventListener('click', async () => {
      try {
        const alunoId = document.getElementById('matriculaAluno').value;
        const cursoId = document.getElementById('matriculaCurso').value;
        const dataMatricula = document.getElementById('matriculaData').value;
        if (!alunoId || !cursoId) {
          return showMessage('Selecione aluno e curso para matrícula.', 'error');
        }
        await fetchJson('/api/matricula', { method: 'POST', body: JSON.stringify({ alunoId, cursoId, dataMatricula }) });
        showMessage('Matrícula registrada com sucesso.', 'success');
        renderMatriculas();
      } catch (err) {
        showMessage(err.message, 'error');
      }
    });
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

async function renderNotas() {
  try {
    const [alunos, cursos, disciplinas, notas] = await Promise.all([
      fetchJson('/api/alunos'),
      fetchJson('/api/cursos'),
      fetchJson('/api/disciplinas'),
      fetchJson('/api/notas')
    ]);
    const notaParaEditar = editingNotaId ? notas.find((item) => item.id === editingNotaId) : null;
    const isEditing = Boolean(notaParaEditar);
    const alunoOptions = alunos.map((item) => `<option value="${item.id}" ${notaParaEditar?.alunoId === item.id ? 'selected' : ''}>${item.nome}</option>`).join('');
    const cursoOptions = cursos.map((item) => `<option value="${item.id}" ${notaParaEditar?.cursoId === item.id ? 'selected' : ''}>${item.nome}</option>`).join('');
    const disciplinaOptions = disciplinas.map((item) => `<option value="${item.id}" ${notaParaEditar?.disciplinaId === item.id ? 'selected' : ''}>${item.nome}</option>`).join('');
    const content = `
      <div class="form-grid">
        <div class="field"><label>Aluno</label><select id="notaAluno"><option value="">Selecione</option>${alunoOptions}</select></div>
        <div class="field"><label>Curso</label><select id="notaCurso"><option value="">Selecione</option>${cursoOptions}</select></div>
        <div class="field"><label>Disciplina</label><select id="notaDisciplina"><option value="">Selecione</option>${disciplinaOptions}</select></div>
        <div class="field"><label>Nota</label><input id="notaValor" type="number" min="0" max="10" step="0.1" value="${notaParaEditar?.valor ?? ''}" /></div>
      </div>
      <div class="button-group">
        <button type="button" class="button button-success" id="btnCadastrarNota">${createIcon(isEditing ? 'save' : 'award')} ${isEditing ? 'Salvar alterações' : 'Cadastrar'}</button>
        ${isEditing ? `<button type="button" class="button button-warn" data-action="cancelEditNota">${createIcon('x')} Cancelar edição</button>` : `<button type="button" class="button button-warn" data-action="dashboard">${createIcon('x')} Cancelar</button>`}
      </div>
      <div class="table-wrapper">
        <table><thead><tr><th>Aluno</th><th>Curso</th><th>Disciplina</th><th>Nota</th><th>Ações</th></tr></thead><tbody>${notas.map((item) => `<tr><td>${alunos.find((a) => a.id === item.alunoId)?.nome || 'Desconhecido'}</td><td>${cursos.find((c) => c.id === item.cursoId)?.nome || 'Desconhecido'}</td><td>${disciplinas.find((d) => d.id === item.disciplinaId)?.nome || 'Desconhecido'}</td><td>${item.valor}</td><td><button type="button" class="button button-ghost button-small" data-action="editNota" data-id="${item.id}">${createIcon('edit-2')} Editar</button></td></tr>`).join('')}</tbody></table>
      </div>`;
    renderSection('Lançamento de Notas', content);
    document.getElementById('btnCadastrarNota').addEventListener('click', async () => {
      try {
        const alunoId = document.getElementById('notaAluno').value;
        const cursoId = document.getElementById('notaCurso').value;
        const disciplinaId = document.getElementById('notaDisciplina').value;
        const valor = document.getElementById('notaValor').value;
        if (!alunoId || !cursoId || !disciplinaId || valor === '') {
          return showMessage('Preencha aluno, curso, disciplina e valor.', 'error');
        }
        if (isEditing) {
          await fetchJson(`/api/nota/${editingNotaId}`, { method: 'PUT', body: JSON.stringify({ alunoId, cursoId, disciplinaId, valor }) });
          showMessage('Nota atualizada com sucesso.', 'success');
          editingNotaId = null;
        } else {
          await fetchJson('/api/nota', { method: 'POST', body: JSON.stringify({ alunoId, cursoId, disciplinaId, valor }) });
          showMessage('Nota cadastrada com sucesso.', 'success');
        }
        renderNotas();
      } catch (err) {
        showMessage(err.message, 'error');
      }
    });
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

async function renderHistorico() {
  try {
    const [historico, cursos, disciplinas] = await Promise.all([
      fetchJson('/api/historico'),
      fetchJson('/api/cursos'),
      fetchJson('/api/disciplinas')
    ]);
    const content = `
      <div class="card card-accent card-accent-warning">
        <p>Use o botão abaixo para gerar o histórico escolar em PDF com base nos registros atuais.</p>
      </div>
      <div class="table-wrapper">
        <table><thead><tr><th>Aluno</th><th>Curso</th><th>Disciplina</th><th>Nota</th><th>Ano</th><th>Turma</th></tr></thead><tbody>${historico.map((item) => {
          const notaClass = Number(item.nota) < 7 ? 'nota-baixa' : '';
          return `<tr><td>${item.alunoNome}</td><td>${item.cursoNome}</td><td>${item.disciplinaNome}</td><td class="${notaClass}">${item.nota}</td><td>${item.ano}</td><td>${item.turma || '-'}</td></tr>`;
        }).join('')}</tbody></table>
      </div>
      <div class="button-group">
        <button type="button" class="button button-primary" id="btnGerarPDF">${createIcon('download')} Gerar PDF</button>
        <button type="button" class="button button-warn" data-action="dashboard">${createIcon('x')} Cancelar</button>
      </div>
      `;
    renderSection('Histórico Escolar', content);
    document.getElementById('btnGerarPDF').addEventListener('click', () => {
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) {
          return showMessage('Não foi possível gerar o PDF. Biblioteca não carregada.', 'error');
        }
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(16);
        doc.text('Histórico Escolar', 14, 20);
        doc.setFontSize(10);
        const rows = historico.map((item) => [item.alunoNome, item.cursoNome, item.disciplinaNome, item.nota.toString(), item.ano.toString(), item.turma || '-']);
        if (typeof doc.autoTable !== 'function') {
          return showMessage('Não foi possível gerar o PDF. Plugin autoTable não disponível.', 'error');
        }
        doc.autoTable({ head: [['Aluno', 'Curso', 'Disciplina', 'Nota', 'Ano', 'Turma']], body: rows, startY: 28, theme: 'grid' });
        doc.save('historico-escolar.pdf');
        showMessage('PDF gerado com sucesso.', 'success');
    });
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

async function renderRelatorios() {
  try {
    const data = await fetchJson('/api/relatorios');
    const content = `
      <div class="grid-3">
        <div class="card"><h3>Total de alunos</h3><p>${data.totalAlunos}</p></div>
        <div class="card"><h3>Total de cursos</h3><p>${data.totalCursos}</p></div>
        <div class="card"><h3>Total de disciplinas</h3><p>${data.totalDisciplinas}</p></div>
        <div class="card"><h3>Total de matrículas</h3><p>${data.totalMatriculas}</p></div>
        <div class="card"><h3>Total de notas</h3><p>${data.totalNotas}</p></div>
      </div>
      <div class="summary-note"><strong>Última atualização:</strong> ${new Date(data.ultimaAtualizacao).toLocaleString()}</div>`;
    renderSection('Relatórios', content);
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

async function renderBackup() {
  const content = `
    <div class="card card-accent card-accent-success">
      <p>Backup completo dos dados do sistema. Use este botão antes de encerrar o expediente ou realizar alterações grandes.</p>
    </div>
    <div class="button-group">
      <button type="button" class="button button-success" id="btnFazerBackup">${createIcon('save')} Fazer Backup</button>
      <button type="button" class="button button-warn" data-action="dashboard">${createIcon('x')} Cancelar</button>
    </div>`;
  renderSection('Backup de Dados', content);
  document.getElementById('btnFazerBackup').addEventListener('click', async () => {
    try {
      const result = await fetchJson('/api/backup');
      showMessage(`Backup criado em servidor. Arquivo: ${result.file}`, 'success');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  });
}

async function renderLogs() {
  try {
    const logs = await fetchJson('/api/logs');
    const content = `
      <div class="card card-accent card-accent-warning">
        <p>Registros de acesso e alterações do sistema. Atenção especial para auditoria e conformidade.</p>
      </div>
      <div class="table-wrapper">
        <table><thead><tr><th>Momento</th><th>Usuário</th><th>Ação</th><th>Detalhes</th></tr></thead><tbody>${logs.map((item) => `<tr><td>${new Date(item.timestamp).toLocaleString()}</td><td>${item.user}</td><td>${item.action}</td><td>${item.details}</td></tr>`).join('')}</tbody></table>
      </div>`;
    renderSection('Logs de Acesso e Alterações', content);
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

loadProfile();
