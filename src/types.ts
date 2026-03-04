export type AccessStatus = 'Ok' | 'Pendente' | 'Acesso perdido';

export type Permission = 
  | 'settings_analyst_fields'
  | 'settings_system_fields'
  | 'settings_tracks'
  | 'settings_users'
  | 'settings_roles'
  | 'systems_manage'
  | 'analysts_manage'
  | 'analysts_access_status'
  | 'request_access'
  | 'approve_access'
  | 'extract_data'
  | 'extract_logs';

export const PERMISSIONS_LABELS: Record<Permission, string> = {
  'settings_analyst_fields': 'Configurações: Campos de Analista',
  'settings_system_fields': 'Configurações: Campos de Sistema',
  'settings_tracks': 'Configurações: Gestão de Esteiras',
  'settings_users': 'Configurações: Gestão de Usuários',
  'settings_roles': 'Configurações: Gestão de Perfis',
  'systems_manage': 'Sistemas: Gerenciar Sistemas',
  'analysts_manage': 'Analistas: Dados Cadastrais',
  'analysts_access_status': 'Analistas: Status de Acesso',
  'request_access': 'Solicitar: Criar Solicitações',
  'approve_access': 'Solicitar: Aprovar Solicitações',
  'extract_data': 'Extrair: Bases de Dados',
  'extract_logs': 'Extrair: Logs de Auditoria',
};

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  isSystem?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId?: string;
  permissions: Permission[];
  mustChangePassword?: boolean;
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
}

export interface FieldDefinition {
  id: string;
  label: string;
  description: string;
  order?: number;
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
  type?: 'new_analyst' | 'status_change';
  analystData?: Partial<Analyst>;
  systemIds?: string[];
  statusChangeData?: {
    analystId: string;
    systemId: string;
    newStatus: AccessStatus;
    oldStatus: AccessStatus;
  };
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
}
