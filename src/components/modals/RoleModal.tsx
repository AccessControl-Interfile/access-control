import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Role, AppModule, AccessLevel, MODULE_LABELS, LEVEL_LABELS, MODULE_GROUPS, MODULE_AVAILABLE_LEVELS } from '../../types';

interface RoleModalProps {
  isAddingRole: boolean;
  editingRole: Role | null;
  onClose: () => void;
  handleAddRole: (e: React.FormEvent<HTMLFormElement>, rolePermissions: Record<AppModule, AccessLevel>) => void;
}

const LEVELS: AccessLevel[] = ['none', 'read', 'edit_approval', 'edit'];

export const RoleModal: React.FC<RoleModalProps> = ({
  isAddingRole,
  editingRole,
  onClose,
  handleAddRole
}) => {
  const defaultPerms = React.useMemo(() => {
    const acc: Partial<Record<AppModule, AccessLevel>> = {};
    MODULE_GROUPS.forEach(group => {
      group.modules.forEach(m => {
        acc[m as AppModule] = 'none';
      });
    });
    return acc as Record<AppModule, AccessLevel>;
  }, []);

  const [rolePermissions, setRolePermissions] = useState<Record<AppModule, AccessLevel>>({
    ...defaultPerms,
    ...(editingRole?.permissions || {})
  });

  React.useEffect(() => {
    if (editingRole) {
      setRolePermissions({ ...defaultPerms, ...editingRole.permissions });
    } else {
      setRolePermissions(defaultPerms);
    }
  }, [editingRole, defaultPerms]);

  if (!isAddingRole && !editingRole) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-2xl font-bold text-slate-800">
            {editingRole ? 'Editar Perfil de Acesso' : 'Novo Perfil de Acesso'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            ✕
          </button>
        </div>

        <form 
          onSubmit={(e) => handleAddRole(e, rolePermissions)} 
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
            <div className="mb-8">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome do Perfil</label>
              <input 
                name="name" 
                defaultValue={editingRole?.name} 
                required 
                disabled={editingRole?.isSystem}
                className="w-full max-w-md px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 disabled:opacity-50" 
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Matriz de Permissões</h3>
              
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr>
                      <th className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-slate-600 w-48 sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0]">Módulo</th>
                      {LEVELS.map(level => (
                        <th key={level} className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-slate-600 text-center w-32">
                          {LEVEL_LABELS[level]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULE_GROUPS.map((group) => {
                      const showHeader = group.name === 'Extrair Bases' || group.name === 'Configurações';
                      return (
                      <React.Fragment key={group.name}>
                        {showHeader && (
                          <tr className="bg-slate-100">
                             <td colSpan={LEVELS.length + 1} className="p-2 border-b border-slate-200 font-bold text-slate-800 sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                               {group.name}
                             </td>
                          </tr>
                        )}
                        {group.modules.map((module) => {
                          const m = module as AppModule;
                          const availableLevels = MODULE_AVAILABLE_LEVELS[m] || LEVELS;
                          const isSubItem = showHeader || (group.modules.length > 1 && group.modules[0] !== m);
                          
                          return (
                            <tr key={m} className="hover:bg-slate-50/50 transition-colors group">
                              <td className={`p-4 border-b border-slate-100 font-medium text-slate-700 bg-white group-hover:bg-slate-50/50 sticky left-0 z-10 shadow-[1px_0_0_0_#f1f5f9] ${isSubItem ? 'pl-8 text-sm' : ''}`}>
                                {isSubItem && <span className="text-slate-300 mr-2">└</span>}
                                {MODULE_LABELS[m]}
                              </td>
                              {LEVELS.map(level => (
                                <td key={level} className="p-4 border-b border-slate-100 text-center">
                                  {availableLevels.includes(level) ? (
                                    <label className="flex items-center justify-center cursor-pointer w-full h-full p-2">
                                      <input
                                        type="radio"
                                        name={`perm_${m}`}
                                        checked={rolePermissions[m] === level}
                                        onChange={() => setRolePermissions(prev => ({ ...prev, [m]: level }))}
                                        className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                                      />
                                    </label>
                                  ) : (
                                    <span className="text-slate-200 block text-center">-</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    )})}
                  </tbody>
                </table>
              </div>
              {editingRole?.isSystem && (
                <p className="text-sm text-slate-500 mt-2">
                  * O nome dos perfis do sistema não pode ser alterado, e eles não podem ser excluídos. Suas permissões podem ser modificadas.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 p-6 border-t border-slate-200 bg-white shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              Salvar Perfil
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
