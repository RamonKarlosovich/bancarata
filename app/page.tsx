"use client"

import Image from "next/image"
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { Menu, X, Wallet, Mail, HelpCircle, Shield } from 'lucide-react'
import AccountModal from "@/components/modals/account-modal"
import NewsletterModal from "@/components/modals/newsletter-modal"
import HelpModal from "@/components/modals/help-modal"
import SecurityModal from "@/components/modals/security-modal"

export default function HomePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)

  useEffect(() => {
    const service = searchParams.get("service")
    if (service) {
      router.push("/payment")
    }
  }, [searchParams, router])

  const handleMenuClick = (modal: string) => {
    setActiveModal(modal)
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1B2E] via-[#1a2a45] to-[#0F1B2E] flex flex-col">
      {/* Navigation */}
      <nav className="backdrop-blur-md border-b border-[#D4AF37]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto w-full px-6 py-4 flex justify-between items-center">
          <div className="flex-shrink-0 -ml-8 w-24 h-20 overflow-hidden rounded-full opacity-95">
            <Image src="/logo.png" alt="BANCARATA" width={120} height={120} className="mix-blend-screen" />
          </div>

          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
            <span className="text-[#D4AF37] font-bold text-2xl">BANCARATA</span>
          </div>

          <div className="flex-shrink-0 relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-[#D4AF37] p-2 hover:bg-[#D4AF37]/10 rounded-lg transition"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0F1B2E] border border-[#D4AF37]/30 rounded-lg shadow-lg overflow-hidden z-50">
                <div className="p-4 space-y-2">
                  <button
                    onClick={() => handleMenuClick("account")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#D4AF37]/10 text-[#F5F1E8] transition"
                  >
                    <Wallet size={18} />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Abrir una Cuenta</p>
                      <p className="text-xs text-[#F5F1E8]/70">Solicita tu cuenta bancaria</p>
                    </div>
                  </button>

                  <div className="border-t border-[#D4AF37]/20"></div>

                  <button
                    onClick={() => handleMenuClick("newsletter")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#D4AF37]/10 text-[#F5F1E8] transition"
                  >
                    <Mail size={18} />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Boletin</p>
                      <p className="text-xs text-[#F5F1E8]/70">Noticias y promociones</p>
                    </div>
                  </button>

                  <div className="border-t border-[#D4AF37]/20"></div>

                  <button
                    onClick={() => handleMenuClick("help")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#D4AF37]/10 text-[#F5F1E8] transition"
                  >
                    <HelpCircle size={18} />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Centro de Ayuda</p>
                      <p className="text-xs text-[#F5F1E8]/70">Soporte 24/7</p>
                    </div>
                  </button>

                  <div className="border-t border-[#D4AF37]/20"></div>

                  <button
                    onClick={() => handleMenuClick("security")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#D4AF37]/10 text-[#F5F1E8] transition"
                  >
                    <Shield size={18} />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Seguridad</p>
                      <p className="text-xs text-[#F5F1E8]/70">Protección de datos</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#F5F1E8] mb-2">Portal de Pagos</h1>
            <p className="text-[#D4AF37]">Sistema Bancario Integrado</p>
          </div>

          <div className="p-8 rounded-lg border border-[#D4AF37]/30 bg-[#0F1B2E]/50 backdrop-blur">
            <p className="text-[#F5F1E8]/70 text-center">
              Accede a través del portal del servicio que deseas usar para realizar tu pago de forma segura y rápida.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D4AF37]/20 mt-auto py-8 bg-[#0a0e1a]/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <h4 className="text-[#D4AF37] font-bold mb-2">BANCARATA</h4>
              <p className="text-[#F5F1E8]/70 text-sm">Global Financial Trust</p>
              <p className="text-[#F5F1E8]/50 text-xs mt-1">Sistema de Pagos Integrado</p>
            </div>

            <div className="text-center">
              <h4 className="text-[#D4AF37] font-bold mb-2">Contacto</h4>
              <p className="text-[#F5F1E8]/70 text-sm">+52 662 530 7360</p>
              <p className="text-[#F5F1E8]/70 text-sm">dalekmiaw@BancaRata.com</p>
              <p className="text-[#F5F1E8]/50 text-xs mt-1">Soporte 24/7</p>
            </div>

            <div className="text-center">
              <h4 className="text-[#D4AF37] font-bold mb-2">Regulación Bancaria</h4>
              <p className="text-[#F5F1E8]/70 text-sm">Lic. #BR2025-0125</p>
              <p className="text-[#F5F1E8]/70 text-sm">RFC: BCRT250101ABC</p>
              <p className="text-[#F5F1E8]/50 text-xs mt-1">SWIFT: BANCARATAMX</p>
            </div>
          </div>

          <div className="border-t border-[#D4AF37]/20 pt-6">
            <div className="text-center text-[#F5F1E8]/70 mb-4">
              <p className="text-sm font-semibold mb-2">BANCARATA © 2025 - Global Financial Trust</p>
              <p className="text-xs">Transacciones Seguras | Encriptación de Nivel Bancario | Cumplimiento PCI-DSS</p>
            </div>

            <div className="text-center text-[#F5F1E8]/50 text-xs space-y-1">
              <p>Dirección: Avenida Reforma 505, Piso 15 | Ciudad de México, México</p>
              <p>Horario de Atención: Lunes a Viernes 8:00 AM - 6:00 PM | Emergencias: +52 662 530 7360</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {activeModal === "account" && <AccountModal onClose={() => setActiveModal(null)} />}
      {activeModal === "newsletter" && <NewsletterModal onClose={() => setActiveModal(null)} />}
      {activeModal === "help" && <HelpModal onClose={() => setActiveModal(null)} />}
      {activeModal === "security" && <SecurityModal onClose={() => setActiveModal(null)} />}
    </div>
  )
}