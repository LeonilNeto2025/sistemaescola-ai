const mainContent = document.getElementById('mainContent');
const btnLogout = document.getElementById('btnLogout');
const toastContainer = document.getElementById('toastContainer');
let currentUser = null;
let editingAlunoId = null;
let editingCursoId = null;
let editingNotaId = null;
let editingDisciplinaId = null;

const LOCAL_API_URL = 'http://localhost:3000';
const API_URL = (() => {
  if (typeof window === 'undefined') return LOCAL_API_URL;
  if (window.API_URL) {
    return String(window.API_URL).replace(/\/+$/, '');
  }
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return LOCAL_API_URL;
  }
  if (hostname.endsWith('.netlify.app')) {
    return String(window.location.origin).replace(/\/+$/, '');
  }
  return String(window.location.origin).replace(/\/+$/, '');
})();

function apiUrl(path = '') {
  // 1. Defina aqui a URL REAL do seu backend (onde roda o seu Node.js/Express na internet)
  // EXEMPLO: 'https://sistema-escola-api.onrender.com'
  const URL_DO_SEU_BACKEND_REAL = 'https://sistemaescola-ai.netlify.app/'; 

  // 2. Identifica se você está testando localmente no computador
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  
  // Se for localhost, usa a porta 3000. Se estiver na internet (Netlify), usa a API real.
  const BASE_URL = isLocalhost ? 'http://localhost:3000' : URL_DO_SEU_BACKEND_REAL;

  if (!path) return BASE_URL;
  if (/^(https?:)?\/\//i.test(path)) return path;
  
  // Garante a união perfeita da URL com a rota
  return `${BASE_URL.replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`;
}

async function fetchJson(url, options = {}) {
  const requestUrl = apiUrl(url);
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
