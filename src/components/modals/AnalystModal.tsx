import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Check, Monitor } from 'lucide-react';
import { ref, set, update, remove } from 'firebase/database';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { Analyst, FieldDefinition, Track, System, Access, User, Supervisor, AccessRequest, AppModule, AccessLevel } from '../../types';

interface AnalystModalProps {
  isOpen: boolean;
  editingAnalyst: Analyst | null;
  onClose: () => void;
  analystFields: FieldDefinition[];
  tracks: Track[];
  supervisors: Supervisor[];
  systems: System[];
  accesses: Access[];
  hasPermission: (module: AppModule, level: AccessLevel) => boolean;
  canManageAnalysts: boolean;
  canManageAccess: boolean;
  user: User | null;
  logAction: (userEmail: string, action: string, details: string, module: string, previousData?: any, newData?: any) => Promise<void>;
  getAnalystDisplayName: (analyst: Analyst) => string;
  getAnalystTrack: (analyst: Analyst) => string;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const applyFieldRestrictions = (
  input: HTMLInputElement, 
  field: { 
    typeRestriction?: 'all' | 'letters_only' | 'numbers_only', 
    allowAccents?: boolean, 
    allowSpecialChars?: boolean, 
    allowSpecialLetters?: boolean, 
    textCase?: 'uppercase' | 'lowercase' | 'any' 
  }
) => {
  let val = input.value;

  if (field.allowSpecialLetters === false) {
    // Remove non-standard letters like ç, ñ, ß, æ, œ
    val = val.replace(/[çÇñÑßæÆœŒ]/g, '');
  }

  if (field.allowAccents === false) {
    val = val.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  if (field.typeRestriction === 'letters_only') {
    val = val.replace(/[0-9]/g, '');
  } else if (field.typeRestriction === 'numbers_only') {
    val = val.replace(/[^0-9]/g, '');
  }

  if (field.allowSpecialChars === false) {
    val = val.replace(/[^\p{L}\p{N}\s]/gu, '');
  }

  if (field.textCase === 'uppercase') val = val.toUpperCase();
  else if (field.textCase === 'lowercase') val = val.toLowerCase();

  input.value = val;
};

export const AnalystModal: React.FC<AnalystModalProps> = ({
  isOpen,
  editingAnalyst,
  onClose,
  analystFields,
  tracks,
  supervisors,
  systems,
  accesses,
  hasPermission,
  canManageAnalysts,
  canManageAccess,
  user,
  logAction,
  getAnalystDisplayName,
  getAnalystTrack,
  showToast,
}) => {
  const [selectedSystemsInForm, setSelectedSystemsInForm] = useState<string[]>([]);
  const [systemSearchQueries, setSystemSearchQueries] = useState<Record<string, string>>({});

  const [hasChanges, setHasChanges] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const initialSystems = React.useMemo(() => {
    if (!editingAnalyst) return [];
    return accesses
      .filter(a => a.analystId === editingAnalyst.id)
      .map(a => a.systemId)
      .sort();
  }, [editingAnalyst, accesses]);

  const checkChanges = () => {
    if (!editingAnalyst) {
      setHasChanges(true);
      return;
    }

    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    
    let changed = false;

    // Check analyst fields
    for (const field of analystFields) {
      const currentValue = (formData.get(field.id) as string || '').trim();
      const initialValue = (editingAnalyst[field.id] || '').trim();
      if (currentValue !== initialValue) {
        changed = true;
        break;
      }
    }

    // Check name and email specifically if they are not in analystFields
    if (!changed) {
      const currentName = (formData.get('name') as string || '').trim();
      const initialName = (editingAnalyst.name || '').trim();
      if (currentName !== initialName) changed = true;
    }

    if (!changed) {
      const currentEmail = (formData.get('email') as string || '').trim();
      const initialEmail = (editingAnalyst.email || '').trim();
      if (currentEmail !== initialEmail) changed = true;
    }

    // Check systems
    if (!changed) {
      const currentSystems = [...selectedSystemsInForm].sort();
      const initialSystemsSorted = [...initialSystems].sort();
      if (JSON.stringify(currentSystems) !== JSON.stringify(initialSystemsSorted)) {
        changed = true;
      }
    }

    setHasChanges(changed);
  };

  useEffect(() => {
    if (editingAnalyst && isOpen) {
      const currentSystems = accesses
        .filter(a => a.analystId === editingAnalyst.id)
        .map(a => a.systemId);
      setSelectedSystemsInForm(currentSystems);
      setHasChanges(false);
    } else if (isOpen) {
      setSelectedSystemsInForm([]);
      setHasChanges(true);
    }
  }, [isOpen, editingAnalyst, accesses]);

  // Re-check changes when selected systems change
  useEffect(() => {
    if (isOpen && editingAnalyst) {
      checkChanges();
    }
  }, [selectedSystemsInForm]);

  const systemsByCompany = React.useMemo(() => {
    const groups: Record<string, System[]> = {};
    if (!Array.isArray(systems)) return groups;
    
    systems.forEach(system => {
      if (!system || typeof system !== 'object') return;
      const company = (system.empresa || 'Outros').toString();
      if (!groups[company]) groups[company] = [];
      groups[company].push(system);
    });

    const sortedGroups: Record<string, System[]> = {};
    Object.keys(groups).sort().forEach(key => {
      sortedGroups[key] = groups[key].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    });
    return sortedGroups;
  }, [systems]);

  if (!isOpen) return null;

  const isEditing = !!editingAnalyst;
  const canDirectlyEdit = hasPermission('analysts_edit', 'edit');
  const canRequestEdit = hasPermission('analysts_edit', 'edit_approval');
  const canDirectlyCreate = hasPermission('analysts_new', 'edit');
  const canRequestCreate = hasPermission('analysts_new', 'edit_approval');
  
  const canEdit = isEditing 
    ? (canDirectlyEdit || canRequestEdit)
    : (canDirectlyCreate || canRequestCreate);
  const needsApproval = isEditing 
    ? (canRequestEdit && !canDirectlyEdit)
    : (canRequestCreate && !canDirectlyCreate);

  const handleAddAnalyst = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit && !hasPermission('analysts_manage_access', 'edit') && !hasPermission('analysts_manage_access', 'edit_approval')) return;
    const formData = new FormData(e.currentTarget);
    
    const analystData: any = {};

    analystFields.forEach(field => {
      const value = formData.get(field.id) as string;
      if (field.textCase === 'uppercase') {
        analystData[field.id] = value.toUpperCase();
      } else if (field.textCase === 'lowercase') {
        analystData[field.id] = value.toLowerCase();
      } else {
        analystData[field.id] = value;
      }
    });

    let analystId = editingAnalyst?.id;

    if (editingAnalyst) {
      if (editingAnalyst.deactivatedAt) {
        showToast("Este analista está desligado e não pode ser editado.", "error");
        return;
      }

      // Check if analyst fields changed
      const analystFieldsChanged = analystFields.some(field => {
        const value = (analystData[field.id] || '').trim();
        const initialValue = (editingAnalyst[field.id] || '').trim();
        return value !== initialValue;
      }) || (analystData.name || '').trim() !== (editingAnalyst.name || '').trim() || (analystData.email || '').trim() !== (editingAnalyst.email || '').trim();

      if (needsApproval && analystFieldsChanged) {
        const requestId = Math.random().toString(36).substring(2, 15);
        const requestNumber = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
        
        const requestData: AccessRequest = {
          id: requestId,
          requestNumber,
          type: 'edit_analyst',
          status: 'pending',
          requestedBy: user?.id || '',
          requestedByName: user?.name || user?.email || 'Supervisor/Treinador',
          requestedAt: new Date().toISOString(),
          analystData: { ...editingAnalyst, ...analystData },
          previousAnalystData: editingAnalyst
        };

        await set(ref(db, `requests/${requestId}`), requestData);
        if (user?.email) {
          await logAction(
            user.email, 
            'CREATE_REQUEST', 
            `Solicitou edição de dados do analista: ${getAnalystDisplayName(editingAnalyst)}`, 
            'Solicitações',
            editingAnalyst,
            requestData
          );
        }
        showToast(`Solicitação de edição (${requestNumber}) enviada para aprovação.`, "success");
      } else if (canDirectlyEdit && analystFieldsChanged) {
        await update(ref(db, `analysts/${editingAnalyst.id}`), analystData);
        if (user?.email) {
          await logAction(
            user.email, 
            'EDIT_ANALYST', 
            `Editou dados do analista: ${getAnalystDisplayName(analystData) || getAnalystDisplayName(editingAnalyst)}`, 
            'Analistas',
            editingAnalyst,
            { ...editingAnalyst, ...analystData }
          );
        }
        showToast("Analista atualizado com sucesso!", "success");
      }
    } else {
      if (needsApproval) {
        const requestId = Math.random().toString(36).substring(2, 15);
        const requestNumber = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
        const requestData: AccessRequest = {
          id: requestId,
          requestNumber,
          type: 'new_analyst',
          status: 'pending',
          requestedBy: user?.id || '',
          requestedByName: user?.name || user?.email || 'Usuário',
          requestedAt: new Date().toISOString(),
          analystData: analystData,
          systemIds: selectedSystemsInForm
        };

        await set(ref(db, `requests/${requestId}`), requestData);
        if (user?.email) {
          await logAction(
            user.email,
            'CREATE_REQUEST',
            `Solicitou criação do novo analista: ${getAnalystDisplayName(analystData)}`,
            'Solicitações',
            null,
            requestData
          );
        }
        showToast(`Solicitação de novo analista (${requestNumber}) enviada para aprovação.`, "success");
        onClose();
        return;
      } else if (canDirectlyCreate) {
        analystId = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        await set(ref(db, `analysts/${analystId}`), { ...analystData, id: analystId, createdAt });
        if (user?.email) {
          await logAction(user.email, 'CREATE_ANALYST', `Criou analista: ${getAnalystDisplayName(analystData)}`, 'Analistas');
        }
        showToast("Analista criado com sucesso!", "success");
      }
    }

    // Update Accesses - "gerenciar sistemas não precisa gerar requisição"
    if (analystId) {
      const currentAccesses = accesses.filter(a => a.analystId === analystId);
      const currentSystemIds = currentAccesses.map(a => a.systemId);

      // Add new accesses
      for (const systemId of selectedSystemsInForm) {
        if (!currentSystemIds.includes(systemId)) {
          await set(ref(db, `accesses/${analystId}_${systemId}`), {
            analystId,
            systemId,
            status: 'Pendente',
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Remove unselected accesses
      for (const access of currentAccesses) {
        if (!selectedSystemsInForm.includes(access.systemId)) {
          await remove(ref(db, `accesses/${analystId}_${access.systemId}`));
        }
      }

      // If only systems changed and we are a supervisor/trainer, show success
      if (editingAnalyst && needsApproval && !analystFields.some(f => analystData[f.id] !== (editingAnalyst[f.id] || ''))) {
        const currentSystems = [...selectedSystemsInForm].sort();
        if (JSON.stringify(currentSystems) !== JSON.stringify(initialSystems)) {
          showToast("Acessos atualizados com sucesso!", "success");
        }
      }
    }

    onClose();
    setSelectedSystemsInForm([]);
    setSystemSearchQueries({});
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-[95vw] h-[95vh] flex flex-col overflow-hidden"
      >
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">{editingAnalyst ? 'Editar Analista' : 'Novo Analista'}</h2>
            <p className="text-slate-500 text-sm">{editingAnalyst ? 'Atualize os dados do analista.' : 'Cadastre um novo membro na equipe de operação.'}</p>
          </div>
          <button 
            onClick={() => {
              onClose();
              setSystemSearchQueries({});
            }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <form 
            id="analyst-form" 
            ref={formRef}
            key={editingAnalyst?.id || 'new_analyst'} 
            onSubmit={handleAddAnalyst} 
            onChange={checkChanges}
            className="space-y-8"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Dados do Analista</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analystFields.map(field => {
                  let fieldContent = null;

                  if (field.options && field.options.length > 0) {
                    fieldContent = (
                      <select 
                        name={field.id} 
                        defaultValue={editingAnalyst?.[field.id] || ''} 
                        required 
                        disabled={!canEdit} 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60"
                      >
                        <option value="">Selecione uma opção...</option>
                        {field.options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    );
                  } else if (field.id === 'name') {
                    fieldContent = (
                      <input 
                        name="name" 
                        defaultValue={editingAnalyst?.name} 
                        required 
                        disabled={!canEdit} 
                        onInput={(e) => {
                          const input = e.target as HTMLInputElement;
                          applyFieldRestrictions(input, {
                            ...field,
                            allowAccents: false,
                            allowSpecialLetters: false,
                            allowSpecialChars: false,
                            typeRestriction: 'letters_only'
                          });
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60" 
                        placeholder="Ex: João Silva" 
                      />
                    );
                  } else if (field.id === 'email') {
                    fieldContent = (
                      <input 
                        name="email" 
                        type="email" 
                        defaultValue={editingAnalyst?.email} 
                        required 
                        disabled={!canEdit} 
                        onInput={(e) => {
                          const input = e.target as HTMLInputElement;
                          applyFieldRestrictions(input, {
                            ...field,
                            allowAccents: false,
                            allowSpecialLetters: false,
                            allowSpecialChars: true,
                            typeRestriction: 'all'
                          });
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60" 
                        placeholder="joao.silva@empresa.com" 
                      />
                    );
                  } else if (field.id === 'track' || field.id === 'esteira' || field.id.toLowerCase().includes('esteira')) {
                    fieldContent = (
                      <select name={field.id} defaultValue={getAnalystTrack(editingAnalyst || {} as Analyst)} required disabled={!canEdit} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60">
                        {tracks.slice().sort((a, b) => a.name.localeCompare(b.name)).map(track => (
                          <option key={track.id} value={track.name}>{track.name}</option>
                        ))}
                      </select>
                    );
                  } else if (field.id === 'supervisor' || field.id.toLowerCase().includes('supervisor') || field.label.toLowerCase().includes('supervisor')) {
                    fieldContent = (
                      <select 
                        name={field.id} 
                        defaultValue={editingAnalyst?.[field.id] || ''} 
                        required 
                        disabled={!canEdit} 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60"
                      >
                        <option value="">Selecione um supervisor...</option>
                        {supervisors.slice().sort((a, b) => a.name.localeCompare(b.name)).map(supervisor => (
                          <option key={supervisor.id} value={supervisor.name}>{supervisor.name}</option>
                        ))}
                      </select>
                    );
                  } else {
                    fieldContent = (
                      <input 
                        name={field.id} 
                        defaultValue={editingAnalyst?.[field.id] || ''} 
                        disabled={!canEdit} 
                        autoComplete="new-password"
                        required
                        onInput={(e) => {
                          const input = e.target as HTMLInputElement;
                          applyFieldRestrictions(input, field);
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60" 
                        placeholder={field.description}
                      />
                    );
                  }

                  return (
                    <div key={field.id}>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        {field.label}
                      </label>
                      {fieldContent}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Sistemas Utilizados</h3>
              
              {(Object.entries(systemsByCompany) as [string, System[]][]).map(([company, companySystems]) => {
                const searchQuery = (systemSearchQueries[company] || '').toString();
                const filteredSystems = companySystems.filter(system => 
                  (system.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (system.description || '').toLowerCase().includes(searchQuery.toLowerCase())
                );

                return (
                  <div key={company} className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600">
                          <Monitor className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{company}</span>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder={`Buscar em ${company}...`} 
                          value={searchQuery}
                          onChange={(e) => setSystemSearchQueries(prev => ({ ...prev, [company]: e.target.value }))}
                          className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredSystems.map(system => (
                        <label 
                          key={system.id} 
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                            selectedSystemsInForm.includes(system.id)
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                              : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50",
                            (!canManageAccess && !canManageAnalysts) && "opacity-50 cursor-not-allowed pointer-events-none"
                          )}
                        >
                          <input 
                            type="checkbox"
                            className="hidden"
                            checked={selectedSystemsInForm.includes(system.id)}
                            disabled={!canManageAccess && !canManageAnalysts}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSystemsInForm([...selectedSystemsInForm, system.id]);
                              } else {
                                setSelectedSystemsInForm(selectedSystemsInForm.filter(id => id !== system.id));
                              }
                            }}
                          />
                          <div className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0",
                            selectedSystemsInForm.includes(system.id)
                              ? "bg-indigo-600 border-indigo-600"
                              : "border-slate-300 bg-white"
                          )}>
                            {selectedSystemsInForm.includes(system.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-bold block truncate">{system.name}</span>
                            <span className="text-xs opacity-70 block truncate">{system.description}</span>
                          </div>
                        </label>
                      ))}
                      {filteredSystems.length === 0 && (
                        <div className="col-span-full text-center py-4 text-slate-400 text-xs italic">
                          Nenhum sistema encontrado nesta empresa.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {editingAnalyst && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 mt-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data de Criação</label>
                  <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {editingAnalyst.createdAt ? new Date(editingAnalyst.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
                {editingAnalyst.deactivatedAt && (
                  <div>
                    <label className="block text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Data de Desligamento</label>
                    <p className="text-sm text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100 font-bold">
                      {new Date(editingAnalyst.deactivatedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
        
        <div className="p-6 md:p-8 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50">
          <button 
            type="button"
            onClick={() => {
              onClose();
              setSystemSearchQueries({});
            }}
            className="flex-1 px-4 py-3 bg-white text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
          >
            Cancelar
          </button>
            <button 
            type="submit"
            form="analyst-form"
            disabled={!hasChanges}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingAnalyst ? (needsApproval ? 'Solicitar Alteração' : 'Salvar Alterações') : 'Criar Analista'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
