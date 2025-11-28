// app/admin/transactions/page.tsx
import AdminTransactionsDashboard from "../dashboard/transactions-dashboard";

export const dynamic = "force-dynamic";

export default function AdminTransactionsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <h1 className="text-2xl font-bold mb-2">Historial de Transacciones</h1>
      <p className="text-sm text-slate-300 mb-6">
        Panel administrativo para monitorear todas las transacciones del sistema.
      </p>
      <AdminTransactionsDashboard />
    </main>
  );
}
