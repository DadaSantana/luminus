import { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Send, ArrowLeft, MoreVertical, Copy, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import MarkdownRenderer from "@/components/common/MarkdownRenderer";
import { useT } from "@/lib/i18n";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  userId: string;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] group relative`}>
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
            <MarkdownRenderer content={message.content} />
          )}
        </div>
        <button
          onClick={copyToClipboard}
          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-full p-1 shadow-sm"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}

function ChatInterface() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = useT();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages, thinking]);

  useEffect(() => {
    if (!sessionId || !user) return;

    const sessionRef = doc(db, "sessions", sessionId);
    
    const unsubscribe = onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.userId !== user.uid) {
          navigate('/sessions');
          return;
        }
        
        setSession({
          id: doc.id,
          ...data,
          messages: data.messages?.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp?.toDate() || new Date()
          })) || []
        } as Session);
      } else {
        navigate('/sessions');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId, user, navigate]);

  const generateAIResponse = (userMessage: string): string => {
    // Simulação de respostas da IA baseadas no conteúdo
    const responses = {
      saudacao: [
        "Olá! Como posso ajudá-lo hoje?",
        "Oi! É um prazer conversar com você. Em que posso ser útil?",
        "Olá! Estou aqui para ajudar. O que você gostaria de saber?"
      ],
      produtividade: [
        "Ótima pergunta sobre produtividade! Algumas estratégias eficazes incluem:\n\n1. **Técnica Pomodoro** - Trabalhe em blocos de 25 minutos com pausas de 5 minutos\n2. **Matriz de Eisenhower** - Priorize tarefas por urgência e importância\n3. **Eliminar distrações** - Use ferramentas como bloqueadores de sites\n4. **Definir objetivos claros** - Use metodologias como SMART goals\n\nQual dessas áreas você gostaria que eu aprofunde?",
        "Para melhorar a produtividade, recomendo começar com:\n\n• **Planejamento diário** - Reserve 10 minutos toda manhã para planejar o dia\n• **Automação** - Identifique tarefas repetitivas que podem ser automatizadas\n• **Delegação eficaz** - Foque no que só você pode fazer\n• **Pausas estratégicas** - Descansos regulares aumentam a eficiência\n\nPosso detalhar alguma dessas estratégias?"
      ],
      tecnologia: [
        "Sobre tecnologia, posso ajudá-lo com diversas áreas:\n\n• **Desenvolvimento de software** - Linguagens, frameworks, melhores práticas\n• **IA e Machine Learning** - Conceitos, aplicações práticas\n• **Cloud Computing** - AWS, Azure, Google Cloud\n• **Segurança digital** - Proteção de dados, cybersecurity\n\nQual área específica te interessa mais?",
        "A tecnologia está evoluindo rapidamente! Algumas tendências importantes:\n\n1. **Inteligência Artificial** - Automatização e personalização\n2. **Edge Computing** - Processamento mais próximo aos dados\n3. **Quantum Computing** - Revolução em criptografia e simulações\n4. **Sustentabilidade digital** - Green IT e eficiência energética\n\nSobre qual dessas você gostaria de saber mais?"
      ],
      default: [
        "Interessante! Posso elaborar mais sobre esse tópico. O que especificamente você gostaria de saber?",
        "Boa pergunta! Para dar uma resposta mais precisa, você poderia me dar mais contexto sobre o que está buscando?",
        "Entendo sua questão. Vou pensar em algumas perspectivas que podem ser úteis...",
        "Essa é uma área fascinante! Posso abordar isso de diferentes ângulos. Qual aspecto mais te interessa?",
        "Vou ajudá-lo com isso! Para personalizar melhor minha resposta, me conte um pouco mais sobre seu contexto específico."
      ]
    };

    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('hello')) {
      return responses.saudacao[Math.floor(Math.random() * responses.saudacao.length)];
    }
    
    if (lowerMessage.includes('produtividade') || lowerMessage.includes('eficiência') || lowerMessage.includes('organizar')) {
      return responses.produtividade[Math.floor(Math.random() * responses.produtividade.length)];
    }
    
    if (lowerMessage.includes('tecnologia') || lowerMessage.includes('programação') || lowerMessage.includes('desenvolvimento')) {
      return responses.tecnologia[Math.floor(Math.random() * responses.tecnologia.length)];
    }
    
    return responses.default[Math.floor(Math.random() * responses.default.length)];
  };

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

    try {
      // Add user message
      await updateDoc(doc(db, "sessions", session.id), {
        messages: arrayUnion(newMessage),
        lastMessage: newMessage.content,
        updatedAt: new Date(),
        messageCount: (session.messages.length + 1)
      });

      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Show AI thinking indicator
      setThinking(true);
      
      // Send message to backend using the real API
      const response = await apiService.sendMessage(session.id, userMessage, user?.uid || 'anonymous');
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Extract response text from API
      const responseText = response.data?.content?.parts?.[0]?.text || "Desculpe, não consegui processar sua mensagem.";
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        role: 'assistant',
        timestamp: new Date()
      };

      await updateDoc(doc(db, "sessions", session.id), {
        messages: arrayUnion(aiResponse),
        lastMessage: aiResponse.content,
        updatedAt: new Date(),
        messageCount: (session.messages.length + 2)
      });

      // Update title if this is the first message
      if (session.messages.length === 0) {
        const title = newMessage.content.length > 50 
          ? newMessage.content.substring(0, 50) + "..."
          : newMessage.content;
        
        await updateDoc(doc(db, "sessions", session.id), {
          title: title
        });
      }

      setThinking(false);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
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

  const deleteSession = async () => {
    if (!session) return;
    
    try {
      await deleteDoc(doc(db, "sessions", session.id));
      toast({
        title: "Conversa excluída",
        description: "A conversa foi excluída com sucesso."
      });
      navigate('/sessions');
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a conversa.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Conversa não encontrada</h1>
          <Link to="/sessions">
            <Button>Voltar para conversas</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/sessions">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold truncate max-w-md">
                {session.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                {session.messages.length} mensagens
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={deleteSession}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir conversa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {session.messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">💬</div>
              <h2 className="text-xl font-semibold mb-2">{t("startNewConversation")}</h2>
              <p className="text-muted-foreground mb-6">
                {t("typeMessageToStartChat")}
              </p>
            </div>
          ) : (
            session.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          
          {thinking && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-background/80 backdrop-blur-sm p-4">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                placeholder={t("typeYourMessage")}
                className="w-full min-h-[44px] max-h-[120px] px-4 py-3 pr-12 rounded-2xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                disabled={sending || thinking}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!message.trim() || sending || thinking}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-luminus-primary hover:bg-luminus-primary/90"
              >
                {sending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SessionDetail() {
  return (
    <AuthGuard>
      <ChatInterface />
    </AuthGuard>
  );
}