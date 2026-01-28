const { query } = require('../config/database');

/**
 * Controller para funcionalidades do perfil Moderador
 * Gerencia configurações da empresa e estatísticas rápidas
 */
class ModeratorController {

  /**
   * GET /api/moderator/stats
   * Retorna estatísticas rápidas do dia para o moderador
   */
  async getStats(req, res) {
    try {
      console.log('📊 getStats - Iniciando para usuário:', req.user?.id, req.user?.role);

      // Verificar se usuário é moderador
      const user = req.user; // Supondo que vem do middleware de auth
      if (!user || user.role !== 'moderator') {
        console.log('❌ getStats - Acesso negado:', { userId: user?.id, role: user?.role });
        return res.status(403).json({
          success: false,
          error: 'Acesso negado',
          message: 'Esta funcionalidade é restrita a moderadores'
        });
      }

      const today = new Date().toISOString().split('T')[0];
      console.log('📅 getStats - Data de hoje:', today);

      // Query para total de agendamentos do dia
      const todayQuery = `
        SELECT COUNT(*) as total
        FROM appointments
        WHERE appointment_date = $1::date
          AND status != 'cancelled'
      `;

      // Query para serviço mais popular do dia
      const topServiceQuery = `
        SELECT
          COALESCE(service_type, 'Serviço Geral') as service,
          COUNT(*) as count
        FROM appointments
        WHERE appointment_date = $1::date
          AND status != 'cancelled'
          AND (service_type IS NOT NULL OR service_type != '')
        GROUP BY COALESCE(service_type, 'Serviço Geral')
        ORDER BY count DESC
        LIMIT 1
      `;

      console.log('🔍 getStats - Executando queries...');

      const [todayResult, topServiceResult] = await Promise.all([
        query(todayQuery, [today]),
        query(topServiceQuery, [today])
      ]);

      console.log('📊 getStats - Resultados:', {
        todayCount: todayResult.rows[0]?.total || 0,
        topServiceCount: topServiceResult.rows.length
      });

      const totalToday = parseInt(todayResult.rows[0].total);
      const topService = topServiceResult.rows.length > 0 ?
        topServiceResult.rows[0] : { service: 'Nenhum agendamento', count: 0 };

      console.log('✅ getStats - Retornando dados:', { totalToday, topService: topService.service });

      res.json({
        success: true,
        data: {
          total_today: totalToday,
          top_service: topService.service,
          top_service_count: topService.count
        }
      });

    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas do moderador:', {
        message: error.message,
        stack: error.stack,
        userId: req.user?.id
      });
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível carregar as estatísticas',
        details: error.message
      });
    }
  }

  /**
   * GET /api/moderator/settings
   * Busca configurações da empresa do moderador
   */
  async getSettings(req, res) {
    try {
      console.log('⚙️ getSettings - Iniciando para usuário:', req.user?.id, req.user?.role);

      const user = req.user;
      if (!user || user.role !== 'moderator') {
        console.log('❌ getSettings - Acesso negado:', { userId: user?.id, role: user?.role });
        return res.status(403).json({
          success: false,
          error: 'Acesso negado',
          message: 'Esta funcionalidade é restrita a moderadores'
        });
      }

      console.log('🔍 getSettings - Buscando configurações para user_id:', user.id);

      const settingsQuery = `
        SELECT company_name, services, created_at, updated_at
        FROM moderator_settings
        WHERE user_id = $1
      `;

      const result = await query(settingsQuery, [user.id]);
      console.log('📊 getSettings - Query executada, resultados:', result.rows.length);

      let settings = {
        company_name: null,
        services: []
      };

      if (result.rows.length > 0) {
        const row = result.rows[0];
        console.log('📋 getSettings - Dados encontrados:', {
          company_name: row.company_name,
          services_type: typeof row.services,
          services_length: Array.isArray(row.services) ? row.services.length : 'N/A'
        });

        settings = {
          company_name: row.company_name,
          services: Array.isArray(row.services) ? row.services : []
        };
      } else {
        console.log('📋 getSettings - Nenhum registro encontrado, retornando padrão');
      }

      console.log('✅ getSettings - Retornando:', settings);
      res.json({
        success: true,
        data: settings
      });

    } catch (error) {
      console.error('Erro ao buscar configurações do moderador:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível carregar as configurações'
      });
    }
  }

  /**
   * PUT /api/moderator/settings
   * Atualiza configurações da empresa do moderador
   */
  async updateSettings(req, res) {
    try {
      console.log('🔧 updateSettings - Iniciando para usuário:', req.user?.id);

      const user = req.user;
      if (!user || user.role !== 'moderator') {
        console.log('❌ updateSettings - Acesso negado:', { userId: user?.id, role: user?.role });
        return res.status(403).json({
          success: false,
          error: 'Acesso negado',
          message: 'Esta funcionalidade é restrita a moderadores'
        });
      }

      const { company_name, services } = req.body;
      console.log('📝 updateSettings - Dados recebidos:', { company_name, services_count: services?.length });

      // Validar dados
      if (typeof company_name !== 'string' && company_name !== null) {
        console.log('❌ updateSettings - company_name inválido:', typeof company_name);
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          message: 'Nome da empresa deve ser uma string ou null'
        });
      }

      if (!Array.isArray(services)) {
        console.log('❌ updateSettings - services não é array:', typeof services);
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          message: 'Serviços deve ser um array'
        });
      }

      // Verificar se já existe configuração para este usuário
      console.log('🔍 updateSettings - Verificando se configuração existe...');
      const checkQuery = 'SELECT id FROM moderator_settings WHERE user_id = $1';
      const checkResult = await query(checkQuery, [user.id]);
      console.log('📊 updateSettings - Configuração existe:', checkResult.rows.length > 0);

      if (checkResult.rows.length > 0) {
        // Atualizar configuração existente
        console.log('📝 updateSettings - Atualizando configuração existente...');
        const updateQuery = `
          UPDATE moderator_settings
          SET company_name = $1, services = $2, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $3
          RETURNING company_name, services
        `;
        const updateResult = await query(updateQuery, [company_name, JSON.stringify(services), user.id]);
        console.log('✅ updateSettings - Configuração atualizada');

        res.json({
          success: true,
          data: {
            company_name: updateResult.rows[0].company_name,
            services: updateResult.rows[0].services
          },
          message: 'Configurações atualizadas com sucesso'
        });

      } else {
        // Criar nova configuração
        console.log('📝 updateSettings - Criando nova configuração...');
        const insertQuery = `
          INSERT INTO moderator_settings (user_id, company_name, services)
          VALUES ($1, $2, $3)
          RETURNING company_name, services
        `;
        const insertResult = await query(insertQuery, [user.id, company_name, JSON.stringify(services)]);
        console.log('✅ updateSettings - Configuração criada');

        res.json({
          success: true,
          data: {
            company_name: insertResult.rows[0].company_name,
            services: insertResult.rows[0].services
          },
          message: 'Configurações criadas com sucesso'
        });
      }

    } catch (error) {
      console.error('❌ ERRO GRAVE AO SALVAR CONFIGURAÇÕES:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        stack: error.stack,
        userId: req.user?.id,
        body: req.body
      });

      // Verificar se é erro relacionado à tabela não existir
      if (error.message && error.message.includes('relation "moderator_settings" does not exist')) {
        console.error('🚨 Tabela moderator_settings não existe! Execute: node setup_moderator_table.js');
        return res.status(500).json({
          success: false,
          error: 'Configuração do banco de dados',
          message: 'Tabela de configurações não encontrada. Execute o script de setup.',
          details: 'Execute: node setup_moderator_table.js'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível salvar as configurações',
        details: error.message
      });
    }
  }

  /**
   * GET /api/moderator/company-info
   * Retorna informações públicas da empresa (para uso no frontend do cliente)
   */
  async getCompanyInfo(req, res) {
    try {
      // Tentar buscar informações da empresa
      let companyInfo = {
        company_name: null,
        services: []
      };

      try {
        // Por enquanto, retorna informações do primeiro moderador encontrado
        // Em produção, pode ser baseado em domínio ou configuração global
        const companyQuery = `
          SELECT ms.company_name, ms.services
          FROM moderator_settings ms
          JOIN users u ON ms.user_id = u.id
          WHERE u.role = 'moderator' AND u."isActive" = true
          LIMIT 1
        `;

        const result = await query(companyQuery);

        if (result.rows.length > 0) {
          companyInfo = {
            company_name: result.rows[0].company_name,
            services: Array.isArray(result.rows[0].services) ? result.rows[0].services : []
          };
        }
      } catch (dbError) {
        // Se a tabela não existir ainda, retorna valores padrão
        console.warn('Tabela moderator_settings não encontrada, usando valores padrão:', dbError.message);
      }

      res.json({
        success: true,
        data: companyInfo
      });

    } catch (error) {
      console.error('Erro ao buscar informações da empresa:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível carregar as informações da empresa'
      });
    }
  }
}

module.exports = new ModeratorController();
