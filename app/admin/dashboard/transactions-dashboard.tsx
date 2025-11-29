"use client"

import { useEffect, useMemo, useState } from "react"
import { RefreshCw, Search } from "lucide-react"

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

export default function AdminTransactionsDashboard() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  // filtros
  const [cliente, setCliente] = useState("")
  const [servicio, setServicio] = useState("")
  const [estado, setEstado] = useState<"todos" | TransactionStatus>("todos")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/transactions")
      if (!res.ok) {
        console.error("Error al obtener transacciones", await res.text())
        return
      }
      const data = await res.json()
      setAllTransactions(data.transacciones ?? data ?? [])
      setStats(data.stats ?? null)
    } catch (err) {
      console.error("Error en fetchTransactions:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  // Aplica filtros en memoria
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      // cliente: nombre o últimos dígitos de tarjeta
      if (cliente.trim()) {
        const q = cliente.trim().toLowerCase()
        const nombre = (tx.nombre_cliente ?? "").toLowerCase()
        const tarjeta = (tx.numero_tarjeta ?? "").toLowerCase()
        if (!nombre.includes(q) && !tarjeta.includes(q)) return false
      }

      // servicio
      if (servicio.trim()) {
        const q = servicio.trim().toLowerCase()
        const s = (tx.servicio ?? "").toLowerCase()
        if (!s.includes(q)) return false
      }

      // estado
      if (estado !== "todos") {
        if ((tx.nombre_estado ?? "").toUpperCase() !== estado) return false
      }

      // rango de fechas (asumimos creada_utc en ISO o algo parseable por Date)
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
  }, [allTransactions, cliente, servicio, estado, desde, hasta])

  const handleReset = () => {
    setCliente("")
    setServicio("")
    setEstado("todos")
    setDesde("")
    setHasta("")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
      {/* Filtros */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="bg-[#0F1B2E]/70 border border-[#D4AF37]/30 rounded-xl p-4 md:p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Search size={18} className="text-[#D4AF37]" />
          <h2 className="text-lg font-semibold text-[#F5F1E8]">Filtros de búsqueda</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {/* Cliente */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">
              Cliente / Tarjeta
            </label>
            <input
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nombre o número de tarjeta"
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

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-2">
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
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-lg border border-[#D4AF37]/40 text-sm text-[#F5F1E8] hover:bg-[#1a2a45] transition"
          >
            Limpiar filtros
          </button>
          <button
            type="button"
            onClick={fetchTransactions}
            className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#0F1B2E] text-sm font-semibold flex items-center gap-2 hover:bg-[#c99a2e] transition"
          >
            <RefreshCw size={16} />
            Recargar datos
          </button>
        </div>
      </form>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-[#0F1B2E]/80 border border-[#D4AF37]/40 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase mb-1">Total transacciones</p>
          <p className="text-2xl font-bold text-[#F5F1E8]">
            {stats ? stats.total : allTransactions.length}
          </p>
        </div>
        <div className="bg-[#0F1B2E]/80 border border-emerald-500/40 rounded-xl p-4">
          <p className="text-xs text-emerald-300 uppercase mb-1">Exitosas</p>
          <p className="text-2xl font-bold text-emerald-200">
            {stats ? stats.aprobadas : allTransactions.filter(t => t.nombre_estado === "COMPLETADA").length}
          </p>
        </div>
        <div className="bg-[#0F1B2E]/80 border border-red-500/40 rounded-xl p-4">
          <p className="text-xs text-red-300 uppercase mb-1">Rechazadas</p>
          <p className="text-2xl font-bold text-red-200">
            {stats ? stats.rechazadas : allTransactions.filter(t => t.nombre_estado === "RECHAZADA").length}
          </p>
        </div>
        <div className="bg-[#0F1B2E]/80 border border-[#D4AF37]/60 rounded-xl p-4">
          <p className="text-xs text-[#D4AF37] uppercase mb-1">Monto total aprobado</p>
          <p className="text-2xl font-bold text-[#D4AF37]">
            {stats
              ? `$${stats.monto_total.toFixed(2)}`
              : `$${allTransactions
                  .filter(t => t.nombre_estado === "COMPLETADA")
                  .reduce((s, t) => s + (t.monto || 0), 0)
                  .toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#0F1B2E]/70 border border-[#D4AF37]/30 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#D4AF37]/20">
          <h2 className="text-lg font-semibold text-[#D4AF37]">Transacciones</h2>
          <span className="text-xs text-slate-300">
            Mostrando {filteredTransactions.length} de {allTransactions.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0a0e1a]">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#D4AF37]">ID</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#D4AF37]">Fecha</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#D4AF37]">Cliente</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#D4AF37]">Servicio</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#D4AF37]">Monto</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#D4AF37]">Estado</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#D4AF37]">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-300">
                    Cargando transacciones...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-300">
                    No se encontraron transacciones con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id_transaccion}
                    className="border-t border-[#D4AF37]/10 hover:bg-[#1a2a45]/60 transition"
                  >
                    <td className="px-4 py-2 text-[#F5F1E8]/80 font-mono text-xs">
                      {String(tx.id_transaccion).padStart(6, "0")}
                    </td>
                    <td className="px-4 py-2 text-[#F5F1E8]/80">
                      {new Date(tx.creada_utc).toLocaleString("es-MX")}
                    </td>
                    <td className="px-4 py-2 text-[#F5F1E8]/80">
                      {tx.nombre_cliente ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-[#F5F1E8]/80">
                      {tx.servicio ?? "—"}
                    </td>
                    <td className="px-4 py-2 font-semibold text-[#D4AF37]">
                      ${Number(tx.monto || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          tx.nombre_estado === "COMPLETADA"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : tx.nombre_estado === "RECHAZADA"
                            ? "bg-red-500/15 text-red-300"
                            : "bg-yellow-500/15 text-yellow-300"
                        }`}
                      >
                        {tx.nombre_estado}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[#F5F1E8]/70">
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
  )
}
