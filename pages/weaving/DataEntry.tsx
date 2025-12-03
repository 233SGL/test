import React from 'react';
import { Database } from 'lucide-react';
import { WeavingDataEntry } from '../../components/weaving/WeavingDataEntry';
import { EquivalentOutputCalculator } from '../../components/weaving/EquivalentOutputCalculator';
import { WeavingMonthlyData } from '../../weavingTypes';

export const DataEntry = () => {
    // TODO: 集成真实的数据存储（目前使用本地状态）
    const [monthlyData, setMonthlyData] = React.useState<WeavingMonthlyData>({
        netFormationRate: 75,
        equivalentOutput: 0,
        activeMachines: 10,
        actualOperators: 17,
        operationRate: 78,
        attendanceDays: 26,
    });

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <Database className="text-blue-600" size={32} />
                    织造工段 - 数据录入
                </h1>
                <p className="text-slate-600">
                    录入当月织造工段生产数据
                </p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                <WeavingDataEntry
                    data={monthlyData}
                    onUpdate={setMonthlyData}
                />

                {/* 显示当前数据预览 */}
                <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-100">
                    <h3 className="font-semibold text-blue-900 mb-3">数据预览</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-blue-600 font-medium">成网率：</span>
                            <span className="text-blue-900">{monthlyData.netFormationRate}%</span>
                        </div>
                        <div>
                            <span className="text-blue-600 font-medium">运转率：</span>
                            <span className="text-blue-900">{monthlyData.operationRate}%</span>
                        </div>
                        <div>
                            <span className="text-blue-600 font-medium">等效产量：</span>
                            <span className="text-blue-900">{monthlyData.equivalentOutput.toFixed(2)} ㎡</span>
                        </div>
                        <div>
                            <span className="text-blue-600 font-medium">有效机台：</span>
                            <span className="text-blue-900">{monthlyData.activeMachines} 台</span>
                        </div>
                        <div>
                            <span className="text-blue-600 font-medium">操作工人数：</span>
                            <span className="text-blue-900">{monthlyData.actualOperators} 人</span>
                        </div>
                        <div>
                            <span className="text-blue-600 font-medium">出勤天数：</span>
                            <span className="text-blue-900">{monthlyData.attendanceDays} 天</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
