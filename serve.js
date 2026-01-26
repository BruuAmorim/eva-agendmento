const express = require('express');
const cors = require('cors');

// Tenta importar a conexão do banco de dados (se estiver configurada)
// Se der erro aqui, verifique o caminho do arquivo database.js
try {
    require('./src/config/database'); 
} catch (error) {
    console.warn("Aviso: Arquivo de banco de dados não carregado ou não encontrado.");
}

const app = express();
const PORT = 3000;

// --- Middlewares ---
// CORS liberado para permitir conexão do Frontend (8080) e n8n
app.use(cors()); 
// Habilita leitura de JSON no corpo das requisições (Essencial para o POST)
app.use(express.json()); 

// --- Importação das Rotas ---
// Baseado na estrutura: backend/src/routes/
const appointmentRoutes = require('./src/routes/appointments');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const integrationRoutes = require('./src/routes/integrationRoutes');

// --- Definição das Rotas (Endpoints) ---
app.use('/api/appointments', appointmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/integrations', integrationRoutes);

// --- Rota de Health Check ---
// Use esta rota no n8n para testar a conexão simples: http://IP:3000/api/health
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'online', 
        message: 'API EvAgendamento rodando perfeitamente!',
        timestamp: new Date()
    });
});

// --- Rota Raiz (Opcional) ---
app.get('/', (req, res) => {
    res.send('Backend do Sistema de Agendamento está ativo.');
});

// --- Inicialização do Servidor ---
// O '0.0.0.0' é OBRIGATÓRIO para o Docker/n8n conseguir acessar seu PC
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
    console.log(`📡 Acessível externamente (Docker/n8n) via IP da rede`);
});