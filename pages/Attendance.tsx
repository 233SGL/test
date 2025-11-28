import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { CalendarDays, AlertCircle, Wand2 } from 'lucide-react';

export const Attendance: React.FC = () => {
  const { currentData, currentDate, setCurrentDate, updateDailyLog, autoFillAttendance, isSaving } = useData();
  const { hasPermission } = useAuth();

  const canEdit = hasPermission('EDIT_HOURS');

  // Dynamic Year Range: Current Year +/- 5 Years
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const start = currentYear - 5;
    return Array.from({ length: 11 }, (_, i) => start + i);
  }, []);

  // Calculate days in the selected month
  const daysInMonth = useMemo(() => {
    return new Date(currentDate.year, currentDate.month, 0).getDate();
  }, [currentDate.year, currentDate.month]);

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Helper to check if a day is weekend (Visual cue)
  const isWeekend = (d: number) => {
    const dayOfWeek = new Date(currentDate.year, currentDate.month - 1, d).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const isSunday = (d: number) => {
      return new Date(currentDate.year, currentDate.month - 1, d).getDay() === 0;
  };

  const handleAutoFill = () => {
      if (confirm('确定要使用智能填充吗？\n\n- 将根据员工设定的“每日标准工时”填充所有空白。\n- 周日将自动留空。\n- 现有数据将被覆盖。')) {
          autoFillAttendance();
      }
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="text-accent" /> 每日工时记录
          </h1>
          <p className="text-slate-500">工段长/行政专用：记录每日员工出勤工时 (精确到0.5小时)</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
             {canEdit && (
                <button 
                    onClick={handleAutoFill}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition font-medium text-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                    <Wand2 size={16} /> 智能填充
                </button>
             )}

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
            </div>
        </div>
      </div>
      
      {!canEdit && (
         <div className="bg-amber-50 text-amber-800 px-4 py-3 rounded-lg border border-amber-200 flex items-center gap-2">
            <AlertCircle size={18} />
            <span>您当前只有查看权限，无法修改工时。</span>
         </div>
      )}

      {/* Grid */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto custom-scrollbar flex-1 relative">
            <table className="w-full text-sm border-collapse table-fixed">
                <thead className="bg-slate-50 text-slate-500 sticky top-0 z-20 shadow-sm">
                    <tr>
                        <th className="sticky left-0 z-30 bg-slate-50 px-4 py-3 border-b border-r border-slate-200 w-[120px] text-left">姓名</th>
                        <th className="sticky left-[120px] z-30 bg-slate-50 px-4 py-3 border-b border-r-2 border-slate-300 w-[80px] text-center font-bold text-slate-700 shadow-sm">合计</th>
                        {daysArray.map(d => (
                            <th 
                                key={d} 
                                className={`px-1 py-3 border-b border-slate-200 w-12 min-w-[3rem] text-center font-medium ${isSunday(d) ? 'bg-rose-100 text-rose-600 font-bold' : isWeekend(d) ? 'bg-slate-100 text-slate-500' : ''}`}
                            >
                                <div className="flex flex-col items-center">
                                    <span>{d}</span>
                                    <span className="text-[10px] font-normal">{['日','一','二','三','四','五','六'][new Date(currentDate.year, currentDate.month-1, d).getDay()]}</span>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {currentData.records.map(emp => (
                        <tr key={emp.employeeId} className="hover:bg-slate-50 group">
                            {/* Sticky Name Col */}
                            <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-4 py-2 border-r border-b border-slate-100 font-medium text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis w-[120px]">
                                {emp.employeeName}
                            </td>
                             {/* Sticky Total Col */}
                            <td className="sticky left-[120px] z-10 bg-blue-50/50 group-hover:bg-blue-100/50 px-2 py-2 border-r-2 border-b border-slate-300 text-center font-bold text-accent w-[80px]">
                                {emp.workHours || 0}
                            </td>
                            {/* Daily Cells */}
                            {daysArray.map(d => {
                                // IMPORTANT: Use empty string for 0 to avoid leading zero issue
                                const rawVal = emp.dailyLogs?.[d];
                                const displayVal = (rawVal === 0 || rawVal === undefined) ? '' : rawVal;
                                
                                const isSun = isSunday(d);
                                const isWk = isWeekend(d);
                                return (
                                    <td key={d} className={`border-b border-slate-100 p-0 ${isSun ? 'bg-rose-50/50' : isWk ? 'bg-slate-50/50' : ''}`}>
                                        <input 
                                            type="number"
                                            step="0.5" 
                                            disabled={!canEdit}
                                            value={displayVal}
                                            onChange={(e) => {
                                                const v = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                updateDailyLog(emp.employeeId, d, v);
                                            }}
                                            className={`w-full h-10 text-center bg-transparent focus:bg-blue-100 focus:text-blue-700 focus:font-bold focus:outline-none transition-colors ${displayVal ? 'text-slate-800 font-medium' : 'text-slate-300'}`}
                                            placeholder={isSun ? '' : '-'}
                                        />
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
