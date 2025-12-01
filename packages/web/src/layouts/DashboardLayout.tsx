import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Outlet, Navigate } from "react-router"
import { authClient } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"

export function DashboardLayout() {
  const { data: session, isPending, error } = authClient.useSession()

  if (isPending) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !session) {
    return <Navigate to="/auth/login" replace />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="flex h-16 items-center px-4 border-b">
            <SidebarTrigger />
            <div className="ml-4 font-semibold">Dashboard</div>
        </div>
        <div className="p-4 md:p-8">
            <Outlet />
        </div>
      </main>
    </SidebarProvider>
  )
}
