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
  FileText,
  Upload,
  UserMinus,
  Moon,
  Sun,
  Key
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
import { getAuth, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db, auth, firebaseConfig, logDb } from './lib/firebase';
import { logAction } from './lib/auditLogger';
import DashboardTab from './components/tabs/DashboardTab';
import SettingsTab from './components/tabs/SettingsTab';
import AnalystsTab from './components/tabs/AnalystsTab';
import SystemsTab from './components/tabs/SystemsTab';
import RequestTab from './components/tabs/RequestTab';
import ApprovalsTab from './components/tabs/ApprovalsTab';
import ExtractTab from './components/tabs/ExtractTab';
import { AnalystModal } from './components/modals/AnalystModal';
import { SystemModal } from './components/modals/SystemModal';
import { FieldModal } from './components/modals/FieldModal';
import { TrackModal } from './components/modals/TrackModal';
import { UserModal } from './components/modals/UserModal';
import { RoleModal } from './components/modals/RoleModal';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { DeleteRequestModal } from './components/modals/DeleteRequestModal';
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
    <form key={user?.id || 'new_user'} onSubmit={handleSubmit} className="space-y-6">
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


export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analysts' | 'systems' | 'dashboard' | 'settings' | 'request' | 'approvals' | 'extract'>('dashboard');
  const [dashboardViewMode, setDashboardViewMode] = useState<'byTrack' | 'bySystem'>('byTrack');
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [allAnalysts, setAllAnalysts] = useState<Analyst[]>([]);
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const [isMassDeactivateModalOpen, setIsMassDeactivateModalOpen] = useState(false);
  const [massDeactivateField, setMassDeactivateField] = useState<string>('');
  const [massDeactivateFile, setMassDeactivateFile] = useState<File | null>(null);
  const [isMassDeactivating, setIsMassDeactivating] = useState(false);
  const [isAnalystMenuOpen, setIsAnalystMenuOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [analystsLimit, setAnalystsLimit] = useState(20);

  const getAnalystDisplayName = (analyst: any) => {
    if (!analyst) return 'Analista Desconhecido';
    return analyst.name || analyst.nome || analyst.email_interfile || analyst.email || 'Sem Nome';
  };

  const getAnalystInitials = (analyst: any) => {
    const name = getAnalystDisplayName(analyst);
    return name.split(' ').slice(0, 2).map((n: string) => n[0]?.toUpperCase()).join('');
  };

  const getAnalystEmail = (analyst: any) => {
    if (!analyst) return '';
    return analyst.email_interfile || analyst.email || '';
  };

  const getAnalystTrack = (analyst: any) => {
    if (!analyst) return '';
    if (analyst.track) return analyst.track;
    if (analyst.esteira) return analyst.esteira;
    if (analyst.Esteira) return analyst.Esteira;
    
    const trackKey = Object.keys(analyst).find(k => 
      k.toLowerCase() === 'track' || 
      k.toLowerCase() === 'esteira' ||
      k.toLowerCase().includes('esteira')
    );
    
    return trackKey ? analyst[trackKey] : '';
  };

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

  const [usersLimit, setUsersLimit] = useState(10);
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
  const [analystAccessStatusFilter, setAnalystAccessStatusFilter] = useState<'all' | 'ok' | 'pending' | 'lost' | 'none'>('all');
  const [logExportStartDate, setLogExportStartDate] = useState('');
  const [logExportEndDate, setLogExportEndDate] = useState('');
  const [logExportAllTime, setLogExportAllTime] = useState(true);
  const [tempAnalystFields, setTempAnalystFields] = useState<FieldDefinition[]>([]);
  const [tempSystemFields, setTempSystemFields] = useState<FieldDefinition[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (password?: string) => void;
    confirmText?: string;
    confirmColor?: string;
    requirePassword?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirmar', confirmColor: 'bg-rose-600' });
  const [deleteRequestModal, setDeleteRequestModal] = useState<{ isOpen: boolean, request: AccessRequest | null }>({
    isOpen: false,
    request: null
  });


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
          const sortedList = list.sort((a, b) => {
            const nameA = a.name || a.nome || a.email || a.email_interfile || '';
            const nameB = b.name || b.nome || b.email || b.email_interfile || '';
            return nameA.localeCompare(nameB);
          });
          setAnalysts(sortedList);
        } else {
          setAnalysts([]);
        }
      }),
      onValue(refs.analysts, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.entries(data).map(([id, val]: [string, any]) => ({ ...val, id }));
          setAllAnalysts(list);
        } else {
          setAllAnalysts([]);
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
        if (data) {
          const arr = Array.isArray(data) ? data : Object.values(data);
          const validItems = arr.filter(item => item && typeof item === 'object' && 'id' in item) as FieldDefinition[];
          // Remove duplicates by id
          const uniqueItems = Array.from(new Map(validItems.map(item => [item.id, item])).values());
          setAnalystFields(uniqueItems);
        } else {
          setAnalystFields(INITIAL_ANALYST_FIELDS);
        }
      }),
      onValue(refs.systemFields, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const arr = Array.isArray(data) ? data : Object.values(data);
          const validItems = arr.filter(item => item && typeof item === 'object' && 'id' in item) as FieldDefinition[];
          // Remove duplicates by id
          const uniqueItems = Array.from(new Map(validItems.map(item => [item.id, item])).values());
          setSystemFields(uniqueItems);
        } else {
          setSystemFields(INITIAL_SYSTEM_FIELDS);
        }
      })
    ];

    setIsLoading(false);
    return () => unsubscribes.forEach(unsub => unsub());
  }, [analystsLimit, debouncedSearchQuery, analystStatusFilter, analystAccessStatusFilter]);

  const filteredAnalysts = useMemo(() => {
    const filtered = allAnalysts.filter(a => {
      const searchLower = searchQuery.toLowerCase();
      
      // Search across all defined fields for this analyst
      const matchesSearch = analystFields.some(field => {
        const val = a[field.id];
        return val && typeof val === 'string' && val.toLowerCase().includes(searchLower);
      }) || 
      // Fallback to name/email/track if they exist
      (a.name && a.name.toLowerCase().includes(searchLower)) ||
      (a.email && a.email.toLowerCase().includes(searchLower)) ||
      (getAnalystTrack(a) && getAnalystTrack(a).toLowerCase().includes(searchLower));
      
      const matchesStatus = analystStatusFilter === 'all' || 
                           (analystStatusFilter === 'active' && !a.deactivatedAt) ||
                           (analystStatusFilter === 'deactivated' && !!a.deactivatedAt);
                           
      let matchesAccessStatus = true;
      if (analystAccessStatusFilter !== 'all') {
        const analystAccesses = accesses.filter(acc => acc.analystId === a.id);
        if (analystAccessStatusFilter === 'none') {
          matchesAccessStatus = analystAccesses.length === 0;
        } else if (analystAccessStatusFilter === 'ok') {
          matchesAccessStatus = analystAccesses.length > 0 && analystAccesses.every(acc => acc.status === 'Ok');
        } else if (analystAccessStatusFilter === 'pending') {
          matchesAccessStatus = analystAccesses.some(acc => acc.status === 'Pendente');
        } else if (analystAccessStatusFilter === 'lost') {
          matchesAccessStatus = analystAccesses.some(acc => acc.status === 'Acesso perdido');
        }
      }
      
      return matchesSearch && matchesStatus && matchesAccessStatus;
    });
    
    // Sort by name
    filtered.sort((a, b) => {
      const nameA = a.name || a.nome || a.email || a.email_interfile || '';
      const nameB = b.name || b.nome || b.email || b.email_interfile || '';
      return nameA.localeCompare(nameB);
    });
    
    return filtered;
  }, [allAnalysts, searchQuery, analystStatusFilter, analystAccessStatusFilter, analystFields, accesses]);

  const paginatedAnalysts = useMemo(() => {
    return filteredAnalysts.slice(0, analystsLimit);
  }, [filteredAnalysts, analystsLimit]);
  
  const hasMoreAnalysts = filteredAnalysts.length > analystsLimit;

  const stats = useMemo(() => {
    // Filter out accesses belonging to deactivated analysts
    const activeAccesses = accesses.filter(acc => {
      const analyst = allAnalysts.find(a => a.id === acc.analystId);
      return analyst && !analyst.deactivatedAt;
    });

    const totalAccesses = activeAccesses.length;
    const okCount = activeAccesses.filter(a => a.status === 'Ok').length;
    const pendingCount = activeAccesses.filter(a => a.status === 'Pendente').length;
    const lostCount = activeAccesses.filter(a => a.status === 'Acesso perdido').length;

    // Group by Track (Access-First approach for maximum reliability)
    const trackGroups: Record<string, any> = {};
    
    activeAccesses.forEach(acc => {
      if (acc.status === 'Ok') return;
      
      const analyst = allAnalysts.find(a => a.id === acc.analystId);
      const rawTrackName = getAnalystTrack(analyst)?.trim() || 'Sem Esteira';
      const officialTrack = tracks.find(t => t.name.trim().toLowerCase() === rawTrackName.toLowerCase());
      const trackName = officialTrack ? officialTrack.name : rawTrackName;
      const system = systems.find(s => s.id === acc.systemId);
      
      if (!trackGroups[trackName]) {
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
    
    activeAccesses.forEach(acc => {
      if (acc.status === 'Ok') return;
      
      const system = systems.find(s => s.id === acc.systemId);
      const systemName = system?.name || 'Sistema Desconhecido';
      const analyst = allAnalysts.find(a => a.id === acc.analystId);
      const rawTrackName = getAnalystTrack(analyst)?.trim() || 'Sem Esteira';
      const officialTrack = tracks.find(t => t.name.trim().toLowerCase() === rawTrackName.toLowerCase());
      const trackName = officialTrack ? officialTrack.name : rawTrackName;
      const track = officialTrack || { id: `virtual-${trackName}`, name: trackName };
      
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
  }, [accesses, allAnalysts, systems, tracks]);

  const handleUpdateAccess = (analystId: string, systemId: string, status: AccessStatus) => {
    if (!canManageAccess) return;
    
    const currentUserData = users.find(u => u.id === user?.uid);
    // APENAS o perfil de treinador irá pedir permissão.
    // Os demais (admin, supervisor, etc.) alteram normalmente sem precisar de aprovação.
    const finalNeedsApproval = currentUserData?.roleId === 'treinador';

    const oldAccess = accesses.find(a => a.analystId === analystId && a.systemId === systemId);
    const analyst = allAnalysts.find(a => a.id === analystId);
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
        await logAction(user.email, editingRequest ? 'RESUBMIT_REQUEST' : 'CREATE_REQUEST', `${editingRequest ? 'Reenviou' : 'Criou'} solicitação ${requestNumber} para o analista ${getAnalystDisplayName(analystData)}`, 'Solicitações');
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

  const handleDeleteRequest = (request: AccessRequest) => {
    setDeleteRequestModal({
      isOpen: true,
      request
    });
  };

  const confirmDeleteRequest = async (requestId: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      await remove(ref(db, `requests/${requestId}`));
      if (user?.email) {
        await logAction(user.email, 'DELETE_REQUEST', `Excluiu a solicitação: ${request?.requestNumber || requestId}`, 'Solicitações');
      }
      setDeleteRequestModal({ isOpen: false, request: null });
      showToast("Solicitação excluída com sucesso!", "success");
    } catch (error) {
      console.error("Error deleting request:", error);
      showToast("Erro ao excluir solicitação. Tente novamente.", "error");
    }
  };

  const handleApproveRequest = async (request: AccessRequest) => {
    if (!hasPermission('approve_access')) return;
    
    const currentUserData = users.find(u => u.id === user?.uid);

    if (request.type === 'status_change' && request.statusChangeData) {
      const { analystId, systemId, newStatus } = request.statusChangeData;
      const analyst = allAnalysts.find(a => a.id === analystId);
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
        `Aprovou solicitação ${request.requestNumber} para o analista ${getAnalystDisplayName(analystData)}`, 
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
    const analyst = allAnalysts.find(a => a.id === id);
    if (!analyst || analyst.deactivatedAt) return;

    setConfirmModal({
      isOpen: true,
      title: 'Desligar Analista',
      message: `Tem certeza que deseja desligar o analista ${getAnalystDisplayName(analyst)}? Após o desligamento, os dados não poderão ser alterados nem excluídos.`,
      confirmText: 'Desligar',
      confirmColor: 'bg-rose-600',
      onConfirm: async () => {
        try {
          await update(ref(db, `analysts/${id}`), { 
            deactivatedAt: new Date().toISOString() 
          });
          if (user?.email) {
            await logAction(user.email, 'DEACTIVATE_ANALYST', `Desligou o analista: ${getAnalystDisplayName(analyst)}`, 'Analistas');
          }
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          showToast("Analista desligado com sucesso!", "success");
        } catch (error: any) {
          showToast("Erro ao desligar analista: " + error.message, "error");
        }
      }
    });
  };



  const deleteAnalyst = (id: string) => {
    if (!canManageAnalysts) return;
    const analyst = allAnalysts.find(a => a.id === id);
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
            await logAction(user.email, 'DELETE_ANALYST', `Excluiu o analista: ${getAnalystDisplayName(analyst)}`, 'Analistas');
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
          const analystsToUpdate = allAnalysts.filter(a => getAnalystTrack(a) === track.name);
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

  const resetUserPassword = (id: string) => {
      if (!hasPermission('settings_users')) return;
      setConfirmModal({
          isOpen: true,
          title: 'Resetar Senha',
          message: 'Para forçar a redefinição de senha deste usuário, por favor, insira sua senha atual.',
          confirmText: 'Resetar Senha',
          confirmColor: 'bg-amber-500',
          requirePassword: true,
          onConfirm: async (password?: string) => {
              try {
                  if (!password) {
                      showToast("Senha é obrigatória.", "error");
                      return;
                  }
                  if (user?.email) {
                      const credential = EmailAuthProvider.credential(user.email, password);
                      await reauthenticateWithCredential(user, credential);
                  }

                  await update(ref(db, `users/${id}`), { mustChangePassword: true });
                  if (user?.email) {
                    const resetUser = users.find(u => u.id === id);
                    await logAction(user.email, 'RESET_PASSWORD', `Forçou redefinição de senha para o usuário: ${resetUser?.name || id} (${resetUser?.email || ''})`, 'Configurações');
                  }
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  showToast("Usuário forçado a redefinir a senha com sucesso!", "success");
              } catch (error: any) {
                  console.error("Erro ao resetar senha do usuário:", error);
                  if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                      showToast("Senha incorreta.", "error");
                  } else {
                      showToast("Erro ao resetar senha: " + error.message, "error");
                  }
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

  const generateTemplate = () => {
    const headers = ['Nome Sistema', 'Status', ...analystFields.map(f => f.label)];
    const csvContent = "\ufeff" + headers.join(';') + '\r\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_importacao_analistas.csv';
    link.click();
  };

  const parseCSVRow = (row: string, separator = ';') => {
      const result = [];
      let insideQuotes = false;
      let currentValue = '';
      for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
              if (insideQuotes && row[i+1] === '"') {
                  currentValue += '"';
                  i++;
              } else {
                  insideQuotes = !insideQuotes;
              }
          } else if (char === separator && !insideQuotes) {
              result.push(currentValue);
              currentValue = '';
          } else {
              currentValue += char;
          }
      }
      result.push(currentValue);
      return result;
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) {
        showToast("Arquivo vazio ou sem dados.", "error");
        setIsImporting(false);
        return;
      }
      
      const separator = lines[0].includes(';') ? ';' : ',';
      const headers = parseCSVRow(lines[0], separator).map(h => h.trim().replace(/^\uFEFF/, '').replace(/^"|"$/g, ''));
      
      const updates: any = {};
      const newAnalysts: any = {};
      const newAccesses: any = {};
      let validRows = 0;
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = parseCSVRow(lines[i], separator);
        const rowData: any = {};
        headers.forEach((h, index) => {
          rowData[h] = values[index]?.trim().replace(/^"|"$/g, '') || '';
        });
        
        const analystData: any = {};
        analystFields.forEach(f => {
          const val = rowData[f.label];
          if (val !== undefined && val !== '') {
            analystData[f.id] = val;
          }
        });
        
        const emailField = analystFields.find(f => f.type === 'email' || f.id === 'email' || f.id === 'email_interfile' || f.label.toLowerCase().includes('email') || f.label.toLowerCase().includes('e-mail'));
        const emailKey = emailField?.id || 'email_interfile';
        const emailVal = analystData[emailKey] || analystData.email || analystData.email_interfile;
        
        if (!emailVal) continue; // Email is required
        
        validRows++;
        const email = emailVal.toLowerCase();
        let analystId = allAnalysts.find(a => {
           const aEmail = a[emailKey] || a.email || a.email_interfile;
           return aEmail && typeof aEmail === 'string' && aEmail.toLowerCase() === email;
        })?.id;
        
        if (!analystId) {
          const existingNew = Object.entries(newAnalysts).find(([id, a]: [string, any]) => {
             const aEmail = a[emailKey] || a.email || a.email_interfile;
             return aEmail && typeof aEmail === 'string' && aEmail.toLowerCase() === email;
          });
          if (existingNew) {
            analystId = existingNew[0];
          } else {
            analystId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
            newAnalysts[analystId] = {
              ...analystData,
              id: analystId,
              createdAt: new Date().toISOString(),
              approvedBy: user?.uid || '',
              approvedByName: currentUserData?.name || user?.email || 'Importação em Massa'
            };
          }
        } else {
           const existingAnalyst = allAnalysts.find(a => a.id === analystId);
           updates[`analysts/${analystId}`] = { ...existingAnalyst, ...analystData };
        }
        
        const systemName = rowData['Nome Sistema'];
        const statusStr = rowData['Status'];
        
        if (systemName) {
          const system = systems.find(s => s.name.toLowerCase() === systemName.toLowerCase());
          if (system) {
            const validStatuses = ['Ok', 'Pendente', 'Acesso perdido'];
            const statusMatch = validStatuses.find(vs => vs.toLowerCase() === statusStr?.toLowerCase());
            const status = statusMatch || 'Pendente';
            
            newAccesses[`${analystId}_${system.id}`] = {
              analystId,
              systemId: system.id,
              status,
              updatedAt: new Date().toISOString()
            };
          }
        }
      }
      
      const finalUpdates: any = { ...updates };
      Object.keys(newAnalysts).forEach(id => {
        finalUpdates[`analysts/${id}`] = newAnalysts[id];
      });
      Object.keys(newAccesses).forEach(key => {
        finalUpdates[`accesses/${key}`] = newAccesses[key];
      });
      
      if (Object.keys(finalUpdates).length > 0) {
        await update(ref(db), finalUpdates);
        if (user?.email) {
          await logAction(user.email, 'MASS_IMPORT', `Importou/Atualizou ${Object.keys(newAnalysts).length + Object.keys(updates).length} analistas e ${Object.keys(newAccesses).length} acessos.`, 'Analistas');
        }
        showToast("Importação concluída com sucesso!", "success");
        setIsImportModalOpen(false);
        setImportFile(null);
      } else {
        if (validRows === 0) {
          showToast("Nenhum dado válido encontrado. Verifique se a coluna de E-mail está preenchida corretamente.", "error");
        } else {
          showToast("Nenhum sistema válido encontrado para os analistas informados.", "error");
        }
      }
    } catch (err: any) {
      console.error("Erro na importação:", err);
      showToast("Erro na importação: " + err.message, "error");
    } finally {
      setIsImporting(false);
    }
  };

  const generateDeactivateTemplate = () => {
    if (!massDeactivateField) {
      showToast("Selecione um campo de referência primeiro.", "error");
      return;
    }
    const field = analystFields.find(f => f.id === massDeactivateField);
    const headers = [field?.label || massDeactivateField];
    const csvContent = "\ufeff" + headers.join(';') + '\r\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `modelo_desligamento_${massDeactivateField}.csv`;
    link.click();
  };

  const handleMassDeactivate = async (file: File) => {
    if (!massDeactivateField) {
      showToast("Selecione um campo de referência primeiro.", "error");
      return;
    }

    setIsMassDeactivating(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) {
        showToast("Arquivo vazio ou sem dados.", "error");
        setIsMassDeactivating(false);
        return;
      }
      
      const separator = lines[0].includes(';') ? ';' : ',';
      const headers = parseCSVRow(lines[0], separator).map(h => h.trim().replace(/^\uFEFF/, '').replace(/^"|"$/g, ''));
      
      const field = analystFields.find(f => f.id === massDeactivateField);
      const targetHeader = field?.label || massDeactivateField;

      if (!headers.includes(targetHeader)) {
        showToast(`O arquivo deve conter a coluna "${targetHeader}".`, "error");
        setIsMassDeactivating(false);
        return;
      }

      const updates: any = {};
      let validRows = 0;
      let notFoundCount = 0;
      
      const allAnalystsSnapshot = await get(ref(db, 'analysts'));
      const allAnalystsData = allAnalystsSnapshot.val() || {};
      const allAnalystsList = Object.entries(allAnalystsData).map(([id, val]: [string, any]) => ({ ...val, id }));

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = parseCSVRow(lines[i], separator);
        const rowData: any = {};
        headers.forEach((h, index) => {
          rowData[h] = values[index]?.trim().replace(/^"|"$/g, '') || '';
        });
        
        const targetValue = rowData[targetHeader];
        if (!targetValue) continue;

        const analystToDeactivate = allAnalystsList.find(a => {
          const val = a[massDeactivateField];
          return val && val.toString().toLowerCase() === targetValue.toString().toLowerCase();
        });

        if (analystToDeactivate && !analystToDeactivate.deactivatedAt) {
          updates[`analysts/${analystToDeactivate.id}/deactivatedAt`] = new Date().toISOString();
          validRows++;
        } else if (!analystToDeactivate) {
          notFoundCount++;
        }
      }
      
      if (validRows > 0) {
        await update(ref(db), updates);
        await logAction(user?.email || 'Sistema', 'MASS_DEACTIVATE', `Desligou ${validRows} analistas em massa usando ${targetHeader}`, 'Analistas');
        showToast(`${validRows} analistas desligados com sucesso!${notFoundCount > 0 ? ` (${notFoundCount} não encontrados)` : ''}`, "success");
        setIsMassDeactivateModalOpen(false);
        setMassDeactivateFile(null);
        setMassDeactivateField('');
      } else {
        showToast(`Nenhum analista válido encontrado para desligamento.${notFoundCount > 0 ? ` (${notFoundCount} não encontrados)` : ''}`, "error");
      }
    } catch (err: any) {
      console.error("Erro no desligamento em massa:", err);
      showToast("Erro no desligamento em massa: " + err.message, "error");
    } finally {
      setIsMassDeactivating(false);
    }
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
               if (!['name', 'email', 'track', 'email_interfile', 'esteira', 'createdAt', 'deactivatedAt', 'approvedByName'].includes(f.id) && !f.id.toLowerCase().includes('esteira')) {
                 headersSet.add(f.label);
               }
            });
            // Add any other keys found in data
            analystsList.forEach(val => {
              Object.keys(val).forEach(key => {
                if (!['id', 'name', 'email', 'track', 'email_interfile', 'esteira', 'createdAt', 'deactivatedAt', 'approvedBy', 'approvedByName'].includes(key) && !key.toLowerCase().includes('esteira')) {
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
                if (header === 'Nome') row[header] = getAnalystDisplayName(val);
                else if (header === 'Email') row[header] = getAnalystEmail(val);
                else if (header === 'Esteira') row[header] = getAnalystTrack(val);
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
               if (!['name', 'email', 'track', 'email_interfile', 'esteira', 'createdAt', 'deactivatedAt', 'approvedByName'].includes(f.id) && !f.id.toLowerCase().includes('esteira')) {
                 headersSet.add(f.label);
               }
            });
            // Add any other keys found in analyst data
            Object.values(allAnalysts).forEach((analyst: any) => {
              Object.keys(analyst).forEach(key => {
                if (!['id', 'name', 'email', 'track', 'email_interfile', 'esteira', 'createdAt', 'deactivatedAt', 'approvedBy', 'approvedByName'].includes(key) && !key.toLowerCase().includes('esteira')) {
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
                else if (header === 'Nome') row[header] = getAnalystDisplayName(analyst);
                else if (header === 'Email') row[header] = getAnalystEmail(analyst);
                else if (header === 'Esteira') row[header] = getAnalystTrack(analyst);
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
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              title={isDarkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {activeTab === 'analysts' && !selectedAnalyst && (
              <>
                <select 
                  value={analystAccessStatusFilter}
                  onChange={(e) => setAnalystAccessStatusFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer hidden sm:block"
                >
                  <option value="all">Qualquer acesso</option>
                  <option value="ok">Tudo Ok</option>
                  <option value="pending">Com Pendências</option>
                  <option value="lost">Acesso Perdido</option>
                  <option value="none">Sem Acessos</option>
                </select>
                <select 
                  value={analystStatusFilter}
                  onChange={(e) => setAnalystStatusFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="active">Ativos</option>
                  <option value="deactivated">Desligados</option>
                  <option value="all">Todos</option>
                </select>
              </>
            )}
            {(activeTab === 'analysts' || activeTab === 'systems') && !selectedAnalyst && (
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
              <div className="relative">
                <button 
                  onClick={() => setIsAnalystMenuOpen(!isAnalystMenuOpen)}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center"
                  title="Ações do Analista"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                <AnimatePresence>
                  {isAnalystMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsAnalystMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                      >
                        <div className="p-2 flex flex-col gap-1">
                          <button 
                            onClick={() => { setIsAddingAnalyst(true); setIsAnalystMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Novo Analista
                          </button>
                          <button 
                            onClick={() => { setIsImportModalOpen(true); setIsAnalystMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Importar
                          </button>
                          <div className="h-px bg-slate-100 my-1" />
                          <button 
                            onClick={() => { setIsMassDeactivateModalOpen(true); setIsAnalystMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2"
                          >
                            <UserMinus className="w-4 h-4" />
                            Desligamento
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
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
              <DashboardTab 
                key="dashboard"
                dashboardViewMode={dashboardViewMode}
                setDashboardViewMode={setDashboardViewMode}
                stats={stats}
                hasPermission={hasPermission}
                requests={requests}
              />
            )}

            {activeTab === 'analysts' && (
              <AnalystsTab 
                key="analysts"
                selectedAnalyst={selectedAnalyst}
                setSelectedAnalyst={setSelectedAnalyst}
                paginatedAnalysts={paginatedAnalysts}
                filteredAnalysts={filteredAnalysts}
                hasMoreAnalysts={hasMoreAnalysts}
                setAnalystsLimit={setAnalystsLimit}
                accesses={accesses}
                systems={systems}
                canManageAnalysts={canManageAnalysts}
                canManageAccess={canManageAccess}
                deactivateAnalyst={deactivateAnalyst}
                setEditingAnalyst={setEditingAnalyst}
                setIsAddingAnalyst={setIsAddingAnalyst}
                deleteAnalyst={deleteAnalyst}
                getAnalystInitials={getAnalystInitials}
                getAnalystDisplayName={getAnalystDisplayName}
                getAnalystEmail={getAnalystEmail}
                getAnalystTrack={getAnalystTrack}
                handleUpdateAccess={handleUpdateAccess}
                analystFields={analystFields}
              />
            )}

            {activeTab === 'systems' && (
              <SystemsTab 
                key="systems"
                systems={systems}
                accesses={accesses}
                searchQuery={searchQuery}
                canManageSystems={canManageSystems}
                systemFields={systemFields}
                setEditingSystem={setEditingSystem}
                setIsAddingSystem={setIsAddingSystem}
                deleteSystem={deleteSystem}
              />
            )}

            {activeTab === 'request' && (
              <RequestTab 
                key="request"
                requestSubTab={requestSubTab}
                setRequestSubTab={setRequestSubTab}
                editingRequest={editingRequest}
                setEditingRequest={setEditingRequest}
                selectedSystemsInForm={selectedSystemsInForm}
                setSelectedSystemsInForm={setSelectedSystemsInForm}
                analystFields={analystFields}
                tracks={tracks}
                systems={systems}
                requests={requests}
                user={user}
                handleRequestAccess={handleRequestAccess}
                setActiveTab={setActiveTab}
                getAnalystInitials={getAnalystInitials}
                getAnalystDisplayName={getAnalystDisplayName}
                handleDeleteRequest={handleDeleteRequest}
              />
            )}

            {activeTab === 'approvals' && (
              <ApprovalsTab 
                key="approvals"
                requests={requests}
                systems={systems}
                analystFields={analystFields}
                selectedRequestForApproval={selectedRequestForApproval}
                setSelectedRequestForApproval={setSelectedRequestForApproval}
                rejectionReason={rejectionReason}
                setRejectionReason={setRejectionReason}
                handleApproveRequest={handleApproveRequest}
                handleRejectRequest={handleRejectRequest}
                getAnalystInitials={getAnalystInitials}
                getAnalystDisplayName={getAnalystDisplayName}
                getAnalystEmail={getAnalystEmail}
                getAnalystTrack={getAnalystTrack}
              />
            )}
            {activeTab === 'extract' && (
              <ExtractTab 
                key="extract"
                handleExportData={handleExportData}
                hasPermission={hasPermission}
                logExportAllTime={logExportAllTime}
                setLogExportAllTime={setLogExportAllTime}
                logExportStartDate={logExportStartDate}
                setLogExportStartDate={setLogExportStartDate}
                logExportEndDate={logExportEndDate}
                setLogExportEndDate={setLogExportEndDate}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsTab
                key="settings"
                hasPermission={hasPermission}
                isReorderingAnalystFields={isReorderingAnalystFields}
                setIsReorderingAnalystFields={setIsReorderingAnalystFields}
                tempAnalystFields={tempAnalystFields}
                setTempAnalystFields={setTempAnalystFields}
                analystFields={analystFields}
                setEditingField={setEditingField}
                deleteField={deleteField}
                setIsAddingField={setIsAddingField}
                isReorderingSystemFields={isReorderingSystemFields}
                setIsReorderingSystemFields={setIsReorderingSystemFields}
                tempSystemFields={tempSystemFields}
                setTempSystemFields={setTempSystemFields}
                systemFields={systemFields}
                tracks={tracks}
                setIsAddingTrack={setIsAddingTrack}
                setEditingTrack={setEditingTrack}
                deleteTrack={deleteTrack}
                users={users}
                userSearchQuery={userSearchQuery}
                setUserSearchQuery={setUserSearchQuery}
                usersLimit={usersLimit}
                setUsersLimit={setUsersLimit}
                setIsAddingUser={setIsAddingUser}
                resetUserPassword={resetUserPassword}
                setEditingUser={setEditingUser}
                deleteUser={deleteUser}
                roles={roles}
                setIsAddingRole={setIsAddingRole}
                setEditingRole={setEditingRole}
                deleteRole={deleteRole}
              />
            )}
          </AnimatePresence>
        </div>
        <Footer />
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Importação em Massa</h2>
                  <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                <p className="text-slate-500 text-sm mb-6">
                  Baixe o modelo CSV, preencha com os dados dos analistas e seus acessos, e faça o upload para criar ou atualizar em massa.
                </p>

                <div className="space-y-6">
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-indigo-600" />
                      <div>
                        <h3 className="text-sm font-bold text-indigo-900">Modelo CSV</h3>
                        <p className="text-xs text-indigo-600/70">Planilha com as colunas corretas</p>
                      </div>
                    </div>
                    <button 
                      onClick={generateTemplate}
                      className="px-4 py-2 bg-white text-indigo-600 text-sm font-bold rounded-xl shadow-sm hover:bg-indigo-50 transition-colors"
                    >
                      Baixar
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Arquivo Preenchido</label>
                    <input 
                      type="file" 
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                    />
                  </div>

                  <button 
                    onClick={() => importFile && handleImport(importFile)}
                    disabled={!importFile || isImporting}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Processar Importação
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isMassDeactivateModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Desligamento em Massa</h2>
                  <button onClick={() => { setIsMassDeactivateModalOpen(false); setMassDeactivateFile(null); setMassDeactivateField(''); }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                <p className="text-slate-500 text-sm mb-6">
                  Selecione o campo de referência, baixe o modelo CSV, preencha com os dados e faça o upload para desligar analistas em massa.
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Campo de Referência</label>
                    <select
                      value={massDeactivateField}
                      onChange={(e) => setMassDeactivateField(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-slate-700"
                    >
                      <option value="">Selecione um campo...</option>
                      {analystFields.map(f => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${massDeactivateField ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                    <div className="flex items-center gap-3">
                      <FileText className={`w-8 h-8 ${massDeactivateField ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <div>
                        <h3 className={`text-sm font-bold ${massDeactivateField ? 'text-indigo-900' : 'text-slate-500'}`}>Modelo CSV</h3>
                        <p className={`text-xs ${massDeactivateField ? 'text-indigo-600/70' : 'text-slate-400'}`}>Planilha com a coluna selecionada</p>
                      </div>
                    </div>
                    <button 
                      onClick={generateDeactivateTemplate}
                      disabled={!massDeactivateField}
                      className={`px-4 py-2 text-sm font-bold rounded-xl shadow-sm transition-colors ${massDeactivateField ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                      Baixar
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Upload do Arquivo</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".csv"
                        onChange={(e) => setMassDeactivateFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`w-full p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors ${massDeactivateFile ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50'}`}>
                        <Upload className={`w-8 h-8 ${massDeactivateFile ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className={`text-sm font-medium ${massDeactivateFile ? 'text-indigo-900' : 'text-slate-500'}`}>
                          {massDeactivateFile ? massDeactivateFile.name : 'Clique ou arraste o arquivo CSV'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => massDeactivateFile && handleMassDeactivate(massDeactivateFile)}
                    disabled={!massDeactivateFile || !massDeactivateField || isMassDeactivating}
                    className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMassDeactivating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Desligando...
                      </>
                    ) : (
                      <>
                        <UserMinus className="w-5 h-5" />
                        Processar Desligamento
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <AnalystModal
          isOpen={isAddingAnalyst || !!editingAnalyst}
          editingAnalyst={editingAnalyst}
          onClose={() => {
            setIsAddingAnalyst(false);
            setEditingAnalyst(null);
          }}
          analystFields={analystFields}
          tracks={tracks}
          systems={systems}
          accesses={accesses}
          canManageAnalysts={canManageAnalysts}
          canManageAccess={canManageAccess}
          user={user}
          logAction={logAction}
          getAnalystDisplayName={getAnalystDisplayName}
          getAnalystTrack={getAnalystTrack}
          showToast={showToast}
        />

        <SystemModal
          isOpen={isAddingSystem || !!editingSystem}
          editingSystem={editingSystem}
          onClose={() => {
            setIsAddingSystem(false);
            setEditingSystem(null);
          }}
          systemFields={systemFields}
          canManageSystems={canManageSystems}
          user={user}
          logAction={logAction}
        />

        <FieldModal
          isAddingField={isAddingField}
          editingField={editingField}
          onClose={() => {
            setIsAddingField(null);
            setEditingField(null);
          }}
          analystFields={analystFields}
          systemFields={systemFields}
          hasPermission={hasPermission}
          user={user}
          logAction={logAction}
          showToast={showToast}
        />

        <TrackModal
          isAddingTrack={isAddingTrack}
          editingTrack={editingTrack}
          onClose={() => {
            setIsAddingTrack(false);
            setEditingTrack(null);
          }}
          user={user}
          analysts={analysts}
          getAnalystTrack={getAnalystTrack}
          logAction={logAction}
        />

        <UserModal
          isAddingUser={isAddingUser}
          editingUser={editingUser}
          onClose={() => {
            setIsAddingUser(false);
            setEditingUser(null);
          }}
          roles={roles}
          handleAddUser={handleAddUser}
          showToast={showToast}
        />

        <RoleModal
          isAddingRole={isAddingRole}
          editingRole={editingRole}
          onClose={() => {
            setIsAddingRole(false);
            setEditingRole(null);
          }}
          handleAddRole={handleAddRole}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText || 'Confirmar'}
          confirmColor={confirmModal.confirmColor || 'bg-rose-600'}
          onConfirm={(password) => {
            confirmModal.onConfirm(password);
            if (!confirmModal.requirePassword) {
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
          }}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          requirePassword={confirmModal.requirePassword}
        />

        <DeleteRequestModal 
          isOpen={deleteRequestModal.isOpen}
          request={deleteRequestModal.request}
          onConfirm={confirmDeleteRequest}
          onClose={() => setDeleteRequestModal({ isOpen: false, request: null })}
        />
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
