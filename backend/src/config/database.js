const { Pool } = require('pg');
const SeedService = require('../services/seedService');

// Configuração da conexão com PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'evagendamento',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Máximo de conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Event listeners para monitoramento
pool.on('connect', (client) => {
  console.log('🔗 Nova conexão estabelecida com o banco de dados');
});

pool.on('error', (err, client) => {
  console.error('❌ Erro inesperado no pool de conexões:', err);
  process.exit(-1);
});

// Função para conectar ao banco
async function connectDB() {
  try {
    const client = await pool.connect();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso');

    // Criar tabelas se não existirem
    await createTables(client);

    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com PostgreSQL:', error);
    throw error;
  }
}

// Função para criar tabelas
async function createTables(client) {
  try {
    // Tabela de usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin_master', 'user')),
        name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Índice para email
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);

    // Tabela de agendamentos
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(20),
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        cancelled_at TIMESTAMP WITH TIME ZONE,
        cancellation_reason TEXT
      );

      -- Índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
      CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_name);
    `);

    console.log('📋 Tabelas criadas/verficadas com sucesso');

    // Criar usuários de teste
    await SeedService.ensureSeedUsers();

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  }
}

// Função para executar queries
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executada em', duration, 'ms:', text);
    return res;
  } catch (error) {
    console.error('❌ Erro na query:', error);
    throw error;
  }
}

// Função para obter cliente do pool
async function getClient() {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  // Monkey patch para logging
  client.query = (...args) => {
    const start = Date.now();
    return query.apply(client, args).then(res => {
      const duration = Date.now() - start;
      console.log('📊 Query do cliente executada em', duration, 'ms');
      return res;
    });
  };

  client.release = () => {
    release.apply(client);
    console.log('🔓 Cliente liberado de volta ao pool');
  };

  return client;
}

module.exports = {
  pool,
  connectDB,
  query,
  getClient
};



