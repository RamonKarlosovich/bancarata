"use client"

import { useEffect, useState } from "react"

interface Transaction {
  id: number
  creada_utc: string
  cliente: string
  servicio: string
  numero_tarjeta: string
  monto: number
  estado: string
  descripcion: string
}

interface Filters {
  id: string
  cliente: string
  tarjeta: string
  servicio: string
  estado: string
  desde: string
  hasta: string
}

export default function AdminTransactionsDashboard() {
  const [filters, setFilters] = useState<Filters>({
    id: "",
    cliente: "",
    tarjeta: "",
    servicio: "",
    estado: "TODOS",
    desde: "",
    hasta: "",
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  // stats básicos
  const total = transactions.length
  const exitosas = transactions.filter((t) => t.estado === "COMPLETADA" || t.estado === "APROBADA").length
  const rechazadas = transactions.filter((t) => t.estado === "RECHAZADA").length
  const montoTotal = transactions
    .filter((t) => t.estado === "COMPLETADA" || t.estado === "APROBADA")
    .reduce((acc, t) => acc + Number(t.monto || 0), 0)

  const handleChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setFilters({
      id: "",
      cliente: "",
      tarjeta: "",
      servicio: "",
      estado: "TODOS",
      desde: "",
      hasta: "",
    })
  }

  const fetchTransactions = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()

      if (filters.id) params.set("id", filters.id)
      if (filters.cliente) params.set("cliente", filters.cliente)
      if (filters.tarjeta) params.set("tarjeta", filters.tarjeta)
      if (filters.servicio) params.set("servicio", filters.servicio)
      if (filters.estado && filters.estado !== "TODOS") params.set("estado", filters.estado)
      if (filters.desde) params.set("desde", filters.desde)
      if (filters.hasta) params.set("hasta", filters.hasta)

      const res = await fetch(`/api/transactions?${params.toString()}`)
      if (!res.ok) throw new Error("Error al cargar transacciones")

      const data = (await res.json()) as { transacciones: Transaction[] }
      setTransactions(data.transacciones ?? [])
    } catch (err) {
      console.error(err)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  return (
    <div className="relative min-h-screen bg-[#0F1B2E] text-[#F5F1E8]">
      {/* CONTENIDO PRINCIPAL: filtros + tabla */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-44">
        {/* Filtros */}
        <section className="mb-4 rounded-xl border border-[#D4AF37]/40 bg-[#0F1B2E]/80 p-4 shadow-lg">
          <h2 className="mb-2 text-lg font-semibold text-[#F5F1E8]">
            Filtros de búsqueda avanzada
          </h2>

          <div className="grid gap-3 md:grid-cols-5 text-xs md:text-sm">
            {/* ID TRANSACCIÓN */}
            <div className="flex flex-col">
              <span className="mb-1 font-semibold text-[#D4AF37]">ID TRANSACCIÓN</span>
              <input
                className="rounded-lg border border-[#D4AF37]/40 bg-[#081225] px-3 py-2 text-[#F5F1E8] placeholder:text-[#F5F1E8]/40"
                placeholder="Ej. 15 o 000015"
                value={filters.id}
                onChange={(e) => handleChange("id", e.target.value)}
              />
            </div>

            {/* CLIENTE */}
            <div className="flex flex-col">
              <span className="mb-1 font-semibold text-[#D4AF37]">CLIENTE</span>
              <input
                className="rounded-lg border border-[#D4AF37]/40 bg-[#081225] px-3 py-2 text-[#F5F1E8] placeholder:text-[#F5F1E8]/40"
                placeholder="Nombre del cliente"
                value={filters.cliente}
                onChange={(e) => handleChange("cliente", e.target.value)}
              />
            </div>

            {/* TARJETA */}
            <div className="flex flex-col">
              <span className="mb-1 font-semibold text-[#D4AF37]">Nº TARJETA</span>
              <input
                className="rounded-lg border border-[#D4AF37]/40 bg-[#081225] px-3 py-2 text-[#F5F1E8] placeholder:text-[#F5F1E8]/40"
                placeholder="Últimos dígitos"
                value={filters.tarjeta}
                onChange={(e) => handleChange("tarjeta", e.target.value)}
              />
            </div>

            {/* SERVICIO */}
            <div className="flex flex-col">
              <span className="mb-1 font-semibold text-[#D4AF37]">SERVICIO</span>
              <input
                className="rounded-lg border border-[#D4AF37]/40 bg-[#081225] px-3 py-2 text-[#F5F1E8] placeholder:text-[#F5F1E8]/40"
                placeholder="Mall, Spa, Cafetería..."
                value={filters.servicio}
                onChange={(e) => handleChange("servicio", e.target.value)}
              />
            </div>

            {/* ESTADO */}
            <div className="flex flex-col">
              <span className="mb-1 font-semibold text-[#D4AF37]">ESTADO</span>
              <select
                className="rounded-lg border border-[#D4AF37]/40 bg-[#081225] px-3 py-2 text-[#F5F1E8]"
                value={filters.estado}
                onChange={(e) => handleChange("estado", e.target.value)}
              >
                <option value="TODOS">Todos</option>
                <option value="COMPLETADA">Completada</option>
                <option value="APROBADA">Aprobada</option>
                <option value="RECHAZADA">Rechazada</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>
          </div>

          {/* Rango de fechas + botones */}
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex flex-1 flex-col md:flex-row md:items-end md:gap-3">
              <div className="flex flex-1 flex-col">
                <span className="mb-1 text-xs font-semibold text-[#D4AF37]">DESDE</span>
                <input
                  type="date"
                  className="rounded-lg border border-[#D4AF37]/40 bg-[#081225] px-3 py-2 text-[#F5F1E8]"
                  value={filters.desde}
                  onChange={(e) => handleChange("desde", e.target.value)}
                />
              </div>
              <div className="mt-3 flex flex-1 flex-col md:mt-0">
                <span className="mb-1 text-xs font-semibold text-[#D4AF37]">HASTA</span>
                <input
                  type="date"
                  className="rounded-lg border border-[#D4AF37]/40 bg-[#081225] px-3 py-2 text-[#F5F1E8]"
                  value={filters.hasta}
                  onChange={(e) => handleChange("hasta", e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 md:w-64">
              <button
                onClick={clearFilters}
                className="w-full rounded-lg border border-[#D4AF37]/60 bg-transparent px-4 py-2 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 transition"
              >
                Limpiar filtros
              </button>
              <button
                onClick={fetchTransactions}
                className="w-full rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0F1B2E] hover:bg-[#c99a2e] transition"
              >
                Actualizar datos
              </button>
            </div>
          </div>
        </section>

        {/* Tabla */}
        <section className="mt-2 rounded-xl border border-[#D4AF37]/40 bg-[#0F1B2E]/80 pb-4">
          <div className="border-b border-[#D4AF37]/30 px-4 py-3 text-lg font-semibold text-[#D4AF37]">
            Transacciones
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#081225] text-xs uppercase tracking-wide text-[#D4AF37]">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-left">Servicio</th>
                  <th className="px-4 py-2 text-left">Tarjeta</th>
                  <th className="px-4 py-2 text-right">Monto</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-left">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[#F5F1E8]/70">
                      Cargando...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[#F5F1E8]/70">
                      No hay transacciones con los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr
                      key={t.id}
                      className="border-t border-[#D4AF37]/10 hover:bg-[#11213a] transition"
                    >
                      <td className="px-4 py-2 font-mono text-xs text-[#F5F1E8]">
                        {String(t.id).padStart(6, "0")}
                      </td>
                      <td className="px-4 py-2 text-[#F5F1E8]/80">
                        {new Date(t.creada_utc).toLocaleString("es-MX")}
                      </td>
                      <td className="px-4 py-2 text-[#F5F1E8]">{t.cliente}</td>
                      <td className="px-4 py-2 text-[#F5F1E8]">{t.servicio}</td>
                      <td className="px-4 py-2 text-[#F5F1E8]/80">{t.numero_tarjeta}</td>
                      <td className="px-4 py-2 text-right text-[#D4AF37] font-semibold">
                        ${Number(t.monto).toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            t.estado === "COMPLETADA" || t.estado === "APROBADA"
                              ? "bg-green-500/15 text-green-300"
                              : t.estado === "RECHAZADA"
                              ? "bg-red-500/15 text-red-300"
                              : "bg-yellow-500/15 text-yellow-300"
                          }`}
                        >
                          {t.estado}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[#F5F1E8]/80">{t.descripcion}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* INDICADORES FIJOS ABAJO, CENTRADOS */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 flex justify-center px-4">
        <div className="pointer-events-auto grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-blue-600 px-4 py-3 text-white shadow-lg">
            <p className="text-xs opacity-80">Total Transacciones</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>

          <div className="rounded-xl bg-green-600 px-4 py-3 text-white shadow-lg">
            <p className="text-xs opacity-80">Exitosas</p>
            <p className="text-2xl font-bold">{exitosas}</p>
          </div>

          <div className="rounded-xl bg-red-600 px-4 py-3 text-white shadow-lg">
            <p className="text-xs opacity-80">Rechazadas</p>
            <p className="text-2xl font-bold">{rechazadas}</p>
          </div>

          <div className="rounded-xl bg-[#D4AF37] px-4 py-3 text-[#0F1B2E] shadow-lg">
            <p className="text-xs opacity-80">Monto Total Aprobado</p>
            <p className="text-2xl font-bold">
              ${montoTotal.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
