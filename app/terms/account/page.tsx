"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function AccountTermsPage() {
  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    const formData = sessionStorage.getItem('accountFormData')
    setCanGoBack(!!formData)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1B2E] via-[#1a2a45] to-[#0F1B2E] px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-[#D4AF37] mb-8">Términos y Condiciones - Solicitud de Cuenta</h1>

        <div className="space-y-6 text-[#F5F1E8]/70">
          <section>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">1. Requisitos para Solicitar una Cuenta</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Ser mayor de edad (18 años o más)</li>
              <li>Ser residente de México</li>
              <li>Contar con documento de identificación oficial vigente (INE)</li>
              <li>Proporcionar información personal veraz y completa</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">2. Proceso de Validación</h2>
            <p>
              BANCARATA se reserva el derecho de validar toda la información proporcionada. El proceso de aprobación puede tomar hasta 48 horas hábiles. Nos comunicaremos contigo a través del correo electrónico o teléfono proporcionado.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">3. Rechazo de Solicitud</h2>
            <p>
              BANCARATA puede rechazar una solicitud si identifica información incompleta, fraudulenta o si no cumple con los requisitos regulatorios. En caso de rechazo, se notificará al solicitante con los motivos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">4. Responsabilidades del Titular</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Mantener la confidencialidad de credenciales de acceso</li>
              <li>Reportar actividades sospechosas inmediatamente</li>
              <li>Actualizar información personal cuando sea necesario</li>
              <li>Cumplir con todas las leyes y regulaciones aplicables</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">5. Comisiones y Cargos</h2>
            <p>
              BANCARATA puede cobrar comisiones por servicios prestados según lo establecido en el tarificador vigente. Cualquier cambio en comisiones será notificado con anticipación.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">6. Privacidad y Protección de Datos</h2>
            <p>
              Tus datos personales serán tratados de conformidad con la Ley Federal de Protección de Datos Personales. BANCARATA se compromete a mantener la confidencialidad de tu información.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">7. Terminación de Cuenta</h2>
            <p>
              BANCARATA se reserva el derecho de cerrar una cuenta si se detecta fraude, uso indebido o incumplimiento de estos términos. Se notificará al usuario con anticipación cuando sea posible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">8. Modificaciones</h2>
            <p>
              BANCARATA puede modificar estos términos en cualquier momento. Los cambios serán comunicados a través de correo electrónico o disponibles en nuestro sitio web.
            </p>
          </section>

          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg p-6 mt-8">
            <p className="text-[#F5F1E8]">
              Al solicitar una cuenta en BANCARATA, confirmas que has leído, entendido y aceptas estos términos y condiciones.
            </p>
          </div>

          <div className="flex gap-4 mt-8">
            {canGoBack ? (
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 rounded-lg bg-[#D4AF37] text-[#0F1B2E] font-bold hover:bg-[#c99a2e] transition"
              >
                Volver al Registro
              </button>
            ) : (
              <Link href="/" className="inline-block px-6 py-3 rounded-lg bg-[#D4AF37] text-[#0F1B2E] font-bold hover:bg-[#c99a2e] transition">
                Volver
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
