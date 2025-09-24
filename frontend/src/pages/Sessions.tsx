import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, MessageCircle, Clock, Calendar } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
// import { signOut } from "firebase/auth";
// import { auth, db } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, addDoc, onSnapshot } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useLocaleStore, getDateFnsLocale } from "@/store/localeStore";
import { useT } from "@/lib/i18n";
import { UserAvatarMenu } from "@/components/layout/UserAvatarMenu";

interface Session {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt?: Timestamp | null;
  messageCount: number;
}

function SessionsList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [creating, setCreating] = useState(false);
  const { user } = useAuthStore();
  const userData = useAuthStore((s) => s.userData);
  const isAdminUser = (userData?.userType || '').toLowerCase() === 'admin';
  const navigate = useNavigate();
  const { toast } = useToast();
  const locale = useLocaleStore((s) => s.locale);
  const t = useT();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "sessions"),
      where("userId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Session[];
      
      setSessions(sessionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createNewSession = async () => {
    if (!user) return;
    
    setCreating(true);
    try {
      const docRef = await addDoc(collection(db, "sessions"), {
        title: t("newConversation"),
        userId: user.uid,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        messageCount: 0,
        lastMessage: ""
      });

      navigate(`/sessions/${docRef.id}`);
    } catch (error) {
      toast({
        title: t("errorCreatingSessionTitle"),
        description: t("errorCreatingSessionDesc"),
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  // handleLogout removido: o logout é gerenciado por UserAvatarMenu

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupSessionsByDate = (sessions: Session[]) => {
    const todayKey = t("today");
    const yesterdayKey = t("yesterday");
    const weekKey = t("thisWeek");
    const olderKey = t("older");
    const groups: { [key: string]: Session[] } = {
      [todayKey]: [],
      [yesterdayKey]: [],
      [weekKey]: [],
      [olderKey]: []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    sessions.forEach(session => {
      const sessionDate = session.updatedAt?.toDate();
      if (!sessionDate) return;

      if (sessionDate >= today) {
-        groups["Hoje"].push(session);
+        groups[todayKey].push(session);
      } else if (sessionDate >= yesterday) {
-        groups["Ontem"].push(session);
+        groups[yesterdayKey].push(session);
      } else if (sessionDate >= weekAgo) {
-        groups["Esta semana"].push(session);
+        groups[weekKey].push(session);
      } else {
-        groups["Mais antigas"].push(session);
+        groups[olderKey].push(session);
      }
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const sessionGroups = groupSessionsByDate(filteredSessions);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/30 dark:bg-luminus-primary/10 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Logo />
            </Link>
            
            <div className="flex items-center gap-4">
              <UserAvatarMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t("yourConversations")}</h1>
            <p className="text-muted-foreground">
              {t("manageConversationsSubtitle")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button 
              onClick={createNewSession}
              disabled={creating}
              className="bg-luminus-primary hover:bg-luminus-primary/90"
            >
              {creating ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {t("newConversation")}
            </Button>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t("searchConversations")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Sessions List */}
          <div className="space-y-8">
            {Object.entries(sessionGroups).map(([group, groupSessions]) => {
              if (groupSessions.length === 0) return null;

              return (
                <div key={group}>
                  <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                    {group}
                  </h2>
                  <div className="grid gap-4">
                    {groupSessions.map(session => (
                      <Link key={session.id} to={`/sessions/${session.id}`}>
                        <Card className="hover:shadow-medium transition-all cursor-pointer border-0 bg-gradient-card">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold mb-2 truncate">
                                  {session.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {session.lastMessage || t("noMessageYet")}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <MessageCircle className="w-3 h-3" />
                                    <span>{session.messageCount} {t("messages")}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      +                                      {session.updatedAt ?
                                      formatDistanceToNow(session.updatedAt.toDate(), {
                                      addSuffix: true,
                                      locale: getDateFnsLocale(locale)
                                      }) :
                                      (new Date()).toLocaleDateString(locale)
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <MessageCircle className="w-5 h-5 text-luminus-primary flex-shrink-0 ml-4" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {sessions.length === 0 && (
            <Card className="text-center py-12 border-0 bg-gradient-card">
              <CardContent>
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhuma conversa encontrada
                </h3>
                <p className="text-muted-foreground mb-6">
                  Comece sua primeira conversa com a IA clicando no botão abaixo.
                </p>
                <Button 
                  onClick={createNewSession}
                  disabled={creating}
                  className="bg-luminus-primary hover:bg-luminus-primary/90"
                >
                  {creating ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {t("createFirstConversation")}
                </Button>
              </CardContent>
            </Card>
          )}

          {filteredSessions.length === 0 && sessions.length > 0 && (
            <Card className="text-center py-12 border-0 bg-gradient-card">
              <CardContent>
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhuma conversa encontrada
                </h3>
                <p className="text-muted-foreground">
                  Tente ajustar os termos da sua busca.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Sessions() {
  return (
    <AuthGuard>
      <SessionsList />
    </AuthGuard>
  );
}