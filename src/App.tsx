/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Monitor, 
  ShieldCheck, 
  Plus, 
  Search, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Slash,
  Trash2,
  Edit2,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Menu,
  X,
  LogOut,
  Power,
  GripVertical,
  Move,
  Check,
  PlusCircle,
  ClipboardCheck,
  Download,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { ref, onValue, set, push, update, remove, get, query, orderByChild, limitToFirst, startAt, endAt } from 'firebase/database';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db, auth, firebaseConfig } from './lib/firebase';
import { logAction } from './lib/auditLogger';
import { logDb } from './lib/firebase';
import { cn } from './lib/utils';
import { Analyst, System, Access, AccessStatus, Track, FieldDefinition, User, Role, Permission, PERMISSIONS_LABELS, AccessRequest } from './types';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';
import Footer from './components/Footer';
import Toast, { ToastType } from './components/Toast';

// Mock Initial Data
const INITIAL_ANALYST_FIELDS: FieldDefinition[] = [
  { id: 'name', label: 'Nome', description: 'Identificação completa do colaborador.' },
  { id: 'email', label: 'E-mail', description: 'E-mail corporativo para contato.' },
  { id: 'track', label: 'Esteira', description: 'Vinculação operacional do analista.' },
];

const INITIAL_SYSTEM_FIELDS: FieldDefinition[] = [
  { id: 'name', label: 'Nome do Sistema', description: 'Nome comercial ou técnico da ferramenta.' },
  { id: 'description', label: 'Descrição', description: 'Finalidade e uso dentro da operação.' },
];
const INITIAL_SYSTEMS: System[] = [
  { id: '1', name: 'CRM Sales', description: 'Gestão de clientes e vendas' },
  { id: '2', name: 'ERP Financeiro', description: 'Controle de contas e notas' },
  { id: '3', name: 'Slack', description: 'Comunicação interna' },
  { id: '4', name: 'AWS Console', description: 'Infraestrutura cloud' },
  { id: '5', name: 'Zendesk', description: 'Suporte ao cliente' },
];

const INITIAL_TRACKS: Track[] = [
  { id: '1', name: 'Vendas' },
  { id: '2', name: 'Financeiro' },
  { id: '3', name: 'Suporte' },
  { id: '4', name: 'TI' },
  { id: '5', name: 'RH' },
];

const INITIAL_ANALYSTS: Analyst[] = [
  { id: '1', name: 'Ana Silva', email: 'ana.silva@empresa.com', track: 'Vendas', createdAt: new Date().toISOString() },
  { id: '2', name: 'Bruno Costa', email: 'bruno.costa@empresa.com', track: 'Financeiro', createdAt: new Date().toISOString() },
  { id: '3', name: 'Carla Souza', email: 'carla.souza@empresa.com', track: 'Suporte', createdAt: new Date().toISOString() },
];

const INITIAL_ACCESSES: Access[] = [
  { analystId: '1', systemId: '1', status: 'Ok', updatedAt: new Date().toISOString() },
  { analystId: '1', systemId: '3', status: 'Ok', updatedAt: new Date().toISOString() },
  { analystId: '2', systemId: '2', status: 'Pendente', updatedAt: new Date().toISOString() },
  { analystId: '3', systemId: '5', status: 'Acesso perdido', updatedAt: new Date().toISOString() },
];

const STATUS_CONFIG: Record<AccessStatus, { color: string; icon: React.ReactNode; label: string }> = {
  'Ok': { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Ok' },
  'Pendente': { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: <Clock className="w-4 h-4" />, label: 'Pendente' },
  'Acesso perdido': { color: 'text-rose-600 bg-rose-50 border-rose-100', icon: <AlertCircle className="w-4 h-4" />, label: 'Acesso perdido' },
};

const UserForm = ({ user, roles, onSave, onCancel, showToast }: { user: User | null, roles: Role[], onSave: (data: any) => Promise<void>, onCancel: () => void, showToast: (msg: string, type?: ToastType) => void }) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [selectedRole, setSelectedRole] = useState<string>(user?.roleId || '');
  const [permissions, setPermissions] = useState<Permission[]>(user?.permissions || []);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedRole) {
      const role = roles.find(r => r.id === selectedRole);
      if (role) {
        setPermissions(role.permissions);
      }
    }
  }, [selectedRole, roles]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!name || !email) {
      showToast("Erro: Nome e E-mail são obrigatórios.", "error");
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave({ name, email, roleId: selectedRole, permissions });
    } catch (err: any) {
      console.error("Erro no handleSubmit:", err);
      showToast("Erro ao salvar: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome</label>
        <input 
          value={name}
          onChange={(e) => setName(e.target.value)}
          required 
          disabled={isSaving}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50" 
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">E-mail</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
          disabled={isSaving}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50" 
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Perfil de Acesso (Template)</label>
        <select 
          value={selectedRole} 
          onChange={(e) => setSelectedRole(e.target.value)} 
          disabled={isSaving}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50"
        >
          <option value="">Personalizado</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
        <p className="text-[10px] text-slate-400 mt-1">Selecione um perfil para preencher as permissões automaticamente.</p>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Permissões do Usuário</h3>
        {Object.entries(PERMISSIONS_LABELS).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
            <input 
              type="checkbox" 
              checked={permissions.includes(key as Permission)}
              disabled={isSaving}
              onChange={(e) => {
                if (e.target.checked) {
                  setPermissions([...permissions, key as Permission]);
                } else {
                  setPermissions(permissions.filter(p => p !== key));
                }
                setSelectedRole(''); // Clear role selection if manually modified
              }}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 disabled:opacity-50"
            />
            <span className="text-sm font-medium text-slate-700">{label}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <button 
          type="button" 
          onClick={onCancel} 
          disabled={isSaving}
          className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button 
          type="button" 
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </>
          ) : 'Salvar'}
        </button>
      </div>
    </form>
  );
};

const DraggableFieldItem = ({ 
  field, 
  onEdit, 
  onDelete,
  isReordering
}: { 
  field: FieldDefinition; 
  onEdit: (field: FieldDefinition) => void; 
  onDelete: (id: string) => void;
  isReordering: boolean;
  key?: string;
}) => {
  const controls = useDragControls();

  const content = (
    <>
      {isReordering && (
        <div 
          onPointerDown={(e) => controls.start(e)}
          className="text-indigo-400 hover:text-indigo-600 transition-colors cursor-grab active:cursor-grabbing p-1 touch-none"
          title="Arraste para reordenar"
        >
          <GripVertical className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-xs font-bold uppercase mb-0.5",
          isReordering ? "text-indigo-400" : "text-slate-400"
        )}>Campo</p>
        <p className="font-bold text-slate-700 truncate">{field.label}</p>
        <p className="text-xs text-slate-500 truncate">{field.description}</p>
      </div>
      {!isReordering ? (
        <div className="flex gap-1">
          <button 
            onClick={() => onEdit(field)}
            className="p-2 bg-white text-indigo-600 border border-slate-200 rounded-xl shadow-sm hover:bg-indigo-50 transition-all cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(field.id)}
            className="p-2 bg-white text-rose-600 border border-slate-200 rounded-xl shadow-sm hover:bg-rose-50 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="w-8 h-8 flex items-center justify-center text-indigo-300">
          <Move className="w-4 h-4" />
        </div>
      )}
    </>
  );

  if (isReordering) {
    return (
      <Reorder.Item 
        value={field}
        dragListener={false}
        dragControls={controls}
        className="group p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200 flex items-center gap-4 shadow-sm"
      >
        {content}
      </Reorder.Item>
    );
  }

  return (
    <div className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-indigo-200 transition-colors">
      {content}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analysts' | 'systems' | 'dashboard' | 'settings' | 'request' | 'approvals' | 'extract'>('dashboard');
  const [dashboardViewMode, setDashboardViewMode] = useState<'byTrack' | 'bySystem'>('byTrack');
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [analystFields, setAnalystFields] = useState<FieldDefinition[]>(INITIAL_ANALYST_FIELDS);
  const [systemFields, setSystemFields] = useState<FieldDefinition[]>(INITIAL_SYSTEM_FIELDS);
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [selectedRequestForApproval, setSelectedRequestForApproval] = useState<AccessRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestSubTab, setRequestSubTab] = useState<'new' | 'my'>('new');
  const [editingRequest, setEditingRequest] = useState<AccessRequest | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [analystsLimit, setAnalystsLimit] = useState(20);
  const [hasMoreAnalysts, setHasMoreAnalysts] = useState(true);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setAnalystsLimit(20); // Reset limit on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [selectedAnalyst, setSelectedAnalyst] = useState<Analyst | null>(null);
  const [editingAnalyst, setEditingAnalyst] = useState<Analyst | null>(null);
  const [editingSystem, setEditingSystem] = useState<System | null>(null);
  const [editingField, setEditingField] = useState<{ type: 'analyst' | 'system', field: FieldDefinition } | null>(null);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [isAddingAnalyst, setIsAddingAnalyst] = useState(false);
  const [selectedSystemsInForm, setSelectedSystemsInForm] = useState<string[]>([]);
  const [isAddingSystem, setIsAddingSystem] = useState(false);
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const [isAddingField, setIsAddingField] = useState<{ type: 'analyst' | 'system' } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReorderingAnalystFields, setIsReorderingAnalystFields] = useState(false);
  const [isReorderingSystemFields, setIsReorderingSystemFields] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const [analystStatusFilter, setAnalystStatusFilter] = useState<'all' | 'active' | 'deactivated'>('active');
  const [logExportStartDate, setLogExportStartDate] = useState('');
  const [logExportEndDate, setLogExportEndDate] = useState('');
  const [logExportAllTime, setLogExportAllTime] = useState(true);
  const [tempAnalystFields, setTempAnalystFields] = useState<FieldDefinition[]>([]);
  const [tempSystemFields, setTempSystemFields] = useState<FieldDefinition[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmColor?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirmar', confirmColor: 'bg-rose-600' });

  // Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (user?.email) {
      await logAction(user.email, 'LOGOUT', 'Realizou logout do sistema', 'Autenticação');
    }
    await signOut(auth);
  };

  // Firebase Real-time Sync
  useEffect(() => {
    const refs = {
      analysts: ref(db, 'analysts'),
      systems: ref(db, 'systems'),
      tracks: ref(db, 'tracks'),
      accesses: ref(db, 'accesses'),
      analystFields: ref(db, 'config/analystFields'),
      systemFields: ref(db, 'config/systemFields'),
      users: ref(db, 'users'),
      roles: ref(db, 'roles'),
      requests: ref(db, 'requests'),
    };

    // Query for analysts with pagination and search
    let analystsQuery;
    if (debouncedSearchQuery) {
      analystsQuery = query(
        refs.analysts,
        orderByChild('name'),
        startAt(debouncedSearchQuery),
        endAt(debouncedSearchQuery + '\uf8ff'),
        limitToFirst(analystsLimit)
      );
    } else {
      analystsQuery = query(
        refs.analysts,
        orderByChild('name'),
        limitToFirst(analystsLimit)
      );
    }

    const unsubscribes = [
      onValue(refs.users, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.entries(data).map(([id, val]: [string, any]) => ({ ...val, id }));
          setUsers(list);
        } else {
          setUsers([]);
        }
      }),
      onValue(refs.roles, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.entries(data).map(([id, val]: [string, any]) => ({ ...val, id }));
          setRoles(list);
        } else {
          // Seed default roles
          const defaultRoles: Role[] = [
            {
              id: 'admin',
              name: 'Administrador Geral',
              permissions: [
                'settings_analyst_fields',
                'settings_system_fields',
                'settings_tracks',
                'systems_manage',
                'analysts_manage',
                'analysts_access_status',
                'request_access',
                'approve_access',
                'extract_data'
              ],
              isSystem: true
            },
            {
              id: 'supervisor',
              name: 'Supervisor',
              permissions: ['analysts_access_status', 'approve_access'],
              isSystem: true
            },
            {
              id: 'treinador',
              name: 'Treinador',
              permissions: ['analysts_access_status'],
              isSystem: true
            },
            {
              id: 'requester',
              name: 'Solicitante',
              permissions: ['request_access'],
              isSystem: true
            }
          ];
          defaultRoles.forEach(role => set(ref(db, `roles/${role.id}`), role));
        }
      }),
      onValue(refs.requests, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.entries(data).map(([id, val]: [string, any]) => ({ ...val, id }));
          setRequests(list);
        } else {
          setRequests([]);
        }
      }),
      onValue(analystsQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.entries(data).map(([id, val]: [string, any]) => ({ ...val, id }));
          // Sort by name locally as startAt/endAt might return unsorted results if not careful
          const sortedList = list.sort((a, b) => a.name.localeCompare(b.name));
          setAnalysts(sortedList);
          setHasMoreAnalysts(list.length >= analystsLimit);
        } else {
          setAnalysts([]);
          setHasMoreAnalysts(false);
        }
      }),
      onValue(refs.systems, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.entries(data).map(([id, val]: [string, any]) => ({ ...val, id }));
          setSystems(list);
        } else {
          setSystems([]);
        }
      }),
      onValue(refs.tracks, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.entries(data).map(([id, val]: [string, any]) => ({ ...val, id }));
          setTracks(list);
        } else {
          setTracks([]);
        }
      }),
      onValue(refs.accesses, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.values(data) as Access[];
          setAccesses(list);
        } else {
          setAccesses([]);
        }
      }),
      onValue(refs.analystFields, (snapshot) => {
        const data = snapshot.val();
        if (data) setAnalystFields(data);
      }),
      onValue(refs.systemFields, (snapshot) => {
        const data = snapshot.val();
        if (data) setSystemFields(data);
      })
    ];

    setIsLoading(false);
    return () => unsubscribes.forEach(unsub => unsub());
  }, [analystsLimit, debouncedSearchQuery]);

  const filteredAnalysts = useMemo(() => {
    return analysts.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           a.track.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = analystStatusFilter === 'all' || 
                           (analystStatusFilter === 'active' && !a.deactivatedAt) ||
                           (analystStatusFilter === 'deactivated' && !!a.deactivatedAt);
      
      return matchesSearch && matchesStatus;
    });
  }, [analysts, searchQuery, analystStatusFilter]);

  const stats = useMemo(() => {
    const totalAccesses = accesses.length;
    const okCount = accesses.filter(a => a.status === 'Ok').length;
    const pendingCount = accesses.filter(a => a.status === 'Pendente').length;
    const lostCount = accesses.filter(a => a.status === 'Acesso perdido').length;

    // Group by Track (Access-First approach for maximum reliability)
    const trackGroups: Record<string, any> = {};
    
    accesses.forEach(acc => {
      if (acc.status === 'Ok') return;
      
      const analyst = analysts.find(a => a.id === acc.analystId);
      const trackName = analyst?.track?.trim() || 'Sem Esteira';
      const system = systems.find(s => s.id === acc.systemId);
      
      if (!trackGroups[trackName]) {
        const officialTrack = tracks.find(t => t.name.trim().toLowerCase() === trackName.toLowerCase());
        trackGroups[trackName] = {
          id: officialTrack?.id || `virtual-${trackName}`,
          name: officialTrack ? officialTrack.name : `${trackName}${trackName !== 'Sem Esteira' ? ' (Não Cadastrada)' : ''}`,
          pendingCount: 0,
          lostCount: 0,
          pendingSystems: [],
          lostSystems: []
        };
      }
      
      if (acc.status === 'Pendente') {
        trackGroups[trackName].pendingCount++;
        if (system && !trackGroups[trackName].pendingSystems.find((s: any) => s.id === system.id)) {
          trackGroups[trackName].pendingSystems.push(system);
        }
      } else if (acc.status === 'Acesso perdido') {
        trackGroups[trackName].lostCount++;
        if (system && !trackGroups[trackName].lostSystems.find((s: any) => s.id === system.id)) {
          trackGroups[trackName].lostSystems.push(system);
        }
      }
    });
    
    const byTrack = Object.values(trackGroups);

    // Group by System (Access-First approach)
    const systemGroups: Record<string, any> = {};
    
    accesses.forEach(acc => {
      if (acc.status === 'Ok') return;
      
      const system = systems.find(s => s.id === acc.systemId);
      const systemName = system?.name || 'Sistema Desconhecido';
      const analyst = analysts.find(a => a.id === acc.analystId);
      const trackName = analyst?.track?.trim() || 'Sem Esteira';
      const track = tracks.find(t => t.name.trim().toLowerCase() === trackName.toLowerCase()) || { id: `virtual-${trackName}`, name: trackName };
      
      if (!systemGroups[systemName]) {
        systemGroups[systemName] = {
          id: system?.id || `virtual-sys-${systemName}`,
          name: systemName,
          pendingCount: 0,
          lostCount: 0,
          pendingTracks: [],
          lostTracks: []
        };
      }
      
      if (acc.status === 'Pendente') {
        systemGroups[systemName].pendingCount++;
        if (!systemGroups[systemName].pendingTracks.find((t: any) => t.name === track.name)) {
          systemGroups[systemName].pendingTracks.push(track);
        }
      } else if (acc.status === 'Acesso perdido') {
        systemGroups[systemName].lostCount++;
        if (!systemGroups[systemName].lostTracks.find((t: any) => t.name === track.name)) {
          systemGroups[systemName].lostTracks.push(track);
        }
      }
    });
    
    const bySystem = Object.values(systemGroups);

    return { totalAccesses, okCount, pendingCount, lostCount, byTrack, bySystem };
  }, [accesses, analysts, systems, tracks]);

  const handleUpdateAccess = (analystId: string, systemId: string, status: AccessStatus) => {
    if (!canManageAccess) return;
    
    const currentUserData = users.find(u => u.id === user?.uid);
    const userRole = roles.find(r => r.id === currentUserData?.roleId);
    
    // Check if the user has the permission to change status
    const canChangeStatus = currentUserData?.roleId === 'admin' || 
                           currentUserData?.permissions?.includes('analysts_access_status') ||
                           userRole?.permissions?.includes('analysts_access_status');
                           
    // Check if the user has the permission to approve (Admins and Supervisors)
    const canApprove = currentUserData?.roleId === 'admin' || 
                      currentUserData?.permissions?.includes('approve_access') ||
                      userRole?.permissions?.includes('approve_access');

    // Check if the role is explicitly "Treinador"
    const isTreinadorRole = currentUserData?.roleId === 'treinador' || 
                           userRole?.name.toLowerCase() === 'treinador';

    // If they are a Treinador OR (can change status but CANNOT approve), they need approval
    const needsApproval = isTreinadorRole || (canChangeStatus && !canApprove);
    
    // Safety check: Admins and Supervisors NEVER need approval for status changes
    const isPrivileged = currentUserData?.roleId === 'admin' || canApprove;
    const finalNeedsApproval = needsApproval && !isPrivileged;

    const oldAccess = accesses.find(a => a.analystId === analystId && a.systemId === systemId);
    const analyst = analysts.find(a => a.id === analystId);
    const system = systems.find(s => s.id === systemId);

    if (finalNeedsApproval) {
      const requestId = push(ref(db, 'requests')).key || Math.random().toString(36).substring(2, 15);
      const requestNumber = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const requestData: AccessRequest = {
        id: requestId,
        requestNumber,
        type: 'status_change',
        status: 'pending',
        requestedBy: user?.uid || '',
        requestedByName: currentUserData?.name || user?.email || 'Treinador',
        requestedAt: new Date().toISOString(),
        analystData: {
          name: analyst?.name || 'Analista Desconhecido',
          email: analyst?.email || ''
        },
        statusChangeData: {
          analystId,
          systemId,
          newStatus: status,
          oldStatus: oldAccess?.status || 'Pendente'
        }
      };

      set(ref(db, `requests/${requestId}`), requestData).then(() => {
        showToast(`Solicitação de mudança de status (${requestNumber}) enviada para aprovação.`, "success");
        if (user?.email) {
          logAction(
            user.email, 
            'CREATE_REQUEST', 
            `Solicitou mudança de status do sistema ${system?.name || systemId} para o analista ${analyst?.name || analystId}: ${status}`, 
            'Solicitações',
            null,
            requestData
          );
        }
      });
      return;
    }

    const accessRef = ref(db, `accesses/${analystId}_${systemId}`);
    
    const newData = {
      analystId,
      systemId,
      status,
      updatedAt: new Date().toISOString()
    };

    set(accessRef, newData).then(() => {
      if (user?.email && oldAccess?.status !== status) {
        logAction(
          user.email, 
          'UPDATE_ACCESS_STATUS', 
          `Alterou status do sistema ${system?.name || systemId} para o analista ${analyst?.name || analystId}: ${status}`, 
          'Analistas',
          oldAccess || { status: 'N/A' },
          newData
        );
      }
    });
  };

  useEffect(() => {
    if (isAddingAnalyst && editingAnalyst) {
      const currentSystems = accesses
        .filter(a => a.analystId === editingAnalyst.id)
        .map(a => a.systemId);
      setSelectedSystemsInForm(currentSystems);
    } else if (isAddingAnalyst) {
      setSelectedSystemsInForm([]);
    }
  }, [isAddingAnalyst, editingAnalyst, accesses]);

  const handleAddAnalyst = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canManageAnalysts && !canManageAccess) return;
    const formData = new FormData(e.currentTarget);
    
    const analystData: any = {};
    analystFields.forEach(field => {
      analystData[field.id] = formData.get(field.id) as string;
    });

    let analystId = editingAnalyst?.id;

    if (editingAnalyst) {
      if (editingAnalyst.deactivatedAt) {
        showToast("Este analista está desligado e não pode ser editado.", "error");
        return;
      }
      if (canManageAnalysts) {
        await update(ref(db, `analysts/${editingAnalyst.id}`), analystData);
        if (user?.email) {
          await logAction(
            user.email, 
            'EDIT_ANALYST', 
            `Editou dados do analista: ${analystData.name || editingAnalyst.name}`, 
            'Analistas',
            editingAnalyst,
            { ...editingAnalyst, ...analystData }
          );
        }
      }
      setEditingAnalyst(null);
    } else if (canManageAnalysts) {
      analystId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      await set(ref(db, `analysts/${analystId}`), { ...analystData, id: analystId, createdAt });
      if (user?.email) {
        await logAction(user.email, 'CREATE_ANALYST', `Criou analista: ${analystData.name}`, 'Analistas');
      }
    }

    // Update Accesses
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
    }

    setIsAddingAnalyst(false);
    setSelectedSystemsInForm([]);
    showToast(editingAnalyst ? "Analista atualizado com sucesso!" : "Analista criado com sucesso!", "success");
  };

  const handleRequestAccess = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasPermission('request_access')) return;
    
    if (selectedSystemsInForm.length === 0) {
      showToast("Selecione pelo menos um sistema.", "error");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const analystData: any = {};
    let hasEmptyFields = false;
    
    analystFields.forEach(field => {
      const value = formData.get(field.id) as string;
      if (!value && field.id !== 'rejectionReason') { // rejectionReason is not part of the form fields usually
        hasEmptyFields = true;
      }
      analystData[field.id] = value;
    });

    if (hasEmptyFields) {
      // Browser validation should catch this if 'required' is set, but extra safety
      // showToast("Preencha todos os campos obrigatórios.", "error");
      // return;
    }

    setConfirmModal({
      isOpen: true,
      title: editingRequest ? 'Confirmar Ajuste' : 'Confirmar Solicitação',
      message: editingRequest 
        ? 'Deseja reenviar esta solicitação com os novos dados?' 
        : 'Deseja enviar esta solicitação para aprovação?',
      confirmText: editingRequest ? 'Reenviar' : 'Enviar',
      confirmColor: 'bg-indigo-600',
      onConfirm: () => executeRequestAccess(analystData)
    });
  };

  const executeRequestAccess = async (analystData: any) => {
    try {
      const requestId = editingRequest ? editingRequest.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
      const requestedAt = editingRequest ? editingRequest.requestedAt : new Date().toISOString();
      const currentUserData = users.find(u => u.id === user?.uid);
      
      // Generate a request number if it doesn't exist (new request)
      const requestNumber = editingRequest?.requestNumber || `REQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const request: any = {
        id: requestId,
        requestNumber,
        type: 'new_analyst',
        analystData,
        systemIds: selectedSystemsInForm,
        status: 'pending',
        requestedBy: user?.uid || '',
        requestedByName: currentUserData?.name || user?.email || 'Desconhecido',
        requestedAt
      };

      // Ensure no undefined values are sent to Firebase
      Object.keys(request).forEach(key => {
        if (request[key] === undefined) delete request[key];
      });

      await set(ref(db, `requests/${requestId}`), request);
      
      if (user?.email) {
        await logAction(user.email, editingRequest ? 'RESUBMIT_REQUEST' : 'CREATE_REQUEST', `${editingRequest ? 'Reenviou' : 'Criou'} solicitação ${requestNumber} para o analista ${analystData.name}`, 'Solicitações');
      }
      
      setSelectedSystemsInForm([]);
      const wasEditing = !!editingRequest;
      setEditingRequest(null);
      setRequestSubTab('my');
      showToast(wasEditing ? "Solicitação atualizada e enviada!" : "Solicitação enviada para aprovação!", "success");
    } catch (error) {
      console.error("Error sending request:", error);
      showToast("Erro ao enviar solicitação. Tente novamente.", "error");
    }
  };

  const handleApproveRequest = async (request: AccessRequest) => {
    if (!hasPermission('approve_access')) return;
    
    const currentUserData = users.find(u => u.id === user?.uid);

    if (request.type === 'status_change' && request.statusChangeData) {
      const { analystId, systemId, newStatus } = request.statusChangeData;
      const analyst = analysts.find(a => a.id === analystId);
      const system = systems.find(s => s.id === systemId);
      
      const accessRef = ref(db, `accesses/${analystId}_${systemId}`);
      const newData = {
        analystId,
        systemId,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      await set(accessRef, newData);

      // Update Request
      await update(ref(db, `requests/${request.id}`), {
        status: 'approved',
        approvedBy: user?.uid || '',
        approvedByName: currentUserData?.name || user?.email || 'Desconhecido',
        approvedAt: new Date().toISOString()
      });

      if (user?.email) {
        await logAction(
          user.email, 
          'APPROVE_REQUEST', 
          `Aprovou mudança de status do sistema ${system?.name || systemId} para o analista ${analyst?.name || analystId}: ${newStatus}`, 
          'Solicitações',
          request,
          newData
        );
      }

      setSelectedRequestForApproval(null);
      showToast("Mudança de status aprovada!", "success");
      return;
    }

    const analystId = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
    const createdAt = new Date().toISOString();

    // Create Analyst
    const analystData: any = { 
      ...request.analystData, 
      id: analystId, 
      createdAt,
      approvedBy: user?.uid || '',
      approvedByName: currentUserData?.name || user?.email || 'Desconhecido'
    };

    // Ensure no undefined values
    Object.keys(analystData).forEach(key => {
      if (analystData[key] === undefined) delete analystData[key];
    });

    await set(ref(db, `analysts/${analystId}`), analystData);

    // Create Accesses
    if (request.systemIds) {
      for (const systemId of request.systemIds) {
        await set(ref(db, `accesses/${analystId}_${systemId}`), {
          analystId,
          systemId,
          status: 'Pendente',
          updatedAt: new Date().toISOString()
        });
      }
    }

    // Update Request
    await update(ref(db, `requests/${request.id}`), {
      status: 'approved',
      approvedBy: user?.uid || '',
      approvedByName: currentUserData?.name || user?.email || 'Desconhecido',
      approvedAt: new Date().toISOString()
    });

    if (user?.email) {
      await logAction(
        user.email, 
        'APPROVE_REQUEST', 
        `Aprovou solicitação ${request.requestNumber} para o analista ${analystData.name}`, 
        'Solicitações',
        request,
        analystData
      );
    }

    setSelectedRequestForApproval(null);
    showToast("Solicitação aprovada e analista criado!", "success");
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    if (!hasPermission('approve_access')) return;
    
    if (!reason || !reason.trim()) {
      showToast("O motivo da rejeição é obrigatório.", "error");
      return;
    }

    const currentUserData = users.find(u => u.id === user?.uid);

    await update(ref(db, `requests/${requestId}`), {
      status: 'rejected',
      approvedBy: user?.uid || '',
      approvedByName: currentUserData?.name || user?.email || 'Desconhecido',
      approvedAt: new Date().toISOString(),
      rejectionReason: reason.trim()
    });

    if (user?.email) {
      const request = requests.find(r => r.id === requestId);
      const newData = {
        status: 'rejected',
        approvedBy: user?.uid || '',
        approvedByName: currentUserData?.name || user?.email || 'Desconhecido',
        approvedAt: new Date().toISOString(),
        rejectionReason: reason.trim()
      };
      await logAction(
        user.email, 
        'REJECT_REQUEST', 
        `Rejeitou solicitação ${request?.requestNumber || requestId}. Motivo: ${reason.trim()}`, 
        'Solicitações',
        request,
        { ...request, ...newData }
      );
    }

    setSelectedRequestForApproval(null);
    setRejectionReason('');
    showToast("Solicitação rejeitada.", "info");
  };

  const deactivateAnalyst = (id: string) => {
    if (!canManageAnalysts) return;
    const analyst = analysts.find(a => a.id === id);
    if (!analyst) return;
    if (analyst.deactivatedAt) return;

    setConfirmModal({
      isOpen: true,
      title: 'Desligar Analista',
      message: `Tem certeza que deseja desligar o analista ${analyst.name}? Após o desligamento, os dados não poderão ser alterados nem excluídos.`,
      confirmText: 'Desligar',
      confirmColor: 'bg-rose-600',
      onConfirm: async () => {
        try {
          await update(ref(db, `analysts/${id}`), { 
            deactivatedAt: new Date().toISOString() 
          });
          if (user?.email) {
            await logAction(user.email, 'DEACTIVATE_ANALYST', `Desligou o analista: ${analyst.name}`, 'Analistas');
          }
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          showToast("Analista desligado com sucesso!", "success");
        } catch (error: any) {
          showToast("Erro ao desligar analista: " + error.message, "error");
        }
      }
    });
  };

  const handleAddSystem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canManageSystems) return;
    const formData = new FormData(e.currentTarget);
    
    const systemData: any = {};
    systemFields.forEach(field => {
      systemData[field.id] = formData.get(field.id) as string;
    });

    if (editingSystem) {
      update(ref(db, `systems/${editingSystem.id}`), systemData);
      if (user?.email) {
        logAction(
          user.email, 
          'EDIT_SYSTEM', 
          `Editou o sistema: ${systemData.name || editingSystem.name}`, 
          'Sistemas',
          editingSystem,
          { ...editingSystem, ...systemData }
        );
      }
      setEditingSystem(null);
    } else {
      const id = crypto.randomUUID();
      set(ref(db, `systems/${id}`), { ...systemData, id });
      if (user?.email) {
        logAction(user.email, 'CREATE_SYSTEM', `Criou o sistema: ${systemData.name}`, 'Sistemas');
      }
    }
    setIsAddingSystem(false);
  };

  const deleteAnalyst = (id: string) => {
    if (!canManageAnalysts) return;
    const analyst = analysts.find(a => a.id === id);
    if (analyst?.deactivatedAt) {
      showToast("Analistas desligados não podem ser excluídos.", "error");
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Analista',
      message: 'Tem certeza que deseja excluir este analista? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      confirmColor: 'bg-rose-600',
      onConfirm: async () => {
        try {
          await remove(ref(db, `analysts/${id}`));
          if (user?.email) {
            await logAction(user.email, 'DELETE_ANALYST', `Excluiu o analista: ${analyst.name}`, 'Analistas');
          }
          const accessesToRemove = accesses.filter(a => a.analystId === id);
          for (const access of accessesToRemove) {
            await remove(ref(db, `accesses/${access.analystId}_${access.systemId}`));
          }
          if (selectedAnalyst?.id === id) setSelectedAnalyst(null);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          showToast("Analista excluído com sucesso!", "success");
        } catch (error) {
          console.error("Error deleting analyst:", error);
          showToast("Erro ao excluir analista. Tente novamente.", "error");
        }
      }
    });
  };

  const deleteSystem = (id: string) => {
    if (!canManageSystems) return;
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Sistema',
      message: 'Tem certeza que deseja excluir este sistema? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      confirmColor: 'bg-rose-600',
      onConfirm: async () => {
        try {
          await remove(ref(db, `systems/${id}`));
          if (user?.email) {
            const system = systems.find(s => s.id === id);
            await logAction(user.email, 'DELETE_SYSTEM', `Excluiu o sistema: ${system?.name || id}`, 'Sistemas');
          }
          const accessesToRemove = accesses.filter(a => a.systemId === id);
          for (const access of accessesToRemove) {
            await remove(ref(db, `accesses/${access.analystId}_${access.systemId}`));
          }
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          showToast("Sistema excluído com sucesso!", "success");
        } catch (error) {
          console.error("Error deleting system:", error);
          showToast("Erro ao excluir sistema. Tente novamente.", "error");
        }
      }
    });
  };

  const deleteTrack = (track: Track) => {
    if (!hasPermission('settings_tracks')) return;
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Esteira',
      message: `Tem certeza que deseja excluir a esteira "${track.name}"?`,
      confirmText: 'Excluir',
      confirmColor: 'bg-rose-600',
      onConfirm: async () => {
        try {
          await remove(ref(db, `tracks/${track.id}`));
          if (user?.email) {
            await logAction(user.email, 'DELETE_TRACK', `Excluiu a esteira: ${track.name}`, 'Configurações');
          }
          const analystsToUpdate = analysts.filter(a => a.track === track.name);
          for (const analyst of analystsToUpdate) {
            await update(ref(db, `analysts/${analyst.id}`), { track: '' });
          }
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          showToast("Esteira excluída com sucesso!", "success");
        } catch (error) {
          console.error("Error deleting track:", error);
          showToast("Erro ao excluir esteira. Tente novamente.", "error");
        }
      }
    });
  };

  const handleAddField = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isAddingField?.type === 'analyst' && !hasPermission('settings_analyst_fields')) return;
    if (isAddingField?.type === 'system' && !hasPermission('settings_system_fields')) return;

    const formData = new FormData(e.currentTarget);
    const id = formData.get('id') as string;
    const label = formData.get('label') as string;
    const description = formData.get('description') as string;

    if (isAddingField?.type === 'analyst') {
      const newFields = [...analystFields, { id, label, description }];
      set(ref(db, 'config/analystFields'), newFields);
      if (user?.email) {
        logAction(user.email, 'ADD_ANALYST_FIELD', `Adicionou campo de analista: ${label}`, 'Configurações');
      }
    } else if (isAddingField?.type === 'system') {
      const newFields = [...systemFields, { id, label, description }];
      set(ref(db, 'config/systemFields'), newFields);
      if (user?.email) {
        logAction(user.email, 'ADD_SYSTEM_FIELD', `Adicionou campo de sistema: ${label}`, 'Configurações');
      }
    }
    setIsAddingField(null);
  };

  const handleAddUser = async (userData: { name: string, email: string, roleId: string, permissions: Permission[] }) => {
    if (!hasPermission('settings_users')) {
      showToast("Erro: Você não tem permissão para realizar esta ação.", "error");
      return;
    }
    
    const { name, email, roleId, permissions } = userData;

    if (editingUser) {
      try {
        const newData = { name, email, roleId, permissions };
        await update(ref(db, `users/${editingUser.id}`), newData);
        if (user?.email) {
          await logAction(
            user.email, 
            'EDIT_USER', 
            `Editou o usuário: ${name} (${email})`, 
            'Configurações',
            editingUser,
            { ...editingUser, ...newData }
          );
        }
        setEditingUser(null);
        setIsAddingUser(false);
      } catch (error: any) {
        console.error("Erro ao atualizar usuário:", error);
        showToast("Erro ao atualizar usuário: " + error.message, "error");
      }
    } else {
      const password = 'InterFile123$$';
      
      try {
        const appName = `Secondary-${Date.now()}`;
        const secondaryApp = initializeApp(firebaseConfig, appName);
        const secondaryAuth = getAuth(secondaryApp);
        
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const uid = userCredential.user.uid;
        
        await set(ref(db, `users/${uid}`), { 
          id: uid, 
          name, 
          email, 
          roleId, 
          permissions, 
          mustChangePassword: true 
        });
        
        if (user?.email) {
          await logAction(user.email, 'CREATE_USER', `Criou o usuário: ${name} (${email})`, 'Configurações');
        }
        
        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);
        
        setIsAddingUser(false);
      } catch (error: any) {
        console.error("Erro ao criar usuário:", error);
        let errorMsg = "Erro desconhecido.";
        
        if (error.code === 'auth/email-already-in-use') {
          errorMsg = "Este e-mail já está em uso por outro usuário.";
        } else if (error.code === 'auth/invalid-email') {
          errorMsg = "O formato do e-mail é inválido.";
        } else if (error.code === 'auth/weak-password') {
          errorMsg = "A senha é muito fraca.";
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMsg = "O método de login por e-mail/senha não está ativado no Firebase Console.";
        } else if (error.code === 'permission-denied') {
          errorMsg = "Permissão negada no banco de dados. Verifique as regras de segurança.";
        } else {
          errorMsg = error.message || error.code || "Erro sem mensagem definida.";
        }
        
        showToast("Falha ao criar usuário: " + errorMsg, "error");
      }
    }
  };

  const handleAddRole = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasPermission('settings_roles')) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const permissions = Array.from(formData.getAll('permissions')) as Permission[];

    if (editingRole) {
      const affectedUsers = users.filter(u => u.roleId === editingRole.id);
      if (affectedUsers.length > 0) {
          setConfirmModal({
              isOpen: true,
              title: 'Alterar Perfil',
              message: `Esta alteração afetará ${affectedUsers.length} usuários. Deseja continuar?`,
              confirmText: 'Confirmar',
              confirmColor: 'bg-indigo-600',
              onConfirm: () => {
                  const newData = { name, permissions };
                  update(ref(db, `roles/${editingRole.id}`), newData);
                  if (user?.email) {
                    logAction(
                      user.email, 
                      'EDIT_ROLE', 
                      `Editou o perfil: ${name}`, 
                      'Configurações',
                      editingRole,
                      { ...editingRole, ...newData }
                    );
                  }
                  setEditingRole(null);
                  setIsAddingRole(false);
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
              }
          });
          return;
      }
      
      const newData = { name, permissions };
      update(ref(db, `roles/${editingRole.id}`), newData);
      if (user?.email) {
        logAction(
          user.email, 
          'EDIT_ROLE', 
          `Editou o perfil: ${name}`, 
          'Configurações',
          editingRole,
          { ...editingRole, ...newData }
        );
      }
      setEditingRole(null);
    } else {
      const id = crypto.randomUUID();
      set(ref(db, `roles/${id}`), { id, name, permissions, isSystem: false });
      if (user?.email) {
        logAction(user.email, 'CREATE_ROLE', `Criou o perfil: ${name}`, 'Configurações');
      }
    }
    setIsAddingRole(false);
  };

  const deleteUser = (id: string) => {
      if (!hasPermission('settings_users')) return;
      setConfirmModal({
          isOpen: true,
          title: 'Excluir Usuário',
          message: 'Tem certeza que deseja excluir este usuário? Isso removerá o acesso permanentemente.',
          confirmText: 'Excluir',
          confirmColor: 'bg-rose-600',
          onConfirm: async () => {
              try {
                  // Remove apenas do Realtime Database
                  await remove(ref(db, `users/${id}`));
                  if (user?.email) {
                    const deletedUser = users.find(u => u.id === id);
                    await logAction(user.email, 'DELETE_USER', `Excluiu o usuário: ${deletedUser?.name || id} (${deletedUser?.email || ''})`, 'Configurações');
                  }
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  showToast("Usuário removido do banco de dados com sucesso!", "success");
              } catch (error: any) {
                  console.error("Erro ao excluir usuário:", error);
                  showToast("Erro ao excluir usuário: " + error.message, "error");
              }
          }
      });
  };

  const deleteRole = (role: Role) => {
      if (!hasPermission('settings_roles')) return;
      const assignedUsers = users.filter(u => u.roleId === role.id);
      if (assignedUsers.length > 0) {
          showToast(`Não é possível excluir este perfil pois existem ${assignedUsers.length} usuários vinculados a ele.`, "error");
          return;
      }

      setConfirmModal({
          isOpen: true,
          title: 'Excluir Perfil',
          message: 'Tem certeza que deseja excluir este perfil?',
          confirmText: 'Excluir',
          confirmColor: 'bg-rose-600',
          onConfirm: async () => {
              await remove(ref(db, `roles/${role.id}`));
              if (user?.email) {
                await logAction(user.email, 'DELETE_ROLE', `Excluiu o perfil: ${role.name}`, 'Configurações');
              }
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
              showToast("Perfil excluído com sucesso!", "success");
          }
      });
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      showToast("Não há dados para exportar.", "error");
      return;
    }

    const headers = Object.keys(data[0]);
    const separator = ';'; // Semicolon is standard for Excel in Brazil
    const csvRows = [
      headers.join(separator),
      ...data.map(row => headers.map(header => {
        const val = row[header];
        if (val === null || val === undefined) return '';
        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
      }).join(separator))
    ];
    
    const csvContent = csvRows.join('\r\n'); // Use \r\n for better Excel compatibility

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportData = async (type: 'analysts' | 'systems' | 'users' | 'tracks' | 'accesses' | 'logs') => {
    if (type === 'logs' && !hasPermission('extract_logs')) return;
    if (type !== 'logs' && !hasPermission('extract_data')) return;
    
    showToast("Preparando exportação...", "info");
    
    try {
      let dataToExport: any[] = [];
      let filename = '';

      switch (type) {
        case 'analysts':
          const analystsSnapshot = await get(ref(db, 'analysts'));
          const analystsData = analystsSnapshot.val();
          if (analystsData) {
            const analystsList = Object.values(analystsData) as any[];
            
            // 1. Identify all headers
            const headersSet = new Set(['Nome', 'Email', 'Esteira', 'Data de Criação', 'Data de Desligamento', 'Aprovado Por']);
            analystFields.forEach(f => {
               if (!['name', 'email', 'track', 'createdAt', 'deactivatedAt', 'approvedByName'].includes(f.id)) {
                 headersSet.add(f.label);
               }
            });
            // Add any other keys found in data
            analystsList.forEach(val => {
              Object.keys(val).forEach(key => {
                if (!['id', 'name', 'email', 'track', 'createdAt', 'deactivatedAt', 'approvedBy', 'approvedByName'].includes(key)) {
                  const field = analystFields.find(f => f.id === key);
                  headersSet.add(field?.label || key);
                }
              });
            });
            const allHeaders = Array.from(headersSet);

            // 2. Build rows with consistent keys
            dataToExport = analystsList.map(val => {
              const row: any = {};
              allHeaders.forEach(header => {
                if (header === 'Nome') row[header] = val.name || '';
                else if (header === 'Email') row[header] = val.email || '';
                else if (header === 'Esteira') row[header] = val.track || '';
                else if (header === 'Data de Criação') row[header] = val.createdAt || '';
                else if (header === 'Data de Desligamento') row[header] = val.deactivatedAt || '';
                else if (header === 'Aprovado Por') row[header] = val.approvedByName || '';
                else {
                  const field = analystFields.find(f => f.label === header);
                  const key = field ? field.id : header;
                  row[header] = val[key] || '';
                }
              });
              return row;
            });
          }
          filename = 'base_analistas';
          break;
        
        case 'systems':
          dataToExport = systems.map(s => {
            const row: any = {
              Nome: s.name,
              Descrição: s.description || '',
            };
            Object.keys(s).forEach(key => {
              if (!['id', 'name', 'description'].includes(key)) {
                const field = systemFields.find(f => f.id === key);
                row[field?.label || key] = s[key];
              }
            });
            return row;
          });
          filename = 'base_sistemas';
          break;

        case 'users':
          users.forEach(u => {
            const role = roles.find(r => r.id === u.roleId);
            u.permissions.forEach(p => {
              dataToExport.push({
                Nome: u.name,
                Email: u.email,
                Perfil: role?.name || 'Personalizado',
                Permissão: PERMISSIONS_LABELS[p] || p
              });
            });
          });
          filename = 'base_usuarios';
          break;

        case 'tracks':
          dataToExport = tracks.map(t => ({
            Nome: t.name
          }));
          filename = 'base_esteiras';
          break;

        case 'accesses':
          const accessesSnapshot = await get(ref(db, 'accesses'));
          const accessesData = accessesSnapshot.val();
          if (accessesData) {
            const analystsSnapshot = await get(ref(db, 'analysts'));
            const allAnalysts = analystsSnapshot.val() || {};
            const accessesList = Object.values(accessesData) as any[];
            
            // 1. Identify all headers
            const headersSet = new Set(['Nome Sistema', 'Status', 'Última Atualização', 'Nome', 'Email', 'Esteira', 'Data de Criação', 'Data de Desligamento', 'Aprovado Por']);
            analystFields.forEach(f => {
               if (!['name', 'email', 'track', 'createdAt', 'deactivatedAt', 'approvedByName'].includes(f.id)) {
                 headersSet.add(f.label);
               }
            });
            // Add any other keys found in analyst data
            Object.values(allAnalysts).forEach((analyst: any) => {
              Object.keys(analyst).forEach(key => {
                if (!['id', 'name', 'email', 'track', 'createdAt', 'deactivatedAt', 'approvedBy', 'approvedByName'].includes(key)) {
                  const field = analystFields.find(f => f.id === key);
                  headersSet.add(field?.label || key);
                }
              });
            });
            const allHeaders = Array.from(headersSet);

            // 2. Build rows with consistent keys
            dataToExport = accessesList.map((acc: any) => {
              const analyst = allAnalysts[acc.analystId] || {};
              const system = systems.find(s => s.id === acc.systemId);
              
              const row: any = {};
              allHeaders.forEach(header => {
                if (header === 'Nome Sistema') row[header] = system?.name || 'Desconhecido';
                else if (header === 'Status') row[header] = acc.status;
                else if (header === 'Última Atualização') row[header] = acc.updatedAt;
                else if (header === 'Nome') row[header] = analyst.name || 'Desconhecido';
                else if (header === 'Email') row[header] = analyst.email || '';
                else if (header === 'Esteira') row[header] = analyst.track || '';
                else if (header === 'Data de Criação') row[header] = analyst.createdAt || '';
                else if (header === 'Data de Desligamento') row[header] = analyst.deactivatedAt || '';
                else if (header === 'Aprovado Por') row[header] = analyst.approvedByName || '';
                else {
                  const field = analystFields.find(f => f.label === header);
                  const key = field ? field.id : header;
                  row[header] = analyst[key] || '';
                }
              });
              return row;
            });
          }
          filename = 'base_acessos';
          break;

        case 'logs':
          const logsSnapshot = await get(ref(logDb, 'audit_logs'));
          const logsData = logsSnapshot.val();
          if (logsData) {
            let logsList = Object.values(logsData) as any[];
            
            // Apply date filters if not "All Time"
            if (!logExportAllTime) {
              if (logExportStartDate) {
                const start = new Date(logExportStartDate);
                start.setHours(0, 0, 0, 0);
                logsList = logsList.filter(l => new Date(l.timestamp) >= start);
              }
              if (logExportEndDate) {
                const end = new Date(logExportEndDate);
                end.setHours(23, 59, 59, 999);
                logsList = logsList.filter(l => new Date(l.timestamp) <= end);
              }
            }

            dataToExport = logsList
              .sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeB - timeA;
              })
              .map((l: any) => ({
                Data: l.timestamp ? new Date(l.timestamp).toLocaleString('pt-BR') : '',
                Usuário: l.userEmail,
                Ação: l.action,
                Módulo: l.module,
                Detalhes: l.details,
                'Dados Antigos': l.oldData || '',
                'Dados Novos': l.newData || ''
              }));
          }
          filename = `base_logs_auditoria${!logExportAllTime ? `_${logExportStartDate || 'inicio'}_a_${logExportEndDate || 'fim'}` : ''}`;
          break;
      }

      exportToCSV(dataToExport, filename);
      
      // Log the export action
      if (user?.email) {
        await logAction(
          user.email,
          'EXPORT_CSV',
          `Exportou a base: ${filename}`,
          'Extração'
        );
      }
      
      showToast("Exportação concluída!", "success");
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      showToast("Erro ao exportar dados. Tente novamente.", "error");
    }
  };

  const deleteField = (type: 'analyst' | 'system', fieldId: string) => {
    if (type === 'analyst' && !hasPermission('settings_analyst_fields')) return;
    if (type === 'system' && !hasPermission('settings_system_fields')) return;

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Campo',
      message: 'Tem certeza que deseja excluir este campo?',
      confirmText: 'Excluir',
      confirmColor: 'bg-rose-600',
      onConfirm: async () => {
        try {
          if (type === 'analyst') {
            const field = analystFields.find(f => f.id === fieldId);
            const newFields = analystFields.filter(f => f.id !== fieldId);
            await set(ref(db, 'config/analystFields'), newFields);
            if (user?.email) {
              await logAction(user.email, 'DELETE_ANALYST_FIELD', `Excluiu campo de analista: ${field?.label || fieldId}`, 'Configurações');
            }
          } else {
            const field = systemFields.find(f => f.id === fieldId);
            const newFields = systemFields.filter(f => f.id !== fieldId);
            await set(ref(db, 'config/systemFields'), newFields);
            if (user?.email) {
              await logAction(user.email, 'DELETE_SYSTEM_FIELD', `Excluiu campo de sistema: ${field?.label || fieldId}`, 'Configurações');
            }
          }
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          showToast("Campo excluído com sucesso!", "success");
        } catch (error) {
          console.error("Error deleting field:", error);
          showToast("Erro ao excluir campo. Tente novamente.", "error");
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <div className="flex-1 flex items-center justify-center">
          Carregando...
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const currentUserData = users.find(u => u.id === user.uid);
  if (currentUserData?.mustChangePassword) {
    return <ChangePassword userId={user.uid} />;
  }

  const hasPermission = (permission: Permission) => {
    if (currentUserData?.roleId === 'admin') return true;
    const userRole = roles.find(r => r.id === currentUserData?.roleId);
    const rolePermissions = userRole?.permissions || [];
    const userPermissions = currentUserData?.permissions || [];
    return rolePermissions.includes(permission) || userPermissions.includes(permission);
  };

  const canManageAnalysts = hasPermission('analysts_manage');
  const canManageAccess = hasPermission('analysts_access_status');
  const canViewAnalysts = canManageAnalysts || canManageAccess;
  const canManageSystems = hasPermission('systems_manage');
  const canViewSettings = hasPermission('settings_analyst_fields') || 
                          hasPermission('settings_system_fields') || 
                          hasPermission('settings_tracks') ||
                          hasPermission('settings_users') ||
                          hasPermission('settings_roles');

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-x-hidden">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-indigo-600">
            <ShieldCheck className="w-8 h-8" />
            <span className="font-bold text-lg tracking-tight">AccessControl</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <button 
            onClick={() => { setActiveTab('dashboard'); setSelectedAnalyst(null); setIsSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              activeTab === 'dashboard' ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          
          {canViewAnalysts && (
            <button 
              onClick={() => { setActiveTab('analysts'); setSelectedAnalyst(null); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === 'analysts' ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Users className="w-5 h-5" />
              Analistas
            </button>
          )}

          {canManageSystems && (
            <button 
              onClick={() => { setActiveTab('systems'); setSelectedAnalyst(null); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === 'systems' ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Monitor className="w-5 h-5" />
              Sistemas
            </button>
          )}

          {hasPermission('request_access') && (
            <button 
              onClick={() => { setActiveTab('request'); setSelectedAnalyst(null); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === 'request' ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <PlusCircle className="w-5 h-5" />
              Solicitações
            </button>
          )}

          {hasPermission('approve_access') && (
            <button 
              onClick={() => { setActiveTab('approvals'); setSelectedAnalyst(null); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative",
                activeTab === 'approvals' ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <ClipboardCheck className="w-5 h-5" />
              Aprovações
              {requests.filter(r => r.status === 'pending').length > 0 && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {requests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          )}

          {hasPermission('extract_data') && (
            <button 
              onClick={() => { setActiveTab('extract'); setSelectedAnalyst(null); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === 'extract' ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Download className="w-5 h-5" />
              Extrair Bases
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold truncate" title={currentUserData?.name || user?.email || 'Usuário'}>
                {currentUserData?.name || 'Usuário'}
              </p>
              <p className="text-xs text-slate-500 truncate" title={user?.email || ''}>
                {user?.email}
              </p>
            </div>
            
            {canViewSettings && (
              <button 
                onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-center gap-2 text-xs font-medium transition-colors p-2 rounded-lg mb-2",
                  activeTab === 'settings' ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                )}
              >
                <Settings className="w-4 h-4" />
                Configurações
              </button>
            )}
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-xs font-medium transition-colors p-2 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-[100] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-600 animate-pulse">Sincronizando dados...</p>
            </div>
          </div>
        )}
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 lg:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base lg:text-xl font-bold text-slate-800 truncate max-w-[150px] sm:max-w-none">
              {activeTab === 'dashboard' && 'Visão Geral'}
              {activeTab === 'analysts' && 'Analistas'}
              {activeTab === 'systems' && 'Sistemas'}
              {activeTab === 'request' && 'Solicitar Acesso'}
              {activeTab === 'approvals' && 'Aprovações Pendentes'}
              {activeTab === 'settings' && 'Configurações'}
              {activeTab === 'extract' && 'Extração de Dados'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            {activeTab === 'analysts' && !selectedAnalyst && (
              <select 
                value={analystStatusFilter}
                onChange={(e) => setAnalystStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="active">Ativos</option>
                <option value="deactivated">Desligados</option>
                <option value="all">Todos</option>
              </select>
            )}
            {activeTab !== 'dashboard' && !selectedAnalyst && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-28 sm:w-40 lg:w-64"
                />
              </div>
            )}
            {activeTab === 'analysts' && !selectedAnalyst && canManageAnalysts && (
              <button 
                onClick={() => setIsAddingAnalyst(true)}
                className="bg-indigo-600 text-white p-2 sm:px-4 sm:py-2 rounded-full text-xs lg:text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Novo Analista</span>
              </button>
            )}
            {activeTab === 'systems' && canManageSystems && (
              <button 
                onClick={() => setIsAddingSystem(true)}
                className="bg-indigo-600 text-white p-2 sm:px-4 sm:py-2 rounded-full text-xs lg:text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Novo Sistema</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
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
                  <div className="mb-6">
                    <h3 className="font-bold text-slate-800">Distribuição de Alertas</h3>
                    <p className="text-xs text-slate-500">Visualização por {dashboardViewMode === 'byTrack' ? 'esteira' : 'sistema'}</p>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dashboardViewMode === 'byTrack' ? stats.byTrack : stats.bySystem}
                        margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                          dy={10}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        />
                        <Legend 
                          verticalAlign="top" 
                          align="right" 
                          iconType="circle"
                          wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}
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

                {/* Grouped View */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardViewMode === 'byTrack' ? (
                    stats.byTrack.map(track => (
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
                                {track.pendingSystems.map(system => (
                                  <span key={system.id} className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100">
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
                                {track.lostSystems.map(system => (
                                  <span key={system.id} className="px-2 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-100">
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
                    stats.bySystem.map(system => (
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
                                {system.pendingTracks.map(track => (
                                  <span key={track.id} className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100">
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
                                {system.lostTracks.map(track => (
                                  <span key={track.id} className="px-2 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-100">
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
            )}

            {activeTab === 'analysts' && !selectedAnalyst && (
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
                      {filteredAnalysts.map(analyst => {
                        const analystAccesses = accesses.filter(a => a.analystId === analyst.id);
                        const pending = analystAccesses.filter(a => a.status === 'Pendente').length;
                        const lost = analystAccesses.filter(a => a.status === 'Acesso perdido').length;
                        
                        return (
                          <tr key={analyst.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                  {analyst.name.split(' ').map((n, i) => <span key={i}>{n[0]}</span>)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{analyst.name}</p>
                                  <p className="text-xs text-slate-400">{analyst.email}</p>
                                  {analyst.deactivatedAt && (
                                    <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">Desligado em: {new Date(analyst.deactivatedAt).toLocaleDateString('pt-BR')}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                                {analyst.track}
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
                                {canManageAnalysts && (
                                  <>
                                    {!analyst.deactivatedAt && (
                                      <button 
                                        onClick={() => deactivateAnalyst(analyst.id)}
                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Desligar Analista"
                                      >
                                        <Power className="w-5 h-5" />
                                      </button>
                                    )}
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
                  {filteredAnalysts.map(analyst => {
                    const analystAccesses = accesses.filter(a => a.analystId === analyst.id);
                    const pending = analystAccesses.filter(a => a.status === 'Pendente').length;
                    const lost = analystAccesses.filter(a => a.status === 'Acesso perdido').length;

                    return (
                      <div key={`mobile-${analyst.id}`} className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                              {analyst.name.split(' ').map((n, i) => <span key={i}>{n[0]}</span>)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{analyst.name}</p>
                              <p className="text-xs text-slate-400">{analyst.email}</p>
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
                            {canManageAnalysts && (
                              <>
                                {!analyst.deactivatedAt && (
                                  <button 
                                    onClick={() => deactivateAnalyst(analyst.id)}
                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Power className="w-5 h-5" />
                                  </button>
                                )}
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
                            {analyst.track}
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

            {activeTab === 'analysts' && selectedAnalyst && (
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
                        {selectedAnalyst.name.split(' ').map((n, i) => <span key={i}>{n[0]}</span>)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg lg:text-2xl font-bold text-slate-800 truncate">{selectedAnalyst.name}</h2>
                        <p className="text-[10px] lg:text-base text-slate-500 truncate">{selectedAnalyst.track} • {selectedAnalyst.email}</p>
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
                {analystFields.some(f => !['name', 'email', 'track'].includes(f.id) && selectedAnalyst[f.id]) && (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
                    <h3 className="font-bold text-slate-800 mb-4">Informações Adicionais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {analystFields
                        .filter(f => !['name', 'email', 'track'].includes(f.id) && selectedAnalyst[f.id])
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

            {activeTab === 'systems' && (
              <motion.div 
                key="systems-list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {systems.map(system => {
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
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-600">{usersCount} Ativos</span>
                        </div>
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
            )}

            {activeTab === 'request' && (
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
                      <form onSubmit={handleRequestAccess} className="space-y-6">
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
                          if (field.id === 'track') {
                            return (
                              <div key={field.id}>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                  {field.label}
                                </label>
                                <select name="track" required defaultValue={defaultValue} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
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
                                {request.analystData.name?.split(' ').map((n: string, i: number) => <span key={i}>{n[0]}</span>)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{request.analystData.name}</h3>
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
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {request.type === 'status_change' ? 'Mudança de Status' : `${request.systemIds?.length || 0} ${request.systemIds?.length === 1 ? 'Sistema' : 'Sistemas'}`}
                            </span>
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
            )}

            {activeTab === 'approvals' && (
              <motion.div 
                key="approvals"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Aprovações Pendentes</h2>
                    <p className="text-slate-500">Analise e aprove as solicitações de novos analistas.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requests
                    .filter(r => r.status === 'pending')
                    .sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime())
                    .map(request => (
                      <div key={request.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                            {request.analystData.name?.split(' ').map((n: string, i: number) => <span key={i}>{n[0]}</span>)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-800 truncate">{request.analystData.name}</h3>
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
                  
                  {requests.filter(r => r.status === 'pending').length === 0 && (
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
                              {selectedRequestForApproval.analystData.name?.split(' ').map((n: string, i: number) => <span key={i}>{n[0]}</span>)}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800">{selectedRequestForApproval.analystData.name}</h3>
                              <p className="text-xs text-slate-500">{selectedRequestForApproval.analystData.email}</p>
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
                            ) : (
                              <>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dados do Analista</h4>
                                  <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-slate-500">Esteira:</span>
                                      <span className="font-bold text-slate-700">{selectedRequestForApproval.analystData.track}</span>
                                    </div>
                                    {analystFields
                                      .filter(f => !['name', 'email', 'track'].includes(f.id) && selectedRequestForApproval.analystData[f.id])
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
                            className="flex-1 px-4 py-4 bg-white text-rose-600 border border-rose-200 font-bold rounded-2xl hover:bg-rose-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!rejectionReason.trim()}
                          >
                            Rejeitar
                          </button>
                          <button 
                            onClick={() => handleApproveRequest(selectedRequestForApproval)}
                            className="flex-1 px-4 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                          >
                            {selectedRequestForApproval.type === 'status_change' ? 'Aprovar Mudança' : 'Aprovar Criação'}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
            {activeTab === 'extract' && (
              <motion.div 
                key="extract"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800">Exportação de Dados</h2>
                    <p className="text-slate-500">Extraia as bases de dados do sistema em formato CSV para auditoria ou backup.</p>
                  </div>
                  
                  <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleExportData('analysts')}
                      className="group p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left flex items-center gap-4"
                    >
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">Base de Analistas</h3>
                        <p className="text-xs text-slate-500">Dados cadastrais de todos os analistas.</p>
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
                        <p className="text-xs text-slate-500">Lista de sistemas e suas descrições.</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => handleExportData('users')}
                      className="group p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left flex items-center gap-4"
                    >
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">Base de Usuários</h3>
                        <p className="text-xs text-slate-500">Usuários do sistema e suas permissões.</p>
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
                        <p className="text-xs text-slate-500">Lista de todas as esteiras cadastradas.</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => handleExportData('accesses')}
                      className="group p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left flex items-center gap-4"
                    >
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">Matriz de Acessos</h3>
                        <p className="text-xs text-slate-500">Relatório completo de qual analista tem acesso a qual sistema.</p>
                      </div>
                    </button>

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
              </motion.div>
            )}
            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                {hasPermission('settings_analyst_fields') && (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Users className="w-5 h-5 text-indigo-600" />
                          Definição de Analista
                        </h3>
                        <p className="text-sm text-slate-500">Personalize os rótulos e descrições dos campos do analista.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            if (isReorderingAnalystFields) {
                              set(ref(db, 'config/analystFields'), tempAnalystFields);
                            } else {
                              setTempAnalystFields(analystFields);
                            }
                            setIsReorderingAnalystFields(!isReorderingAnalystFields);
                          }}
                          className={`p-2 rounded-xl transition-all flex items-center gap-2 text-sm font-bold ${
                            isReorderingAnalystFields 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isReorderingAnalystFields ? (
                            <>
                              <Check className="w-4 h-4" />
                              Salvar Ordem
                            </>
                          ) : (
                            <>
                              <Move className="w-4 h-4" />
                              Reordenar
                            </>
                          )}
                        </button>
                        {!isReorderingAnalystFields && (
                          <button 
                            onClick={() => setIsAddingField({ type: 'analyst' })}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {isReorderingAnalystFields ? (
                      <Reorder.Group 
                        axis="y" 
                        values={tempAnalystFields} 
                        onReorder={setTempAnalystFields}
                        className="p-6 space-y-3"
                      >
                        {tempAnalystFields.map((field) => (
                          <DraggableFieldItem 
                            key={field.id}
                            field={field}
                            isReordering={true}
                            onEdit={(f) => setEditingField({ type: 'analyst', field: f })}
                            onDelete={(id) => deleteField('analyst', id)}
                          />
                        ))}
                      </Reorder.Group>
                    ) : (
                      <div className="p-6 space-y-3">
                        {analystFields.map((field) => (
                          <DraggableFieldItem 
                            key={field.id}
                            field={field}
                            isReordering={false}
                            onEdit={(f) => setEditingField({ type: 'analyst', field: f })}
                            onDelete={(id) => deleteField('analyst', id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {hasPermission('settings_system_fields') && (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Monitor className="w-5 h-5 text-indigo-600" />
                          Definição de Sistema
                        </h3>
                        <p className="text-sm text-slate-500">Personalize os rótulos e descrições dos campos do sistema.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            if (isReorderingSystemFields) {
                              set(ref(db, 'config/systemFields'), tempSystemFields);
                            } else {
                              setTempSystemFields(systemFields);
                            }
                            setIsReorderingSystemFields(!isReorderingSystemFields);
                          }}
                          className={`p-2 rounded-xl transition-all flex items-center gap-2 text-sm font-bold ${
                            isReorderingSystemFields 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isReorderingSystemFields ? (
                            <>
                              <Check className="w-4 h-4" />
                              Salvar Ordem
                            </>
                          ) : (
                            <>
                              <Move className="w-4 h-4" />
                              Reordenar
                            </>
                          )}
                        </button>
                        {!isReorderingSystemFields && (
                          <button 
                            onClick={() => setIsAddingField({ type: 'system' })}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {isReorderingSystemFields ? (
                      <Reorder.Group 
                        axis="y" 
                        values={tempSystemFields} 
                        onReorder={setTempSystemFields}
                        className="p-6 space-y-3"
                      >
                        {tempSystemFields.map((field) => (
                          <DraggableFieldItem 
                            key={field.id}
                            field={field}
                            isReordering={true}
                            onEdit={(f) => setEditingField({ type: 'system', field: f })}
                            onDelete={(id) => deleteField('system', id)}
                          />
                        ))}
                      </Reorder.Group>
                    ) : (
                      <div className="p-6 space-y-3">
                        {systemFields.map((field) => (
                          <DraggableFieldItem 
                            key={field.id}
                            field={field}
                            isReordering={false}
                            onEdit={(f) => setEditingField({ type: 'system', field: f })}
                            onDelete={(id) => deleteField('system', id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {hasPermission('settings_tracks') && (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-indigo-600" />
                          Gestão de Esteiras
                        </h3>
                        <p className="text-sm text-slate-500">Gerencie as esteiras disponíveis para seleção.</p>
                      </div>
                      <button 
                        onClick={() => setIsAddingTrack(true)}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tracks.map(track => (
                          <div key={track.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
                            <span className="text-sm font-bold text-slate-700 truncate">{track.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button 
                                onClick={() => setEditingTrack(track)}
                                className="p-2 bg-white border border-slate-200 text-indigo-600 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                                title="Editar Esteira"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => deleteTrack(track)}
                                className="p-2 bg-white border border-slate-200 text-rose-500 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                                title="Excluir Esteira"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* User Management Section */}
                {hasPermission('settings_users') && (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                          <div>
                              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                  <Users className="w-5 h-5 text-indigo-600" />
                                  Gestão de Usuários
                              </h3>
                              <p className="text-sm text-slate-500">Controle quem tem acesso ao sistema.</p>
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                              <div className="relative flex-1 sm:flex-initial">
                                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input 
                                      type="text" 
                                      placeholder="Buscar usuário..." 
                                      value={userSearchQuery}
                                      onChange={(e) => setUserSearchQuery(e.target.value)}
                                      className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full sm:w-64"
                                  />
                              </div>
                              <button 
                                  onClick={() => setIsAddingUser(true)}
                                  className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
                              >
                                  <Plus className="w-5 h-5" />
                              </button>
                          </div>
                      </div>
                      <div className="p-6">
                          <div className="space-y-3">
                              {users
                                  .filter(user => 
                                      user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                                      user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                                  )
                                  .map(user => {
                                  const role = roles.find(r => r.id === user.roleId);
                                  return (
                                      <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                          <div>
                                              <p className="font-bold text-slate-800">{user.name}</p>
                                              <p className="text-xs text-slate-500">{user.email}</p>
                                          </div>
                                          <div className="flex items-center gap-3">
                                              <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600">
                                                  {role?.name || 'Sem Perfil'}
                                              </span>
                                              <div className="flex gap-1">
                                                  <button 
                                                      onClick={() => { setEditingUser(user); setIsAddingUser(true); }}
                                                      className="p-2 bg-white border border-slate-200 text-indigo-600 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                                                  >
                                                      <Edit2 className="w-4 h-4" />
                                                  </button>
                                                  <button 
                                                      onClick={() => deleteUser(user.id)}
                                                      className="p-2 bg-white border border-slate-200 text-rose-500 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                                                  >
                                                      <Trash2 className="w-4 h-4" />
                                                  </button>
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                              {users.length === 0 && (
                                  <p className="text-center text-slate-400 py-4">Nenhum usuário cadastrado.</p>
                              )}
                              {users.length > 0 && users.filter(user => 
                                  user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                                  user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                              ).length === 0 && (
                                  <p className="text-center text-slate-400 py-4">Nenhum usuário encontrado para a busca.</p>
                              )}
                          </div>
                      </div>
                  </div>
                )}

                {/* Role Management Section */}
                {hasPermission('settings_roles') && (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                          <div>
                              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                  Perfis de Acesso
                              </h3>
                              <p className="text-sm text-slate-500">Defina as permissões de cada função.</p>
                          </div>
                          <button 
                              onClick={() => setIsAddingRole(true)}
                              className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
                          >
                              <Plus className="w-5 h-5" />
                          </button>
                      </div>
                      <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {roles.map(role => (
                                  <div key={role.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                                      <div className="flex justify-between items-start mb-2">
                                          <h4 className="font-bold text-slate-800">{role.name}</h4>
                                          <div className="flex gap-1">
                                              <button 
                                                  onClick={() => { setEditingRole(role); setIsAddingRole(true); }}
                                                  className="p-1.5 bg-white border border-slate-200 text-indigo-600 rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
                                              >
                                                  <Edit2 className="w-3.5 h-3.5" />
                                              </button>
                                              <button 
                                                  onClick={() => deleteRole(role)}
                                                  disabled={role.isSystem}
                                                  className={`p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm active:scale-95 transition-all ${role.isSystem ? 'text-slate-300 cursor-not-allowed' : 'text-rose-500 cursor-pointer'}`}
                                                  title={role.isSystem ? "Perfis de sistema não podem ser excluídos" : "Excluir Perfil"}
                                              >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                          </div>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                          {role.permissions.slice(0, 3).map(p => (
                                              <span key={p} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-500 truncate max-w-full">
                                                  {PERMISSIONS_LABELS[p]}
                                              </span>
                                          ))}
                                          {role.permissions.length > 3 && (
                                              <span className="px-2 py-0.5 bg-slate-200 rounded text-[10px] text-slate-600">
                                                  +{role.permissions.length - 3}
                                              </span>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Footer />
      </main>

      {/* Modals */}
      <AnimatePresence>
        {(isAddingAnalyst || editingAnalyst) && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[70vh] overflow-y-auto"
            >
              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{editingAnalyst ? 'Editar Analista' : 'Novo Analista'}</h2>
                <p className="text-slate-500 text-sm mb-6">{editingAnalyst ? 'Atualize os dados do analista.' : 'Cadastre um novo membro na equipe de operação.'}</p>
                
                <form onSubmit={handleAddAnalyst} className="space-y-4">
                  {analystFields.map(field => {
                    if (field.id === 'name') {
                      return (
                        <div key={field.id}>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            {field.label}
                          </label>
                          <input name="name" defaultValue={editingAnalyst?.name} required disabled={!canManageAnalysts} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60" placeholder="Ex: João Silva" />
                        </div>
                      );
                    }
                    if (field.id === 'email') {
                      return (
                        <div key={field.id}>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            {field.label}
                          </label>
                          <input name="email" type="email" defaultValue={editingAnalyst?.email} required disabled={!canManageAnalysts} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60" placeholder="joao.silva@empresa.com" />
                        </div>
                      );
                    }
                    if (field.id === 'track') {
                      return (
                        <div key={field.id}>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            {field.label}
                          </label>
                          <select name="track" defaultValue={editingAnalyst?.track} required disabled={!canManageAnalysts} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60">
                            {tracks.map(track => (
                              <option key={track.id} value={track.name}>{track.name}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }
                    // Fallback for custom fields
                    return (
                      <div key={field.id}>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                          {field.label}
                        </label>
                        <input 
                          name={field.id} 
                          defaultValue={editingAnalyst?.[field.id]} 
                          disabled={!canManageAnalysts} 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60" 
                          placeholder={field.description}
                        />
                      </div>
                    );
                  })}

                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Sistemas Utilizados
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {systems.map(system => (
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
                  {editingAnalyst && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
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
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => { setIsAddingAnalyst(false); setEditingAnalyst(null); }} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                    <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Salvar</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {(isAddingSystem || editingSystem) && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[70vh] overflow-y-auto"
            >
              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{editingSystem ? 'Editar Sistema' : 'Novo Sistema'}</h2>
                <p className="text-slate-500 text-sm mb-6">{editingSystem ? 'Atualize os dados do sistema.' : 'Adicione uma nova ferramenta ao catálogo da operação.'}</p>
                
                <form onSubmit={handleAddSystem} className="space-y-4">
                  {systemFields.map(field => {
                    if (field.id === 'name') {
                      return (
                        <div key={field.id}>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            {field.label}
                          </label>
                          <input name="name" defaultValue={editingSystem?.name} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Ex: Salesforce" />
                        </div>
                      );
                    }
                    if (field.id === 'description') {
                      return (
                        <div key={field.id}>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            {field.label}
                          </label>
                          <textarea name="description" defaultValue={editingSystem?.description} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Para que serve este sistema?" />
                        </div>
                      );
                    }
                    // Fallback for custom fields
                    return (
                      <div key={field.id}>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                          {field.label}
                        </label>
                        <input 
                          name={field.id} 
                          defaultValue={editingSystem?.[field.id]} 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                          placeholder={field.description}
                        />
                      </div>
                    );
                  })}
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => { setIsAddingSystem(false); setEditingSystem(null); }} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                    <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Salvar</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {isAddingField && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[70vh] overflow-y-auto"
            >
              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Novo Campo</h2>
                <p className="text-slate-500 text-sm mb-6">Adicione um novo campo personalizado.</p>
                
                <form onSubmit={handleAddField} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ID do Campo</label>
                    <input name="id" required pattern="[a-z0-9_]+" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="ex: data_nascimento (apenas letras minúsculas e _)" />
                    <p className="text-[10px] text-slate-400 mt-1">Usado internamente. Não pode ser alterado depois.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rótulo (Label)</label>
                    <input name="label" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Ex: Data de Nascimento" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descrição</label>
                    <input name="description" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Ex: Data de nascimento do colaborador" />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsAddingField(null)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                    <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Salvar</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {editingField && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Editar Campo</h2>
                <p className="text-slate-500 text-sm mb-6">Altere o rótulo e a descrição do campo.</p>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const label = formData.get('label') as string;
                  const description = formData.get('description') as string;
                  
                  if (editingField.type === 'analyst') {
                    const updated = analystFields.map(f => f.id === editingField.field.id ? { ...f, label, description } : f);
                    set(ref(db, 'config/analystFields'), updated);
                  } else {
                    const updated = systemFields.map(f => f.id === editingField.field.id ? { ...f, label, description } : f);
                    set(ref(db, 'config/systemFields'), updated);
                  }
                  setEditingField(null);
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rótulo (Label)</label>
                    <input name="label" defaultValue={editingField.field.label} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descrição</label>
                    <input name="description" defaultValue={editingField.field.description} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setEditingField(null)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                    <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Salvar</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {(isAddingTrack || editingTrack) && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{editingTrack ? 'Editar Esteira' : 'Nova Esteira'}</h2>
                <p className="text-slate-500 text-sm mb-6">{editingTrack ? 'Atualize o nome da esteira.' : 'Adicione uma nova esteira operacional.'}</p>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get('name') as string;
                  
                  if (editingTrack) {
                    const oldName = editingTrack.name;
                    const newData = { name };
                    update(ref(db, `tracks/${editingTrack.id}`), newData);
                    if (user?.email) {
                      logAction(
                        user.email, 
                        'EDIT_TRACK', 
                        `Editou a esteira: ${oldName} para ${name}`, 
                        'Configurações',
                        editingTrack,
                        { ...editingTrack, ...newData }
                      );
                    }
                    // Update analysts track name
                    analysts.forEach(a => {
                      if (a.track === oldName) {
                        update(ref(db, `analysts/${a.id}`), { track: name });
                      }
                    });
                    setEditingTrack(null);
                  } else {
                    const id = crypto.randomUUID();
                    set(ref(db, `tracks/${id}`), { id, name });
                    if (user?.email) {
                      logAction(user.email, 'CREATE_TRACK', `Criou a esteira: ${name}`, 'Configurações');
                    }
                  }
                  setIsAddingTrack(false);
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome da Esteira</label>
                    <input name="name" defaultValue={editingTrack?.name} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Ex: Vendas" />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => { setIsAddingTrack(false); setEditingTrack(null); }} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                    <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Salvar</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* User Modal */}
        {(isAddingUser || editingUser) && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-y-auto"
                >
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                        <UserForm 
                          user={editingUser} 
                          roles={roles} 
                          onSave={handleAddUser} 
                          onCancel={() => { setIsAddingUser(false); setEditingUser(null); }} 
                          showToast={showToast}
                        />
                    </div>
                </motion.div>
            </div>
        )}

        {/* Role Modal */}
        {(isAddingRole || editingRole) && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-y-auto"
                >
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">{editingRole ? 'Editar Perfil' : 'Novo Perfil'}</h2>
                        <form onSubmit={handleAddRole} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome do Perfil</label>
                                <input name="name" defaultValue={editingRole?.name} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Permissões</h3>
                                {Object.entries(PERMISSIONS_LABELS).map(([key, label]) => (
                                    <label key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            name="permissions" 
                                            value={key} 
                                            defaultChecked={editingRole?.permissions?.includes(key as Permission)}
                                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                        />
                                        <span className="text-sm font-medium text-slate-700">{label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => { setIsAddingRole(false); setEditingRole(null); }} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Salvar</button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        )}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{confirmModal.title}</h3>
                <p className="text-slate-500 text-sm mb-6">{confirmModal.message}</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => { confirmModal.onConfirm(); setConfirmModal(prev => ({ ...prev, isOpen: false })); }}
                    className={cn("flex-1 px-4 py-2 text-white font-bold rounded-xl transition-all shadow-lg", confirmModal.confirmColor || "bg-rose-600")}
                  >
                    {confirmModal.confirmText || "Excluir"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        <Toast 
          isVisible={toast.isVisible} 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
        />
      </AnimatePresence>
    </div>
  );
}
