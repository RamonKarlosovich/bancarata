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
  NumeroAutorizacion: string;
  NombreEstado: string;
  Firma: string;
  Mensaje: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TransaccionRequest;
    const supabase = getSupabaseServer();

    if (
      !body.NumeroTarjetaOrigen ||
      !body.NumeroTarjetaDestino ||
      !body.NombreCliente ||
      !body.MesExp ||
      !body.AnioExp ||
      !body.Cvv ||
      !body.Monto
    ) {
      return NextResponse.json({ Mensaje: "Datos incompletos" }, { status: 400 });
    }

    if (body.NumeroTarjetaOrigen === body.NumeroTarjetaDestino) {
      return NextResponse.json({ Mensaje: "La tarjeta origen y destino no pueden ser la misma" }, { status: 400 });
    }

    if (body.Monto <= 0) {
      return NextResponse.json({ Mensaje: "El monto debe ser mayor a cero" }, { status: 400 });
    }

    const { data: tarjetaOrigen, error: errTO } = await supabase
      .from("tarjetas")
      .select("id_tarjeta,id_cuenta,numero_tarjeta,cvv,mes_exp,anio_exp")
      .eq("numero_tarjeta", body.NumeroTarjetaOrigen)
      .single();

    if (errTO || !tarjetaOrigen) {
      return NextResponse.json({ Mensaje: "Tarjeta origen no encontrada" }, { status: 404 });
    }

    const { data: tarjetaDestino, error: errTD } = await supabase
      .from("tarjetas")
      .select("id_tarjeta,id_cuenta,numero_tarjeta")
      .eq("numero_tarjeta", body.NumeroTarjetaDestino)
      .single();

    if (errTD || !tarjetaDestino) {
      return NextResponse.json({ Mensaje: "Tarjeta destino no encontrada" }, { status: 404 });
    }

    if (String(tarjetaOrigen.cvv) !== String(body.Cvv)) {
      return NextResponse.json({ Mensaje: "CVV inválido" }, { status: 400 });
    }

    if (Number(tarjetaOrigen.mes_exp) !== Number(body.MesExp) || Number(tarjetaOrigen.anio_exp) !== Number(body.AnioExp)) {
      return NextResponse.json({ Mensaje: "Fecha de expiración inválida" }, { status: 400 });
    }

    const { data: cuentaOrigen, error: errCO } = await supabase
      .from("cuentas")
      .select("id_cuenta,id_cliente,saldo_actual")
      .eq("id_cuenta", tarjetaOrigen.id_cuenta)
      .single();

    if (errCO || !cuentaOrigen) {
      return NextResponse.json({ Mensaje: "Cuenta origen no encontrada" }, { status: 404 });
    }

    const { data: cuentaDestino, error: errCD } = await supabase
      .from("cuentas")
      .select("id_cuenta,saldo_actual")
      .eq("id_cuenta", tarjetaDestino.id_cuenta)
      .single();

    if (errCD || !cuentaDestino) {
      return NextResponse.json({ Mensaje: "Cuenta destino no encontrada" }, { status: 404 });
    }

    const { data: cliente, error: errCli } = await supabase
      .from("clientes")
      .select("id_cliente,nombre")
      .eq("id_cliente", cuentaOrigen.id_cliente)
      .single();

    if (errCli || !cliente) {
      return NextResponse.json({ Mensaje: "Cliente de la tarjeta origen no encontrado" }, { status: 404 });
    }

    const normalize = (s: string) => s.trim().toLocaleLowerCase("es-MX");
    if (normalize(cliente.nombre) !== normalize(body.NombreCliente)) {
      return NextResponse.json({ Mensaje: "El nombre no coincide con el titular de la tarjeta" }, { status: 400 });
    }

    const saldoOrigen = Number(cuentaOrigen.saldo_actual);
    if (saldoOrigen < body.Monto) {
      return NextResponse.json({ Mensaje: "Fondos insuficientes" }, { status: 400 });
    }

    const nuevoSaldoOrigen = saldoOrigen - body.Monto;
    const nuevoSaldoDestino = Number(cuentaDestino.saldo_actual) + body.Monto;

    const { error: errDeb } = await supabase
      .from("cuentas")
      .update({ saldo_actual: nuevoSaldoOrigen })
      .eq("id_cuenta", cuentaOrigen.id_cuenta);

    if (errDeb) {
      return NextResponse.json({ Mensaje: "No se pudo debitar la cuenta de origen" }, { status: 500 });
    }

    const { error: errCred } = await supabase
      .from("cuentas")
      .update({ saldo_actual: nuevoSaldoDestino })
      .eq("id_cuenta", cuentaDestino.id_cuenta);

    if (errCred) {
      await supabase.from("cuentas").update({ saldo_actual: saldoOrigen }).eq("id_cuenta", cuentaOrigen.id_cuenta);
      return NextResponse.json({ Mensaje: "No se pudo acreditar la cuenta destino" }, { status: 500 });
    }

    const { data: estadoRow } = await supabase
      .from("estados_transaccion")
      .select("id_estado_transaccion")
      .eq("nombre", "COMPLETADA")
      .single();

    const idEstado = estadoRow?.id_estado_transaccion ?? 2;

    const { data: trxRow, error: errTrx } = await supabase
      .from("transacciones")
      .insert({
        tipo: "TRANSFERENCIA",
        monto: body.Monto,
        id_tarjeta_origen: tarjetaOrigen.id_tarjeta,
        id_tarjeta_destino: tarjetaDestino.id_tarjeta,
        descripcion: "TRANSFERENCIA",
        id_estado_transaccion: idEstado,
      })
      .select("id_transaccion,creada_utc")
      .single();

    if (errTrx || !trxRow) {
      await supabase.from("cuentas").update({ saldo_actual: saldoOrigen }).eq("id_cuenta", cuentaOrigen.id_cuenta);
      await supabase
        .from("cuentas")
        .update({ saldo_actual: Number(cuentaDestino.saldo_actual) })
        .eq("id_cuenta", cuentaDestino.id_cuenta);
      return NextResponse.json({ Mensaje: "No se pudo registrar la transacción" }, { status: 500 });
    }

    const ult4 = String(tarjetaDestino.numero_tarjeta).slice(-4);
    const idBonito = String(trxRow.id_transaccion).padStart(6, "0");

    const respuesta: TransaccionResponse = {
      CreadaUTC: new Date(trxRow.creada_utc).toISOString(),
      IdTransaccion: `TRX-${idBonito}`,
      TipoTransaccion: "Transferencia",
      MontoTransaccion: body.Monto,
      MarcaTarjeta: "BBVA",
      NumeroTarjeta: `**** **** **** ${ult4}`,
      NumeroAutorizacion: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
      NombreEstado: "COMPLETADA",
      Firma: "NIP",
      Mensaje: "Transferencia realizada con éxito",
    };

    return NextResponse.json(respuesta, { status: 200 });
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ Mensaje: "Error interno del servidor", Detalle: detalle }, { status: 500 });
  }
}