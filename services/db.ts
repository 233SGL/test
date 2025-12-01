import { MonthlyData, Employee, StorageStats, SystemUser, UserRole, Permission, GlobalSettings } from '../types';

const DB_PREFIX = 'heshan_db_v6'; // Increment to force re-seed
const LATENCY_MS = 300; 

// Realistic Seed Data matching the user image
const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: "齐绍兵", gender: 'male', department: '定型一车间', position: '班长', joinDate: '2018-03-15', standardBaseScore: 8000, status: 'active', phone: '13800138001', expectedDailyHours: 9.5 },
  { id: '2', name: "张志强", gender: 'male', department: '定型一车间', position: '主机手', joinDate: '2019-07-20', standardBaseScore: 5000, status: 'active', phone: '13800138002', expectedDailyHours: 8 },
  { id: '3', name: "王甲贵", gender: 'male', department: '定型一车间', position: '副机手', joinDate: '2020-05-10', standardBaseScore: 7300, status: 'active', phone: '13800138003', expectedDailyHours: 12 },
  { id: '4', name: "玉尚杰", gender: 'male', department: '定型一车间', position: '操作工', joinDate: '2021-11-11', standardBaseScore: 5000, status: 'active', phone: '13800138004', expectedDailyHours: 8 },
  { id: '5', name: "董华荣", gender: 'male', department: '定型二车间', position: '主机手', joinDate: '2019-02-28', standardBaseScore: 7300, status: 'active', phone: '13800138005', expectedDailyHours: 12 },
  { id: '6', name: "肖冬贵", gender: 'male', department: '定型二车间', position: '操作工', joinDate: '2020-08-15', standardBaseScore: 7100, status: 'active', phone: '13800138006', expectedDailyHours: 12 },
  { id: '7', name: "郭建文", gender: 'male', department: '定型二车间', position: '班长', joinDate: '2017-09-01', standardBaseScore: 8000, status: 'active', phone: '13800138007', expectedDailyHours: 12 },
  { id: '8', name: "陈永松", gender: 'male', department: '后整理', position: '普工', joinDate: '2022-03-01', standardBaseScore: 5500, status: 'active', phone: '13800138008', expectedDailyHours: 8 },
  { id: '9', name: "李国辉", gender: 'male', department: '后整理', position: '质检', joinDate: '2018-12-12', standardBaseScore: 8000, status: 'active', phone: '13800138009', expectedDailyHours: 12 },
];

const INITIAL_USERS: SystemUser[] = [
  { 
      id: 'u1', username: 'admin', displayName: '系统管理员', role: UserRole.ADMIN, pinCode: '1234', isSystem: true,
      permissions: ['EDIT_YIELD', 'EDIT_MONEY', 'EDIT_HOURS', 'EDIT_BASE_SCORE', 'EDIT_WEIGHTS', 'VIEW_SENSITIVE', 'MANAGE_EMPLOYEES', 'MANAGE_SYSTEM']
  },
  { 
      id: 'u2', username: 'vp_prod', displayName: '生产副总', role: UserRole.VP_PRODUCTION, pinCode: '1234', isSystem: true,
      permissions: ['EDIT_YIELD', 'EDIT_MONEY', 'EDIT_WEIGHTS', 'VIEW_SENSITIVE', 'EDIT_HOURS']
  },
  { 
      id: 'u4', username: 'schedule', displayName: '调度中心', role: UserRole.SCHEDULING, pinCode: '1234', isSystem: true,
      permissions: ['EDIT_YIELD']
  },
  { 
      id: 'u5', username: 'sec_head', displayName: '工段负责人', role: UserRole.SECTION_HEAD, pinCode: '1234', isSystem: true,
      permissions: ['EDIT_HOURS', 'EDIT_BASE_SCORE']
  },
  { 
      id: 'u6', username: 'gen_manager', displayName: '总经理', role: UserRole.GENERAL_MANAGER, pinCode: '1234', isSystem: true,
      permissions: ['VIEW_SENSITIVE', 'EDIT_WEIGHTS', 'MANAGE_EMPLOYEES', 'MANAGE_SYSTEM'] 
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
    await new Promise(resolve => setTimeout(resolve, 600)); 
    
    // Seed Employees
    const empData = localStorage.getItem(`${DB_PREFIX}_employees`);
    if (!empData) {
        localStorage.setItem(`${DB_PREFIX}_employees`, JSON.stringify(INITIAL_EMPLOYEES));
    }

    // Seed Users
    const userData = localStorage.getItem(`${DB_PREFIX}_users`);
    if (!userData) {
        localStorage.setItem(`${DB_PREFIX}_users`, JSON.stringify(INITIAL_USERS));
    }

    // Seed Settings
    const settingsData = localStorage.getItem(`${DB_PREFIX}_settings`);
    if (!settingsData) {
        localStorage.setItem(`${DB_PREFIX}_settings`, JSON.stringify(DEFAULT_SETTINGS));
    }

    this.isConnected = true;
    return true;
  }

  // === Settings ===
  public async getSettings(): Promise<GlobalSettings> {
      await this.ensureConnection();
      const data = localStorage.getItem(`${DB_PREFIX}_settings`);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  }

  public async saveSettings(settings: GlobalSettings): Promise<void> {
      await this.ensureConnection();
      await this.delay();
      localStorage.setItem(`${DB_PREFIX}_settings`, JSON.stringify(settings));
  }

  // === System Users ===

  public async getSystemUsers(): Promise<SystemUser[]> {
    await this.ensureConnection();
    const data = localStorage.getItem(`${DB_PREFIX}_users`);
    return data ? JSON.parse(data) : [];
  }

  public async saveSystemUsers(users: SystemUser[]): Promise<void> {
    await this.ensureConnection();
    await this.delay();
    localStorage.setItem(`${DB_PREFIX}_users`, JSON.stringify(users));
  }

  // === Personnel ===

  public async getEmployees(): Promise<Employee[]> {
    await this.ensureConnection();
    const data = localStorage.getItem(`${DB_PREFIX}_employees`);
    return data ? JSON.parse(data) : [];
  }

  public async saveEmployees(employees: Employee[]): Promise<void> {
    await this.ensureConnection();
    await this.delay();
    localStorage.setItem(`${DB_PREFIX}_employees`, JSON.stringify(employees));
  }

  public async updateEmployee(updatedEmp: Employee): Promise<void> {
    await this.ensureConnection();
    await this.delay();
    const employees = await this.getEmployees();
    const newEmps = employees.map(e => e.id === updatedEmp.id ? updatedEmp : e);
    localStorage.setItem(`${DB_PREFIX}_employees`, JSON.stringify(newEmps));
  }

  // === Monthly Data ===

  public async getMonthlyData(year: number, month: number): Promise<MonthlyData | null> {
    await this.ensureConnection();
    await this.delay();
    const key = `${DB_PREFIX}_data_${year}_${month}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  public async saveMonthlyData(data: MonthlyData): Promise<void> {
    await this.ensureConnection();
    await this.delay();
    const key = `${DB_PREFIX}_data_${data.params.year}_${data.params.month}`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  // === Stats & Maintenance ===

  public async getStorageStats(): Promise<StorageStats> {
    await this.ensureConnection();
    let totalSize = 0;
    let recordCount = 0;
    
    for(let key in localStorage) {
        if (!localStorage.hasOwnProperty(key)) continue;
        if (key.startsWith(DB_PREFIX)) {
            const val = localStorage.getItem(key) || '';
            totalSize += (val.length * 2); // approx bytes
            if(key.includes('_data_')) recordCount++;
        }
    }

    const emps = await this.getEmployees();
    
    return {
        usedKB: Math.round(totalSize / 1024),
        recordCount,
        employeeCount: emps.length,
        lastBackup: new Date().toLocaleDateString()
    };
  }

  public async resetDatabase(): Promise<void> {
    await this.delay();
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(DB_PREFIX)) {
            localStorage.removeItem(key);
        }
    });
    localStorage.setItem(`${DB_PREFIX}_employees`, JSON.stringify(INITIAL_EMPLOYEES));
    localStorage.setItem(`${DB_PREFIX}_users`, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(`${DB_PREFIX}_settings`, JSON.stringify(DEFAULT_SETTINGS));
  }

  public async exportDatabase(): Promise<string> {
    await this.delay();
    const exportData: Record<string, any> = {};
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(DB_PREFIX)) {
            exportData[key] = JSON.parse(localStorage.getItem(key) || 'null');
        }
    });
    return JSON.stringify(exportData, null, 2);
  }

  public async importDatabase(jsonString: string): Promise<boolean> {
    await this.delay();
    try {
        const data = JSON.parse(jsonString);
        if (!data || typeof data !== 'object') return false;

        // Wipe current
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(DB_PREFIX)) localStorage.removeItem(key);
        });

        // Restore
        Object.entries(data).forEach(([key, val]) => {
            if (key.startsWith(DB_PREFIX)) {
                localStorage.setItem(key, JSON.stringify(val));
            }
        });
        return true;
    } catch (e) {
        console.error("Import failed", e);
        return false;
    }
  }

  private async ensureConnection() {
    if (!this.isConnected) await this.connect();
  }

  private async delay() {
    await new Promise(resolve => setTimeout(resolve, LATENCY_MS));
  }
}

export const db = DatabaseService.getInstance();
