import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // 🔐 Proteger rutas de admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin-token")

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  // 🚀 Headers de performance y SEO
  response.headers.set("X-Robots-Tag", "index, follow")

  // 🔧 Cache headers para assets estáticos
  if (request.nextUrl.pathname.startsWith("/_next/static/")) {
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable")
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*", "/_next/static/:path*", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
