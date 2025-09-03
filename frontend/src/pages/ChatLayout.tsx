import { AuthGuard } from "@/components/auth/AuthGuard";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { UserAvatarMenu } from "@/components/layout/UserAvatarMenu";
import { SessionProvider } from "@/contexts/SessionContext";
import { useT } from "@/lib/i18n";


function ChatLayoutContent() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const updateSessionRef = useRef<((sessionId: string, updates: any) => void) | null>(null);
  const t = useT();

  // Se não tiver sessionId, redireciona para criar uma nova sessão
  useEffect(() => {
    if (!sessionId) {
      // Aqui podemos criar uma sessão automaticamente ou mostrar uma tela vazia
      // Por enquanto, vamos mostrar uma mensagem para selecionar uma conversa
    }
  }, [sessionId, navigate]);

  const handleSessionSelect = (newSessionId: string) => {
    navigate(`/sessions/${newSessionId}`);
  };

  const handleUpdateSession = (sessionId: string, updates: any) => {
    if (updateSessionRef.current) {
      updateSessionRef.current(sessionId, updates);
    }
  };

  return (
    <SessionProvider updateSession={handleUpdateSession}>
      <div className="h-screen flex bg-background">
        <div className="fixed left-0 top-0 z-10">
          <ChatSidebar onSessionSelect={handleSessionSelect} updateSessionRef={updateSessionRef} />
        </div>
        <div className="flex-1 flex flex-col min-h-0 ml-80">
          <header className="h-16 flex items-center justify-end border-b bg-background/30 dark:bg-luminus-primary/10 backdrop-blur-sm px-4">
            <UserAvatarMenu />
          </header>
          {sessionId ? (
            <ChatInterface />
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-luminus-primary/10 dark:bg-white/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-luminus-primary dark:text-white">AI</span>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{t("welcomeToPractia")}</h2>
                  <p className="text-muted-foreground">
                    {t("selectConversationToStart")}
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </SessionProvider>
  );
}

export default function ChatLayout() {
  return (
    <AuthGuard>
      <ChatLayoutContent />
    </AuthGuard>
  );
}