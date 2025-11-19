# INVERATBANK - Plataforma de Pagos Distribuida

Sistema web integrado que conecta con la API C# de transacciones bancarias para procesar pagos de múltiples servicios en el MALL.

## Estructura

- **`app/page.tsx`** - Página principal
- **`app/login/page.tsx`** - Autenticación
- **`app/payment/page.tsx`** - Interfaz de pago (clientes)
- **`app/admin/dashboard/page.tsx`** - Dashboard administrativo
- **`app/services/dashboard/page.tsx`** - Panel para servicios

## Instalación

\`\`\`bash
npm install
npm run dev
\`\`\`

## Variables de Entorno

Crea un archivo `.env.local`:

\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:5000
BANKING_API_URL=http://localhost:5000
\`\`\`

## Conexión con API C#

La plataforma consume la API C# que desarrollamos anteriormente. Los endpoints principales:

- `POST /api/transacciones/procesar` - Procesar pago
- `GET /api/transacciones` - Listar transacciones
- `POST /api/cuentas` - Crear cuenta
- `GET /api/cuentas/{id}` - Obtener cuenta

## Flujo de Pagos

1. Cliente accede a `/payment`
2. Ingresa datos de pago y servicio
3. Formulario envía a `/api/transactions/process`
4. API Next.js forwarded a C# Banking API
5. C# valida, procesa y devuelve estado
6. Resultado se muestra al cliente

## Sincronización Real

El dashboard admin se actualiza cada 5 segundos con nuevas transacciones vía polling. Se puede mejorar con WebSockets si es necesario.
