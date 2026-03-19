import React from 'react';
import { motion } from 'motion/react';
import { Monitor, Edit2, Trash2, AlertCircle, Plus } from 'lucide-react';
import { System, Access, FieldDefinition } from '../../types';

interface SystemsTabProps {
  key?: string;
  systems: System[];
  accesses: Access[];
  searchQuery: string;
  canManageSystems: boolean;
  systemFields: FieldDefinition[];
  setEditingSystem: (system: System) => void;
  setIsAddingSystem: (isAdding: boolean) => void;
  deleteSystem: (id: string) => void;
}

export default function SystemsTab({
  systems,
  accesses,
  searchQuery,
  canManageSystems,
  systemFields,
  setEditingSystem,
  setIsAddingSystem,
  deleteSystem
}: SystemsTabProps) {
  return (
    <motion.div 
      key="systems-list"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
    >
      {systems
        .filter(system => 
          system.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          system.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(system => {
        const usersCount = accesses.filter(a => a.systemId === system.id && a.status === 'Ok').length;
        const issuesCount = accesses.filter(a => a.systemId === system.id && (a.status === 'Acesso perdido' || a.status === 'Pendente')).length;
        
        return (
          <div key={system.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Monitor className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1">
                {canManageSystems && (
                  <>
                    <button 
                      onClick={() => { setEditingSystem(system); setIsAddingSystem(true); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => deleteSystem(system.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-1">{system.name}</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{system.description}</p>
            
            {/* Custom System Fields */}
            {systemFields.some(f => !['name', 'description'].includes(f.id) && system[f.id]) && (
              <div className="space-y-2 mb-6">
                {systemFields
                  .filter(f => !['name', 'description'].includes(f.id) && system[f.id])
                  .map(field => (
                    <div key={field.id} className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{field.label}</span>
                      <span className="text-xs text-slate-600 truncate">{system[field.id]}</span>
                    </div>
                  ))}
              </div>
            )}
            
            <div className="flex items-center justify-end pt-4 border-t border-slate-50">
              {issuesCount > 0 && (
                <div className="flex items-center gap-1 text-rose-500">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-bold">{issuesCount} Pendentes</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {canManageSystems && (
        <button 
          onClick={() => setIsAddingSystem(true)}
          className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-bold text-sm">Adicionar Novo Sistema</span>
        </button>
      )}
    </motion.div>
  );
}
