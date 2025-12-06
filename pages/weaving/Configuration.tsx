/**
 * ========================================
 * 织造工段 - 工段配置页面
 * ========================================
 * 
 * 管理织造工段的考核参数配置
 * 包括基准值、奖金系数、人员配置等
 * 
 * @module pages/weaving/Configuration
 */
import React, { useState, useEffect } from 'react';
import {
    Settings, Save, RotateCcw, AlertTriangle,
    Target, Users, Coins, Percent, Info, Loader2, CheckCircle
} from 'lucide-react';
import { WeavingConfig, DEFAULT_WEAVING_CONFIG, INITIAL_ADMIN_TEAM } from '../../weavingTypes';
import { db } from '../../services/db';

// 配置项组件
interface ConfigItemProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    suffix?: string;
    description?: string;
    min?: number;
    max?: number;
    step?: number;
    id?: string;
}

const ConfigItem: React.FC<ConfigItemProps> = ({
    label, value, onChange, suffix, description, min, max, step = 1, id
}) => {
    // 生成唯一 ID 用于表单关联
    const inputId = id || `config-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <div className="space-y-1.5">
            <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700">
                {label}
            </label>
            <div className="relative">
                <input
                    id={inputId}
                    name={inputId}
                    type="number"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    className="input pr-12"
                    min={min}
                    max={max}
                    step={step}
                    aria-describedby={description ? `${inputId}-desc` : undefined}
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" aria-hidden="true">
                        {suffix}
                    </span>
                )}
            </div>
            {description && (
                <p id={`${inputId}-desc`} className="text-xs text-slate-400">{description}</p>
            )}
        </div>
    );
};

export const Configuration = () => {
    const [config, setConfig] = useState<WeavingConfig>(DEFAULT_WEAVING_CONFIG);
    const [originalConfig, setOriginalConfig] = useState<WeavingConfig>(DEFAULT_WEAVING_CONFIG);
    const [hasChanges, setHasChanges] = useState(false);
    const [_isLoading, setIsLoading] = useState(true); // 用于后续添加加载状态显示
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // 从数据库加载配置
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const dbConfig = await db.getWeavingConfig();
                if (dbConfig && Object.keys(dbConfig).length > 0) {
                    setConfig(dbConfig);
                    setOriginalConfig(dbConfig);
                }
            } catch (error) {
                console.error('加载配置失败:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadConfig();
    }, []);

    // 更新配置
    const updateConfig = (key: keyof WeavingConfig, value: number) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
        setSaveSuccess(false);
    };

    // 重置配置
    const resetConfig = () => {
        setConfig(originalConfig);
        setHasChanges(false);
    };

    // 保存配置到数据库
    const saveConfig = async () => {
        setIsSaving(true);
        try {
            await db.saveWeavingConfig(config);
            setOriginalConfig(config);
            setHasChanges(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('保存配置失败:', error);
            alert('保存失败，请重试');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in-up">
            {/* 页面头部 */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 shadow-sm">
                                <Settings size={24} />
                            </div>
                            织造工段 - 工段配置
                        </h1>
                        <p className="text-slate-500 text-sm">
                            管理织造工段计算参数和基准值
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={resetConfig}
                            className="btn-secondary flex items-center gap-2"
                            disabled={!hasChanges}
                        >
                            <RotateCcw size={16} />
                            重置
                        </button>
                        <button
                            onClick={saveConfig}
                            className={`btn-primary flex items-center gap-2 ${saveSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                            disabled={!hasChanges || isSaving}
                        >
                            {isSaving ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : saveSuccess ? (
                                <CheckCircle size={16} />
                            ) : (
                                <Save size={16} />
                            )}
                            {isSaving ? '保存中...' : saveSuccess ? '已保存' : '保存配置'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 space-y-6">
                {/* ===== 考核基准配置 ===== */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Target size={18} className="text-slate-500" />
                            考核基准配置
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            设置成网率、运转率等考核指标的基准值
                        </p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <ConfigItem
                                label="成网率基准"
                                value={config.netFormationBenchmark}
                                onChange={(v) => updateConfig('netFormationBenchmark', v)}
                                suffix="%"
                                description="低于此值无质量奖励"
                            />
                            <ConfigItem
                                label="运转率基准"
                                value={config.operationRateBenchmark}
                                onChange={(v) => updateConfig('operationRateBenchmark', v)}
                                suffix="%"
                                description="低于此值无运转率奖励"
                            />
                            <ConfigItem
                                label="单机目标等效产量"
                                value={config.targetEquivalentOutput}
                                onChange={(v) => updateConfig('targetEquivalentOutput', v)}
                                suffix="㎡"
                                description="每台机每月目标等效产量"
                            />
                        </div>
                    </div>
                </div>

                {/* ===== 人员配置 ===== */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Users size={18} className="text-slate-500" />
                            人员配置
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            设置操作工定员和管理员班组人数
                        </p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ConfigItem
                                label="操作工定员"
                                value={config.operatorQuota}
                                onChange={(v) => updateConfig('operatorQuota', v)}
                                suffix="人"
                                description="用于计算人员效率系数"
                            />
                            <ConfigItem
                                label="管理员班人数"
                                value={config.adminTeamSize}
                                onChange={(v) => updateConfig('adminTeamSize', v)}
                                suffix="人"
                                description="参与奖金分配的管理员数量"
                            />
                        </div>

                        {/* 管理员名单 */}
                        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">管理员班组名单</h4>
                            <div className="flex flex-wrap gap-3">
                                {INITIAL_ADMIN_TEAM.map((person) => (
                                    <div
                                        key={person.name}
                                        className={`px-4 py-2 rounded-lg border ${person.position === 'admin_leader'
                                            ? 'bg-violet-50 border-violet-200 text-violet-800'
                                            : 'bg-white border-slate-200 text-slate-700'
                                            }`}
                                    >
                                        <span className="font-medium">{person.name}</span>
                                        <span className="text-xs ml-2 opacity-70">({person.position === 'admin_leader' ? '班长' : '班员'})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== 奖金配置 ===== */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Coins size={18} className="text-slate-500" />
                            奖金配置
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            设置奖金计算的相关参数
                        </p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <ConfigItem
                                label="人均目标奖金"
                                value={config.avgTargetBonus}
                                onChange={(v) => updateConfig('avgTargetBonus', v)}
                                suffix="分"
                                description="用于计算质量奖总额"
                            />
                            <ConfigItem
                                label="运转率奖金单价"
                                value={config.operationRateBonusUnit}
                                onChange={(v) => updateConfig('operationRateBonusUnit', v)}
                                suffix="分/%"
                                description="运转率每超1%的奖金"
                            />
                        </div>
                    </div>
                </div>

                {/* ===== 分配系数配置 ===== */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Percent size={18} className="text-slate-500" />
                            分配系数配置
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            设置奖金二次分配的系数
                        </p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <ConfigItem
                                label="班长分配系数"
                                value={config.leaderCoef}
                                onChange={(v) => updateConfig('leaderCoef', v)}
                                step={0.1}
                                description="班长奖金分配权重"
                            />
                            <ConfigItem
                                label="班员分配系数"
                                value={config.memberCoef}
                                onChange={(v) => updateConfig('memberCoef', v)}
                                step={0.1}
                                description="普通班员奖金分配权重"
                            />
                            <ConfigItem
                                label="班长基本积分"
                                value={config.leaderBaseSalary}
                                onChange={(v) => updateConfig('leaderBaseSalary', v)}
                                suffix="分"
                                description="班长满勤基本积分"
                            />
                            <ConfigItem
                                label="班员基本积分"
                                value={config.memberBaseSalary}
                                onChange={(v) => updateConfig('memberBaseSalary', v)}
                                suffix="分"
                                description="班员满勤基本积分"
                            />
                        </div>

                        {/* 系数说明 */}
                        <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-200">
                            <div className="flex items-start gap-3">
                                <Info size={18} className="text-primary-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-primary-800">
                                    <p className="font-semibold mb-1">二次分配计算说明</p>
                                    <p>
                                        总系数 = 班长系数({config.leaderCoef}) + 班员系数({config.memberCoef}) × 班员人数({config.adminTeamSize - 1})
                                        = <span className="font-bold">{config.leaderCoef + config.memberCoef * (config.adminTeamSize - 1)}</span>
                                    </p>
                                    <p className="mt-1">
                                        班长奖金 = 总奖金池 ÷ 总系数 × 班长系数 |
                                        班员奖金 = 总奖金池 ÷ 总系数 × 班员系数
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== 配置变更提示 ===== */}
                {hasChanges && (
                    <div className="card bg-gradient-to-br from-amber-50 to-amber-50/30 border-amber-200">
                        <div className="p-5">
                            <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                                <AlertTriangle size={18} className="text-amber-600" />
                                配置已修改
                            </h3>
                            <p className="text-amber-800 text-sm">
                                您已修改配置参数，请点击"保存配置"按钮保存更改。修改这些参数将影响积分计算结果，建议在月度结算前谨慎调整。
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

