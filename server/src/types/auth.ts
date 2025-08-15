export interface AuthenticatedUser {
  id: string;
  email: string;
  tenantId?: string;
  isSuperadmin: boolean;
  isActive: boolean;
  permissions: {
    [moduleKey: string]: {
      canCreate: boolean;
      canRead: boolean;
      canUpdate: boolean;
      canDelete: boolean;
      canViewAll: boolean;
    };
  };
  dataScopes: {
    [moduleKey: string]: {
      scope: 'all' | 'tenant' | 'own';
      tenantId?: string;
      userId?: string;
    };
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  tenantId?: string;
  isSuperadmin: boolean;
  permissions?: string[];
  roles?: string[];
  iat?: number;
  exp?: number;
}
