import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Role, Permission } from '../../types';

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
  onSave: (data: any) => Promise<void>, 
  onCancel: () => void, 
  showToast: (msg: string, type?: ToastType) => void 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const roleId = formData.get('roleId') as string;
    const permissions = formData.getAll('permissions') as Permission[];

    try {
      await onSave({ name, email, roleId, permissions });
    } catch (error: any) {
      showToast(error.message || "Erro ao salvar usuário.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form key={user?.id || 'new_user'} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome</label>
        <input name="name" defaultValue={user?.name} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
        <input name="email" type="email" defaultValue={user?.email} required disabled={!!user} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60" />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Perfil</label>
        <select name="roleId" defaultValue={user?.roleId} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
          <option value="">Selecione um perfil...</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3 pt-4">
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
  handleAddUser: (data: { name: string, email: string, roleId: string, permissions: Permission[] }) => Promise<void>;
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-y-auto"
      >
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
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
