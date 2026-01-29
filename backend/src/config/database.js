// ===========================================
// CONFIGURAÇÃO DE BANCO DE DADOS HÍBRIDA
// ===========================================
// Lazy loading: só importa o driver necessário baseado no ambiente

let db = null;
let isInitialized = false;

// Função para inicializar banco de dados (chamada uma vez)
async function initializeDatabase() {
  if (isInitialized) return db;

  try {
    if (process.env.DATABASE_URL) {
      // ===========================================
      // PRODUÇÃO: PostgreSQL (Supabase/Render)
      // ===========================================
      console.log('🏭 Ambiente de produção detectado, conectando ao PostgreSQL...');

      // IMPORTAÇÃO CONDICIONAL: só carrega pg quando necessário
      const { Pool } = require('pg');

      const poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // Obrigatório para Supabase
        max: 10, // Reduzido para Render
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      };

      db = new Pool(poolConfig);

      // Testar conexão
      const client = await db.connect();
      console.log('✅ Conectado ao PostgreSQL (Supabase)!');
      client.release();

    } else {
      // ===========================================
      // DESENVOLVIMENTO: SQLite (Local)
      // ===========================================
      console.log('🏠 Ambiente de desenvolvimento detectado, usando SQLite...');

      // IMPORTAÇÃO CONDICIONAL: só carrega sqlite quando necessário
      // O Render NUNCA vai executar essas linhas!
      const sqlite3 = require('sqlite3').verbose();
      const { open } = require('sqlite');

      db = await open({
        filename: process.env.DB_PATH || './database.sqlite',
        driver: sqlite3.Database,
      });

      console.log('✅ SQLite conectado localmente!');
    }

    isInitialized = true;
    return db;

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

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
    // Inicializar banco se necessário
    if (!db) {
      db = await initializeDatabase();
    }

    // Criar tabelas se necessário
    await createTables();

    console.log('✅ Banco de dados conectado e tabelas verificadas!');
    return true;

  } catch (error) {
    console.error('❌ Erro ao conectar banco de dados:', error);
    throw error;
  }
}

// Função para criar tabelas
async function createTables() {
  const isProduction = !!process.env.DATABASE_URL;

  try {
    if (isProduction) {
      // ===========================================
      // TABELAS POSTGRESQL (Produção)
      // ===========================================
      console.log('📋 Verificando tabelas PostgreSQL...');

      const queries = [
        `CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin_master', 'moderator', 'user')),
          name VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`,
        `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
        `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`,
        `CREATE TABLE IF NOT EXISTS appointments (
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
        );`,
        `CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);`,
        `CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);`,
        `CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_name);`,
        `CREATE TABLE IF NOT EXISTS moderator_settings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          company_name VARCHAR(255),
          services JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        );`,
        `CREATE INDEX IF NOT EXISTS idx_moderator_settings_user_id ON moderator_settings(user_id);`
      ];

      for (const query of queries) {
        await db.query(query);
      }

    } else {
      // ===========================================
      // TABELAS SQLITE (Desenvolvimento)
      // ===========================================
      console.log('📋 Verificando tabelas SQLite...');

      const queries = [
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          name TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
        `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
        `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`,
        `CREATE TABLE IF NOT EXISTS appointments (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          customer_name TEXT NOT NULL,
          customer_email TEXT,
          customer_phone TEXT,
          appointment_date DATE NOT NULL,
          appointment_time TIME NOT NULL,
          duration_minutes INTEGER DEFAULT 60,
          notes TEXT,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          cancelled_at DATETIME,
          cancellation_reason TEXT
        );`,
        `CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);`,
        `CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);`,
        `CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_name);`,
        `CREATE TABLE IF NOT EXISTS moderator_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          company_name TEXT,
          services TEXT DEFAULT '[]',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        );`,
        `CREATE INDEX IF NOT EXISTS idx_moderator_settings_user_id ON moderator_settings(user_id);`
      ];

      for (const query of queries) {
        await db.exec(query);
      }
    }

    console.log('📋 Tabelas verificadas com sucesso');

    // Criar usuários de teste apenas em desenvolvimento
    if (!isProduction) {
      const SeedService = require('../services/seedService');
      await SeedService.ensureSeedUsers();
    }

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  }
}

// Função para executar queries
async function query(text, params) {
  if (!db) {
    await initializeDatabase();
  }

  const start = Date.now();
  try {
    let result;

    if (process.env.DATABASE_URL) {
      // PostgreSQL
      result = await db.query(text, params);
    } else {
      // SQLite
      if (text.trim().toUpperCase().startsWith('SELECT')) {
        result = { rows: await db.all(text, params) };
      } else {
        result = await db.run(text, params);
      }
    }

    const duration = Date.now() - start;
    console.log('📊 Query executada em', duration, 'ms:', text.substring(0, 50) + '...');
    return result;

  } catch (error) {
    console.error('❌ Erro na query:', error);
    throw error;
  }
}

// Função para obter cliente (compatibilidade)
async function getClient() {
  if (!db) {
    await initializeDatabase();
  }

  if (process.env.DATABASE_URL) {
    // PostgreSQL: retorna cliente do pool
    const client = await db.connect();
    return {
      query: async (text, params) => await client.query(text, params),
      release: () => client.release()
    };
  } else {
    // SQLite: simula interface
    return {
      query: async (text, params) => await query(text, params),
      release: () => {} // SQLite não precisa
    };
  }
}

module.exports = {
  pool,
  connectDB,
  query,
  getClient
};



