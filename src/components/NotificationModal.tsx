import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Check, AlertCircle, ExternalLink, ChevronRight, Users } from 'lucide-react';
import { AppNotification, AccessRequest, System, FieldDefinition } from '../types';
import { cn } from '../lib/utils';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  requests: AccessRequest[];
  onApprove: (request: AccessRequest) => Promise<void>;
  onReject: (requestId: string, reason: string) => Promise<void>;
  onViewMyRequests: () => void;
  onViewApprovals: () => void;
  onAdjustRequest: (request: AccessRequest) => void;
  systems: System[];
  analystFields: FieldDefinition[];
  getAnalystInitials: (analyst: any) => string;
  getAnalystDisplayName: (analyst: any) => string;
  getAnalystEmail: (analyst: any) => string;
  getAnalystTrack: (analyst: any) => string;
  canApprove: boolean;
  currentUserUid?: string;
}

export default function NotificationModal({
  isOpen,
  onClose,
  notifications,
  requests,
  onApprove,
  onReject,
  onViewMyRequests,
  onViewApprovals,
  onAdjustRequest,
  systems,
  analystFields,
  getAnalystInitials,
  getAnalystDisplayName,
  getAnalystEmail,
  getAnalystTrack,
  canApprove,
  currentUserUid
}: NotificationModalProps) {
  const [rejectReasons, setRejectReasons] = React.useState<Record<string, string>>({});
  const [selectedNotificationId, setSelectedNotificationId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const selectedNotification = notifications.find(n => n.id === selectedNotificationId);
  const selectedRequest = selectedNotification ? requests.find(r => r.id === selectedNotification.requestId) : null;
  const isSolicitor = selectedRequest && currentUserUid && selectedRequest.requestedBy === currentUserUid;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white w-[90vw] h-[90vh] rounded-[2.5rem] shadow-2xl border border-white/20 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              {selectedNotificationId ? (
                <button 
                  onClick={() => setSelectedNotificationId(null)}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm mr-2"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Bell className="w-6 h-6" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {selectedNotificationId ? 'Detalhes da Solicitação' : 'Centro de Notificações'}
                </h2>
                <p className="text-slate-500">
                  {selectedNotificationId 
                    ? `Solicitação ${selectedRequest?.requestNumber}`
                    : `Você tem ${notifications.length} nova(s) atualização(ões)`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List or Detailed View */}
          <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/30">
            {selectedNotificationId && selectedRequest ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-4xl mx-auto space-y-8 pb-12"
              >
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
                  {/* Analyst Info Section */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl shadow-sm">
                        {getAnalystInitials(selectedRequest.analystData)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{getAnalystDisplayName(selectedRequest.analystData)}</h3>
                        <p className="text-slate-500 font-medium">{getAnalystEmail(selectedRequest.analystData)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-1">Status do Registro</span>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase",
                        selectedRequest.status === 'pending' ? "bg-amber-100 text-amber-600" :
                        selectedRequest.status === 'approved' ? "bg-emerald-100 text-emerald-600" :
                        "bg-rose-100 text-rose-600"
                      )}>
                        {selectedRequest.status === 'pending' ? 'Pendente' :
                         selectedRequest.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                      </span>
                    </div>
                  </div>

                  {/* Core Data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {selectedRequest.type === 'status_change' ? (
                      <div className="col-span-full">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Mudança de Status de Acesso</h4>
                        <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Sistema</p>
                            <p className="font-bold text-slate-800 text-lg">
                              {systems.find(s => s.id === selectedRequest.statusChangeData?.systemId)?.name || selectedRequest.statusChangeData?.systemId}
                            </p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">De</p>
                              <span className="px-3 py-1.5 bg-slate-200 text-slate-600 text-[11px] font-bold rounded-lg uppercase">
                                {selectedRequest.statusChangeData?.oldStatus}
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-indigo-300" />
                            <div className="text-center">
                              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Para</p>
                              <span className="px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-lg uppercase shadow-md shadow-indigo-100">
                                {selectedRequest.statusChangeData?.newStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : selectedRequest.type === 'edit_analyst' ? (
                      <div className="col-span-full space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Alterações Solicitadas</h4>
                        <div className="grid grid-cols-1 gap-3">
                          {analystFields.map(field => {
                            const oldValue = selectedRequest.previousAnalystData?.[field.id];
                            const newValue = selectedRequest.analystData?.[field.id];
                            if (oldValue === newValue) return null;

                            return (
                              <div key={field.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{field.label}</p>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-400 line-through truncate">{oldValue || 'Vazio'}</span>
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
                        <div className="space-y-6">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dados do Analista</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl">
                              <span className="text-slate-500 font-medium">Esteira:</span>
                              <span className="font-bold text-slate-800">{getAnalystTrack(selectedRequest.analystData)}</span>
                            </div>
                            {analystFields
                              .filter(f => !['name', 'email', 'track', 'email_interfile', 'esteira'].includes(f.id) && !f.id.toLowerCase().includes('esteira') && selectedRequest.analystData[f.id])
                              .map(field => (
                                <div key={field.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl">
                                  <span className="text-slate-500 font-medium">{field.label}:</span>
                                  <span className="font-bold text-slate-800">{selectedRequest.analystData[field.id]}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                        <div className="space-y-6">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Sistemas Solicitados</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedRequest.systemIds?.map((sid, sIdx) => {
                              const system = systems.find(s => s.id === sid);
                              return (
                                <div key={`${sid}-${sIdx}`} className="px-4 py-3 bg-indigo-50/50 text-indigo-600 text-xs font-bold rounded-xl border border-indigo-100 flex items-center justify-center text-center">
                                  {system?.name || sid}
                                </div>
                              );
                            })}
                            {(!selectedRequest.systemIds || selectedRequest.systemIds.length === 0) && (
                              <div className="col-span-2 p-4 bg-slate-50 rounded-xl text-center">
                                <span className="text-xs text-slate-400 italic font-medium">Nenhum sistema solicitado</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Solicitado por</span>
                      <span className="text-sm font-bold text-slate-700">{selectedRequest.requestedByName}</span>
                      <span className="text-[10px] font-medium text-slate-400">{new Date(selectedRequest.requestedAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                  {selectedRequest.status === 'pending' && (
                    <div className="space-y-6 pt-4">
                      {canApprove ? (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                              Motivo da Rejeição (Obrigatório para reprovar)
                            </label>
                            <textarea 
                              value={rejectReasons[selectedNotificationId!] || ''}
                              onChange={(e) => setRejectReasons(prev => ({ ...prev, [selectedNotificationId!]: e.target.value }))}
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm min-h-[120px] resize-none"
                              placeholder="Explique detalhadamente o motivo da reprovação..."
                            />
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                              onClick={() => {
                                const reason = rejectReasons[selectedNotificationId!] || '';
                                if (!reason.trim()) return;
                                onReject(selectedRequest.id, reason);
                                setSelectedNotificationId(null);
                              }}
                              disabled={!(rejectReasons[selectedNotificationId!] || '').trim()}
                              className="flex-1 px-8 py-5 bg-white text-rose-600 border-2 border-rose-100 font-bold rounded-2xl hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm active:scale-[0.98] disabled:opacity-40 disabled:grayscale"
                            >
                              Reprovar Solicitação
                            </button>
                            <button 
                              onClick={() => {
                                onApprove(selectedRequest);
                                setSelectedNotificationId(null);
                              }}
                              className="flex-1 px-8 py-5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]"
                            >
                              Aprovar Registro
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                          <p className="text-sm font-medium text-amber-700 text-center flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Aguardando aprovação de um supervisor
                          </p>
                          <button 
                            onClick={() => setSelectedNotificationId(null)}
                            className="w-full mt-4 px-8 py-4 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                          >
                            Voltar para a Lista
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedRequest.status === 'rejected' && (
                    <div className="space-y-6 pt-4">
                      {selectedRequest.rejectionReason && (
                        <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl">
                          <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Motivo da Rejeição</p>
                          <p className="text-sm text-rose-700 font-medium whitespace-pre-wrap">{selectedRequest.rejectionReason}</p>
                        </div>
                      )}
                      
                      {isSolicitor && (
                        <button 
                          onClick={() => {
                            onAdjustRequest(selectedRequest);
                            setSelectedNotificationId(null);
                          }}
                          className="w-full px-8 py-5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                          <ExternalLink className="w-5 h-5" />
                          Ajustar e Reenviar Solicitação
                        </button>
                      )}

                      <button 
                        onClick={() => setSelectedNotificationId(null)}
                        className="w-full px-8 py-5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                      >
                        Voltar para a Lista
                      </button>
                    </div>
                  )}

                  {selectedRequest.status === 'approved' && (
                    <div className="pt-4">
                      <button 
                        onClick={() => setSelectedNotificationId(null)}
                        className="w-full px-8 py-5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                      >
                        Voltar para a Lista
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center mb-4">
                  <Bell className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-xl font-medium text-slate-400">Nenhuma notificação nova</p>
              </div>
            ) : (
              notifications.map((notification, nIdx) => {
                const request = requests.find(r => r.id === notification.requestId);
                
                return (
                  <motion.div 
                    key={notification.id ? `${notification.id}-${nIdx}` : `notif-${nIdx}`}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => request && setSelectedNotificationId(notification.id)}
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer active:scale-[0.995]"
                  >
                    <div className="flex gap-6 items-center">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border",
                        notification.type === 'request_pending' ? "bg-amber-100 text-amber-600 border-amber-200" :
                        notification.type === 'request_approved' ? "bg-emerald-100 text-emerald-600 border-emerald-200" :
                        "bg-rose-100 text-rose-600 border-rose-200"
                      )}>
                        {notification.type === 'request_pending' && <AlertCircle className="w-7 h-7" />}
                        {notification.type === 'request_approved' && <Check className="w-7 h-7" />}
                        {notification.type === 'request_rejected' && <X className="w-7 h-7" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-slate-800 text-xl leading-tight group-hover:text-indigo-600 transition-colors">
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                              {new Date(notification.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-600 line-clamp-1">{notification.body}</p>
                      </div>

                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all shrink-0">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {!selectedNotificationId && (
            <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-3">
              {canApprove && (
                <button 
                  onClick={onViewApprovals}
                  className="px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all font-sans"
                >
                  Ir para Aprovações
                </button>
              )}
              <button 
                onClick={onClose}
                className="px-12 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-200 text-lg"
              >
                OK
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

