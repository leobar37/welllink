import {
  User,
  Settings,
  QrCode,
  Sparkles,
  LayoutDashboard,
  Link as LinkIcon,
  Palette,
  Users,
  Scissors,
  Folder,
  Calendar,
  Bot,
  MessageCircle,
  Smartphone,
  HelpCircle,
  Package,
  Truck,
} from "lucide-react";
import { LogoCitaBot } from "@/components/ui/logo-citabot";
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
  // Availability: REMOVED - now configured in profile settings
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
    title: "FAQs",
    url: "/dashboard/faq",
    icon: HelpCircle,
  },
  {
    title: "WhatsApp",
    url: "/dashboard/whatsapp",
    icon: Smartphone,
  },
  {
    title: "Conversaciones",
    url: "/dashboard/conversations",
    icon: MessageCircle,
  },
  {
    title: "Servicios",
    url: "/dashboard/services",
    icon: Scissors,
  },
  {
    title: "Inventario",
    url: "/dashboard/inventory",
    icon: Package,
  },
  {
    title: "Proveedores",
    url: "/dashboard/suppliers",
    icon: Truck,
  },
  {
    title: "Personal",
    url: "/dashboard/staff",
    icon: Users,
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
          <LogoCitaBot size="md" />
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
