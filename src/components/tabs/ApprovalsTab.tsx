import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardCheck, X, ChevronRight, Search, Loader2 } from 'lucide-react';
import { AccessRequest, System, FieldDefinition } from '../../types';

interface ApprovalsTabProps {
  key?: string;
  requests: AccessRequest[];
  systems: System[];
  analystFields: FieldDefinition[];
  selectedRequestForApproval: AccessRequest | null;
  setSelectedRequestForApproval: (request: AccessRequest | null) => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  handleApproveRequest: (request: AccessRequest) => void;
  handleRejectRequest: (requestId: string, reason: string) => void;
  getAnalystInitials: (analyst: any) => string;
  getAnalystDisplayName: (analyst: any) => string;
  getAnalystEmail: (analyst: any) => string;
  getAnalystTrack: (analyst: any) => string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isProcessing: boolean;
}

export default function ApprovalsTab({
  requests,
  systems,
  analystFields,
  selectedRequestForApproval,
  setSelectedRequestForApproval,
  rejectionReason,
  setRejectionReason,
  handleApproveRequest,
  handleRejectRequest,
  getAnalystInitials,
  getAnalystDisplayName,
  getAnalystEmail,
  getAnalystTrack,
  searchQuery,
  setSearchQuery,
  isProcessing
}: ApprovalsTabProps) {
  const filteredRequests = requests
    .filter(r => r.status === 'pending')
    .filter(r => {
      if (!searchQuery) return true;
      return r.requestNumber.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime());

  return (
    <motion.div 
      key="approvals"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Aprovações Pendentes</h2>
          <p className="text-slate-500">Analise e aprove as solicitações de novos analistas.</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por Nº..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRequests.map(request => (
            <div key={request.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                  {getAnalystInitials(request.analystData)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 truncate">{getAnalystDisplayName(request.analystData)}</h3>
                    <span className="text-[9px] font-mono bg-indigo-50 px-1 py-0.5 rounded text-indigo-500">{request.requestNumber}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{new Date(request.requestedAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedRequestForApproval(request)}
                className="w-full py-2.5 bg-slate-50 text-indigo-600 font-bold text-sm rounded-xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-all"
              >
                Detalhes
              </button>
            </div>
          ))}
        
        {filteredRequests.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="w-8 h-8 text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Nenhuma solicitação pendente</h3>
            <p className="text-slate-500">Todas as solicitações foram processadas.</p>
          </div>
        )}
      </div>

      {/* Approval Details Modal */}
      <AnimatePresence>
        {selectedRequestForApproval && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequestForApproval(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                    {getAnalystInitials(selectedRequestForApproval.analystData)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{getAnalystDisplayName(selectedRequestForApproval.analystData)}</h3>
                    <p className="text-xs text-slate-500">{getAnalystEmail(selectedRequestForApproval.analystData)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRequestForApproval(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {selectedRequestForApproval.type === 'status_change' ? (
                    <div className="col-span-full">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Mudança de Status de Acesso</h4>
                      <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Sistema</p>
                          <p className="font-bold text-slate-800">
                            {systems.find(s => s.id === selectedRequestForApproval.statusChangeData?.systemId)?.name || selectedRequestForApproval.statusChangeData?.systemId}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">De</p>
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
                              {selectedRequestForApproval.statusChangeData?.oldStatus}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Para</p>
                            <span className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded uppercase">
                              {selectedRequestForApproval.statusChangeData?.newStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : selectedRequestForApproval.type === 'edit_analyst' ? (
                    <div className="col-span-full space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Edição de Dados do Analista</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {analystFields.map(field => {
                          const oldValue = selectedRequestForApproval.previousAnalystData?.[field.id];
                          const newValue = selectedRequestForApproval.analystData?.[field.id];
                          
                          if (oldValue === newValue) return null;

                          return (
                            <div key={field.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{field.label}</p>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-slate-500 line-through truncate">{oldValue || 'Vazio'}</span>
                                  <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                                  <span className="text-sm font-bold text-indigo-600 truncate">{newValue || 'Vazio'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dados do Analista</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Esteira:</span>
                            <span className="font-bold text-slate-700">{getAnalystTrack(selectedRequestForApproval.analystData)}</span>
                          </div>
                          {analystFields
                            .filter(f => !['name', 'email', 'track', 'email_interfile', 'esteira'].includes(f.id) && !f.id.toLowerCase().includes('esteira') && selectedRequestForApproval.analystData[f.id])
                            .map(field => (
                              <div key={field.id} className="flex justify-between text-sm">
                                <span className="text-slate-500">{field.label}:</span>
                                <span className="font-bold text-slate-700">{selectedRequestForApproval.analystData[field.id]}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Sistemas Solicitados</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedRequestForApproval.systemIds?.map(sid => {
                            const system = systems.find(s => s.id === sid);
                            return (
                              <span key={sid} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100">
                                {system?.name || sid}
                              </span>
                            );
                          })}
                          {(!selectedRequestForApproval.systemIds || selectedRequestForApproval.systemIds.length === 0) && (
                            <span className="text-xs text-slate-400 italic">Nenhum sistema solicitado.</span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solicitado por</span>
                    <span className="text-sm font-bold text-slate-700">{selectedRequestForApproval.requestedByName}</span>
                    <span className="text-[10px] text-slate-400">{new Date(selectedRequestForApproval.requestedAt).toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Motivo da Rejeição (Obrigatório para reprovar)
                  </label>
                  <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm min-h-[100px]"
                    placeholder="Explique o motivo da reprovação..."
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => handleRejectRequest(selectedRequestForApproval.id, rejectionReason)}
                  className="flex-1 px-4 py-4 bg-white text-rose-600 border border-rose-200 font-bold rounded-2xl hover:bg-rose-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={!rejectionReason.trim() || isProcessing}
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Rejeitar'}
                </button>
                <button 
                  onClick={() => handleApproveRequest(selectedRequestForApproval)}
                  className="flex-1 px-4 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    selectedRequestForApproval.type === 'status_change' ? 'Aprovar Mudança' : selectedRequestForApproval.type === 'edit_analyst' ? 'Aprovar Edição' : 'Aprovar Criação'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
