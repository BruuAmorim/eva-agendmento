# EvAgendamento - Sistema de Agendamento Inteligente

![EvAgendamento](https://img.shields.io/badge/EvAgendamento-2.2.0-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

Sistema completo de agendamento com interface moderna em **Modo Claro/Escuro**, design inspirado no EvaCloudd, API RESTful robusta e integração nativa com n8n para automação via IA.

## ✨ Características

- 🎨 **Design Moderno**: Interface inspirada no EvaCloudd com Modo Claro/Escuro, gradientes sutis e efeitos glassmorphism
- 🌊 **Ondas Animadas**: Fundo com ondas do EvaCloudd para visual premium
- 🎨 **Paleta Azul**: Cores principais em azul EvaCloudd para identidade visual consistente
- 📱 **Interface Lado a Lado**: Layout horizontal com formulário à esquerda e agendamentos à direita
- 🤖 **Integração IA**: API preparada para integração com n8n como recepcionista virtual
- 📱 **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- 🔒 **Seguro**: Autenticação JWT, validações robustas e proteção contra ataques comuns
- 📊 **Dashboard**: Visualização completa de agendamentos com estatísticas em tempo real
- 🕐 **Gestão Inteligente**: Verificação automática de conflitos de horário
- 🎯 **API RESTful**: Endpoints completos para CRUD de agendamentos

## 🚀 Tecnologias Utilizadas

### Backend
- **Node.js** com **Express.js** - Servidor web robusto e escalável
- **PostgreSQL** - Banco de dados relacional confiável
- **JWT** - Autenticação segura
- **Joi** - Validação de dados
- **Helmet** - Segurança de headers HTTP
- **CORS** - Controle de acesso cross-origin

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Design moderno com variáveis CSS e animações
- **Vanilla JavaScript** - Lógica interativa sem frameworks pesados
- **Inter Font** - Tipografia moderna do Google Fonts

### Infraestrutura
- **Docker** (opcional) - Containerização para fácil deploy
- **PM2** - Gerenciamento de processos em produção
- **Nginx** - Proxy reverso e servidor estático

## 📋 Pré-requisitos

- Node.js 18 ou superior
- PostgreSQL 13 ou superior
- npm ou yarn
- Git

## 🛠️ Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/evagendamento.git
cd evagendamento
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados PostgreSQL

```sql
-- Criar banco de dados
CREATE DATABASE evagendamento;

-- Criar usuário (opcional)
CREATE USER evagendamento_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE evagendamento TO evagendamento_user;
```

### 4. Configure as variáveis de ambiente

Copie o arquivo de exemplo e configure suas variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Configurações do Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evagendamento
DB_USER=postgres
DB_PASSWORD=sua_senha

# Configurações da API
PORT=3000
NODE_ENV=development

# Configurações de Segurança
JWT_SECRET=sua_chave_jwt_super_segura_aqui
API_RATE_LIMIT=100

# Configurações do Frontend
FRONTEND_URL=http://localhost:3001
```

### 5. Execute as migrações do banco

O sistema cria as tabelas automaticamente na primeira execução, mas você pode verificar se tudo está funcionando:

```bash
npm run dev
```

Acesse `http://localhost:3000/health` para verificar se a API está funcionando.

## 🎯 Como Usar

### Iniciando o Sistema

```bash
# Backend - API
npm run dev

# Frontend - Interface (em outro terminal)
cd frontend && npm run dev
```

### Acessando a Interface

Abra seu navegador e acesse `http://localhost:3001` para a interface completa.

## 🌟 Novidades da Versão 2.2

### 🎯 **Interface Minimalista**
- Remoção completa do dashboard de estatísticas
- Layout vertical: agendamento em cima, visualização embaixo
- Foco absoluto na funcionalidade essencial
- Experiência ainda mais direta e objetiva

### 📅 **Visualização Exclusiva por Data**
- Mostra apenas agendamentos do dia selecionado
- Interface limpa sem elementos desnecessários
- Carregamento automático e intuitivo
- Simplicidade máxima mantida

### ⚡ **Fluxo Ultra-Otimizado**
- Formulário reduzido aos 4 campos essenciais
- Duração fixa de 1 hora (não configurável)
- Navegação vertical intuitiva
- Performance e usabilidade otimizadas

## 🌟 Novidades da Versão 2.0

### 🎨 **Modo Claro/Escuro**
- Toggle elegante no header para alternar entre temas
- Preferência salva automaticamente no navegador
- Transições suaves entre os modos

### 🎨 **Paleta Azul EvaCloudd**
- Cores principais em azul (#0099ff) inspiradas no EvaCloudd
- Gradientes e acentos consistentes
- Visual premium e profissional

### 🌊 **Ondas Animadas**
- Fundo com ondas SVG animadas do EvaCloudd
- Efeitos visuais modernos e elegantes
- Performance otimizada com CSS

### 📱 **Interface Lado a Lado**
- Formulário de agendamento à esquerda
- Visualização de agendamentos à direita em cards lado a lado
- Layout horizontal organizado
- Melhor aproveitamento do espaço

### ⚡ **Performance Melhorada**
- Carregamento paralelo de dados
- Interface mais fluida e responsiva
- Melhor experiência do usuário

### Funcionalidades Principais

#### 🎨 **Personalização**
- **Modo Claro/Escuro**: Clique no toggle 🌙/☀️ no header para alternar temas
- **Tema Automático**: O sistema lembra sua preferência

#### 📅 Criar Agendamento (Lado Esquerdo)

1. Preencha o nome do cliente
2. Informe o telefone (opcional)
3. Selecione data e horário
4. Clique em "🔍 Verificar Disponibilidade"
5. Escolha um horário disponível
6. Clique em "✅ Criar Agendamento"

#### 📊 Agendamentos do Dia (Lado Direito)

1. **Selecione uma data** no filtro superior
2. Visualize apenas os agendamentos do dia selecionado em cards lado a lado
3. Clique em "🔄 Atualizar" para recarregar dados
4. Clique em um agendamento para ver detalhes
5. Use as ações para editar (✏️), cancelar (❌) ou excluir (🗑️)

#### ⚙️ Configurações

1. Vá para a aba "Configurações"
2. Configure o endpoint da API
3. Defina horário de funcionamento
4. Configure webhook para n8n (opcional)

## 🔌 API RESTful

### Base URL
```
http://localhost:3000/api
```

### Endpoints Principais

#### Agendamentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/appointments` | Listar agendamentos com filtros |
| GET | `/appointments/:id` | Buscar agendamento específico |
| GET | `/appointments/available/:date` | Horários disponíveis para uma data |
| POST | `/appointments` | Criar novo agendamento |
| PUT | `/appointments/:id` | Atualizar agendamento |
| PUT | `/appointments/:id/cancel` | Cancelar agendamento |
| DELETE | `/appointments/:id` | Excluir agendamento |
| GET | `/appointments/stats/overview` | Estatísticas gerais |

#### Exemplos de Uso da API

##### Criar Agendamento
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "João Silva",
    "customer_email": "joao@email.com",
    "customer_phone": "(11) 99999-9999",
    "appointment_date": "2024-01-15",
    "appointment_time": "14:30",
    "duration_minutes": 60,
    "notes": "Consulta de rotina"
  }'
```

##### Listar Agendamentos
```bash
curl "http://localhost:3000/api/appointments?status=confirmed&date=2024-01-15"
```

##### Verificar Disponibilidade
```bash
curl "http://localhost:3000/api/appointments/available/2024-01-15?duration=60"
```

## 🤖 Integração com n8n

### Configuração do Webhook

1. No n8n, crie um workflow com um nó "Webhook"
2. Configure o método HTTP como POST
3. Use a URL: `https://seuservidor.com/webhook/appointments`
4. Configure o workflow para processar os dados recebidos

### Eventos Disponíveis

O sistema pode enviar os seguintes eventos para o n8n:

- `new_appointment`: Novo agendamento criado
- `appointment_updated`: Agendamento modificado
- `appointment_cancelled`: Agendamento cancelado

### Exemplo de Payload

```json
{
  "event": "new_appointment",
  "appointment": {
    "id": "uuid-do-agendamento",
    "customer_name": "João Silva",
    "customer_email": "joao@email.com",
    "appointment_date": "2024-01-15",
    "appointment_time": "14:30",
    "status": "pending"
  },
  "timestamp": "2024-01-15T10:00:00.000Z",
  "source": "EvAgendamento"
}
```

### Recepcionista Virtual com IA

Configure um workflow no n8n que:

1. Receba chamadas telefônicas via Twilio
2. Use IA (GPT) para entender a solicitação do cliente
3. Consulte a API do EvAgendamento para verificar disponibilidade
4. Crie o agendamento automaticamente
5. Confirme com o cliente via voz ou SMS

## 📊 Estrutura do Banco de Dados

### Tabela `appointments`

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);
```

## 🔒 Segurança

- **Rate Limiting**: Proteção contra ataques de força bruta
- **Validação de Dados**: Sanitização e validação em todas as entradas
- **CORS**: Controle de origens permitidas
- **Helmet**: Headers de segurança HTTP
- **SQL Injection Protection**: Uso de prepared statements
- **XSS Protection**: Sanitização de dados de saída

## 📱 Responsividade

O sistema é totalmente responsivo e funciona perfeitamente em:

- 📺 **Desktop**: 1024px+
- 📱 **Tablet**: 768px - 1024px
- 📱 **Mobile**: até 768px

## 🚀 Deploy em Produção

### Usando PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar em modo produção
pm2 start server.js --name "evagendamento"

# Configurar para iniciar automaticamente
pm2 startup
pm2 save
```

### Usando Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
```

```bash
docker build -t evagendamento .
docker run -p 3000:3000 -e DB_HOST=seu_host evagendamento
```

### Usando Nginx como Proxy Reverso

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com watch
npm run test:watch

# Cobertura de testes
npm run test:coverage
```

## 📝 Logs e Monitoramento

Os logs são salvos em:
- **Console**: Para desenvolvimento
- **Arquivo**: Para produção (configure no PM2)
- **Banco de dados**: Eventos importantes são logados

### Níveis de Log
- `INFO`: Operações normais
- `WARN`: Avisos e situações não críticas
- `ERROR`: Erros que precisam atenção
- `DEBUG`: Informações detalhadas (apenas desenvolvimento)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

- 📧 **Email**: suporte@evagendamento.com
- 💬 **Discord**: [Servidor do EvAgendamento](https://discord.gg/evagendamento)
- 📖 **Documentação**: [Wiki do Projeto](https://github.com/seu-usuario/evagendamento/wiki)

## 🙏 Agradecimentos

- **EvaCloudd** - Inspiração para o design
- **n8n** - Plataforma de automação que tornou possível a integração IA
- **PostgreSQL** - Banco de dados robusto e confiável
- **Node.js Community** - Ecossistema incrível

---

<div align="center">
  <p>Feito com ❤️ pela equipe EvAgendamento</p>
  <p>
    <a href="#evagendamento---sistema-de-agendamento-inteligente">Voltar ao topo</a>
  </p>
</div>
