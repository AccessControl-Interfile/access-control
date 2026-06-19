import React from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { Users, Monitor, ShieldCheck, Search, Plus, Check, Move, Edit2, Trash2, Key, GripVertical, UserCheck, Bell } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FieldDefinition, Track, User, Role, PERMISSIONS_LABELS, Permission, Supervisor } from '../../types';
import { ref, set } from 'firebase/database';
import { db } from '../../lib/firebase';

const DraggableFieldItem = ({ 
  field, 
  onEdit, 
  onDelete,
  isReordering
}: { 
  field: FieldDefinition; 
  onEdit: (field: FieldDefinition) => void; 
  onDelete: (id: string) => void;
  isReordering: boolean;
  key?: string;
}) => {
  const controls = useDragControls();

  const content = (
    <>
      {isReordering && (
        <div 
          onPointerDown={(e) => controls.start(e)}
          className="text-indigo-400 hover:text-indigo-600 transition-colors cursor-grab active:cursor-grabbing p-1 touch-none"
          title="Arraste para reordenar"
        >
          <GripVertical className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-xs font-bold uppercase mb-0.5",
          isReordering ? "text-indigo-400" : "text-slate-400"
        )}>Campo</p>
        <p className="font-bold text-slate-700 truncate">{field.label}</p>
        <p className="text-xs text-slate-500 truncate">{field.description}</p>
      </div>
      {!isReordering ? (
        <div className="flex gap-1">
          <button 
            onClick={() => onEdit(field)}
            className="p-2 bg-white text-indigo-600 border border-slate-200 rounded-xl shadow-sm hover:bg-indigo-50 transition-all cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(field.id)}
            className="p-2 bg-white text-rose-600 border border-slate-200 rounded-xl shadow-sm hover:bg-rose-50 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="w-8 h-8 flex items-center justify-center text-indigo-300">
          <Move className="w-4 h-4" />
        </div>
      )}
    </>
  );

  if (isReordering) {
    return (
      <Reorder.Item 
        value={field}
        dragListener={false}
        dragControls={controls}
        className="group p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200 flex items-center gap-4 shadow-sm"
      >
        {content}
      </Reorder.Item>
    );
  }

  return (
    <div className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-indigo-200 transition-colors">
      {content}
    </div>
  );
};

interface SettingsTabProps {
  key?: string;
  hasPermission: (permission: Permission) => boolean;
  isReorderingAnalystFields: boolean;
  setIsReorderingAnalystFields: (value: boolean) => void;
  tempAnalystFields: FieldDefinition[];
  setTempAnalystFields: (fields: FieldDefinition[]) => void;
  analystFields: FieldDefinition[];
  setEditingField: (data: { type: 'analyst' | 'system', field: FieldDefinition }) => void;
  deleteField: (type: 'analyst' | 'system', id: string) => void;
  setIsAddingField: (data: { type: 'analyst' | 'system' }) => void;
  isReorderingSystemFields: boolean;
  setIsReorderingSystemFields: (value: boolean) => void;
  tempSystemFields: FieldDefinition[];
  setTempSystemFields: (fields: FieldDefinition[]) => void;
  systemFields: FieldDefinition[];
  tracks: Track[];
  supervisors: Supervisor[];
  setIsAddingTrack: (value: boolean) => void;
  setEditingTrack: (track: Track) => void;
  deleteTrack: (track: Track) => void;
  setIsAddingSupervisor: (value: boolean) => void;
  setEditingSupervisor: (supervisor: Supervisor) => void;
  deleteSupervisor: (supervisor: Supervisor) => void;
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
  onPlayNotification: () => void;
  updateUserNotificationSound: (soundId: string) => void;
  currentUserId: string | undefined;
}

export default function SettingsTab({
  hasPermission,
  isReorderingAnalystFields,
  setIsReorderingAnalystFields,
  tempAnalystFields,
  setTempAnalystFields,
  analystFields,
  setEditingField,
  deleteField,
  setIsAddingField,
  isReorderingSystemFields,
  setIsReorderingSystemFields,
  tempSystemFields,
  setTempSystemFields,
  systemFields,
  tracks,
  supervisors,
  setIsAddingTrack,
  setEditingTrack,
  deleteTrack,
  setIsAddingSupervisor,
  setEditingSupervisor,
  deleteSupervisor,
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
  onPlayNotification,
  updateUserNotificationSound,
  currentUserId
}: SettingsTabProps) {
  const currentUser = users.find(u => u.id === currentUserId);
  const currentSoundId = currentUser?.notificationSound || 'chime';

  const NOTIFICATION_SOUNDS = [
    { id: 'chime', name: 'Sino Clássico' },
    { id: 'success', name: 'Sucesso Moderno' },
    { id: 'alert', name: 'Alerta de Sistema' },
    { id: 'soft', name: 'Suave Zen' },
    { id: 'techno', name: 'Digital Brisk' }
  ];
  return (
    <motion.div 
      key="settings"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {hasPermission('settings_analyst_fields') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Definição de Analista
              </h3>
              <p className="text-sm text-slate-500">Personalize os rótulos e descrições dos campos do analista.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (isReorderingAnalystFields) {
                    set(ref(db, 'config/analystFields'), tempAnalystFields.map(f => ({ id: f.id, label: f.label, description: f.description })));
                  } else {
                    setTempAnalystFields(analystFields);
                  }
                  setIsReorderingAnalystFields(!isReorderingAnalystFields);
                }}
                className={`p-2 rounded-xl transition-all flex items-center gap-2 text-sm font-bold ${
                  isReorderingAnalystFields 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isReorderingAnalystFields ? (
                  <>
                    <Check className="w-4 h-4" />
                    Salvar Ordem
                  </>
                ) : (
                  <>
                    <Move className="w-4 h-4" />
                    Reordenar
                  </>
                )}
              </button>
              {!isReorderingAnalystFields && (
                <button 
                  onClick={() => setIsAddingField({ type: 'analyst' })}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          {isReorderingAnalystFields ? (
            <Reorder.Group 
              axis="y" 
              values={tempAnalystFields} 
              onReorder={setTempAnalystFields}
              className="p-6 space-y-3"
            >
              {tempAnalystFields.map((field) => (
                <DraggableFieldItem 
                  key={field.id}
                  field={field}
                  isReordering={true}
                  onEdit={(f) => setEditingField({ type: 'analyst', field: f })}
                  onDelete={(id) => deleteField('analyst', id)}
                />
              ))}
            </Reorder.Group>
          ) : (
            <div className="p-6 space-y-3">
              {analystFields.map((field) => (
                <DraggableFieldItem 
                  key={field.id}
                  field={field}
                  isReordering={false}
                  onEdit={(f) => setEditingField({ type: 'analyst', field: f })}
                  onDelete={(id) => deleteField('analyst', id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {hasPermission('settings_system_fields') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-600" />
                Definição de Sistema
              </h3>
              <p className="text-sm text-slate-500">Personalize os rótulos e descrições dos campos do sistema.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (isReorderingSystemFields) {
                    set(ref(db, 'config/systemFields'), tempSystemFields.map(f => ({ id: f.id, label: f.label, description: f.description })));
                  } else {
                    setTempSystemFields(systemFields);
                  }
                  setIsReorderingSystemFields(!isReorderingSystemFields);
                }}
                className={`p-2 rounded-xl transition-all flex items-center gap-2 text-sm font-bold ${
                  isReorderingSystemFields 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isReorderingSystemFields ? (
                  <>
                    <Check className="w-4 h-4" />
                    Salvar Ordem
                  </>
                ) : (
                  <>
                    <Move className="w-4 h-4" />
                    Reordenar
                  </>
                )}
              </button>
              {!isReorderingSystemFields && (
                <button 
                  onClick={() => setIsAddingField({ type: 'system' })}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          {isReorderingSystemFields ? (
            <Reorder.Group 
              axis="y" 
              values={tempSystemFields} 
              onReorder={setTempSystemFields}
              className="p-6 space-y-3"
            >
              {tempSystemFields.map((field) => (
                <DraggableFieldItem 
                  key={field.id}
                  field={field}
                  isReordering={true}
                  onEdit={(f) => setEditingField({ type: 'system', field: f })}
                  onDelete={(id) => deleteField('system', id)}
                />
              ))}
            </Reorder.Group>
          ) : (
            <div className="p-6 space-y-3">
              {systemFields.map((field) => (
                <DraggableFieldItem 
                  key={field.id}
                  field={field}
                  isReordering={false}
                  onEdit={(f) => setEditingField({ type: 'system', field: f })}
                  onDelete={(id) => deleteField('system', id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {hasPermission('settings_tracks') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Gestão de Esteiras
              </h3>
              <p className="text-sm text-slate-500">Gerencie as esteiras disponíveis para seleção.</p>
            </div>
            <button 
              onClick={() => setIsAddingTrack(true)}
              className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tracks.map(track => (
                <div key={track.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-sm font-bold text-slate-700 truncate">{track.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => setEditingTrack(track)}
                      className="p-2 bg-white border border-slate-200 text-indigo-600 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                      title="Editar Esteira"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteTrack(track)}
                      className="p-2 bg-white border border-slate-200 text-rose-500 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                      title="Excluir Esteira"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {hasPermission('settings_supervisors') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                Gestão de Supervisores
              </h3>
              <p className="text-sm text-slate-500">Gerencie os supervisores disponíveis para seleção.</p>
            </div>
            <button 
              onClick={() => setIsAddingSupervisor(true)}
              className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {supervisors.map(supervisor => (
                <div key={supervisor.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-700 truncate">{supervisor.name}</span>
                    {supervisor.isUser && (
                      <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">Usuário</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!supervisor.isUser ? (
                      <>
                        <button 
                          onClick={() => setEditingSupervisor(supervisor)}
                          className="p-2 bg-white border border-slate-200 text-indigo-600 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                          title="Editar Supervisor"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteSupervisor(supervisor)}
                          className="p-2 bg-white border border-slate-200 text-rose-500 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                          title="Excluir Supervisor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="p-2 text-slate-300" title="Supervisores vinculados a usuários devem ser editados na Gestão de Usuários">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {supervisors.length === 0 && (
                <p className="col-span-full text-center text-slate-400 py-4">Nenhum supervisor cadastrado.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Management Section */}
      {hasPermission('settings_users') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
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
                    <button 
                        onClick={() => setIsAddingUser(true)}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="p-6">
                <div className="space-y-3">
                    {users
                        .filter(user => 
                            user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                            user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                        )
                        .slice(0, usersLimit)
                        .map(user => {
                        const role = roles.find(r => r.id === user.roleId);
                        return (
                            <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="font-bold text-slate-800">{user.name}</p>
                                    <p className="text-xs text-slate-500">{user.email}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600">
                                        {role?.name || 'Sem Perfil'}
                                    </span>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => resetUserPassword(user.id)}
                                            className="p-2 bg-white border border-slate-200 text-amber-500 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                                            title="Forçar redefinição de senha"
                                        >
                                            <Key className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => { setEditingUser(user); setIsAddingUser(true); }}
                                            className="p-2 bg-white border border-slate-200 text-indigo-600 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                                            title="Editar usuário"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => deleteUser(user.id)}
                                            className="p-2 bg-white border border-slate-200 text-rose-500 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                                            title="Excluir usuário"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {users.length === 0 && (
                        <p className="text-center text-slate-400 py-4">Nenhum usuário cadastrado.</p>
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
                        <div className="flex justify-center mt-4 pt-4 border-t border-slate-100">
                            <button 
                                onClick={() => setUsersLimit(prev => prev + 10)}
                                className="px-6 py-2 bg-slate-50 text-indigo-600 font-bold rounded-full hover:bg-slate-100 transition-colors border border-slate-200"
                            >
                                Carregar mais
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Role Management Section */}
      {hasPermission('settings_roles') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        Perfis de Acesso
                    </h3>
                    <p className="text-sm text-slate-500">Defina as permissões de cada função.</p>
                </div>
                <button 
                    onClick={() => setIsAddingRole(true)}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roles.map(role => (
                        <div key={role.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-slate-800">{role.name}</h4>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => { setEditingRole(role); setIsAddingRole(true); }}
                                        className="p-1.5 bg-white border border-slate-200 text-indigo-600 rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                        onClick={() => deleteRole(role)}
                                        disabled={role.isSystem}
                                        className={`p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm active:scale-95 transition-all ${role.isSystem ? 'text-slate-300 cursor-not-allowed' : 'text-rose-500 cursor-pointer'}`}
                                        title={role.isSystem ? "Perfis de sistema não podem ser excluídos" : "Excluir Perfil"}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {role.permissions.slice(0, 3).map(p => (
                                    <span key={p} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-500 truncate max-w-full">
                                        {PERMISSIONS_LABELS[p]}
                                    </span>
                                ))}
                                {role.permissions.length > 3 && (
                                    <span className="px-2 py-0.5 bg-slate-200 rounded text-[10px] text-slate-600">
                                        +{role.permissions.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Notification Sound Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                <Bell className="w-6 h-6 text-indigo-600" />
                Personalização de Som
              </h3>
              <p className="text-sm text-slate-500">Escolha o som das notificações que deseja ouvir no sistema.</p>
            </div>
            <button 
              onClick={onPlayNotification}
              className="w-full sm:w-auto px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 group"
            >
              <Bell className="w-5 h-5 group-hover:animate-bounce" />
              Testar Som Atual
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {NOTIFICATION_SOUNDS.map(sound => (
              <button
                key={sound.id}
                onClick={() => updateUserNotificationSound(sound.id)}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2",
                  currentSoundId === sound.id
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md shadow-indigo-50"
                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    currentSoundId === sound.id ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    <Check className={cn("w-4 h-4", currentSoundId === sound.id ? "opacity-100" : "opacity-0")} />
                  </div>
                </div>
                <span className="text-sm font-bold">{sound.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
