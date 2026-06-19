import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Monitor, ShieldCheck, ChevronRight, CheckCircle2, FileText, Check, Download, AlertCircle, Settings2, X, Info } from 'lucide-react';
import { FieldDefinition } from '../../types';
import { cn } from '../../lib/utils';

interface ExtractTabProps {
  key?: string;
  handleExportData: (type: 'analysts' | 'systems' | 'users' | 'tracks' | 'accesses' | 'logs', columns?: string[], status?: 'all' | 'active' | 'deactivated') => void;
  hasPermission: (permission: string) => boolean;
  logExportAllTime: boolean;
  setLogExportAllTime: (allTime: boolean) => void;
  logExportStartDate: string;
  setLogExportStartDate: (date: string) => void;
  logExportEndDate: string;
  setLogExportEndDate: (date: string) => void;
  analystFields: FieldDefinition[];
}

export default function ExtractTab({
  handleExportData,
  hasPermission,
  logExportAllTime,
  setLogExportAllTime,
  logExportStartDate,
  setLogExportStartDate,
  logExportEndDate,
  setLogExportEndDate,
  analystFields
}: ExtractTabProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated'>('all');
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'analysts' | 'accesses' | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  const defaultAnalystHeaders = ['Nome', 'Email', 'Esteira', 'Data de Criação', 'Data de Desligamento', 'Aprovado Por'];
  const defaultAccessHeaders = ['Nome Sistema', 'Status', 'Última Atualização', 'Nome', 'Email', 'Esteira', 'Data de Criação', 'Data de Desligamento', 'Aprovado Por'];

  const getAvailableHeaders = (type: 'analysts' | 'accesses') => {
    const customHeaders = analystFields
      .filter(f => !['name', 'email', 'track', 'email_interfile', 'esteira', 'createdAt', 'deactivatedAt', 'approvedByName'].includes(f.id) && !f.id.toLowerCase().includes('esteira'))
      .map(f => f.label);
    
    return type === 'analysts' 
      ? [...defaultAnalystHeaders, ...customHeaders]
      : [...defaultAccessHeaders, ...customHeaders];
  };

  const openColumnModal = (type: 'analysts' | 'accesses') => {
    setModalType(type);
    setSelectedColumns(getAvailableHeaders(type));
    setIsColumnModalOpen(true);
  };

  const confirmExport = () => {
    if (modalType) {
      handleExportData(modalType, selectedColumns, statusFilter);
      setIsColumnModalOpen(false);
      setModalType(null);
    }
  };
  return (
    <motion.div 
      key="extract"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Exportação de Dados</h2>
            <p className="text-slate-500">Extraia as bases de dados do sistema em formato CSV para auditoria ou backup.</p>
          </div>
          <div className="bg-white p-2 rounded-2xl border border-slate-200 flex items-center gap-1 shadow-sm shrink-0">
            <button 
              onClick={() => setStatusFilter('all')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                statusFilter === 'all' ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Todos
            </button>
            <button 
              onClick={() => setStatusFilter('active')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                statusFilter === 'active' ? "bg-emerald-50 text-emerald-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Ativos
            </button>
            <button 
              onClick={() => setStatusFilter('deactivated')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                statusFilter === 'deactivated' ? "bg-rose-50 text-rose-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Desligados
            </button>
          </div>
        </div>
        
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => openColumnModal('analysts')}
            className="group p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left flex items-center gap-4 relative overflow-hidden"
          >
            <div className="absolute right-4 top-4 text-slate-300 opacity-20 group-hover:opacity-100 transition-opacity">
              <Settings2 className="w-5 h-5" />
            </div>
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Base de Analistas</h3>
              <p className="text-xs text-slate-500 line-clamp-1">Personalize colunas e filtros.</p>
            </div>
          </button>

          <button 
            onClick={() => handleExportData('systems')}
            className="group p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Base de Sistemas</h3>
              <p className="text-xs text-slate-500 line-clamp-1">Lista de sistemas e campos técnicos.</p>
            </div>
          </button>

          <button 
            onClick={() => handleExportData('users', undefined, statusFilter)}
            className="group p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Base de Usuários</h3>
              <p className="text-xs text-slate-500 line-clamp-1">Usuários administrativos e operacionais.</p>
            </div>
          </button>

          <button 
            onClick={() => handleExportData('tracks')}
            className="group p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <ChevronRight className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Base de Esteiras</h3>
              <p className="text-xs text-slate-500 line-clamp-1">Lista de todas as esteiras cadastradas.</p>
            </div>
          </button>

          <div className="sm:col-span-2">
            <button 
              onClick={() => openColumnModal('accesses')}
              className="w-full group p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left flex items-center gap-4 relative overflow-hidden"
            >
              <div className="absolute right-4 top-4 text-slate-300 opacity-20 group-hover:opacity-100 transition-opacity">
                <Settings2 className="w-5 h-5" />
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">Matriz de Acessos</h3>
                <p className="text-xs text-slate-500">Relatório completo de qual analista tem acesso a qual sistema. Personalize as colunas de dados do analista.</p>
              </div>
            </button>
          </div>

          {hasPermission('extract_logs') && (
            <div className="col-span-full mt-4 p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
              <div className="flex flex-col md:flex-row md:items-end gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800">Exportação de Logs de Auditoria</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          checked={logExportAllTime}
                          onChange={(e) => setLogExportAllTime(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all" />
                        <Check className="w-3.5 h-3.5 text-white absolute left-0.5 opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">Toda a base histórica</span>
                    </label>
                  </div>

                  {!logExportAllTime && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data Início</label>
                        <input 
                          type="date" 
                          value={logExportStartDate}
                          onChange={(e) => setLogExportStartDate(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data Fim</label>
                        <input 
                          type="date" 
                          value={logExportEndDate}
                          onChange={(e) => setLogExportEndDate(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleExportData('logs')}
                  className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 min-w-[200px]"
                >
                  <Download className="w-5 h-5" />
                  Exportar Logs
                </button>
              </div>
              <p className="mt-4 text-[11px] text-slate-400 italic">
                {logExportAllTime 
                  ? "Serão exportados todos os registros desde o início da operação." 
                  : `Exportando registros de ${logExportStartDate || 'o início'} até ${logExportEndDate || 'hoje'}.`}
              </p>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <div className="flex items-start gap-3 text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold uppercase mb-1">Aviso de Segurança</p>
              <p>As extrações contêm dados sensíveis. Certifique-se de armazenar esses arquivos em locais seguros e de acordo com as políticas de proteção de dados da empresa.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Column Selection Modal */}
      <AnimatePresence>
        {isColumnModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsColumnModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
                    <Settings2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Selecionar Colunas</h3>
                    <p className="text-xs text-slate-500">Escolha os campos que deseja incluir no arquivo CSV.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsColumnModalOpen(false)}
                  className="p-3 text-slate-400 hover:text-slate-600 hover:bg-white rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {modalType && getAvailableHeaders(modalType).map(header => (
                    <label 
                      key={header}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer group",
                        selectedColumns.includes(header)
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                          : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                      )}
                    >
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          checked={selectedColumns.includes(header)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedColumns(prev => [...prev, header]);
                            } else {
                              setSelectedColumns(prev => prev.filter(h => h !== header));
                            }
                          }}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all" />
                        <Check className="w-3.5 h-3.5 text-white absolute left-0.5 opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm font-bold truncate">{header}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex items-center gap-2 text-slate-500 bg-white px-4 py-3 rounded-2xl border border-slate-200">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="text-[10px] font-medium leading-tight">
                    Filtro de status atual: <strong>{
                      statusFilter === 'all' ? 'Todos' : 
                      statusFilter === 'active' ? 'Apenas Ativos' : 'Apenas Desligados'
                    }</strong>.
                  </span>
                </div>
                <button 
                  onClick={confirmExport}
                  className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Gerar Extração
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
