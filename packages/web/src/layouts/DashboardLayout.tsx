import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Outlet, Navigate } from "react-router";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import {
  PreviewPanelProvider,
  PreviewPanel,
  PreviewTrigger,
} from "@/components/preview-panel";
import { UserMenu } from "@/components/user-menu";

export function DashboardLayout() {
  const { data: session, isPending, error } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !session) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <PreviewPanelProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="font-semibold">Panel</div>
            </div>
            <UserMenu />
          </div>
          <div className="p-4 md:p-8">
            <Outlet />
          </div>
        </main>
        <PreviewTrigger />
        <PreviewPanel />
      </SidebarProvider>
    </PreviewPanelProvider>
  );
}
