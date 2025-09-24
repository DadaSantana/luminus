import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useT } from "@/lib/i18n";
import { Users, MessageCircle, TrendingUp, Plus, Activity } from "lucide-react";
import { collection, query, getDocs, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Link } from "react-router-dom";

interface OverviewStats {
  totalUsers: number;
  totalSessions: number;
  totalMessages: number;
  activeToday: number;
  sessionsToday: number;
}

interface RecentActivity {
  id: string;
  type: 'new_user' | 'new_session' | 'message_sent';
  description: string;
  timestamp: Date;
}

export default function Overview() {
  const [stats, setStats] = useState<OverviewStats>({
    totalUsers: 0,
    totalSessions: 0,
    totalMessages: 0,
    activeToday: 0,
    sessionsToday: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useT();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Buscar dados reais do Firebase
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Obter contagem de sessões
      const sessionsQuery = query(collection(db, "sessions"));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const totalSessions = sessionsSnapshot.size;

      // Contar mensagens em todas as sessões
      let totalMessages = 0;
      let sessionsToday = 0;
      const uniqueUsers = new Set();
      const activeUsersToday = new Set();
      
      sessionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Contar mensagens
        if (data.messages) {
          totalMessages += data.messages.length;
        }
        
        // Verificar se a sessão foi criada hoje
        if (data.createdAt?.toDate() >= today) {
          sessionsToday++;
        }
        
        // Adicionar usuário único
        if (data.userId) {
          uniqueUsers.add(data.userId);
          
          // Verificar se o usuário esteve ativo hoje
          const lastActivity = data.lastActivity?.toDate() || data.createdAt?.toDate();
          if (lastActivity && lastActivity >= today) {
            activeUsersToday.add(data.userId);
          }
        }
      });

      setStats({
        totalUsers: uniqueUsers.size,
        totalSessions,
        totalMessages,
        activeToday: activeUsersToday.size,
        sessionsToday
      });

      // Simulated recent activities
      setRecentActivities([
        {
          id: '1',
          type: 'new_session',
          description: 'Nova conversa iniciada sobre produtividade',
          timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
        },
        {
          id: '2',
          type: 'message_sent',
          description: 'Usuário enviou mensagem sobre tecnologia',
          timestamp: new Date(Date.now() - 12 * 60 * 1000) // 12 minutes ago
        },
        {
          id: '3',
          type: 'new_user',
          description: 'Novo usuário registrado: joão@email.com',
          timestamp: new Date(Date.now() - 25 * 60 * 1000) // 25 minutes ago
        },
        {
          id: '4',
          type: 'new_session',
          description: 'Conversa sobre desenvolvimento de software',
          timestamp: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
        }
      ]);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      // Em caso de erro, usar dados padrão
      setStats({
        totalUsers: 0,
        totalSessions: 0,
        totalMessages: 0,
        activeToday: 0,
        sessionsToday: 0
      });
      
      // Definir atividades padrão em caso de erro
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return t("justNow");
    if (diffInMinutes < 60) return t("minutesAgo").replace("{time}", diffInMinutes.toString());
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t("hoursAgo").replace("{time}", diffInHours.toString());
    
    const diffInDays = Math.floor(diffInHours / 24);
    return t("daysAgo").replace("{time}", diffInDays.toString());
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_user':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'new_session':
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'message_sent':
        return <Activity className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard")}</h1>
        <p className="text-muted-foreground">
          {t("systemOverview")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 bg-gradient-card shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalUsers")}</CardTitle>
            <Users className="h-4 w-4 text-luminus-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {t("newThisWeek").replace("{count}", "2")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-card shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalConversations")}</CardTitle>
            <MessageCircle className="h-4 w-4 text-luminus-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {t("newToday").replace("{count}", stats.sessionsToday.toString())}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-card shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("messagesSent")}</CardTitle>
            <Activity className="h-4 w-4 text-luminus-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              {t("todayCount").replace("{count}", Math.floor(stats.totalMessages * 0.15).toString())}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-card shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("activeUsersToday")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-luminus-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeToday}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0 ? t("percentOfTotal").replace("{percent}", Math.round((stats.activeToday / stats.totalUsers) * 100).toString()) : "0% do total"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-0 bg-gradient-card shadow-medium">
          <CardHeader>
            <CardTitle>{t("recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 bg-gradient-card shadow-medium">
          <CardHeader>
            <CardTitle>{t("quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/main/users">
              <Button className="w-full justify-start bg-luminus-primary hover:bg-luminus-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                {t("createNewUser")}
              </Button>
            </Link>
            
            <Link to="/sessions">
              <Button variant="outline" className="w-full justify-start">
                <MessageCircle className="w-4 h-4 mr-2" />
                {t("goToChat")}
              </Button>
            </Link>
            
            <Link to="/main/reports">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                {t("viewReports")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}