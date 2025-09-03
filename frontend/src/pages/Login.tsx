import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Eye, EyeOff } from "lucide-react";
import { useT } from "@/lib/i18n";

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = useT();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: t("loginSuccessTitle"),
          description: t("loginSuccessDesc"),
        });
        navigate("/sessions");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: t("accountCreatedTitle"),
          description: t("accountCreatedDesc"),
        });
        navigate("/sessions");
      }
    } catch (error: any) {
      toast({
        title: t("authErrorTitle"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, insira seu email para recuperar a senha.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: t("emailSentTitle"),
        description: t("emailSentDesc"),
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        title: t("emailErrorTitle"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col text-center mb-8 justify-center items-center">
          <Link to="/">
            <Logo size="lg" className="justify-center mb-4" />
          </Link>
          <p className="text-muted-foreground mt-2">
            {isLogin ? t("loginSubtitle") : t("registerSubtitle")}
          </p>
        </div>

        <Card className="shadow-strong border-0">
          <CardHeader>
            <CardTitle>{showForgotPassword ? t("recoverPassword") : isLogin ? t("login") : t("register")}</CardTitle>
            <CardDescription>
              {showForgotPassword
                ? t("sendResetEmail")
                : isLogin
                ? t("enter")
                : t("createAccount")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-luminus-primary hover:bg-luminus-primary/90" 
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : null}
                  Enviar Email de Recuperação
                </Button>

                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full" 
                  onClick={() => setShowForgotPassword(false)}
                >
                  Voltar ao Login
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">{t("fullName")}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button 
                    type="submit" 
                    className="w-full bg-luminus-primary hover:bg-luminus-primary/90" 
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                {isLogin ? t("enter") : t("createAccount")}
              </Button>
            </form>
            )}

            {!showForgotPassword && (
              <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {isLogin ? (
                  <>
                    Esqueceu sua senha?{" "}
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-luminus-primary hover:underline font-medium"
                    >
                      {t("clickHere")}
                    </button>
                  </>
                ) : (
                  <>
                    Já tem uma conta?{" "}
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-luminus-primary hover:underline font-medium"
                    >
                      {t("alreadyHaveAccount")} {" "}
                      Fazer login
                    </button>
                  </>
                )}
              </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {t("backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <AuthGuard requireAuth={false}>
      <LoginForm />
    </AuthGuard>
  );
}