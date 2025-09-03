import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { Link } from "react-router-dom";
import { MessageCircle, Users, BarChart3, Shield, Zap, Brain } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function Home() {
  const t = useT();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Logo size="lg" />
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="outline">{t('enter')}</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-luminus-primary to-luminus-primary/80 bg-clip-text text-transparent">
            Practia
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 mb-8 leading-relaxed">
            {t('aiChatInterface')}
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            {t('homeDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="bg-gradient-to-r from-luminus-primary to-luminus-primary/90 hover:from-luminus-primary/90 hover:to-luminus-primary text-white shadow-strong">
                {t('startConversation')}
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              {t('learnFeatures')}
            </Button>
          </div>
        </div>

        {/* Demo Chat Interface */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="bg-gradient-card shadow-strong border-0">
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <div className="bg-luminus-primary text-white px-4 py-2 rounded-2xl rounded-br-sm max-w-xs">
                    {t('demoQuestion')}
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-sm max-w-md">
                    {t('demoAnswer').split('\n').map((line, index) => (
                      <span key={index}>
                        {line}
                        {index < t('demoAnswer').split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-practia-red text-white px-4 py-2 rounded-2xl rounded-br-sm max-w-xs">
                    {t('demoFollowUp')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gradient-card shadow-medium border-0 hover:shadow-strong transition-shadow">
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-12 h-12 text-luminus-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('intelligentConversations')}</h3>
              <p className="text-muted-foreground">
                {t('intelligentConversationsDesc')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-medium border-0 hover:shadow-strong transition-shadow">
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-12 h-12 text-luminus-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('detailedAnalytics')}</h3>
              <p className="text-muted-foreground">
                {t('detailedAnalyticsDesc')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-medium border-0 hover:shadow-strong transition-shadow">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-luminus-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('userManagement')}</h3>
              <p className="text-muted-foreground">
                {t('userManagementDesc')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-luminus-primary flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-lg font-semibold mb-2">{t('advancedSecurity')}</h4>
              <p className="text-muted-foreground">
                {t('advancedSecurityDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Zap className="w-8 h-8 text-luminus-primary flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-lg font-semibold mb-2">{t('optimizedPerformance')}</h4>
              <p className="text-muted-foreground">
                {t('optimizedPerformanceDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Brain className="w-8 h-8 text-luminus-primary flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-lg font-semibold mb-2">{t('contextualAI')}</h4>
              <p className="text-muted-foreground">
                {t('contextualAIDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <MessageCircle className="w-8 h-8 text-luminus-primary flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-lg font-semibold mb-2">{t('intuitiveInterface')}</h4>
              <p className="text-muted-foreground">
                {t('intuitiveInterfaceDesc')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <Logo className="justify-center mb-4" />
          <p className="text-muted-foreground">
            A company of <span className="text-luminus-primary font-semibold">publicis sapient</span>
          </p>
        </div>
      </footer>
    </div>
  );
}