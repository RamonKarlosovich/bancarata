"use client";

import { useEffect, useState } from "react";

interface Transaccion {
  id_transaccion: number;
  creada_utc: string;
  nombre_cliente: string | null;
  numero_tarjeta: string | null;
  tipo_transaccion: string | null;
  monto: number | null;
  estado: string | null;
  mensaje: string | null;
}

interface Stats {
  total: number;
  aprobadas: number;
  rechazadas: number;
  monto_total: number;
}

export default function AdminTransactionsDashboard() {
  const [cliente, setCliente] = useState("");
  const [estado, setEstado] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [cargando, setCargando] = useState(false);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (cliente) params.set("cliente", cliente);
      if (estado) params.set("estado", estado);
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      params.set("limit", "100");

      const res = await fetch(`/api/transactions?` + params.toString());
      const data = await res.json();
      setTransacciones(data.transacciones ?? []);
      setStats(data.stats ?? null);
    } catch (err) {
      console.error("Error cargando transacciones:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maskCard = (num?: string | null) =>
    num ? num.replace(/\d(?=\d{4})/g, "•") : "•••• •••• •••• ••••";

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
        <h2 className="text-lg font-semibold mb-3">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            placeholder="Nombre cliente o tarjeta"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />
          <select
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="COMPLETADA">Completadas</option>
            <option value="APROBADA">Aprobadas</option>
            <option value="RECHAZADA">Rechazadas</option>
            <option value="PENDIENTE">Pendientes</option>
          </select>
          <input
            type="date"
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
          <input
            type="date"
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={cargarDatos}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50"
            disabled={cargando}
          >
            {cargando ? "Cargando..." : "Aplicar filtros"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard label="Total transacciones" value={stats.total} />
          <KpiCard label="Aprobadas/Completadas" value={stats.aprobadas} />
          <KpiCard label="Rechazadas" value={stats.rechazadas} />
          <KpiCard
            label="Monto total"
            value={`$ ${Number(stats.monto_total).toFixed(2)}`}
          />
        </div>
      )}

      {/* Tabla */}
      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 overflow-auto">
        <h2 className="text-lg font-semibold mb-3">
          Movimientos {transacciones.length ? `(${transacciones.length})` : ""}
        </h2>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-slate-700">
              <th className="py-2 pr-3">Fecha</th>
              <th className="py-2 pr-3">Cliente</th>
              <th className="py-2 pr-3">Tarjeta</th>
              <th className="py-2 pr-3">Tipo</th>
              <th className="py-2 pr-3">Monto</th>
              <th className="py-2 pr-3">Estado</th>
              <th className="py-2 pr-3">Mensaje</th>
            </tr>
          </thead>
          <tbody>
            {transacciones.map((t) => (
              <tr
                key={t.id_transaccion}
                className="border-b border-slate-800/60"
              >
                <td className="py-2 pr-3">
                  {new Date(t.creada_utc).toLocaleString()}
                </td>
                <td className="py-2 pr-3">
                  {t.nombre_cliente || "—"}
                </td>
                <td className="py-2 pr-3 font-mono">
                  {maskCard(t.numero_tarjeta)}
                </td>
                <td className="py-2 pr-3">{t.tipo_transaccion || "—"}</td>
                <td className="py-2 pr-3">
                  ${Number(t.monto ?? 0).toFixed(2)}
                </td>
                <td className="py-2 pr-3">
                  <span
                    className={
                      "px-2 py-1 rounded-full text-xs " +
                      (t.estado === "COMPLETADA" || t.estado === "APROBADA"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : t.estado === "RECHAZADA"
                        ? "bg-red-500/20 text-red-300 border border-red-500/40"
                        : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40")
                    }
                  >
                    {t.estado ?? "—"}
                  </span>
                </td>
                <td
                  className="py-2 pr-3 max-w-xs truncate"
                  title={t.mensaje ?? ""}
                >
                  {t.mensaje ?? "—"}
                </td>
              </tr>
            ))}

            {!transacciones.length && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-slate-400">
                  No hay transacciones con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}
