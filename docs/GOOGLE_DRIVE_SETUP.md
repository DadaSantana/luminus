# Configuração do Google Drive API

Este documento explica como configurar a integração com o Google Drive API no projeto Luminus.

## Pré-requisitos

1. Conta Google com acesso ao Google Cloud Console
2. Projeto no Google Cloud Console
3. Google Drive API habilitada

## Configuração no Google Cloud Console

### 1. Criar/Selecionar Projeto

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o ID do projeto

### 2. Habilitar Google Drive API

1. No menu lateral, vá para "APIs & Services" > "Library"
2. Procure por "Google Drive API"
3. Clique em "Enable"

### 3. Criar Credenciais

1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "API Key"
3. Copie a API Key gerada
4. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
5. Selecione "Web application"
6. Adicione as URLs autorizadas:
   - `http://localhost:5173` (desenvolvimento)
   - `https://seu-dominio.com` (produção)
7. Copie o Client ID gerado

### 4. Configurar OAuth Consent Screen

1. Vá para "APIs & Services" > "OAuth consent screen"
2. Selecione "External" (para uso público) ou "Internal" (para organização)
3. Preencha as informações obrigatórias:
   - App name: "Luminus"
   - User support email: seu email
   - Developer contact information: seu email
4. Adicione os escopos necessários:
   - `https://www.googleapis.com/auth/drive.readonly`
5. Adicione usuários de teste (se necessário)

## Configuração no Projeto

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na pasta `frontend/` com as seguintes variáveis:

```env
# Google Drive API Configuration
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui
VITE_GOOGLE_API_KEY=sua-api-key-aqui
```

### 2. Verificar Configuração

As variáveis de ambiente são carregadas automaticamente pelo Vite. Certifique-se de que:

- O arquivo `.env` está na pasta `frontend/`
- As variáveis começam com `VITE_`
- Não há espaços ao redor do `=`
- O arquivo `.env` está no `.gitignore`

## Funcionalidades Implementadas

### 1. Autenticação

- Login com Google Drive
- Gerenciamento de sessão
- Logout automático

### 2. Navegação de Arquivos

- Listagem de pastas e arquivos
- Navegação por pastas
- Breadcrumbs para navegação
- Busca de arquivos

### 3. Seleção de Arquivos

- Visualização de metadados
- Ícones por tipo de arquivo
- Seleção de arquivos
- Download de arquivos

## Limitações Atuais

- Apenas leitura de arquivos (escopo `drive.readonly`)
- Máximo de 50 arquivos por página
- Suporte limitado a tipos de arquivo específicos

## Próximos Passos

1. Implementar upload de arquivos
2. Adicionar suporte a mais tipos de arquivo
3. Implementar cache de arquivos
4. Adicionar suporte a OneDrive e Dropbox

## Troubleshooting

### Erro de CORS

Se encontrar erros de CORS, verifique se:
- As URLs estão corretas nas credenciais OAuth
- O domínio está autorizado no Google Cloud Console

### Erro de Escopo

Se houver erro de escopo, verifique se:
- O escopo `drive.readonly` está adicionado
- O OAuth consent screen está configurado corretamente

### Erro de API Key

Se houver erro de API Key, verifique se:
- A API Key está correta no arquivo `.env`
- A Google Drive API está habilitada
- As restrições de API Key estão configuradas corretamente
