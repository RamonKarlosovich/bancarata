// app/api/account-history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const numeroCuenta = searchParams.get("numeroCuenta"); // cuenta origen
    const tipoMovimiento = searchParams.get("tipoMovimiento"); // DEBITO / CREDITO / FALLIDO
    const from = searchParams.get("from"); // YYYY-MM-DD
    const to = searchParams.get("to");     // YYYY-MM-DD
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10);

    const fromIdx = (page - 1) * pageSize;
    const toIdx = fromIdx + pageSize - 1;

    const supabase = getSupabaseServer();

    // OJO: los nombres deben coincidir EXACTO con la vista movimientos_cuenta
    let query = supabase
      .from("movimientos_cuenta")
      .select(
        `
        id_movimiento,
        fecha,
        numero_cuenta,          -- cuenta origen
        nombre_cliente,         -- titular cuenta origen
        tipo_movimiento,
        tipo_transaccion,
        cuenta_destino,
        nombre_cliente_destino,
        monto,
        saldo_antes,
        saldo_despues,
        concepto_compra,
        numero_tarjeta,
        id_transaccion,
        descripcion,
        resultado,
        motivo_corto,
        campo_error
      `,
        { count: "exact" }
      )
      .order("fecha", { ascending: false });

    // Filtro por número de cuenta (origen)
    if (numeroCuenta && numeroCuenta.trim() !== "") {
      query = query.eq("numero_cuenta", numeroCuenta.trim());
    }

    // Filtro por tipo de movimiento
    if (tipoMovimiento && tipoMovimiento !== "") {
      query = query.eq("tipo_movimiento", tipoMovimiento);
    }

    // Filtro por fechas
    if (from) {
      query = query.gte("fecha", `${from} 00:00:00`);
    }

    if (to) {
      query = query.lte("fecha", `${to} 23:59:59`);
    }

    // Paginación
    query = query.range(fromIdx, toIdx);

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase error /api/account-history:", error);
      return NextResponse.json(
        { error: "Error consultando historial de cuenta" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      page,
      pageSize,
      total: count ?? 0,
      data: data ?? [],
    });
  } catch (err) {
    console.error("Error GET /api/account-history:", err);
    return NextResponse.json(
      { error: "Error obteniendo historial de cuenta" },
      { status: 500 }
    );
  }
}
