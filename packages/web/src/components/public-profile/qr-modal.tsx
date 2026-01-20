import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  displayName: string;
}

export function QrModal({
  isOpen,
  onClose,
  username,
  displayName,
}: QrModalProps) {
  // In a real app, we would generate a real QR code here.
  // For MVP, we can use a placeholder or a library like `react-qr-code` if installed.
  // Since I don't see it in package.json, I'll use a placeholder image service for now.
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    `https://mediapp.app/${username}`,
  )}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Escanea para conectar
          </DialogTitle>
          <DialogDescription className="text-center">
            Comparte el perfil de {displayName}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <img
              src={qrUrl}
              alt={`QR Code for ${username}`}
              className="w-48 h-48 object-contain"
            />
          </div>
          <Button className="w-full" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Descargar QR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
