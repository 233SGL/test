/**
 * ========================================
 * 鹤山积分管理系统 - 认证上下文
 * ========================================
 * 
 * 本模块提供用户认证和权限管理功能：
 * - 用户登录/登出
 * - 角色管理
 * - 权限检查（新旧两套系统）
 * - 工段范围控制
 * 
 * 注意：从 v1.1 起，登录状态不再持久化，
 * 刷新页面后需要重新登录（会话级）
 * 
 * @module contexts/AuthContext
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, Permission, SystemUser, PageType, EditPermission, WorkshopScope } from '../types';
import { convertOldPermissionsToNew, pageExistsInWorkshop } from '../utils/permissionHelpers';

/**
 * 认证上下文类型定义
 * 定义所有可通过 useAuth() 访问的属性和方法
 */
interface AuthContextType {
  /** 当前用户角色 */
  role: UserRole;
  /** 设置角色（已弃用，保留接口兼容） */
  setRole: (role: UserRole) => void;
  /** 当前登录用户信息 */
  user: { name: string; avatar: string; permissions: Permission[]; role?: UserRole; scopes: string[]; newPermissions?: any } | null;
  /** 登出函数 */
  logout: () => void;

  // 旧权限检查（保留兼容）
  /** 检查是否有指定权限（旧系统） */
  hasPermission: (perm: Permission) => boolean;
  /** 检查是否有指定工段范围 */
  hasScope: (scope: string) => boolean;

  // 新权限检查
  /** 检查是否可查看指定页面 */
  canViewPage: (page: PageType, workshop?: WorkshopScope) => boolean;
  /** 检查是否有指定编辑权限 */
  canEdit: (permission: EditPermission) => boolean;
  /** 获取用户可访问的工段列表 */
  getAvailableScopes: () => WorkshopScope[];

  /** 登录函数 */
  login: (user: SystemUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 角色显示名称映射
 * 用于 UI 中显示可读的角色名称
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: '行政 (系统管理)',
  [UserRole.VP_PRODUCTION]: '生产副总 (定薪/KPI)',
  [UserRole.SCHEDULING]: '调度中心 (产量)',
  [UserRole.SECTION_HEAD]: '工段负责人 (工时)',
  [UserRole.GENERAL_MANAGER]: '总经理 (审批/查看)',
  [UserRole.GUEST]: '访客'
};

/**
 * 认证上下文提供者组件
 * 包裹应用根组件，提供认证状态和方法
 */

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Always start as GUEST - require login on every app load
  const [role, setRoleState] = useState<UserRole>(UserRole.GUEST);

  // Always start with no user - require login on every app load
  const [user, setUser] = useState<{ name: string; avatar: string; permissions: Permission[]; scopes: string[]; newPermissions?: any } | null>(null);

  const loginUser = (systemUser: SystemUser) => {
    setRoleState(systemUser.role);
    const userObj = {
      name: systemUser.displayName,
      avatar: `https://ui-avatars.com/api/?name=${systemUser.displayName}&background=0ea5e9&color=fff`,
      permissions: systemUser.permissions || [],
      role: systemUser.role,
      scopes: systemUser.scopes || [],
      newPermissions: systemUser.newPermissions
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

  // ========================================
  // 新权限检查方法
  // ========================================

  const canViewPage = (page: PageType, workshop?: WorkshopScope): boolean => {
    if (!user) return false;
    if (role === UserRole.ADMIN) return true;  // 管理员全权限

    // 如果用户有 newPermissions，使用新系统
    if (user.newPermissions) {
      const newPerms = user.newPermissions;

      // 检查页面类型权限
      if (!newPerms.pages.includes(page)) return false;

      // 如果指定了工段，检查工段范围
      if (workshop) {
        if (!newPerms.scopes.includes(workshop) && !newPerms.scopes.includes('all')) {
          return false;
        }
        // 检查页面在该工段是否存在
        if (!pageExistsInWorkshop(page, workshop)) return false;
      }

      return true;
    }

    // 否则回退到旧系统（自动转换）
    const converted = convertOldPermissionsToNew(user.permissions || [], user.scopes || []);
    if (!converted.pages.includes(page)) return false;

    if (workshop) {
      if (!user.scopes.includes(workshop) && !user.scopes.includes('all')) {
        return false;
      }
      if (!pageExistsInWorkshop(page, workshop)) return false;
    }

    return true;
  };

  const canEdit = (permission: EditPermission): boolean => {
    if (!user) return false;
    if (role === UserRole.ADMIN) return true;

    // 如果用户有 newPermissions，使用新系统
    if (user.newPermissions) {
      return user.newPermissions.edits.includes(permission);
    }

    // 回退到旧系统（自动转换）
    const converted = convertOldPermissionsToNew(user.permissions || [], user.scopes || []);
    return converted.edits.includes(permission);
  };

  const getAvailableScopes = (): WorkshopScope[] => {
    if (!user) return [];
    if (role === UserRole.ADMIN) return ['all'];

    // 使用 scopes 字段（新旧系统共用）
    const scopes = user.scopes || [];
    return scopes.filter((s): s is WorkshopScope =>
      s === 'styling' || s === 'weaving' || s === 'all'
    );
  };

  return (
    <AuthContext.Provider value={{
      role,
      setRole: () => { },
      user,
      logout,
      hasPermission,
      hasScope,
      canViewPage,
      canEdit,
      getAvailableScopes,
      login: loginUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
