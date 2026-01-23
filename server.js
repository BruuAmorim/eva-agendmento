const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initializeDatabase } = require('./backend/src/models');
const SeedService = require('./backend/src/services/seedService');
const appointmentRoutes = require('./backend/src/routes/appointments');
const authRoutes = require('./backend/src/routes/authRoutes');
const userRoutes = require('./backend/src/routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança e configuração
app.use(helmet());

// --- CORREÇÃO DO CORS AQUI ---
// Configuração permissiva para desenvolvimento (aceita qualquer origem local)
app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origem (como apps mobile ou Postman/Curl)
    if (!origin) return callback(null, true);

    // Permite QUALQUER origem localhost/127.0.0.1 independente da porta
    if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
      return callback(null, true);
    }

    // Se quiser permitir o seu domínio de produção no futuro, adicione aqui
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }

    // Bloqueia o resto
    const msg = 'A política de CORS deste site não permite acesso desta origem.';
    return callback(new Error(msg), false);
  },
  credentials: true
}));
// -----------------------------

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.API_RATE_LIMIT || 100,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'EvAgendamento API'
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe nesta API`
  });
});

// Inicialização do servidor
async function startServer() {
  try {
    // Inicializar banco de dados
    await initializeDatabase();

    // Criar usuários de teste
    await SeedService.ensureSeedUsers();

    app.listen(PORT, () => {
      console.log(`🚀 EvAgendamento API rodando na porta ${PORT}`);
      console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`💾 Usando PostgreSQL como banco de dados`);
      console.log(`🔓 CORS liberado para todas as portas locais (localhost/127.0.0.1)`);
      console.log(`🔐 Sistema de autenticação ativo`);
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

startServer();