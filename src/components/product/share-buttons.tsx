"use client"

import { Share2, Facebook, Twitter, LinkIcon } from "lucide-react"

interface ShareButtonsProps {
  productUrl: string
  productName: string
}

export default function ShareButtons({ productUrl, productName }: ShareButtonsProps) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="text-sm text-gray-600 flex items-center gap-1">
        <Share2 className="w-4 h-4" />
        Compartir:
      </span>
      <button
        onClick={() => {
          const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`
          window.open(url, "_blank", "width=600,height=400")
        }}
        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
      >
        <Facebook className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          const text = `¡Mira esta increíble figura: ${productName}!`
          const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productUrl)}`
          window.open(url, "_blank", "width=600,height=400")
        }}
        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
      >
        <Twitter className="w-4 h-4" />
      </button>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(productUrl)
            alert("Enlace copiado al portapapeles")
          } catch (err) {
            console.error("Error al copiar:", err)
          }
        }}
        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
    </div>
  )
}
