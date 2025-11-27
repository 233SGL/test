
import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { calculateSalary } from '../services/calcService';
import { Download, RefreshCw, Calculator, TrendingUp, DollarSign, Activity, PieChart } from 'lucide-react';
import * as XLSX from 'xlsx';

export const SalaryCalculator: React.FC = () => {
  const { currentData, updateRecord, currentDate, setCurrentDate, resetMonthData } = useData();
  const { hasPermission } = useAuth();
  
  const result = calculateSalary(currentData);

  const canEditHours = hasPermission('EDIT_HOURS');
  const canEditBase = hasPermission('EDIT_BASE_SCORE');

  // Dynamic Year Range: Current Year +/- 5 Years
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const start = currentYear - 5;
    return Array.from({ length: 11 }, (_, i) => start + i);
  }, []);

  const exportExcel = () => {
    const wsData = [
      ["姓名", "工时", "应出勤", "工时占比", "标准分", "实得基础分", "基础占比", "综合权重", "分红奖金", "总分"],
      ...result.records.map(r => [
        r.employeeName,
        r.workHours,
        r.expectedHours,
        (r.workRatio * 100).toFixed(2) + '%',
        r.baseScoreSnapshot,
        r.realBase.toFixed(0),
        (r.baseRatio * 100).toFixed(2) + '%',
        (r.compositeWeight * 100).toFixed(2) + '%',
        r.bonus.toFixed(2),
        r.finalScore.toFixed(2)
      ]),
      ["合计", result.sumWorkHours, result.sumExpectedHours, "100%", result.sumStandardBase, result.totalBasePayout, "100%", "100%", result.bonusPool.toFixed(2), (result.totalBasePayout + result.bonusPool).toFixed(2)]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "工资表");
    XLSX.writeFile(wb, `工资表_${currentDate.year}_${currentDate.month}.xlsx`);
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="text-accent" /> 薪酬计算
          </h1>
          <p className="text-slate-500">当前计算月份：{currentDate.year}年{currentDate.month}月</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-600">年份</span>
            <select 
                className="border border-slate-300 rounded-md px-2 py-1 text-sm bg-slate-50 focus:ring-2 focus:ring-accent outline-none"
                value={currentDate.year}
                onChange={(e) => setCurrentDate({ ...currentDate, year: parseInt(e.target.value) })}
            >
                {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
            </select>
            </div>
            <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-600">月份</span>
            <select 
                className="border border-slate-300 rounded-md px-2 py-1 text-sm bg-slate-50 focus:ring-2 focus:ring-accent outline-none"
                value={currentDate.month}
                onChange={(e) => setCurrentDate({ ...currentDate, month: parseInt(e.target.value) })}
            >
                {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}月</option>)}
            </select>
            </div>
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            <button onClick={resetMonthData} className="text-slate-500 hover:text-blue-600 transition" title="重置本月数据">
                <RefreshCw size={18} />
            </button>
             <button onClick={exportExcel} className="text-emerald-600 hover:text-emerald-700 transition" title="导出Excel">
                <Download size={18} />
            </button>
        </div>
      </div>

      {/* Read-Only Summary Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><TrendingUp size={20}/></div>
              <div>
                  <div className="text-xs text-slate-500 font-bold uppercase">入库量</div>
                  <div className="font-mono font-bold text-lg">{currentData.params.area.toLocaleString()}</div>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><DollarSign size={20}/></div>
              <div>
                  <div className="text-xs text-slate-500 font-bold uppercase">单价</div>
                  <div className="font-mono font-bold text-lg">{currentData.params.unitPrice}</div>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Activity size={20}/></div>
              <div>
                  <div className="text-xs text-slate-500 font-bold uppercase">KPI</div>
                  <div className="font-mono font-bold text-lg">{currentData.params.kpiScore}</div>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><PieChart size={20}/></div>
              <div>
                  <div className="text-xs text-slate-500 font-bold uppercase">权重分配</div>
                  <div className="font-mono font-bold text-lg text-slate-700">
                      <span className="text-amber-600">{currentData.params.weightTime}</span>
                      <span className="text-slate-300 px-1">/</span>
                      <span className="text-purple-600">{currentData.params.weightBase}</span>
                  </div>
              </div>
          </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto custom-scrollbar flex-1">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                        <th className="px-4 py-3">姓名</th>
                        <th className="px-4 py-3 w-24 text-center">工时</th>
                        <th className="px-4 py-3 w-24 text-center">应出勤</th>
                        <th className="px-4 py-3 text-center text-xs text-slate-400">工时占比</th>
                        <th className="px-4 py-3 w-28 text-center">标准分</th>
                        <th className="px-4 py-3 text-center font-bold text-slate-700">实得基础分</th>
                        <th className="px-4 py-3 text-center text-xs text-slate-400">基础占比</th>
                        <th className="px-4 py-3 text-center font-bold text-purple-600 bg-purple-50/50">综合权重</th>
                        <th className="px-4 py-3 text-center font-bold text-accent bg-blue-50/50">分红奖金</th>
                        <th className="px-4 py-3 text-center font-bold text-emerald-700 bg-emerald-50/50">总分</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {result.records.map(record => (
                        <tr key={record.employeeId} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2 font-medium text-slate-700">{record.employeeName}</td>
                            <td className="px-2 py-2 text-center">
                                <input 
                                    type="number"
                                    step="0.5"
                                    disabled={!canEditHours}
                                    className="w-full text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-accent focus:outline-none transition-colors disabled:text-slate-500"
                                    value={record.workHours}
                                    onChange={e => updateRecord(record.employeeId, { workHours: parseFloat(e.target.value) || 0 })}
                                />
                            </td>
                            <td className="px-2 py-2 text-center text-slate-500 font-mono">
                                {record.expectedHours}
                            </td>
                            <td className="px-4 py-2 text-center text-slate-400 text-xs">{(record.workRatio * 100).toFixed(2)}%</td>
                            <td className="px-2 py-2 text-center">
                                <input 
                                    type="number"
                                    disabled={!canEditBase}
                                    className="w-full text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-accent focus:outline-none transition-colors disabled:text-slate-500"
                                    value={record.baseScoreSnapshot}
                                    onChange={e => updateRecord(record.employeeId, { baseScoreSnapshot: parseFloat(e.target.value) || 0 })}
                                />
                            </td>
                            <td className="px-4 py-2 text-center font-mono font-medium">{record.realBase.toFixed(0)}</td>
                            <td className="px-4 py-2 text-center text-slate-400 text-xs">{(record.baseRatio * 100).toFixed(2)}%</td>
                            <td className="px-4 py-2 text-center font-mono font-bold text-purple-600 bg-purple-50/30">{(record.compositeWeight * 100).toFixed(2)}%</td>
                            <td className="px-4 py-2 text-center font-mono font-bold text-accent bg-blue-50/30">{record.bonus.toFixed(2)}</td>
                            <td className="px-4 py-2 text-center font-mono font-bold text-emerald-600 bg-emerald-50/30">{record.finalScore.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-slate-700 border-t border-slate-300 sticky bottom-0 z-10">
                    <tr>
                        <td className="px-4 py-3">合计</td>
                        <td className="px-4 py-3 text-center">{result.sumWorkHours}</td>
                        <td className="px-4 py-3 text-center">{result.sumExpectedHours}</td>
                        <td className="px-4 py-3 text-center text-xs">100%</td>
                        <td className="px-4 py-3 text-center">{result.sumStandardBase}</td>
                        <td className="px-4 py-3 text-center">{result.totalBasePayout.toFixed(0)}</td>
                        <td className="px-4 py-3 text-center text-xs">100%</td>
                        <td className="px-4 py-3 text-center text-purple-700">100%</td>
                        <td className="px-4 py-3 text-center text-accent">{result.bonusPool.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center text-emerald-700">{(result.totalBasePayout + result.bonusPool).toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
      </div>
    </div>
  );
};
