const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Middleware de validação para criação/atualização
const validateAppointment = (req, res, next) => {
  const { customer_name, appointment_date, appointment_time } = req.body;

  const errors = [];

  if (req.method === 'POST' || (req.method === 'PUT' && customer_name !== undefined)) {
    if (!customer_name || customer_name.trim().length < 2) {
      errors.push('Nome do cliente é obrigatório e deve ter pelo menos 2 caracteres');
    }
  }

  if (req.method === 'POST' || (req.method === 'PUT' && appointment_date !== undefined)) {
    if (!appointment_date) {
      errors.push('Data do agendamento é obrigatória');
    }
  }

  if (req.method === 'POST' || (req.method === 'PUT' && appointment_time !== undefined)) {
    if (!appointment_time) {
      errors.push('Horário do agendamento é obrigatório');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      message: errors.join(', ')
    });
  }

  next();
};

// Rotas principais da API

// GET /api/appointments - Listar agendamentos com filtros
router.get('/', appointmentController.getAppointments);

// GET /api/appointments/stats/overview - Estatísticas dos agendamentos
router.get('/stats/overview', appointmentController.getAppointmentStats);

// GET /api/appointments/available/:date - Horários disponíveis para uma data
router.get('/available/:date', appointmentController.getAvailableSlots);

// GET /api/appointments/:id - Buscar agendamento específico
router.get('/:id', appointmentController.getAppointmentById);

// POST /api/appointments - Criar novo agendamento
router.post('/', validateAppointment, appointmentController.createAppointment);

// PUT /api/appointments/:id - Atualizar agendamento
router.put('/:id', validateAppointment, appointmentController.updateAppointment);

// PUT /api/appointments/:id/cancel - Cancelar agendamento
router.put('/:id/cancel', appointmentController.cancelAppointment);

// DELETE /api/appointments/:id - Deletar agendamento
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;



