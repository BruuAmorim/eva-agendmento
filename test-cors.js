// Script de teste para verificar CORS
const fetch = require('node-fetch');

async function testCORS() {
  console.log('🔍 Testando CORS da API...');

  try {
    // Teste 1: Health check
    console.log('\n1. Testando health check...');
    const healthResponse = await fetch('https://evaagendamento.onrender.com/health');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Headers:`, Object.fromEntries(healthResponse.headers.entries()));

    // Teste 2: API Health check
    console.log('\n2. Testando API health check...');
    const apiHealthResponse = await fetch('https://evaagendamento.onrender.com/api/health');
    console.log(`   Status: ${apiHealthResponse.status}`);
    const apiHealthData = await apiHealthResponse.json();
    console.log(`   Response:`, apiHealthData);

    // Teste 3: OPTIONS preflight para login
    console.log('\n3. Testando OPTIONS preflight para login...');
    const optionsResponse = await fetch('https://evaagendamento.onrender.com/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://evagendamento.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log(`   Status: ${optionsResponse.status}`);
    console.log(`   CORS Headers:`, {
      'access-control-allow-origin': optionsResponse.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': optionsResponse.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': optionsResponse.headers.get('access-control-allow-headers'),
      'access-control-allow-credentials': optionsResponse.headers.get('access-control-allow-credentials')
    });

    console.log('\n✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testCORS();
