"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { LogOut, RefreshCw } from "lucide-react"

interface Transaction {
  _id: string
  monto: number
  estado: "completada" | "fallida" | "pendiente"
  servicio: string
  emailCliente: string
  fechaCreacion: string
  reintentos: number
}

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "completada" | "fallida" | "pendiente">("all")

  useEffect(() => {
    fetchTransactions()
    const interval = setInterval(fetchTransactions, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/admin/transactions")
      if (!response.ok) throw new Error("Error fetching transactions")
      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("auth-token")
    window.location.href = "/login"
  }

  const filteredTransactions = transactions.filter((t) => (filter === "all" ? true : t.estado === filter))

  const stats = {
    total: transactions.length,
    completadas: transactions.filter((t) => t.estado === "completada").length,
    fallidas: transactions.filter((t) => t.estado === "fallida").length,
    montoTotal: transactions.filter((t) => t.estado === "completada").reduce((sum, t) => sum + t.monto, 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1B2E] to-[#1a2a45]">
      {/* Header */}
      <div className="border-b border-[#D4AF37]/20 sticky top-0 z-40 bg-[#0F1B2E]/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="INVERATBANK" width={40} height={40} />
            <span className="text-[#D4AF37] font-bold">Admin Dashboard</span>
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
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Total Transacciones", value: stats.total, color: "from-blue-600 to-blue-700" },
            { label: "Exitosas", value: stats.completadas, color: "from-green-600 to-green-700" },
            { label: "Fallidas", value: stats.fallidas, color: "from-red-600 to-red-700" },
            { label: "Monto Total", value: `$${stats.montoTotal.toFixed(2)}`, color: "from-[#D4AF37] to-yellow-600" },
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-lg p-6 text-white`}>
              <p className="text-sm opacity-90">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Transactions Table */}
        <div className="bg-[#0F1B2E]/50 backdrop-blur border border-[#D4AF37]/30 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-[#D4AF37]/20 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#D4AF37]">Transacciones</h2>
            <button
              onClick={fetchTransactions}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] text-[#0F1B2E] font-semibold hover:bg-[#c99a2e] transition"
            >
              <RefreshCw size={20} />
              Actualizar
            </button>
          </div>

          {/* Filter */}
          <div className="px-6 py-4 border-b border-[#D4AF37]/20 flex gap-4">
            {(["all", "completada", "fallida", "pendiente"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === status
                    ? "bg-[#D4AF37] text-[#0F1B2E]"
                    : "bg-[#1a2a45] text-[#F5F1E8] border border-[#D4AF37]/30 hover:border-[#D4AF37]"
                }`}
              >
                {status === "all" ? "Todas" : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a2a45]">
                <tr>
                  <th className="px-6 py-3 text-left text-[#D4AF37] font-semibold">ID</th>
                  <th className="px-6 py-3 text-left text-[#D4AF37] font-semibold">Cliente</th>
                  <th className="px-6 py-3 text-left text-[#D4AF37] font-semibold">Servicio</th>
                  <th className="px-6 py-3 text-left text-[#D4AF37] font-semibold">Monto</th>
                  <th className="px-6 py-3 text-left text-[#D4AF37] font-semibold">Estado</th>
                  <th className="px-6 py-3 text-left text-[#D4AF37] font-semibold">Reintentos</th>
                  <th className="px-6 py-3 text-left text-[#D4AF37] font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-[#F5F1E8]/70">
                      Cargando...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-[#F5F1E8]/70">
                      No hay transacciones
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx._id} className="border-b border-[#D4AF37]/10 hover:bg-[#1a2a45]/50 transition">
                      <td className="px-6 py-3 text-[#F5F1E8] font-mono text-sm">{tx._id.slice(-8)}</td>
                      <td className="px-6 py-3 text-[#F5F1E8]">{tx.emailCliente}</td>
                      <td className="px-6 py-3 text-[#F5F1E8] capitalize">{tx.servicio}</td>
                      <td className="px-6 py-3 text-[#D4AF37] font-bold">${tx.monto.toFixed(2)}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tx.estado === "completada"
                              ? "bg-green-500/20 text-green-300"
                              : tx.estado === "fallida"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          {tx.estado}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-[#F5F1E8]">{tx.reintentos}</td>
                      <td className="px-6 py-3 text-[#F5F1E8]/70 text-sm">
                        {new Date(tx.fechaCreacion).toLocaleDateString("es-ES")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
