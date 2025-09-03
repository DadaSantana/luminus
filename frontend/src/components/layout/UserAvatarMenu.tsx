import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useLocaleStore } from "@/store/localeStore";
import { Settings, User as UserIcon, LogOut, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useT } from "@/lib/i18n";

function getInitials(name?: string, email?: string) {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  if (email) return email.charAt(0).toUpperCase();
  return "U";
}

export function UserAvatarMenu() {
  const { user, userData } = useAuthStore();
  const isAdmin = (userData?.userType || "").toLowerCase() === "admin";
  const { isDark, setTheme, toggleTheme } = useThemeStore();
  const { locale, setLocale } = useLocaleStore();
  const navigate = useNavigate();
  const t = useT();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (e) {
      // noop - toast global poderá capturar
    }
  };

  const initials = getInitials(userData?.name, user?.email || undefined);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center justify-center h-10 w-10 rounded-full border bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring">
          <Avatar className="h-9 w-9">
            {user?.photoURL ? (
              <AvatarImage src={user.photoURL} alt={userData?.name || user.email || t('user')} />
            ) : (
              <AvatarFallback>{initials}</AvatarFallback>
            )}
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              {user?.photoURL ? (
                <AvatarImage src={user.photoURL} alt={userData?.name || user.email || t('user')} />
              ) : (
                <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium truncate">{userData?.name || user?.email || t('user')}</div>
              {user?.email && <div className="text-xs text-muted-foreground truncate">{user.email}</div>}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem onClick={() => navigate("/main/overview")} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>{t("manage")}</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
          <UserIcon className="mr-2 h-4 w-4" />
          <span>{t("profile")}</span>
        </DropdownMenuItem>
        <div className="px-2 py-1.5 flex items-center justify-between">
          <span className="text-sm">{t("theme")}</span>
          <div className="flex items-center gap-2">
            {isDark ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
            <Switch checked={isDark} onCheckedChange={(v) => setTheme(v)} aria-label={t("toggleTheme")} />
          </div>
        </div>
        <div className="px-2 py-1.5">
          <div className="text-sm mb-2">{t("language")}</div>
          <div className="grid grid-cols-3 gap-2">
            <button
              className={`text-xs px-2 py-1 rounded border ${locale === 'pt-BR' ? 'bg-muted font-medium' : ''}`}
              onClick={() => setLocale('pt-BR')}
            >
              Português
            </button>
            <button
              className={`text-xs px-2 py-1 rounded border ${locale === 'en-US' ? 'bg-muted font-medium' : ''}`}
              onClick={() => setLocale('en-US')}
            >
              English
            </button>
            <button
              className={`text-xs px-2 py-1 rounded border ${locale === 'es' ? 'bg-muted font-medium' : ''}`}
              onClick={() => setLocale('es')}
            >
              Español
            </button>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className={`cursor-pointer ${isDark ? 'text-white hover:text-white focus:text-white' : 'text-destructive focus:text-destructive'}`}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserAvatarMenu;