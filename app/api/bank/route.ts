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
  NumeroTarjeta: string;
  NombreEstado: string;
  Firma: string;
  Descripcion: string;
}

// Estructura que regresamos al registrar una transacción en BD
type TransaccionRowMin = {
  id_transaccion: number;
  creada_utc: string;
};

// Join anidado tarjeta -> cuenta -> cliente
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

// ---------------------------------------------------------------------------
// Helpers de logging
// ---------------------------------------------------------------------------
function maskCard(num?: string | null) {
  if (!num) return null;
  const last4 = String(num).slice(-4);
  return "************" + last4;
}

function maskRequest(body: TransaccionRequest) {
  return {
    ...body,
    NumeroTarjetaOrigen: maskCard(body.NumeroTarjetaOrigen),
    NumeroTarjetaDestino: maskCard(body.NumeroTarjetaDestino),
    Cvv: "***",
  };
}

function getCampoErrorFromMensaje(mensaje: string): string | null {
  const m = mensaje.toLowerCase();

  if (m.includes("fondos insuficientes")) return "Monto";
  if (m.includes("número de tarjeta origen") || m.includes("numero de tarjeta origen")) return "NumeroTarjetaOrigen";
  if (m.includes("número de tarjeta destino") || m.includes("numero de tarjeta destino")) return "NumeroTarjetaDestino";

  if (m.includes("tarjeta origen")) return "NumeroTarjetaOrigen";
  if (m.includes("tarjeta destino")) return "NumeroTarjetaDestino";
  if (m.includes("cuenta origen")) return "CuentaOrigen";
  if (m.includes("cuenta destino")) return "CuentaDestino";

  if (m.includes("cvv")) return "Cvv";
  if (m.includes("nombre")) return "NombreCliente";
  if (m.includes("mes de expiración") || m.includes("mes de expiracion")) return "MesExp";
  if (m.includes("año de expiración") || m.includes("anio de expiración") || m.includes("anio de expiracion")) return "AnioExp";
  if (m.includes("monto")) return "Monto";

  return null;
}

type ResultadoTransaccionEnum =
  | "APROBADA"
  | "RECHAZADA_DATOS"
  | "RECHAZADA_SALDO"
  | "ERROR_INTERNO";

async function registrarLogTransaccion(opts: {
  supabase: SupabaseClient;
  body?: TransaccionRequest;
  respuesta: any;
  resultado: ResultadoTransaccionEnum;
  motivo_corto: string;
  campo_error?: string | null;
  id_transaccion?: number | null;
  origen?: TarjetaJoin | null;
  destino?: TarjetaJoin | null;
  saldo_origen_antes?: number | null;
  saldo_origen_despues?: number | null;
  saldo_destino_antes?: number | null;
  saldo_destino_despues?: number | null;
}) {
  const {
    supabase,
    body,
    respuesta,
    resultado,
    motivo_corto,
    campo_error,
    id_transaccion,
    origen,
    destino,
    saldo_origen_antes,
    saldo_origen_despues,
    saldo_destino_antes,
    saldo_destino_despues,
  } = opts;

  try {
    // Si tenemos body usamos sus datos, si no, todos null
    const requestMasked = body ? maskRequest(body) : null;

    const numero_tarjeta_origen = body?.NumeroTarjetaOrigen
      ? maskCard(body.NumeroTarjetaOrigen)
      : null;
    const numero_tarjeta_destino = body?.NumeroTarjetaDestino
      ? maskCard(body.NumeroTarjetaDestino)
      : null;
    const nombre_cliente = body?.NombreCliente ?? null;
    const monto = body?.Monto != null ? Number(body.Monto) : null;

    // Saldos: si no nos pasan explícitos, usamos los de origen/destino si existen
    const saldoOriAntes =
      saldo_origen_antes ??
      (origen?.cuentas ? Number(origen.cuentas.saldo_actual) : null);
    const saldoOriDespues =
      saldo_origen_despues != null ? saldo_origen_despues : saldoOriAntes;

    const saldoDesAntes =
      saldo_destino_antes ??
      (destino?.cuentas ? Number(destino.cuentas.saldo_actual) : null);
    const saldoDesDespues =
      saldo_destino_despues != null ? saldo_destino_despues : saldoDesAntes;

    await supabase.from("logs_transacciones").insert({
      id_transaccion: id_transaccion ?? null,
      numero_tarjeta_origen,
      numero_tarjeta_destino,
      nombre_cliente,
      monto,

      resultado,
      motivo_corto,
      campo_error: campo_error ?? null,

      saldo_origen_antes: saldoOriAntes,
      saldo_origen_despues: saldoOriDespues,
      saldo_destino_antes: saldoDesAntes,
      saldo_destino_despues: saldoDesDespues,

      request_json: requestMasked,
      response_json: respuesta,
    });
  } catch (err) {
    console.error("Error al registrar log en logs_transacciones:", err);
  }
}

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
    // Buscar ID de estado RECHAZADA en estados_transaccion
    const { data: edoRow } = await supabase
      .from("estados_transaccion")
      .select("id_estado_transaccion")
      .eq("nombre", "RECHAZADA")
      .single();

    // Por defecto 3 = RECHAZADA (según tu script)
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
// Helper: construir respuesta JSON para RECHAZADA + LOG
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
    NumeroTarjeta: ult4Destino
      ? `**** **** **** ${ult4Destino}`
      : "**** **** **** ****",
    NombreEstado: "RECHAZADA",
    Firma: "NIP",
    Descripcion: mensaje,
  };

  // Determinar resultado del enum
  let resultado: ResultadoTransaccionEnum = "RECHAZADA_DATOS";
  if (mensaje === "Fondos insuficientes") {
    resultado = "RECHAZADA_SALDO";
  }
  if (status >= 500) {
    resultado = "ERROR_INTERNO";
  }

  const campo_error =
    getCampoErrorFromMensaje(mensaje) ?? undefined;

  await registrarLogTransaccion({
    supabase,
    body,
    respuesta,
    resultado,
    motivo_corto: mensaje,
    campo_error,
    id_transaccion: trx?.id_transaccion ?? null,
    origen: origen ?? null,
    destino: destino ?? null,
  });

  return NextResponse.json(respuesta, { status });
}

// ---------------------------------------------------------------------------
// Handler principal POST - TRANSFERENCIA
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const supabase = getSupabaseServer();

  try {
    const body = (await req.json()) as TransaccionRequest;
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
        `
        id_tarjeta,
        id_cuenta,
        numero_tarjeta,
        cvv,
        mes_exp,
        anio_exp,
        fecha_cierre,
        cuentas (
          id_cuenta,
          saldo_actual,
          fecha_cierre,
          clientes (
            id_cliente,
            nombre,
            activo
          )
        )
      `
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
        `
        id_tarjeta,
        id_cuenta,
        numero_tarjeta,
        fecha_cierre,
        cuentas (
          id_cuenta,
          saldo_actual,
          fecha_cierre
        )
      `
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

    const saldoDestinoOriginal = Number(destino.cuentas.saldo_actual);
    const nuevoSaldoOrigen = saldoOrigen - Number(body.Monto);
    const nuevoSaldoDestino =
      saldoDestinoOriginal + Number(body.Monto);

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

    const idEstado = edoRow?.id_estado_transaccion ?? 2; // 2 = COMPLETADA

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
      // rollback de saldos
      await supabase
        .from("cuentas")
        .update({ saldo_actual: saldoOrigen })
        .eq("id_cuenta", origen.cuentas.id_cuenta);
      await supabase
        .from("cuentas")
        .update({ saldo_actual: saldoDestinoOriginal })
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
      NumeroTarjeta: `**** **** **** ${ult4}`,
      NombreEstado: "COMPLETADA",
      Firma: "NIP",
      Descripcion: "Transferencia realizada con éxito",
    };

    // LOG de transacción aprobada
    await registrarLogTransaccion({
      supabase,
      body,
      respuesta,
      resultado: "APROBADA",
      motivo_corto: "Transacción aprobada",
      campo_error: null,
      id_transaccion: trx.id_transaccion,
      origen,
      destino,
      saldo_origen_antes: saldoOrigen,
      saldo_origen_despues: nuevoSaldoOrigen,
      saldo_destino_antes: saldoDestinoOriginal,
      saldo_destino_despues: nuevoSaldoDestino,
    });

    return NextResponse.json(respuesta, { status: 200 });
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error);
    console.error("Error en /api/bank:", error);

    const respuestaError = {
      error: "Error interno del servidor",
      detalle,
    };

    // Log de error interno (cuando algo se fue al catch)
    await registrarLogTransaccion({
      supabase,
      body: undefined,
      respuesta: respuestaError,
      resultado: "ERROR_INTERNO",
      motivo_corto: "Error inesperado en /api/bank",
      campo_error: null,
      id_transaccion: null,
      origen: null,
      destino: null,
    });

    return NextResponse.json(respuestaError, { status: 500 });
  }
}