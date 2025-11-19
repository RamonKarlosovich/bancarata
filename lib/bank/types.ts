// lib/bank/types.ts

// Lo que LOS OTROS SERVICIOS le mandan al banco
export interface TransaccionRequest {
    NombreComercio: string;
  
    NumeroTarjetaOrigen: string;
    NumeroTarjetaDestino: string;
  
    NombreCliente: string;
    MesExp: number;
    AnioExp: number;
    Cvv: string;
  
    Monto: number;
    Moneda: string;
  }
  
  // Lo que el BANCO les regresa a los otros servicios
  export interface TransaccionResponse {
    NombreComercio: string;
    CreadaUTC: string;
  
    IdTransaccion: string;
    TipoTransaccion: string;
  
    MontoTransaccion: number;
    Moneda: string;
  
    MarcaTarjeta: string;
    NumeroTarjeta: string;
    NumeroAutorizacion: string;
  
    NombreEstado: string;
    Firma: string;
  
    Mensaje: string;
  }  

  export interface TransaccionRequest {
    // 👇 NUEVO CAMPO
    IdempotenciaId?: string;  // opcional; si no lo mandan, lo generamos nosotros
  
    NombreComercio: string;
  
    NumeroTarjetaOrigen: string;
    NumeroTarjetaDestino: string;
  
    NombreCliente: string;
    MesExp: number;
    AnioExp: number;
    Cvv: string;
  
    Monto: number;
    Moneda: string;
  }