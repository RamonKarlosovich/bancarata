// app/api/account-history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const numeroCuenta = searchParams.get("numeroCuenta");
    const idCliente = searchParams.get("idCliente");
    const tipoMovimiento = searchParams.get("tipoMovimiento"); // DEBITO / CREDITO
    const from = searchParams.get("from"); // YYYY-MM-DD
    const to = searchParams.get("to");     // YYYY-MM-DD
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10);

    const fromIdx = (page - 1) * pageSize;
    const toIdx = fromIdx + pageSize - 1;

    const supabase = getSupabaseServer();

    // Empezamos el query sobre la VISTA movimientos_cuenta
    let query = supabase
      .from("movimientos_cuenta")
      .select(
        `
        id_movimiento,
        fecha,
        id_cuenta,
        numero_cuenta,
        nombre_cliente,
        tipo_movimiento,
        monto,
        saldo_antes,
        saldo_despues,
        id_transaccion,
        descripcion,
        resultado,
        motivo_corto,
        campo_error
      `,
        { count: "exact" }
      )
      .order("fecha", { ascending: false });

    // Filtros dinámicos
    if (numeroCuenta) {
      query = query.eq("numero_cuenta", numeroCuenta);
    }

    if (idCliente) {
      // filtramos por id_cliente a través de la tabla cuentas
      // Lo dejamos solo con numeroCuenta / rango de fechas.
      console.warn(
        "Filtro por idCliente no implementado directamente en movimientos_cuenta"
      );
    }

    if (tipoMovimiento) {
      query = query.eq("tipo_movimiento", tipoMovimiento);
    }

    if (from) {
      // asumimos from en formato 'YYYY-MM-DD'
      query = query.gte("fecha", from);
    }

    if (to) {
      query = query.lte("fecha", to + " 23:59:59");
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
