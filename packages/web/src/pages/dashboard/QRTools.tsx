import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Download, Loader2, Share2 } from "lucide-react"
import { toast } from "sonner"
import { toPng } from "html-to-image"
import { useProfile } from "@/hooks/use-profile"

export function QRTools() {
  const { profile, isLoading } = useProfile()
  const cardRef = useRef<HTMLDivElement>(null)

  if (isLoading || !profile) {
    return <Loader2 className="h-8 w-8 animate-spin" />
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    `${window.location.origin}/${profile.username}`
  )}`

  const downloadQr = async () => {
    try {
        const response = await fetch(qrUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr-${profile.username}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) {
        console.error(err)
        toast.error("Error al descargar el QR")
    }
  }

  const downloadCard = async () => {
    if (cardRef.current === null) {
      return
    }

    try {
        const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 })
        const link = document.createElement('a')
        link.download = `card-${profile.username}.png`
        link.href = dataUrl
        link.click()
        toast.success("Tarjeta descargada")
    } catch (err) {
      console.error(err)
      toast.error("Error al generar la tarjeta")
    }
  }

  const avatarUrl = profile.avatarId ? `/api/assets/${profile.avatarId}/public` : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">QR y Tarjeta Virtual</h1>
      </div>

      <Tabs defaultValue="qr" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="qr">Código QR</TabsTrigger>
          <TabsTrigger value="card">Tarjeta Virtual</TabsTrigger>
        </TabsList>
        
        <TabsContent value="qr" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Tu Código QR</CardTitle>
                    <CardDescription>Escanea para visitar tu perfil al instante.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6">
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                        <img src={qrUrl} alt="Código QR" className="w-64 h-64" />
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={downloadQr}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar PNG
                        </Button>
                        <Button variant="outline" onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/${profile.username}`)
                            toast.success("Enlace copiado")
                        }}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Copiar Enlace
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="card">
            <Card>
                <CardHeader>
                    <CardTitle>Tarjeta de Presentación Digital</CardTitle>
                    <CardDescription>Descarga y comparte esta imagen en redes sociales o imprímela.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6">
                    {/* Card Preview Area */}
                    <div
                        ref={cardRef}
                        className="w-[350px] h-[200px] bg-gradient-to-br from-primary/90 to-primary rounded-xl shadow-lg p-6 text-primary-foreground flex flex-col justify-between relative overflow-hidden"
                    >
                        {/* Background Pattern */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl" />

                        <div className="flex items-start gap-4 z-10">
                            <Avatar className="h-16 w-16 border-2 border-white/50 shadow-md">
                                <AvatarImage src={avatarUrl || ""} />
                                <AvatarFallback className="text-primary bg-white">
                                    {profile.displayName[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">{profile.displayName}</h3>
                                <p className="text-sm opacity-90">{profile.title || "Asesor de Bienestar"}</p>
                            </div>
                        </div>

                        <div className="flex items-end justify-between z-10">
                            <div className="text-sm font-medium opacity-90">
                                wellness.link/{profile.username}
                            </div>
                            <div className="bg-white p-1 rounded-md">
                                <img src={qrUrl} className="w-12 h-12" alt="QR" />
                            </div>
                        </div>
                    </div>

                    <Button onClick={downloadCard}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar Tarjeta
                    </Button>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
