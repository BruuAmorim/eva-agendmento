const { Sequelize } = require('sequelize');
const User = require('./User');
const Appointment = require('./Appointment');
const Integration = require('./Integration');

// Configuração do Sequelize (SQLite para desenvolvimento)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || './database.sqlite',
  logging: false, // Desabilitar logs SQL detalhados
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Inicializar modelos
const UserModel = User(sequelize);
const AppointmentModel = Appointment;
const IntegrationModel = Integration(sequelize);

// Testar conexão e sincronizar
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida via Sequelize');

    // Sincronizar modelos (criar tabelas se não existirem, sem alterar estrutura)
    await sequelize.sync({ alter: false, force: false });
    console.log('📋 Modelos sincronizados com sucesso');

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  User: UserModel,
  Appointment: AppointmentModel,
  Integration: IntegrationModel,
  initializeDatabase
};
