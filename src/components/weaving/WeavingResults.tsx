import React from 'react';
import { WeavingCalculationResult, INITIAL_ADMIN_TEAM, WEAVING_POSITION_CONFIG } from '../../weavingTypes';
import { Coins, Users } from 'lucide-react';

interface WeavingResultsProps {
    result: WeavingCalculationResult | null;
}

export const WeavingResults: React.FC<WeavingResultsProps> = ({ result }) => {
    if (!result) return null;

    return (
        <div className="space-y-6">
            {/* 1. Bonus Pool Calculation Breakdown */}
            <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-100 rounded-xl flex items-center justify-center shadow-sm">
                        <Coins className="text-amber-600" size={22} />
                    </div>
                    <h3 className="font-semibold text-slate-800">奖金池计算详情</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-all">
                        <div className="text-sm text-slate-500 mb-1 font-medium">成网率质量奖系数</div>
                        <div className="text-2xl font-bold text-slate-800 tabular-nums">{result.qualityBonusCoef.toFixed(4)}</div>
                        <div className="text-xs text-slate-400 mt-2">
                            公式: (成网率-基准)*100/30 * 等效产量/(目标*机台) / 实际人数 * 定员
                        </div>
                    </div>

                    <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/60 hover:border-emerald-300 transition-all">
                        <div className="text-sm text-emerald-600 mb-1 font-medium">成网率质量奖总额</div>
                        <div className="text-2xl font-bold text-emerald-700 tabular-nums">{result.qualityBonusTotal.toFixed(2)}分</div>
                        <div className="text-xs text-emerald-500 mt-2">
                            公式: 系数 * 人均目标奖金 * 管理员人数
                        </div>
                    </div>

                    <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/60 hover:border-emerald-300 transition-all">
                        <div className="text-sm text-emerald-600 mb-1 font-medium">织机运转率奖总额</div>
                        <div className="text-2xl font-bold text-emerald-700 tabular-nums">{result.operationBonusTotal.toFixed(2)}分</div>
                        <div className="text-xs text-emerald-500 mt-2">
                            公式: (运转率-基准)*100 * 单价
                        </div>
                    </div>
                </div>

                <div className="mt-5 p-4 bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-xl border border-primary-200 flex items-center justify-between">
                    <span className="font-semibold text-primary-800">管理员班总奖金池</span>
                    <span className="text-3xl font-bold text-primary-700 tabular-nums">{result.totalBonusPool.toFixed(2)}分</span>
                </div>
            </div>

            {/* 2. Personnel Distribution */}
            <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 bg-gradient-to-br from-primary-100 to-primary-50 border border-primary-100 rounded-xl flex items-center justify-center shadow-sm">
                        <Users className="text-primary-600" size={22} />
                    </div>
                    <h3 className="font-semibold text-slate-800">人员积分分配</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3.5 font-semibold">姓名</th>
                                <th className="px-4 py-3.5 font-semibold">职位</th>
                                <th className="px-4 py-3.5 font-semibold">分配系数</th>
                                <th className="px-4 py-3.5 text-right font-semibold">基本积分</th>
                                <th className="px-4 py-3.5 text-right font-semibold">个人奖金</th>
                                <th className="px-4 py-3.5 text-right font-semibold">应发积分</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {INITIAL_ADMIN_TEAM.map((person) => {
                                const isLeader = person.position === 'admin_leader';
                                const bonus = isLeader ? result.leaderBonus : result.memberBonus;
                                const total = person.baseSalary + bonus; // Assuming full attendance for now
                                const positionLabel = WEAVING_POSITION_CONFIG[person.position]?.label || person.position;

                                return (

                                    <tr key={person.name} className="hover:bg-primary-50/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-800">{person.name}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${isLeader ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {positionLabel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 tabular-nums">{isLeader ? '1.3' : '1.0'}</td>
                                        <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{person.baseSalary.toLocaleString()}分</td>
                                        <td className="px-4 py-3 text-right font-semibold text-emerald-600 tabular-nums">{bonus.toFixed(2)}分</td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">{total.toFixed(2)}分</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-slate-100/80 border-t-2 border-slate-200 font-semibold text-slate-800">
                            <tr>
                                <td className="px-4 py-3.5" colSpan={3}>合计</td>
                                <td className="px-4 py-3.5 text-right tabular-nums">
                                    ¥ {INITIAL_ADMIN_TEAM.reduce((sum, p) => sum + p.baseSalary, 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-3.5 text-right tabular-nums">
                                    ¥ {result.totalBonusPool.toFixed(2)}
                                </td>
                                <td className="px-4 py-3.5 text-right tabular-nums">
                                    ¥ {(INITIAL_ADMIN_TEAM.reduce((sum, p) => sum + p.baseSalary, 0) + result.totalBonusPool).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};
