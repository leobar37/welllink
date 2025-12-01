import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"
import { api } from "@/lib/api"

type StepAvatarPayload = {
  fileId?: string | null
}

export function StepAvatar({ onNext }: { onNext: (data: StepAvatarPayload) => void }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileId, setFileId] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const { data, error } = await api.api.upload.post({
        file: file,
        type: 'avatar'
      })

      if (error) {
        toast.error("Error al subir la imagen")
        console.error(error)
        return
      }

      if (data) {
        setFileId(data.id)
        toast.success("Imagen subida")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error al subir la imagen")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = () => {
    onNext({ fileId })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agrega una Foto de Perfil</CardTitle>
        <CardDescription>
          Ayuda a que las personas te reconozcan.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <Avatar className="h-32 w-32 border-2">
          <AvatarImage src={preview || ""} />
          <AvatarFallback className="text-4xl">?</AvatarFallback>
        </Avatar>
        
        <div className="w-full max-w-xs">
            <label htmlFor="avatar-upload" className="cursor-pointer w-full">
                <div className="flex items-center justify-center w-full h-12 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none hover:border-gray-400 focus:outline-none">
                    <span className="flex items-center space-x-2">
                        <Upload className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-600">
                            {uploading ? "Subiendo..." : "Clic para subir"}
                        </span>
                    </span>
                    <input 
                        id="avatar-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                </div>
            </label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={() => onNext({})}>
          Omitir
        </Button>
        <Button onClick={handleSubmit} disabled={uploading || !fileId}>
          {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continuar
        </Button>
      </CardFooter>
    </Card>
  )
}
