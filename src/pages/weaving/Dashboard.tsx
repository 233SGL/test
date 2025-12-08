/**
 * ========================================
 * 织造工段 - 数据大盘页面
 * ========================================
 * 
 * 展示织造工段核心指标概览、机台运行状态和积分预估
 * 
 * @module pages/weaving/Dashboard
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
    HardHat, Activity, Users, AlertCircle,
    Settings, Gauge, Factory, Target,
    ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    WeavingConfig,
    WeavingMonthlyData,
    DEFAULT_WEAVING_CONFIG,
    DEFAULT_MACHINES,
    INITIAL_ADMIN_TEAM
} from '../../weavingTypes';
import { calculateWeavingBonus } from '../../services/weavingCalcService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// 趋势指示器组件
const TrendIndicator = ({ value, benchmark, suffix = '%' }: { value: number; benchmark: number; suffix?: string }) => {
    const diff = value - benchmark;
    if (diff > 0) {
        return (
            <span className="inline-flex items-center gap-0.5 text-emerald-600 text-xs font-medium">
                <ArrowUpRight size={14} />
                +{diff.toFixed(1)}{suffix}
            </span>
        );
    } else if (diff < 0) {
        return (
            <span className="inline-flex items-center gap-0.5 text-rose-500 text-xs font-medium">
                <ArrowDownRight size={14} />
                {diff.toFixed(1)}{suffix}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-0.5 text-slate-400 text-xs font-medium">
            <Minus size={14} />
            持平
        </span>
    );
};

// 进度环组件
const ProgressRing = ({
    value,
    max = 100,
    size = 120,
    strokeWidth = 10,
    color = '#6366f1'
}: {
    value: number;
    max?: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = Math.min(value / max, 1);
    const offset = circumference - progress * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-800 tabular-nums">{value.toFixed(1)}%</span>
            </div>
        </div>
    );
};

export const WeavingDashboard = () => {
    // 从数据库读取配置
    const [config, setConfig] = useState<WeavingConfig>(DEFAULT_WEAVING_CONFIG);
    const [machines, setMachines] = useState<typeof DEFAULT_MACHINES>([]);
    const [_isLoading, setIsLoading] = useState(true); // 用于后续添加加载状态显示
    const [monthlyData] = useState<WeavingMonthlyData>({
        netFormationRate: 75,
        equivalentOutput: 58000,
        activeMachines: 10,
        actualOperators: 17,
        operationRate: 78,
        attendanceDays: 26,
    });

    // 从API加载配置和机台数据
    useEffect(() => {
        const loadData = async () => {
            try {
                const [configRes, machinesRes] = await Promise.all([
                    fetch('/api/weaving/config'),
                    fetch('/api/weaving/machines')
                ]);

                if (configRes.ok) {
                    const configData = await configRes.json();
                    if (configData && Object.keys(configData).length > 0) {
                        setConfig(configData);
                    }
                }

                if (machinesRes.ok) {
                    const machinesData = await machinesRes.json();
                    if (machinesData && machinesData.length > 0) {
                        setMachines(machinesData);
                    }
                }
            } catch (error) {
                console.error('加载数据失败:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // 计算总目标产量（各机台独立目标之和，只计算运行中的机台）
    const totalTargetOutput = useMemo(() => {
        if (machines.length === 0) {
            // 回退到配置中的默认值
            return config.targetEquivalentOutput * monthlyData.activeMachines;
        }
        // 使用各机台独立目标，只计算运行中的机台
        return machines
            .filter(m => m.status === 'running')
            .reduce((sum, m) => sum + (m.targetOutput || config.targetEquivalentOutput), 0);
    }, [machines, config.targetEquivalentOutput, monthlyData.activeMachines]);

    // 使用新的计算服务
    const result = useMemo(() => {
        return calculateWeavingBonus(monthlyData, config);
    }, [monthlyData, config]);

    // 奖金分配饼图数据
    const bonusDistributionData = [
        { name: '成网率质量奖', value: Math.max(0, result.qualityBonusTotal), color: '#10b981' },
        { name: '运转率奖', value: Math.max(0, result.operationBonusTotal), color: '#6366f1' },
    ].filter(d => d.value > 0);

    // 人员积分柱状图数据
    const staffChartData = INITIAL_ADMIN_TEAM.map(person => {
        const isLeader = person.position === 'admin_leader';
        const bonus = isLeader ? result.leaderBonus : result.memberBonus;
        return {
            name: person.name,
            基本积分: person.baseSalary,
            奖金积分: Math.round(bonus),
            总积分: Math.round(person.baseSalary + bonus)
        };
    });

    return (
        <div className="h-full flex flex-col animate-fade-in-up">
            {/* 页面头部 */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600 shadow-sm">
                                <HardHat size={24} />
                            </div>
                            织造工段 - 数据大盘
                        </h1>
                        <p className="text-slate-500 text-sm">
                            管理员班考核指标概览与积分分析
                        </p>
                    </div>
                    <Link to="/weaving/config" className="btn-secondary flex items-center gap-2">
                        <Settings size={16} />
                        参数配置
                    </Link>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 space-y-6">
                {/* ===== 第一行：核心指标卡片 ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 成网率 */}
                    <div className="card p-5 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-slate-500 mb-2">
                                    <Activity size={18} className="text-primary-500" />
                                    <span className="text-sm font-medium">成网率</span>
                                </div>
                                <div className="text-3xl font-bold text-slate-900 tabular-nums">
                                    {monthlyData.netFormationRate}%
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-slate-400">基准: {config.netFormationBenchmark}%</span>
                                    <TrendIndicator value={monthlyData.netFormationRate} benchmark={config.netFormationBenchmark} />
                                </div>
                            </div>
                            <ProgressRing
                                value={monthlyData.netFormationRate}
                                size={70}
                                strokeWidth={6}
                                color={monthlyData.netFormationRate >= config.netFormationBenchmark ? '#10b981' : '#f59e0b'}
                            />
                        </div>
                    </div>

                    {/* 运转率 */}
                    <div className="card p-5 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-slate-500 mb-2">
                                    <Gauge size={18} className="text-emerald-500" />
                                    <span className="text-sm font-medium">运转率</span>
                                </div>
                                <div className="text-3xl font-bold text-slate-900 tabular-nums">
                                    {monthlyData.operationRate}%
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-slate-400">基准: {config.operationRateBenchmark}%</span>
                                    <TrendIndicator value={monthlyData.operationRate} benchmark={config.operationRateBenchmark} />
                                </div>
                            </div>
                            <ProgressRing
                                value={monthlyData.operationRate}
                                size={70}
                                strokeWidth={6}
                                color={monthlyData.operationRate >= config.operationRateBenchmark ? '#10b981' : '#f59e0b'}
                            />
                        </div>
                    </div>

                    {/* 等效产量 - 按单机台平均显示 */}
                    <div className="card p-5 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Factory size={18} className="text-violet-500" />
                            <span className="text-sm font-medium">等效产量</span>
                            <span className="text-xs text-slate-400">（单机台平均）</span>
                        </div>
                        {(() => {
                            // 计算单机台平均产量
                            const avgOutputPerMachine = monthlyData.activeMachines > 0
                                ? monthlyData.equivalentOutput / monthlyData.activeMachines
                                : 0;
                            // 单机台目标（默认6450㎡）
                            const singleMachineTarget = config.targetEquivalentOutput;
                            // 单机台完成率
                            const singleMachineRate = singleMachineTarget > 0
                                ? (avgOutputPerMachine / singleMachineTarget) * 100
                                : 0;

                            return (
                                <>
                                    <div className="text-3xl font-bold text-slate-900 tabular-nums">
                                        {Math.round(avgOutputPerMachine).toLocaleString()}
                                        <span className="text-base font-normal text-slate-400 ml-1">㎡</span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-xs text-slate-400">
                                            单机目标: {singleMachineTarget.toLocaleString()} ㎡
                                        </span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${singleMachineRate >= 100
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {singleMachineRate.toFixed(1)}%
                                        </span>
                                    </div>
                                    {/* 进度条 */}
                                    <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, singleMachineRate)}%`
                                            }}
                                        />
                                    </div>
                                    {/* 总产量提示 */}
                                    <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400">
                                        总产量: {monthlyData.equivalentOutput.toLocaleString()} ㎡ / {totalTargetOutput.toLocaleString()} ㎡
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    {/* 人员效率 */}
                    <div className="card p-5 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Users size={18} className="text-amber-500" />
                            <span className="text-sm font-medium">人员效率</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900 tabular-nums">
                                {monthlyData.actualOperators}
                            </span>
                            <span className="text-slate-400">/</span>
                            <span className="text-lg text-slate-500 tabular-nums">{config.operatorQuota}</span>
                            <span className="text-sm text-slate-400">人</span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                            效率系数: <span className="font-semibold text-slate-700">
                                {(config.operatorQuota / monthlyData.actualOperators).toFixed(2)}
                            </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                            <div className="bg-slate-50 rounded-lg py-2">
                                <div className="text-lg font-bold text-slate-700">{monthlyData.activeMachines}</div>
                                <div className="text-xs text-slate-400">有效机台</div>
                            </div>
                            <div className="bg-slate-50 rounded-lg py-2">
                                <div className="text-lg font-bold text-slate-700">{monthlyData.attendanceDays}</div>
                                <div className="text-xs text-slate-400">出勤天数</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== 第二行：奖金池概览 + 机台状态 ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 奖金池概览 */}
                    <div className="lg:col-span-1 card overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-primary-50 to-transparent">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Target size={18} className="text-primary-500" />
                                当月奖金池
                            </h3>
                        </div>
                        <div className="p-6">
                            {/* 总奖金池 */}
                            <div className="text-center mb-6">
                                <div className="text-sm text-slate-500 mb-1">管理员班总奖金</div>
                                <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-violet-600 bg-clip-text text-transparent tabular-nums">
                                    {result.totalBonusPool.toFixed(0)}
                                    <span className="text-lg font-normal text-slate-400 ml-1">分</span>
                                </div>
                            </div>

                            {/* 饼图 */}
                            {bonusDistributionData.length > 0 && (
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={bonusDistributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {bonusDistributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => [`${value.toFixed(0)} 分`, '']}
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* 图例 */}
                            <div className="space-y-3 mt-4">
                                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                        <span className="text-sm text-slate-600">成网率质量奖</span>
                                    </div>
                                    <span className="font-bold text-emerald-700 tabular-nums">
                                        {result.qualityBonusTotal.toFixed(0)} 分
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                        <span className="text-sm text-slate-600">运转率奖</span>
                                    </div>
                                    <span className="font-bold text-indigo-700 tabular-nums">
                                        {result.operationBonusTotal.toFixed(0)} 分
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 机台运行状态 */}
                    <div className="lg:col-span-2 card overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Factory size={18} className="text-slate-500" />
                                机台运行状态
                            </h3>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span className="text-slate-500">运行中</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    <span className="text-slate-500">维护中</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                    <span className="text-slate-500">空闲</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {DEFAULT_MACHINES.map((machine, index) => {
                                    const isActive = index < monthlyData.activeMachines;
                                    const status = index < 8 ? 'running' : index < 9 ? 'maintenance' : 'idle';

                                    return (
                                        <div
                                            key={machine.id}
                                            className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${!isActive
                                                ? 'border-slate-200 bg-slate-50 opacity-50'
                                                : status === 'running'
                                                    ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:shadow-md'
                                                    : status === 'maintenance'
                                                        ? 'border-amber-200 bg-amber-50 hover:border-amber-300 hover:shadow-md'
                                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:shadow-md'
                                                }`}
                                        >
                                            {/* 状态指示灯 */}
                                            <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${!isActive ? 'bg-slate-300' :
                                                status === 'running' ? 'bg-emerald-500 animate-pulse' :
                                                    status === 'maintenance' ? 'bg-amber-500' : 'bg-slate-300'
                                                }`}></div>

                                            <div className="text-center">
                                                <div className="text-lg font-bold text-slate-800">{machine.id}</div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {machine.speedType} · {machine.width}m
                                                </div>
                                                {isActive && (
                                                    <div className="mt-2 text-xs">
                                                        <span className={`font-medium ${status === 'running' ? 'text-emerald-600' :
                                                            status === 'maintenance' ? 'text-amber-600' : 'text-slate-400'
                                                            }`}>
                                                            {status === 'running' ? '运行中' : status === 'maintenance' ? '维护中' : '空闲'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== 第三行：人员积分分配 ===== */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Users size={18} className="text-slate-500" />
                            管理员班积分分配
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* 积分柱状图 */}
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={staffChartData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                        <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={60} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                            formatter={(value: number) => [`${value.toLocaleString()} 分`, '']}
                                        />
                                        <Legend />
                                        <Bar dataKey="基本积分" stackId="a" fill="#94a3b8" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="奖金积分" stackId="a" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* 人员明细表 */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-slate-500 text-xs uppercase border-b border-slate-200">
                                            <th className="text-left py-3 px-4 font-semibold">姓名</th>
                                            <th className="text-left py-3 px-4 font-semibold">职位</th>
                                            <th className="text-center py-3 px-4 font-semibold">系数</th>
                                            <th className="text-right py-3 px-4 font-semibold">基本积分</th>
                                            <th className="text-right py-3 px-4 font-semibold">奖金</th>
                                            <th className="text-right py-3 px-4 font-semibold">应发积分</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {INITIAL_ADMIN_TEAM.map((person) => {
                                            const isLeader = person.position === 'admin_leader';
                                            const bonus = isLeader ? result.leaderBonus : result.memberBonus;
                                            const total = person.baseSalary + bonus;

                                            return (
                                                <tr key={person.name} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-3 px-4 font-medium text-slate-800">{person.name}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${isLeader
                                                            ? 'bg-violet-100 text-violet-800'
                                                            : 'bg-slate-100 text-slate-700'
                                                            }`}>
                                                            {isLeader ? '班长' : '班员'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-slate-600 tabular-nums">
                                                        {isLeader ? '1.3' : '1.0'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-slate-600 tabular-nums">
                                                        {person.baseSalary.toLocaleString()}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-semibold text-emerald-600 tabular-nums">
                                                        +{bonus.toFixed(0)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                                                        {total.toFixed(0)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                        <tr className="font-semibold text-slate-800">
                                            <td className="py-3 px-4" colSpan={3}>合计</td>
                                            <td className="py-3 px-4 text-right tabular-nums">
                                                {INITIAL_ADMIN_TEAM.reduce((sum, p) => sum + p.baseSalary, 0).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-right text-emerald-600 tabular-nums">
                                                +{result.totalBonusPool.toFixed(0)}
                                            </td>
                                            <td className="py-3 px-4 text-right tabular-nums">
                                                {(INITIAL_ADMIN_TEAM.reduce((sum, p) => sum + p.baseSalary, 0) + result.totalBonusPool).toFixed(0)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== 第四行：计算公式说明 ===== */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-amber-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <AlertCircle size={18} className="text-amber-500" />
                            考核方案说明
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-2">成网率质量奖计算</h4>
                                    <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 space-y-2 font-mono">
                                        <p>奖励系数 = (成网率-{config.netFormationBenchmark}%)×100÷30</p>
                                        <p className="pl-12">× 等效产量÷(目标产量×机台数)</p>
                                        <p className="pl-12">÷ 实际人数 × 定员{config.operatorQuota}</p>
                                        <p className="mt-2 text-primary-600 font-semibold">
                                            当前系数: {result.qualityBonusCoef.toFixed(4)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-2">运转率奖计算</h4>
                                    <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 space-y-2 font-mono">
                                        <p>运转率奖 = (运转率-{config.operationRateBenchmark}%)×100×{config.operationRateBonusUnit}</p>
                                        <p className="text-slate-400">以{config.operationRateBenchmark}%为基准，每超1%奖{config.operationRateBonusUnit}元</p>
                                        <p className="mt-2 text-primary-600 font-semibold">
                                            当前奖金: {result.operationBonusTotal.toFixed(0)} 分
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
