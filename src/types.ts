export type AccessStatus = 'Ok' | 'Pendente' | 'Acesso perdido';

export type AccessLevel = 'none' | 'read' | 'edit_approval' | 'edit';

export type AppModule = 
  | 'dashboard'
  | 'analysts'
  | 'analysts_new'
  | 'analysts_import'
  | 'analysts_mass_offboard'
  | 'analysts_manage_access'
  | 'analysts_offboard'
  | 'analysts_edit'
  | 'analysts_delete'
  | 'systems'
  | 'systems_new'
  | 'systems_edit'
  | 'systems_delete'
  | 'requests'
  | 'approvals'
  | 'extract_analysts'
  | 'extract_systems'
  | 'extract_users'
  | 'extract_tracks'
  | 'extract_matrix'
  | 'extract_logs'
  | 'organogram'
  | 'tracks'
  | 'access_control'
  | 'settings_analysts'
  | 'settings_systems'
  | 'settings_tracks'
  | 'settings_supervisors'
  | 'settings_sound';

export const MODULE_LABELS: Record<AppModule, string> = {
  dashboard: 'Dashboard',
  analysts: 'Analistas',
  analysts_new: 'Novo analista',
  analysts_import: 'Importação',
  analysts_mass_offboard: 'Desligamento em massa',
  analysts_manage_access: 'Gerenciar Acessos',
  analysts_offboard: 'Desligar Analista',
  analysts_edit: 'Editar (Analista)',
  analysts_delete: 'Excluir (Analista)',
  systems: 'Sistemas',
  systems_new: 'Novo (Sistema)',
  systems_edit: 'Editar (Sistema)',
  systems_delete: 'Excluir (Sistema)',
  requests: 'Solicitações',
  approvals: 'Aprovações',
  extract_analysts: 'Base de analistas',
  extract_systems: 'Base de sistemas',
  extract_users: 'Base de usuários',
  extract_tracks: 'Base de esteiras',
  extract_matrix: 'Matriz de acessos',
  extract_logs: 'Logs',
  organogram: 'Organograma',
  tracks: 'Esteiras',
  access_control: 'Gestão de permissões',
  settings_analysts: 'Definição de Analista',
  settings_systems: 'Definição de Sistema',
  settings_tracks: 'Gestão de Esteiras',
  settings_supervisors: 'Gestão de Supervisores',
  settings_sound: 'Personalização de Som'
};

export const LEVEL_LABELS: Record<AccessLevel, string> = {
  none: 'Ocultar',
  read: 'Ver',
  edit_approval: 'Editar mediante Aprovação',
  edit: 'Permitir/Editar'
};

export const MODULE_AVAILABLE_LEVELS: Record<AppModule, AccessLevel[]> = {
  dashboard: ['none', 'read'],
  analysts: ['none', 'read'],
  analysts_new: ['none', 'edit_approval', 'edit'],
  analysts_import: ['none', 'edit_approval', 'edit'],
  analysts_mass_offboard: ['none', 'edit_approval', 'edit'],
  analysts_manage_access: ['none', 'edit_approval', 'edit'],
  analysts_offboard: ['none', 'edit_approval', 'edit'],
  analysts_edit: ['none', 'edit_approval', 'edit'],
  analysts_delete: ['none', 'edit_approval', 'edit'],
  systems: ['none', 'read'],
  systems_new: ['none', 'edit_approval', 'edit'],
  systems_edit: ['none', 'edit_approval', 'edit'],
  systems_delete: ['none', 'edit_approval', 'edit'],
  requests: ['none', 'read', 'edit'],
  approvals: ['none', 'read', 'edit'],
  extract_analysts: ['none', 'read', 'edit'],
  extract_systems: ['none', 'read', 'edit'],
  extract_users: ['none', 'read', 'edit'],
  extract_tracks: ['none', 'read', 'edit'],
  extract_matrix: ['none', 'read', 'edit'],
  extract_logs: ['none', 'read', 'edit'],
  organogram: ['none', 'read', 'edit'],
  tracks: ['none', 'edit_approval', 'edit'],
  access_control: ['none', 'read', 'edit'],
  settings_analysts: ['none', 'read', 'edit'],
  settings_systems: ['none', 'read', 'edit'],
  settings_tracks: ['none', 'read', 'edit'],
  settings_supervisors: ['none', 'read', 'edit'],
  settings_sound: ['none', 'read', 'edit']
};

export const MODULE_GROUPS = [
  {
    name: 'Dashboard',
    modules: ['dashboard']
  },
  {
    name: 'Analistas',
    modules: [
      'analysts',
      'analysts_new',
      'analysts_import',
      'analysts_mass_offboard',
      'analysts_manage_access',
      'analysts_offboard',
      'analysts_edit',
      'analysts_delete'
    ]
  },
  {
    name: 'Sistemas',
    modules: [
      'systems',
      'systems_new',
      'systems_edit',
      'systems_delete'
    ]
  },
  {
    name: 'Solicitações',
    modules: ['requests']
  },
  {
    name: 'Aprovações',
    modules: ['approvals']
  },
  {
    name: 'Extrair Bases',
    modules: [
      'extract_analysts',
      'extract_systems',
      'extract_users',
      'extract_tracks',
      'extract_matrix',
      'extract_logs'
    ]
  },
  {
    name: 'Organograma',
    modules: ['organogram']
  },
  {
    name: 'Esteiras',
    modules: ['tracks']
  },
  {
    name: 'Gestão de permissões',
    modules: ['access_control']
  },
  {
    name: 'Configurações',
    modules: [
      'settings_analysts',
      'settings_systems',
      'settings_tracks',
      'settings_supervisors',
      'settings_sound'
    ]
  }
];

export const LEVEL_WEIGHTS: Record<AccessLevel, number> = {
  none: 0,
  read: 1,
  edit_approval: 2,
  edit: 3
};

export interface Role {
  id: string;
  name: string;
  permissions: Record<AppModule, AccessLevel>;
  isSystem?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleIds: string[]; // Support multiple profiles
  roleId?: string; // Legacy support
  permissions?: any; // Legacy support
  mustChangePassword?: boolean;
  tempPassword?: string;
  authPassword?: string;
  notificationSound?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  requestId?: string;
  type: 'request_pending' | 'request_approved' | 'request_rejected';
  timestamp: number;
}

export interface System {
  id: string;
  name: string;
  description?: string;
  [key: string]: any;
}

export interface Track {
  id: string;
  name: string;
  hiredCount?: string;
}

export interface Supervisor {
  id: string;
  name: string;
  isUser?: boolean;
}

export interface FieldDefinition {
  id: string;
  label: string;
  description: string;
  order?: number;
  options?: string[];
  textCase?: 'uppercase' | 'lowercase' | 'any';
  typeRestriction?: 'all' | 'letters_only' | 'numbers_only';
  allowAccents?: boolean;
  allowSpecialChars?: boolean;
  allowSpecialLetters?: boolean;
}

export interface Analyst {
  id: string;
  name: string;
  email: string;
  track: string;
  createdAt: string;
  deactivatedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  [key: string]: any;
}

export interface Access {
  analystId: string;
  systemId: string;
  status: AccessStatus;
  updatedAt: string;
}

export interface AccessRequest {
  id: string;
  requestNumber: string;
  type?: 'new_analyst' | 'status_change' | 'edit_analyst' | 'offboard_analyst' | 'delete_analyst';
  analystData?: Partial<Analyst>;
  previousAnalystData?: Partial<Analyst>;
  systemIds?: string[];
  statusChangeData?: {
    analystId: string;
    systemId: string;
    newStatus: AccessStatus;
    oldStatus: AccessStatus;
  };
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedByEmail?: string;
  requestedByName: string;
  requestedAt: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
}
