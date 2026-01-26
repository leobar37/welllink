import {
  User,
  Settings,
  QrCode,
  Sparkles,
  LayoutDashboard,
  Link as LinkIcon,
  Palette,
  Users,
  Stethoscope,
  Folder,
  Calendar,
  Clock,
  CalendarDays,
  Bot,
  MessageCircle,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router";

// Menu items.
const items = [
  {
    title: "Panel",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Reservas",
    url: "/dashboard/reservations",
    icon: Calendar,
  },
  {
    title: "Disponibilidad",
    url: "/dashboard/availability",
    icon: Clock,
  },
  {
    title: "Slots",
    url: "/dashboard/slots",
    icon: CalendarDays,
  },
  {
    title: "Perfil",
    url: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Enlaces Sociales",
    url: "/dashboard/social",
    icon: LinkIcon,
  },
  {
    title: "Clientes",
    url: "/dashboard/clients",
    icon: Users,
  },
  {
    title: "Agente IA",
    url: "/dashboard/agent-config",
    icon: Bot,
  },
  {
    title: "Conversaciones",
    url: "/dashboard/conversations",
    icon: MessageCircle,
  },
  {
    title: "Servicios Médicos",
    url: "/dashboard/services",
    icon: Stethoscope,
  },
  {
    title: "Funciones",
    url: "/dashboard/features",
    icon: Sparkles,
  },
  {
    title: "Temas",
    url: "/dashboard/themes",
    icon: Palette,
  },
  {
    title: "QR y Tarjeta",
    url: "/dashboard/qr",
    icon: QrCode,
  },
  {
    title: "Configuración",
    url: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Archivos",
    url: "/dashboard/files",
    icon: Folder,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-4 py-2">
          <Logo size="md" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
