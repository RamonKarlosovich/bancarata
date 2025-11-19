"use client"

import { useState, useEffect } from "react"
import { X } from 'lucide-react'

interface AccountModalProps {
  onClose: () => void
}

export default function AccountModal({ onClose }: AccountModalProps) {
  const [formData, setFormData] = useState({
    nombreCompleto: "",
    calle: "",
    numero: "",
    colonia: "",
    codigoPostal: "",
    ciudad: "Ciudad de México",
    estado: "Ciudad de México",
    numeroINE: "",
    aceptaTerminos: false,
  })

  const [showTerms, setShowTerms] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const savedFormData = sessionStorage.getItem('accountFormData')
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData))
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem('accountFormData', JSON.stringify(formData))
  }, [formData])

  useEffect(() => {
    const checkPendingRequests = async () => {
      try {
        const response = await fetch('/api/accounts/check-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numeroINE: formData.numeroINE }),
        })
        const data = await response.json()
        setHasPendingRequest(data.hasPendingRequest)
      } catch (err) {
        console.error('Error checking requests:', err)
      }
    }

    if (formData.numeroINE) {
      checkPendingRequests()
    }
  }, [formData.numeroINE])

  const estados = [
    "Ciudad de México",
    "Aguascalientes",
    "Baja California",
    "Baja California Sur",
    "Campeche",
    "Chiapas",
    "Chihuahua",
    "Coahuila",
    "Colima",
    "Durango",
    "Guanajuato",
    "Guerrero",
    "Hidalgo",
    "Jalisco",
    "México",
    "Michoacán",
    "Morelos",
    "Nayarit",
    "Nuevo León",
    "Oaxaca",
    "Puebla",
    "Querétaro",
    "Quintana Roo",
    "San Luis Potosí",
    "Sinaloa",
    "Sonora",
    "Tabasco",
    "Tamaulipas",
    "Tlaxcala",
    "Veracruz",
    "Yucatán",
    "Zacatecas",
  ]

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target
    const { name, value } = target
    const isCheckbox =
      target instanceof HTMLInputElement && target.type === "checkbox"
  
    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.aceptaTerminos) {
      setError("Debes aceptar los términos y condiciones")
      return
    }

    if (hasPendingRequest) {
      setError("Ya tienes una solicitud pendiente de aprobación")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/accounts/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Error al enviar solicitud')
      }

      sessionStorage.removeItem('accountFormData')
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
            <h2 className="text-2xl font-bold text-[#D4AF37]">Términos y Condiciones</h2>
            <button onClick={() => setShowTerms(false)} className="text-[#F5F1E8]/70 hover:text-[#F5F1E8]">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 text-[#F5F1E8]/70">
            <section>
              <h3 className="text-lg font-bold text-[#D4AF37] mb-2">1. Requisitos para Solicitar una Cuenta</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Ser mayor de edad (18 años o más)</li>
                <li>Ser residente de México</li>
                <li>Contar con documento de identificación oficial vigente (INE)</li>
                <li>Proporcionar información personal veraz y completa</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#D4AF37] mb-2">2. Proceso de Validación</h3>
              <p className="text-sm">
                BANCARATA se reserva el derecho de validar toda la información proporcionada. El proceso de aprobación puede tomar hasta 48 horas hábiles.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#D4AF37] mb-2">3. Rechazo de Solicitud</h3>
              <p className="text-sm">
                BANCARATA puede rechazar una solicitud si identifica información incompleta, fraudulenta o si no cumple con los requisitos regulatorios.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#D4AF37] mb-2">4. Responsabilidades del Titular</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Mantener la confidencialidad de credenciales de acceso</li>
                <li>Reportar actividades sospechosas inmediatamente</li>
                <li>Actualizar información personal cuando sea necesario</li>
                <li>Cumplir con todas las leyes y regulaciones aplicables</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#D4AF37] mb-2">5. Protección de Datos</h3>
              <p className="text-sm">
                Tus datos personales serán tratados de conformidad con la Ley Federal de Protección de Datos Personales. BANCARATA se compromete a mantener confidencialidad.
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
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-2">Solicitud Enviada</h2>
            <p className="text-[#F5F1E8]/70">Tu solicitud de cuenta ha sido registrada correctamente. Nuestro equipo revisará tu solicitud en las próximas 24 horas.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0F1B2E] border border-[#D4AF37]/30 rounded-lg max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#D4AF37]/20">
          <h2 className="text-2xl font-bold text-[#D4AF37]">Solicitar una Cuenta</h2>
          <button onClick={onClose} className="text-[#F5F1E8]/70 hover:text-[#F5F1E8]">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {hasPendingRequest && (
            <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              No puedes solicitar una nueva cuenta mientras tengas solicitudes pendientes de aprobación.
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ... existing form fields ... */}
            <div>
              <label className="block text-sm font-medium text-[#D4AF37] mb-2">Nombre Completo *</label>
              <input
                type="text"
                name="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={handleChange}
                placeholder="Juan Pérez García"
                className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37] placeholder-[#F5F1E8]/30"
                required
              />
            </div>

            <div className="border-t border-[#D4AF37]/20 pt-4">
              <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">Dirección</h3>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#D4AF37] mb-2">Calle *</label>
                  <input
                    type="text"
                    name="calle"
                    value={formData.calle}
                    onChange={handleChange}
                    placeholder="Calle Principal"
                    className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37] placeholder-[#F5F1E8]/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#D4AF37] mb-2">Número *</label>
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    placeholder="123"
                    className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37] placeholder-[#F5F1E8]/30"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#D4AF37] mb-2">Colonia *</label>
                  <input
                    type="text"
                    name="colonia"
                    value={formData.colonia}
                    onChange={handleChange}
                    placeholder="Centro"
                    className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37] placeholder-[#F5F1E8]/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#D4AF37] mb-2">Código Postal *</label>
                  <input
                    type="text"
                    name="codigoPostal"
                    value={formData.codigoPostal}
                    onChange={handleChange}
                    placeholder="06500"
                    className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37] placeholder-[#F5F1E8]/30"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#D4AF37] mb-2">Ciudad *</label>
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    placeholder="Ciudad de México"
                    className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37] placeholder-[#F5F1E8]/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#D4AF37] mb-2">Estado *</label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37]"
                    required
                  >
                    {estados.map((estado) => (
                      <option key={estado} value={estado} className="bg-[#1a2a45] text-[#F5F1E8]">
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#D4AF37] mb-2">Número de INE *</label>
              <input
                type="text"
                name="numeroINE"
                value={formData.numeroINE}
                onChange={handleChange}
                placeholder="123456789ABC"
                className="w-full px-4 py-2 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/30 text-[#F5F1E8] focus:outline-none focus:border-[#D4AF37] placeholder-[#F5F1E8]/30"
                required
              />
            </div>

            <div className="border-t border-[#D4AF37]/20 pt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="aceptaTerminos"
                  checked={formData.aceptaTerminos}
                  onChange={handleChange}
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
                  para solicitar una cuenta
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={hasPendingRequest || loading}
              className="w-full px-6 py-3 rounded-lg bg-[#D4AF37] text-[#0F1B2E] font-bold hover:bg-[#c99a2e] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Procesando..." : "Solicitar Cuenta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}