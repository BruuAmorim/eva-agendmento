// Sistema de Autenticação EvAgendamento
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = null;
        // Backend API - usar configuração dinâmica
        this.apiBaseUrl = this.getApiBaseUrl();
        this.init();
    }

    // Método para obter URL da API dinamicamente
    getApiBaseUrl() {
        // Se estiver no Vercel, usar API de produção
        if (window.location.hostname.includes('vercel.app')) {
            return 'https://evaagendamento.onrender.com';
        }

        // Caso contrário, usar localhost
        return 'http://localhost:3000';
    }

    init() {
        this.loadStoredAuth();
        this.bindEvents();
        this.checkAuthStatus();
    }

    // Carregar autenticação do localStorage
    loadStoredAuth() {
        this.token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
            } catch (e) {
                this.clearAuth();
            }
        }
    }

    // Salvar autenticação no localStorage
    saveAuth(token, user) {
        this.token = token;
        this.currentUser = user;
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
    }

    // Limpar autenticação
    clearAuth() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
    }

    bindEvents() {
        // Botão de login
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', () => this.openLoginModal());
        }

        // Modal de login - fechar
        const adminLoginModalClose = document.getElementById('adminLoginModalClose');
        if (adminLoginModalClose) {
            adminLoginModalClose.addEventListener('click', () => this.closeLoginModal());
        }

        // Formulário de login
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e.target);
            });
        }

        // Botão de logout
        const adminLogoutBtn = document.getElementById('adminLogoutBtn');
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', () => this.logout());
        }

        // Botão de configurações (apenas admin)
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }
    }

    // Verificar status de autenticação
    async checkAuthStatus() {
        if (!this.token) {
            this.updateUIForAuthStatus();
            return;
        }

        try {
            // Verificar se token ainda é válido
            const response = await this.apiRequest('/api/auth/verify');
            if (response.success) {
                this.currentUser = response.user;
                localStorage.setItem('userData', JSON.stringify(response.user));
            } else {
                this.clearAuth();
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            this.clearAuth();
        }

        this.updateUIForAuthStatus();
        this.handlePostLoginRedirect();
    }

    // Atualizar UI baseado no status de autenticação
    updateUIForAuthStatus() {
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const adminLogoutBtn = document.getElementById('adminLogoutBtn');
        const usersBtn = document.getElementById('usersBtn');
        const headerActions = document.getElementById('headerActions');
        const title = document.querySelector('.header-title span');

        if (!headerActions) return;

        // Sempre mostrar header actions
        headerActions.style.display = 'flex';

        if (this.isAuthenticated()) {
            // Usuário logado
            if (adminLoginBtn) adminLoginBtn.style.display = 'none';

            // Mostrar botões baseado no role
            if (this.currentUser.role === 'admin_master') {
                if (settingsBtn) settingsBtn.style.display = 'inline-block';
                if (usersBtn) usersBtn.style.display = 'inline-block';
                if (title) title.textContent = 'Painel Administrativo';
            } else {
                if (settingsBtn) settingsBtn.style.display = 'none';
                if (usersBtn) usersBtn.style.display = 'none';
                if (title) title.textContent = 'Sistema de Agendamentos';
            }

            if (adminLogoutBtn) adminLogoutBtn.style.display = 'inline-block';
        } else {
            // Usuário não logado
            if (adminLoginBtn) adminLoginBtn.style.display = 'inline-block';
            if (settingsBtn) settingsBtn.style.display = 'none';
            if (usersBtn) usersBtn.style.display = 'none';
            if (adminLogoutBtn) adminLogoutBtn.style.display = 'none';
            if (title) title.textContent = 'EvAgendamento';
        }
    }

    // Verificar se usuário está autenticado
    isAuthenticated() {
        return !!(this.token && this.currentUser);
    }

    // Verificar se é admin
    isAdmin() {
        return this.isAuthenticated() && this.currentUser.role === 'admin_master';
    }

    // Abrir modal de login
    openLoginModal() {
        const modal = document.getElementById('adminLoginModal');
        if (modal) {
            modal.classList.add('show');
            const emailInput = document.getElementById('adminEmail');
            if (emailInput) emailInput.focus();
        }
    }

    // Fechar modal de login
    closeLoginModal() {
        const modal = document.getElementById('adminLoginModal');
        if (modal) {
            modal.classList.remove('show');
            const form = document.getElementById('adminLoginForm');
            if (form) form.reset();
            this.hideLoginError();
        }
    }

    // Manipular login
    async handleLogin(form) {
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;

        // Validações
        if (!email || !password) {
            this.showLoginError('Preencha todos os campos');
            return;
        }

        this.setLoading(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.saveAuth(data.token, data.user);
                this.updateUIForAuthStatus();
                this.closeLoginModal();
                this.showToast('Login realizado com sucesso!', 'success');
                this.handlePostLoginRedirect();
            } else {
                this.showLoginError(data.message || 'Credenciais inválidas');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            this.showLoginError('Erro ao fazer login. Tente novamente.');
        } finally {
            this.setLoading(false);
        }
    }

    // Logout
    async logout() {
        try {
            await this.apiRequest('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Erro no logout:', error);
        }

        this.clearAuth();
        this.updateUIForAuthStatus();
        this.showToast('Logout realizado com sucesso', 'info');

        // Redirecionar para página inicial
        if (window.location.pathname !== '/') {
            window.location.href = '/';
        }
    }

    // Abrir configurações (apenas admin)
    openSettings() {
        if (!this.isAdmin()) {
            this.showToast('Acesso negado: apenas administradores podem acessar as configurações', 'error');
            return;
        }

        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('show');
            this.loadSettings();
        }
    }

    // Carregar configurações
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');

        // ClouddChat
        const clouddchatApiUrl = document.getElementById('clouddchatApiUrl');
        if (clouddchatApiUrl) clouddchatApiUrl.value = settings.clouddchat?.apiUrl || '';

        const clouddchatInstanceId = document.getElementById('clouddchatInstanceId');
        if (clouddchatInstanceId) clouddchatInstanceId.value = settings.clouddchat?.instanceId || '';

        const clouddchatApiToken = document.getElementById('clouddchatApiToken');
        if (clouddchatApiToken) clouddchatApiToken.value = settings.clouddchat?.apiToken || '';

        // n8n
        const n8nWebhookUrl = document.getElementById('n8nWebhookUrl');
        if (n8nWebhookUrl) n8nWebhookUrl.value = settings.n8n?.webhookUrl || '';

        const n8nApiKey = document.getElementById('n8nApiKey');
        if (n8nApiKey) n8nApiKey.value = settings.n8n?.apiKey || '';

        // Configurações gerais
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) darkModeToggle.checked = settings.general?.darkMode || false;

        const notificationsEnabled = document.getElementById('notificationsEnabled');
        if (notificationsEnabled) notificationsEnabled.checked = settings.general?.notificationsEnabled !== false;
    }

    // Salvar configurações
    saveSettings(formId, data) {
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
        settings[formId] = data;
        localStorage.setItem('appSettings', JSON.stringify(settings));
        this.showToast('Configurações salvas com sucesso!', 'success');
    }

    // Redirecionamento após login baseado no role
    handlePostLoginRedirect() {
        if (!this.isAuthenticated()) return;

        const currentPath = window.location.pathname;

        if (this.currentUser.role === 'admin_master') {
            // Admin deve estar em /admin/*
            if (!currentPath.startsWith('/admin/')) {
                window.location.href = '/admin/dashboard';
                return;
            }
        } else {
            // Usuário comum deve estar em /app/*
            if (!currentPath.startsWith('/app/')) {
                window.location.href = '/app/agendamentos';
                return;
            }
        }
    }

    // Fazer requisições autenticadas para a API
    async apiRequest(endpoint, options = {}) {
        // Permitir passar endpoint absoluto (http/https). Caso contrário, prefixar com base do backend.
        const url = (typeof endpoint === 'string' && /^https?:\/\//.test(endpoint))
            ? endpoint
            : `${this.apiBaseUrl}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        if (this.token) {
            defaultOptions.headers.Authorization = `Bearer ${this.token}`;
        }

        const response = await fetch(url, { ...defaultOptions, ...options });
        let data = null;
        const contentType = response.headers.get('content-type');

        try {
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // Se não for JSON, tentar ler como texto e criar erro
                const textResponse = await response.text();
                console.error('❌ Resposta não-JSON do servidor:', {
                    status: response.status,
                    statusText: response.statusText,
                    contentType,
                    body: textResponse.substring(0, 500) // primeiros 500 chars
                });
                data = {
                    success: false,
                    message: `Erro do servidor (${response.status}): ${response.statusText}`,
                    details: textResponse
                };
            }
        } catch (e) {
            // Se falhar ao ler a resposta
            console.error('❌ Erro ao processar resposta:', e);
            data = {
                success: false,
                message: 'Erro de comunicação com o servidor',
                details: e.message
            };
        }

        // IMPORTANTE:
        // - 401/403 NÃO devem "deslogar" automaticamente (requisito).
        // - Exceção: verificação de sessão (/api/auth/verify) pode limpar auth se token falhar.
        if (response.status === 401 || response.status === 403) {
            if (endpoint === '/api/auth/verify') {
                this.clearAuth();
                this.updateUIForAuthStatus();
            }
            throw new Error(data?.message || (response.status === 401 ? 'Não autenticado' : 'Acesso negado'));
        }

        return data;
    }

    // Mostrar erro no login
    showLoginError(message) {
        const errorDiv = document.getElementById('adminLoginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    // Esconder erro no login
    hideLoginError() {
        const errorDiv = document.getElementById('adminLoginError');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    // Mostrar toast
    showToast(message, type = 'info') {
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        } else {
            alert(message);
        }
    }

    // Set loading state
    setLoading(loading) {
        const submitBtn = document.querySelector('#adminLoginForm button[type="submit"]');
        const inputs = document.querySelectorAll('#adminLoginForm input');

        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.textContent = loading ? 'Entrando...' : 'Entrar';
        }

        inputs.forEach(input => {
            input.disabled = loading;
        });
    }

    // Verificar permissões
    hasPermission(permission) {
        if (!this.isAuthenticated()) return false;

        switch (permission) {
            case 'admin':
                return this.currentUser.role === 'admin_master';
            case 'user':
                return this.currentUser.role === 'user';
            default:
                return true;
        }
    }
}

// Instância global
const authManager = new AuthManager();

// Exportar para uso global
window.authManager = authManager;

