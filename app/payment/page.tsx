"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Copy, Menu, X, Wallet, Mail, HelpCircle, Shield } from 'lucide-react'
import AccountModal from "@/components/modals/account-modal"
import NewsletterModal from "@/components/modals/newsletter-modal"
import HelpModal from "@/components/modals/help-modal"
import SecurityModal from "@/components/modals/security-modal"

type PaymentStatus = "idle" | "processing" | "success" | "error"

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<PaymentStatus>("idle")
  const [showCopyMessage, setShowCopyMessage] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)

  const serviceName = searchParams.get("service") || "Servicio"
  const amount = searchParams.get("amount") || "0.00"
  const description = searchParams.get("description") || serviceName
  const returnUrl = searchParams.get("returnUrl") || "/"

  const [formData, setFormData] = useState({
    nombreTitular: "",
    numeroTarjeta: "",
    numeroDocumento: "",
    vencimiento: "",
    cvv: "",
    email: "",
    telefono: "",
    tokenDinamico: "",
    usarToken: false,
  })

  const [errorMsg, setErrorMsg] = useState("")
  const [transactionId, setTransactionId] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("processing")
    setErrorMsg("")

    try {
      const response = await fetch("/api/transactions/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto: Number.parseFloat(amount),
          nombreTitular: formData.nombreTitular,
          numeroTarjeta: formData.numeroTarjeta.replace(/\s/g, ""),
          numeroDocumento: formData.numeroDocumento,
          vencimiento: formData.vencimiento,
          cvv: formData.cvv,
          email: formData.email,
          telefono: formData.telefono,
          tokenDinamico: formData.tokenDinamico,
          usarToken: formData.usarToken,
          concepto: description,
          servicio: serviceName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error procesando pago")
      }

      setStatus("success")
      setTransactionId(data.transactionId)

      setTimeout(() => {
        window.location.href = returnUrl
      }, 3000)
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido")
    }
  }

  const copyTransactionId = () => {
    navigator.clipboard.writeText(transactionId)
    setShowCopyMessage(true)
    setTimeout(() => setShowCopyMessage(false), 2000)
  }

  const handleMenuClick = (modal: string) => {
    setActiveModal(modal)
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1B2E] via-[#1a2a45] to-[#0F1B2E] flex flex-col">
      <nav className="border-b border-[#D4AF37]/20 py-4 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="flex-shrink-0 -ml-8 w-24 h-20 overflow-hidden rounded-full opacity-95">
            <Image src="/logo.png" alt="BANCARATA" width={120} height={120} className="mix-blend-screen" />
          </div>

          <div className="absolute left-1/2 transform -translate-x-1/2">
            <span className="text-[#D4AF37] font-bold text-2xl">BANCARATA</span>
          </div>

          {/* Hamburger menu on right */}
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
                      <p className="font-semibold text-sm">Newsletter</p>
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
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="md:col-span-2">
            <div className="bg-[#0F1B2E]/50 backdrop-blur border border-[#D4AF37]/30 rounded-lg p-8">
              <h1 className="text-3xl font-bold text-[#D4AF37] mb-2">Realizar Pago</h1>
              <p className="text-[#F5F1E8]/70 mb-8">Ingresa tus datos de pago de forma segura</p>

              {status === "success" && (
                <div className="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-500/50 flex gap-3 items-start">
                  <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h3 className="font-bold text-green-300">Pago Exitoso</h3>
                    <p className="text-green-200 text-sm mb-2">ID Transacción: {transactionId}</p>
                    <button
                      onClick={copyTransactionId}
                      className="flex items-center gap-2 text-green-300 hover:text-green-200 text-sm"
                    >
                      <Copy size={16} /> Copiar ID
                    </button>
                    {showCopyMessage && <p className="text-xs text-green-200 mt-1">Copiado al portapapeles</p>}
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 flex gap-3 items-start">
                  <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-red-300">Error en la Transacción</h3>
                    <p className="text-red-200 text-sm">{errorMsg}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">Información del Cliente</h3>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-[#D4AF37] mb-2">Nombre del Titular *</label>
                      <input
                        type="text"
                        name="nombreTitular"
                        value={formData.nombreTitular}
                        onChange={handleChange}
                        placeholder="Juan Pérez García"
                        className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37] placeholder-[#F5F1E8]/30"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#D4AF37] mb-2">Número de Documento (INE/RFC) *</label>
                      <input
                        type="text"
                        name="numeroDocumento"
                        value={formData.numeroDocumento}
                        onChange={handleChange}
                        placeholder="123.456.789-0"
                        className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37] placeholder-[#F5F1E8]/30"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#D4AF37] mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="juan@example.com"
                        className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37] placeholder-[#F5F1E8]/30"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#D4AF37] mb-2">Teléfono *</label>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="+52 662 530 7360"
                        className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37] placeholder-[#F5F1E8]/30"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Card Details */}
                <div className="border-t border-[#D4AF37]/20 pt-6">
                  <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">Datos de Pago</h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#D4AF37] mb-2">Número de Tarjeta o Cuenta *</label>
                    <input
                      type="text"
                      name="numeroTarjeta"
                      value={formData.numeroTarjeta}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 16)
                        const formatted = value.replace(/(\d{4})/g, "$1 ").trim()
                        setFormData((prev) => ({ ...prev, numeroTarjeta: formatted }))
                      }}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37] placeholder-[#F5F1E8]/30 font-mono"
                      required={!formData.usarToken}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-[#D4AF37] mb-2">Vencimiento (MM/YY) *</label>
                      <input
                        type="text"
                        name="vencimiento"
                        value={formData.vencimiento}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, "")
                          if (value.length >= 2) {
                            value = value.slice(0, 2) + "/" + value.slice(2, 4)
                          }
                          setFormData((prev) => ({ ...prev, vencimiento: value }))
                        }}
                        placeholder="MM/YY"
                        className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37] placeholder-[#F5F1E8]/30"
                        required={!formData.usarToken}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#D4AF37] mb-2">CVV o Token Dinámico *</label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 3)
                          setFormData((prev) => ({ ...prev, cvv: value }))
                        }}
                        placeholder="123"
                        className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37] placeholder-[#F5F1E8]/30 font-mono"
                        required={!formData.usarToken}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/20">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="usarToken"
                        checked={formData.usarToken}
                        onChange={handleChange}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-[#F5F1E8]">Usar Token Dinámico</span>
                    </label>
                    {formData.usarToken && (
                      <input
                        type="text"
                        name="tokenDinamico"
                        value={formData.tokenDinamico}
                        onChange={handleChange}
                        placeholder="Token de autenticación"
                        className="w-full mt-3 px-4 py-2 rounded-lg bg-[#0F1B2E] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37] placeholder-[#F5F1E8]/30"
                        required
                      />
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === "processing"}
                  className="w-full px-6 py-3 rounded-lg bg-[#D4AF37] text-[#0F1B2E] font-bold hover:bg-[#c99a2e] disabled:opacity-50 transition"
                >
                  {status === "processing" ? "Procesando..." : `Pagar $${amount}`}
                </button>
              </form>

              <div className="mt-6 p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                <p className="text-xs text-[#F5F1E8]/70">
                  ✓ Tus datos están protegidos con encriptación SSL de nivel bancario. ✓ Transacción segura y verificada por BANCARATA.
                </p>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div>
            <div className="bg-[#0F1B2E]/50 backdrop-blur border border-[#D4AF37]/30 rounded-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-[#D4AF37] mb-6">Resumen de Pago</h2>

              <div className="space-y-4 pb-6 border-b border-[#D4AF37]/20">
                <div>
                  <span className="text-[#F5F1E8]/70 text-sm">Servicio:</span>
                  <p className="text-[#F5F1E8] font-semibold">{serviceName}</p>
                </div>
                <div>
                  <span className="text-[#F5F1E8]/70 text-sm">Concepto:</span>
                  <p className="text-[#F5F1E8] font-semibold">{description}</p>
                </div>
                <div>
                  <span className="text-[#F5F1E8]/70 text-sm">Total a Pagar:</span>
                  <p className="text-[#D4AF37] font-bold text-2xl">${amount}</p>
                </div>
              </div>

              <div className="mt-6 space-y-2 text-xs text-[#F5F1E8]/70">
                <p>✓ Pago instantáneo</p>
                <p>✓ Confirmación inmediata</p>
                <p>✓ Comprobante por email</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D4AF37]/20 mt-12 py-8 bg-[#0a0e1a]/80">
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
