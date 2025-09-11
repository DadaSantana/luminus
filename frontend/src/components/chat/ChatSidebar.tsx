import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, Search, MessageCircle, PanelRightOpen, Info } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import MarkdownRenderer from "@/components/common/MarkdownRenderer";
import { useAgentEventsStore } from "@/store/agentEventsStore";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { apiService } from "@/lib/api";

import { formatDistanceToNow } from 'date-fns';
import { useLocaleStore, getDateFnsLocale } from '@/store/localeStore';
import { collection, query, where, orderBy, onSnapshot, addDoc } from "firebase/firestore";
import { useT } from "@/lib/i18n";

interface Session {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: Date;
  messageCount: number;
}

interface ChatSidebarProps {
  onSessionSelect?: (sessionId: string) => void;
  updateSessionRef?: React.MutableRefObject<((sessionId: string, updates: any) => void) | null>;
}

export function ChatSidebar({ onSessionSelect, updateSessionRef }: ChatSidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [creating, setCreating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [agentDialog, setAgentDialog] = useState<{ open: boolean; agent?: string }>({ open: false });
  const isMobile = useIsMobile();
  const { user } = useAuthStore();
  const userData = useAuthStore((s) => s.userData);
  const isAdminUser = (userData?.userType || '').toLowerCase() === 'admin';
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sessionId: activeSessionId } = useParams();
  const showAgentsInBody = !!activeSessionId;
  const locale = useLocaleStore((s) => s.locale);
  const t = useT();

  // Subscrição em tempo real às sessões do Firestore para o usuário atual
  useEffect(() => {
    if (!user?.uid) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formattedSessions: Session[] = snapshot.docs.map((doc) => {
        const data: any = doc.data();
        const updatedAt: Date = data?.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();
        return {
          id: doc.id,
          title: data?.title || `Conversa ${doc.id.slice(0, 8)}`,
          lastMessage: data?.lastMessage || '',
          updatedAt,
          messageCount: data?.messageCount || 0,
        } as Session;
      });
      setSessions(formattedSessions);
      setLoading(false);
    }, (error) => {
      console.error('❌ [ChatSidebar] Erro no snapshot de sessões:', error);
      setLoading(false);
      setSessions([]);
      toast({
        title: "Erro ao carregar conversas",
        description: "Não foi possível carregar suas conversas. Tente novamente.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (updateSessionRef) {
      updateSessionRef.current = (sessionId: string, updates: any) => {
        setSessions(prev => prev.map(session => 
          session.id === sessionId 
            ? { ...session, ...updates }
            : session
        ));
      };
    }
  }, [updateSessionRef]);

  const createNewSession = async () => {
    if (!user?.uid) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar uma nova conversa.",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const docRef = await addDoc(collection(db, 'sessions'), {
        title: 'Nova Conversa',
        userId: user.uid,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        messageCount: 0,
        lastMessage: ''
      });

      navigate(`/sessions/${docRef.id}`);
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      toast({
        title: "Erro ao criar conversa",
        description: "Não foi possível criar uma nova conversa. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimeAgo = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true, locale: getDateFnsLocale(locale) });
    } catch {
      return date.toLocaleDateString(locale);
    }
  };

  const allAgents = [
    { key: 'enrichment_agent', label: 'Enrichment Agent', desc: 'Enriquece e complementa conteúdos.' },
    { key: 'search_agent', label: 'Search Agent', desc: 'Pesquisa referências e exemplos (Google Search).' },
    { key: 'main_agent', label: 'Main Agent', desc: 'Agente principal que coordena o processo.' },
    { key: 'critique_agent', label: 'Critique Agent', desc: 'Analisa e critica o conteúdo gerado.' },
    { key: 'generator_agent', label: 'Generator Agent', desc: 'Gera conteúdo e implementações.' },
    { key: 'content_creator', label: 'Content Creator', desc: 'Cria conteúdo inicial baseado nas solicitações.' },
    { key: 'content_evaluator', label: 'Content Evaluator', desc: 'Avalia e fornece feedback sobre o conteúdo.' },
    { key: 'content_refiner', label: 'Content Refiner', desc: 'Refina o conteúdo com base no feedback.' },
  ];
  const getTranscript = useAgentEventsStore((s) => s.getAgentTranscript);
  const getAgentStatus = useAgentEventsStore((s) => s.getAgentStatus);
  // Subscribe to agent events/status changes for current session to trigger re-render
  const _events = useAgentEventsStore((s) => s.eventsBySession[activeSessionId || ""]);
  const _statuses = useAgentEventsStore((s) => s.statusBySession[activeSessionId || ""]);

  // Mostrar todos os agentes da sequência quando há uma sessão ativa
  const activeAgents = activeSessionId ? allAgents : [];

  return (
    <div className="h-screen w-80 bg-background border-r flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <Link to="/">
            <Logo />
          </Link>

        </div>

        {/* Mobile: Drawer para conversas + botão Nova */}
        {isMobile ? (
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <div className="flex gap-2">
              <DrawerTrigger asChild>
                <Button variant="outline" className="w-full mb-4">
                  <PanelRightOpen className="w-4 h-4 mr-2" /> {t("conversations")}
                </Button>
              </DrawerTrigger>
              <Button 
                onClick={async () => { await createNewSession(); setDrawerOpen(true); }}
                disabled={creating}
                className="mb-4 bg-luminus-primary hover:bg-luminus-primary/90"
              >
                {creating ? <LoadingSpinner size="sm" className="mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Nova
              </Button>
            </div>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{t("yourConversations")}</DrawerTitle>
                <DrawerDescription>{t("chooseConversation")}</DrawerDescription>
              </DrawerHeader>
              <div className="p-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={t("searchConversationsPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                    {filteredSessions.map(session => (
                      <Link 
                        key={session.id} 
                        to={`/sessions/${session.id}`}
                        onClick={() => { onSessionSelect?.(session.id); setDrawerOpen(false); }}
                      >
                        <div 
                          className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                            activeSessionId === session.id ? 'bg-muted' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
                              <MessageCircle className="w-4 h-4 text-luminus-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate mb-1">
                                {session.title}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                                {session.lastMessage || t("noMessageYet")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}

                    {filteredSessions.length === 0 && !loading && (
                      <div className="text-center py-8 px-4">
                        <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {sessions.length === 0 ? t("noConversationsYet") : t("noConversationFound")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          // Desktop: botão Nova + Busca na própria sidebar
          <div className="space-y-4">
            <Button 
              onClick={createNewSession}
              disabled={creating}
              className="w-full bg-luminus-primary hover:bg-luminus-primary/90"
            >
              {creating ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {t("newConversation")}
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t("searchConversations")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto">
        {showAgentsInBody ? (
          // Mostrar Agentes quando estiver dentro de uma conversa
          <div className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground mb-3">{t("agents")}</h3>
            <div className="space-y-2">
              {activeAgents.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  {t("agentsWillAppearHere")}
                </div>
              ) : (
                activeAgents.map(agent => {
                  const { text } = getTranscript(activeSessionId!, agent.key);
                  const status = getAgentStatus(activeSessionId!, agent.key);
                  const isActive = status.startedAt && !status.finishedAt;
                  const isCompleted = status.finishedAt;
                  const statusText = isActive ? t("executing") : isCompleted ? t("done") : t("pending");
                  
                  return (
                    <Dialog key={agent.key} open={agentDialog.open && agentDialog.agent === agent.key} onOpenChange={(open) => setAgentDialog({ open, agent: open ? agent.key : undefined })}>
                      <DialogTrigger asChild>
                        <div className="p-4 rounded-lg border border-border bg-card hover:shadow-sm transition-all cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium">{agent.label}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{statusText}</span>
                              <div className={`w-2 h-2 rounded-full ${
                                isActive ? 'bg-blue-500 animate-pulse' :
                                isCompleted ? 'bg-green-500' :
                                'bg-gray-300'
                              }`} />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{agent.desc}</p>
                          
                          {status.durationMs && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("duration")}: {(status.durationMs/1000).toFixed(1)}s
                            </p>
                          )}
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{agent.label}</DialogTitle>
                          <DialogDescription>{agent.desc}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="text-xs text-muted-foreground">
                            Nome interno: <span className="font-mono">{agent.key}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            início: {status.startedAt ? new Date(status.startedAt * 1000).toLocaleString() : '—'}
                            {status.executedAt ? ` • executando desde: ${new Date(status.executedAt * 1000).toLocaleString()}` : ''}
                            {status.finishedAt ? ` • fim: ${new Date(status.finishedAt * 1000).toLocaleString()}` : ''}
                            {status.durationMs !== undefined ? ` • duração: ${(status.durationMs/1000).toFixed(1)}s` : ''}
                            <br />
                            chunks: {status.chunks}
                          </div>
                          <div className="border rounded-md p-3 bg-background/50">
                            {text ? (
                              <MarkdownRenderer content={text} />
                            ) : (
                              <span className="text-xs text-muted-foreground">Sem conteúdo para este agente nesta sessão.</span>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          // Exibir lista de conversas diretamente no sidebar (estado inicial)
          <div className="p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <div className="space-y-1">
                {filteredSessions.map(session => (
                  <Link 
                    key={session.id} 
                    to={`/sessions/${session.id}`}
                    onClick={() => onSessionSelect?.(session.id)}
                  >
                    <div 
                      className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        activeSessionId === session.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-4 h-4 text-luminus-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate mb-1">
                            {session.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                            {session.lastMessage || "Nenhuma mensagem ainda"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(session.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {filteredSessions.length === 0 && !loading && (
                  <div className="text-center py-8 px-4">
                    <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {sessions.length === 0 ? "Nenhuma conversa ainda" : "Nenhuma conversa encontrada"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}