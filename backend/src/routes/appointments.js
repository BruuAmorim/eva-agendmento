/**
 * Rotas de Agendamentos - EvAgendamento API
 *
 * Endpoints principais para gerenciamento de agendamentos.
 * Estes endpoints são utilizados por integrações externas (n8n).
 *
 * @apiDefine AppointmentsEndpoints
 */

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

// GET /api/appointments/disponibilidade - Consultar horários disponíveis
// @api {get} /appointments/disponibilidade Consultar horários disponíveis
// @apiName GetDisponibilidade
// @apiGroup Appointments
// @apiParam {String} date Data no formato YYYY-MM-DD
// @apiSuccess {Object[]} available_times Lista de horários disponíveis
router.get('/disponibilidade', appointmentController.getDisponibilidade);

// GET /api/appointments/available/:date - Horários disponíveis para uma data
// @api {get} /appointments/available/:date Buscar horários disponíveis
// @apiName GetAvailableSlots
// @apiGroup Appointments
// @apiParam {String} date Data no formato YYYY-MM-DD
// @apiParam {Number} [duration=60] Duração em minutos
// @apiSuccess {Object[]} slots Lista de horários disponíveis
router.get('/available/:date', appointmentController.getAvailableSlots);

// GET /api/slots/:date - Alias para horários disponíveis (compatibilidade com integrações)
// @api {get} /slots/:date Buscar horários disponíveis
// @apiName GetSlots
// @apiGroup Slots
// @apiParam {String} date Data no formato YYYY-MM-DD
// @apiParam {Number} [duration=60] Duração em minutos
// @apiSuccess {Object[]} slots Lista de horários disponíveis

// GET /api/appointments/:id - Buscar agendamento específico
// @api {get} /appointments/:id Buscar agendamento por ID
// @apiName GetAppointment
// @apiGroup Appointments
// @apiParam {String} id ID do agendamento
router.get('/:id', appointmentController.getAppointmentById);

// POST /api/appointments - Criar novo agendamento
// @api {post} /appointments Criar agendamento
// @apiName CreateAppointment
// @apiGroup Appointments
// @apiParam {String} customer_name Nome do cliente
// @apiParam {String} customer_email Email do cliente
// @apiParam {String} customer_phone Telefone do cliente
// @apiParam {String} appointment_date Data (YYYY-MM-DD)
// @apiParam {String} appointment_time Horário (HH:MM)
// @apiParam {Number} [duration_minutes=60] Duração em minutos
// @apiParam {String} [notes] Observações
router.post('/', validateAppointment, appointmentController.createAppointment);

// PUT /api/appointments/:id - Atualizar agendamento
// @api {put} /appointments/:id Atualizar agendamento
// @apiName UpdateAppointment
// @apiGroup Appointments
// @apiParam {String} id ID do agendamento
// @apiParam {String} [customer_name] Nome do cliente
// @apiParam {String} [customer_email] Email do cliente
// @apiParam {String} [customer_phone] Telefone do cliente
// @apiParam {String} [appointment_date] Data (YYYY-MM-DD)
// @apiParam {String} [appointment_time] Horário (HH:MM)
// @apiParam {Number} [duration_minutes] Duração em minutos
// @apiParam {String} [notes] Observações
router.put('/:id', validateAppointment, appointmentController.updateAppointment);

// PUT /api/appointments/:id/cancel - Cancelar agendamento
router.put('/:id/cancel', appointmentController.cancelAppointment);

// PUT /api/appointments - Atualizar agendamento por protocolo (protocolo no body)
// @api {put} /appointments Atualizar agendamento por protocolo
// @apiName UpdateAppointmentByProtocolBody
// @apiGroup Appointments
// @apiParam {String} protocol Protocolo do agendamento (obrigatório)
// @apiParam {String} [date] Nova data no formato YYYY-MM-DD
// @apiParam {String} [time] Novo horário no formato HH:MM
router.put('/', appointmentController.updateAppointmentByProtocolBody);

// DELETE /api/appointments - Deletar agendamento por protocolo (protocolo no body)
// @api {delete} /appointments Excluir agendamento por protocolo
// @apiName DeleteAppointmentByProtocolBody
// @apiGroup Appointments
// @apiParam {String} protocol Protocolo do agendamento (no body da requisição)
router.delete('/', appointmentController.deleteAppointmentByProtocolBody);

// DELETE /api/appointments/:id - Deletar agendamento
// @api {delete} /appointments/:id Excluir agendamento
// @apiName DeleteAppointment
// @apiGroup Appointments
// @apiParam {String} id ID do agendamento
router.delete('/:id', appointmentController.deleteAppointment);

// DELETE /api/appointments/protocol/:protocol - Deletar agendamento por protocolo
// @api {delete} /appointments/protocol/:protocol Excluir agendamento por protocolo
// @apiName DeleteAppointmentByProtocol
// @apiGroup Appointments
// @apiParam {String} protocol Protocolo do agendamento (formato: YYYYMMDD-XXXX)
router.delete('/protocol/:protocol', appointmentController.deleteAppointmentByProtocol);

module.exports = router;



