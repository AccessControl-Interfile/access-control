import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Role } from '../../types';

type ToastType = 'success' | 'error' | 'info';

const UserForm = ({ 
  user, 
  roles, 
  onSave, 
  onCancel, 
  showToast 
}: { 
  user: User | null, 
  roles: Role[], 
  onSave: (data: { name: string, email: string, roleIds: string[] }) => Promise<void>, 
  onCancel: () => void, 
  showToast: (msg: string, type?: ToastType) => void 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    user?.roleIds || (user?.roleId ? [user.roleId] : [])
  );
  
  const handleRoleToggle = (roleId: string) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    if (selectedRoleIds.length === 0) {
      showToast("Selecione pelo menos um perfil para o usuário.", "error");
      setIsSubmitting(false);
      return;
    }

    try {
      await onSave({ name, email, roleIds: selectedRoleIds });
    } catch (error: any) {
      showToast(error.message || "Erro ao salvar usuário.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form key={user?.id || 'new_user'} onSubmit={handleSubmit} className="space-y-6 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome</label>
          <input 
            name="name" 
            defaultValue={user?.name} 
            required 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
          <input 
            name="email" 
            type="email" 
            defaultValue={user?.email} 
            required 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60 font-medium text-slate-700" 
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Perfis Atribuídos</h3>
          <p className="text-sm text-slate-500 mb-2">Selecione um ou mais perfis. A permissão final será o maior nível entre os perfis selecionados.</p>
          <div className="space-y-2">
            {roles.map(role => (
              <label key={role.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedRoleIds.includes(role.id)}
                  onChange={() => handleRoleToggle(role.id)}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-sm font-bold text-slate-700 leading-tight">{role.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 sticky bottom-0 bg-white">
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50">
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
};

interface UserModalProps {
  isAddingUser: boolean;
  editingUser: User | null;
  onClose: () => void;
  roles: Role[];
  handleAddUser: (data: { name: string, email: string, roleIds: string[] }) => Promise<void>;
  showToast: (message: string, type: ToastType) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isAddingUser,
  editingUser,
  onClose,
  roles,
  handleAddUser,
  showToast,
}) => {
  if (!isAddingUser && !editingUser) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-auto max-h-[85vh] flex flex-col"
      >
        <div className="p-8 flex-1 overflow-y-auto flex flex-col">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 shrink-0">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
          <UserForm 
            user={editingUser} 
            roles={roles} 
            onSave={handleAddUser} 
            onCancel={onClose} 
            showToast={showToast}
          />
        </div>
      </motion.div>
    </div>
  );
};
