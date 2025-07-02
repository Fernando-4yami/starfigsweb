// Funciones para tracking de eventos
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.gtag) {
    const consent = localStorage.getItem("cookies-consent")
    if (consent === "accepted") {
      window.gtag("event", eventName, parameters)
      console.log(`📊 Evento trackeado: ${eventName}`, parameters)
    } else {
      console.log(`⏸️ Evento no trackeado (sin consentimiento): ${eventName}`)
    }
  }
}

// Eventos específicos para tu tienda
export const trackProductView = (productId: string, productName: string, category?: string, price?: number) => {
  trackEvent("view_item", {
    currency: "PEN",
    value: price,
    items: [
      {
        item_id: productId,
        item_name: productName,
        item_category: category,
        price: price,
        quantity: 1,
      },
    ],
  })
}

export const trackSearch = (searchTerm: string) => {
  trackEvent("search", {
    search_term: searchTerm,
  })
}

export const trackWhatsAppClick = (productName?: string, productId?: string) => {
  trackEvent("contact_whatsapp", {
    product_name: productName,
    product_id: productId,
    contact_method: "whatsapp",
  })
}

export const trackPageView = (pagePath: string, pageTitle: string) => {
  trackEvent("page_view", {
    page_path: pagePath,
    page_title: pageTitle,
  })
}

// 🚀 NUEVA: Función para verificar si GA está activo
export const isAnalyticsActive = (): boolean => {
  const consent = localStorage.getItem("cookies-consent")
  return consent === "accepted" && typeof window !== "undefined" && !!window.gtag
}

// Declaración de tipos para TypeScript
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: Record<string, any>) => void
  }
}
