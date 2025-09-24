import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Clock,
  Calendar,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, query, getDocs, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConversationData {
  id: string;
  title: string;
  userId: string;
  messageCount: number;
  duration: number; // in minutes
  createdAt: Date;
  category: string;
}

interface ReportMetrics {
  totalConversations: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
  avgConversationDuration: number;
  activeUsers: number;
  topCategories: { category: string; count: number }[];
  dailyStats: { date: string; conversations: number; messages: number }[];
}

const reportTypes = [
  { value: "overview", label: "Visão Geral" },
  { value: "conversations", label: "Análise de Conversas" },
  { value: "users", label: "Atividade de Usuários" },
  { value: "performance", label: "Performance da IA" }
];

// Mock function to categorize conversations based on title/content
const categorizeConversation = (title: string): string => {
  const lower = title.toLowerCase();
  if (lower.includes('produtividade') || lower.includes('organização')) return 'Produtividade';
  if (lower.includes('tecnologia') || lower.includes('programação') || lower.includes('desenvolvimento')) return 'Tecnologia';
  if (lower.includes('negócio') || lower.includes('estratégia') || lower.includes('vendas')) return 'Negócios';
  if (lower.includes('criatividade') || lower.includes('design') || lower.includes('arte')) return 'Criatividade';
  return 'Geral';
};

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("overview");
  const [startDate, setStartDate] = useState(format(addDays(new Date(), -30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [metrics, setMetrics] = useState<ReportMetrics>({
    totalConversations: 0,
    totalMessages: 0,
    avgMessagesPerConversation: 0,
    avgConversationDuration: 0,
    activeUsers: 0,
    topCategories: [],
    dailyStats: []
  });
  const [conversationData, setConversationData] = useState<ConversationData[]>([]);
  const [exporting, setExporting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadReportData();
  }, [startDate, endDate, reportType]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Load sessions data
      const sessionsQuery = query(
        collection(db, "sessions"),
        orderBy("createdAt", "desc")
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      const conversations: ConversationData[] = [];
      let totalMessages = 0;
      let totalDuration = 0;
      const userSet = new Set<string>();
      const categoryCount: { [key: string]: number } = {};

      sessionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        
        // Filter by date range if specified
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        if (createdAt < startDateObj || createdAt > endDateObj) {
          return;
        }

        const messageCount = data.messages?.length || 0;
        const category = categorizeConversation(data.title || 'Conversa');
        
        // Simulate conversation duration (in reality, calculate from message timestamps)
        const duration = Math.floor(Math.random() * 30) + 5; // 5-35 minutes
        
        conversations.push({
          id: doc.id,
          title: data.title || 'Conversa sem título',
          userId: data.userId,
          messageCount,
          duration,
          createdAt,
          category
        });

        totalMessages += messageCount;
        totalDuration += duration;
        userSet.add(data.userId);
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      // Sort categories by count
      const topCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Generate daily stats (simplified)
      const dailyStats = [];
      const days = Math.min(7, conversations.length);
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const dayConversations = conversations.filter(conv => {
          const convDate = conv.createdAt.toDateString();
          return convDate === date.toDateString();
        });

        dailyStats.unshift({
          date: format(date, 'dd/MM', { locale: ptBR }),
          conversations: dayConversations.length,
          messages: dayConversations.reduce((sum, conv) => sum + conv.messageCount, 0)
        });
      }

      setMetrics({
        totalConversations: conversations.length,
        totalMessages,
        avgMessagesPerConversation: conversations.length > 0 ? Math.round(totalMessages / conversations.length) : 0,
        avgConversationDuration: conversations.length > 0 ? Math.round(totalDuration / conversations.length) : 0,
        activeUsers: userSet.size,
        topCategories,
        dailyStats
      });

      setConversationData(conversations);

    } catch (error) {
      console.error('Error loading report data:', error);
      toast({
        title: "Erro ao carregar relatórios",
        description: "Não foi possível carregar os dados dos relatórios.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    setExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportData = {
        type: reportType,
        dateRange: { from: startDate, to: endDate },
        metrics,
        conversations: conversationData
      };

      // In a real implementation, you would generate and download a file
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `practia-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Relatório exportado!",
        description: "O arquivo foi baixado com sucesso."
      });

    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Analytics e insights do sistema Practia
          </p>
        </div>

        <Button 
          onClick={exportReport}
          disabled={exporting}
          className="bg-luminus-primary hover:bg-luminus-primary/90"
        >
          {exporting ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Exportar Relatório
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 bg-gradient-card shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 bg-gradient-card shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
            <MessageCircle className="h-4 w-4 text-luminus-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              No período selecionado
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-card shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
            <BarChart3 className="h-4 w-4 text-luminus-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              Média de {metrics.avgMessagesPerConversation} por conversa
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-card shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-luminus-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Usuários únicos
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-card shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <Clock className="h-4 w-4 text-luminus-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgConversationDuration}min</div>
            <p className="text-xs text-muted-foreground">
              Por conversa
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <Card className="border-0 bg-gradient-card shadow-medium">
          <CardHeader>
            <CardTitle>Categorias Mais Populares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topCategories.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-luminus-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-luminus-primary">
                        {index + 1}
                      </span>
                    </div>
                    <span className="font-medium">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{category.count}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((category.count / metrics.totalConversations) * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Activity */}
        <Card className="border-0 bg-gradient-card shadow-medium">
          <CardHeader>
            <CardTitle>Atividade Diária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.dailyStats.map((day) => (
                <div key={day.date} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{day.date}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      {day.conversations} conversas
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {day.messages} mensagens
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations Detail Table */}
      <Card className="border-0 bg-gradient-card shadow-medium">
        <CardHeader>
          <CardTitle>Detalhes das Conversas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Mensagens</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversationData.slice(0, 10).map((conversation) => (
                  <TableRow key={conversation.id}>
                    <TableCell>
                      <div className="font-medium truncate max-w-[200px]">
                        {conversation.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-muted rounded-full text-xs">
                        {conversation.category}
                      </span>
                    </TableCell>
                    <TableCell>{conversation.messageCount}</TableCell>
                    <TableCell>{conversation.duration}min</TableCell>
                    <TableCell>
                      {format(conversation.createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {conversationData.length > 10 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Mostrando 10 de {conversationData.length} conversas
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}