// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value
  const pathname = request.nextUrl.pathname

  const isAdminRoute = pathname.startsWith("/admin")

  // 1) Proteger SOLO rutas de /admin
  if (isAdminRoute && !token) {
    const url = new URL("/login", request.url)
    return NextResponse.redirect(url)
  }

  // 2) Si YA tiene token y entra a /login, lo mandamos al panel
  if (pathname === "/login" && token) {
    const url = new URL("/admin/dashboard", request.url)
    return NextResponse.redirect(url)
  }

  // 3) Todo lo demás pasa normal (incluido "/")
  return NextResponse.next()
}

export const config = {
  // Solo miramos /admin y /login
  matcher: ["/admin/:path*", "/login"],
}
