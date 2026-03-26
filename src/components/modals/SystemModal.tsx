import React from 'react';
import { motion } from 'framer-motion';
import { ref, set, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { System, FieldDefinition, User } from '../../types';

interface SystemModalProps {
  isOpen: boolean;
  editingSystem: System | null;
  onClose: () => void;
  systemFields: FieldDefinition[];
  canManageSystems: boolean;
  user: User | null;
  logAction: (userEmail: string, action: string, details: string, module: string, previousData?: any, newData?: any) => Promise<void>;
}

export const SystemModal: React.FC<SystemModalProps> = ({
  isOpen,
  editingSystem,
  onClose,
  systemFields,
  canManageSystems,
  user,
  logAction,
}) => {
  if (!isOpen) return null;

  const handleAddSystem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canManageSystems) return;
    const formData = new FormData(e.currentTarget);
    
    const systemData: any = {};
    systemFields.forEach(field => {
      const value = formData.get(field.id) as string;
      if (field.textCase === 'uppercase') {
        systemData[field.id] = value.toUpperCase();
      } else if (field.textCase === 'lowercase') {
        systemData[field.id] = value.toLowerCase();
      } else {
        systemData[field.id] = value;
      }
    });

    if (editingSystem) {
      update(ref(db, `systems/${editingSystem.id}`), systemData);
      if (user?.email) {
        logAction(
          user.email, 
          'EDIT_SYSTEM', 
          `Editou o sistema: ${systemData.name || editingSystem.name}`, 
          'Sistemas',
          editingSystem,
          { ...editingSystem, ...systemData }
        );
      }
    } else {
      const id = crypto.randomUUID();
      set(ref(db, `systems/${id}`), { ...systemData, id });
      if (user?.email) {
        logAction(user.email, 'CREATE_SYSTEM', `Criou o sistema: ${systemData.name}`, 'Sistemas');
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[70vh] overflow-y-auto"
      >
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{editingSystem ? 'Editar Sistema' : 'Novo Sistema'}</h2>
          <p className="text-slate-500 text-sm mb-6">{editingSystem ? 'Atualize os dados do sistema.' : 'Adicione uma nova ferramenta ao catálogo da operação.'}</p>
          
          <form onSubmit={handleAddSystem} key={editingSystem?.id || 'new_system'} className="space-y-4">
            {systemFields.map(field => {
              if (field.id === 'name') {
                return (
                  <div key={field.id}>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      {field.label}
                    </label>
                    <input 
                      name="name" 
                      defaultValue={editingSystem?.name} 
                      required 
                      onInput={(e) => {
                        const input = e.target as HTMLInputElement;
                        if (field.textCase === 'uppercase') input.value = input.value.toUpperCase();
                        else if (field.textCase === 'lowercase') input.value = input.value.toLowerCase();
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                      placeholder="Ex: Salesforce" 
                    />
                  </div>
                );
              }
              if (field.id === 'description') {
                return (
                  <div key={field.id}>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      {field.label}
                    </label>
                    <textarea 
                      name="description" 
                      defaultValue={editingSystem?.description} 
                      required 
                      rows={3} 
                      onInput={(e) => {
                        const input = e.target as HTMLTextAreaElement;
                        if (field.textCase === 'uppercase') input.value = input.value.toUpperCase();
                        else if (field.textCase === 'lowercase') input.value = input.value.toLowerCase();
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                      placeholder="Para que serve este sistema?" 
                    />
                  </div>
                );
              }
              // Fallback for custom fields
              if (field.options && field.options.length > 0) {
                return (
                  <div key={field.id}>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      {field.label}
                    </label>
                    <select 
                      name={field.id} 
                      defaultValue={editingSystem?.[field.id] || ''} 
                      required 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="">Selecione uma opção...</option>
                      {field.options.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                );
              }

              return (
                <div key={field.id}>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    {field.label}
                  </label>
                  <input 
                    name={field.id} 
                    defaultValue={editingSystem?.[field.id] || ''} 
                    autoComplete="new-password"
                    required
                    onInput={(e) => {
                      const input = e.target as HTMLInputElement;
                      if (field.textCase === 'uppercase') input.value = input.value.toUpperCase();
                      else if (field.textCase === 'lowercase') input.value = input.value.toLowerCase();
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                    placeholder={field.description}
                  />
                </div>
              );
            })}
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
