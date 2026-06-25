import React, { useState } from 'react';
import { Analyst, Track } from '../../types';
import { Search, Save, Check, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { motion } from 'motion/react';

interface TracksTabProps {
  tracks: Track[];
  allAnalysts: Analyst[];
  getAnalystTrack: (a: Analyst) => string;
  canEdit: boolean;
}

export default function TracksTab({
  tracks,
  allAnalysts,
  getAnalystTrack,
  canEdit
}: TracksTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTracks, setEditingTracks] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const filteredTracks = tracks.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleHiredCountChange = (id: string, val: string) => {
    setEditingTracks(prev => ({ ...prev, [id]: val }));
  };

  const handleSave = async (track: Track) => {
    const newVal = editingTracks[track.id];
    if (newVal === undefined || newVal === track.hiredCount) return;

    setSavingId(track.id);
    try {
      await update(ref(db, `tracks/${track.id}`), { hiredCount: newVal });
    } catch (error) {
      console.error(error);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Esteiras</h2>
          <p className="text-slate-500">Acompanhe as pessoas por esteira e valores contratados do banco.</p>
        </div>
        
        <div className="w-full sm:w-auto relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar esteiras..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-slate-200 rounded-full focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Esteira</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Analistas Alocados</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Contratados Banco</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTracks.map(track => {
                const trackAnalysts = allAnalysts.filter(a => !a.deactivatedAt && getAnalystTrack(a).toLowerCase() === track.name.toLowerCase());
                const currentVal = editingTracks[track.id] !== undefined ? editingTracks[track.id] : (track.hiredCount || '');
                const hasChanged = editingTracks[track.id] !== undefined && editingTracks[track.id] !== (track.hiredCount || '');
                const isSaving = savingId === track.id;

                const parsedHiredCount = parseInt(currentVal, 10);
                const showWarning = !isNaN(parsedHiredCount) && trackAnalysts.length > parsedHiredCount;
                const progress = !isNaN(parsedHiredCount) && parsedHiredCount > 0 ? (trackAnalysts.length / parsedHiredCount) * 100 : 0;

                return (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={track.id} 
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 font-bold text-slate-700">{track.name}</td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className={cn(
                          "inline-flex items-center justify-center font-bold px-3 py-1 rounded-full text-xs",
                          showWarning ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"
                        )}>
                          {trackAnalysts.length}
                        </div>
                        {!isNaN(parsedHiredCount) && parsedHiredCount > 0 && (
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                            <div 
                              className={cn("h-full rounded-full", showWarning ? "bg-rose-500" : "bg-indigo-500")} 
                              style={{ width: `${Math.min(progress, 100)}%` }} 
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center w-64">
                      <input
                        type="text"
                        value={currentVal}
                        onChange={(e) => handleHiredCountChange(track.id, e.target.value)}
                        placeholder="Ex: 50"
                        disabled={!canEdit}
                        className="w-full text-center px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-100"
                      />
                    </td>
                    <td className="p-4 text-center w-24">
                      {canEdit ? (
                        <button
                          onClick={() => handleSave(track)}
                          disabled={!hasChanged || isSaving}
                          className={cn(
                            "p-2 rounded-xl border transition-all flex items-center justify-center gap-2",
                            hasChanged 
                              ? "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200" 
                              : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed delay-0"
                          )}
                          title="Salvar"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : hasChanged ? <Save className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </button>
                      ) : (
                        <div className="p-2 flex items-center justify-center text-slate-300">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
              {filteredTracks.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    Nenhuma esteira encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
