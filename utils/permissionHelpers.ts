// 权限转换工具：旧权限 → 新权限
import { Permission, PageType, EditPermission, WorkshopScope } from './types';

// 旧权限到新权限的映射
export function convertOldPermissionsToNew(oldPermissions: Permission[], scopes: string[]): {
    pages: PageType[];
    edits: EditPermission[];
} {
    const pages = new Set<PageType>();
    const edits = new Set<EditPermission>();

    // 页面访问权限映射
    const pageMapping: Record<string, PageType> = {
        'VIEW_DASHBOARD': 'dashboard',
        'VIEW_PRODUCTION': 'production',
        'VIEW_ATTENDANCE': 'attendance',
        'VIEW_CALCULATOR': 'calculator',
        'VIEW_SIMULATION': 'simulation',
        'VIEW_EMPLOYEES': 'employees',
        'MANAGE_SYSTEM': 'settings',
        'MANAGE_ANNOUNCEMENTS': 'announcements',
        // 织造工段页面
        'VIEW_WEAVING_DATA_ENTRY': 'production',
        'VIEW_WEAVING_CALCULATOR': 'calculator',
        'VIEW_WEAVING_CONFIG': 'config',
    };

    // 编辑权限映射
    const editMapping: Record<string, EditPermission> = {
        'EDIT_YIELD': '编辑_production_data',
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
        'EDIT_WEAVING_MONTHLY_DATA': 'edit_production_data',
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

// 页面类型到路由路径的映射
export function getPageRoute(page: PageType, workshop: WorkshopScope): string | null {
    const routeMapping: Record<PageType, Record<WorkshopScope, string | null>> = {
        'dashboard': {
            'styling': '/dashboard',
            'weaving': '/weaving',
            'all': '/dashboard',
        },
        'production': {
            'styling': '/production-data',
            'weaving': '/weaving/data-entry',
            'all': '/production-data',
        },
        'calculator': {
            'styling': '/calculator',
            'weaving': '/weaving/calculator',
            'all': '/calculator',
        },
        'attendance': {
            'styling': '/attendance',
            'weaving': null,  // 织造无此页面
            'all': '/attendance',
        },
        'simulation': {
            'styling': '/simulation',
            'weaving': null,  // 织造无此页面
            'all': '/simulation',
        },
        'config': {
            'styling': '/styling-settings',
            'weaving': '/weaving/config',
            'all': '/styling-settings',
        },
        'announcements': {
            'styling': '/styling-settings',
            'weaving': null,  // 织造公告待实现
            'all': '/styling-settings',
        },
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

// 检查页面是否存在于特定工段
export function pageExistsInWorkshop(page: PageType, workshop: WorkshopScope): boolean {
    if (workshop === 'all') return true;

    // 系统页面在所有工段都存在
    if (page === 'employees' || page === 'settings') return true;

    // 定型专有页面
    if ((page === 'attendance' || page === 'simulation' || page === 'announcements') && workshop !== 'styling') {
        return false;
    }

    return true;
}
