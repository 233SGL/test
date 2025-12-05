/**
 * ========================================
 * 鹤山积分管理系统 - 路由辅助工具
 * ========================================
 * 
 * 本模块提供路由相关的辅助函数：
 * - 根据用户权限获取默认跳转路由
 * 
 * @module utils/routeHelpers
 */

/**
 * 根据用户权限获取默认可访问的路由
 * 遍历路由列表，返回用户有权访问的第一个路由
 * 
 * @param permissions - 用户权限列表
 * @returns 默认路由路径
 */
export const getDefaultRoute = (permissions: string[]): string => {
    // 路由和对应所需权限的映射列表（按优先级排序）
    const routes = [
        // 定型工段路由
        { path: '/dashboard', permission: 'VIEW_DASHBOARD' },
        { path: '/production-data', permission: 'VIEW_PRODUCTION' },
        { path: '/attendance', permission: 'VIEW_ATTENDANCE' },
        { path: '/calculator', permission: 'VIEW_CALCULATOR' },
        { path: '/simulation', permission: 'VIEW_SIMULATION' },
        // 织造工段路由（与 App.tsx 中的路由路径一致）
        { path: '/weaving/entry', permission: 'VIEW_WEAVING_PRODUCTION' },
        { path: '/weaving/records', permission: 'VIEW_WEAVING_RECORDS' },
        { path: '/weaving', permission: 'VIEW_WEAVING_SUMMARY' },
        { path: '/weaving/bonus', permission: 'VIEW_WEAVING_BONUS' },
        { path: '/weaving/machines', permission: 'VIEW_WEAVING_MACHINES' },
        { path: '/weaving/products', permission: 'VIEW_WEAVING_PRODUCTS' },
        // 系统页面
        { path: '/employees', permission: 'VIEW_EMPLOYEES' },
        { path: '/employees', permission: 'MANAGE_EMPLOYEES' },
        { path: '/settings', permission: 'MANAGE_SYSTEM' },
    ];

    // 查找用户有权限访问的第一个路由
    for (const route of routes) {
        if (permissions.includes(route.permission)) {
            return route.path;
        }
    }

    // 无匹配权限时回退到登录页
    return '/login';
};
