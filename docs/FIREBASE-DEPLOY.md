# 🚀 Deploy Firebase Functions - Practia

Este guia mostra como fazer deploy completo do projeto no Firebase (Functions + Hosting).

## 📋 Pré-requisitos

1. **Node.js** instalado
2. **Conta Google** para Firebase
3. **Firebase CLI** instalado

## 🔧 Instalação do Firebase CLI

```bash
npm install -g firebase-tools
```

## 🚀 Passo a Passo

### 1. Login no Firebase

```bash
firebase login
```

### 2. Inicializar o projeto Firebase

```bash
firebase init
```

**Selecione:**
- ✅ Functions
- ✅ Hosting
- ✅ Use an existing project (crie um novo se necessário)
- ✅ Python (para Functions)
- ✅ ESLint: No
- ✅ Install dependencies: Yes

### 3. Configurar o projeto

O arquivo `firebase.json` já está configurado corretamente.

### 4. Build do Frontend

```bash
cd frontend
npm run build
cd ..
```

### 5. Deploy das Functions

```bash
firebase deploy --only functions
```

### 6. Deploy do Hosting

```bash
firebase deploy --only hosting
```

### 7. Deploy Completo

```bash
firebase deploy
```

## 🌍 URLs Finais

Após o deploy, você terá:

- **Frontend:** `https://practia-ai.web.app` (ou seu domínio customizado)
- **Functions:** `https://us-central1-practia-ai.cloudfunctions.net/practia_agent`

## 🔧 Configurações Específicas

### Functions (Python)
- ✅ Runtime: Python 3.11
- ✅ Dependências: `functions-framework`, `requests`
- ✅ Endpoints: `/practia_agent`, `/health_check`
- ✅ CORS configurado

### Hosting (React)
- ✅ Build: `npm run build`
- ✅ Output: `frontend/dist`
- ✅ SPA routing configurado
- ✅ Rewrites para React Router

## 🧪 Testando

### 1. Teste das Functions

```bash
# Health check
curl https://us-central1-practia-ai.cloudfunctions.net/health_check

# Teste do agente
curl -X POST https://us-central1-practia-ai.cloudfunctions.net/practia_agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Qual é o clima em São Paulo?"}'
```

### 2. Teste do Frontend
- Acesse a URL do hosting
- Faça login e teste o chat

## 🚨 Problemas Comuns

### Cold Start
- **Problema:** Primeira requisição lenta (2-5s)
- **Solução:** Implementar warm-up ou usar plano pago

### CORS Errors
- **Problema:** Erro de CORS no frontend
- **Solução:** Verificar se os headers estão corretos nas Functions

### Build Failures
- **Problema:** Erro no build do frontend
- **Solução:** Verificar se `npm run build` funciona localmente

### Function Timeout
- **Problema:** Timeout de 60s (gratuito)
- **Solução:** Otimizar código ou usar plano pago

## 💡 Otimizações

### 1. Cache de Respostas
```python
# Implementar cache para reduzir chamadas de API
import functools
import time

@functools.lru_cache(maxsize=100)
def cached_weather_request(city: str):
    # Cache por 5 minutos
    return get_weather(city)
```

### 2. Warm-up Function
```python
@functions_framework.http
def warm_up(request: Request):
    """Warm-up function para reduzir cold start"""
    return jsonify({"status": "warmed"}), 200
```

### 3. Error Handling
```python
# Adicionar retry logic para APIs externas
def get_weather_with_retry(city: str, max_retries=3):
    for attempt in range(max_retries):
        try:
            return get_weather(city)
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            time.sleep(1)
```

## 🔍 Monitoramento

### Firebase Console
- Acesse [console.firebase.google.com](https://console.firebase.google.com)
- Vá em Functions > Logs para ver logs
- Vá em Hosting para ver analytics

### Logs das Functions
```bash
firebase functions:log
```

## 💰 Custos

### Plano Gratuito
- **Functions:** 125K invocações/mês
- **Hosting:** 10GB storage, 360MB/day transfer
- **Timeout:** 60 segundos

### Plano Pago (Blaze)
- **Functions:** $0.40 por milhão de invocações
- **Hosting:** $0.026/GB storage, $0.15/GB transfer
- **Timeout:** 540 segundos

## 🎯 Próximos Passos

1. **Configurar domínio customizado**
2. **Implementar autenticação Firebase Auth**
3. **Adicionar analytics**
4. **Configurar CI/CD com GitHub Actions**

## 🆘 Suporte

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Functions Python](https://firebase.google.com/docs/functions/get-started)
- [Firebase Hosting](https://firebase.google.com/docs/hosting) 