## Guia do Backend (Python/FastAPI)

Este documento descreve a arquitetura, endpoints e fluxo de execução do backend do projeto, além de instruções de setup, execução local e testes.

### Visão geral

- **Framework**: FastAPI (Python)
- **Servidor de desenvolvimento**: Uvicorn
- **Persistência padrão**: Em memória (dicionário) no processo do app
- **Porta padrão (dev)**: 127.0.0.1:8000
- **Agente**: `agent.py` provê ferramentas de clima e horário. O backend implementa fallback robusto para capital e conhecimento geral via APIs públicas se o ADK falhar.

### Estrutura relevante

- `server.py`: API principal usada pelo frontend (sem autenticação). Mantém sessões em memória e expõe endpoints compatíveis com o frontend atual.
- `agent.py`: Define as ferramentas do agente (`get_weather`, `get_current_time`) e o `root_agent`.
- `models.py`: Modelos Pydantic usados no formato do endpoint `/run_sse`.
- `api.py`: Alternativa de API com autenticação simulada, outra estrutura de sessões e um `/run_sse` simplificado. Não é usada pelo frontend atual; serve como referência.

### Setup do ambiente local

1) Crie/ative o ambiente virtual (já existe `venv/` no repositório):

```bash
cd /Users/galvant/iCloud\ Drive\ (Arquivo)/Desktop/Devana/practia-1
venv/bin/python -m pip install --upgrade pip
venv/bin/python -m pip install -r requirements.txt
```

2) Suba o backend:

```bash
venv/bin/python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

3) (Opcional) Variáveis de ambiente: o backend atual não depende de chaves privadas. O arquivo `.env` pode ser usado pelo `agent.py` caso necessário futuramente.

### Endpoints (server.py)

- GET `/health`
  - Verifica a saúde do serviço.
  - Resposta: `{ "status": "healthy" }`

- POST `/sessions`
  - Cria uma nova sessão (em memória).
  - Body:
    ```json
    { "appName": "Practia", "userId": "<string>" }
    ```
  - Resposta:
    ```json
    { "sessionId": "<uuid>", "status": "created" }
    ```

- GET `/sessions?userId=<id>&appName=<opcional>`
  - Lista sessões do usuário.
  - Resposta:
    ```json
    {
      "sessions": [
        {
          "sessionId": "<uuid>",
          "appName": "Practia",
          "userId": "<string>",
          "createdAt": "<iso>",
          "lastActivity": "<iso>",
          "messageCount": 0
        }
      ],
      "status": "success"
    }
    ```

- GET `/sessions/{session_id}`
  - Detalhes de uma sessão.

- DELETE `/sessions/{session_id}`
  - Remove uma sessão.

- GET `/tools`
  - Lista as ferramentas disponíveis do agente (metadados simples).

- GET `/agent-info`
  - Informa nome, descrição e ferramentas (nomes) do `root_agent`.

- POST `/run_sse`
  - Endpoint principal de chat consumido pelo frontend. Formato compatível com os tipos do frontend em `src/lib/api.ts`.
  - Body (exemplo mínimo):
    ```json
    {
      "appName": "Practia",
      "userId": "<string>",
      "sessionId": "<uuid>",
      "newMessage": { "role": "user", "parts": [{ "text": "Qual é a capital do Brasil?" }] },
      "streaming": false,
      "stateDelta": {}
    }
    ```
  - Resposta (exemplo):
    ```json
    {
      "content": { "parts": [{ "text": "A capital do Brasil é Brasília." }], "role": "model" },
      "usageMetadata": { "candidatesTokenCount": 10, "candidatesTokensDetails": [{"modality":"TEXT","tokenCount":10}], "promptTokenCount": 6, "promptTokensDetails":[{"modality":"TEXT","tokenCount":6}], "totalTokenCount": 16 },
      "invocationId": "e-<uuid>",
      "author": "practia-agent",
      "actions": { "stateDelta": {}, "artifactDelta": {}, "requestedAuthConfigs": {}},
      "id": "<uuid>",
      "timestamp": 1710000000.0
    }
    ```

### Lógica do agente e fallback

O processamento de mensagens ocorre em `server.py` na função `process_message_with_agent`:

1) Tentativa de uso do Google ADK (Sessions/Runner) para executar o `root_agent` com persistência SQLite (`multi_agent_data.db`).
2) Em caso de erro, aplica-se um fallback robusto que cobre:
   - **Clima**: extrai cidade da pergunta, usa `agent.get_weather` (Open-Meteo + geocoding). Ex.: “Como está o clima em Dublin?”.
   - **Horário**: extrai cidade e usa `agent.get_current_time` (ZoneInfo + mapeamento). Ex.: “Que horas são em São Paulo?”.
   - **Capitais**: consulta `https://restcountries.com/v3.1/name/<pais>?fields=name,capital,cca2` e responde com a(s) capital(is). Ex.: “Qual é a capital do Brasil?”.
   - **Conhecimento geral**: tenta resumo via Wikipedia REST (PT e fallback EN). Ex.: perguntas gerais de geografia, ciência, história etc.

O histórico da sessão é mantido em memória e atualizado a cada chamada ao `/run_sse` (mensagens do usuário e do assistente, `lastActivity`, `messageCount`).

### Fluxo com o frontend

O frontend (Vite/React) consome o backend:

- Cria sessões via `POST /sessions` e navega para `/sessions/:sessionId`.
- Envia mensagens via `POST /run_sse` (ver `frontend/src/lib/api.ts`).
- Endpoint base em dev:
  - Definido por `VITE_API_BASE_URL` (opcional). Por padrão, `src/lib/api.ts` usa `http://127.0.0.1:8000` em desenvolvimento.

### Comandos úteis

- Subir backend (porta 8000):
```bash
venv/bin/python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

- Testes rápidos via curl:
```bash
# Health
curl -s http://127.0.0.1:8000/health

# Criar sessão
curl -s -X POST http://127.0.0.1:8000/sessions \
  -H 'Content-Type: application/json' \
  -d '{"appName":"Practia","userId":"dev-user"}'

# Listar sessões do usuário
curl -s "http://127.0.0.1:8000/sessions?userId=dev-user"

# Perguntar capital
curl -s -X POST http://127.0.0.1:8000/run_sse \
  -H 'Content-Type: application/json' \
  -d '{"appName":"Practia","userId":"dev-user","sessionId":"<SESSION_ID>","newMessage":{"role":"user","parts":[{"text":"Qual é a capital do Brasil?"}]},"streaming":false}'
```

### Considerações sobre `api.py`

- `api.py` é uma implementação alternativa com autenticação simulada, estrutura própria de sessões e um `/run_sse` que trata somente clima/horário (sem capitais/Wikipedia). Não está integrado ao frontend atual.
- Para evitar conflito, use somente um servidor por vez (recomendado: `server.py`).

### Persistência e limitações

- O armazenamento padrão é **em memória**; ao reiniciar o servidor, as sessões são perdidas.
- O código contém integração com o Google ADK (SQLite `multi_agent_data.db`), mas o fluxo padrão utiliza o fallback robusto para garantir respostas sem dependências externas.

### Boas práticas para evoluções

- Se for adicionar novas ferramentas, implemente-as em `agent.py` e ajuste o fallback em `server.py` quando fizer sentido.
- Para persistência real, considerar banco (SQLite/Postgres) e substituir o dicionário de sessões. Padronizar os modelos Pydantic de sessão.
- Manter contratos do `/run_sse` compatíveis com o frontend (`src/lib/api.ts`).

## Guia do Backend (Python/FastAPI)

Este documento descreve a arquitetura, endpoints e fluxo de execução do backend do projeto, além de instruções de setup, execução local e testes.

### Visão geral

- **Framework**: FastAPI (Python)
- **Servidor de desenvolvimento**: Uvicorn
- **Persistência padrão**: Em memória (dicionário) no processo do app
- **Porta padrão (dev)**: 127.0.0.1:8000
- **Agente**: `agent.py` provê ferramentas de clima e horário. O backend implementa fallback robusto para capital e conhecimento geral via APIs públicas se o ADK falhar.

### Estrutura relevante

- `server.py`: API principal usada pelo frontend (sem autenticação). Mantém sessões em memória e expõe endpoints compatíveis com o frontend atual.
- `agent.py`: Define as ferramentas do agente (`get_weather`, `get_current_time`) e o `root_agent`.
- `models.py`: Modelos Pydantic usados no formato do endpoint `/run_sse`.
- `api.py`: Alternativa de API com autenticação simulada, outra estrutura de sessões e um `/run_sse` simplificado. Não é usada pelo frontend atual; serve como referência.

### Setup do ambiente local

1) Crie/ative o ambiente virtual (já existe `venv/` no repositório):

```bash
cd /Users/galvant/iCloud\ Drive\ (Arquivo)/Desktop/Devana/practia-1
venv/bin/python -m pip install --upgrade pip
venv/bin/python -m pip install -r requirements.txt
```

2) Suba o backend:

```bash
venv/bin/python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

3) (Opcional) Variáveis de ambiente: o backend atual não depende de chaves privadas. O arquivo `.env` pode ser usado pelo `agent.py` caso necessário futuramente.

### Endpoints (server.py)

- GET `/health`
  - Verifica a saúde do serviço.
  - Resposta: `{ "status": "healthy" }`

- POST `/sessions`
  - Cria uma nova sessão (em memória).
  - Body:
    ```json
    { "appName": "Practia", "userId": "<string>" }
    ```
  - Resposta:
    ```json
    { "sessionId": "<uuid>", "status": "created" }
    ```

- GET `/sessions?userId=<id>&appName=<opcional>`
  - Lista sessões do usuário.
  - Resposta:
    ```json
    {
      "sessions": [
        {
          "sessionId": "<uuid>",
          "appName": "Practia",
          "userId": "<string>",
          "createdAt": "<iso>",
          "lastActivity": "<iso>",
          "messageCount": 0
        }
      ],
      "status": "success"
    }
    ```

- GET `/sessions/{session_id}`
  - Detalhes de uma sessão.

- DELETE `/sessions/{session_id}`
  - Remove uma sessão.

- GET `/tools`
  - Lista as ferramentas disponíveis do agente (metadados simples).

- GET `/agent-info`
  - Informa nome, descrição e ferramentas (nomes) do `root_agent`.

- POST `/run_sse`
  - Endpoint principal de chat consumido pelo frontend. Formato compatível com os tipos do frontend em `src/lib/api.ts`.
  - Body (exemplo mínimo):
    ```json
    {
      "appName": "Practia",
      "userId": "<string>",
      "sessionId": "<uuid>",
      "newMessage": { "role": "user", "parts": [{ "text": "Qual é a capital do Brasil?" }] },
      "streaming": false,
      "stateDelta": {}
    }
    ```
  - Resposta (exemplo):
    ```json
    {
      "content": { "parts": [{ "text": "A capital do Brasil é Brasília." }], "role": "model" },
      "usageMetadata": { "candidatesTokenCount": 10, "candidatesTokensDetails": [{"modality":"TEXT","tokenCount":10}], "promptTokenCount": 6, "promptTokensDetails":[{"modality":"TEXT","tokenCount":6}], "totalTokenCount": 16 },
      "invocationId": "e-<uuid>",
      "author": "practia-agent",
      "actions": { "stateDelta": {}, "artifactDelta": {}, "requestedAuthConfigs": {}},
      "id": "<uuid>",
      "timestamp": 1710000000.0
    }
    ```

### Lógica do agente e fallback

O processamento de mensagens ocorre em `server.py` na função `process_message_with_agent`:

1) Tentativa de uso do Google ADK (Sessions/Runner) para executar o `root_agent` com persistência SQLite (`multi_agent_data.db`).
2) Em caso de erro, aplica-se um fallback robusto que cobre:
   - **Clima**: extrai cidade da pergunta, usa `agent.get_weather` (Open-Meteo + geocoding). Ex.: “Como está o clima em Dublin?”.
   - **Horário**: extrai cidade e usa `agent.get_current_time` (ZoneInfo + mapeamento). Ex.: “Que horas são em São Paulo?”.
   - **Capitais**: consulta `https://restcountries.com/v3.1/name/<pais>?fields=name,capital,cca2` e responde com a(s) capital(is). Ex.: “Qual é a capital do Brasil?”.
   - **Conhecimento geral**: tenta resumo via Wikipedia REST (PT e fallback EN). Ex.: perguntas gerais de geografia, ciência, história etc.

O histórico da sessão é mantido em memória e atualizado a cada chamada ao `/run_sse` (mensagens do usuário e do assistente, `lastActivity`, `messageCount`).

### Fluxo com o frontend

O frontend (Vite/React) consome o backend:

- Cria sessões via `POST /sessions` e navega para `/sessions/:sessionId`.
- Envia mensagens via `POST /run_sse` (ver `frontend/src/lib/api.ts`).
- Endpoint base em dev:
  - Definido por `VITE_API_BASE_URL` (opcional). Por padrão, `src/lib/api.ts` usa `http://127.0.0.1:8000` em desenvolvimento.

### Comandos úteis

- Subir backend (porta 8000):
```bash
venv/bin/python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

- Testes rápidos via curl:
```bash
# Health
curl -s http://127.0.0.1:8000/health

# Criar sessão
curl -s -X POST http://127.0.0.1:8000/sessions \
  -H 'Content-Type: application/json' \
  -d '{"appName":"Practia","userId":"dev-user"}'

# Listar sessões do usuário
curl -s "http://127.0.0.1:8000/sessions?userId=dev-user"

# Perguntar capital
curl -s -X POST http://127.0.0.1:8000/run_sse \
  -H 'Content-Type: application/json' \
  -d '{"appName":"Practia","userId":"dev-user","sessionId":"<SESSION_ID>","newMessage":{"role":"user","parts":[{"text":"Qual é a capital do Brasil?"}]},"streaming":false}'
```

### Considerações sobre `api.py`

- `api.py` é uma implementação alternativa com autenticação simulada, estrutura própria de sessões e um `/run_sse` que trata somente clima/horário (sem capitais/Wikipedia). Não está integrado ao frontend atual.
- Para evitar conflito, use somente um servidor por vez (recomendado: `server.py`).

### Persistência e limitações

- O armazenamento padrão é **em memória**; ao reiniciar o servidor, as sessões são perdidas.
- O código contém integração com o Google ADK (SQLite `multi_agent_data.db`), mas o fluxo padrão utiliza o fallback robusto para garantir respostas sem dependências externas.

### Boas práticas para evoluções

- Se for adicionar novas ferramentas, implemente-as em `agent.py` e ajuste o fallback em `server.py` quando fizer sentido.
- Para persistência real, considerar banco (SQLite/Postgres) e substituir o dicionário de sessões. Padronizar os modelos Pydantic de sessão.
- Manter contratos do `/run_sse` compatíveis com o frontend (`src/lib/api.ts`).


