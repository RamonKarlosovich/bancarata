// app/api/bank/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db/supabaseClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TransaccionRequest {
  NumeroTarjetaOrigen: string;
  NumeroTarjetaDestino: string;
  NombreCliente: string;
  MesExp: number;
  AnioExp: number;
  Cvv: string;
  Monto: number;
  IdempotenciaId?: string;
}

interface TransaccionResponse {
  CreadaUTC: string;
  IdTransaccion: string;
  TipoTransaccion: string;
  MontoTransaccion: number;
  MarcaTarjeta: string;
  NumeroTarjeta: string;
  NombreEstado: string;
  Firma: string;
  Descripcion: string;
}

interface TarjetaJoin {
  id_tarjeta: number;
  id_cuenta: number;
  numero_tarjeta: string;
  cvv: string;
  mes_exp: number;
  anio_exp: number;
  fecha_cierre: string | null;
  cuentas: {
    id_cuenta: number;
    saldo_actual: string | number;
    fecha_cierre: string | null;
    clientes?: {
      id_cliente: number;
      nombre: string;
      activo: boolean;
    } | null;
  } | null;
}

type SupabaseClient = ReturnType<typeof getSupabaseServer>;

type TransaccionRowMin = {
  id_transaccion: number;
  creada_utc: string;
};

// ---------------------------------------------------------------------------
// Helper: registrar transacción RECHAZADA y devolver id/fecha
// ---------------------------------------------------------------------------
async function registrarTransaccionRechazada(
  supabase: SupabaseClient,
  body: TransaccionRequest,
  mensaje: string,
  origen?: TarjetaJoin | null,
  destino?: TarjetaJoin | null
): Promise<TransaccionRowMin | null> {
  try {
    // Buscar ID de estado RECHAZADA
    const { data: edoRow } = await supabase
      .from("estados_transaccion")
      .select("id_estado_transaccion")
      .eq("nombre", "RECHAZADA")
      .single();

    // Según tu script inicial: 1 = PENDIENTE, 2 = COMPLETADA, 3 = RECHAZADA
    const idEstado = edoRow?.id_estado_transaccion ?? 3;

    let idTarjetaOrigen: number | null = origen?.id_tarjeta ?? null;
    let idTarjetaDestino: number | null = destino?.id_tarjeta ?? null;

    // Si no tenemos la tarjeta origen pero sí el número, intentamos buscarla
    if (!idTarjetaOrigen && body.NumeroTarjetaOrigen) {
      const { data } = await supabase
        .from("tarjetas")
        .select("id_tarjeta")
        .eq("numero_tarjeta", body.NumeroTarjetaOrigen)
        .limit(1);
      const tarjeta = data?.[0] as { id_tarjeta: number } | undefined;
      if (tarjeta) idTarjetaOrigen = tarjeta.id_tarjeta;
    }

    // Igual para la tarjeta destino
    if (!idTarjetaDestino && body.NumeroTarjetaDestino) {
      const { data } = await supabase
        .from("tarjetas")
        .select("id_tarjeta")
        .eq("numero_tarjeta", body.NumeroTarjetaDestino)
        .limit(1);
      const tarjeta = data?.[0] as { id_tarjeta: number } | undefined;
      if (tarjeta) idTarjetaDestino = tarjeta.id_tarjeta;
    }

    // La columna monto tiene CHECK (monto > 0), así que nunca podemos mandar <= 0
    const montoOriginal = Number(body.Monto);
    const tieneMontoValido =
      Number.isFinite(montoOriginal) && montoOriginal > 0;
    const montoLog = tieneMontoValido ? montoOriginal : 0.01; // mínimo para pasar el CHECK

    const descripcion = tieneMontoValido
      ? mensaje
      : `${mensaje} (monto original inválido: ${body.Monto})`;

    const { data: trx, error } = await supabase
      .from("transacciones")
      .insert({
        tipo: "TRANSFERENCIA",
        monto: montoLog,
        id_tarjeta_origen: idTarjetaOrigen,
        id_tarjeta_destino: idTarjetaDestino,
        descripcion,
        id_estado_transaccion: idEstado,
      })
      .select("id_transaccion,creada_utc")
      .single<TransaccionRowMin>();

    if (error || !trx) {
      console.error("No se pudo registrar transacción rechazada", error);
      return null;
    }

    return trx;
  } catch (err) {
    console.error("No se pudo registrar transacción rechazada", err);
    // No rompemos la respuesta al cliente si el log falla
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helper: construir voucher (TransaccionResponse) para RECHAZADA
// ---------------------------------------------------------------------------
async function responderErrorValidacion(
  supabase: SupabaseClient,
  body: TransaccionRequest,
  mensaje: string,
  status: number,
  origen?: TarjetaJoin | null,
  destino?: TarjetaJoin | null
) {
  const trx = await registrarTransaccionRechazada(
    supabase,
    body,
    mensaje,
    origen,
    destino
  );

  const ult4Destino =
    destino?.numero_tarjeta?.slice(-4) ??
    body.NumeroTarjetaDestino?.slice(-4) ??
    "";

  const idBonito = trx
    ? String(trx.id_transaccion).padStart(6, "0")
    : "000000";

  const creadaUtcIso = trx
    ? new Date(trx.creada_utc).toISOString()
    : new Date().toISOString();

  const respuesta: TransaccionResponse = {
    CreadaUTC: creadaUtcIso,
    IdTransaccion: trx ? `TRX-${idBonito}` : "TRX-ERROR",
    TipoTransaccion: "Transferencia",
    MontoTransaccion: Number(body.Monto) || 0,
    MarcaTarjeta: "BBVA",
    NumeroTarjeta: ult4Destino
      ? `**** **** **** ${ult4Destino}`
      : "**** **** **** ****",
    NombreEstado: "RECHAZADA",
    Firma: "NIP",
    Descripcion: mensaje,
  };

  return NextResponse.json(respuesta, { status });
}

// ---------------------------------------------------------------------------
// Handler principal POST
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TransaccionRequest;
    const supabase = getSupabaseServer();

    const onlyDigits = /^\d+$/;

    // ===================== VALIDACIONES BÁSICAS =====================
    if (
      !body.NumeroTarjetaOrigen ||
      !body.NumeroTarjetaDestino ||
      !body.NombreCliente ||
      !body.MesExp ||
      !body.AnioExp ||
      !body.Cvv ||
      body.Monto == null
    ) {
      return responderErrorValidacion(
        supabase,
        body,
        "Datos incompletos",
        400
      );
    }

    if (
      !onlyDigits.test(body.NumeroTarjetaOrigen) ||
      body.NumeroTarjetaOrigen.length < 12 ||
      body.NumeroTarjetaOrigen.length > 19
    ) {
      return responderErrorValidacion(
        supabase,
        body,
        "Número de tarjeta origen inválido",
        400
      );
    }

    if (
      !onlyDigits.test(body.NumeroTarjetaDestino) ||
      body.NumeroTarjetaDestino.length < 12 ||
      body.NumeroTarjetaDestino.length > 19
    ) {
      return responderErrorValidacion(
        supabase,
        body,
        "Número de tarjeta destino inválido",
        400
      );
    }

    if (!/^\d{3,4}$/.test(String(body.Cvv))) {
      return responderErrorValidacion(supabase, body, "CVV inválido", 400);
    }

    if (body.MesExp < 1 || body.MesExp > 12) {
      return responderErrorValidacion(
        supabase,
        body,
        "Mes de expiración inválido",
        400
      );
    }

    if (body.AnioExp < 2020 || body.AnioExp > 2100) {
      return responderErrorValidacion(
        supabase,
        body,
        "Año de expiración inválido",
        400
      );
    }

    if (body.NumeroTarjetaOrigen === body.NumeroTarjetaDestino) {
      return responderErrorValidacion(
        supabase,
        body,
        "La tarjeta origen y destino no pueden ser la misma",
        400
      );
    }

    if (Number(body.Monto) <= 0) {
      return responderErrorValidacion(
        supabase,
        body,
        "El monto debe ser mayor a cero",
        400
      );
    }

    // ===================== TARJETA ORIGEN =====================
    const { data: origen, error: eOrigen } = await supabase
      .from("tarjetas")
      .select(
        "id_tarjeta,id_cuenta,numero_tarjeta,cvv,mes_exp,anio_exp,fecha_cierre,cuentas(id_cuenta,saldo_actual,fecha_cierre,clientes(id_cliente,nombre,activo))"
      )
      .eq("numero_tarjeta", body.NumeroTarjetaOrigen)
      .single<TarjetaJoin>();

    if (eOrigen || !origen) {
      return responderErrorValidacion(
        supabase,
        body,
        "Tarjeta origen no encontrada",
        404
      );
    }

    if (origen.fecha_cierre) {
      return responderErrorValidacion(
        supabase,
        body,
        "Tarjeta origen inactiva",
        400,
        origen
      );
    }

    if (!origen.cuentas || origen.cuentas.fecha_cierre) {
      return responderErrorValidacion(
        supabase,
        body,
        "Cuenta origen no disponible",
        400,
        origen
      );
    }

    const titular = origen.cuentas.clientes || null;
    if (!titular || !titular.activo) {
      return responderErrorValidacion(
        supabase,
        body,
        "Titular de la tarjeta origen no activo",
        400,
        origen
      );
    }

    const norm = (s: string) =>
      s.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();

    if (norm(titular.nombre) !== norm(body.NombreCliente)) {
      return responderErrorValidacion(
        supabase,
        body,
        "El nombre no coincide con el titular de la tarjeta",
        400,
        origen
      );
    }

    if (String(origen.cvv) !== String(body.Cvv)) {
      return responderErrorValidacion(
        supabase,
        body,
        "CVV incorrecto",
        400,
        origen
      );
    }

    if (
      Number(origen.mes_exp) !== Number(body.MesExp) ||
      Number(origen.anio_exp) !== Number(body.AnioExp)
    ) {
      return responderErrorValidacion(
        supabase,
        body,
        "Fecha de expiración incorrecta",
        400,
        origen
      );
    }

    // ===================== TARJETA DESTINO =====================
    const { data: destino, error: eDestino } = await supabase
      .from("tarjetas")
      .select(
        "id_tarjeta,id_cuenta,numero_tarjeta,fecha_cierre,cuentas(id_cuenta,saldo_actual,fecha_cierre)"
      )
      .eq("numero_tarjeta", body.NumeroTarjetaDestino)
      .single<TarjetaJoin>();

    if (eDestino || !destino) {
      return responderErrorValidacion(
        supabase,
        body,
        "Tarjeta destino no encontrada",
        404,
        origen
      );
    }

    if (destino.fecha_cierre) {
      return responderErrorValidacion(
        supabase,
        body,
        "Tarjeta destino inactiva",
        400,
        origen,
        destino
      );
    }

    if (!destino.cuentas || destino.cuentas.fecha_cierre) {
      return responderErrorValidacion(
        supabase,
        body,
        "Cuenta destino no disponible",
        400,
        origen,
        destino
      );
    }

    const saldoOrigen = Number(origen.cuentas.saldo_actual);
    if (saldoOrigen < Number(body.Monto)) {
      return responderErrorValidacion(
        supabase,
        body,
        "Fondos insuficientes",
        400,
        origen,
        destino
      );
    }

    const nuevoSaldoOrigen = saldoOrigen - Number(body.Monto);
    const nuevoSaldoDestino =
      Number(destino.cuentas.saldo_actual) + Number(body.Monto);

    // ===================== ACTUALIZAR SALDOS =====================
    const { error: debErr } = await supabase
      .from("cuentas")
      .update({ saldo_actual: nuevoSaldoOrigen })
      .eq("id_cuenta", origen.cuentas.id_cuenta);

    if (debErr) {
      return responderErrorValidacion(
        supabase,
        body,
        "No se pudo debitar la cuenta de origen",
        500,
        origen,
        destino
      );
    }

    const { error: credErr } = await supabase
      .from("cuentas")
      .update({ saldo_actual: nuevoSaldoDestino })
      .eq("id_cuenta", destino.cuentas.id_cuenta);

    if (credErr) {
      // rollback saldo origen
      await supabase
        .from("cuentas")
        .update({ saldo_actual: saldoOrigen })
        .eq("id_cuenta", origen.cuentas.id_cuenta);

      return responderErrorValidacion(
        supabase,
        body,
        "No se pudo acreditar la cuenta destino",
        500,
        origen,
        destino
      );
    }

    // ===================== REGISTRO TRANSACCIÓN COMPLETADA =====================
    const { data: edoRow } = await supabase
      .from("estados_transaccion")
      .select("id_estado_transaccion")
      .eq("nombre", "COMPLETADA")
      .single();

    const idEstado = edoRow?.id_estado_transaccion ?? 2;

    const { data: trx, error: trxErr } = await supabase
      .from("transacciones")
      .insert({
        tipo: "TRANSFERENCIA",
        monto: Number(body.Monto),
        id_tarjeta_origen: origen.id_tarjeta,
        id_tarjeta_destino: destino.id_tarjeta,
        descripcion: "TRANSFERENCIA",
        id_estado_transaccion: idEstado,
      })
      .select("id_transaccion,creada_utc")
      .single<TransaccionRowMin>();

    if (trxErr || !trx) {
      await supabase
        .from("cuentas")
        .update({ saldo_actual: saldoOrigen })
        .eq("id_cuenta", origen.cuentas.id_cuenta);
      await supabase
        .from("cuentas")
        .update({ saldo_actual: destino.cuentas.saldo_actual })
        .eq("id_cuenta", destino.cuentas.id_cuenta);

      return responderErrorValidacion(
        supabase,
        body,
        "No se pudo registrar la transacción",
        500,
        origen,
        destino
      );
    }

    const ult4 = String(destino.numero_tarjeta).slice(-4);
    const idBonito = String(trx.id_transaccion).padStart(6, "0");

    const respuesta: TransaccionResponse = {
      CreadaUTC: new Date(trx.creada_utc).toISOString(),
      IdTransaccion: `TRX-${idBonito}`,
      TipoTransaccion: "Transferencia",
      MontoTransaccion: Number(body.Monto),
      MarcaTarjeta: "BBVA",
      NumeroTarjeta: `**** **** **** ${ult4}`,
      NombreEstado: "COMPLETADA",
      Firma: "NIP",
      Descripcion: "Transferencia realizada con éxito",
    };

    return NextResponse.json(respuesta, { status: 200 });
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Error interno del servidor", detalle },
      { status: 500 }
    );
  }
}
