import { useLocaleStore } from "@/store/localeStore";

// Basic dictionaries. Extend as needed.
const dictionaries: Record<string, Record<string, string>> = {
  "pt-BR": {
    overview: "Visão Geral",
    users: "Usuários",
    reports: "Relatórios",
    actions: "Ações",
    chat: "Chat",
    login: "Login",
    register: "Registro",
    recoverPassword: "Recuperar Senha",
    loginSubtitle: "Acesse sua conta para continuar suas conversas",
    registerSubtitle: "Crie sua conta para começar a usar o Practia",
    email: "Email",
    fullName: "Nome completo",
    password: "Senha",
    sendResetEmail: "Enviar Email de Recuperação",
    backToLogin: "Voltar ao Login",
    enter: "Entrar",
    createAccount: "Criar Conta",
    forgotYourPassword: "Esqueceu sua senha?",
    clickHere: "Clique aqui",
    alreadyHaveAccount: "Já tem uma conta?",
    loginNow: "Fazer login",
    backHome: "← Voltar para home",
    conversations: "Conversas",
    new: "Nova",
    yourConversations: "Suas conversas",
    chooseConversation: "Escolha uma conversa para continuar o histórico.",
    searchConversations: "Buscar conversas...",
    noMessageYet: "Nenhuma mensagem ainda",
    noConversationsYet: "Nenhuma conversa ainda",
    noConversationFound: "Nenhuma conversa encontrada",
    newConversation: "Nova Conversa",
    agents: "Agentes",
    executing: "Executando",
    done: "Concluído",
    pending: "Pendente",
    duration: "Duração",
    agentNoContent: "Sem conteúdo para este agente nesta sessão.",
    dashboard: "Dashboard",
    systemOverview: "Visão geral do sistema Practia",
    totalUsers: "Total de Usuários",
    newThisWeek: "+{count} novos esta semana",
    totalConversations: "Conversas Totais",
    newToday: "{count} novas hoje",
    messagesSent: "Mensagens Enviadas",
    todayCount: "+{count} hoje",
    activeUsersToday: "Usuários Ativos Hoje",
    percentOfTotal: "{percent}% do total",
    averageResponseTime: "Tempo Médio de Resposta",
    timeSinceYesterday: "-{time}s desde ontem",
    engagementRate: "Taxa de Engajamento",
    percentSinceLastWeek: "+{percent}% desde a semana passada",
    recentActivity: "Atividade Recente",
    quickActions: "Ações Rápidas",
    createNewUser: "Criar Novo Usuário",
    goToChat: "Ir para Chat",
    viewReports: "Ver Relatórios",
    monitorSystem: "Monitorar Sistema",
    justNow: "Agora",
    minutesAgo: "{time}m atrás",
    hoursAgo: "{time}h atrás",
    daysAgo: "{time}d atrás",
    errorCreatingSessionTitle: "Erro ao criar sessão",
    errorCreatingSessionDesc: "Não foi possível criar uma nova conversa.",
    today: "Hoje",
    yesterday: "Ontem",
    thisWeek: "Esta semana",
    older: "Mais antigas",
    manageConversationsSubtitle: "Gerencie e continue suas conversas com a IA",
    startFirstConversation: "Comece sua primeira conversa com a IA clicando no botão abaixo.",
    createFirstConversation: "Criar Primeira Conversa",
    messages: "mensagens",
    sessionId: "ID da Sessão",
    adjustSearchTerms: "Tente ajustar os termos da sua busca.",
    welcomeToPractia: "Bem-vindo ao Luminus",
    selectConversationToStart: "Selecione uma conversa existente ou crie uma nova para começar.",
    manage: "Gerenciar",
    profile: "Perfil",
    theme: "Tema",
    language: "Idioma",
    logout: "Sair",
    toggleTheme: "Alternar tema",
    searchConversationsPlaceholder: "Buscar conversas...",
    agentsWillAppearHere: "Os agentes aparecerão aqui conforme respondem",
    howCanIHelpToday: "Olá! Como posso ajudá-lo hoje?",
    typeMessageToStart: "Digite sua mensagem abaixo para começar nossa conversa.",
    errorSendingMessage: "Erro ao enviar mensagem",
    errorSendingMessageDesc: "Não foi possível enviar sua mensagem. Verifique se o backend está rodando.",
    typeYourMessage: "Digite sua mensagem...",
    startNewConversation: "Comece uma nova conversa",
    typeMessageToStartChat: "Digite sua mensagem abaixo para começar a conversar com a IA.",
    deleteConversation: "Deletar conversa",
    confirmDeleteConversation: "Tem certeza que deseja deletar esta conversa? Esta ação não pode ser desfeita.",
    cancel: "Cancelar",
    delete: "Deletar",
    conversationDeleted: "Conversa deletada",
    conversationDeletedDesc: "A conversa foi deletada com sucesso.",
    errorDeletingConversation: "Erro ao deletar conversa",
    errorDeletingConversationDesc: "Não foi possível deletar a conversa.",
    welcomeBack: "Bem-vindo de volta, {name}!",
    loginSuccessTitle: "Login realizado com sucesso!",
    loginSuccessDesc: "Bem-vindo de volta ao Practia.",
    accountCreatedTitle: "Conta criada com sucesso!",
    accountCreatedDesc: "Bem-vindo ao Luminus.",
    authErrorTitle: "Erro na autenticação",
    emailSentTitle: "Email enviado!",
    emailSentDesc: "Verifique sua caixa de entrada para redefinir sua senha.",
    emailErrorTitle: "Erro ao enviar email",
  },
  "en-US": {
    overview: "Overview",
    users: "Users",
    reports: "Reports",
    actions: "Actions",
    chat: "Chat",
    login: "Login",
    register: "Register",
    recoverPassword: "Recover Password",
    loginSubtitle: "Log in to continue your conversations",
    registerSubtitle: "Create your account to start using Practia",
    email: "Email",
    fullName: "Full name",
    password: "Password",
    sendResetEmail: "Send Recovery Email",
    backToLogin: "Back to Login",
    enter: "Sign In",
    createAccount: "Create Account",
    forgotYourPassword: "Forgot your password?",
    clickHere: "Click here",
    alreadyHaveAccount: "Already have an account?",
    loginNow: "Log in",
    backHome: "← Back to home",
    conversations: "Conversations",
    new: "New",
    yourConversations: "Your conversations",
    chooseConversation: "Choose a conversation to continue history.",
    searchConversations: "Search conversations...",
    noMessageYet: "No message yet",
    noConversationsYet: "No conversations yet",
    noConversationFound: "No conversation found",
    newConversation: "New Conversation",
    agents: "Agents",
    executing: "Running",
    done: "Done",
    pending: "Pending",
    duration: "Duration",
    agentNoContent: "No content for this agent in this session.",
    adjustSearchTerms: "Try adjusting your search terms.",
    dashboard: "Dashboard",
    systemOverview: "Practia system overview",
    totalUsers: "Total Users",
    newThisWeek: "+{count} new this week",
    totalConversations: "Total Conversations",
    newToday: "{count} new today",
    messagesSent: "Messages Sent",
    todayCount: "+{count} today",
    activeUsersToday: "Active Users Today",
    percentOfTotal: "{percent}% of total",
    averageResponseTime: "Average Response Time",
    timeSinceYesterday: "-{time}s since yesterday",
    engagementRate: "Engagement Rate",
    percentSinceLastWeek: "+{percent}% since last week",
    recentActivity: "Recent Activity",
    quickActions: "Quick Actions",
    createNewUser: "Create New User",
    goToChat: "Go to Chat",
    viewReports: "View Reports",
    monitorSystem: "Monitor System",
    justNow: "Just now",
    minutesAgo: "{time}m ago",
    hoursAgo: "{time}h ago",
    daysAgo: "{time}d ago",
    errorCreatingSessionTitle: "Error creating session",
    errorCreatingSessionDesc: "Could not create a new conversation.",
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This week",
    older: "Older",
    manageConversationsSubtitle: "Manage and continue your conversations with AI",
    startFirstConversation: "Start your first conversation with AI by clicking the button below.",
    createFirstConversation: "Create First Conversation",
    messages: "messages",
    sessionId: "Session ID",
    welcomeToPractia: "Welcome to Practia",
    selectConversationToStart: "Select an existing conversation or create a new one to get started.",
    manage: "Manage",
    profile: "Profile",
    theme: "Theme",
    language: "Language",
    logout: "Logout",
    toggleTheme: "Toggle theme",
    searchConversationsPlaceholder: "Search conversations...",
    agentsWillAppearHere: "Agents will appear here as they respond",
    howCanIHelpToday: "Hello! How can I help you today?",
    typeMessageToStart: "Type your message below to start our conversation.",
    errorSendingMessage: "Error sending message",
    errorSendingMessageDesc: "Could not send your message. Please check if the backend is running.",
    typeYourMessage: "Type your message...",
    startNewConversation: "Start a new conversation",
    typeMessageToStartChat: "Type your message below to start chatting with AI.",
    deleteConversation: "Delete conversation",
    confirmDeleteConversation: "Are you sure you want to delete this conversation? This action cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    conversationDeleted: "Conversation deleted",
    conversationDeletedDesc: "The conversation was deleted successfully.",
    errorDeletingConversation: "Error deleting conversation",
    errorDeletingConversationDesc: "Could not delete the conversation.",
    welcomeBack: "Welcome back, {name}!",
    loginSuccessTitle: "Login successful!",
    loginSuccessDesc: "Welcome back to Practia.",
    accountCreatedTitle: "Account created successfully!",
    accountCreatedDesc: "Welcome to Practia.",
    authErrorTitle: "Authentication error",
    emailSentTitle: "Email sent!",
    emailSentDesc: "Check your inbox to reset your password.",
    emailErrorTitle: "Error sending email",
  },
  es: {
    overview: "Resumen",
    users: "Usuarios",
    reports: "Informes",
    actions: "Acciones",
    chat: "Chat",
    login: "Iniciar sesión",
    register: "Registro",
    recoverPassword: "Recuperar Contraseña",
    loginSubtitle: "Accede a tu cuenta para continuar tus conversaciones",
    registerSubtitle: "Crea tu cuenta para empezar a usar Practia",
    email: "Correo electrónico",
    fullName: "Nombre completo",
    password: "Contraseña",
    sendResetEmail: "Enviar Correo de Recuperación",
    backToLogin: "Volver al Inicio de Sesión",
    enter: "Entrar",
    createAccount: "Crear Cuenta",
    forgotYourPassword: "¿Olvidaste tu contraseña?",
    clickHere: "Haz clic aquí",
    alreadyHaveAccount: "¿Ya tienes una cuenta?",
    loginNow: "Iniciar sesión",
    backHome: "← Volver al inicio",
    conversations: "Conversaciones",
    new: "Nueva",
    yourConversations: "Tus conversaciones",
    chooseConversation: "Elige una conversación para continuar el historial.",
    searchConversations: "Buscar conversaciones...",
    noMessageYet: "Aún sin mensajes",
    noConversationsYet: "Aún sin conversaciones",
    noConversationFound: "No se encontró conversación",
    newConversation: "Nueva Conversación",
    agents: "Agentes",
    executing: "Ejecutando",
    done: "Concluido",
    pending: "Pendiente",
    duration: "Duración",
    agentNoContent: "Sin contenido para este agente en esta sesión.",
    errorCreatingSessionTitle: "Error al crear sesión",
    errorCreatingSessionDesc: "No fue posible crear una nueva conversación.",
    today: "Hoy",
    yesterday: "Ayer",
    thisWeek: "Esta semana",
    older: "Más antiguas",
    manageConversationsSubtitle: "Gestiona y continúa tus conversaciones con la IA",
    startFirstConversation: "Inicia tu primera conversación con la IA haciendo clic en el botón de abajo.",
    createFirstConversation: "Crear Primera Conversación",
    messages: "mensajes",
    sessionId: "ID de Sesión",
    adjustSearchTerms: "Intenta ajustar los términos de tu búsqueda.",
    dashboard: "Panel de Control",
    systemOverview: "Visión general del sistema Practia",
    totalUsers: "Total de Usuarios",
    newThisWeek: "+{count} nuevos esta semana",
    totalConversations: "Conversaciones Totales",
    newToday: "{count} nuevas hoy",
    messagesSent: "Mensajes Enviados",
    todayCount: "+{count} hoy",
    activeUsersToday: "Usuarios Activos Hoy",
    percentOfTotal: "{percent}% del total",
    averageResponseTime: "Tiempo Medio de Respuesta",
    timeSinceYesterday: "-{time}s desde ayer",
    engagementRate: "Tasa de Participación",
    percentSinceLastWeek: "+{percent}% desde la semana pasada",
    recentActivity: "Actividad Reciente",
    quickActions: "Acciones Rápidas",
    createNewUser: "Crear Nuevo Usuario",
    goToChat: "Ir al Chat",
    viewReports: "Ver Informes",
    monitorSystem: "Monitorear Sistema",
    justNow: "Ahora",
    minutesAgo: "hace {time}m",
    hoursAgo: "hace {time}h",
    daysAgo: "hace {time}d",
    welcomeToPractia: "Bienvenido a Practia",
    selectConversationToStart: "Selecciona una conversación existente o crea una nueva para comenzar.",
    manage: "Gestionar",
    profile: "Perfil",
    theme: "Tema",
    language: "Idioma",
    logout: "Cerrar sesión",
    toggleTheme: "Alternar tema",
    searchConversationsPlaceholder: "Buscar conversaciones...",
    agentsWillAppearHere: "Los agentes aparecerán aquí mientras responden",
    howCanIHelpToday: "¡Hola! ¿Cómo puedo ayudarte hoy?",
    typeMessageToStart: "Escribe tu mensaje abajo para comenzar nuestra conversación.",
    errorSendingMessage: "Error al enviar mensaje",
    errorSendingMessageDesc: "No se pudo enviar tu mensaje. Verifica si el backend está funcionando.",
    typeYourMessage: "Escribe tu mensaje...",
    startNewConversation: "Comienza una nueva conversación",
    typeMessageToStartChat: "Escribe tu mensaje abajo para comenzar a chatear con la IA.",
    deleteConversation: "Eliminar conversación",
    confirmDeleteConversation: "¿Estás seguro de que quieres eliminar esta conversación? Esta acción no se puede deshacer.",
    cancel: "Cancelar",
    delete: "Eliminar",
    conversationDeleted: "Conversación eliminada",
    conversationDeletedDesc: "La conversación fue eliminada exitosamente.",
    errorDeletingConversation: "Error al eliminar conversación",
    errorDeletingConversationDesc: "No se pudo eliminar la conversación.",
    welcomeBack: "¡Bienvenido de vuelta, {name}!",
    loginSuccessTitle: "¡Inicio de sesión exitoso!",
    loginSuccessDesc: "Bienvenido de vuelta a Practia.",
    accountCreatedTitle: "¡Cuenta creada exitosamente!",
    accountCreatedDesc: "Bienvenido a Practia.",
    authErrorTitle: "Error de autenticación",
    emailSentTitle: "¡Correo enviado!",
    emailSentDesc: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
    emailErrorTitle: "Error al enviar correo",
  },
};

// CodeBlock component translations
const codeBlockTranslations = {
  copyCode: {
    'pt-BR': 'Copiar código',
    'en-US': 'Copy code',
    'es': 'Copiar código'
  },
  copied: {
    'pt-BR': 'Copiado',
    'en-US': 'Copied',
    'es': 'Copiado'
  },
  copy: {
    'pt-BR': 'Copiar',
    'en-US': 'Copy',
    'es': 'Copiar'
  },
  failedToCopy: {
     'pt-BR': 'Falha ao copiar',
     'en-US': 'Failed to copy',
     'es': 'Error al copiar'
   },
   text: {
    'pt-BR': 'texto',
    'en-US': 'text',
    'es': 'texto'
  },

  // Home page translations
  enter: {
    'pt-BR': 'Entrar',
    'en-US': 'Enter',
    'es': 'Entrar'
  },
  aiChatInterface: {
    'pt-BR': 'Interface de Chat com IA',
    'en-US': 'AI Chat Interface',
    'es': 'Interfaz de Chat con IA'
  },
  homeDescription: {
    'pt-BR': 'Tenha conversas inteligentes e produtivas com nossa IA avançada. Gerencie suas sessões, analise conversas e obtenha insights valiosos.',
    'en-US': 'Have intelligent and productive conversations with our advanced AI. Manage your sessions, analyze conversations and get valuable insights.',
    'es': 'Ten conversaciones inteligentes y productivas con nuestra IA avanzada. Gestiona tus sesiones, analiza conversaciones y obtén insights valiosos.'
  },
  startConversation: {
    'pt-BR': 'Começar Conversa',
    'en-US': 'Start Conversation',
    'es': 'Comenzar Conversación'
  },
  learnFeatures: {
     'pt-BR': 'Conhecer Recursos',
     'en-US': 'Learn Features',
     'es': 'Conocer Características'
   },
   
   // Demo chat content
   demoQuestion: {
     'pt-BR': 'Como posso melhorar a produtividade da minha equipe?',
     'en-US': 'How can I improve my team\'s productivity?',
     'es': '¿Cómo puedo mejorar la productividad de mi equipo?'
   },
   demoAnswer: {
     'pt-BR': 'Ótima pergunta! Vou sugerir algumas estratégias eficazes baseadas em melhores práticas:\n\n1. **Definir objetivos claros** - Use metodologias como OKRs\n2. **Automatizar tarefas repetitivas** - Identifique processos que podem ser otimizados\n3. **Implementar ferramentas de colaboração** - Como Slack, Notion ou Teams\n\nGostaria que eu detalhe alguma dessas estratégias?',
     'en-US': 'Great question! I\'ll suggest some effective strategies based on best practices:\n\n1. **Set clear objectives** - Use methodologies like OKRs\n2. **Automate repetitive tasks** - Identify processes that can be optimized\n3. **Implement collaboration tools** - Like Slack, Notion or Teams\n\nWould you like me to detail any of these strategies?',
     'es': '¡Excelente pregunta! Te sugiero algunas estrategias efectivas basadas en mejores prácticas:\n\n1. **Definir objetivos claros** - Usa metodologías como OKRs\n2. **Automatizar tareas repetitivas** - Identifica procesos que pueden optimizarse\n3. **Implementar herramientas de colaboración** - Como Slack, Notion o Teams\n\n¿Te gustaría que detalle alguna de estas estrategias?'
   },
   demoFollowUp: {
      'pt-BR': 'Sim, me fale mais sobre OKRs',
      'en-US': 'Yes, tell me more about OKRs',
      'es': 'Sí, cuéntame más sobre OKRs'
    },
    
    // Features section
    intelligentConversations: {
      'pt-BR': 'Conversas Inteligentes',
      'en-US': 'Intelligent Conversations',
      'es': 'Conversaciones Inteligentes'
    },
    intelligentConversationsDesc: {
      'pt-BR': 'IA avançada que compreende contexto e oferece respostas precisas e relevantes.',
      'en-US': 'Advanced AI that understands context and provides accurate and relevant responses.',
      'es': 'IA avanzada que comprende el contexto y ofrece respuestas precisas y relevantes.'
    },
    detailedAnalytics: {
      'pt-BR': 'Analytics Detalhados',
      'en-US': 'Detailed Analytics',
      'es': 'Análisis Detallados'
    },
    detailedAnalyticsDesc: {
      'pt-BR': 'Insights sobre padrões de conversa, engajamento e performance da IA.',
      'en-US': 'Insights about conversation patterns, engagement and AI performance.',
      'es': 'Insights sobre patrones de conversación, engagement y rendimiento de la IA.'
    },
    userManagement: {
      'pt-BR': 'Gestão de Usuários',
      'en-US': 'User Management',
      'es': 'Gestión de Usuarios'
    },
    userManagementDesc: {
      'pt-BR': 'Controle completo sobre usuários, permissões e acessos ao sistema.',
      'en-US': 'Complete control over users, permissions and system access.',
      'es': 'Control completo sobre usuarios, permisos y accesos al sistema.'
    },
    advancedSecurity: {
      'pt-BR': 'Segurança Avançada',
      'en-US': 'Advanced Security',
      'es': 'Seguridad Avanzada'
    },
    advancedSecurityDesc: {
      'pt-BR': 'Autenticação robusta e proteção de dados com Firebase Authentication.',
      'en-US': 'Robust authentication and data protection with Firebase Authentication.',
      'es': 'Autenticación robusta y protección de datos con Firebase Authentication.'
    },
    optimizedPerformance: {
      'pt-BR': 'Performance Otimizada',
      'en-US': 'Optimized Performance',
      'es': 'Rendimiento Optimizado'
    },
    optimizedPerformanceDesc: {
      'pt-BR': 'Interface rápida e responsiva para uma experiência fluida.',
      'en-US': 'Fast and responsive interface for a smooth experience.',
      'es': 'Interfaz rápida y responsiva para una experiencia fluida.'
    },
    contextualAI: {
      'pt-BR': 'IA Contextual',
      'en-US': 'Contextual AI',
      'es': 'IA Contextual'
    },
    contextualAIDesc: {
      'pt-BR': 'Histórico de conversas mantido para contexto contínuo.',
      'en-US': 'Conversation history maintained for continuous context.',
      'es': 'Historial de conversaciones mantenido para contexto continuo.'
    },
    intuitiveInterface: {
      'pt-BR': 'Interface Intuitiva',
      'en-US': 'Intuitive Interface',
      'es': 'Interfaz Intuitiva'
    },
    intuitiveInterfaceDesc: {
      'pt-BR': 'Design moderno inspirado nas melhores interfaces de chat.',
      'en-US': 'Modern design inspired by the best chat interfaces.',
      'es': 'Diseño moderno inspirado en las mejores interfaces de chat.'
    }
};

// Combine all translations
const translations = {
  ...dictionaries,
  ...codeBlockTranslations
};

// Fallback locale if the current one is not supported.
const DEFAULT_LOCALE = "en-US";

function translate(locale: string, key: string): string {
  // First check in main dictionaries
  const dict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE] || {};
  if (dict[key]) {
    return dict[key];
  }
  
  // Then check in codeBlockTranslations
  const codeBlockDict = codeBlockTranslations[key];
  if (codeBlockDict) {
    return codeBlockDict[locale] || codeBlockDict[DEFAULT_LOCALE] || key;
  }
  
  return key;
}

export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  return (key: string) => translate(locale, key);
}