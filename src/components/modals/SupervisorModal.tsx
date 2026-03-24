import React from 'react';
import { motion } from 'framer-motion';
import { ref, set, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { Supervisor, User, Analyst } from '../../types';

interface SupervisorModalProps {
  isAddingSupervisor: boolean;
  editingSupervisor: Supervisor | null;
  onClose: () => void;
  user: User | null;
  analysts: Analyst[];
  logAction: (userEmail: string, action: string, details: string, module: string, previousData?: any, newData?: any) => Promise<void>;
}

export const SupervisorModal: React.FC<SupervisorModalProps> = ({
  isAddingSupervisor,
  editingSupervisor,
  onClose,
  user,
  analysts,
  logAction,
}) => {
  if (!isAddingSupervisor && !editingSupervisor) return null;

  const handleSaveSupervisor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    
    if (editingSupervisor) {
      const oldName = editingSupervisor.name;
      const newData = { name };
      update(ref(db, `supervisors/${editingSupervisor.id}`), newData);
      if (user?.email) {
        logAction(
          user.email, 
          'EDIT_SUPERVISOR', 
          `Editou o supervisor: ${oldName} para ${name}`, 
          'Configurações',
          editingSupervisor,
          { ...editingSupervisor, ...newData }
        );
      }
      // Update analysts supervisor name
      analysts.forEach(a => {
        if (a.supervisor === oldName) {
          update(ref(db, `analysts/${a.id}`), { supervisor: name });
        }
      });
    } else {
      const id = crypto.randomUUID();
      set(ref(db, `supervisors/${id}`), { id, name });
      if (user?.email) {
        logAction(user.email, 'CREATE_SUPERVISOR', `Criou o supervisor: ${name}`, 'Configurações');
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{editingSupervisor ? 'Editar Supervisor' : 'Novo Supervisor'}</h2>
          <p className="text-slate-500 text-sm mb-6">{editingSupervisor ? 'Atualize o nome do supervisor.' : 'Adicione um novo supervisor à operação.'}</p>
          
          <form key={editingSupervisor?.id || 'new_supervisor'} onSubmit={handleSaveSupervisor} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome do Supervisor</label>
              <input 
                name="name" 
                defaultValue={editingSupervisor?.name} 
                required 
                onInput={(e) => { (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.toUpperCase(); }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                placeholder="Ex: João Silva" 
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
              <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Salvar</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
