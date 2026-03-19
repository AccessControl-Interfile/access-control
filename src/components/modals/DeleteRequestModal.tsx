import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Trash2, X } from 'lucide-react';
import { AccessRequest } from '../../types';

interface DeleteRequestModalProps {
  isOpen: boolean;
  request: AccessRequest | null;
  onConfirm: (requestId: string) => void;
  onClose: () => void;
}

export const DeleteRequestModal: React.FC<DeleteRequestModalProps> = ({
  isOpen,
  request,
  onConfirm,
  onClose,
}) => {
  const [confirmNumber, setConfirmNumber] = useState('');

  if (!isOpen || !request) return null;

  const isMatch = confirmNumber === request.requestNumber;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-rose-600">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold">Excluir Solicitação</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">
              Esta ação é irreversível. Todos os dados desta solicitação serão removidos permanentemente.
            </p>
          </div>

          <p className="text-slate-600 mb-6">
            Para confirmar a exclusão, digite o número da requisição <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{request.requestNumber}</span> abaixo:
          </p>
          
          <div className="mb-6">
            <input 
              type="text" 
              value={confirmNumber}
              onChange={(e) => setConfirmNumber(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-center font-mono text-lg tracking-widest"
              placeholder="Digite o número aqui"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                if (isMatch) {
                  onConfirm(request.id);
                  setConfirmNumber('');
                }
              }}
              disabled={!isMatch}
              className="flex-1 px-4 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none"
            >
              Confirmar Exclusão
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
