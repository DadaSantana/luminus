# Prompt para Lovable - Sistema Practia

## Contexto do Projeto
Crie uma aplicação web moderna para o **Practia**, uma interface de chat de IA similar ao Claude Web ou ChatGPT. O sistema permite conversas com IA, gerenciamento de sessões de chat e administração de usuários. A aplicação deve ter design moderno, responsivo e profissional, focado na experiência de chat.

## Estrutura de Rotas Necessárias

### Rotas Públicas:
- `/` - Homepage com apresentação do sistema
- `/login` - Página de login com autenticação Firebase

### Rotas Protegidas:
- `/sessions` - Lista de conversas/sessões de chat com IA
- `/sessions/:sessionId` - Interface de chat específica com histórico da conversa
- `/main` - Painel administrativo

### Nova Estrutura Administrativa (Principal):
- `/main` - Redireciona para `/main/overview`
- `/main/overview` - Dashboard principal com métricas e estatísticas
- `/main/users` - Gerenciamento de usuários registrados
- `/main/reports` - Relatórios e analytics do sistema

## Funcionalidades por Página

### 1. Homepage (`/`)
- Hero section com título "Practia - Interface de Chat com IA"
- Seções explicativas sobre as capacidades da IA
- Demonstração visual do chat
- Call-to-action para login/começar a conversar
- Design moderno e atrativo similar ao Claude Web

### 2. Login (`/login`)
- Formulário de login com email/senha
- Integração com Firebase Authentication
- Validação de campos
- Redirecionamento após login bem-sucedido

### 3. Sessions (`/sessions`)
- Lista de conversas/chats anteriores
- Cards com preview da conversa (primeiras mensagens)
- Filtros por data e busca por conteúdo
- Botão para iniciar nova conversa
- Organização por data (hoje, ontem, última semana, etc.)

### 4. Session Detail (`/sessions/:sessionId`)
- Interface de chat principal (similar ao Claude/ChatGPT)
- Área de mensagens com histórico da conversa
- Input para nova mensagem com botão enviar
- Indicadores de typing/loading
- Opções: renomear conversa, excluir, exportar
- Sidebar com histórico de conversas (colapsível)

### 5. Admin Layout (`/main/*`)
**Sidebar com navegação:**
- Logo do Practia
- Menu items: Overview, Users, Reports
- Toggle modo escuro/claro
- Botão de logout
- Indicação visual da página ativa

**Área principal:**
- Header com título da página
- Conteúdo específico de cada sub-rota
- Layout responsivo

### 6. Overview (`/main/overview`)
- Cards com métricas principais:
  - Total de usuários registrados
  - Conversas ativas hoje
  - Total de mensagens enviadas
  - Tempo médio de resposta da IA
  - Taxa de engajamento/retenção
- Gráficos de estatísticas (usar Chart.js ou similar)
- Lista de atividades recentes (novas conversas, usuários ativos)
- Ações rápidas (botões para criar usuário, monitorar sistema, etc.)

### 7. Users (`/main/users`)
- Formulário de registro de novos usuários:
  - Nome completo
  - Email
  - Telefone
  - Tipo de usuário (dropdown)
  - Botão de salvar
- Lista de usuários registrados:
  - Tabela com nome, email, telefone, tipo
  - Ações: editar, excluir
  - Paginação
  - Busca e filtros

### 8. Reports (`/main/reports`)
- Filtros de data e tipo de relatório
- Gráficos e métricas:
  - Usuários ativos por período
  - Conversas iniciadas vs finalizadas
  - Tempo médio de conversa
  - Tipos de perguntas mais frequentes
  - Performance da IA (tempo de resposta)
  - Engagement metrics (mensagens por usuário)
- Botão para exportar relatórios
- Tabelas com dados detalhados de conversas e usuários

## Especificações Técnicas

### Design System:
- **Cores principais:** Azul profissional (#2563eb), branco, cinzas neutros
- **Tipografia:** Inter ou similar, hierarquia clara
- **Espaçamento:** Sistema consistente (8px base)
- **Componentes:** Cards, botões, inputs, modais padronizados

### Funcionalidades Técnicas:
- **Autenticação:** Firebase Auth
- **Banco de dados:** Firestore
- **Estado:** React Context ou Zustand
- **Roteamento:** React Router v6 com nested routes
- **Formulários:** React Hook Form com validação
- **Notificações:** Toast notifications
- **Loading states:** Skeletons e spinners
- **Responsividade:** Mobile-first approach

### Integrações Firebase:

#### Configuração Firebase:
```javascript
// firebase.ts - Configuração necessária
const firebaseConfig = {
apiKey: "AIzaSyAcw94MVHOx3k0S3i8sZkEPycfX1jcihug",
  authDomain: "practia-9de0b.firebaseapp.com",
  projectId: "practia-9de0b",
  storageBucket: "practia-9de0b.firebasestorage.app",
  messagingSenderId: "627020357719",
  appId: "1:627020357719:web:558ec8936b6eb8b18b4312",
  measurementId: "G-JRNS99JL3P"
};
```

#### Estrutura de dados Firestore:
```javascript
users: {
  uid: {
    name: string,
    email: string,
    phone: string,
    userType: string,
    createdAt: timestamp,
    lastActive: timestamp
  }
}

sessions: {
  sessionId: {
    title: string,
    userId: string,
    messages: [
      {
        id: string,
        content: string,
        role: 'user' | 'assistant',
        timestamp: timestamp
      }
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
    isActive: boolean
  }
}

messages: {
  messageId: {
    sessionId: string,
    content: string,
    role: 'user' | 'assistant',
    timestamp: timestamp,
    tokens?: number
  }
}
```

## Requisitos de UX/UI

### Modo Escuro/Claro:
- Toggle no sidebar
- Persistência da preferência
- Transições suaves entre modos

### Responsividade:
- Sidebar colapsível em mobile
- Tabelas com scroll horizontal
- Cards que se adaptam ao tamanho da tela

### Acessibilidade:
- Contraste adequado
- Navegação por teclado
- Labels apropriados
- ARIA attributes

### Performance:
- Lazy loading de componentes
- Otimização de imagens
- Debounce em buscas
- Paginação eficiente

## Componentes Reutilizáveis Necessários:
- Button (variants: primary, secondary, danger)
- Input (text, email, tel, select)
- Card
- Modal
- Table
- Sidebar
- Header
- LoadingSpinner
- Toast
- Chart components

## Fluxo de Navegação:
1. Usuário acessa `/` → vê homepage com demo do chat
2. Clica em login → vai para `/login`
3. Após autenticação → redireciona para `/sessions` (lista de conversas)
4. Pode iniciar nova conversa ou continuar conversa existente
5. Administradores acessam `/r/overview`, `/r/users`, `/r/reports` via sidebar
6. Interface de chat principal em `/sessions/:sessionId`

## Componentes Específicos do Chat:
- **MessageBubble**: Componente para mensagens do usuário e IA
- **ChatInput**: Input com auto-resize e botão enviar
- **TypingIndicator**: Animação quando IA está "pensando"
- **ConversationList**: Lista lateral de conversas
- **MessageActions**: Copiar, editar, regenerar resposta

**Priorize:** Experiência de chat fluida, design limpo similar ao Claude Web, navegação intuitiva, performance e responsividade mobile excelente.