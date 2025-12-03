export interface WeavingConfig {
    netFormationBenchmark: number; // 成网率基准 (e.g., 68)
    operationRateBenchmark: number; // 运转率基准 (e.g., 72)
    targetEquivalentOutput: number; // 单机目标等效产量 (e.g., 6450)
    operatorQuota: number; // 操作工定员 (e.g., 24)
    avgTargetBonus: number; // 平均每人目标奖金 (e.g., 4000)
    adminTeamSize: number; // 管理员班人数 (e.g., 3)
    operationRateBonusUnit: number; // 运转率奖金单价 (e.g., 500)

    // Coefficients
    leaderCoef: number; // 班长系数 (e.g., 1.3)
    memberCoef: number; // 班员系数 (e.g., 1.0)

    // Base Salaries
    leaderBaseSalary: number; // 班长底薪 (e.g., 3500)
    memberBaseSalary: number; // 班员底薪 (e.g., 2500)
}

export interface WeavingMonthlyData {
    netFormationRate: number; // 当月织造成网率 %
    equivalentOutput: number; // 当月织造等效产量
    activeMachines: number; // 有效机台总数
    actualOperators: number; // 操作工实际人数
    operationRate: number; // 当月织机运转率 %
    attendanceDays: number; // 出勤天数 (default full attendance usually, but kept for logic)
}

export interface WeavingCalculationResult {
    qualityBonusCoef: number; // 成网率质量奖系数
    qualityBonusTotal: number; // 成网率质量奖总额
    operationBonusTotal: number; // 织机运转率奖总额
    totalBonusPool: number; // 管理员班总奖金池

    // Distribution
    totalCoef: number; // 总系数
    leaderBonus: number; // 班长奖金
    memberBonus: number; // 班员奖金

    // Final Wages (assuming full attendance for simplicity in this object, or calculated outside)
    leaderTotalWage: number;
    memberTotalWage: number;
}

export interface EquivalentOutputRow {
    id: string;
    actualOutput: number; // 实际产量
    weftDensity: number; // 纬密
    machineWidth: number; // 机台宽度
    speedType: 'H2' | 'H5'; // 机台速度类型

    // Calculated values for display
    outputCoef?: number;
    widthCoef?: number;
    speedCoef?: number;
    rowEquivalentOutput?: number;
}

export const DEFAULT_WEAVING_CONFIG: WeavingConfig = {
    netFormationBenchmark: 68,
    operationRateBenchmark: 72,
    targetEquivalentOutput: 6450,
    operatorQuota: 24,
    avgTargetBonus: 4000,
    adminTeamSize: 3,
    operationRateBonusUnit: 500,
    leaderCoef: 1.3,
    memberCoef: 1.0,
    leaderBaseSalary: 3500,
    memberBaseSalary: 2500,
};

export const INITIAL_ADMIN_TEAM = [
    { name: '耿志友', role: '班长', baseSalary: 3500 },
    { name: '赵红林', role: '班员', baseSalary: 2500 },
    { name: '夏旺潮', role: '班员', baseSalary: 2500 },
];

// ==================== 织造工段人员档案 ====================

export type EmployeeStatus = 'active' | 'probation' | 'leave' | 'terminated';
export type WeavingPosition = 'operator' | 'leader' | 'member'; // 操作工/班长/班员

// 织造工段人员档案（与定型工段独立）
export interface WeavingEmployee {
    id: string;
    name: string;
    gender: 'male' | 'female';
    machineId: string; // 分配的机台 (H1-H11)
    position: WeavingPosition;
    baseSalary: number; // 底薪
    coefficient: number; // 分配系数（班长1.3，班员1.0，操作工根据考核）
    joinDate: string;
    phone?: string;
    status: EmployeeStatus;
    notes?: string;
}

// 机台信息
export interface WeavingMachine {
    id: string; // H1, H2, ..., H11
    name: string;
    speedType: 'H2' | 'H5';
    width: number; // 机台宽度（米）
    targetOutput: number; // 目标产量
    assignedEmployees: string[]; // 分配的员工 ID 列表
}

// 预设机台列表 (H1-H11)
export const DEFAULT_MACHINES: WeavingMachine[] = [
    { id: 'H1', name: '1号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [] },
    { id: 'H2', name: '2号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [] },
    { id: 'H3', name: '3号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [] },
    { id: 'H4', name: '4号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [] },
    { id: 'H5', name: '5号机', speedType: 'H5', width: 4.25, targetOutput: 3600, assignedEmployees: [] },
    { id: 'H6', name: '6号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [] },
    { id: 'H7', name: '7号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [] },
    { id: 'H8', name: '8号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [] },
    { id: 'H9', name: '9号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [] },
    { id: 'H10', name: '10号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [] },
    { id: 'H11', name: '11号机', speedType: 'H2', width: 8.5, targetOutput: 6450, assignedEmployees: [] },
];
