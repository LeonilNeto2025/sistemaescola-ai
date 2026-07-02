const http = require('http');
const tries = [
  { login: 'admin', senha: '123', perfil: 'DIRETOR' },
  { login: 'neto.secretaria', senha: 'neto123', perfil: 'FUNCIONARIO' },
  { login: 'carlos.silva', senha: '123', perfil: 'PROFESSOR' },
  { login: 'ana.aluna', senha: 'aluno123', perfil: 'ALUNO' }
];

function testLogin(cred) {
  return new Promise((resolve) => {
    const data = JSON.stringify(cred);
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => { resolve({ cred, status: res.statusCode, body }); });
    });
    req.on('error', (err) => { resolve({ cred, error: err.message }); });
    req.write(data);
    req.end();
  });
}

(async () => {
  for (const cred of tries) {
    const result = await testLogin(cred);
    console.log(JSON.stringify(result));
  }
})();
