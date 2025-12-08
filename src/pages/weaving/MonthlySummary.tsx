/**
 * ========================================
 * 织造工段 - 月度汇总页面
 * ========================================
 * 
 * 简洁的月度 KPI 概览
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  CheckCircle,
  Loader2,
  BarChart3,
  RefreshCw
} from 'lucide-react';

// ========================================
// 类型定义
// ========================================

interface MonthlySummary {
  totalNets: number;
  totalLength: number;
  totalArea: number;
  totalEquivalent: number;
  qualifiedNets: number;
  netFormationRate: number;
  operationRate: number;
  activeMachines: number;
  targetEquivalent: number;
}

interface MachineStats {
  machineId: string;
  machineName: string;
  netCount: number;
  totalLength: number;
  totalArea: number;
  totalEquivalent: number;
}

// ========================================
// API 函数
// ========================================

const API_BASE = '/api/weaving';

async function fetchMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
  // 从生产记录计算汇总数据
  const recordsRes = await fetch(`${API_BASE}/production-records?year=${year}&month=${month}`);
  if (!recordsRes.ok) throw new Error('获取生产记录失败');
  const records = await recordsRes.json();

  // 获取机台数据
  const machinesRes = await fetch(`${API_BASE}/machines`);
  const machines = machinesRes.ok ? await machinesRes.json() : [];
  const activeMachines = machines.filter((m: any) => m.status === 'running').length;

  // 获取配置
  const configRes = await fetch(`${API_BASE}/config`);
  const config = configRes.ok ? await configRes.json() : { targetEquivalentOutput: 6450 };

  // 计算汇总
  const totalNets = records.length;
  const qualifiedNets = records.filter((r: any) => r.isQualified).length;
  const totalLength = records.reduce((sum: number, r: any) => sum + (r.length || 0), 0);
  const totalArea = records.reduce((sum: number, r: any) => sum + (r.actualArea || 0), 0);
  const totalEquivalent = records.reduce((sum: number, r: any) => sum + (r.equivalentOutput || 0), 0);
  const netFormationRate = totalNets > 0 ? (qualifiedNets / totalNets) * 100 : 0;
  const targetEquivalent = (config.targetEquivalentOutput || 6450) * activeMachines;

  return {
    totalNets,
    totalLength,
    totalArea,
    totalEquivalent,
    qualifiedNets,
    netFormationRate,
    operationRate: 0, // 运转率需要额外计算
    activeMachines,
    targetEquivalent
  };
}

async function fetchMachineStats(year: number, month: number): Promise<MachineStats[]> {
  // 从生产记录按机台分组统计
  const recordsRes = await fetch(`${API_BASE}/production-records?year=${year}&month=${month}`);
  if (!recordsRes.ok) return [];
  const records = await recordsRes.json();

  const machinesRes = await fetch(`${API_BASE}/machines`);
  const machines = machinesRes.ok ? await machinesRes.json() : [];

  // 按机台分组
  const statsMap = new Map<string, MachineStats>();

  for (const record of records) {
    const machineId = record.machineId;
    const machine = machines.find((m: any) => m.id === machineId);

    if (!statsMap.has(machineId)) {
      statsMap.set(machineId, {
        machineId,
        machineName: machine?.name || machineId,
        netCount: 0,
        totalLength: 0,
        totalArea: 0,
        totalEquivalent: 0
      });
    }

    const stat = statsMap.get(machineId)!;
    stat.netCount++;
    stat.totalLength += record.length || 0;
    stat.totalArea += record.actualArea || 0;
    stat.totalEquivalent += record.equivalentOutput || 0;
  }

  // 转为数组并排序
  return Array.from(statsMap.values()).sort((a, b) => b.totalEquivalent - a.totalEquivalent);
}

// ========================================
// KPI 卡片组件
// ========================================

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  target?: number;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'amber' | 'purple';
  trend?: 'up' | 'down' | 'neutral';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, unit, target, icon, color, trend }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    purple: 'from-purple-500 to-purple-600'
  };

  const progress = target ? (Number(value) / target) * 100 : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'
            }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
              trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
          </div>
        )}
      </div>
      <div className="text-sm text-slate-500 mb-1">{title}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-slate-800">{value}</span>
        {unit && <span className="text-lg text-slate-500">{unit}</span>}
      </div>
      {progress !== null && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>完成进度</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ========================================
// 主组件
// ========================================

export const MonthlySummary: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [machineStats, setMachineStats] = useState<MachineStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 加载数据函数
  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const [summaryData, statsData] = await Promise.all([
        fetchMonthlySummary(year, month),
        fetchMachineStats(year, month)
      ]);
      setSummary(summaryData);
      setMachineStats(statsData);
    } catch (err) {
      console.error('加载数据失败:', err);
      // 使用默认数据
      setSummary({
        totalNets: 0,
        totalLength: 0,
        totalArea: 0,
        totalEquivalent: 0,
        qualifiedNets: 0,
        netFormationRate: 0,
        operationRate: 0,
        activeMachines: 10,
        targetEquivalent: 64500
      });
      setMachineStats([]);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const s = summary || {
    totalNets: 0,
    totalLength: 0,
    totalArea: 0,
    totalEquivalent: 0,
    qualifiedNets: 0,
    netFormationRate: 0,
    operationRate: 0,
    activeMachines: 10,
    targetEquivalent: 64500
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 页面标题和月份选择 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">月度汇总</h1>
          <p className="text-sm text-slate-500 mt-1">织造工段 KPI 概览</p>
        </div>

        {/* 月份选择器 - 下拉框样式 */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <label htmlFor="summary-year" className="text-sm font-semibold text-slate-600">年份</label>
            <select
              id="summary-year"
              name="summary-year"
              className="border border-slate-200 rounded-lg py-1.5 px-3 text-sm min-w-[90px] focus:ring-2 focus:ring-blue-500 outline-none"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              aria-label="选择年份"
            >
              {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <label htmlFor="summary-month" className="text-sm font-semibold text-slate-600">月份</label>
            <select
              id="summary-month"
              name="summary-month"
              className="border border-slate-200 rounded-lg py-1.5 px-3 text-sm min-w-[80px] focus:ring-2 focus:ring-blue-500 outline-none"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              aria-label="选择月份"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="刷新数据"
            aria-label="刷新数据"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="等效产量"
          value={s.totalEquivalent.toFixed(0)}
          unit="㎡"
          target={s.targetEquivalent}
          icon={<Target className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="成网率"
          value={s.netFormationRate.toFixed(1)}
          unit="%"
          target={68}
          icon={<CheckCircle className="w-6 h-6" />}
          color="emerald"
          trend={s.netFormationRate >= 68 ? 'up' : 'down'}
        />
        <KPICard
          title="运转率"
          value={s.operationRate.toFixed(1)}
          unit="%"
          target={72}
          icon={<Activity className="w-6 h-6" />}
          color="amber"
          trend={s.operationRate >= 72 ? 'up' : 'down'}
        />
        <KPICard
          title="完成网数"
          value={s.totalNets}
          unit="张"
          icon={<BarChart3 className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* 详细数据 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 生产数据 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">生产数据</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">总织造长度</span>
              <span className="font-semibold text-slate-800">{s.totalLength.toFixed(0)} 米</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">总实际面积</span>
              <span className="font-semibold text-slate-800">{s.totalArea.toFixed(0)} ㎡</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">总等效产量</span>
              <span className="font-bold text-blue-600 text-lg">{s.totalEquivalent.toFixed(0)} ㎡</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">合格网数</span>
              <span className="font-semibold text-emerald-600">{s.qualifiedNets} / {s.totalNets}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-600">有效机台数</span>
              <span className="font-semibold text-slate-800">{s.activeMachines} 台</span>
            </div>
          </div>
        </div>

        {/* 机台排名 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">机台产量排名</h2>
          {machineStats.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              暂无数据
            </div>
          ) : (
            <div className="space-y-3">
              {machineStats
                .sort((a, b) => b.totalEquivalent - a.totalEquivalent)
                .slice(0, 5)
                .map((stat, index) => {
                  const maxEquivalent = Math.max(...machineStats.map(s => s.totalEquivalent));
                  const percent = maxEquivalent > 0 ? (stat.totalEquivalent / maxEquivalent) * 100 : 0;
                  return (
                    <div key={stat.machineId} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-amber-100 text-amber-700' :
                          index === 1 ? 'bg-slate-200 text-slate-600' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-slate-100 text-slate-500'
                        }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-slate-700">{stat.machineName}</span>
                          <span className="text-sm font-mono text-slate-600">
                            {stat.totalEquivalent.toFixed(0)} ㎡
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlySummary;
