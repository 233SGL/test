/**
 * 定型工段 - 数据大盘页面
 * 
 * 展示月度积分概览、员工积分分布图表和考核指标详情
 * 设计规范: UI_UX_DESIGN_SPEC_V2.md
 */
import React from 'react';
import { useData } from '../../contexts/DataContext';
import { calculateSalary } from '../../services/calcService';
import { MetricCard } from '../../components/MetricCard';
import { Award, Users, TrendingUp, Package, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
    <div className="space-y-8 animate-fade-in-up">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">数据大盘</h1>
          <p className="text-slate-500 mt-1">
            {currentDate.year}年{currentDate.month}月 积分概览
          </p>
        </div>
      </div>

      {/* 指标卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="总积分池"
          value={Math.round(result.totalPool).toLocaleString()}
          icon={Award}
          color="indigo"
          subtitle="固定积分包 + KPI分"
        />
        <MetricCard
          label="修正积分池"
          value={`${Math.round(result.bonusPool).toLocaleString()}分`}
          icon={TrendingUp}
          color="emerald"
          subtitle="实际产出修正"
        />
        <MetricCard
          label="本月入库量"
          value={`${currentData.params.area.toLocaleString()} m²`}
          icon={Package}
          color="sky"
        />
        <MetricCard
          label="在册员工"
          value={result.records.length}
          icon={Users}
          color="amber"
          subtitle="参与积分计算"
        />
      </div>

      {/* 主图表区 */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">员工积分构成分布</h3>
          <p className="text-sm text-slate-500 mt-0.5">基础分 + 修正积分堆叠图</p>
        </div>
        <div className="p-6">
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`} 
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  formatter={(val: number, name: string) => [
                    `${val.toLocaleString()}分`, 
                    name === 'base' ? '实得基础分' : '修正积分'
                  ]}
                  labelStyle={{ fontWeight: 600, color: '#334155' }}
                />
                <Legend 
                  formatter={(value) => value === 'base' ? '实得基础分' : '修正积分'}
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <Bar 
                  dataKey="base" 
                  stackId="a" 
                  fill="#94a3b8" 
                  name="base" 
                  radius={[0, 0, 4, 4]} 
                  isAnimationActive={false} 
                />
                <Bar 
                  dataKey="bonus" 
                  stackId="a" 
                  fill="#6366f1" 
                  name="bonus" 
                  radius={[4, 4, 0, 0]} 
                  isAnimationActive={false} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 双列详情区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 考核指标详情 */}
        <div className="card">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">考核指标详情</h3>
          </div>
          <div className="p-6">
            <div className="space-y-1">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600">固定积分包</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {currentData.params.attendancePack.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600">KPI 考核分</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {currentData.params.kpiScore.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600">基础分支出占比</span>
                <span className="font-semibold text-slate-700 tabular-nums">
                  {result.totalPool > 0 
                    ? ((result.totalBasePayout / result.totalPool) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-slate-600">修正积分池占比</span>
                <span className="font-bold text-indigo-600 tabular-nums">
                  {result.totalPool > 0 
                    ? ((result.bonusPool / result.totalPool) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 权重设置 */}
        <div className="card">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">权重设置现状</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {/* 工时权重 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-amber-600">工时权重</span>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">
                    {currentData.params.weightTime}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-amber-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${currentData.params.weightTime}%` }}
                  />
                </div>
              </div>
              
              {/* 基础分权重 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-purple-600">基础分权重</span>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">
                    {currentData.params.weightBase}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-400 to-purple-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${currentData.params.weightBase}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* 提示信息 */}
            <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex gap-2 text-xs text-slate-500">
                <Info size={14} className="flex-shrink-0 mt-0.5" />
                <span>
                  权重决定了修正积分池分配的倾向性。工时权重高倾向于"多劳多得"，基础分权重高倾向于"技能/资历"。
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
