# 🚀 Configuração do Google Drive API - Guia Completo

## ⚠️ IMPORTANTE: Configure as Credenciais

Para usar a integração com Google Drive, você precisa configurar as credenciais no arquivo `.env`:

```env
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=sua-api-key-aqui
```

## 📋 Passo a Passo para Obter as Credenciais

### 1. Acesse o Google Cloud Console
- Vá para: https://console.cloud.google.com/
- Faça login com sua conta Google

### 2. Crie ou Selecione um Projeto
- Clique em "Select a project" no topo
- Clique em "New Project"
- Nome: "Luminus Drive Integration"
- Clique em "Create"

### 3. Habilite a Google Drive API
- No menu lateral, vá para "APIs & Services" > "Library"
- Procure por "Google Drive API"
- Clique em "Enable"

### 4. Crie as Credenciais

#### API Key:
1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "API Key"
3. Copie a API Key gerada
4. (Opcional) Clique em "Restrict Key" para adicionar restrições

#### OAuth 2.0 Client ID:
1. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
2. Selecione "Web application"
3. Nome: "Luminus Web Client"
4. Adicione URLs autorizadas:
   - `http://localhost:5173` (desenvolvimento)
   - `https://seu-dominio.com` (produção)
5. Clique em "Create"
6. Copie o Client ID gerado

### 5. Configure OAuth Consent Screen
1. Vá para "APIs & Services" > "OAuth consent screen"
2. Selecione "External" (para uso público)
3. Preencha as informações:
   - App name: "Luminus"
   - User support email: seu email
   - Developer contact information: seu email
4. Clique em "Save and Continue"
5. Em "Scopes", clique em "Add or Remove Scopes"
6. Adicione: `https://www.googleapis.com/auth/drive.readonly`
7. Clique em "Update" > "Save and Continue"
8. Em "Test users", adicione seu email para testes
9. Clique em "Save and Continue"

### 6. Atualize o arquivo .env
Substitua os valores no arquivo `.env`:

```env
VITE_API_BASE_URL=https://luminus.onrender.com
# Google Drive API Configuration
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIzaSyAsfA0WskfAlUG63PaNgEIOGopMZj2DskA
```

### 7. Reinicie o Servidor
Após configurar as credenciais:
```bash
npm run dev
```

## 🧪 Testando a Configuração

1. Acesse uma conversa no Luminus
2. Clique no botão "+" no input
3. Clique em "Conectar ao Drive"
4. Faça login com sua conta Google
5. Navegue pelos seus arquivos

## 🔧 Troubleshooting

### Erro: "Google Drive API não configurada"
- Verifique se as variáveis estão no arquivo `.env`
- Certifique-se de que o arquivo `.env` está na pasta `frontend/`
- Reinicie o servidor após alterar o `.env`

### Erro: "Access blocked"
- Verifique se o OAuth consent screen está configurado
- Adicione seu email como test user
- Verifique se o escopo `drive.readonly` está adicionado

### Erro: "Invalid client"
- Verifique se o Client ID está correto
- Certifique-se de que as URLs autorizadas estão configuradas

## 📚 Recursos Adicionais

- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [OAuth 2.0 for Web Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Cloud Console](https://console.cloud.google.com/)

## 🎯 Próximos Passos

Após configurar corretamente, você poderá:
- ✅ Navegar pelos arquivos do Google Drive
- ✅ Selecionar arquivos para anexar
- ✅ Visualizar metadados dos arquivos
- ✅ Baixar arquivos selecionados
