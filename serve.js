const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Rota para redirecionar / para a página de login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Rota específica para admin (redirecionamento)
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'admin', 'dashboard.html'));
});

// Rota específica para app (redirecionamento)
app.get('/app/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'app', 'agendamentos.html'));
});

// Tratamento de rotas não encontradas - tentar servir como arquivo estático primeiro
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, 'frontend', req.path);
  res.sendFile(filePath, (err) => {
    if (err) {
      // Se não encontrar o arquivo, redirecionar para login
      res.redirect('/');
    }
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor web rodando na porta ${PORT}`);
  console.log(`🔗 Acesse: http://localhost:${PORT}`);
  console.log(`🔐 Login único: http://localhost:${PORT}/css/index.html`);
  console.log(`🏢 Admin: http://localhost:${PORT}/admin/dashboard`);
  console.log(`📅 Usuário: http://localhost:${PORT}/app/agendamentos`);
});
