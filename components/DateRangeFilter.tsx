"use client";

import { useMemo, useState } from "react";

type DateParts = {
  day: number | "";
  month: number | "";
  year: number | "";
};

interface DateRangeFilterProps {
  onChange?: (range: { from: Date | null; to: Date | null }) => void;
}

const today = new Date();
const CURRENT_YEAR = today.getFullYear();

// Años disponibles (ajusta si necesitas más historial)
const YEARS = Array.from({ length: 25 }, (_, i) => CURRENT_YEAR - i);

const MONTHS = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

function getDaysInMonth(month: number, year: number) {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
}

function buildDate(parts: DateParts): Date | null {
  const { day, month, year } = parts;
  if (!day || !month || !year) return null;
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

export function DateRangeFilter({ onChange }: DateRangeFilterProps) {
  const [fromParts, setFromParts] = useState<DateParts>({
    day: "",
    month: "",
    year: "",
  });

  const [toParts, setToParts] = useState<DateParts>({
    day: "",
    month: "",
    year: "",
  });

  const fromDate = useMemo(() => buildDate(fromParts), [fromParts]);
  const toDate = useMemo(() => buildDate(toParts), [toParts]);

  // Días válidos para DESDE
  const fromDays = useMemo(
    () => getDaysInMonth(fromParts.month as number, fromParts.year as number),
    [fromParts.month, fromParts.year]
  );

  // Días válidos para HASTA (limitado por HOY si corresponde)
  const toDays = useMemo(() => {
    const maxDays = getDaysInMonth(
      toParts.month as number,
      toParts.year as number
    );
    if (
      toParts.year === CURRENT_YEAR &&
      toParts.month === today.getMonth() + 1
    ) {
      return Math.min(maxDays, today.getDate());
    }
    return maxDays;
  }, [toParts.month, toParts.year]);

  function notifyChange(updatedFrom: Date | null, updatedTo: Date | null) {
    if (onChange) {
      onChange({ from: updatedFrom, to: updatedTo });
    }
  }

  function handleFromChange(field: keyof DateParts, value: number | ""): void {
    const updated: DateParts = { ...fromParts, [field]: value };

    // Ajustar día si se pasa de los días del mes
    const maxDays = getDaysInMonth(
      updated.month as number,
      updated.year as number
    );
    if (updated.day && updated.day > maxDays) {
      updated.day = maxDays;
    }

    setFromParts(updated);

    const newFromDate = buildDate(updated);
    const newToDate = toDate; // no tocamos HASTA, solo notificamos

    notifyChange(newFromDate, newToDate);
  }

  function handleToChange(field: keyof DateParts, value: number | ""): void {
    const updated: DateParts = { ...toParts, [field]: value };

    // No permitir años futuros
    if (field === "year" && typeof value === "number" && value > CURRENT_YEAR) {
      return;
    }

    const maxDays = getDaysInMonth(
      updated.month as number,
      updated.year as number
    );
    if (updated.day && updated.day > maxDays) {
      updated.day = maxDays;
    }

    // En año/mes actuales, día máximo = hoy
    if (
      updated.year === CURRENT_YEAR &&
      updated.month === today.getMonth() + 1 &&
      updated.day &&
      updated.day > today.getDate()
    ) {
      updated.day = today.getDate();
    }

    setToParts(updated);

    const newToDate = buildDate(updated);
    const newFromDate = fromDate; // no tocamos DESDE, solo notificamos

    // Si HASTA > hoy, lo recortamos a hoy en el valor enviado (no tocamos selects)
    let finalToDate = newToDate;
    if (finalToDate && finalToDate > today) {
      finalToDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
    }

    notifyChange(newFromDate, finalToDate);
  }

  function handleClear() {
    setFromParts({ day: "", month: "", year: "" });
    setToParts({ day: "", month: "", year: "" });
    notifyChange(null, null);
  }

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
              value={fromParts.day}
              onChange={(e) =>
                handleFromChange(
                  "day",
                  e.target.value ? Number(e.target.value) : ""
                )
              }
            >
              <option value="">Día</option>
              {Array.from({ length: fromDays }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d.toString().padStart(2, "0")}
                </option>
              ))}
            </select>

            <select
              className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
              value={fromParts.month}
              onChange={(e) =>
                handleFromChange(
                  "month",
                  e.target.value ? Number(e.target.value) : ""
                )
              }
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
              value={fromParts.year}
              onChange={(e) =>
                handleFromChange(
                  "year",
                  e.target.value ? Number(e.target.value) : ""
                )
              }
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
              value={toParts.day}
              onChange={(e) =>
                handleToChange(
                  "day",
                  e.target.value ? Number(e.target.value) : ""
                )
              }
            >
              <option value="">Día</option>
              {Array.from({ length: toDays }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d.toString().padStart(2, "0")}
                </option>
              ))}
            </select>

            <select
              className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
              value={toParts.month}
              onChange={(e) =>
                handleToChange(
                  "month",
                  e.target.value ? Number(e.target.value) : ""
                )
              }
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
              value={toParts.year}
              onChange={(e) =>
                handleToChange(
                  "year",
                  e.target.value ? Number(e.target.value) : ""
                )
              }
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
          >
            Guardar rango
          </button>
        </div>
      </div>
    </div>
  );
}
