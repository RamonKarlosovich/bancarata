// app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(req.url);

    const cliente = searchParams.get("cliente");   // nombre o tarjeta
    const estado = searchParams.get("estado");     // APROBADA / RECHAZADA / PENDIENTE
    const desde  = searchParams.get("desde");      // YYYY-MM-DD
    const hasta  = searchParams.get("hasta");      // YYYY-MM-DD
    const limit  = Number(searchParams.get("limit") ?? "100");

    // ---------- construir query base ----------
    let query = supabase
      .from("transacciones")
      .select(
        `
        id_transaccion,
        creada_utc,
        nombre_cliente,
        numero_tarjeta,
        tipo_transaccion,
        monto,
        estado,
        mensaje
        `
      )
      .order("creada_utc", { ascending: false })
      .limit(limit);

    // filtro por cliente (nombre o tarjeta)
    if (cliente) {
      // OR en Supabase: campo1.ilike.%x%,campo2.ilike.%x%
      query = query.or(
        `nombre_cliente.ilike.%${cliente}%,numero_tarjeta.ilike.%${cliente}%`
      );
    }

    // filtro por estado
    if (estado) {
      query = query.eq("estado", estado);
    }

    // filtro por fechas (asumiendo creada_utc es timestamp)
    if (desde) {
      query = query.gte("creada_utc", desde);
    }
    if (hasta) {
      query = query.lte("creada_utc", hasta);
    }

    // ---------- ejecutar ----------
    const { data, error } = await query;

    if (error) {
      console.error("Error consultando transacciones:", error);
      return NextResponse.json(
        {
          mensaje: "Error obteniendo transacciones",
          detalle: error.message,
        },
        { status: 500 }
      );
    }

    const transacciones = data ?? [];

    // ---------- KPIs en memoria (como máximo 100 registros) ----------
    const total = transacciones.length;
    const aprobadas = transacciones.filter(
      (t: any) => t.estado === "COMPLETADA" || t.estado === "APROBADA"
    ).length;
    const rechazadas = transacciones.filter(
      (t: any) => t.estado === "RECHAZADA"
    ).length;
    const monto_total = transacciones.reduce(
      (acc: number, t: any) => acc + Number(t.monto ?? 0),
      0
    );

    const stats = { total, aprobadas, rechazadas, monto_total };

    return NextResponse.json({ transacciones, stats }, { status: 200 });
  } catch (err: any) {
    console.error("Error en /api/transactions GET:", err);
    return NextResponse.json(
      {
        mensaje: "Error interno del servidor",
        detalle: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
