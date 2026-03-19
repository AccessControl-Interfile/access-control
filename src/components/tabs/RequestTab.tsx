import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Check, Edit2, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AccessRequest, FieldDefinition, System, Track } from '../../types';
import { User as FirebaseUser } from 'firebase/auth';

interface RequestTabProps {
  key?: string;
  requestSubTab: 'new' | 'my';
  setRequestSubTab: (tab: 'new' | 'my') => void;
  editingRequest: AccessRequest | null;
  setEditingRequest: (request: AccessRequest | null) => void;
  selectedSystemsInForm: string[];
  setSelectedSystemsInForm: (systems: string[]) => void;
  analystFields: FieldDefinition[];
  tracks: Track[];
  systems: System[];
  requests: AccessRequest[];
  user: FirebaseUser | null;
  handleRequestAccess: (e: React.FormEvent<HTMLFormElement>) => void;
  setActiveTab: (tab: string) => void;
  getAnalystInitials: (analyst: any) => string;
  getAnalystDisplayName: (analyst: any) => string;
  handleDeleteRequest: (request: AccessRequest) => void;
}

export default function RequestTab({
  requestSubTab,
  setRequestSubTab,
  editingRequest,
  setEditingRequest,
  selectedSystemsInForm,
  setSelectedSystemsInForm,
  analystFields,
  tracks,
  systems,
  requests,
  user,
  handleRequestAccess,
  setActiveTab,
  getAnalystInitials,
  getAnalystDisplayName,
  handleDeleteRequest
}: RequestTabProps) {
  return (
    <motion.div 
      key="request"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-center">
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => { setRequestSubTab('new'); setEditingRequest(null); setSelectedSystemsInForm([]); }}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              requestSubTab === 'new' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Nova Solicitação
          </button>
          <button 
            onClick={() => setRequestSubTab('my')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              requestSubTab === 'my' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Solicitações
          </button>
        </div>
      </div>

      {requestSubTab === 'new' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden max-w-2xl mx-auto">
          <div className="p-8 border-b border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {editingRequest ? "Ajustar Solicitação" : "Solicitar Novo Analista"}
            </h2>
            <p className="text-slate-500 text-sm">
              {editingRequest 
                ? "Corrija os dados abaixo conforme o feedback e reenvie para aprovação." 
                : "Preencha os dados abaixo para solicitar a criação de um novo analista. A solicitação passará por aprovação."}
            </p>
            {editingRequest?.rejectionReason && (
              <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">Motivo da Reprovação</p>
                  <p className="text-sm text-rose-700">{editingRequest.rejectionReason}</p>
                </div>
              </div>
            )}
          </div>
          <div className="p-8">
            <form key={editingRequest?.id || 'new_request'} onSubmit={handleRequestAccess} className="space-y-6">
              {analystFields.map(field => {
                const defaultValue = editingRequest?.analystData[field.id] || '';
                
                if (field.id === 'name') {
                  return (
                    <div key={field.id}>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        {field.label}
                      </label>
                      <input name="name" required defaultValue={defaultValue} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Ex: João Silva" />
                    </div>
                  );
                }
                if (field.id === 'email') {
                  return (
                    <div key={field.id}>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        {field.label}
                      </label>
                      <input name="email" type="email" required defaultValue={defaultValue} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="joao.silva@empresa.com" />
                    </div>
                  );
                }
                if (field.id === 'track' || field.id === 'esteira' || field.id.toLowerCase().includes('esteira')) {
                  return (
                    <div key={field.id}>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        {field.label}
                      </label>
                      <select name={field.id} required defaultValue={defaultValue} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                        <option value="">Selecione uma esteira</option>
                        {tracks.map(track => (
                          <option key={track.id} value={track.name}>{track.name}</option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return (
                  <div key={field.id}>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      {field.label}
                    </label>
                    <input 
                      name={field.id} 
                      defaultValue={defaultValue}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                      placeholder={field.description}
                    />
                  </div>
                );
              })}

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Sistemas Necessários
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {systems.map(system => (
                    <label 
                      key={system.id} 
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                        selectedSystemsInForm.includes(system.id)
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                          : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <input 
                        type="checkbox"
                        className="hidden"
                        checked={selectedSystemsInForm.includes(system.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSystemsInForm([...selectedSystemsInForm, system.id]);
                          } else {
                            setSelectedSystemsInForm(selectedSystemsInForm.filter(id => id !== system.id));
                          }
                        }}
                      />
                      <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                        selectedSystemsInForm.includes(system.id)
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-slate-300"
                      )}>
                        {selectedSystemsInForm.includes(system.id) && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-sm font-medium">{system.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  type="button" 
                  onClick={() => { 
                    if (editingRequest) {
                      setRequestSubTab('my');
                      setEditingRequest(null);
                      setSelectedSystemsInForm([]);
                    } else {
                      setActiveTab('dashboard'); 
                      setSelectedSystemsInForm([]); 
                    }
                  }} 
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                  {editingRequest ? "Reenviar Solicitação" : "Enviar Solicitação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests
            .filter(r => r.requestedBy === user?.uid && r.status !== 'approved')
            .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
            .map(request => (
              <div key={request.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                      {getAnalystInitials(request.analystData)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{getAnalystDisplayName(request.analystData)}</h3>
                        <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{request.requestNumber}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(request.requestedAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    request.status === 'pending' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                    request.status === 'approved' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                    "bg-rose-50 text-rose-600 border border-rose-100"
                  )}>
                    {request.status === 'pending' ? 'Pendente' : request.status === 'approved' ? 'Aprovado' : 'Reprovado'}
                  </div>
                </div>

                {request.status === 'rejected' && request.rejectionReason && (
                  <div className="mb-4 p-3 bg-rose-50/50 rounded-xl border border-rose-100/50">
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Motivo da Reprovação:</p>
                    <p className="text-xs text-rose-700 line-clamp-2">{request.rejectionReason}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {request.type === 'status_change' ? 'Mudança de Status' : `${request.systemIds?.length || 0} ${request.systemIds?.length === 1 ? 'Sistema' : 'Sistemas'}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDeleteRequest(request)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Excluir Solicitação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {request.status === 'rejected' && request.type !== 'status_change' && (
                        <button 
                          onClick={() => {
                            setEditingRequest(request);
                            setSelectedSystemsInForm(request.systemIds || []);
                            setRequestSubTab('new');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          Ajustar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          
          {requests.filter(r => r.requestedBy === user?.uid && r.status !== 'approved').length === 0 && (
            <div className="col-span-full bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusCircle className="w-8 h-8 text-slate-200" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Nenhuma solicitação encontrada</h3>
              <p className="text-slate-500">Você ainda não realizou nenhuma solicitação.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
