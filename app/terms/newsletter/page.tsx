"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function NewsletterTermsPage() {
  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    const email = sessionStorage.getItem('newsletterEmail')
    setCanGoBack(!!email)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1B2E] via-[#1a2a45] to-[#0F1B2E] px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-[#D4AF37] mb-8">Términos y Condiciones - Newsletter</h1>

        <div className="space-y-6 text-[#F5F1E8]/70">
          <section>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">1. Suscripción a Newsletter</h2>
            <p>
              Al suscribirse a nuestro newsletter, aceptas recibir comunicaciones por correo electrónico de parte de BANCARATA con información sobre productos, servicios, promociones y noticias financieras.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">2. Frecuencia de Envíos</h2>
            <p>
              Los correos se enviarán regularmente, generalmente una o dos veces por semana, dependiendo de la disponibilidad de contenido relevante.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">3. Privacidad del Correo</h2>
            <p>
              Tu correo electrónico será utilizado exclusivamente para enviar contenido del newsletter. No será compartido con terceros sin tu consentimiento.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">4. Desuscripción</h2>
            <p>
              Puedes desuscribirse del newsletter en cualquier momento haciendo clic en el enlace "Desuscribirse" ubicado al final de cada correo. Tu solicitud será procesada dentro de 48 horas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">5. Protección de Datos</h2>
            <p>
              Tu información será protegida conforme a la Ley Federal de Protección de Datos Personales en México. BANCARATA implementa medidas de seguridad estándar en la industria.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">6. Contenido del Newsletter</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Información sobre productos y servicios bancarios</li>
              <li>Tips de educación financiera</li>
              <li>Promociones y ofertas especiales</li>
              <li>Noticias relevantes del sector financiero</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">7. No Spam</h2>
            <p>
              BANCARATA se compromete a no enviar spam. Si recibas correos no deseados, reporta el incidente inmediatamente a dalekmiaw@BancaRata.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">8. Cambios en los Términos</h2>
            <p>
              Estos términos pueden ser modificados en cualquier momento. Notificaremos cambios significativos a través de correo electrónico.
            </p>
          </section>

          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg p-6 mt-8">
            <p className="text-[#F5F1E8]">
              Al suscribirse a nuestro newsletter, confirmas que aceptas estos términos y condiciones.
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
