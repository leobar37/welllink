import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  useAssets,
  type Asset,
  type AssetType,
} from "@/hooks/use-assets";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  File,
  Download,
  Copy,
  MoreHorizontal,
  Trash2,
  Upload,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface AssetGalleryProps {
  profileId: string;
}

// Configuración de tipos de assets
const ASSET_TYPES: { value: AssetType; label: string; icon: React.ReactNode }[] = [
  { value: "image", label: "Imágenes", icon: <ImageIcon className="h-4 w-4" /> },
  { value: "avatar", label: "Avatares", icon: <ImageIcon className="h-4 w-4" /> },
  { value: "cover", label: "Covers", icon: <ImageIcon className="h-4 w-4" /> },
  { value: "document", label: "Documentos", icon: <FileText className="h-4 w-4" /> },
  { value: "story-image", label: "Story Images", icon: <ImageIcon className="h-4 w-4" /> },
];

// Formatear tamaño en bytes a KB/MB
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Determinar si es una imagen por mimeType
function isImageAsset(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

// Obtener icono según tipo de archivo
function getFileIcon(asset: Asset) {
  if (isImageAsset(asset.mimeType)) {
    return <ImageIcon className="h-12 w-12 text-muted-foreground" />;
  }
  return <File className="h-12 w-12 text-muted-foreground" />;
}

export function AssetGallery({ profileId }: AssetGalleryProps) {
  const {
    assets,
    isLoading,
    uploadAsset,
    deleteAsset,
    getAssetStats,
  } = useAssets(profileId);

  const { data: stats } = getAssetStats(profileId);
  
  const [filterType, setFilterType] = useState<AssetType | "all">("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<AssetType>("image");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Filtrar assets por tipo
  const filteredAssets = assets?.filter(
    (asset) => filterType === "all" || asset.type === filterType
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Crear preview solo para imágenes
      if (selectedFile.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Por favor selecciona un archivo");
      return;
    }

    await uploadAsset.mutateAsync({ file, type: uploadType });

    // Limpiar y cerrar
    setFile(null);
    setPreviewUrl(null);
    setUploadType("image");
    setIsUploadModalOpen(false);
  };

  const handleDelete = async (assetId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este archivo?")) {
      await deleteAsset.mutateAsync(assetId);
      setSelectedAsset(null);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada al portapapeles");
  };

  const handleDownload = (asset: Asset) => {
    if (asset.url) {
      const link = document.createElement("a");
      link.href = asset.url;
      link.download = asset.filename;
      link.click();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Archivos</h2>
          <p className="text-muted-foreground">
            Gestiona tus archivos y multimedia
          </p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Subir Archivo
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Archivos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Espacio Usado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatFileSize(stats.totalSize)}
              </div>
            </CardContent>
          </Card>
          {Object.entries(stats.assetsByType).slice(0, 2).map(([type, typeData]) => (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardDescription className="capitalize">{type}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{typeData.count}</div>
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(typeData.totalSize)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrar:</span>
          <Select
            value={filterType}
            onValueChange={(value) =>
              setFilterType(value as AssetType | "all")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {ASSET_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    {type.icon}
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredAssets?.length || 0} archivos
        </div>
      </div>

      {/* Grid de assets */}
      {filteredAssets && filteredAssets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden group">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Preview */}
                  <div
                    className={cn(
                      "aspect-square rounded-md bg-muted/50 flex items-center justify-center overflow-hidden",
                      isImageAsset(asset.mimeType) && "cursor-pointer"
                    )}
                    onClick={() => {
                      if (isImageAsset(asset.mimeType)) {
                        setSelectedAsset(asset);
                      }
                    }}
                  >
                    {isImageAsset(asset.mimeType) && asset.url ? (
                      <img
                        src={asset.url}
                        alt={asset.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getFileIcon(asset)
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium truncate flex-1">
                        {asset.filename}
                      </p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {asset.url && (
                            <>
                              <DropdownMenuItem onClick={() => handleCopyUrl(asset.url!)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copiar URL
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(asset)}>
                                <Download className="mr-2 h-4 w-4" />
                                Descargar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(asset.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {asset.type || "file"}
                      </Badge>
                      <span>•</span>
                      <span>{formatFileSize(asset.size)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <File className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filterType === "all"
                ? "No hay archivos subidos aún"
                : `No hay archivos de tipo "${filterType}"`}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Subir primer archivo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de subida */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Archivo</DialogTitle>
            <DialogDescription>
              Selecciona un archivo y el tipo al que pertenece
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="upload-type" className="text-sm font-medium">
                Tipo de archivo *
              </label>
              <Select
                value={uploadType}
                onValueChange={(value) => setUploadType(value as AssetType)}
              >
                <SelectTrigger id="upload-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="upload-file" className="text-sm font-medium">
                Archivo *
              </label>
              <input
                id="upload-file"
                type="file"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                onChange={handleFileSelect}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  {file.name} ({formatFileSize(file.size)})
                </p>
              )}
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full rounded-md object-cover max-h-48"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
                setIsUploadModalOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploadAsset.isPending}
            >
              {uploadAsset.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Subiendo...
                </>
              ) : (
                "Subir Archivo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de preview de imagen */}
      <Dialog
        open={!!selectedAsset}
        onOpenChange={(open) => !open && setSelectedAsset(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedAsset?.filename}</DialogTitle>
            <DialogDescription>
              {selectedAsset?.mimeType} •{" "}
              {selectedAsset && formatFileSize(selectedAsset.size)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden">
            {selectedAsset && selectedAsset.url && (
              <img
                src={selectedAsset.url}
                alt={selectedAsset.filename}
                className="max-w-full max-h-[60vh] object-contain"
              />
            )}
          </div>
          <DialogFooter>
            {selectedAsset?.url && (
              <>
                <Button variant="outline" onClick={() => handleDownload(selectedAsset)}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCopyUrl(selectedAsset.url!)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar URL
                </Button>
              </>
            )}
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedAsset) handleDelete(selectedAsset.id);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
