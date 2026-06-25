import React from 'react';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, Search, Plus, Key, Edit2, Trash2, ShieldAlert, Shield } from 'lucide-react';
import { User, Role, AppModule, AccessLevel, MODULE_LABELS, LEVEL_LABELS } from '../../types';

interface AccessControlTabProps {
  hasPermission: (module: AppModule, level: AccessLevel) => boolean;
  users: User[];
  userSearchQuery: string;
  setUserSearchQuery: (query: string) => void;
  usersLimit: number;
  setUsersLimit: (limit: number | ((prev: number) => number)) => void;
  setIsAddingUser: (value: boolean) => void;
  resetUserPassword: (userId: string) => void;
  setEditingUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  roles: Role[];
  setIsAddingRole: (value: boolean) => void;
  setEditingRole: (role: Role) => void;
  deleteRole: (role: Role) => void;
}

export default function AccessControlTab({
  hasPermission,
  users,
  userSearchQuery,
  setUserSearchQuery,
  usersLimit,
  setUsersLimit,
  setIsAddingUser,
  resetUserPassword,
  setEditingUser,
  deleteUser,
  roles,
  setIsAddingRole,
  setEditingRole,
  deleteRole,
}: AccessControlTabProps) {
  return (
    <motion.div 
      key="access_control"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        
        {/* USERS COLUMN */}
        <div className="flex-1 border-r border-slate-100 flex flex-col">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white sticky top-0 z-10">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Gestão de Usuários
              </h3>
              <p className="text-sm text-slate-500">Controle quem tem acesso ao sistema.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar usuário..." 
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full sm:w-64"
                />
              </div>
              {hasPermission('settings', 'edit') && (
                <button 
                  onClick={() => setIsAddingUser(true)}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          <div className="p-6 flex-1 bg-slate-50/50">
            <div className="space-y-3">
              {users
                .filter(user => 
                  user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                  user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                )
                .slice(0, usersLimit)
                .map(user => {
                  const userRoles = roles.filter(r => user.roleIds?.includes(r.id) || user.roleId === r.id);
                  return (
                    <div key={user.id} className="flex flex-col p-5 bg-white rounded-2xl border border-slate-200 shadow-sm gap-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-800 text-lg">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                        {hasPermission('settings', 'edit') && (
                          <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                            <button 
                              onClick={() => resetUserPassword(user.id)}
                              className="p-2 bg-white text-amber-500 rounded-lg shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
                              title="Forçar redefinição de senha"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => { setEditingUser(user); setIsAddingUser(true); }}
                              className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
                              title="Editar usuário"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteUser(user.id)}
                              className="p-2 bg-white text-rose-500 rounded-lg shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
                              title="Excluir usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {userRoles.length > 0 ? userRoles.map(r => (
                          <span key={r.id} className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-semibold flex items-center gap-1.5">
                            <Shield className="w-3 h-3" />
                            {r.name}
                          </span>
                        )) : (
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-semibold border border-slate-200">
                            Sem Perfil
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              {users.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                  <p className="text-slate-400">Nenhum usuário cadastrado.</p>
                </div>
              )}
              {users.length > 0 && users.filter(user => 
                user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
              ).length === 0 && (
                <p className="text-center text-slate-400 py-4">Nenhum usuário encontrado para a busca.</p>
              )}
              {users.filter(user => 
                user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
              ).length > usersLimit && (
                <div className="flex justify-center mt-4 pt-4">
                  <button 
                    onClick={() => setUsersLimit(prev => prev + 10)}
                    className="px-6 py-2 bg-white text-indigo-600 font-bold rounded-full shadow-sm hover:shadow transition-all border border-slate-200"
                  >
                    Carregar mais
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROLES COLUMN */}
        <div className="flex-1 flex flex-col bg-slate-50/30">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Matriz de Perfis
              </h3>
              <p className="text-sm text-slate-500">Administre os perfis de acesso.</p>
            </div>
            {hasPermission('settings', 'edit') && (
              <button 
                onClick={() => setIsAddingRole(true)}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="p-6 flex-1">
            <div className="grid grid-cols-1 gap-4">
              {roles.map(role => {
                const perms = role.permissions || {} as Record<AppModule, AccessLevel>;
                // Count permissions by level
                const levelCounts = { none: 0, read: 0, edit_approval: 0, edit: 0 };
                Object.values(perms).forEach(level => {
                  if (levelCounts[level as AccessLevel] !== undefined) {
                    levelCounts[level as AccessLevel]++;
                  }
                });

                return (
                  <div key={role.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm relative group flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                          {role.name}
                          {role.isSystem && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded uppercase tracking-wider border border-slate-200">Sistema</span>
                          )}
                        </h4>
                      </div>
                      {hasPermission('settings', 'edit') && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 p-1 rounded-xl border border-slate-100">
                          <button 
                            onClick={() => { setEditingRole(role); setIsAddingRole(true); }}
                            className="p-1.5 bg-white text-indigo-600 rounded-lg shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
                            title="Editar Perfil"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteRole(role)}
                            disabled={role.isSystem}
                            className={`p-1.5 bg-white rounded-lg shadow-sm hover:shadow active:scale-95 transition-all ${role.isSystem ? 'text-slate-300 cursor-not-allowed' : 'text-rose-500 cursor-pointer'}`}
                            title={role.isSystem ? "Perfis de sistema não podem ser excluídos" : "Excluir Perfil"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-slate-100 pt-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Edição Total</span>
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                           <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                           {levelCounts.edit} Módulos
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">C/ Aprovação</span>
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                           <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                           {levelCounts.edit_approval} Módulos
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Leitura</span>
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                           <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                           {levelCounts.read} Módulos
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Oculto</span>
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                           <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                           {levelCounts.none} Módulos
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
