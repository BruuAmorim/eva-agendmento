// EvAgendamento - Sistema de Agendamento Inteligente
// Arquivo principal da aplicação frontend

class EvAgendamento {
    constructor() {
        this.appointments = [];
        this.availableSlots = [];
        this.selectedAppointment = null;
        this.currentTheme = localStorage.getItem('theme') || 'dark';

        this.init();
    }

    init() {
        this.bindEvents();
        this.setTheme(this.currentTheme);
        this.loadInitialData();
        this.showWelcomeMessage();
        this.checkModeratorAccess();
        this.loadCompanyInfo();
    }

    bindEvents() {
        // Toggle de tema
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Formulário de agendamento
        const appointmentForm = document.getElementById('appointmentForm');
        if (appointmentForm) {
            appointmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAppointmentSubmit(e.target);
            });
        }

        // Verificar disponibilidade
        const checkAvailabilityBtn = document.getElementById('checkAvailability');
        if (checkAvailabilityBtn) {
            checkAvailabilityBtn.addEventListener('click', () => {
                this.checkAvailability();
            });
        }

        // A data é aplicada automaticamente quando selecionada

        // Atualizar lista
        const refreshListBtn = document.getElementById('refreshList');
        if (refreshListBtn) {
            refreshListBtn.addEventListener('click', () => {
                this.loadAppointments();
            });
        }

        // Modal
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeModal();
            });
        }

        const modalCancel = document.getElementById('modalCancel');
        if (modalCancel) {
            modalCancel.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Modal de edição
        const editModalClose = document.getElementById('editModalClose');
        if (editModalClose) {
            editModalClose.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        const editModalCancel = document.getElementById('editModalCancel');
        if (editModalCancel) {
            editModalCancel.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        const editModalSave = document.getElementById('editModalSave');
        if (editModalSave) {
            editModalSave.addEventListener('click', () => {
                this.saveEditAppointment();
            });
        }

        const modalSave = document.getElementById('modalSave');
        if (modalSave) {
            modalSave.addEventListener('click', () => {
                this.saveAppointmentChanges();
            });
        }

        // Fechar modal ao clicar fora
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('appointmentModal');
            const editModal = document.getElementById('editAppointmentModal');
            const settingsModal = document.getElementById('settingsModal');
            const usersModal = document.getElementById('usersModal');
            const adminLoginModal = document.getElementById('adminLoginModal');

            if (e.target === modal) {
                this.closeModal();
            }

            if (e.target === editModal) {
                this.closeEditModal();
            }

            if (settingsModal && e.target === settingsModal) {
                settingsModal.classList.remove('show');
            }

            if (usersModal && e.target === usersModal) {
                if (window.authManager) {
                    window.authManager.closeUsersModal();
                }
            }

            // Proteger modal de login - não permitir fechar ao clicar fora se não estiver logado
            if (adminLoginModal && e.target === adminLoginModal) {
                const userDataStr = localStorage.getItem('userData');
                if (!userDataStr) {
                    // Não permitir fechar se não estiver logado
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }
        });

        // Atualizar horários disponíveis quando a data mudar
        const dateInput = document.getElementById('appointment_date');
        if (dateInput) {
            dateInput.addEventListener('change', () => {
                this.updateAvailableTimes();
            });
        }

        // Atualizar duração quando mudar
        const durationInput = document.getElementById('duration_minutes');
        if (durationInput) {
            durationInput.addEventListener('change', () => {
                this.updateAvailableTimes();
            });
        }

        // Atualizar agendamentos quando a data do filtro mudar
        const filterDateInput = document.getElementById('filterDate');
        if (filterDateInput) {
            filterDateInput.addEventListener('change', () => {
                this.loadAppointments();
            });
        }

        // Filtro de busca em tempo real
        const filtroNome = document.getElementById('filtro-nome');
        if (filtroNome) {
            filtroNome.addEventListener('keyup', () => {
                this.filterAppointmentsByName();
            });
        }
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    async loadInitialData() {
        try {
            // Verificar conexão com API (opcional - não bloqueia a aplicação)
            try {
                await API.testConnection();
            } catch (apiError) {
                // API não disponível - aplicação continua funcionando normalmente
                console.log('API não disponível - aplicação funcionará em modo offline');
            }

            // Carregar agendamentos se houver data selecionada
            const filterDate = document.getElementById('filterDate');
            if (filterDate && filterDate.value) {
                try {
                    await this.loadAppointments();
                } catch (loadError) {
                    // Erro ao carregar agendamentos - não bloqueia a aplicação
                    console.log('Não foi possível carregar agendamentos da API');
                }
            }
        } catch (error) {
            // Erro geral - apenas logar, não mostrar toast para não incomodar o usuário
            console.log('Aplicação carregada (modo offline):', error.message);
        }
    }

    async checkAvailability() {
        const date = document.getElementById('appointment_date').value;

        if (!date) {
            this.showToast('Selecione uma data primeiro', 'warning');
            return;
        }

        try {
            // Garantir que os agendamentos do dia estejam carregados antes de calcular disponibilidade
            const filterDateEl = document.getElementById('filterDate');
            if (filterDateEl && filterDateEl.value !== date) {
                filterDateEl.value = date; // YYYY-MM-DD
                await this.loadAppointments();
            }

            // Gerar horários disponíveis (8h às 18h, intervalos de 1 hora)
            const availableSlots = this.generateAvailableSlots(date);
            this.availableSlots = availableSlots;
            this.displayAvailableSlots();
            document.getElementById('availableSlots').style.display = 'block';
        } catch (error) {
            console.error('Erro ao verificar disponibilidade:', error);
            this.showToast('Erro ao verificar disponibilidade', 'error');
        }
    }

    generateAvailableSlots(selectedDate) {
        const slots = [];
        
        // Verificar regras de agendamento
        const rules = SettingsManager.getBusinessRules();
        
        // Verificar se o dia da semana está ativo
        const selectedDateObj = new Date(selectedDate);
        const dayOfWeek = selectedDateObj.getDay(); // 0 = Domingo, 1 = Segunda, etc.
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        
        const workDays = rules.workDays || {};
        if (workDays[dayName] !== true) {
            // Dia não está ativo
            return []; // Retorna array vazio - será tratado na exibição
        }

        // Obter horários de funcionamento
        const businessHours = rules.businessHours || {};
        const openingTime = businessHours.opening || '09:00';
        const closingTime = businessHours.closing || '18:00';
        const lunchStart = businessHours.lunchStart || '12:00';
        const lunchEnd = businessHours.lunchEnd || '13:00';

        // Converter horários para números
        const openingHour = parseInt(openingTime.split(':')[0]);
        const closingHour = parseInt(closingTime.split(':')[0]);
        const lunchStartHour = parseInt(lunchStart.split(':')[0]);
        const lunchEndHour = parseInt(lunchEnd.split(':')[0]);

        // Buscar agendamentos para a data selecionada
        const dateAppointments = this.appointments.filter(apt => apt.appointment_date === selectedDate);

        for (let hour = openingHour; hour < closingHour; hour++) {
            // Verificar se está dentro do intervalo de almoço
            if (hour >= lunchStartHour && hour < lunchEndHour) {
                continue; // Pular horários de almoço
            }

            const timeString = `${hour.toString().padStart(2, '0')}:00`;

            // Verificar se há conflito com agendamentos existentes
            const hasConflict = dateAppointments.some(apt => {
                const aptHour = parseInt(apt.appointment_time.split(':')[0]);
                return aptHour === hour;
            });

            if (!hasConflict) {
                slots.push({
                    time: timeString,
                    duration: 60
                });
            }
        }

        return slots;
    }

    displayAvailableSlots() {
        const container = document.getElementById('slotsContainer');
        container.innerHTML = '';

        // Verificar se o dia está ativo
        const selectedDate = document.getElementById('appointment_date').value;
        if (selectedDate) {
            const selectedDateObj = new Date(selectedDate);
            const dayOfWeek = selectedDateObj.getDay();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[dayOfWeek];
            
            const rules = SettingsManager.getBusinessRules();
            const workDays = rules.workDays || {};
            
            if (workDays[dayName] !== true) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-weight: 500;">⚠️ Não atendemos neste dia</p>';
                return;
            }
        }

        if (this.availableSlots.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Nenhum horário disponível para esta data</p>';
            return;
        }

        this.availableSlots.forEach(slot => {
            const slotBtn = document.createElement('button');
            slotBtn.className = 'slot-btn';
            slotBtn.textContent = slot.time;
            slotBtn.dataset.time = slot.time;

            slotBtn.addEventListener('click', () => {
                // Remover seleção anterior
                document.querySelectorAll('.slot-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });

                // Selecionar novo horário
                slotBtn.classList.add('selected');
                document.getElementById('appointment_time').value = slot.time;
            });

            container.appendChild(slotBtn);
        });
    }

    // Verificar se um horário específico está disponível
    isTimeSlotAvailable(date, time) {
        // Primeiro, garantir que temos os agendamentos carregados para esta data
        const dateAppointments = this.appointments.filter(apt => apt.appointment_date === date);

        // Verificar se há conflito com agendamentos existentes
        const requestedHour = parseInt(time.split(':')[0]);
        const hasConflict = dateAppointments.some(apt => {
            const aptHour = parseInt(apt.appointment_time.split(':')[0]);
            return aptHour === requestedHour;
        });

        return !hasConflict;
    }

    async updateAvailableTimes() {
        const date = document.getElementById('appointment_date').value;
        if (date) {
            // Esconder slots anteriores
            document.getElementById('availableSlots').style.display = 'none';
            // O usuário pode clicar em "Verificar Disponibilidade" quando quiser
        }
    }

    async handleAppointmentSubmit(form) {
        const formData = new FormData(form);

        // Obter instance_id do usuário logado
        const currentInstanceId = localStorage.getItem('currentInstanceId');

        const appointmentData = {
            customer_name: formData.get('customer_name'),
            customer_phone: formData.get('customer_phone'),
            service_type: formData.get('service_type') || null,
            appointment_date: formData.get('appointment_date'),
            appointment_time: formData.get('appointment_time'),
            duration_minutes: 60, // duração fixa de 1 hora
            notes: '' // sem observações
        };

        // Validação básica
        if (!appointmentData.customer_name || !appointmentData.appointment_date || !appointmentData.appointment_time) {
            this.showToast('Preencha todos os campos obrigatórios', 'warning');
            return;
        }

        // Garantir que os agendamentos estejam carregados para a data selecionada
        const filterDateEl = document.getElementById('filterDate');
        if (filterDateEl && filterDateEl.value !== appointmentData.appointment_date) {
            filterDateEl.value = appointmentData.appointment_date;
            await this.loadAppointments();
        }

        // Verificar disponibilidade do horário antes de tentar criar
        if (!this.isTimeSlotAvailable(appointmentData.appointment_date, appointmentData.appointment_time)) {
            this.showToast('Horário indisponível. Este horário já está ocupado.', 'error');
            // Recarregar disponibilidade para mostrar horários atualizados
            this.checkAvailability();
            return;
        }

        // Adicionar instance_id ao agendamento (quando a API suportar)
        if (currentInstanceId) {
            // appointmentData.instance_id = currentInstanceId;
            console.log('Criando agendamento para instância:', currentInstanceId);
        }

        try {
            const response = await API.createAppointment(appointmentData);

            // Verificar se a resposta indica sucesso
            if (response && response.success) {
                this.showToast('Agendamento criado com sucesso!', 'success');
                this.resetAppointmentForm();

                // Garantir atualização da lista após criar:
                // - padroniza o filtro de data para a mesma data criada
                // - recarrega a lista sempre
                const filterDateEl = document.getElementById('filterDate');
                if (filterDateEl && appointmentData.appointment_date) {
                    filterDateEl.value = appointmentData.appointment_date; // YYYY-MM-DD
                }
                await this.loadAppointments();
            } else {
                // Se não foi sucesso, mostrar mensagem de erro
                const errorMsg = response?.message || response?.error || 'Erro ao criar agendamento';
                this.showToast(errorMsg, 'error');
            }

        } catch (error) {
            console.error('Erro ao criar agendamento:', error);
            // Extrair mensagem de erro da resposta se disponível
            let errorMessage = 'Erro ao criar agendamento';
            if (error.message) {
                errorMessage = error.message;
            } else if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            }
            this.showToast(errorMessage, 'error');
        }
    }

    resetAppointmentForm() {
        document.getElementById('appointmentForm').reset();
        document.getElementById('availableSlots').style.display = 'none';
        document.querySelectorAll('.slot-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        this.availableSlots = [];
    }

    async loadAppointments() {
        try {
            const filters = this.getCurrentFilters();
            
            // Preparar para filtro por instância (futuro)
            // Por enquanto, vamos apenas adicionar o instance_id aos filtros se existir
            const currentInstanceId = localStorage.getItem('currentInstanceId');
            if (currentInstanceId) {
                // Quando a API suportar, adicionar filtro por instance_id
                // filters.instance_id = currentInstanceId;
                console.log('Carregando agendamentos para instância:', currentInstanceId);
            }
            
            const response = await API.getAppointments(filters);
            let appointments = response.data || [];
            
            // Filtro local por instance_id (temporário até API suportar)
            // Por enquanto, vamos apenas logar - quando os agendamentos tiverem instance_id, filtrar aqui
            if (currentInstanceId) {
                // Filtrar agendamentos por instance_id quando o campo existir
                // appointments = appointments.filter(apt => apt.instance_id === currentInstanceId);
            }
            
            this.appointments = appointments;
            this.displayAppointments();
            
            // Limpar filtro de busca ao carregar novos agendamentos
            const filtroNome = document.getElementById('filtro-nome');
            if (filtroNome) {
                filtroNome.value = '';
            }
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            this.showToast('Erro ao carregar agendamentos', 'error');
        }
    }


    getCurrentFilters() {
        const filters = {};

        const filterDate = document.getElementById('filterDate').value;
        if (filterDate) {
            filters.date = filterDate;
        } else {
            // Se não há data selecionada, não mostrar nenhum agendamento
            filters.date = null;
        }

        return filters;
    }


    displayAppointments() {
        const listaContainer = document.getElementById('lista-agendamentos');
        
        if (!listaContainer) {
            console.error('Container lista-agendamentos não encontrado');
            return;
        }

        // Limpar container
        listaContainer.innerHTML = '';

        const filterDate = document.getElementById('filterDate').value;

        if (!filterDate) {
            listaContainer.innerHTML = `
                <div class="no-appointments-message">
                    <p>📅 Selecione uma data para visualizar os agendamentos</p>
                </div>
            `;
            return;
        }

        if (this.appointments.length === 0) {
            listaContainer.innerHTML = `
                <div class="no-appointments-message">
                    <p>📭 Nenhum agendamento encontrado para ${new Date(filterDate).toLocaleDateString('pt-BR')}</p>
                </div>
            `;
            return;
        }

        // Renderizar agendamentos na nova lista
        this.appointments.forEach(appointment => {
            const listItem = this.createAppointmentListItem(appointment);
            listaContainer.appendChild(listItem);
        });
    }

    createAppointmentListItem(appointment) {
        const div = document.createElement('div');
        div.className = 'appointment-list-item';
        div.dataset.id = appointment.id;
        div.dataset.name = appointment.customer_name.toLowerCase();

        const time = appointment.appointment_time;
        const phone = appointment.customer_phone || 'Sem telefone';
        const protocol = appointment.protocol || 'N/A';

        div.innerHTML = `
            <div class="appointment-list-time">${time}</div>
            <div class="appointment-list-info">
                <div class="appointment-list-name">${appointment.customer_name} <small style="color: var(--text-muted); font-weight: normal;">(${protocol})</small></div>
                <div class="appointment-list-phone">${phone}</div>
            </div>
            <div class="appointment-list-actions">
                <button class="btn-edit" data-id="${appointment.id}" title="Editar">✏️</button>
                <button class="btn-delete" data-id="${appointment.id}" title="Excluir">🗑️</button>
            </div>
        `;

        // Prevenir propagação do clique nos botões
        const editBtn = div.querySelector('.btn-edit');
        const deleteBtn = div.querySelector('.btn-delete');

        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editAppointment(appointment.id);
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteAppointment(appointment.id);
        });

        // Adicionar evento de clique no item (exceto nos botões)
        div.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn-edit') && !e.target.classList.contains('btn-delete')) {
                const fullAppointment = this.appointments.find(apt => apt.id === appointment.id);
                if (fullAppointment) {
                    this.openAppointmentModal(fullAppointment);
                }
            }
        });

        return div;
    }

    filterAppointmentsByName() {
        const filtroInput = document.getElementById('filtro-nome');
        if (!filtroInput) return;

        const searchTerm = filtroInput.value.toLowerCase().trim();
        const listItems = document.querySelectorAll('.appointment-list-item');

        if (searchTerm === '') {
            // Mostrar todos os itens
            listItems.forEach(item => {
                item.classList.remove('hidden');
            });
        } else {
            // Filtrar itens
            listItems.forEach(item => {
                const name = item.dataset.name || '';
                if (name.includes(searchTerm)) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });

            // Verificar se há itens visíveis
            const visibleItems = Array.from(listItems).filter(item => !item.classList.contains('hidden'));
            const listaContainer = document.getElementById('lista-agendamentos');
            
            // Se não houver itens visíveis, mostrar mensagem
            if (visibleItems.length === 0 && listaContainer) {
                const existingMessage = listaContainer.querySelector('.no-appointments-message');
                if (!existingMessage) {
                    const message = document.createElement('div');
                    message.className = 'no-appointments-message';
                    message.innerHTML = '<p>Nenhum agendamento encontrado</p>';
                    listaContainer.appendChild(message);
                }
            } else {
                // Remover mensagem se houver itens visíveis
                const existingMessage = listaContainer.querySelector('.no-appointments-message');
                if (existingMessage) {
                    existingMessage.remove();
                }
            }
        }
    }

    createAppointmentElement(appointment) {
        const div = document.createElement('div');
        div.className = 'appointment-item';
        div.dataset.id = appointment.id;

        const time = appointment.appointment_time;

        div.innerHTML = `
            <div class="appointment-info">
                <h4>${appointment.customer_name}</h4>
                <p>${time} - ${appointment.customer_phone || 'Sem telefone'}</p>
            </div>
            <div class="appointment-actions">
                <button class="action-btn edit" title="Editar" onclick="app.editAppointment('${appointment.id}')">
                    ✏️
                </button>
                <button class="action-btn cancel" title="Cancelar" onclick="app.cancelAppointment('${appointment.id}')">
                    ❌
                </button>
                <button class="action-btn delete" title="Excluir" onclick="app.deleteAppointment('${appointment.id}')">
                    🗑️
                </button>
            </div>
        `;

        // Adicionar evento de clique para abrir modal
        div.addEventListener('click', (e) => {
            if (!e.target.classList.contains('action-btn')) {
                this.openAppointmentModal(appointment);
            }
        });

        return div;
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Pendente',
            'confirmed': 'Confirmado',
            'cancelled': 'Cancelado',
            'completed': 'Concluído'
        };
        return statusMap[status] || status;
    }

    async editAppointment(id) {
        const appointment = this.appointments.find(apt => apt.id === id);
        if (appointment) {
            this.openEditAppointmentModal(appointment);
        }
    }

    openEditAppointmentModal(appointment) {
        this.selectedAppointment = appointment;

        // Preencher campos do modal
        document.getElementById('editCustomerName').value = appointment.customer_name || '';
        document.getElementById('editCustomerPhone').value = appointment.customer_phone || '';
        document.getElementById('editAppointmentDate').value = appointment.appointment_date || '';
        document.getElementById('editAppointmentTime').value = appointment.appointment_time || '';

        // Abrir modal
        const modal = document.getElementById('editAppointmentModal');
        modal.classList.add('show');

        // Focar no primeiro campo
        document.getElementById('editCustomerName').focus();
    }

    async cancelAppointment(id) {
        if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
        try {
            await API.cancelAppointment(id);
            this.showToast('Agendamento cancelado com sucesso', 'success');
            await this.loadAppointments();
        } catch (error) {
            console.error('Erro ao cancelar agendamento:', error);
            this.showToast('Erro ao cancelar agendamento', 'error');
        }
        }
    }

    async deleteAppointment(id) {
        if (confirm('Tem certeza que deseja excluir este agendamento permanentemente?')) {
        try {
            await API.deleteAppointment(id);
            this.showToast('Agendamento excluído com sucesso', 'success');
            await this.loadAppointments();
        } catch (error) {
            console.error('Erro ao excluir agendamento:', error);
            this.showToast('Erro ao excluir agendamento', 'error');
        }
        }
    }

    openAppointmentModal(appointment, editMode = false) {
        this.selectedAppointment = appointment;

        const modal = document.getElementById('appointmentModal');
        const modalBody = document.getElementById('modalBody');

        modalBody.innerHTML = this.createAppointmentModalContent(appointment, editMode);
        modal.classList.add('show');

        // Se estiver em modo de edição, configurar eventos
        if (editMode) {
            this.setupEditMode();
        }
    }

    createAppointmentModalContent(appointment, editMode) {
        const date = new Date(appointment.appointment_date).toLocaleDateString('pt-BR');
        const created = new Date(appointment.created_at).toLocaleString('pt-BR');

        if (editMode) {
            return `
                <form id="editAppointmentForm">
                    <div class="form-group">
                        <label for="edit_customer_name">Nome do Cliente</label>
                        <input type="text" id="edit_customer_name" name="customer_name" value="${appointment.customer_name}" required>
                    </div>

                    <div class="form-group">
                        <label for="edit_customer_phone">Telefone</label>
                        <input type="tel" id="edit_customer_phone" name="customer_phone" value="${appointment.customer_phone || ''}">
                    </div>

                    <div class="form-group">
                        <label for="edit_appointment_date">Data</label>
                        <input type="date" id="edit_appointment_date" name="appointment_date" value="${appointment.appointment_date}" required>
                    </div>

                    <div class="form-group">
                        <label for="edit_appointment_time">Horário</label>
                        <input type="time" id="edit_appointment_time" name="appointment_time" value="${appointment.appointment_time}" required>
                    </div>
                </form>
            `;
        } else {
            return `
                <div class="appointment-details">
                    <div class="detail-row">
                        <strong>Cliente:</strong> ${appointment.customer_name}
                    </div>
                    <div class="detail-row">
                        <strong>Telefone:</strong> ${appointment.customer_phone || 'Não informado'}
                    </div>
                    <div class="detail-row">
                        <strong>Data:</strong> ${date}
                    </div>
                    <div class="detail-row">
                        <strong>Horário:</strong> ${appointment.appointment_time}
                    </div>
                    <div class="detail-row">
                        <strong>Criado em:</strong> ${created}
                    </div>
                </div>
            `;
        }
    }

    setupEditMode() {
        // Configurar validação em tempo real para campos de edição
        const form = document.getElementById('editAppointmentForm');
        if (form) {
            form.addEventListener('input', (e) => {
                // Validação básica pode ser adicionada aqui
            });
        }
    }

    closeModal() {
        const modal = document.getElementById('appointmentModal');
        modal.classList.remove('show');
        this.selectedAppointment = null;
    }

    closeEditModal() {
        const modal = document.getElementById('editAppointmentModal');
        modal.classList.remove('show');
        this.selectedAppointment = null;
    }

    async saveEditAppointment() {
        const form = document.getElementById('editAppointmentForm');
        const appointmentId = form?.dataset.appointmentId;

        if (!appointmentId) {
            this.showToast('Erro: ID do agendamento não encontrado', 'error');
            return;
        }

        const updateData = {
            customer_name: document.getElementById('editCustomerName').value,
            customer_phone: document.getElementById('editCustomerPhone').value,
            appointment_date: document.getElementById('editAppointmentDate').value,
            appointment_time: document.getElementById('editAppointmentTime').value,
            duration_minutes: 60 // manter duração padrão
        };

        try {
            const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                this.showToast('Agendamento atualizado com sucesso!', 'success');
                this.closeEditModal();
                // Atualizar lista em tempo real
                await this.loadAppointments();
            } else {
                const errorData = await response.json();
                this.showToast(errorData.message || 'Erro ao atualizar agendamento', 'error');
            }
        } catch (error) {
            console.error('Erro ao atualizar agendamento:', error);
            this.showToast('Erro ao atualizar agendamento', 'error');
        }
    }

    async saveAppointmentChanges() {
        if (!this.selectedAppointment) return;

        const form = document.getElementById('editAppointmentForm');
        if (!form) return;

        const formData = new FormData(form);
        const updateData = {
            customer_name: formData.get('customer_name'),
            customer_phone: formData.get('customer_phone'),
            appointment_date: formData.get('appointment_date'),
            appointment_time: formData.get('appointment_time'),
            duration_minutes: 60 // duração fixa
        };

        try {
            await API.updateAppointment(this.selectedAppointment.id, updateData);
            this.showToast('Agendamento atualizado com sucesso', 'success');
            this.closeModal();
            await this.loadAppointments();
        } catch (error) {
            console.error('Erro ao atualizar agendamento:', error);
            this.showToast(error.message || 'Erro ao atualizar agendamento', 'error');
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = this.getToastIcon(type);

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        toastContainer.appendChild(toast);

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    getToastIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    showWelcomeMessage() {
        setTimeout(() => {
            this.showToast('Bem-vindo ao EvAgendamento! Sistema de agendamento inteligente.', 'info');
        }, 1000);
    }

    // Editar agendamento
    editAppointment(appointmentId) {
        const appointment = this.appointments.find(apt => apt.id === appointmentId);
        if (!appointment) {
            this.showToast('Agendamento não encontrado', 'error');
            return;
        }

        // Preencher modal de edição
        document.getElementById('editCustomerName').value = appointment.customer_name;
        document.getElementById('editCustomerPhone').value = appointment.customer_phone || '';
        document.getElementById('editAppointmentDate').value = appointment.appointment_date;
        document.getElementById('editAppointmentTime').value = appointment.appointment_time;

        // Armazenar ID do agendamento sendo editado
        document.getElementById('editAppointmentForm').dataset.appointmentId = appointmentId;

        // Abrir modal de edição
        document.getElementById('editAppointmentModal').classList.add('show');
    }

    // Excluir agendamento
    async deleteAppointment(appointmentId) {
        if (!confirm('Tem certeza que deseja excluir este agendamento?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                // Remover da lista local
                this.appointments = this.appointments.filter(apt => apt.id !== appointmentId);

                // Atualizar exibição
                this.displayAppointments();

                this.showToast('Agendamento excluído com sucesso!', 'success');
            } else {
                const errorData = await response.json();
                this.showToast(errorData.message || 'Erro ao excluir agendamento', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir agendamento:', error);
            this.showToast('Erro ao excluir agendamento', 'error');
        }
    }

    // ========== FUNCIONALIDADES DO MODERADOR ==========

    /**
     * Verifica se o usuário logado é moderador e mostra botão de configurações
     */
    checkModeratorAccess() {
        const user = window.authManager?.currentUser;
        if (user && user.role === 'moderator') {
            this.showModeratorSettingsButton();
        }
    }

    /**
     * Mostra o botão flutuante de configurações para moderadores
     */
    showModeratorSettingsButton() {
        // Criar botão flutuante
        const settingsButton = document.createElement('button');
        settingsButton.id = 'moderatorSettingsBtn';
        settingsButton.innerHTML = '⚙️';
        settingsButton.title = 'Configurações do Moderador';
        settingsButton.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0099ff, #007acc);
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0, 153, 255, 0.4);
            z-index: 1000;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Efeitos hover
        settingsButton.onmouseover = () => {
            settingsButton.style.transform = 'scale(1.1)';
            settingsButton.style.boxShadow = '0 6px 25px rgba(0, 153, 255, 0.6)';
        };
        settingsButton.onmouseout = () => {
            settingsButton.style.transform = 'scale(1)';
            settingsButton.style.boxShadow = '0 4px 20px rgba(0, 153, 255, 0.4)';
        };

        // Event listener
        settingsButton.addEventListener('click', () => {
            this.openModeratorSettingsModal();
        });

        // Adicionar ao DOM
        document.body.appendChild(settingsButton);

        console.log('🎛️ Botão de configurações do moderador adicionado');
    }

    /**
     * Abre o modal de configurações do moderador
     */
    async openModeratorSettingsModal() {
        try {
            // Buscar dados atuais
            const statsResponse = await window.authManager.apiRequest('/api/moderator/stats');
            const settingsResponse = await window.authManager.apiRequest('/api/moderator/settings');

            const stats = statsResponse.success ? statsResponse.data : null;
            const settings = settingsResponse.success ? settingsResponse.data : { company_name: '', services: [] };

            // Criar modal
            this.createModeratorSettingsModal(stats, settings);

        } catch (error) {
            console.error('Erro ao carregar configurações do moderador:', error);
            this.showToast('Erro ao carregar configurações', 'error');
        }
    }

    /**
     * Cria e exibe o modal de configurações do moderador
     */
    createModeratorSettingsModal(stats, settings) {
        // Criar overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
        `;

        // Criar modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            position: relative;
        `;

        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #333; font-size: 1.5rem;">⚙️ Configurações do Moderador</h2>
                <button id="closeModeratorModal" style="
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                    padding: 5px;
                ">×</button>
            </div>

            <!-- Dashboard Rápido -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 1.2rem;">📊 Dashboard Rápido</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 2rem; font-weight: bold; color: #0099ff;">${stats?.total_today || 0}</div>
                        <div style="color: #666; font-size: 0.9rem;">Agendamentos Hoje</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: #28a745;">${stats?.top_service || 'Nenhum'}</div>
                        <div style="color: #666; font-size: 0.9rem;">Serviço Top</div>
                    </div>
                </div>
            </div>

            <!-- Configurações da Empresa -->
            <div>
                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 1.2rem;">🏢 Configurações da Empresa</h3>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                        Nome da Empresa
                    </label>
                    <input
                        type="text"
                        id="companyNameInput"
                        placeholder="Digite o nome da empresa"
                        value="${settings.company_name || ''}"
                        style="
                            width: 100%;
                            padding: 12px;
                            border: 1px solid #ddd;
                            border-radius: 6px;
                            font-size: 1rem;
                            box-sizing: border-box;
                        "
                    >
                </div>

                <div style="margin-bottom: 25px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                        Serviços Disponíveis
                    </label>
                    <div id="servicesContainer" style="margin-bottom: 10px;">
                        ${this.renderServicesList(settings.services || [])}
                    </div>
                    <button
                        id="addServiceBtn"
                        style="
                            background: #28a745;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 0.9rem;
                        "
                    >
                        ➕ Adicionar Serviço
                    </button>
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button
                        id="cancelModeratorSettings"
                        style="
                            background: #6c757d;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 1rem;
                        "
                    >
                        Cancelar
                    </button>
                    <button
                        id="saveModeratorSettings"
                        style="
                            background: #0099ff;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 1rem;
                        "
                    >
                        💾 Salvar
                    </button>
                </div>
            </div>
        `;

        // Event listeners
        modal.querySelector('#closeModeratorModal').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        modal.querySelector('#cancelModeratorSettings').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        modal.querySelector('#saveModeratorSettings').addEventListener('click', async () => {
            await this.saveModeratorSettings();
            document.body.removeChild(overlay);
        });

        modal.querySelector('#addServiceBtn').addEventListener('click', () => {
            this.addServiceInput();
        });

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    /**
     * Renderiza a lista de serviços como inputs editáveis
     */
    renderServicesList(services) {
        return services.map((service, index) => `
            <div style="display: flex; gap: 10px; margin-bottom: 8px; align-items: center;" class="service-item">
                <input
                    type="text"
                    value="${service}"
                    placeholder="Nome do serviço"
                    style="
                        flex: 1;
                        padding: 8px 12px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 0.9rem;
                    "
                    data-index="${index}"
                >
                <button
                    class="remove-service-btn"
                    style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 0.9rem;
                    "
                    data-index="${index}"
                >
                    🗑️
                </button>
            </div>
        `).join('');
    }

    /**
     * Adiciona um novo input de serviço
     */
    addServiceInput() {
        const container = document.getElementById('servicesContainer');
        const newServiceDiv = document.createElement('div');
        newServiceDiv.style.cssText = 'display: flex; gap: 10px; margin-bottom: 8px; align-items: center;';
        newServiceDiv.className = 'service-item';
        newServiceDiv.innerHTML = `
            <input
                type="text"
                placeholder="Nome do serviço"
                style="
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 0.9rem;
                "
            >
            <button
                class="remove-service-btn"
                style="
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9rem;
                "
            >
                🗑️
            </button>
        `;

        container.appendChild(newServiceDiv);

        // Event listener para remover
        newServiceDiv.querySelector('.remove-service-btn').addEventListener('click', function() {
            this.closest('.service-item').remove();
        });
    }

    /**
     * Salva as configurações do moderador
     */
    async saveModeratorSettings() {
        try {
            const companyName = document.getElementById('companyNameInput').value.trim();

            // Coletar serviços
            const serviceInputs = document.querySelectorAll('#servicesContainer input[type="text"]');
            const services = Array.from(serviceInputs)
                .map(input => input.value.trim())
                .filter(service => service.length > 0);

            const settingsData = {
                company_name: companyName || null,
                services: services
            };

            const response = await window.authManager.apiRequest('/api/moderator/settings', {
                method: 'PUT',
                body: JSON.stringify(settingsData)
            });

            if (response.success) {
                this.showToast('Configurações salvas com sucesso!', 'success');
                // Atualizar título da página se necessário
                this.updateCompanyTitle(companyName);
            } else {
                // Tentar extrair mensagem mais detalhada do erro
                let errorMessage = response.message || response.details || 'Erro ao salvar configurações';

                // Se for erro relacionado à tabela não existir
                if (errorMessage.includes('configuração do banco') || errorMessage.includes('tabela')) {
                    errorMessage = 'Banco de dados não configurado. Contate o administrador.';
                }

                this.showToast(errorMessage, 'error');
            }

        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            // Tentar extrair mensagem mais detalhada do erro
            let errorMessage = 'Erro ao salvar configurações';
            if (error.message && error.message.includes('JSON')) {
                errorMessage = 'Erro de comunicação com o servidor. Tente novamente.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            this.showToast(errorMessage, 'error');
        }
    }

    /**
     * Atualiza o título da página com o nome da empresa
     */
    updateCompanyTitle(companyName) {
        if (companyName) {
            document.title = `${companyName} - EvAgendamento`;
            // Atualizar também o título no header se existir
            const headerTitle = document.querySelector('.header-title span');
            if (headerTitle) {
                headerTitle.textContent = companyName;
            }
        } else {
            document.title = 'Sistema de Agendamentos - EvAgendamento';
            const headerTitle = document.querySelector('.header-title span');
            if (headerTitle) {
                headerTitle.textContent = 'Sistema de Agendamentos';
            }
        }
    }

    /**
     * Carrega informações da empresa (nome e serviços)
     */
    async loadCompanyInfo() {
        try {
            const response = await window.authManager.apiRequest('/api/moderator/company-info');
            if (response.success && response.data) {
                const { company_name, services } = response.data;

                // Atualizar título da página
                this.updateCompanyTitle(company_name);

                // Carregar serviços no dropdown
                this.populateServicesDropdown(services);

                console.log('🏢 Informações da empresa carregadas:', { company_name, services_count: services.length });
            }
        } catch (error) {
            console.warn('Erro ao carregar informações da empresa:', error.message);
            // Usar valores padrão se não conseguir carregar
            this.populateServicesDropdown([]);
        }
    }

    /**
     * Preenche o dropdown de serviços
     */
    populateServicesDropdown(services) {
        const serviceSelect = document.getElementById('serviceType');
        if (!serviceSelect) return;

        // Limpar opções existentes (exceto a primeira)
        while (serviceSelect.options.length > 1) {
            serviceSelect.remove(1);
        }

        // Adicionar serviços
        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service;
            option.textContent = service;
            serviceSelect.appendChild(option);
        });

        // Adicionar opção "Outro" se houver serviços
        if (services.length > 0) {
            const otherOption = document.createElement('option');
            otherOption.value = 'Outro';
            otherOption.textContent = 'Outro (especificar em observações)';
            serviceSelect.appendChild(otherOption);
        }

        console.log(`📋 Dropdown de serviços populado com ${services.length} opções`);
    }
}

// Inicializar aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EvAgendamento();
});
