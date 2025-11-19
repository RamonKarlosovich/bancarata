"use client"

import { X, Phone, Mail, Clock } from 'lucide-react'

interface HelpModalProps {
  onClose: () => void
}

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0F1B2E] border border-[#D4AF37]/30 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#D4AF37]/20">
          <h2 className="text-2xl font-bold text-[#D4AF37]">Centro de Ayuda</h2>
          <button onClick={onClose} className="text-[#F5F1E8]/70 hover:text-[#F5F1E8]">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <p className="text-[#F5F1E8]/70">
            ¿Necesitas ayuda? Nuestro equipo de soporte está disponible para ti.
          </p>

          {/* Teléfono */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/20">
            <Phone className="text-[#D4AF37] flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="font-semibold text-[#D4AF37] text-sm mb-1">Teléfono</p>
              <p className="text-[#F5F1E8]">+52 662 530 7360</p>
              <p className="text-[#F5F1E8]/50 text-xs mt-2">Disponible 24/7</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/20">
            <Mail className="text-[#D4AF37] flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="font-semibold text-[#D4AF37] text-sm mb-1">Correo Electrónico</p>
              <p className="text-[#F5F1E8]">dalekmiaw@BancaRata.com</p>
              <p className="text-[#F5F1E8]/50 text-xs mt-2">Respuesta en menos de 2 horas</p>
            </div>
          </div>

          {/* Horario */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/20">
            <Clock className="text-[#D4AF37] flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="font-semibold text-[#D4AF37] text-sm mb-1">Horario de Atención</p>
              <p className="text-[#F5F1E8]">24 horas, 7 días a la semana</p>
              <p className="text-[#F5F1E8]/50 text-xs mt-2">Incluyendo festivos</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full px-6 py-3 rounded-lg bg-[#D4AF37] text-[#0F1B2E] font-bold hover:bg-[#c99a2e] transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
