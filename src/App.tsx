/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
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
  ChevronLeft,
  GitBranch,
  LayoutDashboard,
  Route as RouteIcon,
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
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, signOut, onAuthStateChanged, User as FirebaseUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db, auth, firebaseConfig, logDb } from './lib/firebase';
import { logAction } from './lib/auditLogger';
import DashboardTab from './components/tabs/DashboardTab';
import SettingsTab from './components/tabs/SettingsTab';
import AccessControlTab from './components/tabs/AccessControlTab';
import AnalystsTab from './components/tabs/AnalystsTab';
import SystemsTab from './components/tabs/SystemsTab';
import RequestTab from './components/tabs/RequestTab';
import ApprovalsTab from './components/tabs/ApprovalsTab';
import ExtractTab from './components/tabs/ExtractTab';
import OrganogramaTab from './components/tabs/OrganogramaTab';
import TracksTab from './components/tabs/TracksTab';
import { AnalystModal } from './components/modals/AnalystModal';
import { SystemModal } from './components/modals/SystemModal';
import { FieldModal } from './components/modals/FieldModal';
import { TrackModal } from './components/modals/TrackModal';
import { SupervisorModal } from './components/modals/SupervisorModal';
import { UserModal } from './components/modals/UserModal';
import { RoleModal } from './components/modals/RoleModal';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { DeleteRequestModal } from './components/modals/DeleteRequestModal';
import TempPasswordModal from './components/modals/TempPasswordModal';
import { cn } from './lib/utils';
import { Analyst, System, Access, AccessStatus, Track, Supervisor, FieldDefinition, User, Role, AccessRequest } from './types';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';
import Footer from './components/Footer';
import Toast, { ToastType } from './components/Toast';
import { AppNotification, AppModule, AccessLevel, LEVEL_WEIGHTS, MODULE_AVAILABLE_LEVELS } from './types';
import NotificationModal from './components/NotificationModal';

const mapLegacyPermissions = (perms: any): Record<AppModule, AccessLevel> => {
  const defaultPerms = Object.keys(MODULE_AVAILABLE_LEVELS).reduce((acc, curr) => {
    acc[curr as AppModule] = 'none';
    return acc;
  }, {} as Record<AppModule, AccessLevel>);

  if (!perms) return defaultPerms;
  
  if (!Array.isArray(perms) && typeof perms === 'object') {
    // If it's already the new format (checking keys)
    if ('dashboard' in perms && ('analysts' in perms || 'systems' in perms)) {
      return {
        ...defaultPerms,
        ...perms,
        extract_analysts: perms.extract_analysts || perms.extract || 'none',
        extract_systems: perms.extract_systems || perms.extract || 'none',
        extract_users: perms.extract_users || perms.extract || 'none',
        extract_tracks: perms.extract_tracks || perms.extract || 'none',
        extract_matrix: perms.extract_matrix || perms.extract || 'none',
        extract_logs: perms.extract_logs || perms.extract || 'none',
        settings_analysts: perms.settings_analysts || perms.settings || 'none',
        settings_systems: perms.settings_systems || perms.settings || 'none',
        settings_tracks: perms.settings_tracks || perms.settings || 'none',
        settings_supervisors: perms.settings_supervisors || perms.settings || 'none',
        settings_sound: perms.settings_sound || perms.settings || 'none',
      };
    }
    
    // Older object format
    const mapped = { ...defaultPerms };
    const p = perms as Record<string, string>;
    
    if (p['analysts'] === 'read') mapped.analysts = 'read';
    if (p['analysts'] === 'edit') mapped.analysts = 'edit';
    
    if (p['systems'] === 'read') mapped.systems = 'read';
    if (p['systems'] === 'edit') mapped.systems = 'edit';
    
    if (p['access_requests'] === 'read') mapped.requests = 'read';
    if (p['access_requests'] === 'edit') mapped.requests = 'edit';
    
    if (p['access_approvals'] === 'read') mapped.approvals = 'read';
    if (p['access_approvals'] === 'edit') mapped.approvals = 'edit';
    
    if (p['organogram'] === 'read') mapped.organogram = 'read';
    if (p['organogram'] === 'edit') mapped.organogram = 'edit';
    
    if (p['tracks'] === 'read') mapped.tracks = 'read';
    if (p['tracks'] === 'edit') mapped.tracks = 'edit';
    
    if (p['extract_data'] === 'read' || p['extract_logs'] === 'read') {
      mapped.extract_analysts = 'edit';
      mapped.extract_systems = 'edit';
      mapped.extract_users = 'edit';
      mapped.extract_tracks = 'edit';
      mapped.extract_logs = 'edit';
    }
    
    if (p['settings_fields'] === 'read' || p['settings_supervisors'] === 'read' || p['settings_users'] === 'read') {
      mapped.settings_analysts = 'read';
      mapped.settings_systems = 'read';
      mapped.settings_supervisors = 'read';
      mapped.settings_tracks = 'read';
      mapped.access_control = 'read';
    }
    if (p['settings_fields'] === 'edit' || p['settings_supervisors'] === 'edit' || p['settings_users'] === 'edit') {
      mapped.settings_analysts = 'edit';
      mapped.settings_systems = 'edit';
      mapped.settings_supervisors = 'edit';
      mapped.settings_tracks = 'edit';
      mapped.access_control = 'edit';
    }

    return mapped;
  }

  if (Array.isArray(perms)) {
    const arrayPerms = perms as string[];
    const mapped = { ...defaultPerms };
    
    if (arrayPerms.includes('systems_manage')) mapped.systems = 'edit';
    else mapped.systems = 'read';
    
    if (arrayPerms.includes('analysts_manage') || arrayPerms.includes('analysts_access_status')) mapped.analysts = 'edit';
    else mapped.analysts = 'read';
    
    if (arrayPerms.includes('request_access')) mapped.requests = 'edit';
    if (arrayPerms.includes('approve_access')) mapped.approvals = 'edit';
    if (arrayPerms.includes('extract_data') || arrayPerms.includes('extract_logs')) {
      mapped.extract_analysts = 'edit';
      mapped.extract_systems = 'edit';
      mapped.extract_users = 'edit';
      mapped.extract_tracks = 'edit';
      mapped.extract_logs = 'edit';
    }
    
    if (arrayPerms.includes('settings_tracks')) mapped.tracks = 'edit';
    else if (arrayPerms.includes('view_tracks')) mapped.tracks = 'read';
    
    if (arrayPerms.includes('settings_analyst_fields') || arrayPerms.includes('settings_supervisors') || arrayPerms.includes('settings_users') || arrayPerms.includes('settings_roles')) {
      mapped.settings_analysts = 'edit';
      mapped.settings_systems = 'edit';
      mapped.settings_supervisors = 'edit';
      mapped.settings_tracks = 'edit';
      mapped.access_control = 'edit';
    }
    
    mapped.organogram = 'read';
    mapped.dashboard = 'read';

    return mapped;
  }

  return defaultPerms;
};

// Mock Initial Data
const INITIAL_ANALYST_FIELDS: FieldDefinition[] = [
  { id: 'name', label: 'Nome', description: 'Identificação completa do colaborador.', textCase: 'any' },
  { id: 'email', label: 'E-mail', description: 'E-mail corporativo para contato.', textCase: 'any' },
  { id: 'track', label: 'Esteira', description: 'Vinculação operacional do analista.', textCase: 'any' },
  { id: 'supervisor', label: 'Supervisor', description: 'Supervisor responsável pelo analista.', textCase: 'any' },
];

const INITIAL_SYSTEM_FIELDS: FieldDefinition[] = [
  { id: 'name', label: 'Nome do Sistema', description: 'Nome comercial ou técnico da ferramenta.', textCase: 'any' },
  { id: 'description', label: 'Descrição', description: 'Finalidade e uso dentro da operação.', textCase: 'any' },
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




export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);

  const activeTab = useMemo(() => {
    const path = decodeURIComponent(location.pathname.substring(1));
    if (!path) return 'dashboard';
    if (path === 'Login') return 'login';
    if (path === 'Analistas') return 'analysts';
    if (path === 'Sistemas') return 'systems';
    if (path === 'Solicitacoes') return 'request';
    if (path === 'Aprovacoes') return 'approvals';
    if (path === 'Extracao') return 'extract';
    if (path === 'Organograma') return 'organogram';
    if (path === 'Esteiras') return 'tracks';
    if (path === 'Configuracoes') return 'settings';
    if (path === 'Permissoes') return 'access_control';
    return 'dashboard';
  }, [location.pathname]);

  const setActiveTab = (tab: string) => {
    const paths: Record<string, string> = {
      'dashboard': '/',
      'login': '/Login',
      'analysts': '/Analistas',
      'systems': '/Sistemas',
      'request': '/Solicitacoes',
      'approvals': '/Aprovacoes',
      'extract': '/Extracao',
      'organogram': '/Organograma',
      'tracks': '/Esteiras',
      'settings': '/Configuracoes',
      'access_control': '/Permissoes'
    };
    navigate(paths[tab] || '/');
  };

  const [dashboardViewMode, setDashboardViewMode] = useState<'byTrack' | 'bySystem'>('byTrack');
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [allAnalysts, setAllAnalysts] = useState<Analyst[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [analystFields, setAnalystFields] = useState<FieldDefinition[]>(INITIAL_ANALYST_FIELDS);
  const [systemFields, setSystemFields] = useState<FieldDefinition[]>(INITIAL_SYSTEM_FIELDS);
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const prevRequestsRef = useRef<AccessRequest[]>([]);
  const isInitialLoadRef = useRef(true);

  const [selectedRequestForApproval, setSelectedRequestForApproval] = useState<AccessRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestSubTab, setRequestSubTab] = useState<'new' | 'my'>('new');
  const [editingRequest, setEditingRequest] = useState<AccessRequest | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importMatchField, setImportMatchField] = useState<string>('');
  
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
  const currentSelectedAnalyst = useMemo(() => {
    if (!selectedAnalyst) return null;
    return allAnalysts.find(a => a.id === selectedAnalyst.id) || selectedAnalyst;
  }, [selectedAnalyst, allAnalysts]);
  const [editingAnalyst, setEditingAnalyst] = useState<Analyst | null>(null);
  const [editingSystem, setEditingSystem] = useState<System | null>(null);
  const [editingField, setEditingField] = useState<{ type: 'analyst' | 'system', field: FieldDefinition } | null>(null);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
  const [isAddingAnalyst, setIsAddingAnalyst] = useState(false);
  const [selectedSystemsInForm, setSelectedSystemsInForm] = useState<string[]>([]);
  const [isAddingSystem, setIsAddingSystem] = useState(false);
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const [isAddingSupervisor, setIsAddingSupervisor] = useState(false);
  const [isAddingField, setIsAddingField] = useState<{ type: 'analyst' | 'system' } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [approvalSearchQuery, setApprovalSearchQuery] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  const [usersLimit, setUsersLimit] = useState(10);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(() => localStorage.getItem('sidebarPinned') === 'true');
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const sidebarHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSidebarMouseEnter = () => {
    sidebarHoverTimeoutRef.current = setTimeout(() => {
      setIsSidebarHovered(true);
    }, 1000);
  };

  const handleSidebarMouseLeave = () => {
    if (sidebarHoverTimeoutRef.current) {
      clearTimeout(sidebarHoverTimeoutRef.current);
      sidebarHoverTimeoutRef.current = null;
    }
    setIsSidebarHovered(false);
  };
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('sidebarPinned', isSidebarPinned.toString());
  }, [isSidebarPinned]);
  const [isReorderingAnalystFields, setIsReorderingAnalystFields] = useState(false);
  const [isReorderingSystemFields, setIsReorderingSystemFields] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const notifiedRequestIdsRef = useRef<Set<string>>(new Set());

  const currentUserData = users.find(u => u.id === user?.uid || (user?.email && u.email?.toLowerCase() === user.email.toLowerCase()));
  
  const getEffectivePermission = (module: AppModule): AccessLevel => {
    // Admin check
    if (currentUserData?.roleId === 'admin' || currentUserData?.roleIds?.includes('admin')) return 'edit';
    
    let maxLevel: AccessLevel = 'none';
    let maxWeight = 0;

    const userRoles = currentUserData?.roleIds || (currentUserData?.roleId ? [currentUserData.roleId] : []);

    for (const roleId of userRoles) {
      const role = roles.find(r => r.id === roleId);
      const rolePerms = mapLegacyPermissions(role?.permissions);
      const level = rolePerms[module];
      if (level) {
        const weight = LEVEL_WEIGHTS[level];
        if (weight > maxWeight) {
          maxWeight = weight;
          maxLevel = level;
        }
      }
    }

    // Also consider legacy direct user permissions
    const userPerms = mapLegacyPermissions(currentUserData?.permissions);
    if (userPerms[module]) {
      const level = userPerms[module];
      const weight = LEVEL_WEIGHTS[level];
      if (weight > maxWeight) {
        maxWeight = weight;
        maxLevel = level;
      }
    }

    return maxLevel;
  };

  const hasPermission = (module: AppModule, requiredLevel: AccessLevel = 'read') => {
    const effective = getEffectivePermission(module);
    return LEVEL_WEIGHTS[effective] >= LEVEL_WEIGHTS[requiredLevel];
  };

  // Notification Handler
  useEffect(() => {
    if (!user || requests.length === 0) return;

    const hasApprovePermission = hasPermission('approvals', 'edit') || hasPermission('approvals', 'edit_approval');

    if (isInitialLoadRef.current) {
      // First time loading requests, don't notify but populate the set
      let initialNotifications: AppNotification[] = [];
      requests.forEach(req => {
        const key = req.id + req.status + (req.updatedAt || '');
        notifiedRequestIdsRef.current.add(key);
        
        // Check if we should exhibit this as a notification on start
        let shouldNotify = false;
        let title = '';
        let body = '';
        
        if (req.status === 'pending' && hasApprovePermission) {
          shouldNotify = true;
          const isUpdate = req.updatedAt && req.updatedAt !== req.requestedAt;
          title = isUpdate ? 'Solicitação Atualizada' : 'Nova Solicitação';
          body = isUpdate 
            ? `A solicitação ${req.requestNumber} foi ajustada por ${req.requestedByName}.`
            : `Solicitação ${req.requestNumber} de ${req.requestedByName} aguardando aprovação.`;
        } else if (req.status === 'rejected' && req.requestedBy === user?.uid) {
          shouldNotify = true;
          title = 'Solicitação Reprovada';
          body = `Sua solicitação ${req.requestNumber} foi reprovada.`;
        }

        if (shouldNotify) {
          initialNotifications.push({
            id: Math.random().toString(36).substring(2),
            title,
            body,
            type: req.status === 'pending' ? 'request_pending' : (req.status === 'approved' ? 'request_approved' : 'request_rejected'),
            requestId: req.id,
            timestamp: req.updatedAt ? new Date(req.updatedAt).getTime() : Date.now()
          });
        }
      });
      
      prevRequestsRef.current = requests;
      isInitialLoadRef.current = false;
      
      if (initialNotifications.length > 0) {
        setAppNotifications(initialNotifications.sort((a, b) => b.timestamp - a.timestamp));
        setIsNotificationModalOpen(true);
      }
      return;
    }

    requests.forEach(req => {
      const notificationKey = req.id + req.status + (req.updatedAt || '');
      if (notifiedRequestIdsRef.current.has(notificationKey)) return;

      const metadata = {
        title: '',
        body: ''
      };

      // New or Updated Pending Request (Notify Admins/Approvers)
      if (req.status === 'pending' && hasApprovePermission) {
        const isUpdate = req.updatedAt && req.updatedAt !== req.requestedAt;
        metadata.title = isUpdate ? 'Solicitação Atualizada' : 'Nova Solicitação';
        metadata.body = isUpdate 
          ? `A solicitação ${req.requestNumber} foi ajustada por ${req.requestedByName} e requer nova análise.`
          : `Solicitação ${req.requestNumber} de ${req.requestedByName} aguardando aprovação.`;
      }

      // Action on Request (Notify Requester OR Admin)
      if (req.status === 'rejected' && (req.requestedBy === user?.uid || hasApprovePermission)) {
        metadata.title = 'Solicitação Reprovada';
        metadata.body = `A solicitação ${req.requestNumber} foi reprovada.`;
      }

      if (metadata.title) {
        sendNotification();
        
        // Add to in-app notifications - replace existing one for same request if it exists
        const newNotification: AppNotification = {
          id: Math.random().toString(36).substring(2),
          title: metadata.title,
          body: metadata.body,
          requestId: req.id,
          type: req.status === 'pending' ? 'request_pending' : (req.status === 'approved' ? 'request_approved' : 'request_rejected'),
          timestamp: Date.now()
        };
        
        setAppNotifications(prev => {
          // Remove any existing notification for this request to avoid duplicates
          const filtered = prev.filter(n => n.requestId !== req.id);
          return [newNotification, ...filtered];
        });
        setIsNotificationModalOpen(true);
      }

      notifiedRequestIdsRef.current.add(notificationKey);
    });

    prevRequestsRef.current = requests;
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
    }
  }, [requests, user, users, roles]);

  // Sync notifications with request statuses
  useEffect(() => {
    setAppNotifications(prev => prev.filter(notification => {
      const request = requests.find(r => r.id === notification.requestId);
      // If the request no longer exists, remove its notification
      if (!request) return false;

      // Handle specific notification types
      switch (notification.type) {
        case 'request_pending':
          // Approver notification: only show if still pending
          return request.status === 'pending';
        
        case 'request_approved':
          // Solicitor notification: only show if still approved
          return request.status === 'approved';
        
        case 'request_rejected':
          // Solicitor notification: only show if still rejected
          return request.status === 'rejected';
        
        default:
          return true;
      }
    }));
  }, [requests]);

  const playSystemSound = async (soundId: string) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const playTone = (frequency: number, startTime: number, duration: number, volume: number, type: OscillatorType = 'sine') => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;

      switch (soundId) {
        case 'success':
          playTone(523.25, now, 0.2, 0.1);
          playTone(659.25, now + 0.1, 0.2, 0.1);
          playTone(783.99, now + 0.2, 0.4, 0.1);
          break;
        case 'alert':
          playTone(880, now, 0.1, 0.1, 'square');
          playTone(880, now + 0.15, 0.1, 0.1, 'square');
          playTone(440, now + 0.3, 0.4, 0.08);
          break;
        case 'soft':
          playTone(329.63, now, 0.8, 0.1);
          playTone(493.88, now + 0.2, 0.8, 0.05);
          break;
        case 'techno':
          playTone(1046.50, now, 0.05, 0.1, 'triangle');
          playTone(1318.51, now + 0.05, 0.05, 0.1, 'triangle');
          playTone(1567.98, now + 0.1, 0.1, 0.1, 'triangle');
          break;
        case 'chime':
        default:
          playTone(659.25, now, 0.4, 0.1);
          playTone(987.77, now + 0.12, 0.5, 0.08);
          break;
      }
    } catch (error) {
      console.warn("Som de notificação bloqueado:", error);
    }
  };

  const sendNotification = () => {
    const currentUserData = users.find(u => u.id === user?.uid);
    const soundId = currentUserData?.notificationSound || 'chime';
    playSystemSound(soundId);
  };

  // No physical audio file needed as we generate the chime via Web Audio API

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const [analystStatusFilter, setAnalystStatusFilter] = useState<'all' | 'active' | 'deactivated'>('active');
  const [systemCompanyFilter, setSystemCompanyFilter] = useState<string>('all');
  const [analystAccessStatusFilter, setAnalystAccessStatusFilter] = useState<'all' | 'ok' | 'pending' | 'lost' | 'none'>('all');
  const [analystSupervisorFilter, setAnalystSupervisorFilter] = useState<string>('all');
  const [searchField, setSearchField] = useState<string>('all');
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
  const [tempPasswordModal, setTempPasswordModal] = useState<{
    isOpen: boolean;
    userName: string;
    userEmail: string;
    tempPassword: string;
  }>({
    isOpen: false,
    userName: '',
    userEmail: '',
    tempPassword: ''
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
      supervisors: ref(db, 'supervisors'),
      accesses: ref(db, 'accesses'),
      analystFields: ref(db, 'config/analystFields'),
      systemFields: ref(db, 'config/systemFields'),
      users: ref(db, 'users'),
      roles: ref(db, 'roles'),
      requests: ref(db, 'requests'),
    };

    // Query for analysts with pagination
    const analystsQuery = query(
      refs.analysts,
      orderByChild('name'),
      limitToFirst(analystsLimit)
    );

    const unsubscribes = [
      onValue(refs.users, (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const list = Object.entries(data).map(([id, val]: [string, any]) => ({ ...val, id }));
            setUsers(list);
          } else {
            setUsers([]);
          }
        } catch (error) {
          console.error("Erro no listener de usuários:", error);
        } finally {
          setIsUsersLoaded(true);
        }
      }),
      onValue(refs.roles, (snapshot) => {
        try {
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
                permissions: Object.keys(MODULE_AVAILABLE_LEVELS).reduce((acc, curr) => {
                  acc[curr as AppModule] = 'edit';
                  return acc;
                }, {} as Record<AppModule, AccessLevel>),
                isSystem: true
              },
              {
                id: 'supervisor',
                name: 'Supervisor',
                permissions: Object.keys(MODULE_AVAILABLE_LEVELS).reduce((acc, curr) => {
                  acc[curr as AppModule] = 'read';
                  return acc;
                }, {} as Record<AppModule, AccessLevel>),
                isSystem: true
              }
            ];
            defaultRoles.forEach(role => set(ref(db, `roles/${role.id}`), role));
          }
        } catch (error) {
          console.error("Erro no listener de perfis:", error);
        }
      }),
      onValue(refs.requests, (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const list = Object.entries(data).map(([id, val]: [string, any]) => ({ ...val, id }));
            setRequests(list);
          } else {
            setRequests([]);
          }
        } catch (error) {
          console.error("Erro no listener de solicitações:", error);
        }
      }),
      onValue(analystsQuery, (snapshot) => {
        try {
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
        } catch (error) {
          console.error("Erro no listener de analistas (paginado):", error);
        }
      }),
      onValue(refs.analysts, (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const list = Object.entries(data).map(([id, val]: [string, any]) => ({ ...val, id }));
            setAllAnalysts(list);
          } else {
            setAllAnalysts([]);
          }
        } catch (error) {
          console.error("Erro no listener de todos analistas:", error);
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
      onValue(refs.supervisors, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.entries(data).map(([id, val]: [string, any]) => ({ ...val, id }));
          setSupervisors(list);
        } else {
          setSupervisors([]);
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
          const validItems = (arr.filter(item => item && typeof item === 'object' && 'id' in item) as any[]).map(item => {
            if (item.options && !Array.isArray(item.options)) {
              return { ...item, options: Object.values(item.options) };
            }
            return item;
          }) as FieldDefinition[];
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
      
      // Search across selected field or all fields
      const matchesSearch = searchField === 'all' 
        ? (analystFields.some(field => {
            const val = a[field.id];
            return val && typeof val === 'string' && val.toLowerCase().includes(searchLower);
          }) || 
          (a.name && a.name.toLowerCase().includes(searchLower)) ||
          (a.email && a.email.toLowerCase().includes(searchLower)) ||
          (getAnalystTrack(a) && getAnalystTrack(a).toLowerCase().includes(searchLower)))
        : (a[searchField] && typeof a[searchField] === 'string' && a[searchField].toLowerCase().includes(searchLower));
      
      const matchesStatus = analystStatusFilter === 'all' || 
                           (analystStatusFilter === 'active' && !a.deactivatedAt) ||
                           (analystStatusFilter === 'deactivated' && !!a.deactivatedAt);
                           
      const matchesSupervisor = analystSupervisorFilter === 'all' ? true :
                                analystSupervisorFilter === 'none' ? (!a.supervisor && !analystFields.some(f => (f.id === 'supervisor' || f.id.toLowerCase().includes('supervisor') || f.label.toLowerCase().includes('supervisor')) && a[f.id])) :
                                (a.supervisor === analystSupervisorFilter ||
                                analystFields.some(f => (f.id === 'supervisor' || f.id.toLowerCase().includes('supervisor') || f.label.toLowerCase().includes('supervisor')) && a[f.id] === analystSupervisorFilter));

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
      
      return matchesSearch && matchesStatus && matchesAccessStatus && matchesSupervisor;
    });
    
    // Sort by name
    filtered.sort((a, b) => {
      const nameA = a.name || a.nome || a.email || a.email_interfile || '';
      const nameB = b.name || b.nome || b.email || b.email_interfile || '';
      return nameA.localeCompare(nameB);
    });
    
    return filtered;
  }, [allAnalysts, searchQuery, searchField, analystStatusFilter, analystAccessStatusFilter, analystSupervisorFilter, analystFields, accesses]);

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

  const mergedSupervisors = useMemo(() => {
    const userSupervisors = users
      .filter(u => {
        const role = roles.find(r => r.id === u.roleId);
        return role?.name.toLowerCase() === 'supervisor';
      })
      .map(u => ({ id: u.id, name: u.name, isUser: true }));
    
    const manualSupervisors = supervisors.map(s => ({ ...s, isUser: false }));
    
    const combined = [...manualSupervisors];
    userSupervisors.forEach(us => {
      if (!combined.find(s => s.name.toLowerCase() === us.name.toLowerCase())) {
        combined.push(us);
      }
    });
    
    return combined.sort((a, b) => a.name.localeCompare(b.name));
  }, [users, supervisors, roles]);

  const handleUpdateAccess = (analystId: string, systemId: string, status: AccessStatus) => {
    const permLevel = getEffectivePermission('analysts_manage_access');
    if (permLevel === 'none' || permLevel === 'read') return;
    
    const currentUserData = users.find(u => u.id === user?.uid);
    const finalNeedsApproval = permLevel === 'edit_approval';

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
        requestedByName: currentUserData?.name || user?.email || 'Usuário',
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
            `Solicitou mudança de status do sistema ${system?.name || systemId} para o analista ${getAnalystDisplayName(analyst)}: ${status}`, 
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
      showToast("Status de acesso atualizado com sucesso!", "success");
      if (user?.email && oldAccess?.status !== status) {
        logAction(
          user.email, 
          'UPDATE_ACCESS_STATUS', 
          `Alterou status do sistema ${system?.name || systemId} para o analista ${getAnalystDisplayName(analyst)}: ${status}`, 
          'Analistas',
          oldAccess || { status: 'N/A' },
          newData
        );
      }
    });
  };



  const handleRequestAccess = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasPermission('requests', 'edit_approval') && !hasPermission('requests', 'edit')) return;
    
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
      if (field.textCase === 'uppercase') {
        analystData[field.id] = value.toUpperCase();
      } else if (field.textCase === 'lowercase') {
        analystData[field.id] = value.toLowerCase();
      } else {
        analystData[field.id] = value;
      }
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
        requestedByEmail: user?.email || '',
        requestedByName: currentUserData?.name || user?.email || 'Desconhecido',
        requestedAt,
        updatedAt: new Date().toISOString()
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
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
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
    if (!hasPermission('approvals', 'edit') || isProcessingApproval) return;
    
    setIsProcessingApproval(true);
    try {
      // Check if request is already processed
      const requestSnap = await get(ref(db, `requests/${request.id}`));
      const currentRequestData = requestSnap.val();
      
      if (!currentRequestData || currentRequestData.status !== 'pending') {
        showToast("Esta solicitação já foi processada.", "info");
        setSelectedRequestForApproval(null);
        return;
      }

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
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        if (user?.email) {
          await logAction(
            user.email, 
            'APPROVE_REQUEST', 
            `Aprovou mudança de status do sistema ${system?.name || systemId} para o analista ${getAnalystDisplayName(analyst)}: ${newStatus}`, 
            'Solicitações',
            request,
            newData
          );
        }

        setSelectedRequestForApproval(null);
        showToast("Mudança de status aprovada!", "success");
        return;
      }

      if (request.type === 'edit_analyst') {
        const analystId = request.analystData?.id;
        if (!analystId) return;

        const analystData = { ...request.analystData };
        
        // Ensure no undefined values
        Object.keys(analystData).forEach(key => {
          if (analystData[key] === undefined) delete analystData[key];
        });

        await update(ref(db, `analysts/${analystId}`), analystData);

        // Update Request
        await update(ref(db, `requests/${request.id}`), {
          status: 'approved',
          approvedBy: user?.uid || '',
          approvedByName: currentUserData?.name || user?.email || 'Desconhecido',
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        if (user?.email) {
          await logAction(
            user.email, 
            'APPROVE_REQUEST', 
            `Aprovou edição de dados do analista ${getAnalystDisplayName(analystData as Analyst)}`, 
            'Solicitações',
            request,
            analystData
          );
        }

        setSelectedRequestForApproval(null);
        showToast("Edição de analista aprovada!", "success");
        return;
      }

      if (request.type === 'offboard_analyst') {
        const analystId = request.analystData?.id;
        if (!analystId) return;

        await update(ref(db, `analysts/${analystId}`), {
          deactivatedAt: new Date().toISOString()
        });

        await update(ref(db, `requests/${request.id}`), {
          status: 'approved',
          approvedBy: user?.uid || '',
          approvedByName: currentUserData?.name || user?.email || 'Desconhecido',
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        if (user?.email) {
          await logAction(
            user.email, 
            'APPROVE_REQUEST', 
            `Aprovou desligamento do analista ${getAnalystDisplayName(request.analystData as Analyst)}`, 
            'Solicitações',
            request,
            request.analystData
          );
        }

        setSelectedRequestForApproval(null);
        showToast("Desligamento de analista aprovado!", "success");
        return;
      }

      if (request.type === 'delete_analyst') {
        const analystId = request.analystData?.id;
        if (!analystId) return;

        await remove(ref(db, `analysts/${analystId}`));
        const accessesToRemove = accesses.filter(a => a.analystId === analystId);
        for (const access of accessesToRemove) {
          await remove(ref(db, `accesses/${access.analystId}_${access.systemId}`));
        }

        await update(ref(db, `requests/${request.id}`), {
          status: 'approved',
          approvedBy: user?.uid || '',
          approvedByName: currentUserData?.name || user?.email || 'Desconhecido',
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        if (user?.email) {
          await logAction(
            user.email, 
            'APPROVE_REQUEST', 
            `Aprovou exclusão do analista ${getAnalystDisplayName(request.analystData as Analyst)}`, 
            'Solicitações',
            request,
            request.analystData
          );
        }

        setSelectedRequestForApproval(null);
        showToast("Exclusão de analista aprovada!", "success");
        return;
      }

      // For creation requests, use request.id as analystId to ensure idempotency
      const analystId = request.id;
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
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
    } catch (error) {
      console.error("Error approving request:", error);
      showToast("Erro ao aprovar solicitação.", "error");
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    if (!hasPermission('approvals', 'edit') || isProcessingApproval) return;
    
    if (!reason || !reason.trim()) {
      showToast("O motivo da rejeição é obrigatório.", "error");
      return;
    }

    setIsProcessingApproval(true);
    try {
      // Check if request is already processed
      const requestSnap = await get(ref(db, `requests/${requestId}`));
      const currentRequestData = requestSnap.val();
      
      if (!currentRequestData || currentRequestData.status !== 'pending') {
        showToast("Esta solicitação já foi processada.", "info");
        setSelectedRequestForApproval(null);
        return;
      }

      const currentUserData = users.find(u => u.id === user?.uid);

      await update(ref(db, `requests/${requestId}`), {
        status: 'rejected',
        approvedBy: user?.uid || '',
        approvedByName: currentUserData?.name || user?.email || 'Desconhecido',
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rejectionReason: reason.trim()
      });

      if (user?.email) {
        await logAction(
          user.email, 
          'REJECT_REQUEST', 
          `Rejeitou solicitação ${currentRequestData.requestNumber || requestId}. Motivo: ${reason.trim()}`, 
          'Solicitações',
          currentRequestData,
          { ...currentRequestData, status: 'rejected', rejectionReason: reason.trim() }
        );
      }

      setSelectedRequestForApproval(null);
      setRejectionReason('');
      showToast("Solicitação rejeitada.", "info");
    } catch (error) {
      console.error("Error rejecting request:", error);
      showToast("Erro ao rejeitar solicitação.", "error");
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const deactivateAnalyst = (id: string) => {
    const permLevel = getEffectivePermission('analysts_offboard');
    if (permLevel === 'none' || permLevel === 'read') return;

    const analyst = allAnalysts.find(a => a.id === id);
    if (!analyst || analyst.deactivatedAt) return;

    const needsApproval = permLevel === 'edit_approval';

    setConfirmModal({
      isOpen: true,
      title: 'Desligar Analista',
      message: needsApproval 
        ? `Solicitar o desligamento do analista ${getAnalystDisplayName(analyst)}? Esta ação dependerá de aprovação.`
        : `Tem certeza que deseja desligar o analista ${getAnalystDisplayName(analyst)}? Após o desligamento, os dados não poderão ser alterados nem excluídos.`,
      confirmText: needsApproval ? 'Solicitar Desligamento' : 'Desligar',
      confirmColor: 'bg-rose-600',
      onConfirm: async () => {
        try {
          if (needsApproval) {
            const requestId = push(ref(db, 'requests')).key || Math.random().toString(36).substring(2, 15);
            const requestNumber = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
            const currentUserData = users.find(u => u.id === user?.uid);
            
            const requestData: AccessRequest = {
              id: requestId,
              requestNumber,
              type: 'offboard_analyst',
              status: 'pending',
              requestedBy: user?.uid || '',
              requestedByName: currentUserData?.name || user?.email || 'Usuário',
              requestedAt: new Date().toISOString(),
              analystData: analyst
            };

            await set(ref(db, `requests/${requestId}`), requestData);
            if (user?.email) {
              await logAction(user.email, 'CREATE_REQUEST', `Solicitou desligamento do analista: ${getAnalystDisplayName(analyst)}`, 'Solicitações', null, requestData);
            }
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            showToast("Solicitação de desligamento enviada para aprovação!", "success");
          } else {
            await update(ref(db, `analysts/${id}`), { 
              deactivatedAt: new Date().toISOString() 
            });
            if (user?.email) {
              await logAction(user.email, 'DEACTIVATE_ANALYST', `Desligou o analista: ${getAnalystDisplayName(analyst)}`, 'Analistas');
            }
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            showToast("Analista desligado com sucesso!", "success");
          }
        } catch (error: any) {
          showToast("Erro ao desligar analista: " + error.message, "error");
        }
      }
    });
  };

  const deleteAnalyst = (id: string) => {
    const permLevel = getEffectivePermission('analysts_delete');
    if (permLevel === 'none' || permLevel === 'read') return;

    const analyst = allAnalysts.find(a => a.id === id);
    if (!analyst) return;
    if (analyst.deactivatedAt) {
      showToast("Analistas desligados não podem ser excluídos.", "error");
      return;
    }

    const needsApproval = permLevel === 'edit_approval';

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Analista',
      message: needsApproval 
        ? `Solicitar a exclusão do analista ${getAnalystDisplayName(analyst)}? Esta ação dependerá de aprovação.`
        : 'Tem certeza que deseja excluir este analista? Esta ação não pode ser desfeita.',
      confirmText: needsApproval ? 'Solicitar Exclusão' : 'Excluir',
      confirmColor: 'bg-rose-600',
      onConfirm: async () => {
        try {
          if (needsApproval) {
            const requestId = push(ref(db, 'requests')).key || Math.random().toString(36).substring(2, 15);
            const requestNumber = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
            const currentUserData = users.find(u => u.id === user?.uid);
            
            const requestData: AccessRequest = {
              id: requestId,
              requestNumber,
              type: 'delete_analyst',
              status: 'pending',
              requestedBy: user?.uid || '',
              requestedByName: currentUserData?.name || user?.email || 'Usuário',
              requestedAt: new Date().toISOString(),
              analystData: analyst
            };

            await set(ref(db, `requests/${requestId}`), requestData);
            if (user?.email) {
              await logAction(user.email, 'CREATE_REQUEST', `Solicitou exclusão do analista: ${getAnalystDisplayName(analyst)}`, 'Solicitações', null, requestData);
            }
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            showToast("Solicitação de exclusão enviada para aprovação!", "success");
          } else {
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
          }
        } catch (error) {
          console.error("Error deleting analyst:", error);
          showToast("Erro ao excluir analista. Tente novamente.", "error");
        }
      }
    });
  };

  const deleteSystem = (id: string) => {
    if (!hasPermission('systems_delete', 'edit') && !hasPermission('systems_delete', 'edit_approval')) return;
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
    if (!hasPermission('tracks', 'edit')) return;
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

  const deleteSupervisor = (supervisor: Supervisor) => {
    if (!hasPermission('settings_supervisors', 'edit')) return;
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Supervisor',
      message: `Tem certeza que deseja excluir o supervisor "${supervisor.name}"?`,
      confirmText: 'Excluir',
      confirmColor: 'bg-rose-600',
      onConfirm: async () => {
        try {
          await remove(ref(db, `supervisors/${supervisor.id}`));
          if (user?.email) {
            await logAction(user.email, 'DELETE_SUPERVISOR', `Excluiu o supervisor: ${supervisor.name}`, 'Configurações');
          }
          const analystsToUpdate = allAnalysts.filter(a => a.supervisor === supervisor.name);
          for (const analyst of analystsToUpdate) {
            await update(ref(db, `analysts/${analyst.id}`), { supervisor: '' });
          }
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          showToast("Supervisor excluído com sucesso!", "success");
        } catch (error) {
          console.error("Error deleting supervisor:", error);
          showToast("Erro ao excluir supervisor. Tente novamente.", "error");
        }
      }
    });
  };

  const handleAddUser = async (userData: { name: string, email: string, roleIds: string[] }) => {
    if (!hasPermission('access_control', 'edit')) {
      showToast("Erro: Você não tem permissão para realizar esta ação.", "error");
      return;
    }
    
    const { name, email, roleIds } = userData;

    if (editingUser) {
      try {
        const newData: any = { name, email, roleIds };
        let tempPwd = null;
        
        if (email.toLowerCase().trim() !== editingUser.email?.toLowerCase().trim()) {
          tempPwd = generateTempPassword();
          newData.mustChangePassword = true;
          newData.tempPassword = tempPwd;
          newData.authPassword = null;
          newData.tempPasswordUpdatedAt = new Date().toISOString();
        }

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
        
        if (tempPwd) {
          setTempPasswordModal({
            isOpen: true,
            userName: name,
            userEmail: email,
            tempPassword: tempPwd
          });
        }
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
          roleIds, 
          mustChangePassword: true,
          tempPassword: null,
          authPassword: null
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

  const handleAddRole = (e: React.FormEvent<HTMLFormElement>, rolePermissions: Record<AppModule, AccessLevel>) => {
    e.preventDefault();
    if (!hasPermission('access_control', 'edit')) return;
    const formData = new FormData(e.currentTarget);
    const name = editingRole?.isSystem ? editingRole.name : formData.get('name') as string;

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
                  const newData = { name, permissions: rolePermissions };
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
      
      const newData = { name, permissions: rolePermissions };
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
      set(ref(db, `roles/${id}`), { id, name, permissions: rolePermissions, isSystem: false });
      if (user?.email) {
        logAction(user.email, 'CREATE_ROLE', `Criou o perfil: ${name}`, 'Configurações');
      }
    }
    setIsAddingRole(false);
  };

  const deleteUser = (id: string) => {
      if (!hasPermission('access_control', 'edit')) return;
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

  const updateUserNotificationSound = async (soundId: string) => {
    if (!user) return;
    try {
      await set(ref(db, `users/${user.uid}/notificationSound`), soundId);
      playSystemSound(soundId);
      showToast("Preferência de som atualizada!", "success");
    } catch (err: any) {
      showToast("Erro ao atualizar som: " + err.message, "error");
    }
  };

  const generateTempPassword = () => {
    const lettersUpper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lettersLower = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const specials = "!@#$%&*";

    let pass = "Tmp#";
    for (let i = 0; i < 2; i++) pass += lettersUpper.charAt(Math.floor(Math.random() * lettersUpper.length));
    for (let i = 0; i < 2; i++) pass += lettersLower.charAt(Math.floor(Math.random() * lettersLower.length));
    for (let i = 0; i < 2; i++) pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pass += specials.charAt(Math.floor(Math.random() * specials.length));

    return pass;
  };

  const resetUserPassword = (id: string) => {
      if (!hasPermission('access_control', 'edit')) return;
      const targetUser = users.find(u => u.id === id);
      if (!targetUser) return;

      setConfirmModal({
          isOpen: true,
          title: 'Resetar Senha',
          message: `Para redefinir a senha do usuário ${targetUser.name} (${targetUser.email}), insira sua senha atual para confirmar a ação.`,
          confirmText: 'Gerar Senha Temporária',
          confirmColor: 'bg-amber-500',
          requirePassword: true,
          onConfirm: async (password?: string) => {
              try {
                  if (!password) {
                      showToast("Senha é obrigatória.", "error");
                      return;
                  }
                  if (user?.email) {
                      try {
                          const credential = EmailAuthProvider.credential(user.email, password);
                          await reauthenticateWithCredential(user, credential);
                      } catch (reauthErr: any) {
                          const currentUserData = users.find(u => u.id === user.uid || u.email?.toLowerCase() === user.email?.toLowerCase());
                          const validAdminPasswords = [
                              currentUserData?.authPassword,
                              currentUserData?.tempPassword,
                              'InterFile123$$',
                              'Interfile123$$'
                          ].filter(Boolean);

                          if (!validAdminPasswords.includes(password)) {
                              throw reauthErr;
                          }
                      }
                  }

                  const response = await fetch('/api/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: targetUser.email,
                      currentAuthPassword: (targetUser as any).authPassword,
                      currentTempPassword: targetUser.tempPassword
                    })
                  });
                  const resData = await response.json();
                  if (!response.ok || !resData.success) {
                    throw new Error(resData.error || 'Falha ao comunicar com o servidor de reset.');
                  }

                  const newTempPassword = resData.tempPassword;

                  await update(ref(db, `users/${id}`), {
                    mustChangePassword: true,
                    tempPassword: null,
                    authPassword: null,
                    tempPasswordUpdatedAt: new Date().toISOString()
                  });

                  if (user?.email) {
                    await logAction(
                      user.email, 
                      'RESET_PASSWORD', 
                      `Gerou senha temporária para o usuário: ${targetUser.name || id} (${targetUser.email || ''})`, 
                      'Configurações'
                    );
                  }

                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  setTempPasswordModal({
                    isOpen: true,
                    userName: targetUser.name || 'Usuário',
                    userEmail: targetUser.email || '',
                    tempPassword: newTempPassword
                  });
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
      if (!hasPermission('access_control', 'edit')) return;
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
        
        const matchFieldId = importMatchField || 'email_interfile';
        const matchValue = analystData[matchFieldId];
        
        if (!matchValue) continue; // Match field is required
        
        validRows++;
        const matchValueLower = String(matchValue).toLowerCase();

        let analystId = allAnalysts.find(a => {
           const val = a[matchFieldId];
           return val && typeof val === 'string' && val.toLowerCase() === matchValueLower;
        })?.id;
        
        if (!analystId) {
          const existingNew = Object.entries(newAnalysts).find(([id, a]: [string, any]) => {
             const val = a[matchFieldId];
             return val && typeof val === 'string' && val.toLowerCase() === matchValueLower;
          });
          if (existingNew) {
            analystId = existingNew[0];
            newAnalysts[analystId] = { ...newAnalysts[analystId], ...analystData };
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
           const existingAnalyst = updates[`analysts/${analystId}`] || allAnalysts.find(a => a.id === analystId);
           updates[`analysts/${analystId}`] = { ...existingAnalyst, ...analystData, updatedAt: new Date().toISOString() };
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

  const handleExportData = async (
    type: 'analysts' | 'systems' | 'users' | 'tracks' | 'accesses' | 'logs',
    selectedColumns?: string[],
    statusFilter: 'all' | 'active' | 'deactivated' = 'all'
  ) => {
    if (type === 'analysts' && !hasPermission('extract_analysts', 'read')) return;
    if (type === 'systems' && !hasPermission('extract_systems', 'read')) return;
    if (type === 'users' && !hasPermission('extract_users', 'read')) return;
    if (type === 'tracks' && !hasPermission('extract_tracks', 'read')) return;
    if (type === 'accesses' && !hasPermission('extract_matrix', 'read')) return;
    if (type === 'logs' && !hasPermission('extract_logs', 'read')) return;
    
    showToast("Preparando exportação...", "info");
    
    try {
      let dataToExport: any[] = [];
      let filename = '';

      switch (type) {
        case 'analysts':
          const analystsSnapshot = await get(ref(db, 'analysts'));
          const analystsData = analystsSnapshot.val();
          if (analystsData) {
            let analystsList = Object.values(analystsData) as any[];
            
            // Apply status filter
            if (statusFilter === 'active') analystsList = analystsList.filter(a => !a.deactivatedAt);
            else if (statusFilter === 'deactivated') analystsList = analystsList.filter(a => a.deactivatedAt);

            // 1. Identify all headers
            const defaultHeaders = ['Nome', 'Email', 'Esteira', 'Data de Criação', 'Data de Desligamento', 'Aprovado Por'];
            const customHeadersSet = new Set<string>();
            analystFields.forEach(f => {
               if (!['name', 'email', 'track', 'email_interfile', 'esteira', 'createdAt', 'deactivatedAt', 'approvedByName'].includes(f.id) && !f.id.toLowerCase().includes('esteira')) {
                  customHeadersSet.add(f.label);
               }
            });
            analystsList.forEach(val => {
              Object.keys(val).forEach(key => {
                if (!['id', 'name', 'email', 'track', 'email_interfile', 'esteira', 'createdAt', 'deactivatedAt', 'approvedBy', 'approvedByName'].includes(key) && !key.toLowerCase().includes('esteira')) {
                  const field = analystFields.find(f => f.id === key);
                  customHeadersSet.add(field?.label || key);
                }
              });
            });

            const allPossibleHeaders = [...defaultHeaders, ...Array.from(customHeadersSet)];
            const headersToUse = selectedColumns && selectedColumns.length > 0 
              ? allPossibleHeaders.filter(h => selectedColumns.includes(h))
              : allPossibleHeaders;

            // 2. Build rows
            dataToExport = analystsList.map(val => {
              const row: any = {};
              headersToUse.forEach(header => {
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
            const perms = Object.entries(u.permissions || {}).filter(([_, level]) => level !== 'none');
            if (perms.length === 0) {
              dataToExport.push({
                Nome: u.name,
                Email: u.email,
                Perfil: role?.name || 'Personalizado',
                Acesso: 'Nenhum'
              });
            } else {
              perms.forEach(([res, level]) => {
                dataToExport.push({
                  Nome: u.name,
                  Email: u.email,
                  Perfil: role?.name || 'Personalizado',
                  Acesso: `${res} (${level})`
                });
              });
            }
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
            const allAnalystsRaw = analystsSnapshot.val() || {};
            let accessesList = Object.values(accessesData) as any[];
            
            // Filter by analyst status
            if (statusFilter !== 'all') {
              accessesList = accessesList.filter(acc => {
                const analyst = allAnalystsRaw[acc.analystId];
                if (!analyst) return false;
                if (statusFilter === 'active') return !analyst.deactivatedAt;
                if (statusFilter === 'deactivated') return !!analyst.deactivatedAt;
                return true;
              });
            }

            // 1. Identify all headers
            const defaultHeaders = ['Nome Sistema', 'Status', 'Última Atualização', 'Nome', 'Email', 'Esteira', 'Data de Criação', 'Data de Desligamento', 'Aprovado Por'];
            const customHeadersSet = new Set<string>();
            analystFields.forEach(f => {
               if (!['name', 'email', 'track', 'email_interfile', 'esteira', 'createdAt', 'deactivatedAt', 'approvedByName'].includes(f.id) && !f.id.toLowerCase().includes('esteira')) {
                  customHeadersSet.add(f.label);
               }
            });
            Object.values(allAnalystsRaw).forEach((analyst: any) => {
              Object.keys(analyst).forEach(key => {
                if (!['id', 'name', 'email', 'track', 'supervisor', 'email_interfile', 'esteira', 'createdAt', 'deactivatedAt', 'approvedBy', 'approvedByName'].includes(key) && !key.toLowerCase().includes('esteira')) {
                  const field = analystFields.find(f => f.id === key);
                  customHeadersSet.add(field?.label || key);
                }
              });
            });

            const allPossibleHeaders = [...defaultHeaders, ...Array.from(customHeadersSet)];
            const headersToUse = selectedColumns && selectedColumns.length > 0 
              ? allPossibleHeaders.filter(h => selectedColumns.includes(h))
              : allPossibleHeaders;

            // 2. Build rows
            dataToExport = accessesList.map((acc: any) => {
              const analyst = allAnalystsRaw[acc.analystId] || {};
              const system = systems.find(s => s.id === acc.systemId);
              
              const row: any = {};
              headersToUse.forEach(header => {
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
          filename = 'matriz_acessos';
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
              .map((l: any) => {
                const logUser = users.find(u => u.email === l.userEmail);
                return {
                  Data: l.timestamp ? new Date(l.timestamp).toLocaleString('pt-BR') : '',
                  Usuário: logUser?.name || l.userEmail,
                  Email: l.userEmail,
                  Ação: l.action,
                  Módulo: l.module,
                  Detalhes: l.details,
                  'Dados Antigos': l.oldData || '',
                  'Dados Novos': l.newData || ''
                };
              });
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
    if (type === 'analyst' && !hasPermission('settings_analysts', 'edit')) return;
    if (type === 'system' && !hasPermission('settings_systems', 'edit')) return;

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

  if (loading || (user && !isUsersLoaded)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <div className="flex-1 flex items-center justify-center">
          Carregando...
        </div>
        <Footer />
      </div>
    );
  }

  const canViewAnalysts = hasPermission('analysts', 'read');
  const isSupervisor = currentUserData?.roleId === 'supervisor' || roles.find(r => r.id === currentUserData?.roleId)?.name.toLowerCase() === 'supervisor';

  const canViewSettings = hasPermission('settings_analysts', 'read') || hasPermission('settings_systems', 'read') || hasPermission('settings_supervisors', 'read') || hasPermission('settings_tracks', 'read') || hasPermission('settings_sound', 'read') || isSupervisor;

  const canViewAccessControl = hasPermission('access_control', 'read');

  const canManageAnalysts = hasPermission('analysts_new', 'edit_approval') || hasPermission('analysts_edit', 'edit_approval');
  const canManageSystems = hasPermission('systems_new', 'edit_approval') || hasPermission('systems_edit', 'edit_approval');
  const canManageAccess = hasPermission('analysts_manage_access', 'edit_approval');

  return (
    <Routes>
      <Route path="/Login" element={user ? <Navigate to="/" replace /> : <Login onLoginSuccess={(authUser) => setUser(authUser)} />} />
      <Route path="*" element={!user ? <Navigate to="/Login" replace /> : (
        <>
          {(currentUserData?.mustChangePassword === true || currentUserData?.mustChangePassword === 'true') ? (
            <ChangePassword 
              userId={currentUserData?.id || user?.uid || ''} 
              userEmail={user?.email || currentUserData?.email || ''} 
            />
          ) : (
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
              <aside 
                onMouseEnter={handleSidebarMouseEnter}
                onMouseLeave={handleSidebarMouseLeave}
                className={cn(
                  "fixed z-50 bg-white flex flex-col transition-all duration-300 lg:static lg:h-screen",
                  "inset-x-0 top-0 max-h-[90vh] shadow-2xl rounded-b-3xl w-full",
                  "lg:inset-y-0 lg:left-0 lg:max-h-none lg:shadow-none lg:rounded-none lg:border-r lg:border-slate-200",
                  isSidebarOpen ? "translate-y-0 lg:translate-x-0" : "-translate-y-full lg:translate-y-0 lg:translate-x-0",
                  (isSidebarPinned || isSidebarHovered) ? "lg:w-72" : "lg:w-20"
                )}
              >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-3 text-indigo-600 min-w-max">
            <ShieldCheck className="w-8 h-8 shrink-0" />
            <motion.span 
              initial={false}
              animate={{ opacity: (isMobile || isSidebarPinned || isSidebarHovered) ? 1 : 0, width: (isMobile || isSidebarPinned || isSidebarHovered) ? 'auto' : 0 }}
              className="font-bold text-lg tracking-tight whitespace-nowrap overflow-hidden"
            >
              AccessControl
            </motion.span>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsSidebarPinned(!isSidebarPinned)}
              className={cn(
                "p-1.5 rounded-lg transition-colors hidden lg:block",
                isSidebarPinned ? "text-indigo-600 bg-indigo-50" : "text-slate-300 hover:text-slate-500 hover:bg-slate-50"
              )}
              title={isSidebarPinned ? "Desafixar menu" : "Fixar menu"}
            >
              {isSidebarPinned ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar overflow-x-hidden grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-col lg:space-y-1 gap-2 lg:gap-0">
          <button 
            onClick={() => { setActiveTab('dashboard'); setSelectedAnalyst(null); setIsSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
              activeTab === 'dashboard' ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-500 hover:bg-slate-100"
            )}
            title={!(isMobile || isSidebarPinned || isSidebarHovered) ? "Dashboard" : ""}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <motion.span
              animate={{ opacity: (isMobile || isSidebarPinned || isSidebarHovered) ? 1 : 0, x: (isMobile || isSidebarPinned || isSidebarHovered) ? 0 : -10 }}
              className="whitespace-nowrap overflow-hidden"
            >
              Dashboard
            </motion.span>
          </button>
          
          {canViewAnalysts && (
            <button 
              onClick={() => { setActiveTab('analysts'); setSelectedAnalyst(null); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                activeTab === 'analysts' ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-500 hover:bg-slate-100"
              )}
              title={!(isMobile || isSidebarPinned || isSidebarHovered) ? "Analistas" : ""}
            >
              <Users className="w-5 h-5 shrink-0" />
              <motion.span
                animate={{ opacity: (isMobile || isSidebarPinned || isSidebarHovered) ? 1 : 0, x: (isMobile || isSidebarPinned || isSidebarHovered) ? 0 : -10 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Analistas
              </motion.span>
            </button>
          )}

          {hasPermission('systems', 'read') && (
            <button 
              onClick={() => { setActiveTab('systems'); setSelectedAnalyst(null); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                activeTab === 'systems' ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-500 hover:bg-slate-100"
              )}
              title={!(isMobile || isSidebarPinned || isSidebarHovered) ? "Sistemas" : ""}
            >
              <Monitor className="w-5 h-5 shrink-0" />
              <motion.span
                animate={{ opacity: (isMobile || isSidebarPinned || isSidebarHovered) ? 1 : 0, x: (isMobile || isSidebarPinned || isSidebarHovered) ? 0 : -10 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Sistemas
              </motion.span>
            </button>
          )}

          {hasPermission('requests', 'read') && (
            <button 
              onClick={() => { setActiveTab('request'); setSelectedAnalyst(null); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group",
                activeTab === 'request' ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-500 hover:bg-slate-100"
              )}
              title={!(isMobile || isSidebarPinned || isSidebarHovered) ? "Solicitações" : ""}
            >
              <PlusCircle className="w-5 h-5 shrink-0" />
              <motion.span
                animate={{ opacity: (isMobile || isSidebarPinned || isSidebarHovered) ? 1 : 0, x: (isMobile || isSidebarPinned || isSidebarHovered) ? 0 : -10 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Solicitações
              </motion.span>
              {requests.filter(r => r.status === 'rejected' && r.requestedBy === user?.uid).length > 0 && (
                <span className={cn(
                  "absolute bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full transition-all",
                  (isMobile || isSidebarPinned || isSidebarHovered) ? "right-4 w-5 h-5" : "right-1.5 top-2 w-4 h-4"
                )}>
                  {requests.filter(r => r.status === 'rejected' && r.requestedBy === user?.uid).length}
                </span>
              )}
            </button>
          )}

          {hasPermission('approvals', 'read') && (
            <button 
              onClick={() => { setActiveTab('approvals'); setSelectedAnalyst(null); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group",
                activeTab === 'approvals' ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-500 hover:bg-slate-100"
              )}
              title={!(isMobile || isSidebarPinned || isSidebarHovered) ? "Aprovações" : ""}
            >
              <ClipboardCheck className="w-5 h-5 shrink-0" />
              <motion.span
                animate={{ opacity: (isMobile || isSidebarPinned || isSidebarHovered) ? 1 : 0, x: (isMobile || isSidebarPinned || isSidebarHovered) ? 0 : -10 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Aprovações
              </motion.span>
              {requests.filter(r => r.status === 'pending').length > 0 && (
                <span className={cn(
                  "absolute bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full transition-all",
                  (isMobile || isSidebarPinned || isSidebarHovered) ? "right-4 w-5 h-5" : "right-1.5 top-2 w-4 h-4"
                )}>
                  {requests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          )}

          {(hasPermission('extract_analysts', 'read') || hasPermission('extract_systems', 'read') || hasPermission('extract_users', 'read') || hasPermission('extract_tracks', 'read') || hasPermission('extract_matrix', 'read') || hasPermission('extract_logs', 'read')) && (
            <button 
              onClick={() => { setActiveTab('extract'); setSelectedAnalyst(null); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                activeTab === 'extract' ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-500 hover:bg-slate-100"
              )}
              title={!(isMobile || isSidebarPinned || isSidebarHovered) ? "Extrair Bases" : ""}
            >
              <Download className="w-5 h-5 shrink-0" />
              <motion.span
                animate={{ opacity: (isMobile || isSidebarPinned || isSidebarHovered) ? 1 : 0, x: (isMobile || isSidebarPinned || isSidebarHovered) ? 0 : -10 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Extrair Bases
              </motion.span>
            </button>
          )}

          {hasPermission('organogram', 'read') && (
            <button 
              onClick={() => { setActiveTab('organogram'); setSelectedAnalyst(null); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                activeTab === 'organogram' ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-500 hover:bg-slate-100"
              )}
              title={!(isMobile || isSidebarPinned || isSidebarHovered) ? "Organograma" : ""}
            >
              <GitBranch className="w-5 h-5 shrink-0" />
              <motion.span
                animate={{ opacity: (isMobile || isSidebarPinned || isSidebarHovered) ? 1 : 0, x: (isMobile || isSidebarPinned || isSidebarHovered) ? 0 : -10 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Organograma
              </motion.span>
            </button>
          )}

          {hasPermission('tracks', 'read') && (
            <button 
              onClick={() => { setActiveTab('tracks'); setSelectedAnalyst(null); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                activeTab === 'tracks' ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-500 hover:bg-slate-100"
              )}
              title={!(isMobile || isSidebarPinned || isSidebarHovered) ? "Esteiras" : ""}
            >
              <RouteIcon className="w-5 h-5 shrink-0" />
              <motion.span
                animate={{ opacity: (isMobile || isSidebarPinned || isSidebarHovered) ? 1 : 0, x: (isMobile || isSidebarPinned || isSidebarHovered) ? 0 : -10 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Esteiras
              </motion.span>
            </button>
          )}

          {canViewAccessControl && (
            <button 
              onClick={() => { setActiveTab('access_control'); setSelectedAnalyst(null); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                activeTab === 'access_control' ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-500 hover:bg-slate-100"
              )}
              title={!(isMobile || isSidebarPinned || isSidebarHovered) ? "Gestão de Permissões" : ""}
            >
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <motion.span
                animate={{ opacity: (isMobile || isSidebarPinned || isSidebarHovered) ? 1 : 0, x: (isMobile || isSidebarPinned || isSidebarHovered) ? 0 : -10 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Gestão de Permissões
              </motion.span>
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 overflow-hidden">
          <div className={cn(
            "bg-slate-50 rounded-2xl p-4 transition-all duration-300",
            (isMobile || isSidebarPinned || isSidebarHovered) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}>
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

          {!(isMobile || isSidebarPinned || isSidebarHovered) && (
            <div className="flex flex-col items-center gap-4 py-2">
              {canViewSettings && (
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    activeTab === 'settings' ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  )}
                  title="Configurações"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={handleLogout}
                className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
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
              {activeTab === 'organogram' && 'Organograma'}
              {activeTab === 'tracks' && 'Esteiras'}
              {activeTab === 'access_control' && 'Gestão de Permissões'}
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
            {activeTab === 'analysts' && !currentSelectedAnalyst && (
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
                  value={analystSupervisorFilter}
                  onChange={(e) => setAnalystSupervisorFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer hidden md:block"
                >
                  <option value="all">Qualquer supervisor</option>
                  <option value="none">Sem Supervisor</option>
                  {mergedSupervisors.slice().sort((a, b) => a.name.localeCompare(b.name)).map((s, idx) => (
                    <option key={`${s.id || s.name}-${idx}`} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </>
            )}
            {(activeTab === 'analysts' || activeTab === 'systems') && !currentSelectedAnalyst && (
              <div className="flex items-center gap-2">
                {activeTab === 'analysts' && (
                  <select 
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-full px-3 py-2 text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer hidden lg:block"
                  >
                    <option value="all">Todos os campos</option>
                    {analystFields.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                )}
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
              </div>
            )}
            {activeTab === 'analysts' && !currentSelectedAnalyst && (hasPermission('analysts_new', 'edit_approval') || hasPermission('analysts_import', 'edit_approval') || hasPermission('analysts_mass_offboard', 'edit_approval')) && (
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
                          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Status</div>
                          <button 
                            onClick={() => setAnalystStatusFilter('active')}
                            className={`w-full text-left px-4 py-2 text-sm font-medium rounded-xl transition-colors flex items-center gap-2 ${analystStatusFilter === 'active' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'}`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${analystStatusFilter === 'active' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                            Ativos
                          </button>
                          <button 
                            onClick={() => setAnalystStatusFilter('deactivated')}
                            className={`w-full text-left px-4 py-2 text-sm font-medium rounded-xl transition-colors flex items-center gap-2 ${analystStatusFilter === 'deactivated' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'}`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${analystStatusFilter === 'deactivated' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                            Desligados
                          </button>
                          <button 
                            onClick={() => setAnalystStatusFilter('all')}
                            className={`w-full text-left px-4 py-2 text-sm font-medium rounded-xl transition-colors flex items-center gap-2 ${analystStatusFilter === 'all' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'}`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${analystStatusFilter === 'all' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                            Todos
                          </button>

                          {(hasPermission('analysts_new', 'edit_approval') || hasPermission('analysts_import', 'edit_approval') || hasPermission('analysts_mass_offboard', 'edit_approval')) && (
                            <>
                              <div className="h-px bg-slate-100 my-1" />
                              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Ações</div>
                            </>
                          )}
                          {hasPermission('analysts_new', 'edit_approval') && (
                            <button 
                              onClick={() => { setIsAddingAnalyst(true); setIsAnalystMenuOpen(false); }}
                              className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Novo Analista
                            </button>
                          )}
                          {hasPermission('analysts_import', 'edit_approval') && (
                            <button 
                              onClick={() => { setIsImportModalOpen(true); setIsAnalystMenuOpen(false); }}
                              className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2"
                            >
                              <Upload className="w-4 h-4" />
                              Importar
                            </button>
                          )}
                          {hasPermission('analysts_mass_offboard', 'edit_approval') && (
                            <>
                              <div className="h-px bg-slate-100 my-1" />
                              <button 
                                onClick={() => { setIsMassDeactivateModalOpen(true); setIsAnalystMenuOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2"
                              >
                                <UserMinus className="w-4 h-4" />
                                Desligamento
                              </button>
                            </>
                          )}
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
                selectedAnalyst={currentSelectedAnalyst}
                setSelectedAnalyst={setSelectedAnalyst}
                paginatedAnalysts={paginatedAnalysts}
                filteredAnalysts={filteredAnalysts}
                hasMoreAnalysts={hasMoreAnalysts}
                setAnalystsLimit={setAnalystsLimit}
                accesses={accesses}
                systems={systems}
                hasPermission={hasPermission}
                currentUserRole={currentUserData?.roleId}
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
                hasPermission={hasPermission}
                systemFields={systemFields}
                setEditingSystem={setEditingSystem}
                setIsAddingSystem={setIsAddingSystem}
                deleteSystem={deleteSystem}
                companyFilter={systemCompanyFilter}
                setCompanyFilter={setSystemCompanyFilter}
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
                supervisors={mergedSupervisors}
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
                searchQuery={approvalSearchQuery}
                setSearchQuery={setApprovalSearchQuery}
                isProcessing={isProcessingApproval}
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
                analystFields={analystFields}
              />
            )}
            {activeTab === 'organogram' && (
              <OrganogramaTab 
                key="organogram"
                analysts={allAnalysts}
                supervisors={mergedSupervisors}
                getAnalystDisplayName={getAnalystDisplayName}
                getAnalystEmail={getAnalystEmail}
                getAnalystInitials={getAnalystInitials}
                getAnalystTrack={getAnalystTrack}
                tracks={tracks}
              />
            )}
            {activeTab === 'tracks' && (
              <TracksTab
                tracks={tracks}
                allAnalysts={allAnalysts}
                getAnalystTrack={getAnalystTrack}
                canEdit={hasPermission('tracks', 'edit')}
              />
            )}
            {activeTab === 'access_control' && (
              <AccessControlTab
                hasPermission={hasPermission}
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
                supervisors={mergedSupervisors}
                setIsAddingTrack={setIsAddingTrack}
                setEditingTrack={setEditingTrack}
                deleteTrack={deleteTrack}
                setIsAddingSupervisor={setIsAddingSupervisor}
                setEditingSupervisor={setEditingSupervisor}
                deleteSupervisor={deleteSupervisor}
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
                onPlayNotification={sendNotification}
                updateUserNotificationSound={updateUserNotificationSound}
                currentUserId={user?.uid}
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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Campo de Referência</label>
                    <select
                      value={importMatchField}
                      onChange={(e) => setImportMatchField(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-slate-700"
                    >
                      <option value="">Selecione o campo (ex: E-mail)</option>
                      {analystFields.map(f => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-2">
                      Este campo será usado para encontrar o analista. Se encontrado, seus dados serão atualizados. Caso contrário, um novo será criado.
                    </p>
                  </div>

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
                    disabled={!importFile || !importMatchField || isImporting}
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
          key={editingAnalyst ? `edit-analyst-${editingAnalyst.id}` : (isAddingAnalyst ? 'add-new-analyst' : 'hidden-analyst')}
          isOpen={isAddingAnalyst || !!editingAnalyst}
          editingAnalyst={editingAnalyst}
          onClose={() => {
            setIsAddingAnalyst(false);
            setEditingAnalyst(null);
          }}
          analystFields={analystFields}
          tracks={tracks}
          supervisors={mergedSupervisors}
          systems={systems}
          accesses={accesses}
          hasPermission={hasPermission}
          canManageAnalysts={canManageAnalysts}
          canManageAccess={canManageAccess}
          user={currentUserData || null}
          logAction={logAction}
          getAnalystDisplayName={getAnalystDisplayName}
          getAnalystTrack={getAnalystTrack}
          showToast={showToast}
        />

        <SystemModal
          key={editingSystem ? `edit-system-${editingSystem.id}` : (isAddingSystem ? 'add-new-system' : 'hidden-system')}
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
          key={editingField ? `edit-field-${editingField.type}-${editingField.field.id}` : (isAddingField ? 'add-new-field' : 'hidden-field')}
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
          key={editingTrack ? `edit-track-${editingTrack.id}` : (isAddingTrack ? 'add-new-track' : 'hidden-track')}
          isAddingTrack={isAddingTrack}
          editingTrack={editingTrack}
          onClose={() => {
            setIsAddingTrack(false);
            setEditingTrack(null);
          }}
          user={user}
          analysts={allAnalysts}
          getAnalystTrack={getAnalystTrack}
          logAction={logAction}
        />

        <SupervisorModal
          key={editingSupervisor ? `edit-supervisor-${editingSupervisor.id}` : (isAddingSupervisor ? 'add-new-supervisor' : 'hidden-supervisor')}
          isAddingSupervisor={isAddingSupervisor}
          editingSupervisor={editingSupervisor}
          onClose={() => {
            setIsAddingSupervisor(false);
            setEditingSupervisor(null);
          }}
          user={user}
          analysts={allAnalysts}
          logAction={logAction}
        />

        <UserModal
          key={editingUser ? `edit-user-${editingUser.id}` : (isAddingUser ? 'add-new-user' : 'hidden-user')}
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
          key={editingRole ? `edit-${editingRole.id}` : (isAddingRole ? 'add-new' : 'hidden')}
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
          onConfirm={async (password) => {
            try {
              if (confirmModal.requirePassword && !password) return;
              await confirmModal.onConfirm(password);
            } finally {
              if (!confirmModal.requirePassword) {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
              }
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

        <TempPasswordModal
          isOpen={tempPasswordModal.isOpen}
          onClose={() => setTempPasswordModal(prev => ({ ...prev, isOpen: false }))}
          userName={tempPasswordModal.userName}
          userEmail={tempPasswordModal.userEmail}
          tempPassword={tempPasswordModal.tempPassword}
          showToast={showToast}
        />

        {/* In-App Notification Modal */}
        <NotificationModal 
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          notifications={appNotifications}
          requests={requests}
          onApprove={async (request) => {
            await handleApproveRequest(request);
            setAppNotifications(prev => prev.filter(n => n.requestId !== request.id));
          }}
          onReject={async (requestId, reason) => {
            await handleRejectRequest(requestId, reason);
            setAppNotifications(prev => prev.filter(n => n.requestId !== requestId));
          }}
          onViewMyRequests={() => {
            setActiveTab('request');
            setIsNotificationModalOpen(false);
          }}
          onViewApprovals={() => {
            setActiveTab('approvals');
            setIsNotificationModalOpen(false);
          }}
          onAdjustRequest={(request) => {
            setEditingRequest(request);
            setSelectedSystemsInForm(request.systemIds || []);
            setRequestSubTab('new');
            setActiveTab('request');
            setIsNotificationModalOpen(false);
          }}
          systems={systems}
          analystFields={analystFields}
          getAnalystInitials={getAnalystInitials}
          getAnalystDisplayName={getAnalystDisplayName}
          getAnalystEmail={getAnalystEmail}
          getAnalystTrack={getAnalystTrack}
          canApprove={hasPermission('approvals', 'edit')}
          currentUserUid={user?.uid || ''}
        />

        <Toast 
          isVisible={toast.isVisible} 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
        />
      </AnimatePresence>
            </div>
          )}
        </>
      )} />
    </Routes>
  );
}
