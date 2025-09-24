import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { UserAvatarMenu } from "./UserAvatarMenu";

function AdminLayoutContent() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-12 flex items-center border-b bg-background/30 dark:bg-luminus-primary/10 backdrop-blur-sm px-4">
                     <SidebarTrigger className="mr-2" />
                     <div className="ml-auto">
                       <UserAvatarMenu />
                     </div>
                   </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export function AdminLayout() {
  return (
    <AuthGuard>
      <AdminLayoutContent />
    </AuthGuard>
  );
}