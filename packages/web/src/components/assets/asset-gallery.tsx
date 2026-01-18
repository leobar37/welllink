import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useAssets, type Asset, getAssetCategory } from "@/hooks/use-assets";
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
  Film,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface AssetGalleryProps {
  profileId: string;
}

// Formatear tamaño en bytes a KB/MB
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${((bytes / 1024) * 1024).toFixed(1)} MB`;
}

// Determinar si es una imagen por mimeType
function isImageAsset(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

// Determinar si es un video por mimeType
function isVideoAsset(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

// Obtener icono según tipo de archivo
function getFileIcon(mimeType: string) {
  if (isImageAsset(mimeType)) {
    return <ImageIcon className="h-12 w-12 text-muted-foreground" />;
  }
  if (isVideoAsset(mimeType)) {
    return <Film className="h-12 w-12 text-muted-foreground" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="h-12 w-12 text-muted-foreground" />;
  }
  return <File className="h-12 w-12 text-muted-foreground" />;
}

export function AssetGallery({ profileId }: AssetGalleryProps) {
  const { assets, isLoading, uploadAsset, deleteAsset, getAssetStats } =
    useAssets(profileId);

  const { data: stats } = getAssetStats(profileId);

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Configuración de Dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadError(null);

      // Crear preview para imágenes y videos
      if (
        selectedFile.type.startsWith("image/") ||
        selectedFile.type.startsWith("video/")
      ) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null);
      }
    }
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    open,
  } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
      "video/*": [],
      "application/pdf": [".pdf"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
    noClick: !!file, // Desactivar click cuando hay archivo seleccionado
  });

  // Filtrar assets por categoría
  const filteredAssets = assets?.filter((asset) => {
    if (filterCategory === "all") return true;
    return getAssetCategory(asset.mimeType) === filterCategory;
  });

  // Obtener categorías únicas de los assets
  const categories = ["all", "Imagen", "Video", "PDF"];

  const handleUpload = async () => {
    if (!file) {
      setUploadError("Por favor selecciona un archivo");
      return;
    }

    try {
      await uploadAsset.mutateAsync({ file });

      // Limpiar y cerrar
      setFile(null);
      setPreviewUrl(null);
      setUploadError(null);
      setIsUploadModalOpen(false);
    } catch (error) {
      setUploadError("Error al subir el archivo. Inténtalo de nuevo.");
    }
  };

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setUploadError(null);
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
        <div className="grid gap-4 md:grid-cols-3">
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
        </div>
      )}

      {/* Filtros por categoría */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrar:</span>
          <div className="flex gap-1">
            {categories.map((category) => (
              <Button
                key={category}
                variant={filterCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCategory(category)}
              >
                {category === "all" ? "Todos" : category}
              </Button>
            ))}
          </div>
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
                      isImageAsset(asset.mimeType) && "cursor-pointer",
                    )}
                    onClick={() => {
                      if (
                        isImageAsset(asset.mimeType) ||
                        isVideoAsset(asset.mimeType)
                      ) {
                        setSelectedAsset(asset);
                      }
                    }}
                  >
                    {(isImageAsset(asset.mimeType) ||
                      isVideoAsset(asset.mimeType)) &&
                    asset.url ? (
                      isVideoAsset(asset.mimeType) ? (
                        <div className="relative w-full h-full">
                          <video
                            src={asset.url}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Film className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={asset.url}
                          alt={asset.filename}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      getFileIcon(asset.mimeType)
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
                              <DropdownMenuItem
                                onClick={() => handleCopyUrl(asset.url!)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copiar URL
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownload(asset)}
                              >
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
                        {getAssetCategory(asset.mimeType)}
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
              {filterCategory === "all"
                ? "No hay archivos subidos aún"
                : `No hay archivos de tipo "${filterCategory}"`}
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

      {/* Modal de subida con Dropzone */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subir Archivo</DialogTitle>
            <DialogDescription>
              Arrastra un archivo o haz clic para seleccionar
            </DialogDescription>
          </DialogHeader>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive && "border-primary bg-primary/5",
              isDragAccept && "border-green-500 bg-green-500/5",
              isDragReject && "border-destructive bg-destructive/5",
            )}
          >
            <input {...getInputProps()} />

            {file ? (
              <div className="space-y-4">
                {/* Preview */}
                {previewUrl ? (
                  <div className="relative">
                    {file.type.startsWith("video/") ? (
                      <video
                        src={previewUrl}
                        className="w-full rounded-md object-cover max-h-48 mx-auto"
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full rounded-md object-cover max-h-48 mx-auto"
                      />
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearFile();
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    {getFileIcon(file.type)}
                  </div>
                )}

                <div className="text-sm">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={open}>
                    Cambiar archivo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-primary">Suelta el archivo aquí...</p>
                ) : (
                  <>
                    <p>Arrastra archivos aquí o haz clic para seleccionar</p>
                    <p className="text-xs text-muted-foreground">
                      Imágenes, videos y PDF hasta 50MB
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Error message */}
          {uploadError && (
            <p className="text-sm text-destructive text-center">
              {uploadError}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                handleClearFile();
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

      {/* Modal de preview de imagen/video */}
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
            {selectedAsset &&
              selectedAsset.url &&
              (isVideoAsset(selectedAsset.mimeType) ? (
                <video
                  src={selectedAsset.url}
                  controls
                  className="max-w-full max-h-[60vh] object-contain"
                />
              ) : (
                <img
                  src={selectedAsset.url}
                  alt={selectedAsset.filename}
                  className="max-w-full max-h-[60vh] object-contain"
                />
              ))}
          </div>
          <DialogFooter>
            {selectedAsset?.url && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleDownload(selectedAsset)}
                >
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
