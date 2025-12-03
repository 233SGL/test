import React from 'react';
import { WeavingCalculationResult, INITIAL_ADMIN_TEAM } from '../../weavingTypes';
import { Coins, User, Users } from 'lucide-react';

interface WeavingResultsProps {
    result: WeavingCalculationResult | null;
}

export const WeavingResults: React.FC<WeavingResultsProps> = ({ result }) => {
    if (!result) return null;

    return (
        <div className="space-y-6">
            {/* 1. Bonus Pool Calculation Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Coins className="text-yellow-600" size={20} />
                    </div>
                    <h3 className="font-semibold text-slate-800">奖金池计算详情</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="text-sm text-slate-500 mb-1">成网率质量奖系数</div>
                        <div className="text-2xl font-bold text-slate-800">{result.qualityBonusCoef.toFixed(4)}</div>
                        <div className="text-xs text-slate-400 mt-2">
                            公式: (成网率-基准)*100/30 * 等效产量/(目标*机台) / 实际人数 * 定员
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="text-sm text-slate-500 mb-1">成网率质量奖总额</div>
                        <div className="text-2xl font-bold text-green-600">¥ {result.qualityBonusTotal.toFixed(2)}</div>
                        <div className="text-xs text-slate-400 mt-2">
                            公式: 系数 * 人均目标奖金 * 管理员人数
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="text-sm text-slate-500 mb-1">织机运转率奖总额</div>
                        <div className="text-2xl font-bold text-green-600">¥ {result.operationBonusTotal.toFixed(2)}</div>
                        <div className="text-xs text-slate-400 mt-2">
                            公式: (运转率-基准)*100 * 单价
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
                    <span className="font-medium text-blue-900">管理员班总奖金池</span>
                    <span className="text-3xl font-bold text-blue-700">¥ {result.totalBonusPool.toFixed(2)}</span>
                </div>
            </div>

            {/* 2. Personnel Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Users className="text-indigo-600" size={20} />
                    </div>
                    <h3 className="font-semibold text-slate-800">人员薪资分配</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">姓名</th>
                                <th className="px-4 py-3">职位</th>
                                <th className="px-4 py-3">分配系数</th>
                                <th className="px-4 py-3 text-right">基本工资</th>
                                <th className="px-4 py-3 text-right">个人奖金</th>
                                <th className="px-4 py-3 text-right">应发工资</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {INITIAL_ADMIN_TEAM.map((person) => {
                                const isLeader = person.role === '班长';
                                const bonus = isLeader ? result.leaderBonus : result.memberBonus;
                                const total = person.baseSalary + bonus; // Assuming full attendance for now

                                return (
                                    <tr key={person.name} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{person.name}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isLeader ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'
                                                }`}>
                                                {person.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{isLeader ? '1.3' : '1.0'}</td>
                                        <td className="px-4 py-3 text-right text-slate-600">¥ {person.baseSalary.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-medium text-green-600">¥ {bonus.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-900">¥ {total.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
                            <tr>
                                <td className="px-4 py-3" colSpan={3}>合计</td>
                                <td className="px-4 py-3 text-right">
                                    ¥ {INITIAL_ADMIN_TEAM.reduce((sum, p) => sum + p.baseSalary, 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    ¥ {result.totalBonusPool.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right">
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
