/**
 * ========================================
 * 鹤山积分管理系统 - 数据库服务模块
 * ========================================
 * 
 * 本模块负责与后端API通信，提供数据的增删改查操作。
 * 采用单例模式确保全局只有一个数据库服务实例。
 * 
 * 主要功能：
 * - 员工信息管理 (CRUD)
 * - 系统用户管理
 * - 车间/工段管理
 * - 月度数据存取
 * - 系统设置管理
 * 
 * @module services/db
 * @version 2.5
 */

import { MonthlyData, Employee, StorageStats, SystemUser, UserRole, Permission, GlobalSettings, Workshop } from '../types';

/**
 * 动态解析API基础地址
 * 根据当前运行环境自动选择正确的后端API地址
 * 
 * @returns API基础地址字符串
 */
const resolveApiBase = (): string => {
  // 优先使用环境变量配置
  const envBase = import.meta.env?.VITE_API_BASE?.replace(/\/$/, '');
  if (envBase) return envBase;

  // 开发环境使用相对路径，通过 Vite 代理
  // 生产环境同样使用相对路径
  return '/api';
};

/** 全局API基础地址 */
export const API_BASE = resolveApiBase();

// ========================================
// 初始化数据（数据库空时的默认值）
// ========================================

/**
 * 初始车间/工段列表
 * 包含定型工段和织造工段两个主要工段
 */
const INITIAL_WORKSHOPS: Workshop[] = [
  { id: 'ws_styling', name: '定型工段', code: 'styling', departments: ['定型一车间', '定型二车间', '后整理'] },
  { id: 'ws_weaving', name: '织造工段', code: 'weaving', departments: ['织造一班', '织造二班'] }
];

/**
 * 初始员工数据（实际使用的种子数据）
 * 包含定型工段的示例员工信息
 */
const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: "齐绍兵", gender: 'male', workshopId: 'ws_styling', department: '定型一车间', position: '班长', joinDate: '2018-03-15', standardBaseScore: 8000, status: 'active', phone: '13800138001', expectedDailyHours: 9.5 },
  { id: '2', name: "张志强", gender: 'male', workshopId: 'ws_styling', department: '定型一车间', position: '主机手', joinDate: '2019-07-20', standardBaseScore: 5000, status: 'active', phone: '13800138002', expectedDailyHours: 8 },
  { id: '3', name: "王甲贵", gender: 'male', workshopId: 'ws_styling', department: '定型一车间', position: '副机手', joinDate: '2020-05-10', standardBaseScore: 7300, status: 'active', phone: '13800138003', expectedDailyHours: 12 },
  { id: '4', name: "玉尚杰", gender: 'male', workshopId: 'ws_styling', department: '定型一车间', position: '操作工', joinDate: '2021-11-11', standardBaseScore: 5000, status: 'active', phone: '13800138004', expectedDailyHours: 8 },
  { id: '5', name: "董华荣", gender: 'male', workshopId: 'ws_styling', department: '定型二车间', position: '主机手', joinDate: '2019-02-28', standardBaseScore: 7300, status: 'active', phone: '13800138005', expectedDailyHours: 12 },
  { id: '6', name: "肖冬贵", gender: 'male', workshopId: 'ws_styling', department: '定型二车间', position: '操作工', joinDate: '2020-08-15', standardBaseScore: 7100, status: 'active', phone: '13800138006', expectedDailyHours: 12 },
  { id: '7', name: "郭建文", gender: 'male', workshopId: 'ws_styling', department: '定型二车间', position: '班长', joinDate: '2017-09-01', standardBaseScore: 8000, status: 'active', phone: '13800138007', expectedDailyHours: 12 },
  { id: '8', name: "陈永松", gender: 'male', workshopId: 'ws_styling', department: '后整理', position: '普工', joinDate: '2022-03-01', standardBaseScore: 5500, status: 'active', phone: '13800138008', expectedDailyHours: 8 },
  { id: '9', name: "李国辉", gender: 'male', workshopId: 'ws_styling', department: '后整理', position: '质检', joinDate: '2018-12-12', standardBaseScore: 8000, status: 'active', phone: '13800138009', expectedDailyHours: 12 },
];

/**
 * 初始系统用户数据（带细粒度权限）
 * 包含不同角色的默认用户配置
 */
const INITIAL_USERS: SystemUser[] = [
  {
    id: 'u1', username: 'admin', displayName: '系统管理员', role: UserRole.ADMIN, pinCode: '1234', isSystem: true,
    scopes: ['all'],
    permissions: [
      'VIEW_DASHBOARD', 'VIEW_PRODUCTION', 'VIEW_ATTENDANCE', 'VIEW_CALCULATOR', 'VIEW_SIMULATION', 'VIEW_EMPLOYEES',
      'EDIT_YIELD', 'EDIT_UNIT_PRICE', 'EDIT_KPI', 'EDIT_FIXED_PACK', 'EDIT_HOURS',
      'EDIT_BASE_SCORE', 'EDIT_WEIGHTS', 'APPLY_SIMULATION',
      'VIEW_SENSITIVE', 'MANAGE_ANNOUNCEMENTS', 'MANAGE_EMPLOYEES', 'MANAGE_SYSTEM'
    ]
  },
  {
    id: 'u2', username: 'vp_prod', displayName: '生产副总', role: UserRole.VP_PRODUCTION, pinCode: '1234', isSystem: true,
    scopes: ['styling', 'weaving'],
    permissions: [
      'VIEW_DASHBOARD', 'VIEW_PRODUCTION', 'VIEW_ATTENDANCE', 'VIEW_CALCULATOR', 'VIEW_SIMULATION', 'VIEW_EMPLOYEES',
      'EDIT_YIELD', 'EDIT_UNIT_PRICE', 'EDIT_KPI', 'EDIT_FIXED_PACK', 'EDIT_WEIGHTS',
      'APPLY_SIMULATION', 'VIEW_SENSITIVE', 'EDIT_HOURS', 'MANAGE_ANNOUNCEMENTS'
    ]
  },
  {
    id: 'u4', username: 'schedule', displayName: '调度中心', role: UserRole.SCHEDULING, pinCode: '1234', isSystem: true,
    scopes: ['styling'],
    permissions: ['VIEW_DASHBOARD', 'VIEW_PRODUCTION', 'EDIT_YIELD']
  },
  {
    id: 'u5', username: 'sec_head', displayName: '工段负责人', role: UserRole.SECTION_HEAD, pinCode: '1234', isSystem: true,
    scopes: ['styling'],
    permissions: [
      'VIEW_DASHBOARD', 'VIEW_ATTENDANCE', 'VIEW_EMPLOYEES', 'VIEW_CALCULATOR',
      'EDIT_HOURS', 'EDIT_BASE_SCORE'
    ]
  },
  {
    id: 'u6', username: 'gen_manager', displayName: '总经理', role: UserRole.GENERAL_MANAGER, pinCode: '1234', isSystem: true,
    scopes: ['all'],
    permissions: [
      'VIEW_DASHBOARD', 'VIEW_PRODUCTION', 'VIEW_ATTENDANCE', 'VIEW_CALCULATOR', 'VIEW_SIMULATION', 'VIEW_EMPLOYEES',
      'VIEW_SENSITIVE', 'EDIT_WEIGHTS', 'MANAGE_ANNOUNCEMENTS', 'MANAGE_EMPLOYEES', 'MANAGE_SYSTEM'
    ]
  },
];

const DEFAULT_SETTINGS: GlobalSettings = {
  announcement: "安全生产，重在预防。进入车间请务必穿戴好劳保用品。本月产量冲刺目标：20000m²。"
};

/**
 * 数据库服务类（单例模式）
 * 提供与后端 API 通信的所有方法
 */
export class DatabaseService {
  /** 单例实例 */
  private static instance: DatabaseService;
  /** 连接状态标志 */
  public isConnected: boolean = false;

  /** 私有构造函数，防止外部实例化 */
  private constructor() { }

  /**
   * 获取数据库服务单例实例
   * @returns DatabaseService 实例
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * 连接到后端服务
   * 通过健康检查接口验证连接状态
   * @returns 连接是否成功
   */
  public async connect(): Promise<boolean> {
    if (this.isConnected) return true;

    try {
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();
      this.isConnected = data.connected === true;
      return this.isConnected;
    } catch (error) {
      console.error('Failed to connect to backend:', error);
      this.isConnected = false;
      return false;
    }
  }

  // === Settings ===
  public async getSettings(): Promise<GlobalSettings> {
    await this.ensureConnection();
    try {
      const response = await fetch(`${API_BASE}/settings`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      return {
        announcement: data?.announcement || ''
      };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  public async saveSettings(settings: GlobalSettings): Promise<void> {
    await this.ensureConnection();
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error('Failed to save settings');
  }

  // === Workshops ===
  public async getWorkshops(): Promise<Workshop[]> {
    await this.ensureConnection();
    try {
      const response = await fetch(`${API_BASE}/workshops`);
      if (!response.ok) throw new Error('Failed to fetch workshops');
      const data = await response.json();
      return data.map((ws: any) => ({
        id: ws.id,
        name: ws.name,
        code: ws.code,
        departments: ws.departments || []
      }));
    } catch (error) {
      console.error('Error fetching workshops:', error);
      return INITIAL_WORKSHOPS;
    }
  }

  public async saveWorkshops(workshops: Workshop[]): Promise<void> {
    await this.ensureConnection();
    // 并行保存所有工段
    await Promise.all(workshops.map(ws =>
      fetch(`${API_BASE}/workshops/${ws.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ws)
      }).then(res => {
        if (!res.ok) throw new Error(`Failed to save workshop ${ws.name}`);
      })
    ));
  }

  // === System Users ===

  private mapSystemUserRow(row: any): SystemUser {
    const normalizeArray = <T extends string>(value: any): T[] => {
      if (Array.isArray(value)) {
        return value.map((entry) => String(entry) as T);
      }
      if (typeof value === 'string' && value.trim()) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return parsed.map((entry) => String(entry) as T);
          }
        } catch {
          return value
            .split(',')
            .map((token) => token.trim())
            .filter(Boolean)
            .map((entry) => entry as T);
        }
      }
      return [];
    };

    return {
      id: row.id,
      username: row.username,
      displayName: row.display_name ?? row.displayName,
      role: row.role,
      customRoleName: row.custom_role_name ?? row.customRoleName ?? undefined,
      pinCode: row.pin_code ?? row.pinCode,
      isSystem: row.is_system ?? row.isSystem ?? false,
      scopes: normalizeArray<string>(row.scopes),
      permissions: normalizeArray<Permission>(row.permissions)
    };
  }

  public async getSystemUsers(): Promise<SystemUser[]> {
    await this.ensureConnection();
    try {
      const response = await fetch(`${API_BASE}/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      // Convert snake_case from DB to camelCase for frontend
      return data.map((user: any) => this.mapSystemUserRow(user));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  public async saveSystemUsers(users: SystemUser[]): Promise<void> {
    await this.ensureConnection();
    console.warn('saveSystemUsers not yet implemented in backend');
  }

  public async createSystemUser(user: SystemUser): Promise<SystemUser> {
    await this.ensureConnection();
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...user,
        displayName: user.displayName,
        customRoleName: user.customRoleName,
        pinCode: user.pinCode,
        scopes: user.scopes,
        permissions: user.permissions
      })
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Failed to create system user');
    }
    const data = await response.json();
    return this.mapSystemUserRow(data);
  }

  public async updateSystemUserRemote(user: SystemUser): Promise<SystemUser> {
    await this.ensureConnection();
    const response = await fetch(`${API_BASE}/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        customRoleName: user.customRoleName,
        pinCode: user.pinCode,
        isSystem: user.isSystem,
        scopes: user.scopes,
        permissions: user.permissions
      })
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Failed to update system user');
    }
    const data = await response.json();
    return this.mapSystemUserRow(data);
  }

  public async deleteSystemUserRemote(id: string): Promise<void> {
    await this.ensureConnection();
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok && response.status !== 204) throw new Error('Failed to delete system user');
  }

  // === Personnel ===

  private mapEmployeeRow(row: any): Employee {
    const expectedHoursValue = row.expected_daily_hours ?? row.expectedDailyHours;
    return {
      id: row.id,
      name: row.name,
      gender: row.gender,
      workshopId: row.workshop_id || row.workshopId,
      department: row.department,
      position: row.position,
      joinDate: row.join_date || row.joinDate,
      standardBaseScore: Number(row.standard_base_score ?? row.standardBaseScore ?? 0),
      status: row.status,
      phone: row.phone,
      notes: row.notes,
      expectedDailyHours: expectedHoursValue == null ? undefined : Number(expectedHoursValue)
    };
  }

  public async getEmployees(): Promise<Employee[]> {
    await this.ensureConnection();
    try {
      const response = await fetch(`${API_BASE}/employees`);
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      // Convert snake_case from DB to camelCase for frontend
      return data.map((emp: any) => this.mapEmployeeRow(emp));
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }

  public async createEmployee(employee: Employee): Promise<Employee> {
    await this.ensureConnection();
    const payload = {
      id: employee.id,
      name: employee.name,
      gender: employee.gender,
      workshopId: employee.workshopId,
      department: employee.department,
      position: employee.position,
      joinDate: employee.joinDate,
      standardBaseScore: employee.standardBaseScore,
      status: employee.status,
      phone: employee.phone,
      expectedDailyHours: employee.expectedDailyHours
    };

    const response = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Failed to create employee');
    const data = await response.json();
    return this.mapEmployeeRow(data);
  }

  public async saveEmployees(employees: Employee[]): Promise<void> {
    await this.ensureConnection();
    console.warn('saveEmployees bulk operation not yet implemented');
  }

  public async updateEmployee(updatedEmp: Employee): Promise<void> {
    await this.ensureConnection();
    // Convert camelCase to snake_case for DB
    const dbEmp = {
      name: updatedEmp.name,
      gender: updatedEmp.gender,
      workshopId: updatedEmp.workshopId,
      department: updatedEmp.department,
      position: updatedEmp.position,
      joinDate: updatedEmp.joinDate,
      standardBaseScore: updatedEmp.standardBaseScore,
      status: updatedEmp.status,
      phone: updatedEmp.phone,
      expectedDailyHours: updatedEmp.expectedDailyHours
    };

    const response = await fetch(`${API_BASE}/employees/${updatedEmp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbEmp)
    });
    if (!response.ok) throw new Error('Failed to update employee');
  }

  public async deleteEmployee(employeeId: string): Promise<void> {
    await this.ensureConnection();
    const response = await fetch(`${API_BASE}/employees/${employeeId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to delete employee');
  }

  // === Monthly Data ===

  public async getMonthlyData(year: number, month: number): Promise<MonthlyData | null> {
    await this.ensureConnection();
    try {
      const response = await fetch(`${API_BASE}/monthly-data/${year}/${month}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch monthly data');
      }
      const data = await response.json();
      if (!data || !data.data) return null;
      try {
        return typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
      } catch (e) {
        console.error('Failed to parse monthly data:', e);
        return null;
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      return null;
    }
  }

  public async saveMonthlyData(data: MonthlyData): Promise<void> {
    await this.ensureConnection();
    const response = await fetch(`${API_BASE}/monthly-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year: data.params.year,
        month: data.params.month,
        data: data
      })
    });
    if (!response.ok) throw new Error('Failed to save monthly data');
  }

  // === Stats & Maintenance ===

  public async getStorageStats(): Promise<StorageStats> {
    await this.ensureConnection();
    try {
      const emps = await this.getEmployees();
      return {
        usedKB: 0, // Backend should provide this
        recordCount: 0, // Backend should provide this
        employeeCount: emps.length,
        lastBackup: new Date().toLocaleDateString()
      };
    } catch (error) {
      return {
        usedKB: 0,
        recordCount: 0,
        employeeCount: 0,
        lastBackup: 'N/A'
      };
    }
  }

  public async resetDatabase(): Promise<void> {
    console.warn('resetDatabase not yet implemented in backend');
    throw new Error('Database reset must be done via Supabase SQL Editor');
  }

  public async exportDatabase(): Promise<string> {
    await this.ensureConnection();
    try {
      const [employees, workshops, users, settings] = await Promise.all([
        this.getEmployees(),
        this.getWorkshops(),
        this.getSystemUsers(),
        this.getSettings()
      ]);

      const exportData = {
        employees,
        workshops,
        users,
        settings,
        exportDate: new Date().toISOString()
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  public async importDatabase(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') return false;

      console.warn('Database import from JSON not fully implemented. Please use SQL import in Supabase.');
      return false;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  }

  // ========================================
  // 织造工段 API
  // ========================================

  /** 获取织造工段配置 */
  public async getWeavingConfig(): Promise<any> {
    await this.ensureConnection();
    try {
      const response = await fetch(`${API_BASE}/weaving/config`);
      if (!response.ok) throw new Error('Failed to fetch weaving config');
      return await response.json();
    } catch (error) {
      console.error('Error fetching weaving config:', error);
      return null;
    }
  }

  /** 保存织造工段配置 */
  public async saveWeavingConfig(config: any): Promise<void> {
    await this.ensureConnection();
    const response = await fetch(`${API_BASE}/weaving/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!response.ok) throw new Error('Failed to save weaving config');
  }

  /** 获取所有机台 */
  public async getWeavingMachines(): Promise<any[]> {
    await this.ensureConnection();
    try {
      const response = await fetch(`${API_BASE}/weaving/machines`);
      if (!response.ok) throw new Error('Failed to fetch machines');
      return await response.json();
    } catch (error) {
      console.error('Error fetching machines:', error);
      return [];
    }
  }

  /** 更新机台信息（包括目标产量） */
  public async updateWeavingMachine(id: string, data: any): Promise<any> {
    await this.ensureConnection();
    const response = await fetch(`${API_BASE}/weaving/machines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update machine');
    return await response.json();
  }

  private async ensureConnection() {
    if (!this.isConnected) await this.connect();
  }
}

export const db = DatabaseService.getInstance();