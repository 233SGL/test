/**
 * ========================================
 * 织造工段 - 数据录入页面
 * ========================================
 * 
 * 录入当月织造工段生产数据，包括：
 * - 基本指标录入（成网率、运转率等）
 * - 机台产量录入（支持按机台逐一录入）
 * - 等效产量自动计算
 * 
 * @module pages/weaving/DataEntry
 */
import React, { useState, useMemo } from 'react';
import { 
    Database, Calculator, Factory, Save, RefreshCw,
    ChevronDown, ChevronUp, AlertCircle, CheckCircle2
} from 'lucide-react';
import { WeavingMonthlyData, DEFAULT_MACHINES, DEFAULT_WEAVING_CONFIG } from '../../weavingTypes';
import { 
    MachineProductionData, 
    calculateTotalEquivalent,
    calculateOutputCoefficient,
    calculateWidthCoefficient,
    getSpeedCoefficient
} from '../../services/weavingCalcService';

// 机台产量输入组件
interface MachineInputProps {
    machine: typeof DEFAULT_MACHINES[0];
    data: MachineProductionData;
    onChange: (data: MachineProductionData) => void;
    isExpanded: boolean;
    onToggle: () => void;
}

const MachineInput: React.FC<MachineInputProps> = ({ 
    machine, data, onChange, isExpanded, onToggle 
}) => {
    const outputCoef = calculateOutputCoefficient(data.weftDensity);
    const widthCoef = calculateWidthCoefficient(data.machineWidth);
    const speedCoef = getSpeedCoefficient(data.speedType);
    const equivalentOutput = data.actualOutput * outputCoef * widthCoef * speedCoef;

    return (
        <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
            data.actualOutput > 0 ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'
        }`}>
            {/* 机台标题栏 */}
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                        data.actualOutput > 0 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-100 text-slate-600'
                    }`}>
                        {machine.id}
                    </div>
                    <div className="text-left">
                        <div className="font-medium text-slate-800">{machine.name}</div>
                        <div className="text-xs text-slate-500">
                            {machine.speedType} · {machine.width}m · 目标 {machine.targetOutput}㎡
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {data.actualOutput > 0 && (
                        <div className="text-right">
                            <div className="text-sm font-semibold text-emerald-600 tabular-nums">
                                {equivalentOutput.toFixed(0)} ㎡
                            </div>
                            <div className="text-xs text-slate-400">等效产量</div>
                        </div>
                    )}
                    {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
            </button>

            {/* 展开的详细输入 */}
            {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-white animate-fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                实际产量 (㎡)
                            </label>
                            <input
                                type="number"
                                value={data.actualOutput || ''}
                                onChange={(e) => onChange({ 
                                    ...data, 
                                    actualOutput: parseFloat(e.target.value) || 0 
                                })}
                                className="input text-sm"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                纬密 (根/cm)
                            </label>
                            <input
                                type="number"
                                value={data.weftDensity || ''}
                                onChange={(e) => onChange({ 
                                    ...data, 
                                    weftDensity: parseFloat(e.target.value) || 0 
                                })}
                                className="input text-sm"
                                placeholder="基准: 13"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                机台宽度 (m)
                            </label>
                            <input
                                type="number"
                                value={data.machineWidth || ''}
                                onChange={(e) => onChange({ 
                                    ...data, 
                                    machineWidth: parseFloat(e.target.value) || 0 
                                })}
                                className="input text-sm"
                                placeholder="默认: 8.5"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                速度类型
                            </label>
                            <select
                                value={data.speedType}
                                onChange={(e) => onChange({ 
                                    ...data, 
                                    speedType: e.target.value as 'H2' | 'H5' 
                                })}
                                className="input text-sm"
                            >
                                <option value="H2">H2 高速 (系数1.0)</option>
                                <option value="H5">H5 低速 (系数0.56)</option>
                            </select>
                        </div>
                    </div>

                    {/* 系数展示 */}
                    {data.actualOutput > 0 && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">
                                    等效 = {data.actualOutput} × {outputCoef.toFixed(2)} × {widthCoef.toFixed(2)} × {speedCoef}
                                </span>
                                <span className="font-bold text-primary-600">
                                    = {equivalentOutput.toFixed(2)} ㎡
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const DataEntry = () => {
    // 基础月度数据
    const [monthlyData, setMonthlyData] = useState<WeavingMonthlyData>({
        netFormationRate: 75,
        equivalentOutput: 0,
        activeMachines: 10,
        actualOperators: 17,
        operationRate: 78,
        attendanceDays: 26,
    });

    // 各机台产量数据
    const [machineData, setMachineData] = useState<MachineProductionData[]>(
        DEFAULT_MACHINES.map(m => ({
            machineId: m.id,
            actualOutput: 0,
            weftDensity: 13,
            machineWidth: m.width,
            speedType: m.speedType
        }))
    );

    // 展开状态
    const [expandedMachines, setExpandedMachines] = useState<Set<string>>(new Set(['H1']));
    const [showMachineInput, setShowMachineInput] = useState(true);

    // 计算总等效产量
    const { totalEquivalent, machineResults } = useMemo(() => {
        return calculateTotalEquivalent(machineData.filter(m => m.actualOutput > 0));
    }, [machineData]);

    // 更新机台数据
    const handleMachineChange = (machineId: string, data: MachineProductionData) => {
        setMachineData(prev => prev.map(m => 
            m.machineId === machineId ? data : m
        ));
    };

    // 切换展开状态
    const toggleExpand = (machineId: string) => {
        setExpandedMachines(prev => {
            const next = new Set(prev);
            if (next.has(machineId)) {
                next.delete(machineId);
            } else {
                next.add(machineId);
            }
            return next;
        });
    };

    // 同步等效产量到月度数据
    const syncEquivalentOutput = () => {
        setMonthlyData(prev => ({ ...prev, equivalentOutput: totalEquivalent }));
    };

    // 统计已录入机台数
    const enteredMachineCount = machineData.filter(m => m.actualOutput > 0).length;

    return (
        <div className="h-full flex flex-col animate-fade-in-up">
            {/* 页面头部 */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600 shadow-sm">
                        <Database size={24} />
                    </div>
                    织造工段 - 数据录入
                </h1>
                <p className="text-slate-500 text-sm">
                    录入当月织造工段生产数据和各机台产量
                </p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 space-y-6">
                {/* ===== 基础指标录入 ===== */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Calculator size={18} className="text-slate-500" />
                            基础指标录入
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    当月织造成网率 (%)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={monthlyData.netFormationRate || ''}
                                        onChange={(e) => setMonthlyData(prev => ({
                                            ...prev,
                                            netFormationRate: parseFloat(e.target.value) || 0
                                        }))}
                                        className="input pr-8"
                                        placeholder="例如: 75"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                </div>
                                <p className="mt-1 text-xs text-slate-400">基准: {DEFAULT_WEAVING_CONFIG.netFormationBenchmark}%</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    当月织机运转率 (%)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={monthlyData.operationRate || ''}
                                        onChange={(e) => setMonthlyData(prev => ({
                                            ...prev,
                                            operationRate: parseFloat(e.target.value) || 0
                                        }))}
                                        className="input pr-8"
                                        placeholder="例如: 78"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                </div>
                                <p className="mt-1 text-xs text-slate-400">基准: {DEFAULT_WEAVING_CONFIG.operationRateBenchmark}%</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    当月等效产量 (㎡)
                                </label>
                                <div className="relative flex gap-2">
                                    <input
                                        type="number"
                                        value={monthlyData.equivalentOutput || ''}
                                        onChange={(e) => setMonthlyData(prev => ({
                                            ...prev,
                                            equivalentOutput: parseFloat(e.target.value) || 0
                                        }))}
                                        className="input flex-1"
                                        placeholder="可由机台产量自动计算"
                                    />
                                    <button
                                        onClick={syncEquivalentOutput}
                                        className="px-3 py-2 bg-primary-50 text-primary-600 rounded-xl border border-primary-200 hover:bg-primary-100 transition-all duration-200"
                                        title="从机台产量同步"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                                {totalEquivalent > 0 && monthlyData.equivalentOutput !== totalEquivalent && (
                                    <p className="mt-1 text-xs text-amber-600">
                                        机台合计: {totalEquivalent.toFixed(0)} ㎡，点击同步按钮更新
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    有效机台总数
                                </label>
                                <input
                                    type="number"
                                    value={monthlyData.activeMachines || ''}
                                    onChange={(e) => setMonthlyData(prev => ({
                                        ...prev,
                                        activeMachines: parseInt(e.target.value) || 0
                                    }))}
                                    className="input"
                                    placeholder="默认: 10"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    操作工实际人数
                                </label>
                                <input
                                    type="number"
                                    value={monthlyData.actualOperators || ''}
                                    onChange={(e) => setMonthlyData(prev => ({
                                        ...prev,
                                        actualOperators: parseInt(e.target.value) || 0
                                    }))}
                                    className="input"
                                    placeholder="默认: 17"
                                />
                                <p className="mt-1 text-xs text-slate-400">定员: {DEFAULT_WEAVING_CONFIG.operatorQuota} 人</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    出勤天数
                                </label>
                                <input
                                    type="number"
                                    value={monthlyData.attendanceDays || ''}
                                    onChange={(e) => setMonthlyData(prev => ({
                                        ...prev,
                                        attendanceDays: parseInt(e.target.value) || 0
                                    }))}
                                    className="input"
                                    placeholder="用于基本积分计算"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== 机台产量录入 ===== */}
                <div className="card overflow-hidden">
                    <div 
                        className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between cursor-pointer"
                        onClick={() => setShowMachineInput(!showMachineInput)}
                    >
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Factory size={18} className="text-slate-500" />
                            机台产量录入
                            <span className="ml-2 text-xs font-normal text-slate-400">
                                (已录入 {enteredMachineCount}/{DEFAULT_MACHINES.length} 台)
                            </span>
                        </h3>
                        <div className="flex items-center gap-3">
                            {totalEquivalent > 0 && (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                                    合计: {totalEquivalent.toFixed(0)} ㎡
                                </span>
                            )}
                            {showMachineInput ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                    </div>

                    {showMachineInput && (
                        <div className="p-6">
                            {/* 等效产量计算说明 */}
                            <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <div className="flex items-start gap-3">
                                    <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-amber-800">
                                        <p className="font-semibold mb-1">等效产量计算公式</p>
                                        <p className="text-amber-700">
                                            等效产量 = 实际产量 × 产量系数(纬密÷13) × 宽度系数(8.5÷机宽) × 速度系数(H2=1, H5=0.56)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 机台列表 */}
                            <div className="space-y-3">
                                {DEFAULT_MACHINES.map((machine, index) => {
                                    const data = machineData.find(m => m.machineId === machine.id) || {
                                        machineId: machine.id,
                                        actualOutput: 0,
                                        weftDensity: 13,
                                        machineWidth: machine.width,
                                        speedType: machine.speedType
                                    };

                                    return (
                                        <MachineInput
                                            key={machine.id}
                                            machine={machine}
                                            data={data}
                                            onChange={(newData) => handleMachineChange(machine.id, newData)}
                                            isExpanded={expandedMachines.has(machine.id)}
                                            onToggle={() => toggleExpand(machine.id)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ===== 数据预览 ===== */}
                <div className="card bg-gradient-to-br from-primary-50 to-primary-50/30 border-primary-100">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-primary-800 flex items-center gap-2">
                                <CheckCircle2 size={18} />
                                数据预览
                            </h3>
                            <button className="btn-primary flex items-center gap-2">
                                <Save size={16} />
                                保存数据
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                            <div className="bg-white/60 rounded-lg p-3">
                                <span className="text-primary-600 font-medium block mb-1">成网率</span>
                                <span className="text-primary-900 font-bold text-lg">{monthlyData.netFormationRate}%</span>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3">
                                <span className="text-primary-600 font-medium block mb-1">运转率</span>
                                <span className="text-primary-900 font-bold text-lg">{monthlyData.operationRate}%</span>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3">
                                <span className="text-primary-600 font-medium block mb-1">等效产量</span>
                                <span className="text-primary-900 font-bold text-lg">{monthlyData.equivalentOutput.toLocaleString()} ㎡</span>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3">
                                <span className="text-primary-600 font-medium block mb-1">有效机台</span>
                                <span className="text-primary-900 font-bold text-lg">{monthlyData.activeMachines} 台</span>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3">
                                <span className="text-primary-600 font-medium block mb-1">操作工人数</span>
                                <span className="text-primary-900 font-bold text-lg">{monthlyData.actualOperators} 人</span>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3">
                                <span className="text-primary-600 font-medium block mb-1">出勤天数</span>
                                <span className="text-primary-900 font-bold text-lg">{monthlyData.attendanceDays} 天</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
