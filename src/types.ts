export type AccessStatus = 'Ok' | 'Pendente' | 'Acesso perdido';

export type AccessLevel = 'none' | 'read' | 'edit_approval' | 'edit';

export type AppModule = 
  | 'dashboard'
  | 'analysts'
  | 'systems'
  | 'requests'
  | 'approvals'
  | 'extract'
  | 'organogram'
  | 'tracks'
  | 'settings'
  | 'settings_analysts'
  | 'settings_systems'
  | 'settings_supervisors';

export const MODULE_LABELS: Record<AppModule, string> = {
  dashboard: 'Dashboard',
  analysts: 'Analistas',
  systems: 'Sistemas',
  requests: 'Solicitações',
  approvals: 'Aprovações',
  extract: 'Extrair Base',
  organogram: 'Organograma',
  tracks: 'Gestão de Esteiras',
  settings: 'Configurações',
  settings_analysts: 'Definição de Analista',
  settings_systems: 'Definição de Sistema',
  settings_supervisors: 'Gestão de Supervisores'
};

export const LEVEL_LABELS: Record<AccessLevel, string> = {
  none: 'Ocultar',
  read: 'Leitura',
  edit_approval: 'Editar mediante Aprovação',
  edit: 'Leitura e Edição'
};

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
  type?: 'new_analyst' | 'status_change' | 'edit_analyst';
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
