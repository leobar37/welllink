import { useState } from "react"
import { useNavigate } from "react-router"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, LogOut } from "lucide-react"

export function Settings() {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate("/auth/login")
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
        const { error } = await authClient.changePassword({
            newPassword,
            currentPassword,
            revokeOtherSessions: true
        })

        if (error) {
            toast.error(error.message || "Error al actualizar la contraseña")
            return
        }

        toast.success("Contraseña actualizada exitosamente")
        setCurrentPassword("")
        setNewPassword("")
    } catch (err) {
        console.error(err)
        toast.error("Ocurrió un error")
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
            <CardHeader>
                <CardTitle>Cuenta</CardTitle>
                <CardDescription>Administra los detalles de tu cuenta.</CardDescription>
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
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new">Nueva Contraseña</Label>
                        <Input
                            id="new"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>
                    <Button type="submit" disabled={loading || !currentPassword || !newPassword}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Actualizar Contraseña
                    </Button>
                </form>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
