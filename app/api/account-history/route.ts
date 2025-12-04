// app/api/account-history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const numeroCuenta = searchParams.get("numeroCuenta");
    const tipoMovimiento = searchParams.get("tipoMovimiento"); // DEBITO / CREDITO / FALLIDO
    const from = searchParams.get("from"); // YYYY-MM-DD
    const to = searchParams.get("to");     // YYYY-MM-DD
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10);

    const fromIdx = (page - 1) * pageSize;
    const toIdx = fromIdx + pageSize - 1;

    const supabase = getSupabaseServer();

    let query = supabase
      .from("movimientos_cuenta")
      .select(
        `
        id_movimiento,
        fecha,
        numero_cuenta,
        nombre_cliente,
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

    // Filtro por número de cuenta (puede ser origen o destino)
    if (numeroCuenta) {
      query = query.or(
        `numero_cuenta.eq.${numeroCuenta},cuenta_destino.eq.${numeroCuenta}`
      );
    }

    if (tipoMovimiento) {
      query = query.eq("tipo_movimiento", tipoMovimiento);
    }

    if (from) {
      query = query.gte("fecha", from);
    }

    if (to) {
      query = query.lte("fecha", to + " 23:59:59");
    }

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
