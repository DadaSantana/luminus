# Documentação Técnica do Projeto

Este documento consolida a arquitetura, componentes, APIs, modelos de dados, integrações e procedimentos de execução/deploy do projeto.

## Visão Geral
- Plataforma multiagente de IA para atendimento conversacional, com stack: Backend (FastAPI/Python) + Frontend (React + TypeScript + Vite.js) + Firebase (Auth/Firestore).
- Persistência principal no Firestore (coleção `sessions` e subcoleção `messages`), com fallback em memória no backend.
- Integração com Google ADK/Gemini preparada para orquestração de agentes e respostas; fluxo de chat com suporte a streaming.
- Segurança via API Key (header `X-API-Key`) e CORS habilitado.
- Suporte a 3 idiomas: Português, Inglês e Espanhol.

## Arquitetura e Estrutura de Pastas
```
/ (raiz)
├── server.py                 # API principal (FastAPI) consumida pelo frontend
├── api.py                    # API alternativa (ambiente de testes, auth simulada)
├── models.py                 # Modelos Pydantic compartilhados (RunSSE etc.)
├── agent.py / agentes/       # Agentes e ferramentas (ex.: clima/tempo)
├── firebase_config.py        # Inicialização do Firebase Admin/Firestore
├── frontend/                 # Aplicação React + TypeScript + Vite.js
├── requirements.txt          # Dependências do backend
├── BACKEND.md, README.md     # Documentação complementar
├── DEPLOY.md, FIREBASE-DEPLOY.md, Procfile, render.yaml, railway.json
└── .env                      # Variáveis de ambiente
```

## Backend (FastAPI)
- Aplicação principal: `server.py` (título: "Practia").
- Principais responsabilidades:
  - Gestão de sessões e histórico de mensagens.
  - Persistência no Firestore (fallback em memória) e ordenação por timestamp do servidor.
  - Endpoint de chat com suporte a streaming (SSE/StreamingResponse) no contrato RunSSE.
  - Middleware de segurança por API Key e CORS.

### Principais Endpoints (server.py)
- GET `/` — raiz/boas‑vindas.
- GET `/health` — verificação de saúde.
- POST `/sessions` — cria sessão (campos: `appName`, `userId`). Retorna `sessionId`.
- GET `/sessions` — lista sessões por `userId` (query) e opcional `appName`.
- GET `/sessions/{session_id}` — detalhes da sessão (inclui mensagens).
- DELETE `/sessions/{session_id}` — remove sessão.
- POST `/run_sse` — execução do chat/agent streaming (contrato RunSSE).
- GET `/agent-info` — informações do agente (metadados/capacidades).
- (Opcional) GET `/tools` — ferramentas disponíveis do agente.

Obs.: `api.py` expõe uma API alternativa de testes (com auth simulada) incluindo a rota administrativa `GET /admin/users` para gestão de usuários.

### Modelos de Dados (Pydantic)
- Estruturas principais definidas em `models.py` (e algumas em `server.py`):
  - Mensagens: `MessagePart`, `Message`.
  - Sessões: `SessionCreateRequest`, `SessionCreateResponse`, `SessionInfo`, `SessionListResponse`.
  - Execução (chat): `RunSSERequest` (campos: `appName`, `userId`, `sessionId`, `newMessage`, `streaming`, `stateDelta?`, `locale?`).
  - Resposta (chat): `RunSSEResponse` com `content`, `usageMetadata` (detalhes de tokens), `actions`, `invocationId`, `timestamp`.

### Persistência (Firestore)
- Coleção `sessions` (documento por `sessionId`) e subcoleção `messages`.
- `messages` armazena `{ role, content, timestamp/createdAt, messageId }`.
- Timestamps com `firestore.SERVER_TIMESTAMP` e ordenação por `createdAt`.
- Fallback: dicionários em memória (`sessions_db`, `messages_db`).

### Segurança
- API Key opcional via header `X-API-Key` (variável: `PRACTIA_API_KEY`).
- CORS liberado para desenvolvimento; recomenda-se restringir em produção.

### Execução Local (Backend)
1) Preparar ambiente Python 3.11+ e instalar dependências:
   - `pip install -r requirements.txt`
2) Variáveis de ambiente (.env):
   - `PRACTIA_API_KEY` (opcional para habilitar middleware de API Key)
   - Configuração do Firebase Admin/Firestore via credenciais de serviço (arquivo JSON). Você pode usar `GOOGLE_APPLICATION_CREDENTIALS` apontando para o JSON, ou inicializar via `firebase_config.py`.
3) Executar:
   - `uvicorn server:app --reload --host 0.0.0.0 --port 8000`


## Frontend (React + TypeScript + Vite.js)
- Stack: React, TypeScript, Vite.js, Tailwind CSS.
- Autenticação: Firebase Auth (login/logout, guarda de rotas e estado do usuário).
- Páginas/telas principais:
  - Login e gerenciamento de usuários (rota administrativa, quando habilitada).
  - Lista de sessões e detalhe de sessão (histórico de mensagens e métricas).
  - Chat em tempo real com suporte a resposta incremental/streaming e reconexão.
- Integração com backend via REST/streaming; consumo de `/sessions`, `/sessions/{id}`, `/run_sse` e afins.
- Internacionalização: suporte a 3 idiomas — PT, EN, ES.

### Execução Local (Frontend)
1) Pré‑requisitos: Node 18+.
2) Instalar dependências: `npm install` (ou `bun install`).
3) Rodar em desenvolvimento: `npm run dev` (Vite.js).
4) Build: `npm run build` e `npm run preview`.


## Integrações de IA (Multiagente)
- Preparação para orquestração com Google ADK e uso do Gemini para respostas.
- Agentes e ferramentas em `agent.py`/`agentes/` (ex.: clima, horário) com fallback e respostas determinísticas para demonstração.
- Contrato de execução padronizado (RunSSE) para envio de mensagem do usuário, controle de estado (`stateDelta`) e locale.

## Deploy e Ambientes
- Backend: suporte a execução via Procfile/Render/Railway; Uvicorn como servidor de aplicação.
- Frontend: build com Vite.js; implantação típica em Vercel/Netlify; integração com Firebase Hosting opcional.
- Firebase: ver `FIREBASE-DEPLOY.md` para orientações específicas.
- Arquivos úteis: `DEPLOY.md`, `Procfile`, `render.yaml`, `railway.json`, `vercel.json` (frontend).

## Logs, Observabilidade e Erros
- Logging básico configurado (nível INFO), com mensagens para operações de sessão/mensagens.
- Tratamento de exceções com respostas HTTP claras e fallback para memória quando Firestore indisponível.
- Recomendações: adicionar rastreamento distribuído e métricas (Prometheus/OpenTelemetry) em produção.

## Testes
- Backend: dependências incluem `pytest`/`httpx` para testes de integração de endpoints.
- Testes manuais documentados nos guias; recomenda-se ampliar cobertura automatizada dos fluxos críticos (criação/lista de sessões e `/run_sse`).

## Segurança e Conformidade
- Evitar armazenamento de segredos no código (usar `.env`/variáveis de ambiente e provedor de segredos).
- Restringir CORS e exigir API Key/JWT em produção.
- Adequar políticas de retenção/anonimização de dados em conformidade com LGPD/GDPR.

## Roadmap sugerido
- JWT/Firebase Auth integrado ao backend.
- Observabilidade (traços/métricas/logs estruturados) e dashboards.
- Storage/ORM alternativo (ex.: Postgres) e cache (ex.: Redis) para escalabilidade.
- Ampliação de ferramentas de agente e integração plena com ADK/Gemini.

---
Este documento complementa os arquivos existentes (`README.md`, `BACKEND.md` e guias de deploy) e deve ser mantido em sincronia com o código‑fonte.