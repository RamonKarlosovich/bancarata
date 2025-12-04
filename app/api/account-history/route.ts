// app/api/account-history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db/supabaseClient";

type MovimientoTipo = "DEBITO" | "CREDITO" | "FALLIDO";

type MovimientoRow = {
  id_movimiento: number;
  fecha: string;
  numero_cuenta_origen: string | null;
  nombre_cliente_origen: string | null;
  numero_cuenta_destino: string | null;
  nombre_cliente_destino: string | null;
  tipo_movimiento: MovimientoTipo;
  tipo_transaccion: string | null;
  concepto: string | null;
  monto: number;
  saldo_antes_origen: number | null;
  saldo_despues_origen: number | null;
  saldo_antes_destino: number | null;
  saldo_despues_destino: number | null;
  resultado: string;
};

type MovimientoResponse = {
  id_movimiento: number;
  fecha: string;
  numero_cuenta: string | null;            // cuenta origen
  nombre_cliente: string | null;           // titular cuenta origen
  tipo_movimiento: MovimientoTipo;
  tipo_transaccion: string;
  cuenta_destino: string | null;
  nombre_cliente_destino: string | null;   // titular cuenta destino
  monto: number;
  saldo_antes: number | null;
  saldo_despues: number | null;
  saldo_antes_destino: number | null;
  saldo_despues_destino: number | null;
  concepto_compra: string | null;
  resultado: string;                       // APROBADA / RECHAZADA_... / ERROR_INTERNO
};

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(req.url);

    const numeroCuenta = searchParams.get("numeroCuenta");     // opcional
    const tipoMovimiento = searchParams.get("tipoMovimiento"); // opcional
    const from = searchParams.get("from");                     // opcional YYYY-MM-DD
    const to = searchParams.get("to");                         // opcional YYYY-MM-DD
    const limit = Number(searchParams.get("limit") ?? "500");

    let query = supabase
      .from("movimientos_cuenta")
      .select(
        `
        id_movimiento,
        fecha,
        numero_cuenta_origen,
        nombre_cliente_origen,
        numero_cuenta_destino,
        nombre_cliente_destino,
        tipo_movimiento,
        tipo_transaccion,
        concepto,
        monto,
        saldo_antes_origen,
        saldo_despues_origen,
        saldo_antes_destino,
        saldo_despues_destino,
        resultado
        `
      )
      .order("fecha", { ascending: false })
      .limit(limit);

    // Filtro por número de cuenta (aplica a origen o destino)
    if (numeroCuenta) {
      query = query.or(
        `numero_cuenta_origen.eq.${numeroCuenta},numero_cuenta_destino.eq.${numeroCuenta}`
      );
    }

    // Filtro por tipo de movimiento
    if (tipoMovimiento) {
      query = query.eq("tipo_movimiento", tipoMovimiento);
    }

    // Filtro por fechas
    if (from) {
      // desde inicio del día
      query = query.gte("fecha", `${from} 00:00:00`);
    }
    if (to) {
      // hasta final del día
      query = query.lte("fecha", `${to} 23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[/api/account-history] Error consultando movimientos:", error);
      return NextResponse.json(
        { error: "Error obteniendo historial de cuentas" },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as MovimientoRow[];

    const result: MovimientoResponse[] = rows.map((m) => ({
      id_movimiento: m.id_movimiento,
      fecha: m.fecha,
      numero_cuenta: m.numero_cuenta_origen ?? null,
      nombre_cliente: m.nombre_cliente_origen ?? null,
      tipo_movimiento: m.tipo_movimiento,
      tipo_transaccion: m.tipo_transaccion ?? "",
      cuenta_destino: m.numero_cuenta_destino ?? null,
      nombre_cliente_destino: m.nombre_cliente_destino ?? null,
      monto: m.monto,
      saldo_antes: m.saldo_antes_origen,
      saldo_despues: m.saldo_despues_origen,
      saldo_antes_destino: m.saldo_antes_destino,
      saldo_despues_destino: m.saldo_despues_destino,
      concepto_compra: m.concepto,
      resultado: m.resultado,
    }));

    return NextResponse.json(
      { data: result },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[/api/account-history] Error inesperado:", err);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        detalle: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
