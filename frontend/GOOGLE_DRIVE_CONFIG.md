# Configuração do Google Drive API

## Passo a Passo para Configurar

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Select a project" > "New Project"
3. Nome: "Luminus Drive Integration"
4. Clique em "Create"

### 2. Habilitar Google Drive API

1. No menu lateral, vá para "APIs & Services" > "Library"
2. Procure por "Google Drive API"
3. Clique em "Enable"

### 3. Criar Credenciais

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

### 4. Configurar OAuth Consent Screen

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

### 5. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `frontend/`:

```env
# Google Drive API Configuration
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=sua-api-key-aqui
```

### 6. Testar a Configuração

1. Inicie o servidor de desenvolvimento: `npm run dev`
2. Acesse uma conversa
3. Clique no botão "+" no input
4. Clique em "Conectar ao Drive"
5. Faça login com sua conta Google
6. Navegue pelos seus arquivos

## Exemplo de Credenciais

```env
# Exemplo (substitua pelos seus valores reais)
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIzaSyAsfA0WskfAlUG63PaNgEIOGopMZj2DskA
```

## Troubleshooting

### Erro: "client_id and scope must both be provided"
- Verifique se as variáveis de ambiente estão configuradas corretamente
- Certifique-se de que o arquivo `.env` está na pasta `frontend/`
- Reinicie o servidor após alterar o `.env`

### Erro: "Access blocked"
- Verifique se o OAuth consent screen está configurado
- Adicione seu email como test user
- Verifique se o escopo `drive.readonly` está adicionado

### Erro: "Invalid client"
- Verifique se o Client ID está correto
- Certifique-se de que as URLs autorizadas estão configuradas

## Próximos Passos

Após configurar corretamente, você poderá:
- Navegar pelos arquivos do Google Drive
- Selecionar arquivos para anexar
- Visualizar metadados dos arquivos
- Baixar arquivos selecionados
