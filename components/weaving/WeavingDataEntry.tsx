import React, { useState } from 'react';
import { Calculator, Calendar } from 'lucide-react';
import { WeavingMonthlyData } from '../../weavingTypes';
import { EquivalentOutputCalculator } from './EquivalentOutputCalculator';

interface WeavingDataEntryProps {
    data: WeavingMonthlyData;
    onUpdate: (newData: WeavingMonthlyData) => void;
}

export const WeavingDataEntry: React.FC<WeavingDataEntryProps> = ({
    data,
    onUpdate,
}) => {
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

    const handleChange = (field: keyof WeavingMonthlyData, value: number) => {
        onUpdate({ ...data, [field]: value });
    };

    const handleCalculatorConfirm = (total: number) => {
        handleChange('equivalentOutput', total);
        setIsCalculatorOpen(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-blue-600" size={20} />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800">月度数据录入</h3>
                    <p className="text-sm text-slate-500">请填写当月实际生产数据</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Row 1 */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        当月织造成网率 (%)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={data.netFormationRate || ''}
                            onChange={(e) => handleChange('netFormationRate', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            placeholder="例如: 75"
                        />
                        <span className="absolute right-3 top-2 text-slate-400">%</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        当月织造等效产量 (㎡)
                    </label>
                    <div className="relative flex gap-2">
                        <input
                            type="number"
                            value={data.equivalentOutput || ''}
                            onChange={(e) => handleChange('equivalentOutput', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            placeholder="点击右侧计算器辅助计算"
                        />
                        <button
                            onClick={() => setIsCalculatorOpen(true)}
                            className="px-3 py-2 bg-blue-50 text-blue-600 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors"
                            title="打开等效产量计算器"
                        >
                            <Calculator size={20} />
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        当月织机运转率 (%)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={data.operationRate || ''}
                            onChange={(e) => handleChange('operationRate', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            placeholder="例如: 78"
                        />
                        <span className="absolute right-3 top-2 text-slate-400">%</span>
                    </div>
                </div>

                {/* Row 2 */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        有效机台总数
                    </label>
                    <input
                        type="number"
                        value={data.activeMachines || ''}
                        onChange={(e) => handleChange('activeMachines', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="默认: 10"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        操作工实际人数
                    </label>
                    <input
                        type="number"
                        value={data.actualOperators || ''}
                        onChange={(e) => handleChange('actualOperators', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="默认: 17"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        出勤天数 (用于基本工资)
                    </label>
                    <input
                        type="number"
                        value={data.attendanceDays || ''}
                        onChange={(e) => handleChange('attendanceDays', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="默认满勤"
                    />
                </div>
            </div>

            <EquivalentOutputCalculator
                isOpen={isCalculatorOpen}
                onClose={() => setIsCalculatorOpen(false)}
                onConfirm={handleCalculatorConfirm}
            />
        </div>
    );
};
