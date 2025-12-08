/**
 * ========================================
 * 织造工段 - 奖金核算页面
 * ========================================
 * 
 * 成网率奖 + 运转率奖 → 二次分配
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculator,
  DollarSign,
  Users,
  Loader2,
  Info,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

// ========================================
// 类型定义
// ========================================

interface WeavingConfig {
  netFormationBenchmark: number;
  operationRateBenchmark: number;
  targetEquivalentOutput: number;
  operatorQuota: number;
  avgTargetBonus: number;
  adminTeamSize: number;
  operationRateBonusUnit: number;
  leaderCoef: number;
  memberCoef: number;
  leaderBaseSalary: number;
  memberBaseSalary: number;
}

interface MonthlySummary {
  totalEquivalent: number;
  totalArea: number;
  totalNets: number;
  qualifiedNets: number;
  netFormationRate: number;
  operationRate: number;
  activeMachines: number;
  actualOperators: number;
}

interface BonusResult {
  qualityBonusCoef: number;
  qualityBonusTotal: number;
  operationBonusTotal: number;
  totalBonusPool: number;
  totalCoef: number;
  leaderBonus: number;
  memberBonus: number;
  leaderTotalWage: number;
  memberTotalWage: number;
}

interface Employee {
  id: string;
  name: string;
  position: string;
  baseSalary: number;
  coefficient: number;
}

// ========================================
// API 函数
// ========================================

const API_BASE = '/api/weaving';

async function fetchConfig(): Promise<WeavingConfig> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error('获取配置失败');
  return res.json();
}

async function fetchMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
  // 从生产记录计算汇总数据
  const res = await fetch(`${API_BASE}/production-records?year=${year}&month=${month}`);
  if (!res.ok) throw new Error('获取生产记录失败');
  const records = await res.json();

  // 计算汇总
  const totalNets = records.length;
  const qualifiedNets = records.filter((r: any) => r.isQualified).length;
  const totalArea = records.reduce((sum: number, r: any) => sum + (r.actualArea || 0), 0);
  const totalEquivalent = records.reduce((sum: number, r: any) => sum + (r.equivalentOutput || 0), 0);
  const netFormationRate = totalNets > 0 ? (qualifiedNets / totalNets) * 100 : 0;

  // 获取机台状态
  const machinesRes = await fetch(`${API_BASE}/machines`);
  const machines = machinesRes.ok ? await machinesRes.json() : [];
  const activeMachines = machines.filter((m: any) => m.status === 'running').length;

  // 获取员工数
  const employeesRes = await fetch(`${API_BASE}/employees`);
  const employees = employeesRes.ok ? await employeesRes.json() : [];
  const actualOperators = employees.filter((e: any) => e.position === 'operator' && e.status === 'active').length;

  return {
    totalEquivalent,
    totalArea,
    totalNets,
    qualifiedNets,
    netFormationRate,
    operationRate: 78, // 运转率需要额外计算或手动输入
    activeMachines,
    actualOperators: actualOperators || 17
  };
}

async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch(`${API_BASE}/employees`);
  if (!res.ok) throw new Error('获取员工失败');
  return res.json();
}

// ========================================
// 计算函数
// ========================================

function calculateBonus(summary: MonthlySummary, config: WeavingConfig): BonusResult {
  // 成网率质量奖系数
  const netFormationExcess = (summary.netFormationRate - config.netFormationBenchmark) / 100;
  const targetTotalOutput = config.targetEquivalentOutput * summary.activeMachines;
  const outputRate = targetTotalOutput > 0 ? summary.totalEquivalent / targetTotalOutput : 0;
  const actualOperators = summary.actualOperators || config.operatorQuota;
  const staffEfficiency = config.operatorQuota / actualOperators;

  const qualityBonusCoef = netFormationExcess > 0
    ? (netFormationExcess * 100 / 30) * outputRate * staffEfficiency
    : 0;
  const qualityBonusTotal = qualityBonusCoef * config.avgTargetBonus * config.adminTeamSize;

  // 运转率奖
  const operationExcess = summary.operationRate - config.operationRateBenchmark;
  const operationBonusTotal = operationExcess > 0 ? operationExcess * config.operationRateBonusUnit : 0;

  // 总奖金池
  const totalBonusPool = qualityBonusTotal + operationBonusTotal;

  // 二次分配
  const memberCount = config.adminTeamSize - 1;
  const totalCoef = config.leaderCoef + (config.memberCoef * memberCount);
  const leaderBonus = totalBonusPool / totalCoef * config.leaderCoef;
  const memberBonus = totalBonusPool / totalCoef * config.memberCoef;

  // 应发工资（基本工资 + 奖金）
  const leaderTotalWage = config.leaderBaseSalary + leaderBonus;
  const memberTotalWage = config.memberBaseSalary + memberBonus;

  return {
    qualityBonusCoef,
    qualityBonusTotal,
    operationBonusTotal,
    totalBonusPool,
    totalCoef,
    leaderBonus,
    memberBonus,
    leaderTotalWage,
    memberTotalWage
  };
}

// ========================================
// 主组件
// ========================================

export const BonusCalculation: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [config, setConfig] = useState<WeavingConfig | null>(null);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  // 手动输入（用于 API 未返回时）
  const [manualInput, setManualInput] = useState({
    netFormationRate: 72,
    operationRate: 78,
    totalEquivalent: 65000,
    totalArea: 0,
    totalNets: 0,
    qualifiedNets: 0,
    activeMachines: 10,
    actualOperators: 17
  });

  // 加载数据函数
  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const [configData, summaryData, employeesData] = await Promise.all([
        fetchConfig(),
        fetchMonthlySummary(year, month),
        fetchEmployees()
      ]);

      setConfig(configData);
      setSummary(summaryData);
      setEmployees(employeesData);

      if (summaryData) {
        setManualInput(prev => ({
          ...prev,
          netFormationRate: summaryData.netFormationRate || prev.netFormationRate,
          operationRate: summaryData.operationRate || prev.operationRate,
          totalEquivalent: summaryData.totalEquivalent || prev.totalEquivalent,
          totalArea: summaryData.totalArea || 0,
          totalNets: summaryData.totalNets || 0,
          qualifiedNets: summaryData.qualifiedNets || 0,
          activeMachines: summaryData.activeMachines || prev.activeMachines,
          actualOperators: summaryData.actualOperators || prev.actualOperators
        }));
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      // 使用默认配置
      if (!config) {
        setConfig({
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
          memberBaseSalary: 2500
        });
      }
      if (employees.length === 0) {
        setEmployees([
          { id: 'w1', name: '耿志友', position: 'admin_leader', baseSalary: 3500, coefficient: 1.3 },
          { id: 'w2', name: '赵红林', position: 'admin_member', baseSalary: 2500, coefficient: 1.0 },
          { id: 'w3', name: '夏旺潮', position: 'admin_member', baseSalary: 2500, coefficient: 1.0 }
        ]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [year, month]);

  // 初始加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 刷新数据
  const handleRefresh = () => {
    loadData(true);
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // 计算结果
  const result = calculateBonus({
    totalEquivalent: manualInput.totalEquivalent,
    totalArea: manualInput.totalArea,
    totalNets: manualInput.totalNets,
    qualifiedNets: manualInput.qualifiedNets,
    netFormationRate: manualInput.netFormationRate,
    operationRate: manualInput.operationRate,
    activeMachines: manualInput.activeMachines,
    actualOperators: manualInput.actualOperators
  }, config);

  // 管理员班人员
  const adminEmployees = employees.filter(e => e.position.startsWith('admin'));

  // 确认本月核算
  const handleConfirm = async () => {
    if (!confirm(`确认保存 ${year}年${month}月 的核算结果？\n\n总奖金池：¥${result.totalBonusPool.toFixed(0)}`)) {
      return;
    }

    setConfirming(true);
    try {
      // 保存月度核算数据
      const response = await fetch(`${API_BASE}/monthly-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          month,
          totalArea: manualInput.totalArea,
          equivalentOutput: manualInput.totalEquivalent,
          totalNets: manualInput.totalNets,
          qualifiedNets: manualInput.qualifiedNets,
          totalBonus: result.totalBonusPool,
          perSqmBonus: manualInput.totalArea > 0 ? result.totalBonusPool / manualInput.totalArea : 0,
          adminTeamBonus: result.totalBonusPool,
          isConfirmed: true,
          calculationSnapshot: {
            netFormationRate: manualInput.netFormationRate,
            operationRate: manualInput.operationRate,
            activeMachines: manualInput.activeMachines,
            actualOperators: manualInput.actualOperators,
            qualityBonusCoef: result.qualityBonusCoef,
            qualityBonusTotal: result.qualityBonusTotal,
            operationBonusTotal: result.operationBonusTotal,
            totalBonusPool: result.totalBonusPool,
            leaderBonus: result.leaderBonus,
            memberBonus: result.memberBonus,
            leaderTotalWage: result.leaderTotalWage,
            memberTotalWage: result.memberTotalWage
          }
        })
      });

      if (!response.ok) throw new Error('保存失败');

      alert(`${year}年${month}月核算结果已保存！`);
    } catch (err) {
      alert('保存失败，请重试');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">奖金核算</h1>
          <p className="text-sm text-slate-500 mt-1">管理员班奖金计算与分配</p>
        </div>

        {/* 月份选择器 */}
        <div className="flex items-center gap-2">
          <label htmlFor="bonus-year" className="sr-only">年份</label>
          <select
            id="bonus-year"
            name="bonus-year"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            aria-label="选择年份"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <label htmlFor="bonus-month" className="sr-only">月份</label>
          <select
            id="bonus-month"
            name="bonus-month"
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            aria-label="选择月份"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="刷新数据（从生产记录同步）"
            aria-label="刷新数据"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 输入参数 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-500" />
            本月数据
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">成网率 (%)</label>
              <input
                type="number"
                value={manualInput.netFormationRate}
                onChange={e => setManualInput(prev => ({ ...prev, netFormationRate: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">运转率 (%)</label>
              <input
                type="number"
                value={manualInput.operationRate}
                onChange={e => setManualInput(prev => ({ ...prev, operationRate: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">等效产量 (㎡)</label>
              <input
                type="number"
                value={manualInput.totalEquivalent}
                onChange={e => setManualInput(prev => ({ ...prev, totalEquivalent: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">有效机台</label>
                <input
                  type="number"
                  value={manualInput.activeMachines}
                  onChange={e => setManualInput(prev => ({ ...prev, activeMachines: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">操作工人数</label>
                <input
                  type="number"
                  value={manualInput.actualOperators}
                  onChange={e => setManualInput(prev => ({ ...prev, actualOperators: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
          {/* 生产数据提示 */}
          {manualInput.totalNets > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-600">
              <div className="flex items-center gap-1 mb-1">
                <Info className="w-3 h-3" />
                <span className="font-medium">本月生产统计</span>
              </div>
              <div>总网数: {manualInput.totalNets} | 合格: {manualInput.qualifiedNets} | 面积: {manualInput.totalArea.toFixed(0)}㎡</div>
            </div>
          )}
        </div>

        {/* 奖金计算 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            奖金计算
          </h2>
          <div className="space-y-4">
            {/* 成网率质量奖 */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-emerald-700">成网率质量奖</span>
                <span className="text-lg font-bold text-emerald-700">
                  ¥{result.qualityBonusTotal.toFixed(0)}
                </span>
              </div>
              <div className="text-xs text-emerald-600">
                奖励系数: {result.qualityBonusCoef.toFixed(3)}
              </div>
            </div>

            {/* 运转率奖 */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-amber-700">运转率奖</span>
                <span className="text-lg font-bold text-amber-700">
                  ¥{result.operationBonusTotal.toFixed(0)}
                </span>
              </div>
              <div className="text-xs text-amber-600">
                超标 {(manualInput.operationRate - config.operationRateBenchmark).toFixed(1)}% × {config.operationRateBonusUnit}元
              </div>
            </div>

            {/* 总奖金池 */}
            <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium opacity-90">总奖金池</span>
                <span className="text-2xl font-bold">
                  ¥{result.totalBonusPool.toFixed(0)}
                </span>
              </div>
            </div>

            {/* 提示 */}
            <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                成网率基准 {config.netFormationBenchmark}%，运转率基准 {config.operationRateBenchmark}%
              </span>
            </div>
          </div>
        </div>

        {/* 人员分配 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            二次分配
          </h2>
          <div className="space-y-4">
            <div className="text-sm text-slate-600 mb-4">
              总系数: {result.totalCoef.toFixed(1)} (班长{config.leaderCoef} + 班员{config.memberCoef}×{config.adminTeamSize - 1})
            </div>

            {/* 分配结果 */}
            {adminEmployees.length > 0 ? (
              adminEmployees.map(emp => {
                const isLeader = emp.position === 'admin_leader';
                const bonus = isLeader ? result.leaderBonus : result.memberBonus;
                const basePay = emp.baseSalary;
                const totalWage = basePay + bonus;

                return (
                  <div key={emp.id} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{emp.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isLeader ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                          {isLeader ? '班长' : '班员'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">系数 {emp.coefficient}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-slate-500">基本工资</div>
                        <div className="font-mono text-slate-700">¥{basePay.toFixed(0)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">奖金</div>
                        <div className="font-mono text-emerald-600">+{bonus.toFixed(0)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">应发</div>
                        <div className="font-mono font-bold text-blue-600">¥{totalWage.toFixed(0)}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-purple-800">班长</span>
                    <span className="text-xl font-bold text-purple-700">¥{result.leaderTotalWage.toFixed(0)}</span>
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    基本 {config.leaderBaseSalary} + 奖金 {result.leaderBonus.toFixed(0)}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-800">班员 (每人)</span>
                    <span className="text-xl font-bold text-slate-700">¥{result.memberTotalWage.toFixed(0)}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    基本 {config.memberBaseSalary} + 奖金 {result.memberBonus.toFixed(0)}
                  </div>
                </div>
              </>
            )}

            {/* 确认按钮 */}
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  确认本月核算
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BonusCalculation;
