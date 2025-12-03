import React, { useState, useEffect } from 'react';
import { HardHat, TrendingUp, Users, Activity, AlertCircle } from 'lucide-react';
import { WeavingConfig, WeavingMonthlyData, WeavingCalculationResult, DEFAULT_WEAVING_CONFIG } from '../../weavingTypes';
import { WeavingResults } from '../../components/weaving/WeavingResults';

export const WeavingDashboard = () => {
  // TODO: 从数据库读取真实数据
  const [config] = useState<WeavingConfig>(DEFAULT_WEAVING_CONFIG);
  const [monthlyData] = useState<WeavingMonthlyData>({
    netFormationRate: 75,
    equivalentOutput: 200000,
    activeMachines: 10,
    actualOperators: 17,
    operationRate: 78,
    attendanceDays: 26,
  });
  const [result, setResult] = useState<WeavingCalculationResult | null>(null);

  useEffect(() => {
    calculate();
  }, [config, monthlyData]);

  const calculate = () => {
    const {
      netFormationBenchmark,
      operationRateBenchmark,
      targetEquivalentOutput,
      operatorQuota,
      avgTargetBonus,
      adminTeamSize,
      operationRateBonusUnit,
      leaderCoef,
      memberCoef,
      leaderBaseSalary,
      memberBaseSalary,
    } = config;

    const {
      netFormationRate,
      equivalentOutput,
      activeMachines,
      actualOperators,
      operationRate,
    } = monthlyData;

    if (activeMachines === 0 || actualOperators === 0 || targetEquivalentOutput === 0) {
      setResult(null);
      return;
    }

    const netFormationDiff = netFormationRate - netFormationBenchmark;
    const outputRatio = equivalentOutput / (targetEquivalentOutput * activeMachines);
    const operatorRatio = operatorQuota / actualOperators;

    const qualityBonusCoef = (netFormationDiff * 100 / 30) * outputRatio * operatorRatio;
    const qualityBonusTotal = qualityBonusCoef * avgTargetBonus * adminTeamSize;
    const operationRateDiff = operationRate - operationRateBenchmark;
    const operationBonusTotal = operationRateDiff * 100 * operationRateBonusUnit;
    const totalBonusPool = qualityBonusTotal + operationBonusTotal;
    const memberCount = adminTeamSize - 1;
    const totalCoef = leaderCoef + (memberCoef * memberCount);
    const leaderBonus = totalCoef > 0 ? (totalBonusPool / totalCoef) * leaderCoef : 0;
    const memberBonus = totalCoef > 0 ? (totalBonusPool / totalCoef) * memberCoef : 0;

    setResult({
      qualityBonusCoef,
      qualityBonusTotal,
      operationBonusTotal,
      totalBonusPool,
      totalCoef,
      leaderBonus,
      memberBonus,
      leaderTotalWage: leaderBaseSalary + leaderBonus,
      memberTotalWage: memberBaseSalary + memberBonus,
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <HardHat className="text-blue-600" size={32} />
          织造工段 - 数据大盘
        </h1>
        <p className="text-slate-600">
          管理员班考核指标概览与薪酬分析
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        {/* 关键指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Activity size={18} />
              <span className="text-sm font-medium">成网率</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{monthlyData.netFormationRate}%</div>
            <div className="text-xs text-slate-400 mt-1">基准: {config.netFormationBenchmark}%</div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <TrendingUp size={18} />
              <span className="text-sm font-medium">运转率</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{monthlyData.operationRate}%</div>
            <div className="text-xs text-slate-400 mt-1">基准: {config.operationRateBenchmark}%</div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Users size={18} />
              <span className="text-sm font-medium">在岗人数</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{monthlyData.actualOperators} 人</div>
            <div className="text-xs text-slate-400 mt-1">定员: {config.operatorQuota} 人</div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">等效产量</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{monthlyData.equivalentOutput.toLocaleString()} ㎡</div>
            <div className="text-xs text-slate-400 mt-1">目标: {(config.targetEquivalentOutput * monthlyData.activeMachines).toLocaleString()} ㎡</div>
          </div>
        </div>

        {/* 薪酬计算结果展示 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800">当月薪酬预估</h3>
          </div>
          <div className="p-6">
            <WeavingResults result={result} />
          </div>
        </div>
      </div>
    </div>
  );
};