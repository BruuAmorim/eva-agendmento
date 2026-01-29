const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initializeDatabase } = require('./backend/src/models');
const { API_CONFIG, getApiInfo } = require('./backend/src/config/api');
// const SeedService = require('./backend/src/services/seedService'); // Temporariamente desabilitado
const appointmentRoutes = require('./backend/src/routes/appointments');
const appointmentController = require('./backend/src/controllers/appointmentController');
const authRoutes = require('./backend/src/routes/authRoutes');
const userRoutes = require('./backend/src/routes/userRoutes');
const integrationRoutes = require('./backend/src/routes/integrationRoutes');
const n8nRoutes = require('./backend/src/routes/n8nRoutes');
const dashboardRoutes = require('./backend/src/routes/dashboard');
const moderatorRoutes = require('./backend/src/routes/moderator');

const app = express();
const PORT = API_CONFIG.port;

// Middlewares de segurança e configuração
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// --- CONFIGURAÇÃO DE CORS PARA INTEGRAÇÕES EXTERNAS ---
// Permite integrações externas (frontend, n8n, webhooks, etc.) acessarem a API
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'https://eva-agendamento.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'http://localhost:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));

// Handler explícito para preflight requests
app.options('*', cors(corsOptions));
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
  const packageVersion = require('./package.json').version;

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: API_CONFIG.info.name,
    version: packageVersion,
    environment: API_CONFIG.environment,
    baseUrl: API_CONFIG.baseUrl,
    endpoints: {
      // Endpoints principais documentados para integrações
      health: '/api/health',
      slots: API_CONFIG.endpoints.slots.available,
      appointments: {
        list: API_CONFIG.endpoints.appointments.list,
        create: API_CONFIG.endpoints.appointments.create,
        update: API_CONFIG.endpoints.appointments.update,
        delete: API_CONFIG.endpoints.appointments.delete
      }
    },
    server: {
      host: '0.0.0.0',
      port: PORT
    },
    documentation: `${API_CONFIG.baseUrl}/health`
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
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/moderator', moderatorRoutes);

// Rota adicional para slots (alias para compatibilidade com integrações externas)
app.get('/api/slots/:date', appointmentController.getAvailableSlots);

// Rota adicional para disponibilidade em português (compatibilidade com n8n)
app.get('/api/agendamento/disponibilidade', appointmentController.getDisponibilidade);

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

    // Seed de usuários temporariamente desabilitado para evitar problemas de dependência circular
    // TODO: Corrigir import do modelo User no seedService
    console.log('⚠️ Seed de usuários desabilitado - usuários podem ser criados manualmente se necessário');

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