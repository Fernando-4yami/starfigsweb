"use client"

import type React from "react"

import { Ruler, Settings, Sword, Gift, Heart, Zap, Package, Smile, DollarSign } from "lucide-react"
import type { IconName } from "@/types/category"

interface DynamicIconProps {
  name: IconName // Usar el tipo específico
  className?: string
}

// Tipar el mapa de iconos correctamente
const iconMap: Record<IconName, React.ComponentType<{ className?: string }>> = {
  Ruler,
  Settings,
  Sword,
  Gift,
  Heart,
  Zap,
  Package,
  Smile,
  DollarSign,
}

export default function DynamicIcon({ name, className }: DynamicIconProps) {
  const IconComponent = iconMap[name]

  return <IconComponent className={className} />
}
