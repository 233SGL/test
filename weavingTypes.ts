/**
 * ========================================
 * 鹤山积分管理系统 - 织造工段类型定义
 * ========================================
 * 
 * 本文件定义织造工段特有的数据类型，包括：
 * - 织造配置参数
 * - 月度生产数据
 * - 积分计算结果
 * - 机台和人员信息
 * 
 * @module weavingTypes
 * @version 1.1.0
 */

/**
 * 织造工段配置参数接口
 * 用于定义积分计算的各项基准参数和系数
 */
export interface WeavingConfig {
    /** 成网率基准值（百分比，如 68 表示 68%） */
    netFormationBenchmark: number;
    /** 运转率基准值（百分比，如 72 表示 72%） */
    operationRateBenchmark: number;
    /** 单机目标等效产量（平方米） */
    targetEquivalentOutput: number;
    /** 操作工定员人数 */
    operatorQuota: number;
    /** 平均每人目标奖金（积分） */
    avgTargetBonus: number;
    /** 管理员班组人数 */
    adminTeamSize: number;
    /** 运转率奖金单价（每超1%的奖金积分） */
    operationRateBonusUnit: number;

    // ========== 分配系数 ==========
    /** 班长分配系数（通常为 1.3） */
    leaderCoef: number;
    /** 普通班员分配系数（通常为 1.0） */
    memberCoef: number;

    // ========== 底薪配置 ==========
    /** 班长底薪（积分） */
    leaderBaseSalary: number;
    /** 普通班员底薪（积分） */
    memberBaseSalary: number;
}

/**
 * 织造工段月度数据接口
 * 存储当月织造工段的实际生产数据
 */
export interface WeavingMonthlyData {
    /** 当月织造成网率（百分比） */
    netFormationRate: number;
    /** 当月织造等效产量（平方米） */
    equivalentOutput: number;
    /** 有效机台总数 */
    activeMachines: number;
    /** 操作工实际人数 */
    actualOperators: number;
    /** 当月织机运转率（百分比） */
    operationRate: number;
    /** 出勤天数（用于基本积分计算） */
    attendanceDays: number;
}

/**
 * 织造工段积分计算结果接口
 * 包含奖金池计算结果和人员分配明细
 */
export interface WeavingCalculationResult {
    // ========== 奖金池计算 ==========
    /** 成网率质量奖系数 */
    qualityBonusCoef: number;
    /** 成网率质量奖总额（积分） */
    qualityBonusTotal: number;
    /** 织机运转率奖总额（积分） */
    operationBonusTotal: number;
    /** 管理员班总奖金池（积分） */
    totalBonusPool: number;

    // ========== 分配结果 ==========
    /** 总分配系数 */
    totalCoef: number;
    /** 班长奖金（积分） */
    leaderBonus: number;
    /** 普通班员奖金（积分） */
    memberBonus: number;

    // ========== 应发积分 ==========
    /** 班长应发总积分（底薪+奖金） */
    leaderTotalWage: number;
    /** 普通班员应发总积分（底薪+奖金） */
    memberTotalWage: number;
}

/**
 * 等效产量计算行接口
 * 用于等效产量计算器中的每一行数据
 */
export interface EquivalentOutputRow {
    /** 行唯一标识符 */
    id: string;
    /** 实际产量（平方米） */
    actualOutput: number;
    /** 纬密（根/厘米） */
    weftDensity: number;
    /** 机台宽度（米） */
    machineWidth: number;
    /** 机台速度类型（H2=高速, H5=低速） */
    speedType: 'H2' | 'H5';

    // ========== 计算得出的中间值（用于显示） ==========
    /** 产量系数 */
    outputCoef?: number;
    /** 宽度系数 */
    widthCoef?: number;
    /** 速度系数 */
    speedCoef?: number;
    /** 该行的等效产量 */
    rowEquivalentOutput?: number;
}

/**
 * 织造工段默认配置参数
 * 系统初始化时使用的默认值
 */
export const DEFAULT_WEAVING_CONFIG: WeavingConfig = {
    netFormationBenchmark: 68,        // 成网率基准 68%
    operationRateBenchmark: 72,       // 运转率基准 72%
    targetEquivalentOutput: 6450,     // 单机目标等效产量
    operatorQuota: 24,                // 操作工定员 24 人
    avgTargetBonus: 4000,             // 人均目标奖金 4000 积分
    adminTeamSize: 3,                 // 管理员班组 3 人
    operationRateBonusUnit: 500,      // 运转率奖金单价 500 积分/%
    leaderCoef: 1.3,                  // 班长系数 1.3
    memberCoef: 1.0,                  // 班员系数 1.0
    leaderBaseSalary: 3500,           // 班长底薪 3500 积分
    memberBaseSalary: 2500,           // 班员底薪 2500 积分
};

// ========================================
// 织造工段人员档案类型
// ========================================

/**
 * 员工状态类型（与主类型文件保持一致）
 */
export type EmployeeStatus = 'active' | 'probation' | 'leave' | 'terminated';

/**
 * 织造工段岗位类型
 * - admin_leader: 管理员班长（参与奖金分配，系数1.3）
 * - admin_member: 管理员班员（参与奖金分配，系数1.0）
 * - operator: 操作工（负责机台操作，不参与管理员奖金分配）
 */
export type WeavingPosition = 'admin_leader' | 'admin_member' | 'operator';

/**
 * 织造工段岗位配置
 * 定义各岗位的名称、系数和底薪
 */
export const WEAVING_POSITION_CONFIG: Record<WeavingPosition, {
    label: string;
    coefficient: number;
    baseSalary: number;
    description: string;
}> = {
    admin_leader: {
        label: '管理员班长',
        coefficient: 1.3,
        baseSalary: 3500,
        description: '管理员班负责人，参与奖金二次分配'
    },
    admin_member: {
        label: '管理员班员',
        coefficient: 1.0,
        baseSalary: 2500,
        description: '管理员班普通成员，参与奖金二次分配'
    },
    operator: {
        label: '操作工',
        coefficient: 0,
        baseSalary: 0,
        description: '负责机台操作，薪酬另行计算'
    }
};

/**
 * 织造工段员工信息接口
 * 与定型工段独立管理，有织造工段特有的字段
 */
export interface WeavingEmployee {
    /** 唯一标识符 */
    id: string;
    /** 员工姓名 */
    name: string;
    /** 性别 */
    gender: 'male' | 'female';
    /** 岗位类型 */
    position: WeavingPosition;
    /** 底薪（积分），根据岗位自动设置 */
    baseSalary: number;
    /** 分配系数（班长1.3，班员1.0，操作工0） */
    coefficient: number;
    /** 入职日期 */
    joinDate: string;
    /** 联系电话（可选） */
    phone?: string;
    /** 在职状态 */
    status: EmployeeStatus;
    /** 备注信息（可选） */
    notes?: string;
    /** 出勤天数（当月） */
    attendanceDays?: number;
    
    // ========== 操作工专用字段 ==========
    /** 分配的机台号 (H1-H11)，仅操作工需要 */
    machineId?: string;
    /** 班组（如：一班、二班），仅操作工需要 */
    team?: string;
}

/**
 * 管理员班组初始人员名单
 * 织造工段管理员班组的默认人员配置
 */
export const INITIAL_ADMIN_TEAM: WeavingEmployee[] = [
    { 
        id: 'w1', 
        name: '耿志友', 
        gender: 'male',
        position: 'admin_leader', 
        baseSalary: 3500, 
        coefficient: 1.3,
        joinDate: '2020-01-01',
        status: 'active'
    },
    { 
        id: 'w2', 
        name: '赵红林', 
        gender: 'male',
        position: 'admin_member', 
        baseSalary: 2500, 
        coefficient: 1.0,
        joinDate: '2020-03-15',
        status: 'active'
    },
    { 
        id: 'w3', 
        name: '夏旺潮', 
        gender: 'male',
        position: 'admin_member', 
        baseSalary: 2500, 
        coefficient: 1.0,
        joinDate: '2021-06-01',
        status: 'active'
    },
];

/**
 * 织造机台信息接口
 * 定义织造工段中每台织机的基本信息
 */
export interface WeavingMachine {
    /** 机台编号 (H1-H11) */
    id: string;
    /** 机台名称（如：1号机） */
    name: string;
    /** 速度类型（H2=高速, H5=低速） */
    speedType: 'H2' | 'H5';
    /** 机台宽度（米） */
    width: number;
    /** 目标产量（平方米/月） */
    targetOutput: number;
    /** 分配到该机台的员工ID列表 */
    assignedEmployees: string[];
    /** 机台状态 */
    status: 'running' | 'maintenance' | 'idle';
}

/**
 * 预设机台列表 (H1-H11)
 * 织造工段所有机台的默认配置
 */
export const DEFAULT_MACHINES: WeavingMachine[] = [
    { id: 'H1', name: '1号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [], status: 'running' },
    { id: 'H2', name: '2号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [], status: 'running' },
    { id: 'H3', name: '3号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [], status: 'running' },
    { id: 'H4', name: '4号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [], status: 'running' },
    { id: 'H5', name: '5号机', speedType: 'H5', width: 4.25, targetOutput: 3600, assignedEmployees: [], status: 'running' },
    { id: 'H6', name: '6号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [], status: 'running' },
    { id: 'H7', name: '7号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [], status: 'running' },
    { id: 'H8', name: '8号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [], status: 'running' },
    { id: 'H9', name: '9号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [], status: 'running' },
    { id: 'H10', name: '10号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [], status: 'running' },
    { id: 'H11', name: '11号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [], status: 'running' },
];

// ========================================
// 织造工段月度数据类型
// ========================================

/**
 * 机台月度产量记录
 */
export interface MachineMonthlyRecord {
    /** 机台编号 */
    machineId: string;
    /** 实际产量（平方米） */
    actualOutput: number;
    /** 产品纬密 */
    weftDensity: number;
    /** 等效产量（计算得出） */
    equivalentOutput: number;
}

/**
 * 织造工段月度完整数据
 */
export interface WeavingMonthlyFullData {
    /** 年份 */
    year: number;
    /** 月份 */
    month: number;
    /** 基础指标 */
    metrics: WeavingMonthlyData;
    /** 各机台产量明细 */
    machineRecords: MachineMonthlyRecord[];
    /** 员工出勤记录 */
    attendanceRecords: Record<string, number>;
    /** 计算结果快照 */
    calculationSnapshot?: WeavingCalculationResult;
}
