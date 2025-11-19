// Lo que LOS OTROS SERVICIOS le mandan al banco
export interface TransaccionRequest {
  NumeroTarjetaOrigen: string;
  NumeroTarjetaDestino: string;

  NombreCliente: string;
  MesExp: number;
  AnioExp: number;
  Cvv: string;

  Monto: number;

  // Campo opcional (si se quiere usar para idempotencia)
  IdempotenciaId?: string;
}

// Lo que el BANCO les regresa a los otros servicios
export interface TransaccionResponse {
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
