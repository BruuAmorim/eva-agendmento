// Gerenciamento de Configurações e Integrações
class SettingsManager {
    constructor() {
        this.bindEvents();
    }

    bindEvents() {
        // Modal de configurações
        const settingsModalClose = document.getElementById('settingsModalClose');
        if (settingsModalClose) {
            settingsModalClose.addEventListener('click', () => this.closeSettingsModal());
        }

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target));
        });

        // Formulários
        const clouddchatForm = document.getElementById('clouddchatForm');
        if (clouddchatForm) {
            clouddchatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveClouddChatSettings(e.target);
            });
        }

        const n8nForm = document.getElementById('n8nForm');
        if (n8nForm) {
            n8nForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveN8nSettings(e.target);
            });
        }

        // Teste de conexão ClouddChat
        const testClouddchatBtn = document.getElementById('testClouddchatBtn');
        if (testClouddchatBtn) {
            testClouddchatBtn.addEventListener('click', () => this.testClouddChatConnection());
        }

        // Configurações gerais
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', (e) => this.toggleDarkMode(e.target.checked));
        }

        const notificationsToggle = document.getElementById('notificationsEnabled');
        if (notificationsToggle) {
            notificationsToggle.addEventListener('change', (e) => this.toggleNotifications(e.target.checked));
        }
    }

    switchTab(clickedBtn) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

        // Add active class to clicked tab
        clickedBtn.classList.add('active');

        // Show corresponding pane
        const tabName = clickedBtn.dataset.tab;
        document.getElementById(tabName + 'Tab').classList.add('active');
    }

    saveClouddChatSettings(form) {
        const formData = new FormData(form);
        const settings = {
            apiUrl: formData.get('apiUrl'),
            instanceId: formData.get('instanceId'),
            apiToken: formData.get('apiToken')
        };

        // Salvar no localStorage
        const allSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
        allSettings.clouddchat = settings;
        localStorage.setItem('appSettings', JSON.stringify(allSettings));

        this.showToast('Configurações do ClouddChat salvas com sucesso!', 'success');
    }

    saveN8nSettings(form) {
        const formData = new FormData(form);
        const settings = {
            webhookUrl: formData.get('webhookUrl'),
            apiKey: formData.get('apiKey')
        };

        // Salvar no localStorage
        const allSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
        allSettings.n8n = settings;
        localStorage.setItem('appSettings', JSON.stringify(allSettings));

        this.showToast('Configurações do n8n salvas com sucesso!', 'success');
    }

    async testClouddChatConnection() {
        const apiUrl = document.getElementById('clouddchatApiUrl').value;
        const instanceId = document.getElementById('clouddchatInstanceId').value;
        const apiToken = document.getElementById('clouddchatApiToken').value;

        if (!apiUrl || !instanceId || !apiToken) {
            this.showToast('Preencha todos os campos do ClouddChat primeiro', 'warning');
            return;
        }

        try {
            // Tentar fazer uma requisição simples para testar a conexão
            // Baseado na documentação do ClouddChat, vamos tentar um endpoint de teste
            const testUrl = `${apiUrl}/instances/${instanceId}/status`;

            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showToast('✅ Conexão com ClouddChat estabelecida com sucesso!', 'success');
            } else if (response.status === 401) {
                this.showToast('❌ Token de API inválido', 'error');
            } else if (response.status === 404) {
                this.showToast('❌ Instance ID não encontrado', 'error');
            } else {
                this.showToast(`❌ Erro na conexão: ${response.status}`, 'error');
            }

        } catch (error) {
            console.error('Erro no teste de conexão:', error);
            this.showToast('❌ Falha na conexão. Verifique a URL e credenciais.', 'error');
        }
    }

    toggleDarkMode(enabled) {
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
        if (!settings.general) settings.general = {};
        settings.general.darkMode = enabled;
        localStorage.setItem('appSettings', JSON.stringify(settings));

        // Aplicar modo escuro se houver implementação
        document.documentElement.setAttribute('data-theme', enabled ? 'dark' : 'light');
        this.showToast(`Modo ${enabled ? 'escuro' : 'claro'} ativado`, 'info');
    }

    toggleNotifications(enabled) {
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
        if (!settings.general) settings.general = {};
        settings.general.notificationsEnabled = enabled;
        localStorage.setItem('appSettings', JSON.stringify(settings));

        this.showToast(`Notificações ${enabled ? 'ativadas' : 'desativadas'}`, 'info');
    }

    closeSettingsModal() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('show');
    }

    showToast(message, type = 'info') {
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        }
    }

    // Método para obter configurações
    static getSettings() {
        return JSON.parse(localStorage.getItem('appSettings') || '{}');
    }

    // Método para obter configuração específica
    static getSetting(key) {
        const settings = this.getSettings();
        return settings[key];
    }
}

// Instância global
const settingsManager = new SettingsManager();

// Exportar para uso global
window.settingsManager = settingsManager;
