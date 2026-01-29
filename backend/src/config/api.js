/**
 * Configurações da API - EvAgendamento
 *
 * Centraliza todas as configurações relacionadas à API para facilitar
 * o uso em integrações externas (n8n, webhooks, etc.)
 */

// URL base da API (configurável via variável de ambiente)
const getApiBaseUrl = () => {
  // Se definida via ambiente, usa ela
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }

  // Em produção, tenta detectar automaticamente ou usa localhost como fallback
  if (process.env.NODE_ENV === 'production') {
    // Pode ser configurado via API_HOST ou similar
    const host = process.env.API_HOST || 'localhost';
    const port = process.env.PORT || 3000;
    const protocol = process.env.API_PROTOCOL || 'http';
    return `${protocol}://${host}:${port}/api`;
  }

  // Em desenvolvimento, usa localhost
  return `http://localhost:${process.env.PORT || 3000}/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Configurações da API
const API_CONFIG = {
  // URL base para integrações externas
  baseUrl: API_BASE_URL,

  // Porta do servidor
  port: process.env.PORT || 3001,

  // Ambiente
  environment: process.env.NODE_ENV || 'development',

  // Endpoints principais documentados
  endpoints: {
    // Health check
    health: '/health',

    // Autenticação
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      refresh: '/auth/refresh'
    },

    // Usuários
    users: {
      list: '/users',
      create: '/users',
      get: '/users/:id',
      update: '/users/:id',
      delete: '/users/:id',
      deactivate: '/users/:id/deactivate',
      reactivate: '/users/:id/reactivate'
    },

    // Agendamentos
    appointments: {
      list: '/appointments',
      create: '/appointments',
      get: '/appointments/:id',
      update: '/appointments/:id',
      cancel: '/appointments/:id/cancel',
      delete: '/appointments/:id',
      availableSlots: '/appointments/available/:date',
      stats: '/appointments/stats/overview'
    },

    // Slots/Horários (alias para compatibilidade)
    slots: {
      available: '/slots/:date'
    },

    // Integrações
    integrations: {
      list: '/integrations',
      create: '/integrations',
      update: '/integrations',
      test: '/integrations/test'
    },

    // Webhooks n8n
    webhooks: {
      appointments: '/n8n/appointments'
    }
  },

  // Informações da API para documentação
  info: {
    name: 'EvAgendamento API',
    version: '2.2.0',
    description: 'API RESTful para sistema de agendamentos inteligente',
    contact: {
      name: 'EvAgendamento Support',
      email: 'support@evagendamento.com'
    }
  },

  // Configurações de CORS para integrações externas
  cors: {
    // Em desenvolvimento, permite localhost/127.0.0.1 em qualquer porta
    development: /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,

    // Em produção, adicionar domínios específicos
    production: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []
  }
};

/**
 * Gera a URL completa de um endpoint
 * @param {string} endpointPath - Caminho do endpoint (ex: '/appointments')
 * @param {object} params - Parâmetros para substituir (ex: { id: 123 })
 * @returns {string} URL completa
 */
function getEndpointUrl(endpointPath, params = {}) {
  let url = `${API_CONFIG.baseUrl}${endpointPath}`;

  // Substituir parâmetros dinâmicos
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });

  return url;
}

/**
 * Retorna informações completas da API para documentação
 */
function getApiInfo() {
  return {
    ...API_CONFIG.info,
    baseUrl: API_CONFIG.baseUrl,
    endpoints: API_CONFIG.endpoints,
    environment: API_CONFIG.environment,
    server: {
      host: '0.0.0.0',
      port: API_CONFIG.port
    }
  };
}

module.exports = {
  API_CONFIG,
  getEndpointUrl,
  getApiInfo
};



