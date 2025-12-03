"use client";

import { useEffect, useState } from "react";

type Movimiento = {
  id_movimiento: number;
  fecha: string;
  numero_cuenta: string;
  nombre_cliente: string;
  tipo_movimiento: "DEBITO" | "CREDITO";
  monto: number;
  saldo_antes: number;
  saldo_despues: number;
  descripcion: string | null;
  resultado: string;
  motivo_corto: string | null;
};

export default function HistorialCuentas() {
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [tipoMovimiento, setTipoMovimiento] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(false);

  async function buscar() {
    setLoading(true);

    const params = new URLSearchParams();

    if (numeroCuenta) params.set("numeroCuenta", numeroCuenta);
    if (tipoMovimiento) params.set("tipoMovimiento", tipoMovimiento);
    if (desde) params.set("from", desde);
    if (hasta) params.set("to", hasta);

    const res = await fetch(`/api/account-history?${params.toString()}`);
    const json = await res.json();

    setMovimientos(json.data || []);
    setLoading(false);
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold text-yellow-300 mb-4">
        Historial de Cuentas
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">

        <div className="flex flex-col">
          <label className="text-sm mb-1">Número de cuenta</label>
          <input
            className="bg-slate-900 border border-slate-700 p-2 rounded-md"
            value={numeroCuenta}
            onChange={(e) => setNumeroCuenta(e.target.value)}
            placeholder="Ej. 3000000001"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm mb-1">Tipo de movimiento</label>
          <select
            className="bg-slate-900 border border-slate-700 p-2 rounded-md"
            value={tipoMovimiento}
            onChange={(e) => setTipoMovimiento(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="DEBITO">Débito</option>
            <option value="CREDITO">Crédito</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm mb-1">Desde</label>
          <input
            type="date"
            className="bg-slate-900 border border-slate-700 p-2 rounded-md"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm mb-1">Hasta</label>
          <input
            type="date"
            className="bg-slate-900 border border-slate-700 p-2 rounded-md"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={buscar}
            className="w-full bg-yellow-400 text-black font-semibold p-2 rounded-lg hover:bg-yellow-300 transition"
          >
            {loading ? "Cargando..." : "Buscar"}
          </button>
        </div>

      </div>

      <div className="mt-6 overflow-x-auto border border-slate-700 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-yellow-300">
            <tr>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Cuenta</th>
              <th className="p-2 text-left">Cliente</th>
              <th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-right">Monto</th>
              <th className="p-2 text-right">Saldo antes</th>
              <th className="p-2 text-right">Saldo después</th>
              <th className="p-2 text-left">Descripción</th>
            </tr>
          </thead>

          <tbody>
            {movimientos.map((m) => (
              <tr key={m.id_movimiento} className="odd:bg-slate-800 even:bg-slate-850">
                <td className="p-2">{new Date(m.fecha).toLocaleString()}</td>
                <td className="p-2">{m.numero_cuenta}</td>
                <td className="p-2">{m.nombre_cliente}</td>

                <td className="p-2">
                  <span
                    className={
                      m.tipo_movimiento === "DEBITO"
                        ? "text-red-400 font-bold"
                        : "text-green-400 font-bold"
                    }
                  >
                    {m.tipo_movimiento}
                  </span>
                </td>

                <td className="p-2 text-right">${m.monto.toFixed(2)}</td>
                <td className="p-2 text-right">${m.saldo_antes.toFixed(2)}</td>
                <td className="p-2 text-right">${m.saldo_despues.toFixed(2)}</td>
                <td className="p-2">{m.descripcion ?? m.motivo_corto ?? ""}</td>
              </tr>
            ))}

            {!loading && movimientos.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-slate-400">
                  No se encontraron movimientos.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}
