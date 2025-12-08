import React from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Factory, ShieldAlert, TrendingUp, Award, Activity, Settings2 } from 'lucide-react';

export const ProductionData: React.FC = () => {
  const { currentData, updateParams } = useData();
  const { hasPermission } = useAuth();

  // Permissions
  const canEditYield = hasPermission('EDIT_YIELD');
  const canEditUnitPrice = hasPermission('EDIT_UNIT_PRICE');
  const canEditFixedPack = hasPermission('EDIT_FIXED_PACK');
  const canEditKPI = hasPermission('EDIT_KPI');
  const canEditWeights = hasPermission('EDIT_WEIGHTS');
  
  const hasAccess = canEditYield || canEditUnitPrice || canEditFixedPack || canEditKPI || canEditWeights;

  if (!hasAccess) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <ShieldAlert size={48} className="mb-4" />
            <h2 className="text-xl font-semibold">权限不足：此页面仅限核心生产管理人员访问</h2>
        </div>
    );
  }

  const handleWeightChange = (type: 'time' | 'base', val: string) => {
    let v = parseInt(val) || 0;
    if (v > 100) v = 100;
    if (v < 0) v = 0;
    
    if (type === 'time') {
      updateParams({ weightTime: v, weightBase: 100 - v });
    } else {
      updateParams({ weightBase: v, weightTime: 100 - v });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-100 text-primary-600">
                <Factory size={22} />
            </div>
            生产数据录入
        </h1>
        <p className="text-slate-500 mt-1 text-sm">核心参数配置：入库量、KPI指标与积分权重</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Yield Section */}
        <div className="card card-hover">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600 rounded-xl shadow-sm">
                    <TrendingUp size={22} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">产量与入库</h3>
                    <p className="text-xs text-slate-500">定型工段本月总入库数据</p>
                </div>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">本月入库量 (m²)</label>
                    <input 
                        type="number" 
                        disabled={!canEditYield}
                        value={currentData.params.area}
                        onChange={e => updateParams({ area: parseFloat(e.target.value) || 0 })}
                        className="input text-2xl font-mono tabular-nums py-3 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                </div>
                <div className="bg-primary-50 p-4 rounded-xl text-sm text-primary-700 border border-primary-100">
                    <span className="font-bold">提示：</span> 入库量直接决定总积分包大小，请核对后录入。
                </div>
            </div>
        </div>

        {/* Financial Section */}
        <div className="card card-hover">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 rounded-xl shadow-sm">
                    <Award size={22} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">单价与定分</h3>
                    <p className="text-xs text-slate-500">积分值及固定积分包设定</p>
                </div>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">单价 (分/m²)</label>
                    <input 
                        type="number" 
                        disabled={!canEditUnitPrice}
                        value={currentData.params.unitPrice}
                        onChange={e => updateParams({ unitPrice: parseFloat(e.target.value) || 0 })}
                        className="input text-2xl font-mono tabular-nums py-3 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">固定积分包 (Adjustment)</label>
                    <input 
                        type="number" 
                        disabled={!canEditFixedPack}
                        value={currentData.params.attendancePack}
                        onChange={e => updateParams({ attendancePack: parseFloat(e.target.value) || 0 })}
                        className="input text-lg font-mono tabular-nums py-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                </div>
            </div>
        </div>

        {/* KPI Section */}
        <div className="card card-hover">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 rounded-xl shadow-sm">
                    <Activity size={22} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">KPI 考核</h3>
                    <p className="text-xs text-slate-500">质量与安全考核得分</p>
                </div>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">KPI 考核分 (Score)</label>
                    <input 
                        type="number" 
                        disabled={!canEditKPI}
                        value={currentData.params.kpiScore}
                        onChange={e => updateParams({ kpiScore: parseFloat(e.target.value) || 0 })}
                        className="input text-2xl font-mono tabular-nums py-3 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                </div>
            </div>
        </div>

        {/* Weights Section */}
        <div className="card card-hover">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-gradient-to-br from-violet-100 to-violet-50 text-violet-600 rounded-xl shadow-sm">
                    <Settings2 size={22} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">分配权重</h3>
                    <p className="text-xs text-slate-500">调节修正积分池分配倾向</p>
                </div>
            </div>
            
            <div className={`p-6 rounded-xl border-2 transition-all ${canEditWeights ? 'border-violet-200 bg-gradient-to-br from-violet-50/80 to-violet-50/30' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="text-center w-1/3">
                         <div className="text-sm font-bold text-amber-600 mb-2">工时权重</div>
                         <input 
                            type="number" 
                            disabled={!canEditWeights}
                            value={currentData.params.weightTime}
                            onChange={e => handleWeightChange('time', e.target.value)}
                            className="w-full text-center text-3xl font-bold bg-white border-2 border-amber-200 rounded-xl py-2 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-400 outline-none tabular-nums transition-all"
                         />
                    </div>
                    <div className="text-2xl font-bold text-slate-300">+</div>
                    <div className="text-center w-1/3">
                         <div className="text-sm font-bold text-violet-600 mb-2">基础分权重</div>
                         <input 
                            type="number" 
                            disabled={!canEditWeights}
                            value={currentData.params.weightBase}
                            onChange={e => handleWeightChange('base', e.target.value)}
                            className="w-full text-center text-3xl font-bold bg-white border-2 border-violet-200 rounded-xl py-2 focus:ring-4 focus:ring-violet-500/20 focus:border-violet-400 outline-none tabular-nums transition-all"
                         />
                    </div>
                </div>
                <input 
                    type="range" min="0" max="100"
                    disabled={!canEditWeights}
                    value={currentData.params.weightTime}
                    onChange={e => handleWeightChange('time', e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-violet-600"
                />
            </div>
        </div>
      </div>
    </div>
  );
};
