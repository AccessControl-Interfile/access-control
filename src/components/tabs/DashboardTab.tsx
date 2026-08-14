import React from 'react';
import { motion } from 'motion/react';
import { Clock, AlertCircle, ClipboardCheck, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { cn } from '../../lib/utils';
import { AccessRequest } from '../../types';

interface DashboardTabProps {
  key?: string;
  dashboardViewMode: 'byTrack' | 'bySystem';
  setDashboardViewMode: (mode: 'byTrack' | 'bySystem') => void;
  stats: any;
  hasPermission: (permission: string) => boolean;
  requests: AccessRequest[];
}

export default function DashboardTab({
  dashboardViewMode,
  setDashboardViewMode,
  stats,
  hasPermission,
  requests
}: DashboardTabProps) {
  return (
    <motion.div 
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* Dashboard Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Monitoramento de Alertas</h2>
          <p className="text-slate-500">Acompanhe pendências e acessos perdidos na operação.</p>
        </div>
        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
          <button 
            onClick={() => setDashboardViewMode('byTrack')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all",
              dashboardViewMode === 'byTrack' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Por Esteira
          </button>
          <button 
            onClick={() => setDashboardViewMode('bySystem')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all",
              dashboardViewMode === 'bySystem' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Por Sistema
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Pendentes</p>
            <p className="text-2xl font-bold text-slate-800">{stats.pendingCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Acessos Perdidos</p>
            <p className="text-2xl font-bold text-slate-800">{stats.lostCount}</p>
          </div>
        </div>
        {hasPermission('approve_access') && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Aprovações Pendentes</p>
              <p className="text-2xl font-bold text-slate-800">{requests.filter(r => r.status === 'pending').length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="mb-2">
          <h3 className="font-bold text-slate-800">Distribuição de Alertas</h3>
          <p className="text-xs text-slate-500">Visualização por {dashboardViewMode === 'byTrack' ? 'esteira' : 'sistema'}</p>
        </div>
        <div className="flex items-center justify-center gap-6 mb-4 text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div>
            <span className="text-slate-700">Pendentes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></div>
            <span className="text-slate-700">Perdidos</span>
          </div>
        </div>
        <div className="h-[420px] w-full overflow-x-auto overflow-y-hidden pb-4">
          <div className="h-full" style={{ minWidth: dashboardViewMode === 'byTrack' ? `max(100%, ${stats.byTrack.length * 150}px)` : `max(100%, ${stats.bySystem.length * 250}px)` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardViewMode === 'byTrack' ? stats.byTrack : stats.bySystem}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  dy={15}
                  interval={0}
                  height={60}
                />
                <Tooltip 
                  cursor={false}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: '#ffffff'
                  }}
                  labelStyle={{ color: '#0f172a', marginBottom: '8px' }}
                />
                <Bar 
                  name="Pendentes" 
                  dataKey="pendingCount" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                >
                  <LabelList dataKey="pendingCount" position="top" style={{ fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                </Bar>
                <Bar 
                  name="Perdidos" 
                  dataKey="lostCount" 
                  fill="#f43f5e" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                >
                  <LabelList dataKey="lostCount" position="top" style={{ fill: '#f43f5e', fontSize: 10, fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grouped View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardViewMode === 'byTrack' ? (
          stats.byTrack.map((track: any) => (
            <div key={`track-stat-${track.id}`} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-800 text-lg">{track.name}</h3>
                  <div className="flex flex-col items-end gap-1">
                    {track.pendingCount > 0 && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase">
                        {track.pendingCount} Pendente{track.pendingCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {track.lostCount > 0 && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full uppercase">
                        {track.lostCount} Perdido{track.lostCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 space-y-6">
                {track.pendingSystems.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pendentes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {track.pendingSystems.map((system: any, idx: number) => (
                        <span key={`psys-${system.id || system.name}-${idx}`} className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100">
                          {system.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {track.lostSystems.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Acessos Perdidos
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {track.lostSystems.map((system: any, idx: number) => (
                        <span key={`lsys-${system.id || system.name}-${idx}`} className="px-2 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-100">
                          {system.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          stats.bySystem.map((system: any) => (
            <div key={`system-stat-${system.id}`} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-800 text-lg">{system.name}</h3>
                  <div className="flex flex-col items-end gap-1">
                    {system.pendingCount > 0 && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase">
                        {system.pendingCount} Pendente{system.pendingCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {system.lostCount > 0 && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full uppercase">
                        {system.lostCount} Perdido{system.lostCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 space-y-6">
                {system.pendingTracks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Esteiras Pendentes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {system.pendingTracks.map((track: any, idx: number) => (
                        <span key={`ptrack-${track.id || track.name}-${idx}`} className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100">
                          {track.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {system.lostTracks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Esteiras Perdidas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {system.lostTracks.map((track: any, idx: number) => (
                        <span key={`ltrack-${track.id || track.name}-${idx}`} className="px-2 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-100">
                          {track.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Empty State */}
      {((dashboardViewMode === 'byTrack' && stats.byTrack.length === 0) || 
        (dashboardViewMode === 'bySystem' && stats.bySystem.length === 0)) && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Tudo em ordem!</h3>
          <p className="text-slate-500">Não há pendências ou acessos perdidos no momento.</p>
        </div>
      )}
    </motion.div>
  );
}
