// API Client para EvAgendamento
// Gerencia todas as comunicações com a API RESTful

// URL base da API (configurada dinamicamente via config-api.js)
// A configuração é feita no arquivo config-api.js e acessada via window.API_CONFIG
const API_BASE_URL = window.API_CONFIG ? window.API_CONFIG.baseUrl : 'http://localhost:3000/api';

class APIClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    // Método auxiliar para fazer requisições HTTP
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Adicionar body se for POST/PUT/PATCH
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);

            // Verificar se a resposta tem conteúdo antes de tentar parse JSON
            let data = null;
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (jsonError) {
                    // Se falhar o parse JSON, criar um erro com a resposta de texto
                    console.warn('Falha ao fazer parse JSON da resposta:', jsonError);
                    const textResponse = await response.text();
                    data = { error: 'Resposta inválida da API', details: textResponse };
                }
            } else {
                // Resposta não é JSON, tentar como texto
                const textResponse = await response.text();
                data = { message: textResponse };
            }

            if (!response.ok) {
                // Criar erro com informações completas da resposta
                const error = new Error(data.message || data.error || `Erro HTTP: ${response.status}`);
                error.response = response;
                error.data = data;
                throw error;
            }

            return data;
        } catch (error) {
            // Se já é um erro criado acima, apenas relançar
            if (error.response) {
                throw error;
            }
            // Log apenas se não for erro de CORS (comum em desenvolvimento)
            if (!error.message.includes('Failed to fetch') && !error.message.includes('CORS')) {
                console.error(`Erro na requisição ${config.method || 'GET'} ${url}:`, error);
            }
            throw error;
        }
    }

    // Testar conexão com a API
    async testConnection() {
        return this.request('/appointments/stats/overview');
    }

    // ========== APPOINTMENTS ENDPOINTS ==========

    // GET /api/appointments - Listar agendamentos com filtros
    async getAppointments(filters = {}) {
        const params = new URLSearchParams();

        if (filters.customer_name) params.append('customer_name', filters.customer_name);
        if (filters.date) params.append('date', filters.date);
        if (filters.status) params.append('status', filters.status);
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        if (filters.page) params.append('page', filters.page);
        if (filters.limit) params.append('limit', filters.limit);

        const queryString = params.toString();
        const endpoint = queryString ? `/appointments?${queryString}` : '/appointments';

        return this.request(endpoint);
    }

    // GET /api/appointments/:id - Buscar agendamento específico
    async getAppointment(id) {
        return this.request(`/appointments/${id}`);
    }

    // GET /api/appointments/available/:date - Buscar horários disponíveis
    async getAvailableSlots(date, duration = 60) {
        const params = new URLSearchParams();
        if (duration) params.append('duration', duration);

        return this.request(`/appointments/available/${date}?${params}`);
    }

    // POST /api/appointments - Criar novo agendamento
    async createAppointment(appointmentData) {
        return this.request('/appointments', {
            method: 'POST',
            body: appointmentData
        });
    }

    // PUT /api/appointments/:id - Atualizar agendamento
    async updateAppointment(id, updateData) {
        return this.request(`/appointments/${id}`, {
            method: 'PUT',
            body: updateData
        });
    }

    // PUT /api/appointments/:id/cancel - Cancelar agendamento
    async cancelAppointment(id, reason = null) {
        const body = reason ? { reason } : {};
        return this.request(`/appointments/${id}/cancel`, {
            method: 'PUT',
            body
        });
    }

    // DELETE /api/appointments/:id - Deletar agendamento
    async deleteAppointment(id) {
        return this.request(`/appointments/${id}`, {
            method: 'DELETE'
        });
    }

    // GET /api/appointments/stats/overview - Estatísticas dos agendamentos
    async getAppointmentStats(startDate = null, endDate = null) {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const queryString = params.toString();
        const endpoint = queryString ? `/appointments/stats/overview?${queryString}` : '/appointments/stats/overview';

        return this.request(endpoint);
    }

    // ========== UTILITY METHODS ==========

    // Método para fazer upload de arquivos (se necessário no futuro)
    async uploadFile(file, endpoint = '/upload') {
        const formData = new FormData();
        formData.append('file', file);

        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                // Não definir Content-Type para que o browser defina automaticamente com boundary
                'Content-Type': undefined
            }
        });
    }

    // Método para fazer download de arquivos
    async downloadFile(endpoint, filename) {
        const url = `${this.baseURL}${endpoint}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Erro no download:', error);
            throw error;
        }
    }

    // Método para verificar saúde da API
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
            return response.ok;
        } catch (error) {
            console.error('Health check falhou:', error);
            return false;
        }
    }

    // Método para obter informações do servidor
    async getServerInfo() {
        return this.request('/info');
    }

    // ========== ERROR HANDLING ==========

    // Método para tratar erros de forma padronizada
    handleError(error, context = '') {
        console.error(`Erro na API ${context}:`, error);

        let message = 'Erro desconhecido';

        if (error.message) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }

        // Aqui você pode adicionar lógica específica para diferentes tipos de erro
        if (message.includes('Failed to fetch')) {
            message = 'Erro de conexão com o servidor. Verifique sua conexão com a internet.';
        } else if (message.includes('NetworkError')) {
            message = 'Erro de rede. Tente novamente mais tarde.';
        } else if (message.includes('403')) {
            message = 'Acesso negado. Você não tem permissão para esta ação.';
        } else if (message.includes('404')) {
            message = 'Recurso não encontrado.';
        } else if (message.includes('500')) {
            message = 'Erro interno do servidor. Tente novamente mais tarde.';
        }

        return message;
    }

    // Método para retry automático em caso de falha
    async retryRequest(endpoint, options = {}, maxRetries = 3, delay = 1000) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.request(endpoint, options);
            } catch (error) {
                lastError = error;

                if (attempt === maxRetries) {
                    break;
                }

                // Aguardar antes da próxima tentativa
                await new Promise(resolve => setTimeout(resolve, delay * attempt));

                console.log(`Tentativa ${attempt} falhou, tentando novamente...`);
            }
        }

        throw lastError;
    }

    // ========== WEBHOOK INTEGRATION (para n8n) ==========

    // Método para enviar dados para webhook n8n
    async sendToWebhook(webhookUrl, data) {
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Erro no webhook: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao enviar para webhook:', error);
            throw error;
        }
    }

    // Método para notificar n8n sobre novo agendamento
    async notifyNewAppointment(appointment, webhookUrl) {
        if (!webhookUrl) return;

        const notificationData = {
            event: 'new_appointment',
            appointment: appointment,
            timestamp: new Date().toISOString(),
            source: 'EvAgendamento'
        };

        return this.sendToWebhook(webhookUrl, notificationData);
    }

    // Método para notificar n8n sobre atualização de agendamento
    async notifyAppointmentUpdate(appointment, webhookUrl) {
        if (!webhookUrl) return;

        const notificationData = {
            event: 'appointment_updated',
            appointment: appointment,
            timestamp: new Date().toISOString(),
            source: 'EvAgendamento'
        };

        return this.sendToWebhook(webhookUrl, notificationData);
    }

    // Método para notificar n8n sobre cancelamento
    async notifyAppointmentCancelled(appointment, webhookUrl) {
        if (!webhookUrl) return;

        const notificationData = {
            event: 'appointment_cancelled',
            appointment: appointment,
            timestamp: new Date().toISOString(),
            source: 'EvAgendamento'
        };

        return this.sendToWebhook(webhookUrl, notificationData);
    }
}

// Instância global da API
const API = new APIClient();

// Exportar para uso em outros módulos
const corsOptions = {
  origin: ['https://n8neva.com', 'https://*.ngrok-free.app'],
  credentials: true
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}



