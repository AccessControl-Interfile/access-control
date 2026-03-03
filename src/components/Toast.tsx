import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose, duration = 2000 }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          className={cn(
            "fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border min-w-[300px] max-w-md",
            type === 'success' && "bg-emerald-50 border-emerald-100 text-emerald-800",
            type === 'error' && "bg-rose-50 border-rose-100 text-rose-800",
            type === 'info' && "bg-indigo-50 border-indigo-100 text-indigo-800"
          )}
        >
          <div className={cn(
            "p-1.5 rounded-lg",
            type === 'success' && "bg-emerald-100 text-emerald-600",
            type === 'error' && "bg-rose-100 text-rose-600",
            type === 'info' && "bg-indigo-100 text-indigo-600"
          )}>
            {type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {type === 'error' && <AlertCircle className="w-5 h-5" />}
            {type === 'info' && <AlertCircle className="w-5 h-5" />}
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-bold leading-tight">{message}</p>
          </div>

          <button 
            onClick={onClose}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 opacity-50" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
