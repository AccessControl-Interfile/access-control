import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Users, ChevronRight, Edit2, Settings, Monitor, 
  ShieldCheck, Power, Trash2, CheckCircle2, Clock, AlertCircle 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Analyst, Access, System, AccessStatus, FieldDefinition } from '../../types';

const STATUS_CONFIG: Record<AccessStatus, { color: string; icon: React.ReactNode; label: string }> = {
  'Ok': { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Ok' },
  'Pendente': { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: <Clock className="w-4 h-4" />, label: 'Pendente' },
  'Acesso perdido': { color: 'text-rose-600 bg-rose-50 border-rose-100', icon: <AlertCircle className="w-4 h-4" />, label: 'Acesso perdido' },
};

interface AnalystsTabProps {
  key?: string;
  selectedAnalyst: Analyst | null;
  setSelectedAnalyst: (analyst: Analyst | null) => void;
  paginatedAnalysts: Analyst[];
  filteredAnalysts: Analyst[];
  hasMoreAnalysts: boolean;
  setAnalystsLimit: React.Dispatch<React.SetStateAction<number>>;
  accesses: Access[];
  systems: System[];
  canManageAnalysts: boolean;
  canManageAccess: boolean;
  currentUserRole: string | undefined;
  deactivateAnalyst: (id: string) => void;
  setEditingAnalyst: (analyst: Analyst | null) => void;
  setIsAddingAnalyst: (isAdding: boolean) => void;
  deleteAnalyst: (id: string) => void;
  getAnalystInitials: (analyst: Analyst) => string;
  getAnalystDisplayName: (analyst: Analyst) => string;
  getAnalystEmail: (analyst: Analyst) => string;
  getAnalystTrack: (analyst: Analyst) => string;
  handleUpdateAccess: (analystId: string, systemId: string, status: AccessStatus) => void;
  analystFields: FieldDefinition[];
}

const AnalystsTab: React.FC<AnalystsTabProps> = ({
  selectedAnalyst,
  setSelectedAnalyst,
  paginatedAnalysts,
  filteredAnalysts,
  hasMoreAnalysts,
  setAnalystsLimit,
  accesses,
  systems,
  canManageAnalysts,
  canManageAccess,
  currentUserRole,
  deactivateAnalyst,
  setEditingAnalyst,
  setIsAddingAnalyst,
  deleteAnalyst,
  getAnalystInitials,
  getAnalystDisplayName,
  getAnalystEmail,
  getAnalystTrack,
  handleUpdateAccess,
  analystFields,
}) => {
  return (
    <>
      {!selectedAnalyst && (
        <motion.div 
          key="analysts-list"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
        >
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Analista</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Esteira</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status de Acesso</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedAnalysts.map(analyst => {
                  const analystAccesses = accesses.filter(a => a.analystId === analyst.id);
                  const pending = analystAccesses.filter(a => a.status === 'Pendente').length;
                  const lost = analystAccesses.filter(a => a.status === 'Acesso perdido').length;
                  
                  return (
                    <tr key={analyst.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {getAnalystInitials(analyst)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{getAnalystDisplayName(analyst)}</p>
                            <p className="text-xs text-slate-400">{getAnalystEmail(analyst)}</p>
                            {analyst.deactivatedAt && (
                              <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">Desligado em: {new Date(analyst.deactivatedAt).toLocaleDateString('pt-BR')}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                          {getAnalystTrack(analyst)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {pending === 0 && lost === 0 ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                              <CheckCircle2 className="w-3 h-3" />
                              <span className="text-[10px] font-bold uppercase">Tudo Ok</span>
                            </div>
                          ) : (
                            <>
                              {pending > 0 && (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                                  <Clock className="w-3 h-3" />
                                  <span className="text-[10px] font-bold uppercase">{pending} Pendente{pending > 1 ? 's' : ''}</span>
                                </div>
                              )}
                              {lost > 0 && (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                                  <AlertCircle className="w-3 h-3" />
                                  <span className="text-[10px] font-bold uppercase">{lost} Perdido{lost > 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <button 
                            onClick={() => setSelectedAnalyst(analyst)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Gerenciar Acessos"
                          >
                            <ShieldCheck className="w-5 h-5" />
                          </button>
                          {canManageAnalysts && currentUserRole !== 'supervisor' && currentUserRole !== 'treinador' && (
                            <>
                              <button 
                                onClick={() => deactivateAnalyst(analyst.id)}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Desligar Analista"
                              >
                                <Power className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => { setEditingAnalyst(analyst); setIsAddingAnalyst(true); }}
                                disabled={!!analyst.deactivatedAt}
                                className={cn(
                                  "p-2 transition-colors rounded-lg",
                                  analyst.deactivatedAt ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                )}
                                title={analyst.deactivatedAt ? "Analistas desligados não podem ser editados" : "Editar"}
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => deleteAnalyst(analyst.id)}
                                disabled={!!analyst.deactivatedAt}
                                className={cn(
                                  "p-2 transition-colors rounded-lg",
                                  analyst.deactivatedAt ? "text-slate-200 cursor-not-allowed" : "text-rose-600 hover:bg-rose-50"
                                )}
                                title={analyst.deactivatedAt ? "Analistas desligados não podem ser excluídos" : "Excluir"}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Load More Button (Desktop) */}
          {hasMoreAnalysts && filteredAnalysts.length > 0 && (
            <div className="hidden md:flex p-4 border-t border-slate-50 justify-center">
              <button 
                onClick={() => setAnalystsLimit(prev => prev + 20)}
                className="flex items-center gap-2 px-6 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-xl transition-all border border-slate-200"
              >
                <Plus className="w-4 h-4" />
                Carregar Mais Analistas
              </button>
            </div>
          )}

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {paginatedAnalysts.map(analyst => {
              const analystAccesses = accesses.filter(a => a.analystId === analyst.id);
              const pending = analystAccesses.filter(a => a.status === 'Pendente').length;
              const lost = analystAccesses.filter(a => a.status === 'Acesso perdido').length;

              return (
                <div key={`mobile-${analyst.id}`} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {getAnalystInitials(analyst)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{getAnalystDisplayName(analyst)}</p>
                        <p className="text-xs text-slate-400">{getAnalystEmail(analyst)}</p>
                        {analyst.deactivatedAt && (
                          <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">Desligado em: {new Date(analyst.deactivatedAt).toLocaleDateString('pt-BR')}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setSelectedAnalyst(analyst)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-5 h-5" />
                      </button>
                      {canManageAnalysts && currentUserRole !== 'supervisor' && currentUserRole !== 'treinador' && (
                        <>
                          <button 
                            onClick={() => deactivateAnalyst(analyst.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Power className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => { setEditingAnalyst(analyst); setIsAddingAnalyst(true); }}
                            disabled={!!analyst.deactivatedAt}
                            className={cn(
                              "p-2 transition-colors rounded-lg",
                              analyst.deactivatedAt ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:text-indigo-600"
                            )}
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => deleteAnalyst(analyst.id)}
                            disabled={!!analyst.deactivatedAt}
                            className={cn(
                              "p-2 transition-colors rounded-lg",
                              analyst.deactivatedAt ? "text-slate-200 cursor-not-allowed" : "text-rose-600 hover:bg-rose-50"
                            )}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                      {getAnalystTrack(analyst)}
                    </span>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {pending === 0 && lost === 0 ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase">Tudo Ok</span>
                        </div>
                      ) : (
                        <>
                          {pending > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                              <Clock className="w-3 h-3" />
                              <span className="text-[10px] font-bold uppercase">{pending} Pendente</span>
                            </div>
                          )}
                          {lost > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                              <AlertCircle className="w-3 h-3" />
                              <span className="text-[10px] font-bold uppercase">{lost} Perdido</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button (Mobile) */}
          {hasMoreAnalysts && filteredAnalysts.length > 0 && (
            <div className="md:hidden p-4 border-t border-slate-50 flex justify-center">
              <button 
                onClick={() => setAnalystsLimit(prev => prev + 20)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-xl transition-all border border-slate-200"
              >
                <Plus className="w-4 h-4" />
                Carregar Mais
              </button>
            </div>
          )}

          {filteredAnalysts.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Nenhum analista encontrado.</p>
              <p className="text-sm text-slate-400 mt-1">Tente ajustar sua busca ou o filtro de status.</p>
            </div>
          )}
        </motion.div>
      )}

      {selectedAnalyst && (
        <motion.div 
          key="analyst-detail"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-2 lg:gap-4 mb-6 lg:mb-8">
            <button 
              onClick={() => setSelectedAnalyst(null)}
              className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 rotate-180" />
            </button>
            <div className="flex-1 flex items-center justify-between gap-2 lg:gap-4">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-xl lg:rounded-3xl bg-indigo-600 flex items-center justify-center text-white text-sm lg:text-2xl font-bold shrink-0">
                  {getAnalystInitials(selectedAnalyst)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg lg:text-2xl font-bold text-slate-800 truncate">{getAnalystDisplayName(selectedAnalyst)}</h2>
                  <p className="text-[10px] lg:text-base text-slate-500 truncate">{getAnalystTrack(selectedAnalyst)} • {getAnalystEmail(selectedAnalyst)}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {selectedAnalyst.createdAt && (
                      <p className="text-[10px] text-slate-400">Criado em: {new Date(selectedAnalyst.createdAt).toLocaleDateString('pt-BR')}</p>
                    )}
                    {selectedAnalyst.deactivatedAt && (
                      <p className="text-[10px] font-bold text-rose-500 uppercase">Desligado em: {new Date(selectedAnalyst.deactivatedAt).toLocaleDateString('pt-BR')}</p>
                    )}
                    {selectedAnalyst.approvedByName && (
                      <p className="text-[10px] text-slate-400">Aprovado por: <span className="font-bold text-slate-600">{selectedAnalyst.approvedByName}</span></p>
                    )}
                  </div>
                </div>
              </div>
              {canManageAnalysts && !selectedAnalyst.deactivatedAt && (
                <button 
                  onClick={() => { setEditingAnalyst(selectedAnalyst); setIsAddingAnalyst(true); }}
                  className="p-2 lg:p-3 bg-white border border-slate-200 text-slate-600 rounded-xl lg:rounded-2xl hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm shrink-0 cursor-pointer"
                  title="Editar Dados do Analista"
                >
                  <Edit2 className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Custom Fields Section */}
          {analystFields.some(f => !['name', 'email', 'track', 'email_interfile', 'esteira'].includes(f.id) && !f.id.toLowerCase().includes('esteira') && selectedAnalyst[f.id]) && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
              <h3 className="font-bold text-slate-800 mb-4">Informações Adicionais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analystFields
                  .filter(f => !['name', 'email', 'track', 'email_interfile', 'esteira'].includes(f.id) && !f.id.toLowerCase().includes('esteira') && selectedAnalyst[f.id])
                  .map(field => (
                    <div key={field.id}>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {field.label}
                      </label>
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {selectedAnalyst[field.id]}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Controle de Acessos</h3>
                <p className="text-sm text-slate-500">Sistemas vinculados a este analista e seus respectivos status.</p>
              </div>
              {(canManageAnalysts || canManageAccess) && !selectedAnalyst.deactivatedAt && (
                <button 
                  onClick={() => { setEditingAnalyst(selectedAnalyst); setIsAddingAnalyst(true); }}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Gerenciar Sistemas
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-50">
              {systems
                .filter(system => accesses.some(a => a.analystId === selectedAnalyst.id && a.systemId === system.id))
                .map(system => {
                  const access = accesses.find(a => a.analystId === selectedAnalyst.id && a.systemId === system.id);
                  const currentStatus = access?.status || 'Não utiliza';
                
                return (
                  <div key={system.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shrink-0",
                        currentStatus === 'Ok' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                      )}>
                        <Monitor className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{system.name}</p>
                        <p className="text-xs text-slate-400 max-w-xs">{system.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:flex items-center gap-2">
                      {canManageAccess && !selectedAnalyst.deactivatedAt ? (
                        (['Ok', 'Pendente', 'Acesso perdido'] as AccessStatus[]).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdateAccess(selectedAnalyst.id, system.id, status)}
                            className={cn(
                              "px-3 py-2 rounded-xl text-[10px] font-bold transition-all border text-center",
                              currentStatus === status 
                                ? STATUS_CONFIG[status].color
                                : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                            )}
                          >
                            {status}
                          </button>
                        ))
                      ) : (
                        <div className={cn(
                          "px-3 py-2 rounded-xl text-[10px] font-bold border text-center",
                          STATUS_CONFIG[currentStatus].color
                        )}>
                          {currentStatus}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {systems.filter(system => accesses.some(a => a.analystId === selectedAnalyst.id && a.systemId === system.id)).length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Monitor className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-500 font-medium">Nenhum sistema vinculado.</p>
                  <p className="text-xs text-slate-400 mt-1">Clique em "Gerenciar Sistemas" para vincular ferramentas a este analista.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default AnalystsTab;
