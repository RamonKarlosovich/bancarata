"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { LogOut, RefreshCw, Search } from "lucide-react"

type TransactionStatus = "COMPLETADA" | "RECHAZADA" | "PENDIENTE"

interface Transaction {
  id_transaccion: number
  creada_utc: string
  nombre_cliente?: string | null
  servicio?: string | null
  numero_tarjeta?: string | null
  monto: number
  nombre_estado: string
  descripcion?: string | null
}

interface Stats {
  total: number
  aprobadas: number
  rechazadas: number
  monto_total: number
}

export default function AdminDashboard() {
  const router = useRouter()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  // ======== FILTROS =========
  const [cliente, setCliente] = useState("")              // Nombre cliente
  const [tarjeta, setTarjeta] = useState("")              // Número de tarjeta
  const [servicio, setServicio] = useState("")            // Mall / Spa / etc
  const [estado, setEstado] = useState<"todos" | TransactionStatus>("todos")
  const [idTransaccion, setIdTransaccion] = useState("")  // ID de transacción
  const [desde, setDesde] = useState("")                  // fecha desde
  const [hasta, setHasta] = useState("")                  // fecha hasta

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/transactions")
      if (!response.ok) throw new Error("Error fetching transactions")

      const data = await response.json()

      // El endpoint /api/transactions devuelve { transacciones, stats }
      const lista = data.transacciones ?? data ?? []
      setTransactions(lista)
      if (data.stats) {
        setStats(data.stats)
      } else {
        setStats(null)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  // SALIR: limpiar token y regresar a la página principal
  const handleLogout = () => {
    localStorage.removeItem("auth-token")
    // Usamos location.href para evitar que alguna navegación anterior nos lleve a /login
    window.location.href = "/"
  }

  const handleResetFilters = () => {
    setCliente("")
    setTarjeta("")
    setServicio("")
    setEstado("todos")
    setIdTransaccion("")
    setDesde("")
    setHasta("")
  }

  // ======== APLICAR FILTROS EN MEMORIA =========
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // ID transacción (coincidencia parcial)
      if (idTransaccion.trim()) {
        const idStr = String(tx.id_transaccion)
        if (!idStr.includes(idTransaccion.trim())) return false
      }

      // Cliente
      if (cliente.trim()) {
        const q = cliente.trim().toLowerCase()
        const nombre = (tx.nombre_cliente ?? "").toLowerCase()
        if (!nombre.includes(q)) return false
      }

      // Tarjeta (últimos dígitos o número completo)
      if (tarjeta.trim()) {
        const q = tarjeta.replace(/\s+/g, "").toLowerCase()
        const num = (tx.numero_tarjeta ?? "").replace(/\s+/g, "").toLowerCase()
        if (!num.includes(q)) return false
      }

      // Servicio
      if (servicio.trim()) {
        const q = servicio.trim().toLowerCase()
        const s = (tx.servicio ?? "").toLowerCase()
        if (!s.includes(q)) return false
      }

      // Estado
      if (estado !== "todos") {
        if ((tx.nombre_estado ?? "").toUpperCase() !== estado) return false
      }

      // Rango de fechas
      if (desde) {
        const dDesde = new Date(desde + "T00:00:00")
        const dTx = new Date(tx.creada_utc)
        if (dTx < dDesde) return false
      }
      if (hasta) {
        const dHasta = new Date(hasta + "T23:59:59")
        const dTx = new Date(tx.creada_utc)
        if (dTx > dHasta) return false
      }

      return true
    })
  }, [transactions, idTransaccion, cliente, tarjeta, servicio, estado, desde, hasta])

  // ======== STATS (si el backend no los manda) =========
  const computedStats = useMemo(() => {
    if (stats) return stats
    const total = transactions.length
    const aprobadas = transactions.filter((t) => t.nombre_estado === "COMPLETADA").length
    const rechazadas = transactions.filter((t) => t.nombre_estado === "RECHAZADA").length
    const monto_total = transactions
      .filter((t) => t.nombre_estado === "COMPLETADA")
      .reduce((sum, t) => sum + (t.monto || 0), 0)

    return { total, aprobadas, rechazadas, monto_total }
  }, [transactions, stats])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1B2E] to-[#1a2a45]">
      {/* Header */}
      <div className="border-b border-[#D4AF37]/20 sticky top-0 z-40 bg-[#0F1B2E]/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="BANCARATA" width={40} height={40} />
            <div>
              <p className="text-[#D4AF37] font-bold">Panel Administrativo</p>
              <p className="text-xs text-slate-300">Monitoreo de transacciones del sistema</p>
            </div>
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

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Filtros de búsqueda */}
        <div className="bg-[#0F1B2E]/70 backdrop-blur border border-[#D4AF37]/30 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Search size={18} className="text-[#D4AF37]" />
            <h2 className="text-lg font-semibold text-[#F5F1E8]">Filtros de búsqueda avanzada</h2>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {/* ID Transacción */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">
                ID Transacción
              </label>
              <input
                value={idTransaccion}
                onChange={(e) => setIdTransaccion(e.target.value)}
                placeholder="Ej. 15 o 000015"
                className="px-3 py-2 rounded-lg bg-[#0a0e1a] border border-[#D4AF37]/40 text-sm text-[#F5F1E8]
                           placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>

            {/* Cliente */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">
                Cliente
              </label>
              <input
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Nombre del cliente"
                className="px-3 py-2 rounded-lg bg-[#0a0e1a] border border-[#D4AF37]/40 text-sm text-[#F5F1E8]
                           placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>

            {/* Tarjeta */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">
                Nº Tarjeta
              </label>
              <input
                value={tarjeta}
                onChange={(e) => setTarjeta(e.target.value)}
                placeholder="Últimos dígitos"
                className="px-3 py-2 rounded-lg bg-[#0a0e1a] border border-[#D4AF37]/40 text-sm text-[#F5F1E8]
                           placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>

            {/* Servicio */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">
                Servicio
              </label>
              <input
                value={servicio}
                onChange={(e) => setServicio(e.target.value)}
                placeholder="Mall, Spa, Cafetería..."
                className="px-3 py-2 rounded-lg bg-[#0a0e1a] border border-[#D4AF37]/40 text-sm text-[#F5F1E8]
                           placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>

            {/* Estado */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as any)}
                className="px-3 py-2 rounded-lg bg-[#0a0e1a] border border-[#D4AF37]/40 text-sm text-[#F5F1E8]
                           focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                <option value="todos">Todos</option>
                <option value="COMPLETADA">Completada</option>
                <option value="RECHAZADA">Rechazada</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>
          </div>

          {/* Rango de fechas */}
          <div className="grid md:grid-cols-3 gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">
                Desde
              </label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#0a0e1a] border border-[#D4AF37]/40 text-sm text-[#F5F1E8]
                           focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">
                Hasta
              </label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#0a0e1a] border border-[#D4AF37]/40 text-sm text-[#F5F1E8]
                           focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>
            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 px-4 py-2 rounded-lg border border-[#D4AF37]/40 text-sm text-[#F5F1E8] hover:bg-[#1a2a45] transition"
              >
                Limpiar filtros
              </button>
              <button
                type="button"
                onClick={fetchTransactions}
                className="flex-1 px-4 py-2 rounded-lg bg-[#D4AF37] text-[#0F1B2E] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#c99a2e] transition"
              >
                <RefreshCw size={16} />
                Actualizar datos
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              label: "Total Transacciones",
              value: computedStats.total,
              color: "from-blue-600 to-blue-700",
            },
            {
              label: "Exitosas",
              value: computedStats.aprobadas,
              color: "from-green-600 to-green-700",
            },
            {
              label: "Rechazadas",
              value: computedStats.rechazadas,
              color: "from-red-600 to-red-700",
            },
            {
              label: "Monto Total Aprobado",
              value: `$${computedStats.monto_total.toFixed(2)}`,
              color: "from-[#D4AF37] to-yellow-600",
            },
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-lg p-6 text-white`}>
              <p className="text-sm opacity-90">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="bg-[#0F1B2E]/50 backdrop-blur border border-[#D4AF37]/30 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-[#D4AF37]/20 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#D4AF37]">Transacciones</h2>
            <span className="text-xs text-[#F5F1E8]/70">
              Mostrando {filteredTransactions.length} de {transactions.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a2a45]">
                <tr>
                  <th className="px-6 py-3 text-left text-[#D4AF37] font-semibold text-xs">ID</th>
                  <th className="px-6 py-3 text-left text-[#D4AF37] font-semibold text-xs">Fecha</th>
                  <th className="px-6 py-3 text-left text-[#D4AF37] font-semibold text-xs">Cliente</th>
                  <th className="px-6 py-3 text-left text-[#D4AF37] font-semibold text-xs">Servicio</th>
                  <th className="px-6 py-3 text-left text-[#D4AF37] font-semibold text-xs">Tarjeta</th>
                  <th className="px-6 py-3 text-left text-[#D4AF37] font-semibold text-xs">Monto</th>
                  <th className="px-6 py-3 text-left text-[#D4AF37] font-semibold text-xs">Estado</th>
                  <th className="px-6 py-3 text-left text-[#D4AF37] font-semibold text-xs">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-[#F5F1E8]/70">
                      Cargando...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-[#F5F1E8]/70">
                      No hay transacciones con los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id_transaccion}
                      className="border-b border-[#D4AF37]/10 hover:bg-[#1a2a45]/50 transition"
                    >
                      <td className="px-6 py-3 text-[#F5F1E8] font-mono text-xs">
                        {String(tx.id_transaccion).padStart(6, "0")}
                      </td>
                      <td className="px-6 py-3 text-[#F5F1E8]/80 text-xs">
                        {new Date(tx.creada_utc).toLocaleString("es-MX")}
                      </td>
                      <td className="px-6 py-3 text-[#F5F1E8]">
                        {tx.nombre_cliente ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-[#F5F1E8] capitalize">
                        {tx.servicio ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-[#F5F1E8]/80 text-xs">
                        {tx.numero_tarjeta
                          ? "**** **** **** " + tx.numero_tarjeta.slice(-4)
                          : "—"}
                      </td>
                      <td className="px-6 py-3 text-[#D4AF37] font-bold">
                        ${Number(tx.monto || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tx.nombre_estado === "COMPLETADA"
                              ? "bg-green-500/20 text-green-300"
                              : tx.nombre_estado === "RECHAZADA"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          {tx.nombre_estado}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-[#F5F1E8]/80 text-xs">
                        {tx.descripcion ?? "—"}
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
