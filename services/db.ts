import { MonthlyData, Employee, StorageStats, SystemUser, UserRole, Permission, GlobalSettings, Workshop } from '../types';

const resolveApiBase = (): string => {
  const envBase = import.meta.env?.VITE_API_BASE?.replace(/\/$/, '');
  if (envBase) return envBase;

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;

    if (!port || port === '80' || port === '443') {
      return `${protocol}//${hostname}/api`;
    }

    const devPorts = new Set(['3001', '5173', '4173', '5174']);
    const targetPort = devPorts.has(port) ? '3000' : port;
    return `${protocol}//${hostname}:${targetPort}/api`;
  }

  return 'http://localhost:3000/api';
};

export const API_BASE = resolveApiBase();

// Initial Workshops
const INITIAL_WORKSHOPS: Workshop[] = [
  { id: 'ws_styling', name: '定型工段', code: 'styling', departments: ['定型一车间', '定型二车间', '后整理'] },
  { id: 'ws_weaving', name: '织造工段', code: 'weaving', departments: ['织造一班', '织造二班'] }
];

// Realistic Seed Data
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

// Initial Users with Granular Permissions
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

export class DatabaseService {
  private static instance: DatabaseService;
  public isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

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
      console.warn('saveWorkshops not yet implemented in backend');
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

  private async ensureConnection() {
    if (!this.isConnected) await this.connect();
  }
}

export const db = DatabaseService.getInstance();