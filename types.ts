/**
 * ========================================
 * 鹤山积分管理系统 - 核心类型定义
 * ========================================
 * 
 * 本文件定义了系统中使用的所有核心类型，包括：
 * - 用户角色枚举
 * - 新/旧权限系统类型
 * - 员工、车间、月度数据等业务实体
 * 
 * @module types
 * @version 1.1.0
 */

// ========================================
// 用户角色定义
// ========================================

/**
 * 系统用户角色枚举
 * 定义系统中所有可能的用户角色类型
 */
export enum UserRole {
  /** 系统管理员 - 拥有所有权限 */
  ADMIN = 'ADMIN',
  /** 生产副总 - 可管理定薪、KPI等生产相关数据 */
  VP_PRODUCTION = 'VP_PRODUCTION',
  /** 调度中心 - 主要负责产量数据录入 */
  SCHEDULING = 'SCHEDULING',
  /** 工段负责人 - 管理本工段工时和人员 */
  SECTION_HEAD = 'SECTION_HEAD',
  /** 总经理 - 审批权限，可查看所有数据 */
  GENERAL_MANAGER = 'GENERAL_MANAGER',
  /** 访客 - 未登录状态，无任何权限 */
  GUEST = 'GUEST'
}

// ========================================
// 新权限系统：三维权限模型
// ========================================
// 
// 新权限系统采用三个维度来控制用户权限：
// 1. 工段范围 (Scope) - 用户可访问哪些工段
// 2. 页面类型 (Page) - 用户可访问哪些页面
// 3. 编辑权限 (Edit) - 用户可执行哪些操作
//
// 这种设计允许更灵活的权限分配，同时保持向后兼容
// ========================================

/**
 * 工段范围类型
 * - styling: 仅定型工段
 * - weaving: 仅织造工段  
 * - all: 所有工段（管理员）
 */
export type WorkshopScope = 'styling' | 'weaving' | 'all';

/**
 * 页面类型
 * 定义系统中所有可访问的页面
 */
export type PageType =
  // 通用页面（根据工段映射到不同路由）
  | 'dashboard'        // 数据大盘
  | 'production'       // 生产数据录入
  | 'calculator'       // 积分计算
  | 'attendance'       // 每日工时（仅定型）
  | 'simulation'       // 模拟沙箱（仅定型）
  | 'config'           // 工段配置
  | 'announcements'    // 工段公告
  // 织造工段专有页面
  | 'weaving_production'  // 织造生产录入
  | 'weaving_records'     // 织造生产记录
  | 'weaving_summary'     // 织造月度汇总
  | 'weaving_bonus'       // 织造奖金计算
  | 'weaving_machines'    // 织造机台管理
  | 'weaving_products'    // 织造网种管理
  // 系统页面（不受工段限制）
  | 'employees'        // 员工档案
  | 'settings';        // 系统设置

// 3. 编辑权限（Edit Permission）
export type EditPermission =
  // 生产数据编辑
  | 'edit_production_data'   // 编辑产量、单价、KPI、固定包
  | 'edit_attendance'        // 编辑工时
  | 'edit_config'            // 编辑工段配置参数
  // 积分策略
  | 'edit_base_score'        // 编辑基础分
  | 'edit_weights'           // 编辑权重
  | 'apply_simulation'       // 应用模拟
  // 人员管理
  | 'manage_employees'       // 员工档案增删改
  // 系统管理
  | 'manage_announcements'   // 公告管理
  | 'manage_system';         // 系统设置

/**
 * 用户权限结构（新系统）
 * 将用户权限分为三个维度进行管理
 */
export interface UserPermissions {
  /** 用户可访问的工段范围列表 */
  scopes: WorkshopScope[];
  /** 用户可查看的页面类型列表 */
  pages: PageType[];
  /** 用户拥有的编辑权限列表 */
  edits: EditPermission[];
}

// ========================================
// 旧权限系统（保留以保持兼容性）
// ========================================

// Granular Permissions: View (Page Access) vs Edit (Action)
export type Permission =
  // --- Page Access (页面访问) ---
  | 'VIEW_DASHBOARD'
  | 'VIEW_PRODUCTION'
  | 'VIEW_ATTENDANCE'
  | 'VIEW_CALCULATOR'
  | 'VIEW_SIMULATION'
  | 'VIEW_EMPLOYEES'

  // --- Data Entry (数据录入) ---
  | 'EDIT_YIELD'       // 入库量
  | 'EDIT_UNIT_PRICE'  // 单价
  | 'EDIT_FIXED_PACK'  // 固定包
  | 'EDIT_KPI'         // KPI
  | 'EDIT_HOURS'       // 工时

  // --- Salary & Mgmt (积分与管理) ---
  | 'EDIT_BASE_SCORE'  // 基础分
  | 'EDIT_WEIGHTS'     // 权重
  | 'APPLY_SIMULATION' // 模拟应用到生产
  | 'MANAGE_ANNOUNCEMENTS' // 公告
  | 'MANAGE_EMPLOYEES' // 档案增删改
  | 'MANAGE_SYSTEM'    // 系统设置
  | 'VIEW_SENSITIVE'  // 敏感金额查看

  // --- Weaving Section (织造工段) ---
  // 页面访问权限
  | 'VIEW_WEAVING_PRODUCTION'      // 查看织造生产录入页
  | 'VIEW_WEAVING_RECORDS'         // 查看织造生产记录页
  | 'VIEW_WEAVING_SUMMARY'         // 查看织造月度汇总页
  | 'VIEW_WEAVING_BONUS'           // 查看织造奖金计算页
  | 'VIEW_WEAVING_MACHINES'        // 查看织造机台管理页
  | 'VIEW_WEAVING_PRODUCTS'        // 查看织造网种管理页
  // 操作权限
  | 'EDIT_WEAVING_PRODUCTION'      // 编辑织造生产记录
  | 'EDIT_WEAVING_MACHINES'        // 编辑织造机台配置
  | 'EDIT_WEAVING_PRODUCTS'        // 编辑织造网种配置
  | 'EDIT_WEAVING_CONFIG';         // 编辑织造工段配置

export const PERMISSION_LIST: { key: Permission, label: string, category: string }[] = [
  // 1. Page Access (定型工段)
  { key: 'VIEW_DASHBOARD', label: '查看数据大盘', category: '定型工段 - 页面访问' },
  { key: 'VIEW_PRODUCTION', label: '查看生产录入页', category: '定型工段 - 页面访问' },
  { key: 'VIEW_ATTENDANCE', label: '查看每日工时页', category: '定型工段 - 页面访问' },
  { key: 'VIEW_CALCULATOR', label: '查看积分计算页', category: '定型工段 - 页面访问' },
  { key: 'VIEW_SIMULATION', label: '查看模拟沙箱页', category: '定型工段 - 页面访问' },
  { key: 'VIEW_EMPLOYEES', label: '查看员工档案页', category: '定型工段 - 页面访问' },

  // 2. Production Data (定型工段)
  { key: 'EDIT_YIELD', label: '录入产量 (入库量)', category: '定型工段 - 数据编辑' },
  { key: 'EDIT_UNIT_PRICE', label: '调整单价', category: '定型工段 - 数据编辑' },
  { key: 'EDIT_FIXED_PACK', label: '调整固定积分包', category: '定型工段 - 数据编辑' },
  { key: 'EDIT_KPI', label: '调整 KPI', category: '定型工段 - 数据编辑' },
  { key: 'EDIT_HOURS', label: '修改每日工时', category: '定型工段 - 数据编辑' },
  { key: 'EDIT_BASE_SCORE', label: '评定员工基础分', category: '定型工段 - 数据编辑' },
  { key: 'EDIT_WEIGHTS', label: '调节分配权重', category: '定型工段 - 数据编辑' },
  { key: 'APPLY_SIMULATION', label: '应用模拟结果到生产', category: '定型工段 - 数据编辑' },
  { key: 'VIEW_SENSITIVE', label: '查看敏感积分数据', category: '定型工段 - 数据编辑' },

  // 3. Weaving Section Page Access (织造工段)
  { key: 'VIEW_WEAVING_PRODUCTION', label: '查看生产录入页', category: '织造工段 - 页面访问' },
  { key: 'VIEW_WEAVING_RECORDS', label: '查看生产记录页', category: '织造工段 - 页面访问' },
  { key: 'VIEW_WEAVING_SUMMARY', label: '查看月度汇总页', category: '织造工段 - 页面访问' },
  { key: 'VIEW_WEAVING_BONUS', label: '查看奖金计算页', category: '织造工段 - 页面访问' },
  { key: 'VIEW_WEAVING_MACHINES', label: '查看机台管理页', category: '织造工段 - 页面访问' },
  { key: 'VIEW_WEAVING_PRODUCTS', label: '查看网种管理页', category: '织造工段 - 页面访问' },

  // 4. Weaving Section Operations (织造工段)
  { key: 'EDIT_WEAVING_PRODUCTION', label: '编辑生产记录', category: '织造工段 - 数据编辑' },
  { key: 'EDIT_WEAVING_MACHINES', label: '编辑机台配置', category: '织造工段 - 数据编辑' },
  { key: 'EDIT_WEAVING_PRODUCTS', label: '编辑网种配置', category: '织造工段 - 数据编辑' },
  { key: 'EDIT_WEAVING_CONFIG', label: '编辑工段配置', category: '织造工段 - 数据编辑' },

  // 5. System Admin
  { key: 'MANAGE_ANNOUNCEMENTS', label: '发布车间公告', category: '系统管理' },
  { key: 'MANAGE_EMPLOYEES', label: '员工档案增删改', category: '系统管理' },
  { key: 'MANAGE_SYSTEM', label: '系统设置与用户管理', category: '系统管理' },
];

/**
 * 员工状态类型
 * - active: 正式在职
 * - probation: 试用期
 * - leave: 休假中
 * - terminated: 已离职
 */
export type EmployeeStatus = 'active' | 'probation' | 'leave' | 'terminated';

/**
 * 车间/工段信息接口
 */
export interface Workshop {
  /** 唯一标识符 */
  id: string;
  /** 工段名称（如：定型工段） */
  name: string;
  /** 工段代码（如：styling） */
  code: string;
  /** 工段下属部门/车间列表 */
  departments: string[];
}

export interface SystemUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  customRoleName?: string;

  // 新权限系统
  newPermissions?: UserPermissions;  // 新的三维权限

  // 旧权限系统（保留兼容）
  permissions: Permission[];  // 旧的细碎权限列表
  scopes: string[];          // 工段范围（新旧系统共用）

  pinCode: string;
  avatar?: string;
  isSystem?: boolean;
}

/**
 * 员工信息接口
 * 包含员工的基本信息、岗位信息和积分相关配置
 */
export interface Employee {
  /** 唯一标识符 */
  id: string;
  /** 员工姓名 */
  name: string;
  /** 性别 */
  gender: 'male' | 'female';
  /** 所属工段ID（如：ws_styling, ws_weaving） */
  workshopId: string;
  /** 所属部门/车间 */
  department: string;
  /** 岗位名称 */
  position: string;
  /** 入职日期（YYYY-MM-DD格式） */
  joinDate: string;
  /** 联系电话（可选） */
  phone?: string;
  /** 身份证号（可选） */
  idCard?: string;
  /** 标准基础分（用于积分计算，定型工段使用） */
  standardBaseScore: number;
  /** 在职状态 */
  status: EmployeeStatus;
  /** 备注信息（可选） */
  notes?: string;
  /** 预期每日工时（小时，用于考勤计算） */
  expectedDailyHours?: number;
  /** 织造工段专用：分配的机台号 (H1-H11) 或 'admin' (管理员) */
  machineId?: string;
  /** 织造工段专用：奖金分配系数 */
  coefficient?: number;
  /** 织造工段专用：基本工资 */
  baseSalary?: number;
}

export interface SalaryRecord {
  employeeId: string;
  employeeName: string;
  workHours: number;
  dailyLogs?: Record<number, number>;
  expectedHours: number;
  baseScoreSnapshot: number;
  calculatedRealBase?: number;
  calculatedBonus?: number;
  calculatedTotal?: number;
}

export interface MonthlyParams {
  year: number;
  month: number;
  area: number;
  unitPrice: number;
  attendancePack: number;
  kpiScore: number;
  weightTime: number;
  weightBase: number;
}

export interface MonthlyData {
  id: string;
  params: MonthlyParams;
  records: SalaryRecord[];
}

export interface CalculationResult {
  records: (SalaryRecord & {
    workRatio: number;
    baseRatio: number;
    compositeWeight: number;
    realBase: number;
    bonus: number;
    finalScore: number;
  })[];
  totalPool: number;
  totalBasePayout: number;
  bonusPool: number;
  sumWorkHours: number;
  sumExpectedHours: number;
  sumStandardBase: number;
}

export interface GlobalSettings {
  announcement: string;
}

export interface StorageStats {
  usedKB: number;
  recordCount: number;
  employeeCount: number;
  lastBackup?: string;
}
