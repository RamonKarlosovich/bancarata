// app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db/supabaseClient";

type TransaccionRow = {
  IdTransaccion: number;
  Tipo: string | null;
  Monto: number;
  TarjetaOrigenId: number | null;
  TarjetaDestinoId: number | null;
  Descripcion: string | null;
  CreadaUTC: string;
  IdEdoTransaccion: number | null;
};

type TarjetaRow = {
  IdTarjeta: number;
  IdCuenta: number | null;
  NumeroTarjeta: string | null;
};

type CuentaRow = {
  IdCuenta: number;
  IdCliente: number | null;
};

type ClienteRow = {
  IdCliente: number;
  Nombre: string | null;
};

type EstadoRow = {
  IdEdoTransaccion: number;
  NomEdo: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(req.url);

    const clienteParam = searchParams.get("cliente");
    const estadoParam = searchParams.get("estado");
    const desde = searchParams.get("desde"); // YYYY-MM-DD
    const hasta = searchParams.get("hasta"); // YYYY-MM-DD
    const limit = Number(searchParams.get("limit") ?? "500");

    // 1) Transacciones base
    let txQuery = supabase
      .from("Transacciones")
      .select(
        `
        IdTransaccion,
        Tipo,
        Monto,
        TarjetaOrigenId,
        TarjetaDestinoId,
        Descripcion,
        CreadaUTC,
        IdEdoTransaccion
      `
      )
      .order("CreadaUTC", { ascending: false })
      .limit(limit);

    if (desde) {
      txQuery = txQuery.gte("CreadaUTC", `${desde} 00:00:00`);
    }
    if (hasta) {
      txQuery = txQuery.lte("CreadaUTC", `${hasta} 23:59:59`);
    }

    const { data: txRowsRaw, error: txError } = await txQuery;

    if (txError) {
      console.error("ERROR Transacciones:", txError);
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    const txRows = (txRowsRaw ?? []) as TransaccionRow[];

    if (txRows.length === 0) {
      return NextResponse.json(
        {
          transacciones: [],
          stats: { total: 0, aprobadas: 0, rechazadas: 0, monto_total: 0 },
        },
        { status: 200 }
      );
    }

    // 2) IDs relacionados
    const tarjetaIds = Array.from(
      new Set(txRows.map(t => t.TarjetaOrigenId).filter((v): v is number => v != null))
    );

    const estadoIds = Array.from(
      new Set(txRows.map(t => t.IdEdoTransaccion).filter((v): v is number => v != null))
    );

    // 3) Tarjetas y estados
    const [tarjetasResp, estadosResp] = await Promise.all([
      tarjetaIds.length
        ? supabase
            .from("Tarjetas")
            .select(`IdTarjeta, IdCuenta, NumeroTarjeta`)
            .in("IdTarjeta", tarjetaIds)
        : Promise.resolve({ data: null, error: null }),
      estadoIds.length
        ? supabase
            .from("EstadosTransaccion")
            .select(`IdEdoTransaccion, NomEdo`)
            .in("IdEdoTransaccion", estadoIds)
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (tarjetasResp.error) {
      console.error("ERROR Tarjetas:", tarjetasResp.error);
    }
    if (estadosResp.error) {
      console.error("ERROR EstadosTransaccion:", estadosResp.error);
    }

    const tarjetas = (tarjetasResp.data ?? []) as TarjetaRow[];
    const estados = (estadosResp.data ?? []) as EstadoRow[];

    // 4) Cuentas
    const cuentaIds = Array.from(
      new Set(tarjetas.map(t => t.IdCuenta).filter((v): v is number => v != null))
    );

    const { data: cuentasRaw, error: cuentasError } = cuentaIds.length
      ? await supabase
          .from("Cuentas")
          .select(`IdCuenta, IdCliente`)
          .in("IdCuenta", cuentaIds)
      : { data: null, error: null };

    if (cuentasError) {
      console.error("ERROR Cuentas:", cuentasError);
    }

    const cuentas = (cuentasRaw ?? []) as CuentaRow[];

    // 5) Clientes
    const clienteIds = Array.from(
      new Set(cuentas.map(c => c.IdCliente).filter((v): v is number => v != null))
    );

    const { data: clientesRaw, error: clientesError } = clienteIds.length
      ? await supabase
          .from("Clientes")
          .select(`IdCliente, Nombre`)
          .in("IdCliente", clienteIds)
      : { data: null, error: null };

    if (clientesError) {
      console.error("ERROR Clientes:", clientesError);
    }

    const clientes = (clientesRaw ?? []) as ClienteRow[];

    // 6) Maps de apoyo (ya sin null)
    const tarjetasById = new Map<number, TarjetaRow>();
    tarjetas.forEach(t => tarjetasById.set(t.IdTarjeta, t));

    const cuentasById = new Map<number, CuentaRow>();
    cuentas.forEach(c => cuentasById.set(c.IdCuenta, c));

    const clientesById = new Map<number, ClienteRow>();
    clientes.forEach(c => clientesById.set(c.IdCliente, c));

    const estadosById = new Map<number, string>();
    estados.forEach(e => {
      if (e.NomEdo != null) {
        estadosById.set(e.IdEdoTransaccion, e.NomEdo);
      }
    });

    // 7) Armar respuesta para el dashboard
    const transacciones = txRows.map(tx => {
      const tarjeta = tx.TarjetaOrigenId
        ? tarjetasById.get(tx.TarjetaOrigenId)
        : undefined;
      const cuenta = tarjeta?.IdCuenta ? cuentasById.get(tarjeta.IdCuenta) : undefined;
      const clienteRow = cuenta?.IdCliente
        ? clientesById.get(cuenta.IdCliente)
        : undefined;
      const estadoNombre = tx.IdEdoTransaccion
        ? estadosById.get(tx.IdEdoTransaccion) ?? null
        : null;

      return {
        id_transaccion: tx.IdTransaccion,
        creada_utc: tx.CreadaUTC,
        nombre_cliente: clienteRow?.Nombre ?? null,
        numero_tarjeta: tarjeta?.NumeroTarjeta ?? null,
        monto: tx.Monto,
        nombre_estado: estadoNombre ? estadoNombre.toUpperCase() : null,
        descripcion: tx.Descripcion ?? null,
      };
    });

    // 8) Filtros en memoria
    let filtradas = transacciones;

    if (clienteParam) {
      const q = clienteParam.toLowerCase();
      filtradas = filtradas.filter(t =>
        (t.nombre_cliente ?? "").toLowerCase().includes(q)
      );
    }

    if (estadoParam) {
      const q = estadoParam.toUpperCase();
      filtradas = filtradas.filter(t => (t.nombre_estado ?? "") === q);
    }

    // 9) KPIs
    const total = filtradas.length;
    const aprobadas = filtradas.filter(t => t.nombre_estado === "COMPLETADA").length;
    const rechazadas = filtradas.filter(t => t.nombre_estado === "RECHAZADA").length;
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
    console.error("Error grave en GET /transactions:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error interno" },
      { status: 500 }
    );
  }
}
