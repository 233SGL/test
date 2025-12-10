/**
 * 后台管理 - 操作日志页面
 * 查看系统所有操作记录
 */
import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

const API_BASE = '/api/admin';

interface AuditLog {
    id: number;
    user_id: string;
    username: string;
    action: string;
    target_type: string;
    target_id: string;
    target_name: string;
    details: any;
    ip_address: string;
    created_at: string;
}

export const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const limit = 20;

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (actionFilter) params.append('action', actionFilter);
            if (typeFilter) params.append('targetType', typeFilter);
            if (searchQuery) params.append('search', searchQuery);
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);

            const res = await fetch(`${API_BASE}/audit-logs?${params}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.data || []);
                setTotal(data.total || 0);
            }
        } catch (err) {
            console.error('获取日志失败:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter, typeFilter, searchQuery, dateFrom, dateTo]);

    // 防抖搜索
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== searchQuery) {
                setSearchQuery(searchInput);
                setPage(1);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-CN');
    };

    // 解码URL编码的用户名
    const decodeUsername = (name: string) => {
        try {
            return decodeURIComponent(name);
        } catch {
            return name;
        }
    };

    const actionLabels: Record<string, { label: string; color: string }> = {
        'CREATE': { label: '创建', color: 'bg-emerald-100 text-emerald-700' },
        'UPDATE': { label: '更新', color: 'bg-blue-100 text-blue-700' },
        'DELETE': { label: '删除', color: 'bg-red-100 text-red-700' },
        'LOGIN': { label: '登录', color: 'bg-purple-100 text-purple-700' },
        'LOGIN_FAILED': { label: '登录失败', color: 'bg-orange-100 text-orange-700' },
        'LOGOUT': { label: '登出', color: 'bg-slate-100 text-slate-700' },
        'BACKUP': { label: '备份', color: 'bg-cyan-100 text-cyan-700' },
        'RESTORE': { label: '恢复', color: 'bg-amber-100 text-amber-700' },
        'ADMIN_ACCESS': { label: '管理访问', color: 'bg-indigo-100 text-indigo-700' },
        'ADMIN_VERIFY_FAILED': { label: '验证失败', color: 'bg-rose-100 text-rose-700' }
    };

    const typeLabels: Record<string, string> = {
        'employee': '员工',
        'workshop': '工段',
        'user': '用户',
        'settings': '设置',
        'backup': '备份',
        'system': '系统',
        'admin': '管理',
        'weaving_employee': '织造员工',
        'weaving_machine': '织造机台',
        'weaving_product': '织造产品',
        'weaving_record': '生产记录'
    };

    const clearFilters = () => {
        setActionFilter('');
        setTypeFilter('');
        setSearchInput('');
        setSearchQuery('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    const hasActiveFilters = actionFilter || typeFilter || searchQuery || dateFrom || dateTo;
    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">操作日志</h1>
                    <p className="text-slate-500 text-sm mt-0.5">查看系统所有操作记录</p>
                </div>
                <button onClick={fetchLogs} className="btn-secondary flex items-center gap-2">
                    <RefreshCw size={16} /> 刷新
                </button>
            </div>

            {/* 筛选器 */}
            <div className="card p-4 space-y-3">
                {/* 第一行：搜索和日期 */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="搜索用户名、目标名称..."
                            className="input pl-9 py-2 w-full"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        <input
                            type="date"
                            className="input py-2"
                            value={dateFrom}
                            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                            placeholder="开始日期"
                        />
                        <span className="text-slate-400">至</span>
                        <input
                            type="date"
                            className="input py-2"
                            value={dateTo}
                            onChange={e => { setDateTo(e.target.value); setPage(1); }}
                            placeholder="结束日期"
                        />
                    </div>
                </div>

                {/* 第二行：下拉筛选和统计 */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            className="input py-2"
                            value={actionFilter}
                            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">所有操作</option>
                            <option value="CREATE">创建</option>
                            <option value="UPDATE">更新</option>
                            <option value="DELETE">删除</option>
                            <option value="LOGIN">登录</option>
                            <option value="LOGIN_FAILED">登录失败</option>
                            <option value="LOGOUT">登出</option>
                            <option value="BACKUP">备份</option>
                            <option value="RESTORE">恢复</option>
                            <option value="ADMIN_ACCESS">管理访问</option>
                        </select>
                    </div>
                    <select
                        className="input py-2"
                        value={typeFilter}
                        onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">所有类型</option>
                        <option value="employee">员工</option>
                        <option value="workshop">工段</option>
                        <option value="user">用户</option>
                        <option value="settings">设置</option>
                        <option value="backup">备份</option>
                        <option value="system">系统</option>
                        <option value="weaving_employee">织造员工</option>
                        <option value="weaving_machine">织造机台</option>
                        <option value="weaving_product">织造产品</option>
                        <option value="weaving_record">生产记录</option>
                    </select>

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                            <X size={14} /> 清除筛选
                        </button>
                    )}

                    <div className="ml-auto text-sm text-slate-500">
                        共 <span className="font-semibold text-slate-700">{total}</span> 条记录
                    </div>
                </div>
            </div>


            {/* 日志表格 */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">时间</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">用户</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">操作</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">目标</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">IP地址</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                        <RefreshCw className="animate-spin inline mr-2" size={16} />
                                        加载中...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                        暂无日志记录
                                    </td>
                                </tr>
                            ) : logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                        {formatTime(log.created_at)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-slate-800">{decodeUsername(log.username)}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${actionLabels[log.action]?.color || 'bg-slate-100 text-slate-700'}`}>
                                            {actionLabels[log.action]?.label || log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {log.target_type && <span className="text-slate-400">{log.target_type}: </span>}
                                        {log.target_name || log.target_id || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-500 font-mono">
                                        {log.ip_address}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                            第 {page} / {totalPages} 页
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
