const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initializeDatabase } = require('./backend/src/models');
const { API_CONFIG, getApiInfo } = require('./backend/src/config/api');
const SeedService = require('./backend/src/services/seedService');
const appointmentRoutes = require('./backend/src/routes/appointments');
const authRoutes = require('./backend/src/routes/authRoutes');
const userRoutes = require('./backend/src/routes/userRoutes');
const integrationRoutes = require('./backend/src/routes/integrationRoutes');
const n8nRoutes = require('./backend/src/routes/n8nRoutes');

const app = express();
const PORT = API_CONFIG.port;

// Middlewares de segurança e configuração
app.use(helmet());

// --- CONFIGURAÇÃO DE CORS PARA INTEGRAÇÕES EXTERNAS ---
// Permite integrações externas (n8n, webhooks, etc.) acessarem a API
app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origem (como apps mobile, Postman, Curl, n8n)
    if (!origin) return callback(null, true);

    // Em desenvolvimento: permite localhost/127.0.0.1 em qualquer porta
    if (API_CONFIG.environment === 'development') {
      if (origin.match(API_CONFIG.cors.development)) {
        return callback(null, true);
      }
    }

    // Em produção: verifica origens permitidas
    if (API_CONFIG.environment === 'production') {
      if (API_CONFIG.cors.production.includes(origin)) {
        return callback(null, true);
      }
    }

    // Permite o domínio do frontend se configurado
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }

    // Para integrações externas (n8n), permite se não estiver em produção
    // ou se a origem estiver explicitamente permitida
    if (API_CONFIG.environment !== 'production' || API_CONFIG.cors.production.length === 0) {
      return callback(null, true);
    }

    // Bloqueia origens não autorizadas
    const msg = 'A política de CORS deste site não permite acesso desta origem.';
    return callback(new Error(msg), false);
  },
  credentials: true
}));
// -----------------------------

// Health check básico (compatibilidade)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'EvAgendamento API'
  });
});

// Health check da API com informações completas (para integrações externas)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: API_CONFIG.info.name,
    version: API_CONFIG.info.version,
    environment: API_CONFIG.environment,
    baseUrl: API_CONFIG.baseUrl,
    endpoints: API_CONFIG.endpoints,
    server: {
      host: '0.0.0.0',
      port: PORT
    }
  });
});

// Rate limiting (aplicado apenas para rotas autenticadas, exceto health check)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.API_RATE_LIMIT || 100,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  skip: (req) => req.path === '/api/health' // Pular rate limiting para health check
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/n8n', n8nRoutes);

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

    // Escuta em 0.0.0.0 para permitir acessos externos (n8n, integrações)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 EvAgendamento API rodando na porta ${PORT}`);
      console.log(`📊 Ambiente: ${API_CONFIG.environment}`);
      console.log(`🌐 Servidor acessível em: http://0.0.0.0:${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Health check: ${API_CONFIG.baseUrl}/health`);
      console.log(`📋 URL Base da API: ${API_CONFIG.baseUrl}`);
      console.log(`💾 Usando PostgreSQL como banco de dados`);
      console.log(`🔓 CORS configurado para integrações externas`);
      console.log(`🔐 Sistema de autenticação ativo`);
      console.log(`📖 Documentação da API: ${API_CONFIG.baseUrl}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

startServer();