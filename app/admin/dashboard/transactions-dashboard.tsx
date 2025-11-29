"use client";

import { useState, useEffect, useMemo } from "react";
import { RefreshCw, Search } from "lucide-react";

type TransactionStatus = "COMPLETADA" | "RECHAZADA" | "PENDIENTE";

interface Transaction {
  id_transaccion: number;
  creada_utc: string;
  nombre_cliente?: string | null;
  servicio?: string | null;
  numero_tarjeta?: string | null;
  monto: number;
  nombre_estado: string;
  descripcion?: string | null;
}

interface Stats {
  total: number;
  aprobadas: number;
  rechazadas: number;
  monto_total: number;
}

export default function AdminTransactionsDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // ======== FILTROS =========
  const [cliente, setCliente] = useState(""); // Nombre cliente
  const [tarjeta, setTarjeta] = useState(""); // Número de tarjeta
  const [servicio, setServicio] = useState(""); // Mall / Spa / etc
  const [estado, setEstado] = useState<"todos" | TransactionStatus>("todos");
  const [idTransaccion, setIdTransaccion] = useState(""); // ID de transacción
  const [desde, setDesde] = useState(""); // fecha desde (YYYY-MM-DD)
  const [hasta, setHasta] = useState(""); // fecha hasta (YYYY-MM-DD)

  // NUEVO: controla si se ve el panel de rango de fechas
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/transactions");
      if (!response.ok) throw new Error("Error fetching transactions");

      const data = await response.json();

      // El endpoint /api/transactions devuelve { transacciones, stats }
      const lista = (data.transacciones ?? data ?? []) as Transaction[];
      setTransactions(lista);

      if (data.stats) {
        setStats(data.stats);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleResetFilters = () => {
    setCliente("");
    setTarjeta("");
    setServicio("");
    setEstado("todos");
    setIdTransaccion("");
    setDesde("");
    setHasta("");
  };

  // ======== APLICAR FILTROS EN MEMORIA =========
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // ID transacción (coincidencia parcial)
      if (idTransaccion.trim()) {
        const idStr = String(tx.id_transaccion);
        if (!idStr.includes(idTransaccion.trim())) return false;
      }

      // Cliente
      if (cliente.trim()) {
        const q = cliente.trim().toLowerCase();
        const nombre = (tx.nombre_cliente ?? "").toLowerCase();
        if (!nombre.includes(q)) return false;
      }

      // Tarjeta (últimos dígitos o número completo)
      if (tarjeta.trim()) {
        const q = tarjeta.replace(/\s+/g, "").toLowerCase();
        const num = (tx.numero_tarjeta ?? "")
          .replace(/\s+/g, "")
          .toLowerCase();
        if (!num.includes(q)) return false;
      }

      // Servicio
      if (servicio.trim()) {
        const q = servicio.trim().toLowerCase();
        const s = (tx.servicio ?? "").toLowerCase();
        if (!s.includes(q)) return false;
      }

      // Estado
      if (estado !== "todos") {
        if ((tx.nombre_estado ?? "").toUpperCase() !== estado) return false;
      }

      // Rango de fechas
      if (desde) {
        const dDesde = new Date(desde + "T00:00:00");
        const dTx = new Date(tx.creada_utc);
        if (dTx < dDesde) return false;
      }
      if (hasta) {
        const dHasta = new Date(hasta + "T23:59:59");
        const dTx = new Date(tx.creada_utc);
        if (dTx > dHasta) return false;
      }

      return true;
    });
  }, [transactions, idTransaccion, cliente, tarjeta, servicio, estado, desde, hasta]);

  // ======== STATS (si el backend no los manda) =========
  const computedStats = useMemo(() => {
    if (stats) return stats;
    const total = transactions.length;
    const aprobadas = transactions.filter(
      (t) => t.nombre_estado === "COMPLETADA"
    ).length;
    const rechazadas = transactions.filter(
      (t) => t.nombre_estado === "RECHAZADA"
    ).length;
    const monto_total = transactions
      .filter((t) => t.nombre_estado === "COMPLETADA")
      .reduce((sum, t) => sum + (t.monto || 0), 0);

    return { total, aprobadas, rechazadas, monto_total };
  }, [transactions, stats]);

  // Helper para mostrar el rango en formato dd/mm/aaaa
  const formatDateLabel = (value: string) => {
    if (!value) return "";
    const [y, m, d] = value.split("-");
    return `${d}/${m}/${y}`;
  };

  const rangeLabel =
    desde || hasta
      ? `${desde ? formatDateLabel(desde) : "inicio"}  —  ${
          hasta ? formatDateLabel(hasta) : "fin"
        }`
      : "Selecciona un rango de fechas";

  return (
    <div className="relative flex min-h[calc(100vh-64px)] flex-col bg-[#0F1B2E] text-[#F5F1E8]">
      {/* Contenido con scroll; dejamos espacio abajo para los indicadores */}
      <div className="flex-1 overflow-auto pb-40">
        <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
          {/* Filtros de búsqueda */}
          <div className="space-y-4 rounded-lg border border-[#D4AF37]/30 bg-[#0F1B2E]/70 p-6 backdrop-blur">
            <div className="mb-2 flex items-center gap-2">
              <Search size={18} className="text-[#D4AF37]" />
              <h2 className="text-lg font-semibold text-[#F5F1E8]">
                Filtros de búsqueda avanzada
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-5">
              {/* ID Transacción */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
                  ID Transacción
                </label>
                <input
                  value={idTransaccion}
                  onChange={(e) => setIdTransaccion(e.target.value)}
                  placeholder="Ej. 15 o 000015"
                  className="rounded-lg border border-[#D4AF37]/40 bg-[#0a0e1a] px-3 py-2 text-sm text-[#F5F1E8] placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Cliente */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
                  Cliente
                </label>
                <input
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nombre del cliente"
                  className="rounded-lg border border-[#D4AF37]/40 bg-[#0a0e1a] px-3 py-2 text-sm text-[#F5F1E8] placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Tarjeta */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
                  Nº Tarjeta
                </label>
                <input
                  value={tarjeta}
                  onChange={(e) => setTarjeta(e.target.value)}
                  placeholder="Últimos dígitos"
                  className="rounded-lg border border-[#D4AF37]/40 bg-[#0a0e1a] px-3 py-2 text-sm text-[#F5F1E8] placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Servicio */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
                  Servicio
                </label>
                <input
                  value={servicio}
                  onChange={(e) => setServicio(e.target.value)}
                  placeholder="Mall, Spa, Cafetería..."
                  className="rounded-lg border border-[#D4AF37]/40 bg-[#0a0e1a] px-3 py-2 text-sm text-[#F5F1E8] placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Estado */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
                  Estado
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as any)}
                  className="rounded-lg border border-[#D4AF37]/40 bg-[#0a0e1a] px-3 py-2 text-sm text-[#F5F1E8] outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="todos">Todos</option>
                  <option value="COMPLETADA">Completada</option>
                  <option value="RECHAZADA">Rechazada</option>
                  <option value="PENDIENTE">Pendiente</option>
                </select>
              </div>
            </div>

            {/* Rango de fechas + botones (NUEVO DISEÑO) */}
            <div className="mt-2 grid gap-4 md:grid-cols-[2fr_1fr]">
              {/* Control único de rango de fechas */}
              <div className="relative flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
                  Rango de fechas
                </label>

                <button
                  type="button"
                  onClick={() => setShowDatePicker((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-lg border border-[#D4AF37]/40 bg-[#0a0e1a] px-3 py-2 text-sm text-[#F5F1E8] outline-none transition hover:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <span className={desde || hasta ? "" : "text-slate-500"}>
                    {rangeLabel}
                  </span>
                  <span className="ml-2 text-xs text-[#D4AF37]">
                    📅
                  </span>
                </button>

                {showDatePicker && (
                  <div className="absolute top-full z-20 mt-2 w-full rounded-lg border border-[#D4AF37]/40 bg-[#0a0e1a] p-4 shadow-xl">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
                          Desde
                        </span>
                        <input
                          type="date"
                          value={desde}
                          onChange={(e) => setDesde(e.target.value)}
                          autoFocus
                          className="rounded-lg border border-[#D4AF37]/40 bg-[#0F1B2E] px-3 py-2 text-sm text-[#F5F1E8] outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
                          Hasta
                        </span>
                        <input
                          type="date"
                          value={hasta}
                          onChange={(e) => setHasta(e.target.value)}
                          className="rounded-lg border border-[#D4AF37]/40 bg-[#0F1B2E] px-3 py-2 text-sm text-[#F5F1E8] outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDesde("");
                          setHasta("");
                        }}
                        className="rounded-lg border border-[#D4AF37]/40 px-3 py-1 text-xs text-[#F5F1E8] hover:bg-[#1a2a45]"
                      >
                        Limpiar fechas
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(false)}
                        className="rounded-lg bg-[#D4AF37] px-4 py-1 text-xs font-semibold text-[#0F1B2E] hover:bg-[#c99a2e]"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones generales */}
              <div className="flex items-end gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex-1 rounded-lg border border-[#D4AF37]/40 px-4 py-2 text-sm text-[#F5F1E8] transition hover:bg-[#1a2a45]"
                >
                  Limpiar filtros
                </button>
                <button
                  type="button"
                  onClick={fetchTransactions}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0F1B2E] transition hover:bg-[#c99a2e]"
                >
                  <RefreshCw size={16} />
                  Actualizar datos
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-hidden rounded-lg border border-[#D4AF37]/30 bg-[#0F1B2E]/70 backdrop-blur">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 px-6 py-4">
              <h2 className="text-2xl font-bold text-[#D4AF37]">Transacciones</h2>
              <span className="text-xs text-[#F5F1E8]/70">
                Mostrando {filteredTransactions.length} de {transactions.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#1a2a45]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#D4AF37]">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#D4AF37]">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#D4AF37]">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#D4AF37]">
                      Servicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#D4AF37]">
                      Tarjeta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#D4AF37]">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#D4AF37]">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#D4AF37]">
                      Descripción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-8 text-center text-[#F5F1E8]/70"
                      >
                        Cargando...
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-8 text-center text-[#F5F1E8]/70"
                      >
                        No hay transacciones con los filtros seleccionados
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id_transaccion}
                        className="border-b border-[#D4AF37]/10 transition hover:bg-[#1a2a45]/50"
                      >
                        <td className="px-6 py-3 font-mono text-xs text-[#F5F1E8]">
                          {String(tx.id_transaccion).padStart(6, "0")}
                        </td>
                        <td className="px-6 py-3 text-xs text-[#F5F1E8]/80">
                          {new Date(tx.creada_utc).toLocaleString("es-MX")}
                        </td>
                        <td className="px-6 py-3 text-[#F5F1E8]">
                          {tx.nombre_cliente ?? "—"}
                        </td>
                        <td className="px-6 py-3 capitalize text-[#F5F1E8]">
                          {tx.servicio ?? "—"}
                        </td>
                        <td className="px-6 py-3 text-xs text-[#F5F1E8]/80">
                          {tx.numero_tarjeta
                            ? "**** **** **** " + tx.numero_tarjeta.slice(-4)
                            : "—"}
                        </td>
                        <td className="px-6 py-3 font-bold text-[#D4AF37]">
                          ${Number(tx.monto || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
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
                        <td className="px-6 py-3 text-xs text-[#F5F1E8]/80">
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

      {/* Indicadores fijados abajo y centrados */}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-30 w-full max-w-6xl -translate-x-1/2 px-4">
        <div className="pointer-events-auto grid gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-blue-600 px-4 py-3 text-white shadow-lg">
            <p className="text-sm font-semibold">Total Transacciones</p>
            <p className="mt-1 text-3xl font-bold leading-none">
              {computedStats.total}
            </p>
          </div>

          <div className="rounded-lg bg-green-600 px-4 py-3 text-white shadow-lg">
            <p className="text-sm font-semibold">Exitosas</p>
            <p className="mt-1 text-3xl font-bold leading-none">
              {computedStats.aprobadas}
            </p>
          </div>

          <div className="rounded-lg bg-red-600 px-4 py-3 text-white shadow-lg">
            <p className="text-sm font-semibold">Rechazadas</p>
            <p className="mt-1 text-3xl font-bold leading-none">
              {computedStats.rechazadas}
            </p>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-[#D4AF37] to-yellow-600 px-4 py-3 text-[#0F1B2E] shadow-lg">
            <p className="text-sm font-semibold">Monto Total Aprobado</p>
            <p className="mt-1 text-3xl font-extrabold leading-none">
              ${computedStats.monto_total.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
