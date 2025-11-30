// app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db/supabaseClient";

type TransaccionRow = {
  IdTransaccion: number;
  Tipo: string | null;
  Monto: number;
  IdTarjetaOrigen: number | null;
  IdTarjetaDestino: number | null;
  Descripcion: string | null;
  CreadaUTC: string;
  IdEstadoTransaccion: number | null;
};

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(req.url);

    const cliente = searchParams.get("cliente"); // nombre o tarjeta (opcional)
    const estadoParam = searchParams.get("estado"); // COMPLETADA / RECHAZADA / PENDIENTE (opcional)
    const desde = searchParams.get("desde"); // YYYY-MM-DD (opcional)
    const hasta = searchParams.get("hasta"); // YYYY-MM-DD (opcional)
    const limit = Number(searchParams.get("limit") ?? "100");

    // ================== 1) LEER TRANSACCIONES BASE ==================
    let txQuery = supabase
      .from("Transacciones")
      .select(
        `
        IdTransaccion,
        Tipo,
        Monto,
        IdTarjetaOrigen,
        IdTarjetaDestino,
        Descripcion,
        CreadaUTC,
        IdEstadoTransaccion
        `
      )
      .order("CreadaUTC", { ascending: false })
      .limit(limit);

    // Filtro por fechas a nivel de BD
    if (desde) {
      txQuery = txQuery.gte("CreadaUTC", desde);
    }
    if (hasta) {
      // si quieres incluir todo el día, podrías concatenar " 23:59:59"
      txQuery = txQuery.lte("CreadaUTC", hasta);
    }

    const { data: txRows, error: txError } = await txQuery;

    if (txError) {
      console.error("Error consultando Transacciones:", txError);
      return NextResponse.json(
        {
          mensaje: "Error obteniendo transacciones",
          detalle: txError.message,
        },
        { status: 500 }
      );
    }

    const transaccionesBase: TransaccionRow[] = (txRows ?? []) as any[];

    if (transaccionesBase.length === 0) {
      return NextResponse.json(
        {
          transacciones: [],
          stats: { total: 0, aprobadas: 0, rechazadas: 0, monto_total: 0 },
        },
        { status: 200 }
      );
    }

    // ================== 2) LEER TABLAS RELACIONADAS ==================

    // Ids de tarjetas y estados
    const tarjetaIds = Array.from(
      new Set(
        transaccionesBase
          .map((t) => t.IdTarjetaOrigen)
          .filter((v): v is number => v != null)
      )
    );
    const estadoIds = Array.from(
      new Set(
        transaccionesBase
          .map((t) => t.IdEstadoTransaccion)
          .filter((v): v is number => v != null)
      )
    );

    // Tarjetas y Estados en paralelo
    const [
      { data: tarjetasData, error: tarjetasError },
      { data: estadosData, error: estadosError },
    ] = await Promise.all([
      tarjetaIds.length
        ? supabase
            .from("Tarjetas")
            .select(`IdTarjeta, IdCuenta, NumeroTarjeta`)
            .in("IdTarjeta", tarjetaIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      estadoIds.length
        ? supabase
            .from("EstadosTransaccion")
            .select(`IdEstadoTransaccion, Nombre`)
            .in("IdEstadoTransaccion", estadoIds)
        : Promise.resolve({ data: [] as any[], error: null }),
    ]);

    if (tarjetasError) {
      console.error("Error consultando Tarjetas:", tarjetasError);
    }
    if (estadosError) {
      console.error("Error consultando EstadosTransaccion:", estadosError);
    }

    const tarjetas = (tarjetasData ?? []) as any[];
    const estados = (estadosData ?? []) as any[];

    // Cuentas a partir de las tarjetas
    const cuentaIds = Array.from(
      new Set(
        tarjetas
          .map((t) => t.IdCuenta)
          .filter((v: any): v is number => v != null)
      )
    );

    const { data: cuentasData, error: cuentasError } = cuentaIds.length
      ? await supabase
          .from("Cuentas")
          .select(`IdCuenta, IdCliente`)
          .in("IdCuenta", cuentaIds)
      : { data: [] as any[], error: null };

    if (cuentasError) {
      console.error("Error consultando Cuentas:", cuentasError);
    }

    const cuentas = (cuentasData ?? []) as any[];

    // Clientes a partir de las cuentas
    const clienteIds = Array.from(
      new Set(
        cuentas
          .map((c) => c.IdCliente)
          .filter((v: any): v is number => v != null)
      )
    );

    const { data: clientesData, error: clientesError } = clienteIds.length
      ? await supabase
          .from("Clientes")
          .select(`IdCliente, Nombre`)
          .in("IdCliente", clienteIds)
      : { data: [] as any[], error: null };

    if (clientesError) {
      console.error("Error consultando Clientes:", clientesError);
    }

    const clientes = (clientesData ?? []) as any[];

    // ================== 3) MAPS DE APOYO ==================

    const tarjetasById = new Map<number, any>();
    tarjetas.forEach((t) => tarjetasById.set(t.IdTarjeta, t));

    const cuentasById = new Map<number, any>();
    cuentas.forEach((c) => cuentasById.set(c.IdCuenta, c));

    const clientesById = new Map<number, any>();
    clientes.forEach((c) => clientesById.set(c.IdCliente, c));

    const estadosById = new Map<number, string>();
    estados.forEach((e) =>
      estadosById.set(e.IdEstadoTransaccion, (e.Nombre as string) ?? "")
    );

    // ================== 4) ARMAR OBJETOS PARA EL DASHBOARD ==================

    const transacciones = transaccionesBase.map((tx) => {
      const tarjeta = tx.IdTarjetaOrigen
        ? tarjetasById.get(tx.IdTarjetaOrigen)
        : undefined;
      const cuenta = tarjeta ? cuentasById.get(tarjeta.IdCuenta) : undefined;
      const clienteRow = cuenta ? clientesById.get(cuenta.IdCliente) : undefined;
      const estadoNombre = tx.IdEstadoTransaccion
        ? estadosById.get(tx.IdEstadoTransaccion)
        : null;

      return {
        id_transaccion: tx.IdTransaccion,
        creada_utc: tx.CreadaUTC,
        nombre_cliente: clienteRow?.Nombre ?? null,
        servicio: null as string | null, // ya no existe campo servicio
        numero_tarjeta: tarjeta?.NumeroTarjeta ?? null,
        monto: tx.Monto,
        nombre_estado: estadoNombre ? estadoNombre.toUpperCase() : null,
        descripcion: tx.Descripcion ?? null,
      };
    });

    // ================== 5) FILTROS EN MEMORIA (cliente / estado) ==================

    let filtradas = transacciones;

    if (cliente) {
      const q = cliente.toLowerCase();
      const qNum = cliente.replace(/\s+/g, "");
      filtradas = filtradas.filter((t) => {
        const nombre = (t.nombre_cliente ?? "").toLowerCase();
        const num = (t.numero_tarjeta ?? "").replace(/\s+/g, "");
        return nombre.includes(q) || num.includes(qNum);
      });
    }

    if (estadoParam) {
      const target = estadoParam.toUpperCase();
      filtradas = filtradas.filter(
        (t) => (t.nombre_estado ?? "").toUpperCase() === target
      );
    }

    // ================== 6) KPIs ==================

    const total = filtradas.length;
    const aprobadas = filtradas.filter(
      (t) => t.nombre_estado === "COMPLETADA" || t.nombre_estado === "APROBADA"
    ).length;
    const rechazadas = filtradas.filter(
      (t) => t.nombre_estado === "RECHAZADA"
    ).length;
    const monto_total = filtradas.reduce(
      (acc, t) => acc + Number(t.monto ?? 0),
      0
    );

    const stats = { total, aprobadas, rechazadas, monto_total };

    return NextResponse.json(
      { transacciones: filtradas, stats },
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
