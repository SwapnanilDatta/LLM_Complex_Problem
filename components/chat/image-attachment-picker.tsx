'use client'

import { useRef, useCallback } from 'react'
import { FileImage, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Attachment } from '@/lib/store'

async function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface ImageAttachmentPickerProps {
  attachments: Attachment[]
  setAttachments: (attachments: Attachment[]) => void
  disabled?: boolean
}

export function ImageAttachmentPicker({ attachments, setAttachments, disabled }: ImageAttachmentPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: Attachment[] = []
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/')
      const data = isImage ? await toBase64(file) : undefined
      newAttachments.push({
        id: crypto.randomUUID(),
        name: file.name,
        type: isImage ? 'image' : 'file',
        url: URL.createObjectURL(file),
        preview: isImage ? URL.createObjectURL(file) : undefined,
        data,
      })
    }

    setAttachments(prev => [...prev, ...newAttachments])
    e.target.value = ''
  }, [setAttachments])

  const removeAttachment = useCallback(
    (id: string) => {
      setAttachments(prev => {
        const removal = prev.find(att => att.id === id)
        if (removal?.url) URL.revokeObjectURL(removal.url)
        if (removal?.preview) URL.revokeObjectURL(removal.preview)
        return prev.filter(att => att.id !== id)
      })
    },
    [setAttachments]
  )

  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-muted-foreground">Attach images for multimodal reasoning</div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            multiple
            onChange={handleFileSelect}
            disabled={disabled}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <FileImage className="mr-2 h-4 w-4" /> Attach Image
          </Button>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {attachments.map(att => (
            <div key={att.id} className="relative overflow-hidden rounded-2xl border border-border bg-card">
              {att.type === 'image' && att.preview ? (
                <img src={att.preview} alt={att.name} className="h-28 w-full object-cover" />
              ) : (
                <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">{att.name}</div>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/70 text-muted-foreground hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
