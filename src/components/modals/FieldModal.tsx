import React from 'react';
import { motion } from 'framer-motion';
import { ref, set } from 'firebase/database';
import { db } from '../../lib/firebase';
import { FieldDefinition, Permission, User } from '../../types';

interface FieldModalProps {
  isAddingField: { type: 'analyst' | 'system' } | null;
  editingField: { type: 'analyst' | 'system', field: FieldDefinition } | null;
  onClose: () => void;
  analystFields: FieldDefinition[];
  systemFields: FieldDefinition[];
  hasPermission: (permission: Permission) => boolean;
  user: User | null;
  logAction: (userEmail: string, action: string, details: string, module: string, previousData?: any, newData?: any) => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const FieldModal: React.FC<FieldModalProps> = ({
  isAddingField,
  editingField,
  onClose,
  analystFields,
  systemFields,
  hasPermission,
  user,
  logAction,
  showToast,
}) => {
  if (!isAddingField && !editingField) return null;

  const handleAddField = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isAddingField?.type === 'analyst' && !hasPermission('settings_analyst_fields')) return;
    if (isAddingField?.type === 'system' && !hasPermission('settings_system_fields')) return;

    const formData = new FormData(e.currentTarget);
    const id = formData.get('id') as string;
    const label = formData.get('label') as string;
    const description = formData.get('description') as string;

    const reservedAnalystIds = ['id', 'name', 'email', 'track', 'createdAt', 'deactivatedAt', 'approvedBy', 'approvedByName'];
    const reservedSystemIds = ['id', 'name', 'description'];

    if (isAddingField?.type === 'analyst' && reservedAnalystIds.includes(id)) {
      showToast("Este ID é reservado pelo sistema. Escolha outro.", "error");
      return;
    }
    if (isAddingField?.type === 'system' && reservedSystemIds.includes(id)) {
      showToast("Este ID é reservado pelo sistema. Escolha outro.", "error");
      return;
    }

    if (isAddingField?.type === 'analyst' && analystFields.some(f => f.id === id)) {
      showToast("Já existe um campo com este ID.", "error");
      return;
    }
    if (isAddingField?.type === 'system' && systemFields.some(f => f.id === id)) {
      showToast("Já existe um campo com este ID.", "error");
      return;
    }

    if (isAddingField?.type === 'analyst') {
      const newFields = [...analystFields, { id, label, description }];
      set(ref(db, 'config/analystFields'), newFields);
      if (user?.email) {
        logAction(user.email, 'ADD_ANALYST_FIELD', `Adicionou campo de analista: ${label}`, 'Configurações');
      }
    } else if (isAddingField?.type === 'system') {
      const newFields = [...systemFields, { id, label, description }];
      set(ref(db, 'config/systemFields'), newFields);
      if (user?.email) {
        logAction(user.email, 'ADD_SYSTEM_FIELD', `Adicionou campo de sistema: ${label}`, 'Configurações');
      }
    }
    onClose();
  };

  const handleEditField = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingField) return;
    
    const formData = new FormData(e.currentTarget);
    const label = formData.get('label') as string;
    const description = formData.get('description') as string;
    
    if (editingField.type === 'analyst') {
      const updated = analystFields.map(f => f.id === editingField.field.id ? { ...f, label, description } : f);
      set(ref(db, 'config/analystFields'), updated);
    } else {
      const updated = systemFields.map(f => f.id === editingField.field.id ? { ...f, label, description } : f);
      set(ref(db, 'config/systemFields'), updated);
    }
    onClose();
  };

  if (isAddingField) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[70vh] overflow-y-auto"
        >
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Novo Campo</h2>
            <p className="text-slate-500 text-sm mb-6">Adicione um novo campo personalizado.</p>
            
            <form key={isAddingField.type || 'new_field'} onSubmit={handleAddField} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ID do Campo</label>
                <input name="id" required pattern="[a-z0-9_]+" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="ex: data_nascimento (apenas letras minúsculas e _)" />
                <p className="text-[10px] text-slate-400 mt-1">Usado internamente. Não pode ser alterado depois.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rótulo (Label)</label>
                <input name="label" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Ex: Data de Nascimento" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descrição</label>
                <input name="description" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Ex: Data de nascimento do colaborador" />
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
  }

  if (editingField) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Editar Campo</h2>
            <p className="text-slate-500 text-sm mb-6">Altere o rótulo e a descrição do campo.</p>
            
            <form key={editingField.field.id || 'edit_field'} onSubmit={handleEditField} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rótulo (Label)</label>
                <input name="label" defaultValue={editingField.field.label} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descrição</label>
                <input name="description" defaultValue={editingField.field.description} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
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
  }

  return null;
};
