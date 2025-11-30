import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, QrCode } from "lucide-react";
import { QrModal } from "./qr-modal";
import { toast } from "sonner";

interface FloatingActionsProps {
    username: string;
    displayName: string;
}

export function FloatingActions({ username, displayName }: FloatingActionsProps) {
    const [showQr, setShowQr] = useState(false);

    const handleShare = async () => {
        const url = `${window.location.origin}/${username}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Perfil de ${displayName}`,
                    text: `Conecta con ${displayName} en Wellness Link`,
                    url,
                });
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(url);
                toast.success("Link copiado al portapapeles");
            } catch {
                toast.error("No se pudo copiar el link");
            }
        }
    };

    return (
        <>
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 bg-background/80 backdrop-blur-md border rounded-full shadow-lg z-50">
                <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full gap-2 px-4"
                    onClick={handleShare}
                >
                    <Share2 className="h-4 w-4" />
                    <span className="font-medium">Compartir</span>
                </Button>
                <div className="w-px h-4 bg-border" />
                <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full gap-2 px-4"
                    onClick={() => setShowQr(true)}
                >
                    <QrCode className="h-4 w-4" />
                    <span className="font-medium">QR</span>
                </Button>
            </div>

            <QrModal
                isOpen={showQr}
                onClose={() => setShowQr(false)}
                username={username}
                displayName={displayName}
            />
        </>
    );
}
