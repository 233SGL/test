/**
 * ========================================
 * 鹤山积分管理系统 - 积分计算服务
 * ========================================
 * 
 * 本模块提供定型工段的积分计算核心算法
 * 
 * 计算公式说明：
 * 1. 总积分池 = (面积 × 单价) + 考勤包 + KPI分
 * 2. 实发基础分 = 标准基础分 × 出勤率
 * 3. 奖金池 = 总积分池 - 实发基础分总和
 * 4. 个人奖金 = 奖金池 × 复合权重
 * 5. 复合权重 = (工时占比 × 工时权重) + (基础分占比 × 基础分权重)
 * 
 * @module services/calcService
 */

import { MonthlyData, CalculationResult } from '../types';

/**
 * 计算指定月份的工作日数量
 * 工作日定义：除周日外的所有天数（周一至周六）
 * 
 * @param year - 年份
 * @param month - 月份（1-12）
 * @returns 工作日数量
 */
export const getWorkingDays = (year: number, month: number): number => {
  // 获取该月总天数
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    // dayOfWeek: 0=周日, 1-6=周一至周六
    // 只要不是周日就算工作日
    if (dayOfWeek !== 0) {
      workingDays++;
    }
  }
  return workingDays;
};

/**
 * 积分计算核心函数
 * 根据月度数据和员工列表计算每个员工的最终积分
 * 
 * @param data - 月度数据（包含参数和员工记录）
 * @param employees - 员工列表（用于过滤已离职员工）
 * @returns 计算结果（包含每个员工的详细计算数据）
 */
export const calculateSalary = (data: MonthlyData, employees: any[]): CalculationResult => {
  // 解构计算参数
  const { area, unitPrice, attendancePack, kpiScore, weightTime, weightBase } = data.params;

  // ========================================
  // 第一步：计算总积分池
  // 公式：总积分池 = (产量面积 × 单价) + 考勤包 + KPI分
  // ========================================
  const totalPool = (area * unitPrice) + attendancePack + kpiScore;

  // 用于累计的中间变量
  let sumWorkHours = 0;      // 总工时
  let sumExpectedHours = 0;  // 总预期工时
  let sumStandardBase = 0;   // 总标准基础分
  let sumRealBase = 0;       // 总实发基础分

  // ========================================
  // 第二步：计算每个员工的实发基础分
  // 公式：实发基础分 = 标准基础分 × (实际工时 / 预期工时)
  // 同时过滤掉已离职员工
  // ========================================
  const preCalcRecords = data.records
    .filter(record => {
      // Filter out terminated employees by checking their actual status in the employees list
      const employee = employees.find(e => e.id === record.employeeId);
      return employee && employee.status !== 'terminated';
    })
    .map(record => {
      const { workHours, expectedHours, baseScoreSnapshot } = record;

      // 防止除零错误
      const attendanceRatio = expectedHours > 0 ? workHours / expectedHours : 0;
      // 实发基础分 = 标准基础分 × 出勤率
      const realBase = baseScoreSnapshot * attendanceRatio;

      // 累加统计数据
      sumWorkHours += workHours;
      sumExpectedHours += expectedHours;
      sumStandardBase += baseScoreSnapshot;
      sumRealBase += realBase;

      return {
        ...record,
        realBase,
      };
    });

  // ========================================
  // 第三步：计算奖金池
  // 公式：奖金池 = 总积分池 - 实发基础分总和
  // 奖金池不能为负，最小为0
  // ========================================
  const bonusPool = Math.max(0, totalPool - sumRealBase);

  // ========================================
  // 第四步：计算复合权重并分配奖金
  // 复合权重 = (工时占比 × 工时权重%) + (基础分占比 × 基础分权重%)
  // 个人奖金 = 奖金池 × 复合权重
  // ========================================
  
  // 将权重百分比转换为小数
  const wTime = weightTime / 100;
  const wBase = weightBase / 100;

  const finalRecords = preCalcRecords.map(record => {
    // 工时占比 = 个人工时 / 总工时
    const workRatio = sumWorkHours > 0 ? record.workHours / sumWorkHours : 0;

    // 基础分占比 = 个人实发基础分 / 总实发基础分
    const baseRatio = sumRealBase > 0 ? record.realBase / sumRealBase : 0;

    // 复合权重 = 工时占比×工时权重 + 基础分占比×基础分权重
    const compositeWeight = (workRatio * wTime) + (baseRatio * wBase);

    // 个人奖金 = 奖金池 × 复合权重
    const bonus = bonusPool * compositeWeight;

    // 最终积分 = 实发基础分 + 奖金
    const finalScore = record.realBase + bonus;

    return {
      ...record,
      workRatio,
      baseRatio,
      compositeWeight,
      bonus,
      finalScore
    };
  });

  // 返回计算结果
  return {
    records: finalRecords,        // 员工详细计算结果
    totalPool,                    // 总积分池
    totalBasePayout: sumRealBase, // 实发基础分总和
    bonusPool,                    // 奖金池
    sumWorkHours,                 // 总工时
    sumExpectedHours,             // 总预期工时
    sumStandardBase               // 总标准基础分
  };
};
