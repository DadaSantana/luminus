# Guia de Deploy - Practia

Este projeto precisa ser deployado em duas partes separadas devido às limitações da Vercel.

## 🚀 Deploy do Backend (Python/FastAPI)

### Opção 1: Railway (Recomendado)

1. **Criar conta no Railway:**
   - Acesse [railway.app](https://railway.app)
   - Faça login com GitHub

2. **Deploy do projeto:**
   ```bash
   # Instalar Railway CLI
   npm install -g @railway/cli
   
   # Login no Railway
   railway login
   
   # Deploy
   railway up
   ```

3. **Configurar variáveis de ambiente:**
   - No dashboard do Railway, vá em "Variables"
   - Adicione se necessário (o projeto já tem as configurações básicas)

4. **Obter URL do backend:**
   - Após o deploy, copie a URL gerada (ex: `https://practia-backend.railway.app`)

### Opção 2: Render

1. **Criar conta no Render:**
   - Acesse [render.com](https://render.com)
   - Faça login com GitHub

2. **Criar novo Web Service:**
   - Conecte o repositório GitHub
   - Selecione a branch `main`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python api.py`

3. **Configurar:**
   - Runtime: Python 3
   - Instance Type: Free (ou pago para melhor performance)

## 🌐 Deploy do Frontend (React/Vite)

### Vercel

1. **Criar conta na Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Faça login com GitHub

2. **Importar projeto:**
   - Clique em "New Project"
   - Importe o repositório
   - Selecione a pasta `frontend`
   - Framework: Vite

3. **Configurar variáveis de ambiente:**
   - Vá em "Settings" > "Environment Variables"
   - Adicione:
     ```
     VITE_API_BASE_URL=https://seu-backend.railway.app
     ```
   - Substitua pela URL real do seu backend

4. **Deploy:**
   - Clique em "Deploy"
   - A Vercel vai detectar automaticamente que é um projeto Vite

## 🔧 Configurações Específicas

### Frontend (Vercel)
- ✅ Framework detectado automaticamente
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ SPA routing configurado

### Backend (Railway/Render)
- ✅ Python 3.11
- ✅ Dependências instaladas via `requirements.txt`
- ✅ Comando de start: `python api.py`
- ✅ Health check: `/health`

## 🌍 URLs Finais

Após o deploy, você terá:
- **Frontend:** `https://seu-projeto.vercel.app`
- **Backend:** `https://seu-backend.railway.app`

## 🔍 Testando

1. **Teste o backend:**
   ```bash
   curl https://seu-backend.railway.app/health
   ```

2. **Teste o frontend:**
   - Acesse a URL do Vercel
   - Faça login e teste o chat

## 🚨 Problemas Comuns

### CORS Errors
- O backend já está configurado com CORS para aceitar requisições de qualquer origem
- Se persistir, verifique se a URL do backend está correta no frontend

### Build Failures
- **Frontend:** Verifique se todas as dependências estão no `package.json`
- **Backend:** Verifique se o `requirements.txt` está atualizado

### Runtime Errors
- **Backend:** Verifique os logs no Railway/Render
- **Frontend:** Verifique o console do navegador

## 💡 Dicas

1. **Use variáveis de ambiente** para diferentes ambientes
2. **Monitore os logs** para debug
3. **Configure domínios customizados** se necessário
4. **Use HTTPS** sempre em produção 