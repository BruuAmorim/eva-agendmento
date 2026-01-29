// Script simples para testar CORS
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://eva-agendamento.vercel.app',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type,Authorization'
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:');
  Object.keys(res.headers).forEach(key => {
    if (key.toLowerCase().includes('access-control')) {
      console.log(`  ${key}: ${res.headers[key]}`);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();
