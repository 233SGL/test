import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarDays, AlertCircle, Wand2, Trash2 } from 'lucide-react';

export const Attendance: React.FC = () => {
    const { currentData, currentDate, setCurrentDate, updateDailyLog, autoFillAttendance, clearAllAttendance, isSaving, employees } = useData();
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

    // Filter out terminated employees
    const activeRecords = useMemo(() => {
        return currentData.records.filter(record => {
            const emp = employees.find(e => e.id === record.employeeId);
            return emp && emp.status !== 'terminated';
        });
    }, [currentData.records, employees]);

    // Helper to check if a day is weekend (Visual cue)
    const isWeekend = (d: number) => {
        const dayOfWeek = new Date(currentDate.year, currentDate.month - 1, d).getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
    };

    const isSunday = (d: number) => {
        return new Date(currentDate.year, currentDate.month - 1, d).getDay() === 0;
    };

    const handleAutoFill = () => {
        if (confirm('确定要使用智能填充吗？\n\n- 将根据员工设定的"每日标准工时"填充所有空白。\n- 周日将自动留空。\n- 现有数据将被覆盖。')) {
            autoFillAttendance();
        }
    };

    const handleClearAll = async () => {
        if (confirm('⚠️ 确定要清除当月所有工时记录吗？\n\n此操作将清空所有员工的工时数据，不可恢复！')) {
            try {
                await clearAllAttendance();
            } catch (error) {
                console.error('清除工时数据失败:', error);
                alert('清除失败，请重试');
            }
        }
    };

    return (
        <div className="h-full flex flex-col space-y-5 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-primary-100 text-primary-600">
                            <CalendarDays size={22} />
                        </div>
                        每日工时记录
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">工段长/行政专用：记录每日员工出勤工时 (精确到0.5小时)</p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                    {canEdit && (
                        <>
                            <button
                                onClick={handleAutoFill}
                                disabled={isSaving}
                                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Wand2 size={16} /> 智能填充
                            </button>
                            <button
                                onClick={handleClearAll}
                                disabled={isSaving}
                                className="btn-danger flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trash2 size={16} /> 一键清除
                            </button>
                        </>
                    )}

                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2">
                            <label htmlFor="attendance-year" className="text-sm font-semibold text-slate-600">年份</label>
                            <select
                                id="attendance-year"
                                className="input py-1.5 px-3 text-sm min-w-[90px]"
                                value={currentDate.year}
                                onChange={(e) => setCurrentDate({ ...currentDate, year: parseInt(e.target.value) })}
                            >
                                {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
                            </select>
                        </div>
                        <div className="w-px h-6 bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="attendance-month" className="text-sm font-semibold text-slate-600">月份</label>
                            <select
                                id="attendance-month"
                                className="input py-1.5 px-3 text-sm min-w-[80px]"
                                value={currentDate.month}
                                onChange={(e) => setCurrentDate({ ...currentDate, month: parseInt(e.target.value) })}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}月</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {!canEdit && (
                <div className="bg-amber-50 text-amber-800 px-4 py-3 rounded-xl border border-amber-200 flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-100">
                        <AlertCircle size={18} />
                    </div>
                    <span className="font-medium">您当前只有查看权限，无法修改工时。</span>
                </div>
            )}

            {/* Grid */}
            <div className="flex-1 card overflow-hidden flex flex-col">
                <div className="overflow-auto custom-scrollbar flex-1 relative">
                    <table className="w-full text-sm border-collapse table-fixed">
                        <thead className="bg-slate-50/80 text-slate-600 sticky top-0 z-20">
                            <tr>
                                <th className="sticky left-0 z-30 bg-slate-50 px-4 py-3.5 border-b border-r border-slate-200 w-[120px] text-left font-semibold">姓名</th>
                                <th className="sticky left-[120px] z-30 bg-primary-50 px-4 py-3.5 border-b border-r-2 border-primary-200 w-[80px] text-center font-bold text-primary-700">合计</th>
                                {daysArray.map(d => (
                                    <th
                                        key={d}
                                        className={`px-1 py-3.5 border-b border-slate-200 w-12 min-w-[3rem] text-center font-medium ${isSunday(d) ? 'bg-rose-50 text-rose-600 font-bold' : isWeekend(d) ? 'bg-slate-100/80 text-slate-500' : ''}`}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm">{d}</span>
                                            <span className="text-[10px] font-normal opacity-70">{['日', '一', '二', '三', '四', '五', '六'][new Date(currentDate.year, currentDate.month - 1, d).getDay()]}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {activeRecords.map(emp => (
                                <tr key={emp.employeeId} className="hover:bg-primary-50/30 group transition-colors">
                                    {/* Sticky Name Col */}
                                    <td className="sticky left-0 z-10 bg-white group-hover:bg-primary-50/30 px-4 py-2.5 border-r border-b border-slate-100 font-medium text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis w-[120px] transition-colors">
                                        {emp.employeeName}
                                    </td>
                                    {/* Sticky Total Col */}
                                    <td className="sticky left-[120px] z-10 bg-primary-50/50 group-hover:bg-primary-100/50 px-2 py-2.5 border-r-2 border-b border-primary-200 text-center font-bold text-primary-600 w-[80px] tabular-nums transition-colors">
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
                                                    aria-label={`${emp.employeeName} ${d}日工时`}
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
