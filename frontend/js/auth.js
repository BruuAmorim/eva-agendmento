// Sistema de Autenticação EvAgendamento
class AuthManager {
    constructor() {
        this.isAdminLoggedIn = false;
        this.init();
    }

    init() {
        this.checkAdminStatus();
        this.bindEvents();
    }

    bindEvents() {
        // Botão de login administrativo
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', () => this.openAdminLoginModal());
        }

        // Modal de login administrativo
        const adminLoginModalClose = document.getElementById('adminLoginModalClose');
        if (adminLoginModalClose) {
            adminLoginModalClose.addEventListener('click', () => this.closeAdminLoginModal());
        }

        // Formulário de login administrativo
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminLogin(e.target);
            });
        }

        // Botão de logout administrativo
        const adminLogoutBtn = document.getElementById('adminLogoutBtn');
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', () => this.adminLogout());
        }

        // Botão de configurações
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }
    }

    checkAdminStatus() {
        const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        this.isAdminLoggedIn = adminLoggedIn;
        console.log('Admin status checked:', this.isAdminLoggedIn);
        this.updateUIForAdminStatus();
    }

    updateUIForAdminStatus() {
        console.log('Updating UI for admin status:', this.isAdminLoggedIn);

        const adminLoginBtn = document.getElementById('adminLoginBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const adminLogoutBtn = document.getElementById('adminLogoutBtn');
        const headerActions = document.getElementById('headerActions');
        const title = document.querySelector('.header-title span');

        if (!adminLoginBtn || !settingsBtn || !adminLogoutBtn || !headerActions) {
            console.error('UI elements not found!');
            return;
        }

        // Sempre mostrar header actions
        headerActions.style.display = 'flex';

        if (this.isAdminLoggedIn) {
            // Admin logado
            adminLoginBtn.style.display = 'none';
            settingsBtn.style.display = 'inline-block';
            adminLogoutBtn.style.display = 'inline-block';

            // Atualizar título
            if (title) title.textContent = 'Painel Administrativo';
            console.log('UI updated for admin mode');
        } else {
            // Usuário comum
            adminLoginBtn.style.display = 'inline-block';
            settingsBtn.style.display = 'none';
            adminLogoutBtn.style.display = 'none';

            // Atualizar título
            if (title) title.textContent = 'Agendamento - Cliente';
            console.log('UI updated for user mode');
        }
    }

    openAdminLoginModal() {
        const modal = document.getElementById('adminLoginModal');
        modal.classList.add('show');
        document.getElementById('adminEmail').focus();
    }

    closeAdminLoginModal() {
        const modal = document.getElementById('adminLoginModal');
        modal.classList.remove('show');
        document.getElementById('adminLoginForm').reset();
        this.hideAdminLoginError();
    }

    handleAdminLogin(form) {
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;

        // Validações
        if (!email || !password) {
            this.showAdminLoginError('Preencha todos os campos');
            return;
        }

        // Credenciais hardcoded para admin
        if (email === 'brunadevv@gmail.com' && password === 'admin123') {
            this.isAdminLoggedIn = true;
            localStorage.setItem('adminLoggedIn', 'true');
            this.updateUIForAdminStatus();
            this.closeAdminLoginModal();
            this.showToast('Login administrativo realizado com sucesso!', 'success');
        } else {
            this.showAdminLoginError('Credenciais inválidas');
        }
    }

    adminLogout() {
        this.isAdminLoggedIn = false;
        localStorage.removeItem('adminLoggedIn');
        this.updateUIForAdminStatus();
        this.showToast('Logout administrativo realizado', 'info');
    }

    openSettings() {
        if (!this.isAdminLoggedIn) {
            this.showToast('Acesso negado: apenas administradores podem acessar as configurações', 'error');
            return;
        }

        const modal = document.getElementById('settingsModal');
        modal.classList.add('show');
        this.loadSettings();
    }

    loadSettings() {
        // Carregar configurações salvas
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');

        // ClouddChat
        document.getElementById('clouddchatApiUrl').value = settings.clouddchat?.apiUrl || '';
        document.getElementById('clouddchatInstanceId').value = settings.clouddchat?.instanceId || '';
        document.getElementById('clouddchatApiToken').value = settings.clouddchat?.apiToken || '';

        // n8n
        document.getElementById('n8nWebhookUrl').value = settings.n8n?.webhookUrl || '';
        document.getElementById('n8nApiKey').value = settings.n8n?.apiKey || '';

        // Configurações gerais
        document.getElementById('darkModeToggle').checked = settings.general?.darkMode || false;
        document.getElementById('notificationsEnabled').checked = settings.general?.notificationsEnabled !== false;
    }

    saveSettings(formId, data) {
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
        settings[formId] = data;
        localStorage.setItem('appSettings', JSON.stringify(settings));
        this.showToast('Configurações salvas com sucesso!', 'success');
    }

    showAdminLoginError(message) {
        const errorDiv = document.getElementById('adminLoginError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideAdminLoginError() {
        const errorDiv = document.getElementById('adminLoginError');
        errorDiv.style.display = 'none';
    }

    showToast(message, type = 'info') {
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        } else {
            alert(message); // Fallback se o app não estiver carregado
        }
    }

    // Verificar se usuário tem permissão administrativa
    hasPermission(permission) {
        if (permission === 'admin') {
            return this.isAdminLoggedIn;
        }
        return true; // Usuários comuns têm acesso básico
    }
}

// Instância global
const authManager = new AuthManager();

// Exportar para uso global
window.authManager = authManager;
