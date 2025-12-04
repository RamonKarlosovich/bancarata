// app/admin/historial-cuentas/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";

type MovimientoTipo = "DEBITO" | "CREDITO" | "FALLIDO";

type Movimiento = {
  id_movimiento: number;
  fecha: string;

  // ORIGEN (ya existen en la vista como numero_cuenta / nombre_cliente)
  numero_cuenta: string;
  nombre_cliente: string;

  // DESTINO (opcional: debes agregarlos en la vista de Supabase)
  cuenta_destino?: string | null;
  nombre_cliente_destino?: string | null;

  tipo_movimiento: MovimientoTipo;
  tipo_transaccion: "DEPOSITO" | "RETIRO" | "TRANSFERENCIA" | string;
  monto: number;
  saldo_antes: number;
  saldo_despues: number;
  comercio: string | null;
  concepto_compra: string | null;
  numero_tarjeta: string | null;
  descripcion: string | null;
};

export default function HistorialCuentasPage() {
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [tipoMovimiento, setTipoMovimiento] = useState<"" | MovimientoTipo>("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const today = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );

  async function buscar() {
    setLoading(true);
    setErrorMsg(null);

    // Validaciones de fechas
    if (desde && hasta && desde > hasta) {
      setErrorMsg("La fecha DESDE no puede ser mayor que la fecha HASTA.");
      setLoading(false);
      return;
    }

    if (hasta && hasta > today) {
      setErrorMsg("La fecha HASTA no puede ser mayor a la fecha actual.");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();

    if (numeroCuenta.trim()) {
      params.set("numeroCuenta", numeroCuenta.trim());
    }

    if (tipoMovimiento) {
      params.set("tipoMovimiento", tipoMovimiento);
    }

    if (desde) {
      params.set("from", desde);
    }

    if (hasta) {
      params.set("to", hasta);
    }

    try {
      const res = await fetch(`/api/account-history?${params.toString()}`);
      const json = await res.json();
      setMovimientos(json.data || []);
    } catch (err) {
      console.error("Error cargando historial de cuentas:", err);
      setMovimientos([]);
      setErrorMsg("Ocurrió un error al cargar el historial.");
    } finally {
      setLoading(false);
    }
  }

  // Al entrar a la página, cargar todos los movimientos
  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getMovimientoClass = (tipo: MovimientoTipo) => {
    if (tipo === "DEBITO") return "text-red-400 font-bold";     // dinero sale
    if (tipo === "CREDITO") return "text-green-400 font-bold";  // dinero entra
    return "text-yellow-300 font-bold";                         // FALLIDO
  };

  return (
    <div className="p-6 text-[#F5F1E8] bg-[#0F1B2E] min-h-screen">
      {/* Título + botón Salir (igual al Panel) */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#D4AF37]">
          Historial de cuentas
        </h1>

        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
        >
          <LogOut size={18} />
          Salir
        </Link>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
        {/* Nº CUENTA */}
        <div className="flex flex-col">
          <label className="text-sm mb-1 text-[#D4AF37]">Número de cuenta</label>
          <input
            className="bg-slate-900 border border-slate-700 p-2 rounded-md text-sm"
            value={numeroCuenta}
            onChange={(e) => setNumeroCuenta(e.target.value)}
            placeholder="Ej. 4000000001"
          />
        </div>

        {/* TIPO MOVIMIENTO */}
        <div className="flex flex-col">
          <label className="text-sm mb-1 text-[#D4AF37]">
            Tipo de movimiento
          </label>
          <select
            className="bg-slate-900 border border-slate-700 p-2 rounded-md text-sm"
            value={tipoMovimiento}
            onChange={(e) =>
              setTipoMovimiento(e.target.value as "" | MovimientoTipo)
            }
          >
            <option value="">Todos</option>
            <option value="DEBITO">Débito</option>
            <option value="CREDITO">Crédito</option>
            <option value="FALLIDO">Fallido</option>
          </select>
        </div>

        {/* DESDE */}
        <div className="flex flex-col">
          <label className="text-sm mb-1 text-[#D4AF37]">Desde</label>
          <input
            type="date"
            className="bg-slate-900 border border-slate-700 p-2 rounded-md text-sm"
            value={desde}
            max={hasta || today}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>

        {/* HASTA */}
        <div className="flex flex-col">
          <label className="text-sm mb-1 text-[#D4AF37]">Hasta</label>
          <input
            type="date"
            className="bg-slate-900 border border-slate-700 p-2 rounded-md text-sm"
            value={hasta}
            max={today}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>

        {/* BOTÓN BUSCAR */}
        <div className="flex items-end">
          <button
            onClick={buscar}
            className="w-full bg-[#D4AF37] text-[#0F1B2E] font-semibold p-2 rounded-lg text-sm hover:bg-[#c99a2e] transition"
          >
            {loading ? "Cargando..." : "Buscar"}
          </button>
        </div>
      </div>

      {/* Mensaje de error */}
      {errorMsg && (
        <div className="mt-3 text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      {/* TABLA */}
      <div className="mt-6 overflow-x-auto border border-slate-700 rounded-xl bg-[#0F1B2E]">
        <table className="w-full text-xs md:text-sm border-collapse">
          <thead className="bg-[#1a2a45] text-[#D4AF37]">
            <tr>
              <th className="p-2 text-left border-r border-slate-700">Fecha</th>
              <th className="p-2 text-left border-r border-slate-700">
                Cuenta origen
              </th>
              <th className="p-2 text-left border-r border-slate-700">
                Titular cuenta origen
              </th>
              <th className="p-2 text-left border-r border-slate-700">
                Movimiento
              </th>
              <th className="p-2 text-left border-r border-slate-700">
                Cuenta destino
              </th>
              <th className="p-2 text-left border-r border-slate-700">
                Titular cuenta destino
              </th>
              <th className="p-2 text-left border-r border-slate-700">
                Concepto
              </th>
              <th className="p-2 text-right border-r border-slate-700">
                Saldo anterior
              </th>
              <th className="p-2 text-right border-r border-slate-700">
                Monto
              </th>
              <th className="p-2 text-right">
                Saldo final
              </th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m) => (
              <tr
                key={m.id_movimiento}
                className="odd:bg-slate-800 even:bg-slate-900"
              >
                <td className="p-2 border-r border-slate-800">
                  {new Date(m.fecha).toLocaleString("es-MX")}
                </td>

                {/* Cuenta / titular ORIGEN */}
                <td className="p-2 border-r border-slate-800">
                  {m.numero_cuenta}
                </td>
                <td className="p-2 border-r border-slate-800">
                  {m.nombre_cliente}
                </td>

                {/* Movimiento */}
                <td
                  className={`p-2 border-r border-slate-800 ${getMovimientoClass(
                    m.tipo_movimiento
                  )}`}
                >
                  {m.tipo_movimiento}
                </td>

                {/* Cuenta / titular DESTINO (pueden venir null si aún no los agregas en la vista) */}
                <td className="p-2 border-r border-slate-800">
                  {m.cuenta_destino ?? "—"}
                </td>
                <td className="p-2 border-r border-slate-800">
                  {m.nombre_cliente_destino ?? "—"}
                </td>

                {/* Concepto */}
                <td className="p-2 border-r border-slate-800">
                  {m.concepto_compra ?? m.descripcion ?? "—"}
                </td>

                {/* Saldos y monto */}
                <td className="p-2 text-right border-r border-slate-800">
                  ${m.saldo_antes.toFixed(2)}
                </td>
                <td className="p-2 text-right border-r border-slate-800">
                  ${m.monto.toFixed(2)}
                </td>
                <td className="p-2 text-right">
                  ${m.saldo_despues.toFixed(2)}
                </td>
              </tr>
            ))}

            {!loading && movimientos.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="p-4 text-center text-slate-400"
                >
                  No se encontraron movimientos para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
