const Appointment = require('../models/Appointment');
const WebhookService = require('../services/webhookService');

// Controller para operações de agendamento
class AppointmentController {

  // GET /api/appointments - Listar agendamentos com filtros
  async getAppointments(req, res) {
    try {
      const {
        customer_name,
        date,
        status,
        start_date,
        end_date,
        page = 1,
        limit = 50
      } = req.query;

      const filters = {};

      if (customer_name) filters.customer_name = customer_name;
      if (date) filters.date = date;
      if (status) filters.status = status;
      if (start_date && end_date) {
        filters.start_date = start_date;
        filters.end_date = end_date;
      }

      const appointments = await Appointment.find(filters);

      // Paginação
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedAppointments = appointments.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedAppointments.map(apt => apt.toJSON()),
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: appointments.length,
          total_pages: Math.ceil(appointments.length / limit)
        }
      });

    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // GET /api/appointments/:id - Buscar agendamento específico
  async getAppointmentById(req, res) {
    try {
      const { id } = req.params;

      const appointment = await Appointment.findById(id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Agendamento não encontrado'
        });
      }

      res.json({
        success: true,
        data: appointment.toJSON()
      });

    } catch (error) {
      console.error('Erro ao buscar agendamento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // GET /api/appointments/available/:date - Buscar horários disponíveis
  async getAvailableSlots(req, res) {
    try {
      const { date } = req.params;
      const { duration = 60 } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          error: 'Data é obrigatória'
        });
      }

      // Validar formato da data
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Formato de data inválido. Use YYYY-MM-DD'
        });
      }

      const availableSlots = await Appointment.getAvailableSlots(date, parseInt(duration));

      res.json({
        success: true,
        data: {
          date: date,
          available_slots: availableSlots
        }
      });

    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // POST /api/appointments - Criar novo agendamento
  async createAppointment(req, res) {
    try {
      const appointmentData = req.body;

      const appointment = await Appointment.create(appointmentData);

      // Disparar webhook para n8n (assíncrono, não bloqueia a resposta)
      WebhookService.onAppointmentCreated(appointment).catch(err => {
        console.error('Erro ao disparar webhook de criação:', err);
      });

      res.status(201).json({
        success: true,
        message: 'Agendamento criado com sucesso',
        data: appointment.toJSON()
      });

    } catch (error) {
      console.error('Erro ao criar agendamento:', error);

      if (error.message.includes('Dados inválidos') ||
          error.message.includes('Horário indisponível')) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // PUT /api/appointments/:id - Atualizar agendamento
  async updateAppointment(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const appointment = await Appointment.findById(id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Agendamento não encontrado'
        });
      }

      const updatedAppointment = await appointment.update(updateData);

      // Disparar webhook para n8n (assíncrono, não bloqueia a resposta)
      WebhookService.onAppointmentUpdated(updatedAppointment).catch(err => {
        console.error('Erro ao disparar webhook de atualização:', err);
      });

      res.json({
        success: true,
        message: 'Agendamento atualizado com sucesso',
        data: updatedAppointment.toJSON()
      });

    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);

      if (error.message.includes('Dados inválidos') ||
          error.message.includes('Novo horário indisponível')) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // PUT /api/appointments/:id/cancel - Cancelar agendamento
  async cancelAppointment(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const appointment = await Appointment.findById(id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Agendamento não encontrado'
        });
      }

      if (appointment.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          error: 'Agendamento já está cancelado'
        });
      }

      const cancelledAppointment = await appointment.cancel(reason);

      // Disparar webhook para n8n (assíncrono, não bloqueia a resposta)
      WebhookService.onAppointmentCancelled(cancelledAppointment).catch(err => {
        console.error('Erro ao disparar webhook de cancelamento:', err);
      });

      res.json({
        success: true,
        message: 'Agendamento cancelado com sucesso',
        data: cancelledAppointment.toJSON()
      });

    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // DELETE /api/appointments/:id - Deletar agendamento
  async deleteAppointment(req, res) {
    try {
      const { id } = req.params;

      const appointment = await Appointment.findById(id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Agendamento não encontrado'
        });
      }

      const appointmentId = appointment.id;
      await appointment.delete();

      // Disparar webhook para n8n (assíncrono, não bloqueia a resposta)
      WebhookService.onAppointmentDeleted(appointmentId).catch(err => {
        console.error('Erro ao disparar webhook de exclusão:', err);
      });

      res.json({
        success: true,
        message: 'Agendamento deletado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // GET /api/appointments/stats/overview - Estatísticas gerais
  async getAppointmentStats(req, res) {
    try {
      const { start_date, end_date } = req.query;

      // Verificar se deve usar armazenamento em memória
      const useMemoryStorage = () => true; // Forçado para desenvolvimento

      let appointments;

      if (useMemoryStorage()) {
        // Usar armazenamento em memória
        const Appointment = require('../models/Appointment');
        appointments = Appointment.find ? await Appointment.find() : [];
      } else {
        // Usar PostgreSQL - implementação original seria aqui
        return res.status(500).json({
          success: false,
          error: 'Modo PostgreSQL não implementado para estatísticas'
        });
      }

      // Filtrar por período se especificado
      let filteredAppointments = appointments;
      if (start_date && end_date) {
        const start = new Date(start_date);
        const end = new Date(end_date);
        filteredAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate >= start && aptDate <= end;
        });
      }

      // Calcular estatísticas
      const stats = {
        total_appointments: filteredAppointments.length,
        confirmed_appointments: filteredAppointments.filter(apt => apt.status === 'confirmed').length,
        pending_appointments: filteredAppointments.filter(apt => apt.status === 'pending').length,
        cancelled_appointments: filteredAppointments.filter(apt => apt.status === 'cancelled').length,
        completed_appointments: filteredAppointments.filter(apt => apt.status === 'completed').length
      };

      res.json({
        success: true,
        data: {
          ...stats,
          period: start_date && end_date ? { start_date, end_date } : 'all'
        }
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
}

module.exports = new AppointmentController();



