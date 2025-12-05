/**
 * ========================================
 * 鹤山积分管理系统 - 织造工段积分计算服务
 * ========================================
 * 
 * 根据《织造工段管理员班集体考核方案V251202》实现
 * 
 * 核心计算逻辑：
 * 1. 等效产量计算：以织机为统计单位(H1-H11)，以特定产品为基准计算等效值
 * 2. 成网率质量奖：根据成网率超标情况计算
 * 3. 织机运转率奖：以72%为基准，每超1%奖500元
 * 4. 二次分配：按班长1.3、班员1.0系数分配
 * 
 * @module services/weavingCalcService
 * @version 1.0.0
 */

import { 
    WeavingConfig, 
    WeavingMonthlyData, 
    WeavingCalculationResult,
    DEFAULT_WEAVING_CONFIG 
} from '../weavingTypes';

// ========================================
// 常量定义
// ========================================

/**
 * 基准纬密值（22504网种，纬密13根/厘米）
 * 其他网种按此基准折算产量系数
 */
const BASE_WEFT_DENSITY = 13;

/**
 * 基准机台宽度（米）
 * 以8.5米为标准1，其他宽度反比例计算
 */
const BASE_MACHINE_WIDTH = 8.5;

/**
 * 速度系数映射
 * H2 (41纬/分钟) 为基准1
 * H5 的系数为 0.56
 */
const SPEED_COEFFICIENTS: Record<string, number> = {
    'H2': 1.0,    // 高速机型，41纬/分钟
    'H5': 0.56,   // 低速机型
};

/**
 * 机台配置信息
 * H1-H11 各机台的默认参数
 */
export interface MachineConfig {
    id: string;           // 机台编号
    name: string;         // 机台名称
    speedType: 'H2' | 'H5'; // 速度类型
    width: number;        // 机台宽度(米)
    isActive: boolean;    // 是否有效运行
}

/**
 * 默认机台配置 (H1-H11)
 */
export const DEFAULT_MACHINE_CONFIGS: MachineConfig[] = [
    { id: 'H1', name: '1号机', speedType: 'H2', width: 8.5, isActive: true },
    { id: 'H2', name: '2号机', speedType: 'H2', width: 8.5, isActive: true },
    { id: 'H3', name: '3号机', speedType: 'H2', width: 8.5, isActive: true },
    { id: 'H4', name: '4号机', speedType: 'H2', width: 8.5, isActive: true },
    { id: 'H5', name: '5号机', speedType: 'H5', width: 4.25, isActive: true },
    { id: 'H6', name: '6号机', speedType: 'H2', width: 8.5, isActive: true },
    { id: 'H7', name: '7号机', speedType: 'H2', width: 8.5, isActive: true },
    { id: 'H8', name: '8号机', speedType: 'H2', width: 8.5, isActive: true },
    { id: 'H9', name: '9号机', speedType: 'H2', width: 8.5, isActive: true },
    { id: 'H10', name: '10号机', speedType: 'H2', width: 8.5, isActive: true },
    { id: 'H11', name: '11号机', speedType: 'H2', width: 8.5, isActive: true },
];

// ========================================
// 机台产量数据接口
// ========================================

/**
 * 单台机台的产量数据
 */
export interface MachineProductionData {
    /** 机台编号 (H1-H11) */
    machineId: string;
    /** 实际产量（平方米） */
    actualOutput: number;
    /** 纬密（根/厘米），默认13 */
    weftDensity: number;
    /** 机台宽度（米），默认8.5 */
    machineWidth: number;
    /** 速度类型 */
    speedType: 'H2' | 'H5';
}

/**
 * 机台等效产量计算结果
 */
export interface MachineEquivalentResult {
    /** 机台编号 */
    machineId: string;
    /** 实际产量 */
    actualOutput: number;
    /** 产量系数（纬密/13） */
    outputCoef: number;
    /** 宽度系数（8.5/机台宽度） */
    widthCoef: number;
    /** 速度系数 */
    speedCoef: number;
    /** 等效产量 = 实际产量 × 产量系数 × 宽度系数 × 速度系数 */
    equivalentOutput: number;
}

// ========================================
// 等效产量计算函数
// ========================================

/**
 * 计算产量系数
 * 公式：产量系数 = 纬密 / 基准纬密(13)
 * 
 * 例如：3616ssb-1网种，纬密44.5，产量系数 = 44.5/13 = 3.42
 * 
 * @param weftDensity - 纬密（根/厘米）
 * @returns 产量系数
 */
export const calculateOutputCoefficient = (weftDensity: number): number => {
    if (weftDensity <= 0) return 0;
    return weftDensity / BASE_WEFT_DENSITY;
};

/**
 * 计算宽度系数
 * 公式：宽度系数 = 基准宽度(8.5米) / 机台宽度（反比例）
 * 
 * 例如：12米机台，宽度系数 = 8.5/12 = 0.708
 * 
 * @param machineWidth - 机台宽度（米）
 * @returns 宽度系数
 */
export const calculateWidthCoefficient = (machineWidth: number): number => {
    if (machineWidth <= 0) return 0;
    return BASE_MACHINE_WIDTH / machineWidth;
};

/**
 * 获取速度系数
 * H2 (41纬/分钟) 为基准1，H5系数为0.56
 * 
 * @param speedType - 速度类型
 * @returns 速度系数
 */
export const getSpeedCoefficient = (speedType: 'H2' | 'H5'): number => {
    return SPEED_COEFFICIENTS[speedType] || 1.0;
};

/**
 * 计算单台机台的等效产量
 * 公式：等效产量 = 实际产量 × 产量系数 × 宽度系数 × 速度系数
 * 
 * @param data - 机台产量数据
 * @returns 等效产量计算结果
 */
export const calculateMachineEquivalent = (data: MachineProductionData): MachineEquivalentResult => {
    const outputCoef = calculateOutputCoefficient(data.weftDensity);
    const widthCoef = calculateWidthCoefficient(data.machineWidth);
    const speedCoef = getSpeedCoefficient(data.speedType);
    
    const equivalentOutput = data.actualOutput * outputCoef * widthCoef * speedCoef;
    
    return {
        machineId: data.machineId,
        actualOutput: data.actualOutput,
        outputCoef,
        widthCoef,
        speedCoef,
        equivalentOutput
    };
};

/**
 * 计算所有机台的总等效产量
 * 
 * @param machineData - 所有机台的产量数据数组
 * @returns 总等效产量和各机台明细
 */
export const calculateTotalEquivalent = (machineData: MachineProductionData[]): {
    totalEquivalent: number;
    machineResults: MachineEquivalentResult[];
} => {
    const machineResults = machineData.map(calculateMachineEquivalent);
    const totalEquivalent = machineResults.reduce((sum, r) => sum + r.equivalentOutput, 0);
    
    return {
        totalEquivalent,
        machineResults
    };
};

// ========================================
// 织造工段积分计算核心函数
// ========================================

/**
 * 计算成网率质量奖励系数
 * 
 * 公式：奖励系数 = (当月成网率-68%)×100÷30 
 *       × 当月等效产量÷(单机目标等效产量×有效机台数) 
 *       ÷ 操作工实际人数 × 操作工定员
 * 
 * @param monthlyData - 月度数据
 * @param config - 配置参数
 * @returns 奖励系数
 */
export const calculateQualityBonusCoef = (
    monthlyData: WeavingMonthlyData,
    config: WeavingConfig
): number => {
    const {
        netFormationRate,      // 当月成网率
        equivalentOutput,      // 当月等效产量
        activeMachines,        // 有效机台数
        actualOperators        // 实际操作工人数
    } = monthlyData;
    
    const {
        netFormationBenchmark, // 成网率基准 68%
        targetEquivalentOutput, // 单机目标等效产量 6450
        operatorQuota          // 操作工定员 24
    } = config;
    
    // 成网率超标部分
    const netFormationExcess = (netFormationRate - netFormationBenchmark) / 100;
    
    // 如果成网率未达标，系数为0
    if (netFormationExcess <= 0) return 0;
    
    // 目标总等效产量
    const targetTotalOutput = targetEquivalentOutput * activeMachines;
    if (targetTotalOutput <= 0 || actualOperators <= 0) return 0;
    
    // 产量完成率
    const outputRate = equivalentOutput / targetTotalOutput;
    
    // 人员效率系数
    const staffEfficiency = operatorQuota / actualOperators;
    
    // 奖励系数 = (成网率超标×100÷30) × 产量完成率 × 人员效率
    const bonusCoef = (netFormationExcess * 100 / 30) * outputRate * staffEfficiency;
    
    return bonusCoef;
};

/**
 * 计算织机运转率奖
 * 
 * 公式：运转率奖 = (当月运转率 - 72%) × 100 × 500
 * 以72%为基准，每超1个百分点奖500元
 * 
 * @param operationRate - 当月运转率（百分比，如75表示75%）
 * @param benchmark - 运转率基准（默认72）
 * @param bonusPerPercent - 每超1%的奖金（默认500）
 * @returns 运转率奖金总额
 */
export const calculateOperationBonus = (
    operationRate: number,
    benchmark: number = 72,
    bonusPerPercent: number = 500
): number => {
    const excess = operationRate - benchmark;
    if (excess <= 0) return 0;
    return excess * bonusPerPercent;
};

/**
 * 织造工段积分计算主函数
 * 
 * 计算流程：
 * 1. 计算成网率质量奖
 * 2. 计算织机运转率奖
 * 3. 计算管理员班总奖金池
 * 4. 按系数进行二次分配
 * 5. 计算最终应发积分（基本工资+奖金）
 * 
 * @param monthlyData - 月度生产数据
 * @param config - 配置参数（可选，默认使用DEFAULT_WEAVING_CONFIG）
 * @returns 完整的计算结果
 */
export const calculateWeavingBonus = (
    monthlyData: WeavingMonthlyData,
    config: WeavingConfig = DEFAULT_WEAVING_CONFIG
): WeavingCalculationResult => {
    // ========== 1. 计算成网率质量奖 ==========
    const qualityBonusCoef = calculateQualityBonusCoef(monthlyData, config);
    const qualityBonusTotal = qualityBonusCoef * config.avgTargetBonus * config.adminTeamSize;
    
    // ========== 2. 计算织机运转率奖 ==========
    const operationBonusTotal = calculateOperationBonus(
        monthlyData.operationRate,
        config.operationRateBenchmark,
        config.operationRateBonusUnit
    );
    
    // ========== 3. 计算管理员班总奖金池 ==========
    const totalBonusPool = qualityBonusTotal + operationBonusTotal;
    
    // ========== 4. 二次分配 ==========
    // 总系数 = 班长系数(1.3) + 班员系数(1.0) × 班员人数(2) = 3.3
    const memberCount = config.adminTeamSize - 1; // 班员人数 = 总人数 - 1个班长
    const totalCoef = config.leaderCoef + (config.memberCoef * memberCount);
    
    // 班长奖金 = 总奖金 ÷ 总系数 × 班长系数
    const leaderBonus = totalBonusPool / totalCoef * config.leaderCoef;
    
    // 班员奖金 = 总奖金 ÷ 总系数 × 班员系数
    const memberBonus = totalBonusPool / totalCoef * config.memberCoef;
    
    // ========== 5. 计算最终应发积分 ==========
    // 按出勤比例计算基本工资
    const attendanceRate = monthlyData.attendanceDays / 26; // 假设满勤26天
    const leaderBasePay = config.leaderBaseSalary * Math.min(attendanceRate, 1);
    const memberBasePay = config.memberBaseSalary * Math.min(attendanceRate, 1);
    
    // 应发总积分 = 基本工资 + 奖金
    const leaderTotalWage = leaderBasePay + leaderBonus;
    const memberTotalWage = memberBasePay + memberBonus;
    
    return {
        // 奖金池计算结果
        qualityBonusCoef,
        qualityBonusTotal,
        operationBonusTotal,
        totalBonusPool,
        
        // 分配结果
        totalCoef,
        leaderBonus,
        memberBonus,
        
        // 应发积分
        leaderTotalWage,
        memberTotalWage
    };
};

// ========================================
// 目标等效产量计算辅助函数
// ========================================

/**
 * 计算单机100%效率下的日等效产能
 * 
 * 公式（基于H2机型，8.5米宽度）：
 * 日产能 = 41(纬/分钟) ÷ 13(基准纬密) × 60 × 24 ÷ 100 × 7.7(有效宽度) ≈ 358㎡
 * 
 * @param speedWeftPerMin - 每分钟纬数（H2=41, H5≈23）
 * @param effectiveWidth - 有效幅宽（米）
 * @param baseWeftDensity - 基准纬密
 * @returns 日等效产能（平方米）
 */
export const calculateDailyCapacity = (
    speedWeftPerMin: number = 41,
    effectiveWidth: number = 7.7,
    baseWeftDensity: number = BASE_WEFT_DENSITY
): number => {
    // 每分钟产出面积 = (纬数/纬密) × 有效宽度 ÷ 100（厘米转米）
    // 日产能 = 每分钟产出 × 60分钟 × 24小时
    return (speedWeftPerMin / baseWeftDensity) * 60 * 24 / 100 * effectiveWidth;
};

/**
 * 计算单机月目标等效产量
 * 
 * 公式：
 * 1. 日产能（100%效率）≈ 358㎡
 * 2. 日产能（72%效率）= 358 × 0.72 ≈ 258㎡
 * 3. 月产能（扣除穿线时间5天）= 258 × 25 = 6450㎡
 * 
 * @param dailyCapacity100 - 100%效率下的日产能
 * @param targetEfficiency - 目标效率（如0.72）
 * @param workingDays - 实际工作天数（扣除穿线等时间）
 * @returns 月目标等效产量
 */
export const calculateMonthlyTarget = (
    dailyCapacity100: number = 358,
    targetEfficiency: number = 0.72,
    workingDays: number = 25
): number => {
    return dailyCapacity100 * targetEfficiency * workingDays;
};

// ========================================
// 导出默认值供外部使用
// ========================================

export {
    BASE_WEFT_DENSITY,
    BASE_MACHINE_WIDTH,
    SPEED_COEFFICIENTS
};
