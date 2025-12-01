
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, Permission, SystemUser } from '../types';

interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  user: { name: string; avatar: string; permissions: Permission[]; role?: UserRole; scopes: string[] } | null;
  logout: () => void;
  hasPermission: (perm: Permission) => boolean;
  hasScope: (scope: string) => boolean;
  login: (user: SystemUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role metadata for UI
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: '行政 (系统管理)',
  [UserRole.VP_PRODUCTION]: '生产副总 (定薪/KPI)',
  [UserRole.SCHEDULING]: '调度中心 (产量)',
  [UserRole.SECTION_HEAD]: '工段负责人 (工时)',
  [UserRole.GENERAL_MANAGER]: '总经理 (审批/查看)',
  [UserRole.GUEST]: '访客'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Always start as GUEST - require login on every app load
  const [role, setRoleState] = useState<UserRole>(UserRole.GUEST);

  // Always start with no user - require login on every app load
  const [user, setUser] = useState<{ name: string; avatar: string; permissions: Permission[]; scopes: string[] } | null>(null);

  const loginUser = (systemUser: SystemUser) => {
    setRoleState(systemUser.role);
    const userObj = {
        name: systemUser.displayName,
        avatar: `https://ui-avatars.com/api/?name=${systemUser.displayName}&background=0ea5e9&color=fff`,
        permissions: systemUser.permissions || [],
        role: systemUser.role,
        scopes: systemUser.scopes || []
    };
    setUser(userObj);
    // No longer persist to localStorage - session only
  };

  const logout = () => {
    setRoleState(UserRole.GUEST);
    setUser(null);
  };

  const hasPermission = (perm: Permission): boolean => {
      if (!user) return false;
      if (user.permissions && user.permissions.includes(perm)) return true;
      if (role === UserRole.ADMIN) return true;
      return false;
  };

  const hasScope = (scope: string): boolean => {
      if (!user) return false;
      if (user.scopes && user.scopes.includes('all')) return true;
      return user.scopes && user.scopes.includes(scope);
  };

  return (
    <AuthContext.Provider value={{ role, setRole: () => {}, user, logout, hasPermission, hasScope, login: loginUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
