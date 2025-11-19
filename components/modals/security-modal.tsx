"use client"

import { X, Lock, Shield, Database } from 'lucide-react'

interface SecurityModalProps {
  onClose: () => void
}

export default function SecurityModal({ onClose }: SecurityModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0F1B2E] border border-[#D4AF37]/30 rounded-lg max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#D4AF37]/20">
          <h2 className="text-2xl font-bold text-[#D4AF37]">Seguridad</h2>
          <button onClick={onClose} className="text-[#F5F1E8]/70 hover:text-[#F5F1E8]">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          <p className="text-[#F5F1E8]/70">
            En BANCARATA, la seguridad de tus datos y dinero es nuestra prioridad máxima. Te explicamos cómo protegemos tu información:
          </p>

          {/* Protección de Datos */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/20">
            <Database className="text-[#D4AF37] flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="font-semibold text-[#D4AF37] text-sm mb-2">Protección de Datos</p>
              <ul className="text-[#F5F1E8]/70 text-sm space-y-1">
                <li>• Encriptación SSL/TLS de 256 bits en todas las transacciones</li>
                <li>• Cumplimiento con normas internacionales PCI-DSS</li>
                <li>• Almacenamiento seguro en servidores certificados</li>
                <li>• Backups automáticos diarios de tu información</li>
              </ul>
            </div>
          </div>

          {/* Protección Financiera */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/20">
            <Lock className="text-[#D4AF37] flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="font-semibold text-[#D4AF37] text-sm mb-2">Protección del Dinero</p>
              <ul className="text-[#F5F1E8]/70 text-sm space-y-1">
                <li>• Autenticación multifactor para acceso a cuentas</li>
                <li>• Limitación de transacciones sospechosas en tiempo real</li>
                <li>• Fondos de garantía para depósitos</li>
                <li>• Monitoreo 24/7 de actividad fraudulenta</li>
              </ul>
            </div>
          </div>

          {/* Medidas Adicionales */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-[#1a2a45] border border-[#D4AF37]/20">
            <Shield className="text-[#D4AF37] flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="font-semibold text-[#D4AF37] text-sm mb-2">Medidas de Seguridad Adicionales</p>
              <ul className="text-[#F5F1E8]/70 text-sm space-y-1">
                <li>• Verificación de identidad con documentos oficiales</li>
                <li>• Sistema de alertas para movimientos en tu cuenta</li>
                <li>• Tokens dinámicos para mayor autenticación</li>
                <li>• Auditoría externa semestral de seguridad</li>
              </ul>
            </div>
          </div>

          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg p-4">
            <p className="text-[#F5F1E8]/70 text-sm">
              Si tienes dudas sobre seguridad o sospechas de actividad fraudulenta, contacta inmediatamente a nuestro equipo de seguridad a través de los canales de ayuda.
            </p>
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
