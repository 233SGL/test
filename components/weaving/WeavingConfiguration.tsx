import React, { useState } from 'react';
import { Settings, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { WeavingConfig } from '../../weavingTypes';

interface WeavingConfigurationProps {
    config: WeavingConfig;
    onUpdate: (newConfig: WeavingConfig) => void;
}

export const WeavingConfiguration: React.FC<WeavingConfigurationProps> = ({
    config,
    onUpdate,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localConfig, setLocalConfig] = useState<WeavingConfig>(config);
    const [hasChanges, setHasChanges] = useState(false);

    const handleChange = (field: keyof WeavingConfig, value: number) => {
        const newConfig = { ...localConfig, [field]: value };
        setLocalConfig(newConfig);
        setHasChanges(true);
    };

    const handleSave = () => {
        onUpdate(localConfig);
        setHasChanges(false);
        setIsOpen(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Settings className="text-slate-500" size={20} />
                    <h3 className="font-semibold text-slate-800">后台常量配置</h3>
                    <span className="text-xs text-slate-500 font-normal ml-2">
                        (点击{isOpen ? '收起' : '展开'}以修改基准参数)
                    </span>
                </div>
                {isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </button>

            {isOpen && (
                <div className="p-6 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Group 1: Benchmarks */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">基准参数</h4>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">成网率基准 (%)</label>
                                <input
                                    type="number"
                                    value={localConfig.netFormationBenchmark}
                                    onChange={(e) => handleChange('netFormationBenchmark', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">运转率基准 (%)</label>
                                <input
                                    type="number"
                                    value={localConfig.operationRateBenchmark}
                                    onChange={(e) => handleChange('operationRateBenchmark', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">单机目标等效产量</label>
                                <input
                                    type="number"
                                    value={localConfig.targetEquivalentOutput}
                                    onChange={(e) => handleChange('targetEquivalentOutput', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Group 2: Team & Bonus */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">团队与奖金</h4>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">操作工定员 (人)</label>
                                <input
                                    type="number"
                                    value={localConfig.operatorQuota}
                                    onChange={(e) => handleChange('operatorQuota', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">平均每人目标奖金 (元)</label>
                                <input
                                    type="number"
                                    value={localConfig.avgTargetBonus}
                                    onChange={(e) => handleChange('avgTargetBonus', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">运转率奖金单价 (元/1%)</label>
                                <input
                                    type="number"
                                    value={localConfig.operationRateBonusUnit}
                                    onChange={(e) => handleChange('operationRateBonusUnit', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Group 3: Distribution */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">分配系数 & 底薪</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">班长系数</label>
                                    <input
                                        type="number"
                                        value={localConfig.leaderCoef}
                                        onChange={(e) => handleChange('leaderCoef', parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">班员系数</label>
                                    <input
                                        type="number"
                                        value={localConfig.memberCoef}
                                        onChange={(e) => handleChange('memberCoef', parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">班长底薪</label>
                                    <input
                                        type="number"
                                        value={localConfig.leaderBaseSalary}
                                        onChange={(e) => handleChange('leaderBaseSalary', parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">班员底薪</label>
                                    <input
                                        type="number"
                                        value={localConfig.memberBaseSalary}
                                        onChange={(e) => handleChange('memberBaseSalary', parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {hasChanges && (
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Save size={18} />
                                保存配置更改
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
