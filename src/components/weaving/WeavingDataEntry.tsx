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
        <div className="card p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-gradient-to-br from-primary-100 to-primary-50 border border-primary-100 rounded-xl flex items-center justify-center shadow-sm">
                    <Calendar className="text-primary-600" size={22} />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800">月度数据录入</h3>
                    <p className="text-sm text-slate-500">请填写当月实际生产数据</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Row 1 */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        当月织造成网率 (%)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={data.netFormationRate || ''}
                            onChange={(e) => handleChange('netFormationRate', parseFloat(e.target.value))}
                            className="input pr-8"
                            placeholder="例如: 75"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        当月织造等效产量 (㎡)
                    </label>
                    <div className="relative flex gap-2">
                        <input
                            type="number"
                            value={data.equivalentOutput || ''}
                            onChange={(e) => handleChange('equivalentOutput', parseFloat(e.target.value))}
                            className="input flex-1"
                            placeholder="点击右侧计算器辅助计算"
                        />
                        <button
                            onClick={() => setIsCalculatorOpen(true)}
                            className="px-3 py-2 bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 rounded-xl border border-primary-200 hover:from-primary-100 hover:to-primary-200 transition-all duration-200 shadow-sm hover:shadow"
                            title="打开等效产量计算器"
                        >
                            <Calculator size={20} />
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        当月织机运转率 (%)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={data.operationRate || ''}
                            onChange={(e) => handleChange('operationRate', parseFloat(e.target.value))}
                            className="input pr-8"
                            placeholder="例如: 78"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                    </div>
                </div>

                {/* Row 2 */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        有效机台总数
                    </label>
                    <input
                        type="number"
                        value={data.activeMachines || ''}
                        onChange={(e) => handleChange('activeMachines', parseFloat(e.target.value))}
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
                        value={data.actualOperators || ''}
                        onChange={(e) => handleChange('actualOperators', parseFloat(e.target.value))}
                        className="input"
                        placeholder="默认: 17"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        出勤天数 (用于基本积分)
                    </label>
                    <input
                        type="number"
                        value={data.attendanceDays || ''}
                        onChange={(e) => handleChange('attendanceDays', parseFloat(e.target.value))}
                        className="input"
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
