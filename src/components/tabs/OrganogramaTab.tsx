import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { Users, UserMinus, Filter, Maximize2, Minimize2, GripHorizontal, ChevronDown, ArrowLeft, Camera, FileSpreadsheet, Check, Loader2 } from 'lucide-react';
import { Analyst, Supervisor } from '../../types';
import { cn } from '../../lib/utils';
import { toPng } from 'html-to-image';
import * as XLSX from 'xlsx';

interface OrganogramaTabProps {
  key?: string;
  analysts: Analyst[];
  supervisors: Supervisor[];
  getAnalystDisplayName: (a: Analyst) => string;
  getAnalystEmail: (a: Analyst) => string;
  getAnalystInitials: (a: Analyst) => string;
}

interface HierarchyNode {
  id: string;
  name: string;
  type: 'supervisor' | 'analyst';
  track?: string;
  analystData?: Analyst;
  children: HierarchyNode[];
}

export default function OrganogramaTab({
  analysts,
  supervisors,
  getAnalystDisplayName,
  getAnalystEmail,
  getAnalystInitials
}: OrganogramaTabProps) {
  const [selectedRoot, setSelectedRoot] = useState<string>('');
  const [rootHistory, setRootHistory] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'ativos' | 'desligados' | 'todos'>('ativos');
  const [zoom, setZoom] = useState(0.8);
  const canvasRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying-image' | 'copied-image' | 'copying-excel' | 'copied-excel'>('idle');
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Build the tree (Limited to 1 level below root as requested)
  const buildTree = useCallback((rootName: string): HierarchyNode | null => {
    if (!rootName) return null;
    const cleanRootName = rootName.trim();

    const supervisorData = supervisors.find(s => s.name.trim().toLowerCase() === cleanRootName.toLowerCase());
    const analystData = analysts.find(a => getAnalystDisplayName(a).trim().toLowerCase() === cleanRootName.toLowerCase());

    const node: HierarchyNode = {
      id: analystData?.id || supervisorData?.id || `node-${cleanRootName}`,
      name: cleanRootName,
      type: analystData ? 'analyst' : 'supervisor',
      track: analystData ? analystData.track : undefined,
      analystData: analystData,
      children: []
    };

    // Find ONLY direct reports
    const reports = analysts.filter(a => {
      const supervisorMatch = (a.supervisor || '').trim().toLowerCase() === cleanRootName.toLowerCase();
      const isDeactivated = !!a.deactivatedAt;
      const statusMatch = 
        filterMode === 'todos' ? true :
        filterMode === 'ativos' ? !isDeactivated :
        isDeactivated;
      return supervisorMatch && statusMatch;
    });

    reports.forEach(report => {
      const reportName = getAnalystDisplayName(report);
      node.children.push({
        id: report.id,
        name: reportName,
        type: 'analyst',
        track: report.track,
        analystData: report,
        children: [] // Children will be loaded only if navigated into
      });
    });

    return node;
  }, [analysts, supervisors, filterMode, getAnalystDisplayName]);

  const tree = useMemo(() => buildTree(selectedRoot), [selectedRoot, buildTree]);

  const resetViewport = () => {
    x.set(0);
    y.set(0);
    setZoom(0.8);
  };

  const copyAsImage = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    setCopyStatus('copying-image');
    
    try {
      // Temporarily reset for capture
      const originalZoom = zoom;
      const originalX = x.get();
      const originalY = y.get();
      
      setZoom(1);
      x.set(0);
      y.set(0);

      // Wait for re-render
      await new Promise(resolve => setTimeout(resolve, 600));

      const bounds = exportRef.current.getBoundingClientRect();
      const exportWidth = Math.max(exportRef.current.scrollWidth, bounds.width);
      const exportHeight = Math.max(exportRef.current.scrollHeight, bounds.height);

      const blob = await toPng(exportRef.current, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc',
        style: {
          transform: 'scale(1)',
          margin: '0',
          padding: '80px', // Extra margin for the image
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: `${exportWidth}px`,
          height: `${exportHeight}px`
        },
        width: exportWidth + 160,
        height: exportHeight + 160,
        pixelRatio: 2
      });
      
      const response = await fetch(blob);
      const blobData = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blobData.type]: blobData
        })
      ]);

      // Restore
      setZoom(originalZoom);
      x.set(originalX);
      y.set(originalY);
      
      setCopyStatus('copied-image');
      setTimeout(() => setCopyStatus('idle'), 3000);
    } catch (err) {
      console.error('Erro ao copiar imagem:', err);
      setCopyStatus('idle');
    } finally {
      setIsExporting(false);
    }
  };

  const copyToExcel = async () => {
    if (!tree) return;
    setCopyStatus('copying-excel');

    // Build TSV (Tab Separated Values) and HTML table
    const headers = ['Esteira', 'Nome', 'Email'];
    const rowData: string[][] = [];
    
    // Root Row
    rowData.push([
        tree.track || '',
        tree.name,
        tree.analystData ? getAnalystEmail(tree.analystData) : ''
    ]);

    // Children Rows
    tree.children.forEach(child => {
        rowData.push([
            child.track || '',
            child.name,
            child.analystData ? getAnalystEmail(child.analystData) : ''
        ]);
    });

    const tsvContent = [headers.join('\t'), ...rowData.map(r => r.join('\t'))].join('\n');
    
    let htmlContent = '<table><thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    rowData.forEach(r => {
        htmlContent += '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>';
    });
    htmlContent += '</tbody></table>';
    
    try {
      const typeText = "text/plain";
      const typeHtml = "text/html";
      const blobText = new Blob([tsvContent], { type: typeText });
      const blobHtml = new Blob([htmlContent], { type: typeHtml });
      
      await navigator.clipboard.write([
        new ClipboardItem({ 
          [typeText]: blobText,
          [typeHtml]: blobHtml
        })
      ]);
      setCopyStatus('copied-excel');
      setTimeout(() => setCopyStatus('idle'), 3000);
    } catch (err) {
      console.error('Erro ao copiar dados via ClipboardItem, tentando fallback:', err);
      navigator.clipboard.writeText(tsvContent)
        .then(() => {
          setCopyStatus('copied-excel');
          setTimeout(() => setCopyStatus('idle'), 3000);
        })
        .catch(() => {
          setCopyStatus('idle');
        });
    }
  };

  const navigateToNode = (nodeName: string) => {
    if (!nodeName) return;
    const cleanName = nodeName.trim();
    if (cleanName.toLowerCase() === selectedRoot.trim().toLowerCase()) return;
    
    // Check if node has anyone reporting to them
    const hasSubordinates = analysts.some(a => (a.supervisor || '').trim().toLowerCase() === cleanName.toLowerCase());
    
    if (hasSubordinates) {
      setRootHistory(prev => [...prev, selectedRoot]);
      setSelectedRoot(cleanName);
      resetViewport();
    }
  };

  const goBack = () => {
    if (rootHistory.length === 0) return;
    const newHistory = [...rootHistory];
    const prevRoot = newHistory.pop()!;
    setRootHistory(newHistory);
    setSelectedRoot(prevRoot);
    resetViewport();
  };

  // Wheel zoom handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoom(prev => {
        const newZoom = Math.min(2, Math.max(0.1, prev + delta));
        return Math.round(newZoom * 20) / 20;
      });
    };

    canvas.addEventListener('wheel', onWheelNative, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheelNative);
  }, []);

  function OrgNode({ node, isRoot = false }: { node: HierarchyNode; isRoot?: boolean }) {
    // Check subordinates globally since children list in node is now only direct
    const actualSubordinates = useMemo(() => {
        return analysts.filter(a => (a.supervisor || '').trim().toLowerCase() === node.name.toLowerCase());
    }, [node.name]);
    
    const hasChildren = actualSubordinates.length > 0;
    
    const childrenRows = useMemo(() => {
      const rows = [];
      for (let i = 0; i < node.children.length; i += 10) {
        rows.push(node.children.slice(i, i + 10));
      }
      return rows;
    }, [node.children]);

    return (
      <div className="flex flex-col items-center">
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => {
            if (hasChildren && !isRoot) {
              e.stopPropagation();
              navigateToNode(node.name);
            }
          }}
          className={cn(
            "p-3 rounded-2xl border-2 shadow-sm min-w-[200px] text-center relative z-10 transition-all",
            isRoot ? "bg-indigo-600 border-indigo-500 text-white cursor-default" : 
            hasChildren ? "bg-white border-indigo-200 text-slate-800 hover:border-indigo-400 hover:shadow-md cursor-pointer ring-0 hover:ring-2 hover:ring-indigo-100" :
            node.type === 'supervisor' ? "bg-indigo-50 border-indigo-200 text-indigo-700 cursor-default" :
            node.analystData?.deactivatedAt 
              ? "bg-slate-50 border-slate-100 text-slate-400 cursor-default" 
              : "bg-white border-slate-200 text-slate-800 cursor-default"
          )}
        >
          <div className="flex flex-col items-center gap-1 pointer-events-none">
            {node.analystData ? (
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs mb-1",
                node.analystData.deactivatedAt 
                  ? "bg-slate-100 text-slate-400" 
                  : (isRoot ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-600 ")
              )}>
                {getAnalystInitials(node.analystData)}
              </div>
            ) : (
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs mb-1",
                isRoot ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-600 ")
              }>
                <Users className="w-5 h-5" />
              </div>
            )}
            
            <p className="font-bold text-xs truncate max-w-[180px]" title={node.name}>{node.name}</p>
            
            <div className="flex flex-col items-center">
              <p className={cn(
                "text-[9px] truncate max-w-[170px] font-bold uppercase tracking-wider",
                isRoot ? "text-indigo-100" : "text-indigo-500 "
              )}>
                {node.track || (node.type === 'supervisor' ? 'S/ Esteira' : '')}
              </p>
              {node.analystData && (
                <p className="text-[8px] opacity-50 truncate max-w-[170px] mt-0.5">{getAnalystEmail(node.analystData)}</p>
              )}
            </div>
          </div>
          
          {node.analystData?.deactivatedAt && (
            <div className="mt-1 flex items-center justify-center gap-1 text-[8px] text-rose-500 font-bold">
              <UserMinus className="w-2.5 h-2.5" /> DESLIGADO
            </div>
          )}

          {hasChildren && !isRoot && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-indigo-500 shadow-sm transition-transform hover:scale-110">
              <ChevronDown className="w-3 h-3" />
            </div>
          )}
        </motion.button>


        {isRoot && hasChildren && (
          <div className="relative pt-10 flex flex-col items-center">
            <div className="flex flex-col gap-0">
              {childrenRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex flex-col items-center relative">
                  <div className="flex flex-row flex-nowrap justify-center gap-x-8 gap-y-12 py-4 w-max">
                    {row.map((child) => (
                      <div key={child.id} className="relative pt-4">
                        <OrgNode node={child} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-140px)]"
    >
      <div className="bg-white p-4 rounded-t-3xl border-x border-t border-slate-200 shadow-sm space-y-4 z-20 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {rootHistory.length > 0 && (
              <button 
                onClick={goBack}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 text-slate-600 shadow-sm flex items-center gap-2 group"
                title="Voltar ao nível anterior"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-xs font-bold">Voltar</span>
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl transition-colors">
                <Users className="w-5 h-5 text-indigo-600 " />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 ">Organograma</h2>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Estrutura de Equipe</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex p-1 bg-slate-100 rounded-xl transition-colors">
              {(['ativos', 'desligados', 'todos'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                    filterMode === mode 
                      ? "bg-white text-indigo-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl transition-colors">
              <button 
                onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 shadow-sm transition-all"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold w-12 text-center text-slate-700 ">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 shadow-sm transition-all"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={resetViewport}
              className="px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-indigo-100 "
            >
              Centralizar
            </button>

            {selectedRoot && (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3 ml-1">
                <button 
                  onClick={copyAsImage}
                  disabled={isExporting || copyStatus === 'copied-image'}
                  className={cn(
                    "p-2 rounded-xl border transition-all flex items-center gap-2 group disabled:opacity-80 min-w-[120px] justify-center shadow-sm",
                    copyStatus === 'copied-image' 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600 " 
                      : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 "
                  )}
                  title="Copiar Organograma (Imagem)"
                >
                  {copyStatus === 'copying-image' ? (
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                  ) : copyStatus === 'copied-image' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Camera className="w-4 h-4 text-indigo-500" />
                  )}
                  <span className="text-[10px] font-bold uppercase">
                    {copyStatus === 'copying-image' ? 'Copiando...' : copyStatus === 'copied-image' ? 'Copiado!' : 'Copiar Imagem'}
                  </span>
                </button>
                <button 
                  onClick={copyToExcel}
                  disabled={copyStatus === 'copying-excel' || copyStatus === 'copied-excel'}
                  className={cn(
                    "p-2 rounded-xl border transition-all flex items-center gap-2 group disabled:opacity-80 min-w-[120px] justify-center shadow-sm",
                    copyStatus === 'copied-excel' 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600 " 
                      : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 "
                  )}
                  title="Copiar para Excel"
                >
                  {copyStatus === 'copying-excel' ? (
                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                  ) : copyStatus === 'copied-excel' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  )}
                  <span className="text-[10px] font-bold uppercase">
                    {copyStatus === 'copying-excel' ? 'Copiando...' : copyStatus === 'copied-excel' ? 'Copiado!' : 'Copiar Excel'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={selectedRoot}
            onChange={(e) => { 
              setSelectedRoot(e.target.value); 
              setRootHistory([]); 
              resetViewport(); 
            }}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none font-medium text-slate-800 "
          >
            <option value="">Selecione um Superior de topo (Coordenador/Supervisor)</option>
            {supervisors.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div 
        className="flex-1 bg-slate-50 border border-slate-200 rounded-b-3xl relative overflow-hidden transition-colors"
        ref={canvasRef}
      >
        <div className="absolute inset-0 opacity-[0.03] .05] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
        />

        {selectedRoot ? (
          <div className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing">
            <motion.div
              drag
              dragMomentum={false}
              style={{ x, y, scale: zoom }}
              className="flex items-start justify-center p-[800px] min-w-max"
            >
               {tree ? (
                 <div ref={exportRef} className="flex flex-col items-center w-max">
                   <OrgNode node={tree} isRoot={true} />
                 </div>
               ) : (
                 <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center">
                   <p className="text-slate-500 font-medium font-sans">Nenhum dado encontrado para o superior selecionado.</p>
                 </div>
               )}
            </motion.div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 ">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 ">
               <Users className="w-10 h-10 text-indigo-100 " />
            </div>
            <p className="font-bold text-lg text-slate-700 font-sans tracking-tight">Organograma Interativo</p>
            <p className="text-sm mt-1 max-w-xs text-center text-slate-400 font-sans">Selecione um gestor acima para visualizar a estrutura da equipe.</p>
          </div>
        )}
        
        {selectedRoot && (
          <div className="absolute bottom-6 right-6 flex flex-col gap-2">
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-2xl text-[10px] font-bold text-slate-600 shadow-lg flex items-center gap-3 font-sans">
              <GripHorizontal className="w-4 h-4 text-indigo-500" /> 
              <span className="uppercase tracking-widest opacity-80">Gire para Zoom • Arraste para Mover</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
