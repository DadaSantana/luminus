import { useState, useEffect, useRef } from "react";
// Remove direct ReactMarkdown imports
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useParams, useNavigate } from "react-router-dom";
import { Send, MoreVertical, Copy, Trash2, Edit2, Check, X, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { apiService, type FirestoreMessage, type FirestoreSession } from "@/lib/api";
import { useLocaleStore } from "@/store/localeStore";
import { useAgentEventsStore } from "@/store/agentEventsStore";
import { useSessionContext } from "@/contexts/SessionContext";
import { ChatInput } from "./ChatInput";
import { GoogleDrivePicker } from "./GoogleDrivePicker";
import { GoogleDriveFile } from "@/lib/googleDrive";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import MarkdownRenderer from "@/components/common/MarkdownRenderer";
import { useT } from "@/lib/i18n";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  thinking?: {
    reason?: string;
    act?: string;
    observation?: string;
  };
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  userId: string;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const [showThinking, setShowThinking] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
  };

  const hasThinking = message.thinking && (message.thinking.reason || message.thinking.act || message.thinking.observation);

  // Não renderizar balão vazio para mensagens do assistente
  if (!isUser && !message.content.trim()) {
    return null;
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-[80%] group relative`}>
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-luminus-primary/10 dark:bg-white/10 flex items-center justify-center mb-2">
            <span className="text-sm font-semibold text-luminus-primary dark:text-white">AI</span>
          </div>
        )}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-luminus-primary text-white rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm'
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            // Use unified MarkdownRenderer for assistant output (handles tables, JSON, and malformed fences)
            <MarkdownRenderer content={message.content} />
          )}
        </div>
        
        {/* Thinking section for assistant messages */}
        {!isUser && hasThinking && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowThinking(!showThinking)}
              className="text-xs text-muted-foreground hover:text-foreground mb-2"
            >
              {showThinking ? (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Ocultar processo de pensamento
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Ver processo de pensamento
                </>
              )}
            </Button>
            
            {showThinking && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-3">
                {message.thinking?.reason && (
                  <div>
                    <div className="font-semibold text-luminus-primary mb-1">💭 Pensamento:</div>
                    <div className="text-muted-foreground whitespace-pre-wrap break-words">
                      {message.thinking.reason}
                    </div>
                  </div>
                )}
                {message.thinking?.observation && (
                  <div>
                    <div className="font-semibold text-blue-600 mb-1">🔍 Observação:</div>
                    <div className="text-muted-foreground whitespace-pre-wrap break-words">
                      {message.thinking.observation}
                    </div>
                  </div>
                )}
                {message.thinking?.act && (
                  <div>
                    <div className="font-semibold text-green-600 mb-1">⚡ Ação:</div>
                    <div className="text-muted-foreground whitespace-pre-wrap break-words">
                      {message.thinking.act}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={copyToClipboard}
          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-full p-1 shadow-sm"
        >
          <Copy className="w-3 h-3" />
        </button>
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-luminus-primary flex items-center justify-center mt-2 ml-auto">
            <span className="text-sm font-semibold text-white">
              {useAuthStore.getState().user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-6">
      <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="text-xs text-muted-foreground flex items-center">
          AI está pensando
          <span className="inline-block w-2 h-4 bg-luminus-primary ml-1 animate-pulse">|</span>
        </div>
      </div>
    </div>
  );
}

export function ChatInterface() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = useT();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, 'thinking' | 'executing' | 'done'>>({});
  const [currentAgentStatus, setCurrentAgentStatus] = useState<{ agent: string; state: 'thinking' | 'executing' } | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [showGoogleDrivePicker, setShowGoogleDrivePicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const { updateSession } = useSessionContext();
  const appendAgentEvent = useAgentEventsStore((s) => s.appendEvent);
  const updateAgentStatus = useAgentEventsStore((s) => s.updateStatus);
  const loadSessionData = useAgentEventsStore((s) => s.loadSessionData);
  const clearSessionData = useAgentEventsStore((s) => s.clearSessionData);
  const locale = useLocaleStore((s) => s.locale);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Função para processar e filtrar mensagens SSE
  const processSSEMessage = (rawContent: string): { finalContent: string; thinking?: { reason?: string; act?: string; observation?: string } } => {
    // Procurar por todos os padrões REASON, ACT, OBSERVATION (múltiplas ocorrências)
    const reasonMatches = Array.from(rawContent.matchAll(/REASON:\s*(.*?)(?=ACT:|OBSERVATION:|$)/gs));
    const actMatches = Array.from(rawContent.matchAll(/ACT:\s*(.*?)(?=OBSERVATION:|REASON:|$)/gs));
    const observationMatches = Array.from(rawContent.matchAll(/OBSERVATION:\s*(.*?)(?=REASON:|ACT:|$)/gs));

    const thinking: { reason?: string; act?: string; observation?: string } = {};
    
    // Combinar todos os REASONs
    if (reasonMatches.length > 0) {
      thinking.reason = reasonMatches.map(match => match[1].trim()).join('\n\n');
    }
    
    // Combinar todas as OBSERVATIONs
    if (observationMatches.length > 0) {
      thinking.observation = observationMatches.map(match => match[1].trim()).join('\n\n');
    }
    
    // Usar o ÚLTIMO ACT (que contém a resposta final)
    if (actMatches.length > 0) {
      const lastAct = actMatches[actMatches.length - 1][1].trim();
      
      // Verificar se o último ACT não é um comando de programação
      if (lastAct.startsWith('print(') || lastAct.startsWith('search_tool') || lastAct.includes('tool.run')) {
        // Se for comando de programação, usar o conteúdo original
        return { finalContent: rawContent };
      }
      
      thinking.act = lastAct;
    }

    // Se encontrou padrões de thinking válidos, usar o último ACT como conteúdo final
    if (reasonMatches.length > 0 || actMatches.length > 0 || observationMatches.length > 0) {
      const finalContent = thinking.act || rawContent;
      return { finalContent, thinking };
    }

    // Caso contrário, retornar o conteúdo original
    return { finalContent: rawContent };
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages, thinking]);

  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId || !user?.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        // Limpar dados da sessão anterior se houver
        const currentSessionId = session?.id;
        if (currentSessionId && currentSessionId !== sessionId) {
          clearSessionData(currentSessionId);
        }
        
        console.log('Carregando sessão:', sessionId);
        
        // Buscar dados da sessão
        const sessionData = await apiService.getSession(sessionId);
        console.log('Dados da sessão:', sessionData);
        
        // Buscar mensagens da sessão
        const messages = await apiService.getSessionMessages(sessionId);
        console.log('Mensagens encontradas:', messages.length);
        
        // Converter mensagens do Firestore para o formato local
        const convertedMessages: Message[] = messages.map(msg => {
          // Processar mensagens do assistente para extrair thinking
          if (msg.role === 'assistant') {
            const processed = processSSEMessage(msg.content);
            return {
              id: msg.id,
              content: processed.finalContent,
              role: msg.role,
              timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
              thinking: processed.thinking
            };
          }
          
          return {
            id: msg.id,
            content: msg.content,
            role: msg.role,
            timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
          };
        });
        
        setSession({
          id: sessionId,
          title: sessionData?.title || "Nova Conversa",
          messages: convertedMessages,
          userId: user.uid
        });
        
        console.log('Sessão carregada com sucesso:', {
          id: sessionId,
          title: sessionData?.title || "Nova Conversa",
          messageCount: convertedMessages.length
        });
        
        // Carregar dados dos agentes para esta sessão
        await loadSessionData(sessionId);
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        // Fallback para sessão vazia se houver erro
        setSession({
          id: sessionId,
          title: "Nova Conversa",
          messages: [],
          userId: user.uid
        });
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId, user]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !session || sending) return;

    const userMessage = message.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      content: userMessage,
      role: 'user',
      timestamp: new Date()
    };

    setSending(true);
    setMessage("");

    // Add user message to local state
    setSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMessage]
    } : null);

    // Salvar mensagem do usuário no Firestore
    try {
      await apiService.saveMessage(session.id, {
        content: userMessage,
        role: 'user',
        userId: user?.uid || 'anonymous',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Erro ao salvar mensagem do usuário:', error);
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Show AI thinking indicator
    setThinking(true);
    
    try {
      // Criar placeholder da resposta do assistente e fazer streaming dos deltas
      const assistantMessageId = (Date.now() + 1).toString();
      const placeholder: Message = {
        id: assistantMessageId,
        content: "",
        role: 'assistant',
        timestamp: new Date()
      };

      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, placeholder],
        title: prev.messages.length === 0 ? (userMessage.length > 50 ? userMessage.substring(0, 50) + "..." : userMessage) : prev.title
      } : null);

      console.log('[ui] enviando mensagem com streaming...', { sessionId: session.id });
      const { finalText } = await apiService.sendMessageStream(
        session.id,
        userMessage,
        user?.uid || 'anonymous',
        (delta: string) => {
          if (delta) {
            console.log('[ui] delta recebido len=', delta.length, 'preview=', delta.slice(0, 40));
          }
          // Forçar commit síncrono para evitar render só ao final
          flushSync(() => {
            setSession(prev => {
              if (!prev) return prev;
              const updatedMessages = prev.messages.map(m => {
                if (m.id === assistantMessageId) {
                  const newContent = m.content + delta;
                  // Processar mensagem SSE para extrair thinking e conteúdo final
                  const processed = processSSEMessage(newContent);
                  return { 
                    ...m, 
                    content: processed.finalContent,
                    thinking: processed.thinking
                  };
                }
                return m;
              });
              return { ...prev, messages: updatedMessages };
            });
          });
          // Scroll imediato para visualizar o texto aparecendo
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        },
        (status) => {
          setAgentStatuses(prev => ({ ...prev, [status.agent]: status.state }));
          if (status.state === 'thinking' || status.state === 'executing') {
            setCurrentAgentStatus({ agent: status.agent, state: status.state });
          }
          // Persistir timeline de status/tempos
          try {
            const ts = status.timestamp ? Number(status.timestamp) : Date.now() / 1000;
            updateAgentStatus(session.id, status.agent, status.state, ts);
          } catch {}
        },
        (agentDelta) => {
          appendAgentEvent(session.id, agentDelta.agent, {
            agent: agentDelta.agent,
            delta: agentDelta.delta,
            invocationId: agentDelta.invocationId,
            timestamp: agentDelta.timestamp,
          });
        },
        undefined,
        locale
      );
      console.log('[ui] finalText len=', finalText.length);

      // Processar mensagem final e salvar no Firestore
      try {
        const processedFinal = processSSEMessage(finalText);
        await apiService.saveMessage(session.id, {
          content: processedFinal.finalContent,
          role: 'assistant',
          userId: user?.uid || 'anonymous',
          timestamp: new Date()
        });
        
        // Atualizar a mensagem local com o thinking processado
        setSession(prev => {
          if (!prev) return prev;
          const updatedMessages = prev.messages.map(m =>
            m.id === assistantMessageId 
              ? { ...m, content: processedFinal.finalContent, thinking: processedFinal.thinking }
              : m
          );
          return { ...prev, messages: updatedMessages };
        });
      } catch (error) {
        console.error('Erro ao salvar mensagem do assistente:', error);
      }

      // Garantir remoção do indicador de pensamento ao final
      setThinking(false);
      setCurrentAgentStatus(null);

    } catch (error) {
      console.error('Erro ao enviar mensagem (stream):', error);
      toast({
        title: t("errorSendingMessage"),
        description: t("errorSendingMessageDesc"),
        variant: "destructive"
      });
      setThinking(false);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleFileSelect = (file: File) => {
    setAttachedFiles(prev => [...prev, file]);
    toast({
      title: "Arquivo anexado",
      description: `${file.name} foi anexado à mensagem`,
    });
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGoogleDriveFileSelect = async (driveFile: GoogleDriveFile) => {
    try {
      // Criar um objeto File simulado para o arquivo do Google Drive
      const mockFile = new File(
        [''], // Conteúdo vazio por enquanto
        driveFile.name,
        {
          type: driveFile.mimeType,
          lastModified: new Date(driveFile.modifiedTime).getTime()
        }
      );
      
      // Adicionar à lista de arquivos anexados
      setAttachedFiles(prev => [...prev, mockFile]);
      
      toast({
        title: "Arquivo anexado",
        description: `${driveFile.name} foi anexado à mensagem`,
      });
    } catch (error) {
      console.error('Erro ao processar arquivo do Google Drive:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar arquivo do Google Drive",
        variant: "destructive",
      });
    }
  };

  const handleGoogleDriveConnect = () => {
    setShowGoogleDrivePicker(true);
  };

  const handleOneDriveConnect = () => {
    toast({
      title: "Em breve",
      description: "Integração com OneDrive será implementada em breve",
    });
  };

  const handleDropboxConnect = () => {
    toast({
      title: "Em breve",
      description: "Integração com Dropbox será implementada em breve",
    });
  };

  const confirmDeleteSession = async () => {
    if (!session || !sessionId) return;
    
    try {
      const success = await apiService.deleteSession(sessionId);
      
      if (success) {
        toast({
          title: t("conversationDeleted"),
          description: t("conversationDeletedDesc")
        });
        
        // Redirect to sessions page with full reload to ensure cache is cleared
        window.location.href = '/sessions';
      } else {
        toast({
          title: t("errorDeletingConversation"),
          description: t("errorDeletingConversationDesc"),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: t("errorDeletingConversation"),
        description: t("errorDeletingConversationDesc"),
        variant: "destructive"
      });
    }
    setShowDeleteDialog(false);
  };

  const startEditingTitle = () => {
    setEditedTitle(session?.title || "");
    setIsEditingTitle(true);
  };

  const saveTitle = async () => {
    if (!session || !editedTitle.trim()) return;
    
    const newTitle = editedTitle.trim();
    
    try {
      // Atualizar no Firestore
      const success = await apiService.updateSessionTitle(session.id, newTitle, user?.uid || 'anonymous');
      
      if (success) {
        // Atualizar estado local
        setSession(prev => prev ? {
          ...prev,
          title: newTitle
        } : null);
        
        // Atualizar a sidebar
        updateSession(session.id, {
          title: newTitle,
          updatedAt: new Date()
        });
        
        setIsEditingTitle(false);
        
        toast({
          title: "Título atualizado",
          description: "O título da conversa foi atualizado com sucesso."
        });
      } else {
        toast({
          title: "Erro ao atualizar título",
          description: "Não foi possível atualizar o título da conversa.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao salvar título:', error);
      toast({
        title: "Erro ao atualizar título",
        description: "Não foi possível atualizar o título da conversa.",
        variant: "destructive"
      });
    }
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle("");
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveTitle();
    } else if (e.key === 'Escape') {
      cancelEditingTitle();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Conversa não encontrada</h1>
          <Button onClick={() => navigate('/sessions')}>
            Voltar para conversas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/30 dark:bg-luminus-primary/10 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleTitleKeyPress}
                    className="font-semibold text-lg bg-transparent border-b border-border focus:border-luminus-primary outline-none flex-1 min-w-0"
                    autoFocus
                    placeholder="Digite o título da conversa"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={saveTitle}
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditingTitle}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="font-semibold text-lg truncate max-w-md">
                    {session.title}
                  </h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startEditingTitle}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {session.messages.length} {t("messages")} • {t("sessionId")}: {sessionId?.substring(0, 8)}...
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                {t("deleteConversation")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConversation")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeleteConversation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 dark:bg-luminus-primary/5">
        <div className="max-w-4xl mx-auto">
          {session.messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-luminus-primary/10 dark:bg-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-luminus-primary dark:text-white">AI</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">{t("howCanIHelpToday")}</h2>
              <p className="text-muted-foreground mb-6">
                {t("typeMessageToStart")}
              </p>
            </div>
          ) : (
            session.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          
          {/* Indicador de ação atual do agente (substitui os 3 pontinhos) */}
          {thinking && (
            currentAgentStatus ? (
              <div className="flex justify-start mb-6">
                <div>
                  <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">{currentAgentStatus.agent}</span>{' '}está{' '}
                      {currentAgentStatus.state === 'thinking' ? 'pensando' : 'executando'}
                      <span className="inline-block w-2 h-4 bg-luminus-primary ml-1 animate-pulse">|</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <TypingIndicator />
            )
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        message={message}
        setMessage={setMessage}
        onSend={sendMessage}
        sending={sending}
        thinking={thinking}
        attachedFiles={attachedFiles}
        onFileSelect={handleFileSelect}
        onRemoveFile={handleRemoveFile}
        onGoogleDriveConnect={handleGoogleDriveConnect}
        onOneDriveConnect={handleOneDriveConnect}
        onDropboxConnect={handleDropboxConnect}
      />

      {/* Google Drive Picker */}
      <GoogleDrivePicker
        open={showGoogleDrivePicker}
        onOpenChange={setShowGoogleDrivePicker}
        onFileSelect={handleGoogleDriveFileSelect}
      />
    </div>
  );
}
