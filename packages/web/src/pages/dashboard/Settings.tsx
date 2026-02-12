import { useNavigate } from "react-router";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  LogOut,
  CreditCard,
  Bot,
  Settings as SettingsIcon,
} from "lucide-react";

export function Settings() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/auth/login");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // Password change logic would go here
    toast.success("Funcionalidad de cambio de contraseña en desarrollo");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle>Cuenta</CardTitle>
            <CardDescription>
              Administra los detalles de tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <Input value={session?.user.email} disabled />
            </div>
            <div className="pt-2">
              <Button variant="destructive" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle>Seguridad</CardTitle>
            <CardDescription>Actualiza tu contraseña.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Contraseña Actual</Label>
                <Input
                  id="current"
                  type="password"
                  placeholder="Ingresa tu contraseña actual"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">Nueva Contraseña</Label>
                <Input
                  id="new"
                  type="password"
                  placeholder="Ingresa tu nueva contraseña"
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit">Actualizar Contraseña</Button>
            </form>
          </CardContent>
        </Card>

        {/* AI Agent Configuration Section */}
        <Card>
          <CardHeader>
            <CardTitle>Agente de IA</CardTitle>
            <CardDescription>
              Personaliza el comportamiento de tu asistente virtual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bot className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Configurar Agente</p>
                  <p className="text-sm text-gray-600">
                    Personaliza el tono, mensajes y comportamiento del asistente
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/dashboard/agent-config")}
                variant="outline"
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Section */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pago</CardTitle>
            <CardDescription>
              Configura los métodos de pago que aceptas en tu clínica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    Gestionar Métodos de Pago
                  </p>
                  <p className="text-sm text-gray-600">
                    Configura efectivo, tarjetas, transferencias y más
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/dashboard/payment-methods")}
                variant="outline"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
