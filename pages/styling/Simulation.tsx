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
  ShieldAlert
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LabelList 
} from 'recharts';

export const Simulation: React.FC = () => {
  const { currentData, updateParams, settings, employees } = useData();
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

  const handleApplyToProduction = () => {
      if (confirm(`⚠️ 确认操作\n\n您即将把当前的模拟参数应用到【${currentData.id}】的正式生产数据中。\n此操作会覆盖当前的薪酬设置。\n\n是否继续？`)) {
          updateParams(simParams);
          alert('参数已成功应用到生产环境！');
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
      { name: '基础分支出', value: Math.round(result.totalBasePayout), color: '#64748b' },
      { name: '修正积分池支出', value: Math.round(result.bonusPool), color: '#3b82f6' }
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

  const SlideOverview = () => (
      <div className="flex flex-col items-center justify-center h-full p-12 relative z-10 animate-fade-in">
          <h2 className="text-4xl font-bold mb-16 text-blue-200 tracking-wider">本月薪酬概览</h2>
          <div className="grid grid-cols-3 gap-12 w-full max-w-6xl">
              <div className="bg-slate-800/60 backdrop-blur-md p-10 rounded-3xl text-center border border-slate-600/50 shadow-2xl">
                  <div className="text-slate-400 mb-4 text-xl font-medium">总薪酬包</div>
                  <div className="text-7xl font-bold text-blue-50 font-mono tracking-tight">
                    ¥{Math.round(result.totalPool).toLocaleString()}
                  </div>
              </div>
              <div className="bg-slate-800/60 backdrop-blur-md p-10 rounded-3xl text-center border border-slate-600/50 shadow-2xl">
                  <div className="text-slate-400 mb-4 text-xl font-medium">待分修正积分池</div>
                  <div className="text-7xl font-bold text-emerald-400 font-mono tracking-tight">
                    ¥{Math.round(result.bonusPool).toLocaleString()}
                  </div>
              </div>
              <div className="bg-slate-800/60 backdrop-blur-md p-10 rounded-3xl text-center border border-slate-600/50 shadow-2xl">
                  <div className="text-slate-400 mb-4 text-xl font-medium">平均薪酬</div>
                  <div className="text-7xl font-bold text-amber-400 font-mono tracking-tight">
                    ¥{Math.round(result.totalPool / (result.records.length || 1)).toLocaleString()}
                  </div>
              </div>
          </div>
          <div className="mt-20 flex gap-24">
              <div className="text-center">
                  <div className="text-2xl text-slate-500 mb-2">本月入库量</div>
                  <div className="text-5xl font-bold text-blue-100">{simParams.area.toLocaleString()} m²</div>
              </div>
              <div className="text-center">
                  <div className="text-2xl text-slate-500 mb-2">工时权重占比</div>
                  <div className="text-5xl font-bold text-amber-500">{simParams.weightTime}%</div>
              </div>
          </div>
      </div>
  );

  const SlideLeaderboard = () => (
      <div className="h-full p-12 flex flex-col pt-24 animate-fade-in">
          <h2 className="text-5xl font-bold text-blue-200 mb-10 text-center flex items-center justify-center gap-4">
              <TrendingUp className="text-red-400" size={48} /> 薪酬排行榜 TOP 10
          </h2>
                    <div className="flex-1 w-full max-w-7xl mx-auto bg-slate-800/60 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-slate-600/50" style={{height: 600}}>
            <ResponsiveContainer width="100%" height={600}>
                <BarChart data={chartData.slice(0, 10)} layout="vertical" margin={{ top: 10, right: 80, left: 80, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#475569" />
                    <XAxis type="number" stroke="#94a3b8" hide />
                    <YAxis dataKey="name" type="category" stroke="#cbd5e1" width={140} tick={{fontSize: 24, fontWeight: 'bold', fill: '#cbd5e1'}} />
                    <Bar dataKey="Total" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={56} isAnimationActive={false}>
                        <LabelList 
                            dataKey="Total" 
                            position="right" 
                            fill="#93c5fd" 
                            fontSize={24} 
                            fontWeight="bold" 
                            formatter={(val: number) => `¥${val}`} 
                        />
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index < 3 ? '#f43f5e' : '#3b82f6'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
      </div>
  );

  const renderCustomPieLabel = ({ cx, cy, midAngle, outerRadius, value, name, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 50; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text 
            x={x} 
            y={y} 
            fill="#93c5fd"
            textAnchor={x > cx ? 'start' : 'end'} 
            dominantBaseline="central"
            className="text-2xl font-bold"
        >
            {`${name} ${(percent * 100).toFixed(0)}%`}
        </text>
    );
  };

  const SlideDistribution = () => (
      <div className="h-full p-12 flex flex-col pt-24 animate-fade-in">
          <h2 className="text-5xl font-bold text-blue-200 mb-12 text-center flex items-center justify-center gap-4">
              <PieChartIcon size={48} className="text-blue-400"/> 资金分配结构分析
          </h2>
          <div className="flex-1 flex items-center justify-center gap-20">
              <div className="w-1/2" style={{height: 600}}>
                  <ResponsiveContainer width="100%" height={600}>
                      <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={{ stroke: '#64748b', strokeWidth: 2 }}
                            label={renderCustomPieLabel}
                            outerRadius={160} 
                            fill="#8884d8"
                            dataKey="value"
                            isAnimationActive={false}
                          >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                            ))}
                          </Pie>
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              <div className="w-1/3 space-y-8">
                  {/* Card 1 */}
                  <div className="p-8 bg-slate-800/60 rounded-2xl border border-slate-600/50 shadow-sm backdrop-blur-md">
                      <h4 className="font-bold text-slate-400 mb-4 text-2xl">模拟参数设定</h4>
                      <ul className="space-y-6 text-2xl">
                          <li className="flex justify-between border-b border-slate-600/50 pb-3">
                              <span className="text-slate-400">入库量</span>
                              <span className="font-mono font-bold text-blue-200">{simParams.area.toLocaleString()}</span>
                          </li>
                          <li className="flex justify-between border-b border-slate-600/50 pb-3">
                              <span className="text-slate-400">单价</span>
                              <span className="font-mono font-bold text-blue-200">{simParams.unitPrice}</span>
                          </li>
                          <li className="flex justify-between pb-3">
                              <span className="text-slate-400">KPI得分</span>
                              <span className="font-mono font-bold text-blue-200">{simParams.kpiScore}</span>
                          </li>
                      </ul>
                  </div>
                  {/* Card 2 */}
                  <div className="p-8 bg-blue-900/30 rounded-2xl border border-blue-700/50 shadow-sm backdrop-blur-md">
                      <h4 className="font-bold text-blue-300 mb-2 text-2xl">预计总支出</h4>
                      <div className="text-6xl font-bold text-blue-400 mb-4 font-mono">
                          ¥{Math.round(result.totalPool).toLocaleString()}
                      </div>
                      <div className="text-xl text-blue-300">包含基础分与修正积分池</div>
                  </div>
              </div>
          </div>
      </div>
  );


  // --- Main View (Non-Fullscreen) ---
  if (!isFullscreen) {
      return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">模拟沙箱</h1>
                    <p className="text-slate-500">调整参数以预测薪酬变化，或启动车间展示模式。</p>
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
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm" style={{height: 400}}>
                    <h3 className="font-bold text-slate-700 mb-4">模拟结果预览</h3>
                      <ResponsiveContainer width="100%" height={350}>
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
                            <div className="text-sm text-slate-500 mb-1">总薪酬包</div>
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
                        {currentTime.toLocaleDateString()} {['周日','周一','周二','周三','周四','周五','周六'][currentTime.getDay()]}
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

              <div 
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${slideIndex === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                style={{ willChange: 'opacity' }}
              >
                <SlideOverview />
              </div>
              <div 
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${slideIndex === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                style={{ willChange: 'opacity' }}
              >
                <SlideLeaderboard />
              </div>
              <div 
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${slideIndex === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                style={{ willChange: 'opacity' }}
              >
                <SlideDistribution />
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
                                <span className="flex items-center gap-2"><Activity size={24} className="text-emerald-500"/> 安全生产，重在预防。进入车间请务必穿戴好劳保用品。</span>
                                <span className="flex items-center gap-2"><TrendingUp size={24} className="text-amber-500"/> 本月产量冲刺目标：45,000米，当前进度 82%。</span>
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
