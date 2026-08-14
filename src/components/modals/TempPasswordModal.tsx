import React, { useState } from 'react';
import { Key, Copy, Check, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TempPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  tempPassword: string;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function TempPasswordModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  tempPassword,
  showToast
}: TempPasswordModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    showToast("Senha temporária copiada para a área de transferência!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Senha Temporária Gerada</h3>
                <p className="text-xs text-slate-500 font-medium">Redefinição concluída com sucesso</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <div>
              <p className="text-sm text-slate-600 leading-relaxed">
                A senha de <strong className="text-slate-800 font-semibold">{userName}</strong> ({userEmail}) foi resetada.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Copie a senha abaixo e envie para a pessoa que solicitou a redefinição:
              </p>
            </div>

            {/* Copy box */}
            <div
              onClick={handleCopy}
              className="group relative bg-slate-50 hover:bg-indigo-50/50 border-2 border-dashed border-slate-200 hover:border-indigo-400 p-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer"
              title="Clique para copiar"
            >
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
                  Senha Temporária
                </span>
                <span className="font-mono text-xl font-bold tracking-wider text-slate-800 group-hover:text-indigo-600 select-all">
                  {tempPassword}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-emerald-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar
                  </>
                )}
              </button>
            </div>

            {/* Info alert */}
            <div className="flex items-start gap-3 p-3.5 bg-amber-50/80 border border-amber-200/60 rounded-2xl text-amber-800 text-xs leading-relaxed">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                No próximo acesso, o sistema exigirá que o usuário digite esta senha temporária e em seguida cadastre uma nova senha definitiva.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
