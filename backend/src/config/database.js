// ===========================================
// CONFIGURAÇÃO SIMPLES DO BANCO DE DADOS
// ===========================================
// Usa apenas Sequelize - sem código complexo de pool

const { Sequelize } = require('sequelize');

// Configuração do Sequelize baseada no ambiente
let sequelize;

if (process.env.DATABASE_URL) {
  // ===========================================
  // PRODUÇÃO: PostgreSQL via DATABASE_URL
  // ===========================================
  console.log('🏭 Ambiente de produção detectado - PostgreSQL');

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false, // Desabilitar logs SQL detalhados
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

} else {
  // ===========================================
  // DESENVOLVIMENTO: SQLite local
  // ===========================================
  console.log('🏠 Ambiente de desenvolvimento detectado - SQLite');

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_PATH || './database.sqlite',
    logging: false, // Desabilitar logs SQL detalhados
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

// ===========================================
// FUNÇÕES DE CONEXÃO E SINCRONIZAÇÃO
// ===========================================

async function connectDB() {
  try {
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida via Sequelize');

    // Sincronizar modelos (criar tabelas se necessário)
    await sequelize.sync({ alter: false, force: false });
    console.log('📋 Modelos sincronizados com sucesso');

    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar banco de dados:', error);
    throw error;
  }
}

// ===========================================
// EXPORTAÇÃO
// ===========================================

module.exports = {
  sequelize,
  connectDB,

  // Para compatibilidade com código que espera interface SQLite
  run: async (sql, params, callback) => {
    try {
      const result = await sequelize.query(sql, {
        replacements: params,
        type: sequelize.QueryTypes.UPDATE
      });
      if (callback) callback(null, { changes: result[0] || 0 });
      return { changes: result[0] || 0 };
    } catch (error) {
      if (callback) callback(error);
      else throw error;
    }
  },

  get: async (sql, params, callback) => {
    try {
      const result = await sequelize.query(sql, {
        replacements: params,
        type: sequelize.QueryTypes.SELECT
      });
      const row = result && result.length > 0 ? result[0] : null;
      if (callback) callback(null, row);
      return row;
    } catch (error) {
      if (callback) callback(error);
      else throw error;
    }
  },

  all: async (sql, params, callback) => {
    try {
      const result = await sequelize.query(sql, {
        replacements: params,
        type: sequelize.QueryTypes.SELECT
      });
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      if (callback) callback(error);
      else throw error;
    }
  },

  query: async (sql, params, callback) => {
    try {
      const result = await sequelize.query(sql, {
        replacements: params,
        type: sequelize.QueryTypes.RAW
      });
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      if (callback) callback(error);
      else throw error;
    }
  }
};