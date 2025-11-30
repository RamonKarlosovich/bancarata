"use client";

import { useState } from "react";

type Part = string; // "","01","02",...,"2025"

interface DateRangeFilterProps {
  onChange?: (range: { from: Date | null; to: Date | null }) => void;
}

const today = new Date();
const TODAY_NORMALIZED = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate()
);
const CURRENT_YEAR = today.getFullYear();

// Años disponibles
const YEARS = Array.from({ length: 25 }, (_, i) =>
  String(CURRENT_YEAR - i)
);

const MONTHS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

function buildDate(day: Part, month: Part, year: Part): Date | null {
  if (!day || !month || !year) return null;
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  const dt = new Date(y, m - 1, d);
  // Validar que la fecha exista (ej. 31/02 no es válido)
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

export function DateRangeFilter({ onChange }: DateRangeFilterProps) {
  // DESDE
  const [fromDay, setFromDay] = useState<Part>("");
  const [fromMonth, setFromMonth] = useState<Part>("");
  const [fromYear, setFromYear] = useState<Part>("");

  // HASTA
  const [toDay, setToDay] = useState<Part>("");
  const [toMonth, setToMonth] = useState<Part>("");
  const [toYear, setToYear] = useState<Part>("");

  // Mensaje de advertencia de validaciones
  const [warning, setWarning] = useState<string>("");

  const handleSave = () => {
    let from = buildDate(fromDay, fromMonth, fromYear);
    let to = buildDate(toDay, toMonth, toYear);
    let msg = "";

    // Validación 1: HASTA no puede ser futura
    if (to && to > TODAY_NORMALIZED) {
      to = new Date(
        TODAY_NORMALIZED.getFullYear(),
        TODAY_NORMALIZED.getMonth(),
        TODAY_NORMALIZED.getDate()
      );
      msg = "La fecha HASTA fue ajustada a la fecha actual.";
    }

    // Validación 2: DESDE no puede ser mayor que HASTA
    if (from && to && from > to) {
      to = new Date(from.getFullYear(), from.getMonth(), from.getDate());
      msg = msg
        ? msg + " Además, la fecha DESDE era mayor que HASTA, se ajustó HASTA al mismo día."
        : "La fecha DESDE no puede ser mayor que HASTA. Se ajustó HASTA al mismo día.";
    }

    // Guardar mensaje (si lo hay)
    setWarning(msg);

    // Notificar al padre
    onChange?.({ from: from ?? null, to: to ?? null });
  };

  const handleClear = () => {
    setFromDay("");
    setFromMonth("");
    setFromYear("");
    setToDay("");
    setToMonth("");
    setToYear("");
    setWarning("");
    onChange?.({ from: null, to: null });
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-100">
      <h3 className="text-lg font-semibold mb-4">
        Selecciona un rango de fechas
      </h3>

      <div className="grid grid-cols-2 gap-6">
        {/* DESDE */}
        <div className="flex flex-col gap-2">
          <span className="font-medium text-amber-300">DESDE</span>
          <div className="flex gap-2">
            <select
              className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
              value={fromDay}
              onChange={(e) => setFromDay(e.target.value)}
            >
              <option value="">Día</option>
              {Array.from({ length: 31 }, (_, i) => {
                const d = (i + 1).toString().padStart(2, "0");
                return (
                  <option key={d} value={d}>
                    {d}
                  </option>
                );
              })}
            </select>

            <select
              className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
              value={fromMonth}
              onChange={(e) => setFromMonth(e.target.value)}
            >
              <option value="">Mes</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
              value={fromYear}
              onChange={(e) => setFromYear(e.target.value)}
            >
              <option value="">Año</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* HASTA */}
        <div className="flex flex-col gap-2">
          <span className="font-medium text-amber-300">
            HASTA (máx. hoy)
          </span>
          <div className="flex gap-2">
            <select
              className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
              value={toDay}
              onChange={(e) => setToDay(e.target.value)}
            >
              <option value="">Día</option>
              {Array.from({ length: 31 }, (_, i) => {
                const d = (i + 1).toString().padStart(2, "0");
                return (
                  <option key={d} value={d}>
                    {d}
                  </option>
                );
              })}
            </select>

            <select
              className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
              value={toMonth}
              onChange={(e) => setToMonth(e.target.value)}
            >
              <option value="">Mes</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
              value={toYear}
              onChange={(e) => setToYear(e.target.value)}
            >
              <option value="">Año</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mensaje de advertencia */}
      {warning && (
        <p className="mt-3 text-xs text-amber-300">{warning}</p>
      )}

      <div className="mt-4 flex justify-between text-xs">
        <button
          type="button"
          className="underline text-slate-300"
          onClick={handleClear}
        >
          Limpiar rango
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            className="px-3 py-1 rounded-md border border-slate-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded-md bg-amber-400 text-slate-900 font-semibold"
            onClick={handleSave}
          >
            Guardar rango
          </button>
        </div>
      </div>
    </div>
  );
}
