import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { calculateSalary } from '../../services/calcService';
import { MonthlyParams } from '../../types';
import {
    Minimize,
    Play,
    Pause,
    RefreshCw,
    TrendingUp,
    ArrowUp,
    ArrowDown,
    Save,
    Clock,
    Megaphone,
    Activity,
    Calendar,
    AlertTriangle,
    PieChart as PieChartIcon,
    ShieldAlert,
    Trophy,
    Package,
    Award
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LabelList
} from 'recharts';

export const Simulation: React.FC = () => {
    const { currentData, updateParams, settings, employees, currentDate } = useData();
    const { hasPermission } = useAuth();

    // Local Simulation State (detached from DB)
    const [simParams, setSimParams] = useState<MonthlyParams | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isCarouselActive, setIsCarouselActive] = useState(false);
    const [slideIndex, setSlideIndex] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [preloadedSlides] = useState([0, 1, 2]); // Preload indicator

    // Permissions
    const canView = hasPermission('VIEW_SIMULATION');
    const canApply = hasPermission('APPLY_SIMULATION');

    // Initialize sim params from real data
    useEffect(() => {
        if (currentData) {
            setSimParams({ ...currentData.params });
        }
    }, [currentData]);

    // Clock Timer (update once per minute, no per-second flicker)
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            now.setSeconds(0, 0);
            setCurrentTime(now);
        };

        updateTime();

        const msUntilNextMinute = 60000 - (Date.now() % 60000);
        let interval: ReturnType<typeof setInterval> | null = null;
        const timeout = setTimeout(() => {
            updateTime();
            interval = setInterval(updateTime, 60000);
        }, msUntilNextMinute);

        return () => {
            clearTimeout(timeout);
            if (interval) clearInterval(interval);
        };
    }, []);

    // Carousel Timer
    useEffect(() => {
        let interval: any;
        if (isCarouselActive) {
            interval = setInterval(() => {
                setSlideIndex(prev => (prev + 1) % 3); // 3 slides
            }, 10000); // 10 seconds per slide
        }
        return () => clearInterval(interval);
    }, [isCarouselActive]);

    // Handle Keys (Esc, Space)
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsFullscreen(false);
                setIsCarouselActive(false);
            }
            if (e.key === ' ' && isFullscreen) {
                e.preventDefault(); // Prevent scroll
                setIsCarouselActive(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isFullscreen]);

    if (!canView) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <ShieldAlert size={48} className="mb-4" />
                <h2 className="text-xl font-semibold">权限不足：您没有查看模拟沙箱的权限</h2>
            </div>
        );
    }

    if (!simParams || !currentData) return <div>Loading...</div>;

    // Perform Simulation Calculation
    const simulatedData = {
        ...currentData,
        params: simParams
    };
    const result = calculateSalary(simulatedData, employees);
    const originalResult = calculateSalary(currentData, employees);

    // Handlers
    const handleParamChange = (key: keyof MonthlyParams, value: number) => {
        setSimParams(prev => prev ? ({ ...prev, [key]: value }) : null);
    };

    const handleWeightChange = (source: 'time' | 'base', value: number) => {
        if (value > 100) value = 100;
        if (value < 0) value = 0;
        if (source === 'time') {
            setSimParams(prev => prev ? ({ ...prev, weightTime: value, weightBase: 100 - value }) : null);
        } else {
            setSimParams(prev => prev ? ({ ...prev, weightBase: value, weightTime: 100 - value }) : null);
        }
    };

    const handleApplyToProduction = async () => {
        if (confirm(`⚠️ 确认操作\n\n您即将把当前的模拟参数应用到【${currentData.id}】的正式生产数据中。\n此操作会覆盖当前的积分设置。\n\n是否继续？`)) {
            // 二次确认：要求输入管理员 PIN
            const pin = prompt("请输入管理员密码（PIN）以确认此危险操作：");
            if (!pin) {
                return;
            }

            try {
                // 验证 PIN
                const verifyResponse = await fetch('/api/admin/verify-pin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin })
                });

                if (!verifyResponse.ok) {
                    alert('密码验证失败，操作已取消');
                    return;
                }

                // 验证通过，应用参数
                updateParams(simParams);
                alert('参数已成功应用到生产环境！');
            } catch (err) {
                alert('验证请求失败，请重试');
            }
        }
    };

    const toggleCarousel = () => {
        if (!isFullscreen) {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(err => console.log(err));
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => console.log(err));
            }
        }
        setIsFullscreen(!isFullscreen);
        setIsCarouselActive(!isCarouselActive);
        setSlideIndex(0);
    };

    // --- Components ---

    const DeltaTag = ({ val, base, unit = '' }: { val: number, base: number, unit?: string }) => {
        if (val === base) return <span className="text-xs text-slate-400 font-mono">-</span>;
        const diff = val - base;
        const pct = (diff / base) * 100;
        const isPos = diff > 0;
        return (
            <span className={`text-xs font-mono font-bold flex items-center gap-0.5 ${isPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPos ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {Math.abs(pct).toFixed(1)}%
            </span>
        );
    };

    const chartData = result.records.map(r => ({
        name: r.employeeName,
        Total: Math.round(r.finalScore),
        Bonus: Math.round(r.bonus),
        Base: Math.round(r.realBase)
    })).sort((a, b) => b.Total - a.Total);

    const pieData = [
        { name: '基础分', value: Math.round(result.totalBasePayout), color: '#64748b' },
        { name: '修正分', value: Math.round(result.bonusPool), color: '#3b82f6' }
    ];

    const SimulationControls = () => (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
            {/* Area Control */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                    模拟入库量 (m²)
                    <DeltaTag val={simParams.area} base={currentData.params.area} />
                </label>
                <input
                    type="range" min="10000" max="50000" step="1000"
                    value={simParams.area}
                    onChange={e => handleParamChange('area', parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <input
                    type="number"
                    value={simParams.area}
                    onChange={e => handleParamChange('area', parseInt(e.target.value))}
                    className="w-full text-sm font-mono border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Price Control */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                    模拟单价 (分)
                    <DeltaTag val={simParams.unitPrice} base={currentData.params.unitPrice} />
                </label>
                <input
                    type="number" step="0.1"
                    value={simParams.unitPrice}
                    onChange={e => handleParamChange('unitPrice', parseFloat(e.target.value))}
                    className="w-full text-sm font-mono border rounded px-2 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* KPI Control */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                    模拟 KPI
                    <DeltaTag val={simParams.kpiScore} base={currentData.params.kpiScore} />
                </label>
                <input
                    type="number"
                    value={simParams.kpiScore}
                    onChange={e => handleParamChange('kpiScore', parseInt(e.target.value))}
                    className="w-full text-sm font-mono border rounded px-2 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Weights */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">权重调节</label>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-amber-600 w-8 font-bold">工时</span>
                    <input
                        type="range" min="0" max="100"
                        value={simParams.weightTime}
                        onChange={e => handleWeightChange('time', parseInt(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <span className="text-xs font-mono w-8 text-right font-bold">{simParams.weightTime}%</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-purple-600 w-8 font-bold">基础</span>
                    <input
                        type="range" min="0" max="100"
                        value={simParams.weightBase}
                        onChange={e => handleWeightChange('base', parseInt(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <span className="text-xs font-mono w-8 text-right font-bold">{simParams.weightBase}%</span>
                </div>
            </div>
        </div>
    );

    // --- Slides ---

    // 第一页：积分概览 - 简洁的数据卡片
    const SlideOverview = () => (
        <div className="absolute inset-0 top-[100px] bottom-[72px] flex flex-col items-center justify-center px-[5%] animate-fade-in">
            {/* 主标题 */}
            <div className="mb-6 text-center">
                <h2 className="text-4xl font-bold text-white tracking-wide mb-2">
                    {currentDate.year}年{currentDate.month}月 积分概览
                </h2>
                <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto rounded-full"></div>
            </div>

            {/* 核心指标 - 三个大卡片 */}
            <div className="grid grid-cols-3 gap-8 w-full mb-6">
                <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 shadow-2xl hover:border-blue-500/50 transition-all duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
                    <div className="relative">
                        <div className="text-slate-400 mb-2 text-sm font-medium flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                            总积分包
                        </div>
                        <div className="text-5xl font-bold text-white font-mono tracking-tight leading-none mb-2">
                            {Math.round(result.totalPool).toLocaleString()}
                        </div>
                        <div className="text-slate-500 text-sm">基础分 + 修正分</div>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-900/50 to-slate-900/90 backdrop-blur-xl p-8 rounded-2xl border border-emerald-700/40 shadow-2xl hover:border-emerald-500/50 transition-all duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="relative">
                        <div className="text-emerald-400/90 mb-2 text-sm font-medium flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                            修正积分池
                        </div>
                        <div className="text-5xl font-bold text-emerald-400 font-mono tracking-tight leading-none mb-2">
                            {Math.round(result.bonusPool).toLocaleString()}
                        </div>
                        <div className="text-slate-500 text-sm">待分配激励积分</div>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-amber-900/50 to-slate-900/90 backdrop-blur-xl p-8 rounded-2xl border border-amber-700/40 shadow-2xl hover:border-amber-500/50 transition-all duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all"></div>
                    <div className="relative">
                        <div className="text-amber-400/90 mb-2 text-sm font-medium flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                            人均积分
                        </div>
                        <div className="text-5xl font-bold text-amber-400 font-mono tracking-tight leading-none mb-2">
                            {Math.round(result.totalPool / (result.records.length || 1)).toLocaleString()}
                        </div>
                        <div className="text-slate-500 text-sm">参与人数: {result.records.length}</div>
                    </div>
                </div>
            </div>

            {/* 第二行指标 */}
            <div className="grid grid-cols-4 gap-6 w-full mb-6">
                <div className="p-5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                    <div className="text-slate-400 text-sm mb-2">基础分总计</div>
                    <div className="text-3xl font-bold text-white font-mono">{Math.round(result.totalBasePayout).toLocaleString()}</div>
                </div>
                <div className="p-5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                    <div className="text-slate-400 text-sm mb-2">修正率</div>
                    <div className="text-3xl font-bold text-blue-400 font-mono">{((result.bonusPool / result.totalPool) * 100).toFixed(1)}%</div>
                </div>
                <div className="p-5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                    <div className="text-slate-400 text-sm mb-2">单价系数</div>
                    <div className="text-3xl font-bold text-white font-mono">{simParams.unitPrice}</div>
                </div>
                <div className="p-5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                    <div className="text-slate-400 text-sm mb-2">基础权重</div>
                    <div className="text-3xl font-bold text-purple-400 font-mono">{simParams.weightBase}%</div>
                </div>
            </div>

            {/* 底部参数面板 */}
            <div className="grid grid-cols-3 gap-8 w-full">
                <div className="flex items-center gap-4 p-5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                    <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Package className="text-blue-400 w-7 h-7" />
                    </div>
                    <div>
                        <div className="text-slate-400 text-sm mb-1">本月入库量</div>
                        <div className="text-2xl font-bold text-white font-mono">{simParams.area.toLocaleString()} <span className="text-slate-500 text-base">m²</span></div>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                    <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Clock className="text-amber-400 w-7 h-7" />
                    </div>
                    <div>
                        <div className="text-slate-400 text-sm mb-1">工时权重</div>
                        <div className="text-2xl font-bold text-white font-mono">{simParams.weightTime}<span className="text-slate-500 text-base">%</span></div>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                    <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <TrendingUp className="text-emerald-400 w-7 h-7" />
                    </div>
                    <div>
                        <div className="text-slate-400 text-sm mb-1">KPI得分</div>
                        <div className="text-2xl font-bold text-white font-mono">{simParams.kpiScore} <span className="text-slate-500 text-base">分</span></div>
                    </div>
                </div>
            </div>
        </div>
    );

    // 第二页：排行榜 - 重点突出，全屏展示
    const SlideLeaderboard = () => {
        const top10 = chartData.slice(0, 10);
        const maxScore = Math.max(...top10.map(d => d.Total));

        return (
            <div className="absolute inset-0 top-[100px] bottom-[72px] flex flex-col px-[5%] py-[2%] animate-fade-in">
                {/* 标题区 */}
                <div className="text-center mb-[2%] shrink-0">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-gradient-to-r from-rose-600/20 via-rose-500/10 to-rose-600/20 rounded-full border border-rose-500/30 mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                            <span className="text-rose-400 font-bold uppercase tracking-widest text-[0.7vw]">LIVE RANKING</span>
                        </div>
                    </div>
                    <h2 className="text-[2.5vw] font-black text-white tracking-tight">
                        积分排行榜 <span className="text-rose-500">TOP 10</span>
                    </h2>
                </div>

                {/* 排行榜主体 */}
                <div className="flex-1 grid grid-cols-2 gap-x-[2%] gap-y-[1.5%] max-w-[95%] mx-auto w-full content-center">
                    {top10.map((item, index) => {
                        const percentage = (item.Total / maxScore) * 100;
                        const isTop3 = index < 3;
                        const rankColors = ['from-amber-500 to-yellow-400', 'from-slate-400 to-slate-300', 'from-amber-700 to-amber-600'];
                        const rankBg = ['bg-amber-500/20 border-amber-500/50', 'bg-slate-400/20 border-slate-400/50', 'bg-amber-700/20 border-amber-700/50'];

                        return (
                            <div
                                key={item.name}
                                className={`relative flex items-center gap-[1vw] p-[0.8vw] rounded-xl transition-all duration-300 ${isTop3
                                        ? 'bg-gradient-to-r from-slate-800/90 to-slate-800/60 border-2 ' + rankBg[index]
                                        : 'bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800/60'
                                    }`}
                            >
                                {/* 排名 */}
                                <div className={`w-[2.8vw] h-[2.8vw] rounded-lg flex items-center justify-center font-black text-[1.3vw] shrink-0 ${isTop3
                                        ? `bg-gradient-to-br ${rankColors[index]} text-slate-900 shadow-lg`
                                        : 'bg-slate-700/50 text-slate-400'
                                    }`}>
                                    {index + 1}
                                </div>

                                {/* 信息区 */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-bold text-[1vw] truncate ${isTop3 ? 'text-white' : 'text-slate-200'}`}>
                                            {item.name}
                                        </span>
                                        <span className={`font-mono font-black text-[1.1vw] ${isTop3 ? 'text-white' : 'text-blue-400'
                                            }`}>
                                            {item.Total.toLocaleString()}
                                        </span>
                                    </div>
                                    {/* 进度条 */}
                                    <div className="h-[0.4vw] bg-slate-700/50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${isTop3
                                                    ? `bg-gradient-to-r ${rankColors[index]}`
                                                    : 'bg-gradient-to-r from-blue-600 to-blue-400'
                                                }`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>

                                {/* TOP3 特殊标记 */}
                                {isTop3 && (
                                    <div className="absolute -top-1 -right-1">
                                        <Award className={`w-[1.2vw] h-[1.2vw] ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-300' : 'text-amber-600'}`} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderCustomPieLabel = ({ cx, cy, midAngle, outerRadius, value, name, percent }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = outerRadius + 80; // 增加标签偏移距离
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="#e2e8f0"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize={16}
                fontWeight="bold"
            >
                {`${name} ${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    // 第三页：积分结构分析 - 饼图 + 侧边信息
    const SlideDistribution = () => (
        <div className="absolute inset-0 top-[100px] bottom-[72px] flex flex-col px-[5%] py-6 animate-fade-in">
            {/* 标题 */}
            <div className="text-center mb-6 shrink-0">
                <h2 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
                    <PieChartIcon className="text-blue-400 w-8 h-8" />
                    积分结构分析
                </h2>
            </div>

            <div className="flex-1 flex items-center justify-center gap-12">
                {/* 左侧：饼图 - 使用固定尺寸避免 ResponsiveContainer 警告 */}
                <div className="relative flex items-center justify-center" style={{ width: '600px', height: '400px' }}>
                    <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl"></div>
                    <PieChart width={600} height={400}>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={{ stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '3 3' }}
                            label={renderCustomPieLabel}
                            innerRadius={60}
                            outerRadius={110}
                            fill="#8884d8"
                            dataKey="value"
                            isAnimationActive={false}
                            strokeWidth={0}
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                    {/* 中心数字 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-5xl font-black text-white font-mono">
                                {Math.round(result.totalPool).toLocaleString()}
                            </div>
                            <div className="text-slate-400 text-base">总积分</div>
                        </div>
                    </div>
                </div>

                {/* 右侧：信息卡片 - 固定宽度 */}
                <div className="w-[380px] space-y-6 shrink-0">
                    {/* 积分构成 */}
                    <div className="p-6 bg-slate-800/70 rounded-2xl border border-slate-700">
                        <h4 className="font-bold text-white mb-5 text-lg">积分构成</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-slate-500"></div>
                                    <span className="text-slate-300 text-lg">基础分</span>
                                </div>
                                <span className="font-mono font-bold text-white text-2xl">{Math.round(result.totalBasePayout).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-blue-500"></div>
                                    <span className="text-slate-300 text-lg">修正分</span>
                                </div>
                                <span className="font-mono font-bold text-blue-400 text-2xl">{Math.round(result.bonusPool).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* 本月参数 */}
                    <div className="p-6 bg-slate-800/70 rounded-2xl border border-slate-700">
                        <h4 className="font-bold text-white mb-5 text-lg">本月参数</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                                <span className="text-slate-400 text-base">入库量</span>
                                <span className="font-mono font-bold text-white text-xl">{simParams.area.toLocaleString()} m²</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                                <span className="text-slate-400 text-base">单价系数</span>
                                <span className="font-mono font-bold text-white text-xl">{simParams.unitPrice}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-base">KPI得分</span>
                                <span className="font-mono font-bold text-emerald-400 text-xl">{simParams.kpiScore} 分</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );


    // --- Main View (Non-Fullscreen) ---
    if (!isFullscreen) {
        return (
            <div className="space-y-6 pb-12 animate-fade-in-up">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">模拟沙箱</h1>
                        <p className="text-slate-500">调整参数以预测积分变化，或启动车间展示模式。</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setSimParams({ ...currentData.params })}
                            className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                        >
                            <RefreshCw size={18} /> 重置参数
                        </button>
                        {canApply && (
                            <button
                                onClick={handleApplyToProduction}
                                className="flex items-center gap-2 px-4 py-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition"
                            >
                                <Save size={18} /> 应用到生产
                            </button>
                        )}
                        <button
                            onClick={toggleCarousel}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all font-bold"
                        >
                            <Play size={18} /> 启动车间轮播
                        </button>
                    </div>
                </div>

                <SimulationControls />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm" style={{ height: 400 }}>
                        <h3 className="font-bold text-slate-700 mb-4">模拟结果预览</h3>
                        <ResponsiveContainer width="100%" height={350} minWidth={100} minHeight={100}>
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(val: number) => [`¥${Math.round(val)}`, '']} />
                                <Bar dataKey="Total" fill="#6366f1" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-700 mb-4">关键指标对比 (VS 原始数据)</h3>
                        <div className="space-y-8">
                            <div>
                                <div className="text-sm text-slate-500 mb-1">总积分包</div>
                                <div className="flex items-end gap-3">
                                    <span className="text-2xl font-bold text-slate-400 line-through">
                                        ¥{Math.round(originalResult.totalPool).toLocaleString()}
                                    </span>
                                    <span className="text-slate-300">→</span>
                                    <span className={`text-4xl font-bold ${result.totalPool > originalResult.totalPool ? 'text-emerald-500' : 'text-slate-800'}`}>
                                        ¥{Math.round(result.totalPool).toLocaleString()}
                                    </span>
                                </div>
                                <div className="mt-1">
                                    <DeltaTag val={result.totalPool} base={originalResult.totalPool} />
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-slate-500 mb-1">模拟修正积分池</div>
                                <div className="text-4xl font-bold text-accent font-mono">
                                    ¥{Math.round(result.bonusPool).toLocaleString()}
                                </div>
                                <div className="mt-1">
                                    <DeltaTag val={result.bonusPool} base={originalResult.bonusPool} />
                                </div>
                            </div>

                            <div className="bg-amber-50 p-3 rounded text-xs text-amber-700 flex items-start gap-2">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <p>
                                    您正在预览模拟结果。如果不点击“应用到生产”，这些更改将在退出页面后丢失。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Fullscreen Carousel View ---
    return (
        <div className="fixed inset-0 z-50 bg-slate-900 text-white overflow-hidden font-sans">

            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-40 bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent pointer-events-none">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-3xl shadow-lg shadow-blue-500/50">H</div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-wider text-white">鹤山定型 · 数字化生产车间</h1>
                        <div className="flex items-center gap-3 text-blue-200 mt-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                            <span className="text-sm font-medium tracking-wide">SYSTEM ONLINE</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-sm text-slate-400">设备运行正常</span>
                        </div>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                    <div className="text-5xl font-mono font-bold tracking-widest text-white drop-shadow-lg flex items-center gap-3">
                        <Clock size={40} className="text-blue-500" />
                        {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-slate-400 font-medium text-xl mt-1 flex items-center gap-2">
                        <Calendar size={18} />
                        {currentTime.toLocaleDateString()} {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][currentTime.getDay()]}
                    </div>
                </div>
            </div>

            {/* Controls Overlay */}
            <div className="absolute top-8 right-1/2 translate-x-1/2 z-50 flex gap-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={() => setIsCarouselActive(!isCarouselActive)}
                    className="p-3 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur border border-white/10"
                    title="Pause/Play (Space)"
                >
                    {isCarouselActive ? <Pause size={28} /> : <Play size={28} />}
                </button>
                <button
                    onClick={toggleCarousel}
                    className="p-3 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur border border-white/10"
                    title="Exit (Esc)"
                >
                    <Minimize size={28} />
                </button>
            </div>

            {/* Main Content */}
            <div className="h-full w-full relative">
                {/* Background Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900 -z-10"></div>

                {/* 只渲染当前幻灯片，避免隐藏的图表容器尺寸为0报警告 */}
                <div
                    className="absolute inset-0 transition-all duration-700 ease-out"
                    style={{ willChange: 'opacity, transform' }}
                >
                    {slideIndex === 0 && <SlideOverview />}
                    {slideIndex === 1 && <SlideLeaderboard />}
                    {slideIndex === 2 && <SlideDistribution />}
                </div>
            </div>

            {/* Scrolling Ticker Footer */}
            <div className="absolute bottom-0 left-0 w-full bg-slate-800/90 border-t border-slate-700 py-4 overflow-hidden z-40 backdrop-blur-md shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex items-center">
                <style>{`
                    @keyframes marquee {
                        0% { transform: translateX(100%); }
                        100% { transform: translateX(-100%); }
                    }
                    .animate-marquee {
                        animation: marquee 40s linear infinite;
                    }
                `}</style>
                <div className="bg-red-600 px-5 py-2 rounded-r-full text-sm font-bold uppercase tracking-wider shrink-0 flex items-center gap-2 text-white shadow-lg shadow-red-500/30 ml-0 mr-6 z-10 relative">
                    <Megaphone size={16} className="animate-bounce" /> 工厂公告
                </div>
                <div className="flex-1 overflow-hidden relative h-10 flex items-center">
                    <div className="whitespace-nowrap animate-marquee text-2xl font-medium text-slate-200 tracking-wide flex items-center gap-12">
                        {settings.announcement ? (
                            <span>{settings.announcement}</span>
                        ) : (
                            <>
                                <span className="flex items-center gap-2"><Activity size={24} className="text-emerald-500" /> 安全生产，重在预防。进入车间请务必穿戴好劳保用品。</span>
                                <span className="flex items-center gap-2"><TrendingUp size={24} className="text-amber-500" /> 本月产量冲刺目标：45,000米，当前进度 82%。</span>
                            </>
                        )}
                        <span className="text-slate-500 text-lg">System v2.4 Stable</span>
                    </div>
                </div>
            </div>

            {/* Pagination Dots */}
            <div className="absolute bottom-24 left-0 w-full flex justify-center gap-4 z-40">
                {[0, 1, 2].map(i => (
                    <button
                        key={i}
                        onClick={() => setSlideIndex(i)}
                        className={`h-2 rounded-full transition-all duration-500 shadow-lg ${i === slideIndex ? 'w-16 bg-blue-500 shadow-blue-500/50' : 'w-4 bg-slate-600 hover:bg-slate-500'}`}
                    />
                ))}
            </div>
        </div>
    );
};

