# Practia - Sistema Multi-Agente de IA

## 📋 Visão Geral

Practia é uma plataforma avançada de IA conversacional que utiliza um sistema multi-agente baseado no Google Agent Development Kit (ADK). O projeto combina um backend robusto em Python/FastAPI com um frontend moderno em React/TypeScript, oferecendo uma experiência de chat inteligente com capacidades especializadas.

## 🏗️ Arquitetura do Sistema

### Backend (Python/FastAPI)
- **Framework**: FastAPI com Uvicorn
- **Porta**: 8000 (desenvolvimento)
- **Persistência**: Firebase Firestore + fallback em memória
- **IA**: Google ADK com modelos Gemini 2.0 Flash e 2.5 Pro
- **Autenticação**: API Key (X-API-Key header)

### Frontend (React/TypeScript)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI**: Shadcn/ui + Tailwind CSS
- **Porta**: 8084 (desenvolvimento)
- **Estado**: TanStack Query + Context API

### Sistema Multi-Agente
O sistema utiliza 6 agentes especializados em uma arquitetura de loop:

1. **Enrichment Agent** - Enriquece e detalha as demandas do usuário
2. **Structure Agent** - Define a arquitetura de agentes necessária
3. **Search Agent** - Realiza buscas contextuais (Google Search)
4. **Tech Lead Agent** - Coordena e planeja a execução
5. **Coder Agent** - Implementa soluções em código
6. **Coder Reviewer Agent** - Revisa e valida o código gerado

## 📁 Estrutura do Projeto

```
practia-1/
├── 📁 backend/
│   ├── agent.py              # Sistema multi-agente principal
│   ├── server.py             # API FastAPI principal
│   ├── api.py                # API alternativa com auth
│   ├── main.py               # Endpoint de processamento
│   ├── models.py             # Modelos Pydantic
│   ├── firebase_config.py    # Configuração Firebase
│   └── requirements.txt      # Dependências Python
├── 📁 frontend/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── lib/             # Utilitários e API
│   │   └── contexts/        # Contextos React
│   ├── package.json         # Dependências Node.js
│   └── vite.config.ts       # Configuração Vite
├── 📁 instructions/         # Instruções dos agentes
├── 📁 utils/               # Utilitários de geração
├── 📁 agentes/             # Módulo de agentes
└── 📁 docs/                # Documentação técnica
```

## 🚀 Instalação e Execução

### Pré-requisitos
- Python 3.9+
- Node.js 18+
- Conta Google Cloud (para ADK)
- Projeto Firebase (opcional)

### Backend

1. **Configurar ambiente virtual:**
```bash
cd practia-1
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
```

2. **Instalar dependências:**
```bash
pip install -r requirements.txt
```

3. **Configurar variáveis de ambiente:**
```bash
cp .env.example .env
# Editar .env com suas credenciais
```

4. **Executar servidor:**
```bash
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

1. **Instalar dependências:**
```bash
cd frontend
npm install
```

2. **Configurar variáveis de ambiente:**
```bash
cp .env.example .env
# Configurar VITE_API_BASE_URL se necessário
```

3. **Executar aplicação:**
```bash
npm run dev
```

## 🔧 Configuração

### Variáveis de Ambiente

**Backend (.env):**
```env
FIREBASE_PROJECT_ID=seu-projeto-firebase
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
GOOGLE_APPLICATION_CREDENTIALS=caminho/para/credenciais.json
OPIK_ENABLED=false
OPIK_API_KEY=sua-chave-opik
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_FIREBASE_API_KEY=sua-chave-firebase
VITE_FIREBASE_PROJECT_ID=seu-projeto-firebase
```

## 📡 API Endpoints

### Principais Endpoints

- `GET /health` - Status do serviço
- `POST /sessions` - Criar nova sessão
- `GET /sessions` - Listar sessões do usuário
- `POST /run_sse` - Endpoint principal de chat
- `GET /agent-info` - Informações dos agentes
- `GET /tools` - Ferramentas disponíveis

### Exemplo de Uso

```javascript
// Criar sessão
const session = await fetch('/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    appName: 'Practia',
    userId: 'user123'
  })
});

// Enviar mensagem
const response = await fetch('/run_sse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    appName: 'Practia',
    userId: 'user123',
    sessionId: 'session-id',
    newMessage: {
      role: 'user',
      parts: [{ text: 'Olá, como você pode me ajudar?' }]
    },
    streaming: false
  })
});
```

## 🤖 Funcionalidades dos Agentes

### Capacidades Principais
- **Processamento de Linguagem Natural** avançado
- **Busca Contextual** via Google Search
- **Geração de Código** com revisão automática
- **Arquitetura de Sistemas** inteligente
- **Fallback Robusto** para clima, horário e conhecimento geral

### Ferramentas Integradas
- Google Search API
- Open-Meteo (clima)
- Timezone APIs (horário)
- Wikipedia REST API
- REST Countries API

## 🔒 Segurança

- **Autenticação**: API Key obrigatória em produção
- **CORS**: Configurado para domínios específicos
- **Firestore Rules**: Controle de acesso granular
- **Sanitização**: Validação de entrada com Pydantic
- **Rate Limiting**: Implementado no nível de infraestrutura

## 📊 Monitoramento

- **Logging**: Estruturado com níveis configuráveis
- **Métricas**: Integração opcional com Opik
- **Health Checks**: Endpoint dedicado para status
- **Error Tracking**: Tratamento robusto de exceções

## 🚀 Deploy

### Opções de Deploy

**Backend:**
- Railway (recomendado)
- Render
- Google Cloud Run
- Heroku

**Frontend:**
- Vercel (recomendado)
- Netlify
- Firebase Hosting

### Comandos de Deploy

```bash
# Railway
railway up

# Vercel
vercel --prod

# Build local
npm run build
```

## 🧪 Testes

```bash
# Backend
pytest

# Frontend
npm test

# E2E
npm run test:e2e
```

## 📚 Documentação Adicional

- [Documentação Técnica](DOCUMENTACAO_TECNICA.md)
- [Guia do Backend](BACKEND.md)
- [Deploy Guide](DEPLOY.md)
- [Firebase Setup](FIREBASE-DEPLOY.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- Abra uma [issue](https://github.com/seu-usuario/practia/issues)
- Consulte a [documentação](docs/)
- Entre em contato via email

---

**Practia** - Transformando conversas em soluções inteligentes com IA multi-agente.