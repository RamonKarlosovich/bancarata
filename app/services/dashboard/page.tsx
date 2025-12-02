"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { LogOut, Plus } from "lucide-react"

export default function ServiceDashboard() {
  const [showModal, setShowModal] = useState(false)
  const [service] = useState("barberia") // El servicio se obtendría del token

  const handleLogout = () => {
    localStorage.removeItem("auth-token")
    window.location.href = "/login"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1B2E] to-[#1a2a45]">
      {/* Header */}
      <div className="border-b border-[#D4AF37]/20 sticky top-0 z-40 bg-[#0F1B2E]/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="INVERATBANK" width={40} height={40} />
            <span className="text-[#D4AF37] font-bold">
              Panel de {service.charAt(0).toUpperCase() + service.slice(1)}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition"
          >
            <LogOut size={20} />
            Salir
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-[#0F1B2E]/50 backdrop-blur border border-[#D4AF37]/30 rounded-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#D4AF37]">Procesador de Pagos</h1>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#D4AF37] text-[#0F1B2E] font-bold hover:bg-[#c99a2e] transition"
            >
              <Plus size={20} />
              Nuevo Pago
            </button>
          </div>

          <p className="text-[#F5F1E8]/70 mb-8">
            Desde aquí puedes procesar pagos de tus clientes. Los datos se enviarán directamente al sistema bancario
            INVERATBANK.
          </p>

          <Link
            href="/payment?service=barberia"
            className="block p-6 rounded-lg border border-[#D4AF37]/30 bg-[#1a2a45] hover:bg-[#1a2a45]/80 transition group"
          >
            <h3 className="text-xl font-bold text-[#D4AF37] group-hover:text-[#c99a2e]">Procesar Pago</h3>
            <p className="text-[#F5F1E8]/70 mt-2">Accede al formulario de pago para tus clientes</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
