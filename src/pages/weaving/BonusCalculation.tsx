/**
 * ========================================
 * 织造工段 - 奖金核算页面
 * ========================================
 * 
 * 成网率奖 + 运转率奖 → 二次分配
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  Users,
  Loader2,
  Info,
  CheckCircle,
  RefreshCw,
  Settings,
  X,
  Save
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
  // 模拟从 API 获取，如果失败则返回默认值
  try {
    const res = await fetch(`${API_BASE}/config`);
    if (!res.ok) throw new Error('获取配置失败');
    return res.json();
  } catch (e) {
    // Return default if API fails
    return {
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
    };
  }
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

interface CalculationParams {
  totalEquivalent: number;
  totalArea: number;
  totalNets: number;
  qualifiedNets: number;
  netFormationRate: number;
  operationRate: number;
  activeMachines: number;
  actualOperators: number;
  targetOutput?: number; // Optional manual target
}

function calculateBonus(summary: CalculationParams, config: WeavingConfig): BonusResult {
  // 成网率质量奖系数
  const netFormationExcess = (summary.netFormationRate - config.netFormationBenchmark) / 100;

  // Use manual target output if provided, otherwise calculate
  const targetTotalOutput = summary.targetOutput && summary.targetOutput > 0
    ? summary.targetOutput
    : config.targetEquivalentOutput * summary.activeMachines;

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
// Config Modal Component
// ========================================

const ConfigModal = ({
  config,
  onSave,
  onClose
}: {
  config: WeavingConfig,
  onSave: (c: WeavingConfig) => void,
  onClose: () => void
}) => {
  const [formData, setFormData] = useState<WeavingConfig>(config);

  const handleChange = (field: keyof WeavingConfig, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="text-blue-500" />
            计算参数配置
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

            {/* Benchmarks */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-l-4 border-blue-500 pl-2">考核基准</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">成网率基准 (%)</label>
                  <input type="number" step="0.1" value={formData.netFormationBenchmark} onChange={e => handleChange('netFormationBenchmark', e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">运转率基准 (%)</label>
                  <input type="number" step="0.1" value={formData.operationRateBenchmark} onChange={e => handleChange('operationRateBenchmark', e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">单机目标产量 (㎡)</label>
                  <input type="number" step="1" value={formData.targetEquivalentOutput} onChange={e => handleChange('targetEquivalentOutput', e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">运转率奖金单价 (元/%)</label>
                  <input type="number" step="10" value={formData.operationRateBonusUnit} onChange={e => handleChange('operationRateBonusUnit', e.target.value)} className="input w-full" />
                </div>
              </div>
            </div>

            {/* Staffing */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-l-4 border-purple-500 pl-2">定员配置</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">操作工定员 (人)</label>
                  <input type="number" value={formData.operatorQuota} onChange={e => handleChange('operatorQuota', e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">管理员班人数 (人)</label>
                  <input type="number" value={formData.adminTeamSize} onChange={e => handleChange('adminTeamSize', e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">人均目标奖金 (元)</label>
                  <input type="number" step="100" value={formData.avgTargetBonus} onChange={e => handleChange('avgTargetBonus', e.target.value)} className="input w-full" />
                </div>
              </div>
            </div>

            {/* Coefficients */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-l-4 border-emerald-500 pl-2">分配系数与底薪</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">班长系数</label>
                  <input type="number" step="0.1" value={formData.leaderCoef} onChange={e => handleChange('leaderCoef', e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">班员系数</label>
                  <input type="number" step="0.1" value={formData.memberCoef} onChange={e => handleChange('memberCoef', e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">班长底薪 (元)</label>
                  <input type="number" step="100" value={formData.leaderBaseSalary} onChange={e => handleChange('leaderBaseSalary', e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">班员底薪 (元)</label>
                  <input type="number" step="100" value={formData.memberBaseSalary} onChange={e => handleChange('memberBaseSalary', e.target.value)} className="input w-full" />
                </div>
              </div>
            </div>

          </div>
          <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-white transition-colors">
              取消
            </button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
              <Save size={18} />
              保存配置
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ========================================
// 主组件
// ========================================

export const BonusCalculation: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [config, setConfig] = useState<WeavingConfig | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // UI State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // 手动输入（用于 API 未返回时）
  const [manualInput, setManualInput] = useState({
    netFormationRate: 72,
    operationRate: 78,
    totalEquivalent: 65000,
    totalArea: 0,
    totalNets: 0,
    qualifiedNets: 0,
    activeMachines: 10,
    actualOperators: 17,
    targetOutput: 0 // New field
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
      setEmployees(employeesData);

      // 关键修复：先重置为零，再用实际数据覆盖
      // 解决切换月份时旧数据残留问题
      if (summaryData && summaryData.totalNets > 0) {
        // 有生产记录，使用实际数据
        setManualInput({
          netFormationRate: summaryData.netFormationRate || 0,
          operationRate: summaryData.operationRate || 78,
          totalEquivalent: summaryData.totalEquivalent || 0,
          totalArea: summaryData.totalArea || 0,
          totalNets: summaryData.totalNets || 0,
          qualifiedNets: summaryData.qualifiedNets || 0,
          activeMachines: summaryData.activeMachines || 0,
          actualOperators: summaryData.actualOperators || 0,
          targetOutput: 0
        });
      } else {
        // 无生产记录，重置为零
        setManualInput({
          netFormationRate: 0,
          operationRate: 0,
          totalEquivalent: 0,
          totalArea: 0,
          totalNets: 0,
          qualifiedNets: 0,
          activeMachines: 0,
          actualOperators: 0,
          targetOutput: 0
        });
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

  const handleUpdateConfig = async (newConfig: WeavingConfig) => {
    try {
      // 保存配置到后端
      const response = await fetch(`${API_BASE}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });

      if (!response.ok) {
        throw new Error('保存配置失败');
      }

      setConfig(newConfig);
      setIsConfigModalOpen(false);
      alert('配置已保存');
    } catch (err) {
      console.error('保存配置失败:', err);
      alert('保存配置失败，请重试');
    }
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
    actualOperators: manualInput.actualOperators,
    targetOutput: manualInput.targetOutput
  }, config);

  // 管理员班人员
  const adminEmployees = employees.filter(e => e.position.startsWith('admin'));

  // 计算自动目标产量（用于 placeholder）
  const autoTargetOutput = config.targetEquivalentOutput * manualInput.activeMachines;

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
          // Add manually overridden fields
          targetOutput: manualInput.targetOutput,
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
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            奖金核算
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors" title="配置计算参数"
            >
              <Settings size={18} />
            </button>
          </h1>
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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">运转率 (%)</label>
              <input
                type="number"
                value={manualInput.operationRate}
                onChange={e => setManualInput(prev => ({ ...prev, operationRate: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">等效产量 (㎡)</label>
              <input
                type="number"
                value={manualInput.totalEquivalent}
                onChange={e => setManualInput(prev => ({ ...prev, totalEquivalent: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              />
            </div>

            {/* New Target Output Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                目标产量 (㎡)
                <span className="text-xs font-normal text-slate-400">自动: {autoTargetOutput.toFixed(0)}</span>
              </label>
              <input
                type="number"
                placeholder={`默认: ${autoTargetOutput.toFixed(0)}`}
                value={manualInput.targetOutput || ''}
                onChange={e => setManualInput(prev => ({ ...prev, targetOutput: parseFloat(e.target.value) || 0 }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow ${manualInput.targetOutput ? 'border-blue-300 bg-blue-50 text-blue-700 font-semibold' : 'border-slate-200'}`}
              />
              <p className="text-xs text-slate-400 mt-1">留空则使用自动计算值 (单机目标×机台数)</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">有效机台</label>
                <input
                  type="number"
                  value={manualInput.activeMachines}
                  onChange={e => setManualInput(prev => ({ ...prev, activeMachines: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">操作工人数</label>
                <input
                  type="number"
                  value={manualInput.actualOperators}
                  onChange={e => setManualInput(prev => ({ ...prev, actualOperators: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                />
              </div>
            </div>
          </div>
          {/* 生产数据提示 */}
          {manualInput.totalNets > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-600 border border-blue-100">
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
              <div className="text-xs text-emerald-600 flex justify-between">
                <span>系数: {result.qualityBonusCoef.toFixed(3)}</span>
                <span title="实际产量/目标产量">达成率: {manualInput.totalEquivalent > 0 ? ((manualInput.totalEquivalent / (manualInput.targetOutput || autoTargetOutput)) * 100).toFixed(1) : 0}%</span>
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
            <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium opacity-90">总奖金池</span>
                <span className="text-2xl font-bold">
                  ¥{result.totalBonusPool.toFixed(0)}
                </span>
              </div>
            </div>

            {/* 提示 */}
            <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                成网率基准 {config.netFormationBenchmark}%，运转率基准 {config.operationRateBenchmark}%
              </span>
            </div>
          </div>
        </div>

        {/* 人员分配 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            二次分配
          </h2>
          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
            <div className="text-sm text-slate-600 mb-2 bg-slate-50 p-2 rounded-lg text-center">
              总系数: <span className="font-bold">{result.totalCoef.toFixed(1)}</span> (班长{config.leaderCoef} + 班员{config.memberCoef}×{config.adminTeamSize - 1})
            </div>

            {/* 分配结果 */}
            {adminEmployees.length > 0 ? (
              adminEmployees.map(emp => {
                const isLeader = emp.position === 'admin_leader';
                const bonus = isLeader ? result.leaderBonus : result.memberBonus;
                const basePay = emp.baseSalary;
                const totalWage = basePay + bonus;

                return (
                  <div key={emp.id} className="p-4 bg-white border border-slate-100 rounded-xl hover:shadow-sm hover:border-blue-200 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{emp.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isLeader ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                          }`}>
                          {isLeader ? '班长' : '班员'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">系数 {emp.coefficient}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400 mb-1">基本工资</div>
                        <div className="font-medium text-slate-600">¥{basePay.toFixed(0)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 mb-1">奖金</div>
                        <div className="font-bold text-emerald-600">+{bonus.toFixed(0)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 mb-1">应发</div>
                        <div className="font-bold text-blue-600">¥{totalWage.toFixed(0)}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-400">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p>暂无管理员班成员</p>
              </div>
            )}

          </div>

          {/* 确认按钮 */}
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full mt-4 py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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

      {isConfigModalOpen && config && (
        <ConfigModal
          config={config}
          onClose={() => setIsConfigModalOpen(false)}
          onSave={handleUpdateConfig}
        />
      )}
    </div>
  );
};

export default BonusCalculation;
