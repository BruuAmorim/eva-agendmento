/**
 * Configuração da API para EvAgendamento
 *
 * Este arquivo centraliza a configuração da URL da API,
 * detectando automaticamente se está em desenvolvimento ou produção.
 */

// Configurações de ambiente
const API_CONFIG = {
  // Detectar se está em produção baseado na origem
  isProduction: () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // Não é produção se estiver em localhost ou 127.0.0.1
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return false;
    }

    // Não é produção se estiver usando HTTP (exceto se for localhost)
    if (protocol === 'http:' && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return false;
    }

    // Considerar produção se usar HTTPS ou domínios comuns de produção
    return protocol === 'https:' || !hostname.includes('localhost');
  },

  // Obter URL base da API
  getBaseUrl: () => {
    if (API_CONFIG.isProduction()) {
      // Em produção: usar a mesma origem que o frontend
      return `${window.location.origin}/api`;
    } else {
      // Em desenvolvimento: tentar portas comuns ou usar variável de ambiente
      const devPorts = [3000, 3001, 8000, 8080];

      // Se uma URL específica foi definida via variável global (opcional)
      if (window.API_BASE_URL) {
        return window.API_BASE_URL;
      }

      // Tentar detectar automaticamente a porta do backend
      // Por padrão, assumir 3000 (porta comum para desenvolvimento)
      return `http://localhost:3000/api`;
    }
  },

  // Configurações de timeout e retry
  timeout: 10000, // 10 segundos
  retryAttempts: 3,
  retryDelay: 1000, // 1 segundo

  // Configurações específicas do ambiente
  environment: {
    name: () => API_CONFIG.isProduction() ? 'production' : 'development',
    debug: () => !API_CONFIG.isProduction(),
    corsEnabled: true
  }
};

// URL base da API (calculada dinamicamente)
const API_BASE_URL = API_CONFIG.getBaseUrl();

// Função para testar conectividade com a API
API_CONFIG.testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      // Timeout para evitar travamentos
      signal: AbortSignal.timeout(API_CONFIG.timeout)
    });

    return {
      success: response.ok,
      status: response.status,
      url: API_BASE_URL
    };
  } catch (error) {
    console.warn('Falha ao testar conexão com API:', error.message);
    return {
      success: false,
      error: error.message,
      url: API_BASE_URL
    };
  }
};

// Função para obter informações de debug
API_CONFIG.getDebugInfo = () => {
  return {
    isProduction: API_CONFIG.isProduction(),
    environment: API_CONFIG.environment.name(),
    apiUrl: API_BASE_URL,
    origin: window.location.origin,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    timestamp: new Date().toISOString()
  };
};

// Log de inicialização (apenas em desenvolvimento)
if (API_CONFIG.environment.debug()) {
  console.log('🔧 API Config Debug:', API_CONFIG.getDebugInfo());
}

// Exportar configurações
window.API_CONFIG = API_CONFIG;
