"use client"

import { useState, useEffect } from "react"
import { X } from 'lucide-react'

interface NewsletterModalProps {
  onClose: () => void
}

export default function NewsletterModal({ onClose }: NewsletterModalProps) {
  const [email, setEmail] = useState("")
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const savedEmail = sessionStorage.getItem('newsletterEmail')
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem('newsletterEmail', email)
  }, [email])

  useEffect(() => {
    const checkEmail = async () => {
      if (!email) return
      try {
        const response = await fetch('/api/newsletter/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const data = await response.json()
        setIsAlreadySubscribed(data.isAlreadySubscribed)
      } catch (err) {
        console.error('Error checking email:', err)
      }
    }

    checkEmail()
  }, [email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!aceptaTerminos) {
      setError("Debes aceptar los términos y condiciones")
      return
    }

    if (isAlreadySubscribed) {
      setError("Este correo ya está registrado en nuestro newsletter")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error('Error al suscribirse')
      }

      sessionStorage.removeItem('newsletterEmail')
      setSubmitted(true)
      setTimeout(() => {
        onClose()
        setSubmitted(false)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  if (showTerms) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-[#0F1B2E] border border-[#D4AF37]/30 rounded-lg max-w-2xl w-full my-8">
          <div className="flex justify-between items-center p-6 border-b border-[#D4AF37]/20">
            <h2 className="text-2xl font-bold text-[#D4AF37]">Términos y Condiciones del Boletín</h2>
            <button onClick={() => setShowTerms(false)} className="text-[#F5F1E8]/70 hover:text-[#F5F1E8]">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 text-[#F5F1E8]/70">
            <section>
              <h3 className="text-lg font-bold text-[#D4AF37] mb-2">1. Suscripción al Boletín</h3>
              <p className="text-sm">
                Al suscribirse a nuestro boletín, usted acepta recibir comunicaciones periódicas sobre noticias, promociones y actualizaciones de BANCARATA.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#D4AF37] mb-2">2. Frecuencia de Envíos</h3>
              <p className="text-sm">
                El boletín se enviará semanalmente o según lo determine BANCARATA. Usted puede cambiar la frecuencia en su perfil.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#D4AF37] mb-2">3. Privacidad</h3>
              <p className="text-sm">
                Su correo electrónico será protegido y nunca será compartido con terceros. BANCARATA se compromete a respetar su privacidad.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#D4AF37] mb-2">4. Cancelación</h3>
              <p className="text-sm">
                Puede cancelar su suscripción en cualquier momento haciendo clic en el enlace de desuscripción en el boletín.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#D4AF37] mb-2">5. Contenido</h3>
              <p className="text-sm">
                El contenido del boletín puede incluir promociones, noticias bancarias, educación financiera y actualizaciones de servicios.
              </p>
            </section>
          </div>

          <div className="p-6 border-t border-[#D4AF37]/20">
            <button
              onClick={() => setShowTerms(false)}
              className="w-full px-6 py-3 rounded-lg bg-[#D4AF37] text-[#0F1B2E] font-bold hover:bg-[#c99a2e] transition"
            >
              Volver al Registro
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#0F1B2E] border border-[#D4AF37]/30 rounded-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500 mx-auto flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-2">Suscripción Confirmada</h2>
            <p className="text-[#F5F1E8]/70">Te has suscrito exitosamente a nuestro boletín. Recibirás noticias y promociones en tu correo electrónico.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0F1B2E] border border-[#D4AF37]/30 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#D4AF37]/20">
          <h2 className="text-2xl font-bold text-[#D4AF37]">Boletín</h2>
          <button onClick={onClose} className="text-[#F5F1E8]/70 hover:text-[#F5F1E8]">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-[#F5F1E8]/70 mb-6">
            Suscríbete a nuestro boletín y recibe las últimas noticias, promociones y actualizaciones bancarias.
          </p>

          {isAlreadySubscribed && (
            <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              Este correo ya está registrado en nuestro boletín.
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#D4AF37] mb-2">Correo Electrónico *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37] placeholder-[#F5F1E8]/30"
                required
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
                className="w-4 h-4 rounded mt-1"
                required
              />
              <span className="text-[#F5F1E8] text-sm">
                Acepto los{" "}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-[#D4AF37] hover:underline"
                >
                  términos y condiciones
                </button>{" "}
                del boletín
              </span>
            </label>

            <button
              type="submit"
              disabled={isAlreadySubscribed || loading}
              className="w-full px-6 py-3 rounded-lg bg-[#D4AF37] text-[#0F1B2E] font-bold hover:bg-[#c99a2e] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Procesando..." : "Suscribirse"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}