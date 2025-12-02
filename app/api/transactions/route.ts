// app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db/supabaseClient";

// Filas tal como están en la tabla "transacciones"
type TransaccionRow = {
  id_transaccion: number;
  tipo: string | null;
  monto: number;
  id_tarjeta_origen: number | null;
  id_tarjeta_destino: number | null;
  descripcion: string | null;
  creada_utc: string;
  id_estado_transaccion: number | null;
};

// Lo que el dashboard espera
type TransaccionDashboard = {
  id_transaccion: number;
  creada_utc: string;
  nombre_cliente: string | null;
  servicio: string | null;
  numero_tarjeta: string | null;
  monto: number;
  nombre_estado: string | null;
  descripcion: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(req.url);

    const clienteParam = searchParams.get("cliente"); // opcional
    const estadoParam = searchParams.get("estado");   // opcional
    const desde = searchParams.get("desde");          // opcional
    const hasta = searchParams.get("hasta");          // opcional
    const limit = Number(searchParams.get("limit") ?? "500");

    // ============ 1) LEER TRANSACCIONES ============

    let txQuery = supabase
      .from("transacciones")
      .select(
        `
        id_transaccion,
        tipo,
        monto,
        id_tarjeta_origen,
        id_tarjeta_destino,
        descripcion,
        creada_utc,
        id_estado_transaccion
        `
      )
      .order("creada_utc", { ascending: false })
      .limit(limit);

    if (desde) {
      txQuery = txQuery.gte("creada_utc", desde);
    }
    if (hasta) {
      txQuery = txQuery.lte("creada_utc", hasta);
    }

    const { data: txRows, error: txError } = await txQuery;

    if (txError) {
      console.error("Error consultando transacciones:", txError);
      return NextResponse.json(
        {
          mensaje: "Error obteniendo transacciones",
          detalle: txError.message,
        },
        { status: 500 }
      );
    }

    const transaccionesBase: TransaccionRow[] = (txRows ?? []) as TransaccionRow[];

    console.log(
      "[/api/transactions] transacciones base leídas:",
      transaccionesBase.length
    );

    if (transaccionesBase.length === 0) {
      return NextResponse.json(
        {
          transacciones: [] as TransaccionDashboard[],
          stats: { total: 0, aprobadas: 0, rechazadas: 0, monto_total: 0 },
        },
        { status: 200 }
      );
    }

    // ============ 2) TABLAS RELACIONADAS ============

    const tarjetaIds = Array.from(
      new Set(
        transaccionesBase
          .map((t) => t.id_tarjeta_origen)
          .filter((v): v is number => v != null)
      )
    );

    const estadoIds = Array.from(
      new Set(
        transaccionesBase
          .map((t) => t.id_estado_transaccion)
          .filter((v): v is number => v != null)
      )
    );

    const [
      { data: tarjetasData, error: tarjetasError },
      { data: estadosData, error: estadosError },
    ] = await Promise.all([
      tarjetaIds.length
        ? supabase
            .from("tarjetas")
            .select("id_tarjeta, id_cuenta, numero_tarjeta")
            .in("id_tarjeta", tarjetaIds)
        : Promise.resolve({ data: [] as any[], error: null }),

      estadoIds.length
        ? supabase
            .from("estados_transaccion")
            .select("id_estado_transaccion, nombre")
            .in("id_estado_transaccion", estadoIds)
        : Promise.resolve({ data: [] as any[], error: null }),
    ]);

    if (tarjetasError) console.error("Error consultando tarjetas:", tarjetasError);
    if (estadosError) console.error("Error consultando estados:", estadosError);

    const tarjetas = (tarjetasData ?? []) as {
      id_tarjeta: number;
      id_cuenta: number | null;
      numero_tarjeta: string | null;
    }[];

    const estados = (estadosData ?? []) as {
      id_estado_transaccion: number;
      nombre: string | null;
    }[];

    const cuentaIds = Array.from(
      new Set(
        tarjetas
          .map((t) => t.id_cuenta)
          .filter((v): v is number => v != null)
      )
    );

    const { data: cuentasData, error: cuentasError } = cuentaIds.length
      ? await supabase
          .from("cuentas")
          .select("id_cuenta, id_cliente")
          .in("id_cuenta", cuentaIds)
      : { data: [] as any[], error: null };

    if (cuentasError) console.error("Error consultando cuentas:", cuentasError);

    const cuentas = (cuentasData ?? []) as {
      id_cuenta: number;
      id_cliente: number | null;
    }[];

    const clienteIds = Array.from(
      new Set(
        cuentas
          .map((c) => c.id_cliente)
          .filter((v): v is number => v != null)
      )
    );

    const { data: clientesData, error: clientesError } = clienteIds.length
      ? await supabase
          .from("clientes")
          .select("id_cliente, nombre")
          .in("id_cliente", clienteIds)
      : { data: [] as any[], error: null };

    if (clientesError) console.error("Error consultando clientes:", clientesError);

    const clientes = (clientesData ?? []) as {
      id_cliente: number;
      nombre: string | null;
    }[];

    // ============ 3) MAPS EN MEMORIA ============

    const tarjetasById = new Map<number, (typeof tarjetas)[number]>();
    tarjetas.forEach((t) => tarjetasById.set(t.id_tarjeta, t));

    const cuentasById = new Map<number, (typeof cuentas)[number]>();
    cuentas.forEach((c) => cuentasById.set(c.id_cuenta, c));

    const clientesById = new Map<number, (typeof clientes)[number]>();
    clientes.forEach((c) => clientesById.set(c.id_cliente, c));

    const estadosById = new Map<number, string>();
    estados.forEach((e) =>
      estadosById.set(e.id_estado_transaccion, e.nombre ?? "")
    );

    // ============ 4) ARMAR RESPUESTA PARA EL DASHBOARD ============

    const transacciones: TransaccionDashboard[] = transaccionesBase.map((tx) => {
      const tarjeta = tx.id_tarjeta_origen
        ? tarjetasById.get(tx.id_tarjeta_origen) ?? null
        : null;
      const cuenta = tarjeta?.id_cuenta
        ? cuentasById.get(tarjeta.id_cuenta) ?? null
        : null;
      const clienteRow = cuenta?.id_cliente
        ? clientesById.get(cuenta.id_cliente) ?? null
        : null;

      const estadoNombre = tx.id_estado_transaccion
        ? estadosById.get(tx.id_estado_transaccion) ?? null
        : null;

      return {
        id_transaccion: tx.id_transaccion,
        creada_utc: tx.creada_utc,
        nombre_cliente: clienteRow?.nombre ?? null,
        servicio: null,
        numero_tarjeta: tarjeta?.numero_tarjeta ?? null,
        monto: tx.monto,
        nombre_estado: estadoNombre ? estadoNombre.toUpperCase() : null,
        descripcion: tx.descripcion ?? null,
      };
    });

    // ============ 5) FILTROS EN MEMORIA (cliente / estado) ============

    let filtradas = transacciones;

    if (clienteParam) {
      const q = clienteParam.toLowerCase();
      const qNum = clienteParam.replace(/\s+/g, "");
      filtradas = filtradas.filter((t) => {
        const nombre = (t.nombre_cliente ?? "").toLowerCase();
        const num = (t.numero_tarjeta ?? "").replace(/\s+/g, "");
        return nombre.includes(q) || num.includes(qNum);
      });
    }

    if (estadoParam) {
      const q = estadoParam.toUpperCase();
      filtradas = filtradas.filter(
        (t) => (t.nombre_estado ?? "").toUpperCase() === q
      );
    }

    // ============ 6) KPIs ============

    const total = filtradas.length;
    const aprobadas = filtradas.filter(
      (t) => t.nombre_estado === "COMPLETADA"
    ).length;
    const rechazadas = filtradas.filter(
      (t) => t.nombre_estado === "RECHAZADA"
    ).length;
    const monto_total = filtradas.reduce(
      (acc, t) => acc + Number(t.monto ?? 0),
      0
    );

    return NextResponse.json(
      {
        transacciones: filtradas,
        stats: { total, aprobadas, rechazadas, monto_total },
      },
      { status: 200 }
    );
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
