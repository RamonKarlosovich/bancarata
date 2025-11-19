"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"admin" | "service" | "client">("client")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      })

      if (!response.ok) {
        throw new Error("Credenciales inválidas")
      }

      const data = await response.json()
      localStorage.setItem("auth-token", data.token)

      if (role === "admin") {
        router.push("/admin/dashboard")
      } else if (role === "service") {
        router.push("/services/dashboard")
      } else {
        router.push("/payment")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1B2E] to-[#1a2a45] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#0F1B2E]/50 backdrop-blur border border-[#D4AF37]/30 rounded-lg p-8">
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="INVERATBANK" width={80} height={80} className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-[#D4AF37]">INVERATBANK</h1>
            <p className="text-[#F5F1E8]/70 mt-2">Ingresa a tu cuenta</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#D4AF37] mb-2">Rol</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="client">Cliente</option>
                <option value="service">Servicio (Barbería/Spa/Cafetería)</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#D4AF37] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#D4AF37] mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>

            {error && <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 rounded-lg bg-[#D4AF37] text-[#0F1B2E] font-bold hover:bg-[#c99a2e] disabled:opacity-50 transition"
            >
              {loading ? "Cargando..." : "Ingresar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#F5F1E8]/70">¿No tienes cuenta?</p>
            <Link href="/register" className="text-[#D4AF37] font-semibold hover:underline">
              Registrarse aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
