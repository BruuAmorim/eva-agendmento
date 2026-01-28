/**
 * Rotas do Moderador - EvAgendamento API
 *
 * Endpoints para gerenciamento de configurações da empresa
 * e estatísticas rápidas do moderador.
 */

const express = require('express');
const router = express.Router();
const moderatorController = require('../controllers/moderatorController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Middleware específico para moderadores
const requireModerator = requireRole(['moderator']);

/**
 * @api {get} /moderator/stats Estatísticas rápidas
 * @apiName GetModeratorStats
 * @apiGroup Moderator
 * @apiDescription Retorna total de agendamentos do dia e serviço mais popular
 * @apiHeader {String} Authorization Bearer token
 * @apiSuccess {Object} data Estatísticas do dia
 * @apiSuccess {Number} data.total_today Total de agendamentos hoje
 * @apiSuccess {String} data.top_service Serviço mais popular
 */
router.get('/stats', verifyToken, requireModerator, moderatorController.getStats);

/**
 * @api {get} /moderator/settings Buscar configurações
 * @apiName GetModeratorSettings
 * @apiGroup Moderator
 * @apiDescription Busca configurações da empresa do moderador
 * @apiHeader {String} Authorization Bearer token
 * @apiSuccess {Object} data Configurações da empresa
 * @apiSuccess {String} data.company_name Nome da empresa
 * @apiSuccess {Array} data.services Lista de serviços
 */
router.get('/settings', verifyToken, requireModerator, moderatorController.getSettings);

/**
 * @api {put} /moderator/settings Atualizar configurações
 * @apiName UpdateModeratorSettings
 * @apiGroup Moderator
 * @apiDescription Atualiza configurações da empresa do moderador
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {String} [company_name] Nome da empresa
 * @apiParam {Array} [services] Lista de serviços
 * @apiSuccess {Object} data Configurações atualizadas
 */
router.put('/settings', verifyToken, requireModerator, moderatorController.updateSettings);

/**
 * @api {get} /moderator/company-info Informações públicas da empresa
 * @apiName GetCompanyInfo
 * @apiGroup Moderator
 * @apiDescription Retorna informações públicas da empresa (para frontend do cliente)
 * @apiSuccess {Object} data Informações da empresa
 * @apiSuccess {String} data.company_name Nome da empresa
 * @apiSuccess {Array} data.services Lista de serviços disponíveis
 */
router.get('/company-info', moderatorController.getCompanyInfo); // Rota pública

module.exports = router;
