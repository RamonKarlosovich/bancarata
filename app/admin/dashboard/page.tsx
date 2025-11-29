"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import AdminTransactionsDashboard from "./transactions-dashboard";

export default function AdminDashboardPage() {
  const router = useRouter();

  const handleLogout = () => {
    // Limpia token en navegador
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth-token");
    }

    // Borra cookie del token
    document.cookie = "auth-token=; Max-Age=0; path=/";

    // Regresa a la página principal (NO al login)
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#0F1B2E] via-[#1a2a45] to-[#0F1B2E] text-[#F5F1E8]">
      {/* Header fijo arriba */}
      <header className="sticky top-0 z-40 border-b border-[#D4AF37]/30 bg-[#0F1B2E]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="BANCARATA" width={40} height={40} />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-[#D4AF37]">
                Panel Administrativo
              </p>
              <p className="text-xs text-[#F5F1E8]/70">
                Monitoreo de transacciones del sistema
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
          >
            <LogOut size={18} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Contenido (el dashboard real) */}
      <main className="flex-1">
        <AdminTransactionsDashboard />
      </main>
    </div>
  );
}
