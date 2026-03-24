import React from 'react';
import { motion } from 'framer-motion';
import { Role, PERMISSIONS_LABELS, Permission } from '../../types';

interface RoleModalProps {
  isAddingRole: boolean;
  editingRole: Role | null;
  onClose: () => void;
  handleAddRole: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const RoleModal: React.FC<RoleModalProps> = ({
  isAddingRole,
  editingRole,
  onClose,
  handleAddRole,
}) => {
  if (!isAddingRole && !editingRole) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-y-auto"
      >
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{editingRole ? 'Editar Perfil' : 'Novo Perfil'}</h2>
          <form key={editingRole?.id || 'new_role'} onSubmit={handleAddRole} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome do Perfil</label>
              <input 
                name="name" 
                defaultValue={editingRole?.name} 
                required 
                onInput={(e) => { (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.toUpperCase(); }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Permissões</h3>
              {Object.entries(PERMISSIONS_LABELS).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox" 
                    name="permissions" 
                    value={key} 
                    defaultChecked={editingRole?.permissions?.includes(key as Permission)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </label>
              ))}
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
