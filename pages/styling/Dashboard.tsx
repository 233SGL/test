import React from 'react';
import { useData } from '../../contexts/DataContext';
import { calculateSalary } from '../../services/calcService';
import { MetricCard } from '../../components/MetricCard';
import { Coins, Users, TrendingUp, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const { currentData, currentDate, employees } = useData();
  const result = calculateSalary(currentData, employees);

  const chartData = result.records.map(r => ({
    name: r.employeeName,
    base: Math.round(r.realBase),
    bonus: Math.round(r.bonus),
    total: Math.round(r.finalScore)
  })).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">数据大盘</h1>
          <p className="text-slate-500">{currentDate.year}年{currentDate.month}月 薪酬概览</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="本月总薪酬包" 
          value={`¥${Math.round(result.totalPool).toLocaleString()}`} 
          icon={Coins} 
          color="indigo"
        />
        <MetricCard 
          label="实际产出修正积分" 
          value={`¥${Math.round(result.bonusPool).toLocaleString()}`} 
          icon={TrendingUp} 
          color="emerald"
        />
        <MetricCard 
          label="本月入库量" 
          value={`${currentData.params.area.toLocaleString()} m²`} 
          icon={Package} 
          color="blue"
        />
        <MetricCard 
          label="在册员工" 
          value={result.records.length} 
          icon={Users} 
          color="amber"
        />
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">员工薪资构成分布 (基础分 + 修正积分)</h3>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `¥${value}`} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: number) => [`¥${val}`, '']}
                animationDuration={0}
              />
              <Bar dataKey="base" stackId="a" fill="#94a3b8" name="实得基础分" radius={[0, 0, 4, 4]} isAnimationActive={false} />
              <Bar dataKey="bonus" stackId="a" fill="#0ea5e9" name="修正积分" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Stats Panel 1 */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">考核指标详情</h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500">固定积分包</span>
                    <span className="font-semibold">{currentData.params.attendancePack}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500">KPI 考核分</span>
                    <span className="font-semibold">{currentData.params.kpiScore}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500">基础分支出占比</span>
                    <span className="font-semibold text-slate-700">
                        {result.totalPool > 0 ? ((result.totalBasePayout / result.totalPool) * 100).toFixed(1) : 0}%
                    </span>
                </div>
                <div className="flex justify-between items-center pb-2">
                    <span className="text-slate-500">修正积分池占比</span>
                    <span className="font-bold text-accent">
                        {result.totalPool > 0 ? ((result.bonusPool / result.totalPool) * 100).toFixed(1) : 0}%
                    </span>
                </div>
            </div>
         </div>

         {/* Stats Panel 2 */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 mb-4">权重设置现状</h3>
             <div className="flex items-center gap-8 h-40">
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-amber-600">工时权重</span>
                        <span>{currentData.params.weightTime}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                        <div className="bg-amber-500 h-3 rounded-full" style={{ width: `${currentData.params.weightTime}%` }}></div>
                    </div>
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-purple-600">基础分权重</span>
                        <span>{currentData.params.weightBase}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                        <div className="bg-purple-500 h-3 rounded-full" style={{ width: `${currentData.params.weightBase}%` }}></div>
                    </div>
                </div>
             </div>
             <p className="text-xs text-slate-400 mt-2">
                * 权重决定了修正积分池分配的倾向性。工时权重高倾向于“多劳多得”，基础分权重高倾向于“技能/资历”。
             </p>
         </div>
      </div>
    </div>
  );
};
