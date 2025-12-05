/**
 * ========================================
 * 鹤山积分管理系统 - 权限转换工具
 * ========================================
 * 
 * 本模块提供旧权限系统到新权限系统的转换功能：
 * - 旧系统：细粒度权限列表（如 VIEW_DASHBOARD）
 * - 新系统：三维权限模型（工段+页面+编辑权限）
 * 
 * 这个转换层保证了系统向后兼容
 * 
 * @module utils/permissionHelpers
 */

import { Permission, PageType, EditPermission, WorkshopScope } from '../types';

/**
 * 将旧权限列表转换为新权限结构
 * 
 * @param oldPermissions - 旧的权限列表（如 ['VIEW_DASHBOARD', 'EDIT_YIELD']）
 * @param scopes - 工段范围列表（如 ['styling', 'weaving']）
 * @returns 新权限结构，包含 pages 和 edits 两个数组
 */
export function convertOldPermissionsToNew(oldPermissions: Permission[], scopes: string[]): {
    pages: PageType[];
    edits: EditPermission[];
} {
    const pages = new Set<PageType>();
    const edits = new Set<EditPermission>();

    /**
     * 页面访问权限映射表
     * 将旧的 VIEW_* 权限映射到新的 PageType
     */
    const pageMapping: Record<string, PageType> = {
        // 定型工段页面
        'VIEW_DASHBOARD': 'dashboard',
        'VIEW_PRODUCTION': 'production',
        'VIEW_ATTENDANCE': 'attendance',
        'VIEW_CALCULATOR': 'calculator',
        'VIEW_SIMULATION': 'simulation',
        'VIEW_EMPLOYEES': 'employees',
        'MANAGE_SYSTEM': 'settings',
        'MANAGE_ANNOUNCEMENTS': 'announcements',
        // 织造工段页面
        'VIEW_WEAVING_PRODUCTION': 'weaving_production',
        'VIEW_WEAVING_RECORDS': 'weaving_records',
        'VIEW_WEAVING_SUMMARY': 'weaving_summary',
        'VIEW_WEAVING_BONUS': 'weaving_bonus',
        'VIEW_WEAVING_MACHINES': 'weaving_machines',
        'VIEW_WEAVING_PRODUCTS': 'weaving_products',
    };

    /**
     * 编辑权限映射表
     * 将旧的 EDIT_xxx / MANAGE_xxx 权限映射到新的 EditPermission
     */
    const editMapping: Record<string, EditPermission> = {
        // 定型工段编辑权限
        'EDIT_YIELD': 'edit_production_data',
        'EDIT_UNIT_PRICE': 'edit_production_data',
        'EDIT_FIXED_PACK': 'edit_production_data',
        'EDIT_KPI': 'edit_production_data',
        'EDIT_HOURS': 'edit_attendance',
        'EDIT_BASE_SCORE': 'edit_base_score',
        'EDIT_WEIGHTS': 'edit_weights',
        'APPLY_SIMULATION': 'apply_simulation',
        'MANAGE_EMPLOYEES': 'manage_employees',
        'MANAGE_ANNOUNCEMENTS': 'manage_announcements',
        'MANAGE_SYSTEM': 'manage_system',
        // 织造工段编辑权限
        'EDIT_WEAVING_PRODUCTION': 'edit_production_data',
        'EDIT_WEAVING_MACHINES': 'edit_config',
        'EDIT_WEAVING_PRODUCTS': 'edit_config',
        'EDIT_WEAVING_CONFIG': 'edit_config',
    };

    // 转换
    for (const perm of oldPermissions) {
        if (pageMapping[perm]) {
            pages.add(pageMapping[perm]);
        }
        if (editMapping[perm]) {
            edits.add(editMapping[perm]);
        }
    }

    return {
        pages: Array.from(pages),
        edits: Array.from(edits),
    };
}

/**
 * 根据页面类型和工段获取对应的路由路径
 * 不同工段的同类型页面可能有不同的路由
 * 
 * @param page - 页面类型
 * @param workshop - 工段范围
 * @returns 路由路径，如果该页面在指定工段不存在则返回 null
 */
export function getPageRoute(page: PageType, workshop: WorkshopScope): string | null {
    const routeMapping: Record<string, Record<WorkshopScope, string | null>> = {
        // 定型工段页面
        'dashboard': {
            'styling': '/dashboard',
            'weaving': '/weaving',
            'all': '/dashboard',
        },
        'production': {
            'styling': '/production-data',
            'weaving': '/weaving/entry',
            'all': '/production-data',
        },
        'calculator': {
            'styling': '/calculator',
            'weaving': '/weaving/bonus',
            'all': '/calculator',
        },
        'attendance': {
            'styling': '/attendance',
            'weaving': null,
            'all': '/attendance',
        },
        'simulation': {
            'styling': '/simulation',
            'weaving': null,
            'all': '/simulation',
        },
        'config': {
            'styling': '/styling-settings',
            'weaving': '/weaving/machines',
            'all': '/styling-settings',
        },
        'announcements': {
            'styling': '/styling-settings',
            'weaving': null,
            'all': '/styling-settings',
        },
        // 织造工段专有页面
        'weaving_production': {
            'styling': null,
            'weaving': '/weaving/entry',
            'all': '/weaving/entry',
        },
        'weaving_records': {
            'styling': null,
            'weaving': '/weaving/records',
            'all': '/weaving/records',
        },
        'weaving_summary': {
            'styling': null,
            'weaving': '/weaving',
            'all': '/weaving',
        },
        'weaving_bonus': {
            'styling': null,
            'weaving': '/weaving/bonus',
            'all': '/weaving/bonus',
        },
        'weaving_machines': {
            'styling': null,
            'weaving': '/weaving/machines',
            'all': '/weaving/machines',
        },
        'weaving_products': {
            'styling': null,
            'weaving': '/weaving/products',
            'all': '/weaving/products',
        },
        // 系统页面
        'employees': {
            'styling': '/employees',
            'weaving': '/employees',
            'all': '/employees',
        },
        'settings': {
            'styling': '/settings',
            'weaving': '/settings',
            'all': '/settings',
        },
    };

    return routeMapping[page]?.[workshop] || null;
}

/**
 * 检查页面是否存在于特定工段
 * 某些页面只在特定工段中存在，如：
 * - 考勤页、模拟沙箱、公告管理仅在定型工段
 * 
 * @param page - 页面类型
 * @param workshop - 工段范围
 * @returns 页面是否存在于该工段
 */
export function pageExistsInWorkshop(page: PageType, workshop: WorkshopScope): boolean {
    if (workshop === 'all') return true;

    // 系统页面在所有工段都存在
    if (page === 'employees' || page === 'settings') return true;

    // 定型专有页面
    if ((page === 'attendance' || page === 'simulation' || page === 'announcements') && workshop !== 'styling') {
        return false;
    }

    // 织造专有页面
    const weavingPages = ['weaving_production', 'weaving_records', 'weaving_summary', 'weaving_bonus', 'weaving_machines', 'weaving_products'];
    if (weavingPages.includes(page) && workshop !== 'weaving') {
        return false;
    }

    return true;
}
