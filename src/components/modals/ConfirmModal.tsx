import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmColor: string;
  onConfirm: (password?: string) => void;
  onClose: () => void;
  requirePassword?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  confirmColor,
  onConfirm,
  onClose,
  requirePassword,
}) => {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-600 mb-6">{message}</p>
          
          {requirePassword && (
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Sua Senha Atual
              </label>
              <div className="relative">
                <ShieldCheck className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Digite sua senha para confirmar"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button 
              onClick={() => {
                setPassword('');
                onClose();
              }}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                onConfirm(requirePassword ? password : undefined);
                setPassword('');
              }}
              disabled={requirePassword && !password}
              className={`flex-1 px-4 py-3 text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50 ${confirmColor} hover:opacity-90`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
