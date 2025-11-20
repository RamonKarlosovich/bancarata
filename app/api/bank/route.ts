// app/api/bank/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db/supabaseClient";

// ------- Tipos -------

// Lo que LOS OTROS SERVICIOS le mandan al banco
interface TransaccionRequest {
  NumeroTarjetaOrigen: string;
  NumeroTarjetaDestino: string;
  NombreCliente: string;
  MesExp: number;
  AnioExp: number;
  Cvv: string;
  Monto: number;
  // Opcional, si alguna vez quieres usar idempotencia
  IdempotenciaId?: string;
}

// Lo que el BANCO les regresa a los otros servicios
interface TransaccionResponse {
  CreadaUTC: string;
  IdTransaccion: string;        // <- PascalCase, igual que en swagger
  TipoTransaccion: string;
  MontoTransaccion: number;
  MarcaTarjeta: string;
  NumeroTarjeta: string;
  NumeroAutorizacion: string;
  NombreEstado: string;
  Firma: string;
  Mensaje: string;
}

// Coincide con la estructura real en Supabase
interface TarjetaConCuenta {
  id_tarjeta: number;
  numero_tarjeta: string;
  cuentas: {
    id_cuenta: number;
    saldo_actual: string | number;
  } | null;
}

// Lo que devuelve la función RPC transferir_saldo
interface RpcTransferirSaldoRow {
  id_transaccion: number;
}

// ------- Handler -------

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TransaccionRequest;
    const supabase = getSupabaseServer();

    // Validaciones rápidas
    if (!body.NumeroTarjetaOrigen || !body.NumeroTarjetaDestino) {
      return NextResponse.json(
        { Mensaje: "Número de tarjeta origen y destino son obligatorios" },
        { status: 400 }
      );
    }

    if (body.NumeroTarjetaOrigen === body.NumeroTarjetaDestino) {
      return NextResponse.json(
        { Mensaje: "La tarjeta origen y destino no pueden ser la misma" },
        { status: 400 }
      );
    }

    if (body.Monto <= 0) {
      return NextResponse.json(
        { Mensaje: "El monto debe ser mayor a cero" },
        { status: 400 }
      );
    }

    // --- Buscar tarjeta origen ---
    const { data: origenData, error: origenErr } = await supabase
      .from("tarjetas")
      .select(
        `
        id_tarjeta,
        numero_tarjeta,
        cuentas (
          id_cuenta,
          saldo_actual
        )
      `
      )
      .eq("numero_tarjeta", body.NumeroTarjetaOrigen)
      .limit(1)
      .single<TarjetaConCuenta>();

    if (origenErr || !origenData) {
      console.error("Error buscando tarjeta origen:", origenErr);
      return NextResponse.json(
        { Mensaje: "Tarjeta origen no encontrada" },
        { status: 404 }
      );
    }

    if (!origenData.cuentas) {
      return NextResponse.json(
        { Mensaje: "Cuenta asociada a la tarjeta origen no encontrada" },
        { status: 404 }
      );
    }

    // --- Buscar tarjeta destino ---
    const { data: destinoData, error: destErr } = await supabase
      .from("tarjetas")
      .select(
        `
        id_tarjeta,
        numero_tarjeta,
        cuentas (
          id_cuenta,
          saldo_actual
        )
      `
      )
      .eq("numero_tarjeta", body.NumeroTarjetaDestino)
      .limit(1)
      .single<TarjetaConCuenta>();

    if (destErr || !destinoData) {
      console.error("Error buscando tarjeta destino:", destErr);
      return NextResponse.json(
        { Mensaje: "Tarjeta destino no encontrada" },
        { status: 404 }
      );
    }

    if (!destinoData.cuentas) {
      return NextResponse.json(
        { Mensaje: "Cuenta asociada a la tarjeta destino no encontrada" },
        { status: 404 }
      );
    }

    const saldoOrigen = Number(origenData.cuentas.saldo_actual);

    if (saldoOrigen < body.Monto) {
      return NextResponse.json(
        { Mensaje: "Fondos insuficientes" },
        { status: 400 }
      );
    }

    // --- Llamar RPC transaccional ---
    const rpcResult = await supabase.rpc("transferir_saldo", {
      p_id_cuenta_origen: origenData.cuentas.id_cuenta,
      p_id_cuenta_destino: destinoData.cuentas.id_cuenta,
      p_id_tarjeta_origen: origenData.id_tarjeta,
      p_id_tarjeta_destino: destinoData.id_tarjeta,
      p_monto: body.Monto,
      // descripción genérica; se guarda en la columna `descripcion`
      p_descripcion: "TRANSFERENCIA",
    });

    const trx = rpcResult.data as RpcTransferirSaldoRow[] | null;
    const trxErr = rpcResult.error;

    if (trxErr) {
      console.error("Error RPC transferir_saldo:", trxErr);
      return NextResponse.json(
        {
          Mensaje: "No se pudo completar la transacción",
          Detalle: trxErr.message,
        },
        { status: 500 }
      );
    }

    if (!trx || trx.length === 0) {
      return NextResponse.json(
        { Mensaje: "La transacción no devolvió un identificador" },
        { status: 500 }
      );
    }

    const idNum = trx[0].id_transaccion;              // 1, 2, 3, ...
    const idFormateado = idNum.toString().padStart(6, "0"); // "000001"

    // --- Armar respuesta bancaria ---
    const ultimos4 = body.NumeroTarjetaOrigen.slice(-4);

    const respuesta: TransaccionResponse = {
      CreadaUTC: new Date().toISOString(),
      IdTransaccion: `TRX-${idFormateado}`,     // <- aquí ya queda consecutivo y bonito
      TipoTransaccion: "TRANSFERENCIA",
      MontoTransaccion: body.Monto,
      MarcaTarjeta: "VISA",
      NumeroTarjeta: `**** **** **** ${ultimos4}`,
      NumeroAutorizacion: `AUTH-${Math.floor(
        100000 + Math.random() * 900000
      )}`,
      NombreEstado: "ACEPTADA",
      Firma: "PIN",
      Mensaje: "Pago aprobado",
    };

    return NextResponse.json(respuesta, { status: 200 });
  } catch (error) {
    console.error("Error inesperado en /api/bank:", error);
    return NextResponse.json(
      {
        Mensaje: "Error interno del servidor",
        Detalle: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}