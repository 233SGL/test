/**
 * ========================================
 * 织造工段 - 积分计算页面
 * ========================================
 * 
 * 展示积分计算的详细过程和结果
 * 支持模拟调整参数查看积分变化
 * 
 * @module pages/weaving/Calculator
 */
import React, { useState, useMemo } from 'react';
import { 
    Calculator, Play, RotateCcw, TrendingUp, 
    Info, ChevronRight, Percent, Target
} from 'lucide-react';
import { 
    WeavingConfig, 
    WeavingMonthlyData, 
    DEFAULT_WEAVING_CONFIG,
    INITIAL_ADMIN_TEAM
} from '../../weavingTypes';
import { calculateWeavingBonus } from '../../services/weavingCalcService';

export const WeavingCalculator = () => {
    // 配置参数
    const [config] = useState<WeavingConfig>(DEFAULT_WEAVING_CONFIG);
    
    // 可调整的模拟数据
    const [monthlyData, setMonthlyData] = useState<WeavingMonthlyData>({
        netFormationRate: 75,
        equivalentOutput: 58000,
        activeMachines: 10,
        actualOperators: 17,
        operationRate: 78,
        attendanceDays: 26,
    });

    // 计算结果
    const result = useMemo(() => {
        return calculateWeavingBonus(monthlyData, config);
    }, [monthlyData, config]);

    // 重置为默认值
    const resetData = () => {
        setMonthlyData({
            netFormationRate: 75,
            equivalentOutput: 58000,
            activeMachines: 10,
            actualOperators: 17,
            operationRate: 78,
            attendanceDays: 26,
        });
    };

    // 计算步骤数据
    const steps = [
        {
            title: '成网率超标计算',
            formula: `(${monthlyData.netFormationRate}% - ${config.netFormationBenchmark}%) × 100 ÷ 30`,
            result: ((monthlyData.netFormationRate - config.netFormationBenchmark) * 100 / 30).toFixed(4),
            description: '成网率超过基准部分的积分基数'
        },
        {
            title: '产量完成率',
            formula: `${monthlyData.equivalentOutput.toLocaleString()} ÷ (${config.targetEquivalentOutput} × ${monthlyData.activeMachines})`,
            result: (monthlyData.equivalentOutput / (config.targetEquivalentOutput * monthlyData.activeMachines)).toFixed(4),
            description: '实际等效产量与目标产量的比值'
        },
        {
            title: '人员效率系数',
            formula: `${config.operatorQuota} ÷ ${monthlyData.actualOperators}`,
            result: (config.operatorQuota / monthlyData.actualOperators).toFixed(4),
            description: '定员人数与实际人数的比值'
        },
        {
            title: '质量奖励系数',
            formula: '成网率超标 × 产量完成率 × 人员效率',
            result: result.qualityBonusCoef.toFixed(4),
            description: '综合考核系数'
        },
        {
            title: '成网率质量奖总额',
            formula: `${result.qualityBonusCoef.toFixed(4)} × ${config.avgTargetBonus} × ${config.adminTeamSize}`,
            result: result.qualityBonusTotal.toFixed(2) + ' 分',
            description: '质量奖励系数 × 人均目标奖金 × 管理员人数'
        },
        {
            title: '运转率奖总额',
            formula: `(${monthlyData.operationRate}% - ${config.operationRateBenchmark}%) × 100 × ${config.operationRateBonusUnit}`,
            result: result.operationBonusTotal.toFixed(2) + ' 分',
            description: '运转率超标部分 × 单价'
        }
    ];

    return (
        <div className="h-full flex flex-col animate-fade-in-up">
            {/* 页面头部 */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 shadow-sm">
                        <Calculator size={24} />
                    </div>
                    织造工段 - 积分计算
                </h1>
                <p className="text-slate-500 text-sm">
                    查看积分计算详细过程，支持参数调整模拟
                </p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 space-y-6">
                {/* ===== 参数调整区 ===== */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Play size={18} className="text-slate-500" />
                            模拟参数调整
                        </h3>
                        <button 
                            onClick={resetData}
                            className="btn-secondary text-sm flex items-center gap-1.5"
                        >
                            <RotateCcw size={14} />
                            重置
                        </button>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                    成网率 (%)
                                </label>
                                <input
                                    type="number"
                                    value={monthlyData.netFormationRate}
                                    onChange={(e) => setMonthlyData(prev => ({
                                        ...prev,
                                        netFormationRate: parseFloat(e.target.value) || 0
                                    }))}
                                    className="input text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                    运转率 (%)
                                </label>
                                <input
                                    type="number"
                                    value={monthlyData.operationRate}
                                    onChange={(e) => setMonthlyData(prev => ({
                                        ...prev,
                                        operationRate: parseFloat(e.target.value) || 0
                                    }))}
                                    className="input text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                    等效产量 (㎡)
                                </label>
                                <input
                                    type="number"
                                    value={monthlyData.equivalentOutput}
                                    onChange={(e) => setMonthlyData(prev => ({
                                        ...prev,
                                        equivalentOutput: parseFloat(e.target.value) || 0
                                    }))}
                                    className="input text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                    有效机台
                                </label>
                                <input
                                    type="number"
                                    value={monthlyData.activeMachines}
                                    onChange={(e) => setMonthlyData(prev => ({
                                        ...prev,
                                        activeMachines: parseInt(e.target.value) || 0
                                    }))}
                                    className="input text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                    实际人数
                                </label>
                                <input
                                    type="number"
                                    value={monthlyData.actualOperators}
                                    onChange={(e) => setMonthlyData(prev => ({
                                        ...prev,
                                        actualOperators: parseInt(e.target.value) || 0
                                    }))}
                                    className="input text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                    出勤天数
                                </label>
                                <input
                                    type="number"
                                    value={monthlyData.attendanceDays}
                                    onChange={(e) => setMonthlyData(prev => ({
                                        ...prev,
                                        attendanceDays: parseInt(e.target.value) || 0
                                    }))}
                                    className="input text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== 计算步骤详解 ===== */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Info size={18} className="text-slate-500" />
                            计算步骤详解
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {steps.map((step, index) => (
                                <div 
                                    key={index}
                                    className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-slate-800">{step.title}</span>
                                        </div>
                                        <div className="text-sm text-slate-500 mb-2">{step.description}</div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <code className="px-2 py-1 bg-white rounded border border-slate-200 text-slate-600 font-mono">
                                                {step.formula}
                                            </code>
                                            <ChevronRight size={16} className="text-slate-400" />
                                            <span className="font-bold text-primary-600">{step.result}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ===== 计算结果汇总 ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 奖金池汇总 */}
                    <div className="card overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-transparent">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Target size={18} className="text-emerald-500" />
                                奖金池汇总
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                                <div>
                                    <div className="text-sm text-slate-600">成网率质量奖</div>
                                    <div className="text-xs text-slate-400 mt-0.5">系数: {result.qualityBonusCoef.toFixed(4)}</div>
                                </div>
                                <div className="text-xl font-bold text-emerald-600 tabular-nums">
                                    {result.qualityBonusTotal.toFixed(0)} 分
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl">
                                <div>
                                    <div className="text-sm text-slate-600">织机运转率奖</div>
                                    <div className="text-xs text-slate-400 mt-0.5">超标 {monthlyData.operationRate - config.operationRateBenchmark}%</div>
                                </div>
                                <div className="text-xl font-bold text-indigo-600 tabular-nums">
                                    {result.operationBonusTotal.toFixed(0)} 分
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-100 to-violet-100 rounded-xl border-2 border-primary-200">
                                <div className="font-semibold text-slate-800">管理员班总奖金</div>
                                <div className="text-2xl font-bold text-primary-600 tabular-nums">
                                    {result.totalBonusPool.toFixed(0)} 分
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 人员分配 */}
                    <div className="card overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Percent size={18} className="text-slate-500" />
                                二次分配结果
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                                总系数: {result.totalCoef.toFixed(1)} (班长1.3 + 班员1.0×2)
                            </p>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-slate-500 text-xs border-b border-slate-200">
                                            <th className="text-left py-2 font-medium">姓名</th>
                                            <th className="text-center py-2 font-medium">职位</th>
                                            <th className="text-right py-2 font-medium">基本积分</th>
                                            <th className="text-right py-2 font-medium">奖金</th>
                                            <th className="text-right py-2 font-medium">应发积分</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {INITIAL_ADMIN_TEAM.map((person) => {
                                            const isLeader = person.role === '班长';
                                            const bonus = isLeader ? result.leaderBonus : result.memberBonus;
                                            const total = person.baseSalary + bonus;

                                            return (
                                                <tr key={person.name}>
                                                    <td className="py-3 font-medium text-slate-800">{person.name}</td>
                                                    <td className="py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                            isLeader ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {person.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-right text-slate-600 tabular-nums">{person.baseSalary}</td>
                                                    <td className="py-3 text-right text-emerald-600 tabular-nums">+{bonus.toFixed(0)}</td>
                                                    <td className="py-3 text-right font-bold text-slate-900 tabular-nums">{total.toFixed(0)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                        <tr className="font-semibold">
                                            <td className="py-3" colSpan={2}>合计</td>
                                            <td className="py-3 text-right tabular-nums">
                                                {INITIAL_ADMIN_TEAM.reduce((s, p) => s + p.baseSalary, 0)}
                                            </td>
                                            <td className="py-3 text-right text-emerald-600 tabular-nums">
                                                +{result.totalBonusPool.toFixed(0)}
                                            </td>
                                            <td className="py-3 text-right tabular-nums">
                                                {(INITIAL_ADMIN_TEAM.reduce((s, p) => s + p.baseSalary, 0) + result.totalBonusPool).toFixed(0)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

