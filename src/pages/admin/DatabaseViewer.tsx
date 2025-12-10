/**
 * 后台管理 - 数据库查看器
 * 查看数据库表结构和数据
 */
import React, { useState, useEffect } from 'react';
import { Database, Table, RefreshCw, ChevronRight, Eye, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = '/api/admin';

interface TableInfo {
    table_name: string;
    column_count: number;
    row_count: number;
}

interface ColumnInfo {
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
}

export const DatabaseViewer: React.FC = () => {
    const { user } = useAuth();
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [columns, setColumns] = useState<ColumnInfo[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [dataTotal, setDataTotal] = useState(0);
    const [dataPage, setDataPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'structure' | 'data'>('structure');
    const [authError, setAuthError] = useState<string | null>(null);

    // 获取认证 headers
    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'x-user-id': user?.id || ''
    });

    const fetchTables = async () => {
        try {
            setAuthError(null);
            const res = await fetch(`${API_BASE}/database/tables`, {
                headers: getAuthHeaders()
            });
            if (res.status === 401 || res.status === 403) {
                const err = await res.json();
                setAuthError(err.error || '权限不足');
                return;
            }
            if (res.ok) setTables(await res.json());
        } catch (err) {
            console.error('获取表列表失败:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTableDetails = async (tableName: string) => {
        try {
            const res = await fetch(`${API_BASE}/database/tables/${tableName}`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setColumns(data.columns || []);
            }
        } catch (err) {
            console.error('获取表结构失败:', err);
        }
    };

    const fetchTableData = async (tableName: string, page: number = 1) => {
        try {
            const res = await fetch(`${API_BASE}/database/tables/${tableName}/data?page=${page}&limit=20`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const result = await res.json();
                setData(result.data || []);
                setDataTotal(result.total || 0);
            }
        } catch (err) {
            console.error('获取表数据失败:', err);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    useEffect(() => {
        if (selectedTable) {
            fetchTableDetails(selectedTable);
            if (viewMode === 'data') {
                fetchTableData(selectedTable, dataPage);
            }
        }
    }, [selectedTable, viewMode, dataPage]);

    const dataPages = Math.ceil(dataTotal / 20);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">数据库查看</h1>
                    <p className="text-slate-500 text-sm mt-0.5">查看表结构和数据（只读）</p>
                </div>
                <button onClick={fetchTables} className="btn-secondary flex items-center gap-2">
                    <RefreshCw size={16} /> 刷新
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 表列表 */}
                <div className="card p-4 lg:col-span-1">
                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <Database size={18} className="text-primary-500" />
                        数据库表
                    </h3>
                    <div className="space-y-1">
                        {loading ? (
                            <div className="text-center py-4 text-slate-400">
                                <RefreshCw className="animate-spin inline" size={16} />
                            </div>
                        ) : tables.map(table => (
                            <button
                                key={table.table_name}
                                onClick={() => { setSelectedTable(table.table_name); setDataPage(1); }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${selectedTable === table.table_name
                                    ? 'bg-primary-100 text-primary-700 font-medium'
                                    : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Table size={14} />
                                    {table.table_name}
                                </span>
                                <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                    {table.row_count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 表详情 */}
                <div className="card p-6 lg:col-span-3">
                    {!selectedTable ? (
                        <div className="text-center py-12 text-slate-400">
                            <Database size={48} className="mx-auto mb-4 opacity-50" />
                            <p>请选择一个表查看详情</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-800 text-lg">{selectedTable}</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setViewMode('structure')}
                                        className={`px-3 py-1.5 rounded text-sm font-medium ${viewMode === 'structure' ? 'bg-primary-100 text-primary-700' : 'text-slate-500 hover:bg-slate-100'
                                            }`}
                                    >
                                        表结构
                                    </button>
                                    <button
                                        onClick={() => setViewMode('data')}
                                        className={`px-3 py-1.5 rounded text-sm font-medium ${viewMode === 'data' ? 'bg-primary-100 text-primary-700' : 'text-slate-500 hover:bg-slate-100'
                                            }`}
                                    >
                                        数据预览
                                    </button>
                                </div>
                            </div>

                            {viewMode === 'structure' ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-semibold text-slate-600">列名</th>
                                                <th className="px-4 py-2 text-left font-semibold text-slate-600">数据类型</th>
                                                <th className="px-4 py-2 text-left font-semibold text-slate-600">可为空</th>
                                                <th className="px-4 py-2 text-left font-semibold text-slate-600">默认值</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {columns.map(col => (
                                                <tr key={col.column_name} className="hover:bg-slate-50">
                                                    <td className="px-4 py-2 font-mono text-primary-600">{col.column_name}</td>
                                                    <td className="px-4 py-2 text-slate-600">{col.data_type}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs ${col.is_nullable === 'YES' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {col.is_nullable === 'YES' ? '是' : '否'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-slate-500 font-mono text-xs">
                                                        {col.column_default || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto max-w-full border border-slate-200 rounded-lg">
                                        <table className="w-full text-sm whitespace-nowrap">
                                            <thead className="bg-slate-50 sticky top-0">
                                                <tr>
                                                    {data[0] && Object.keys(data[0]).map(key => (
                                                        <th key={key} className="px-4 py-2.5 text-left font-semibold text-slate-600 border-b border-slate-200 min-w-[100px]">
                                                            {key}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {data.map((row, i) => (
                                                    <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                                                        {Object.entries(row).map(([key, val]: [string, any], j) => (
                                                            <td
                                                                key={j}
                                                                className="px-4 py-2.5 text-slate-600 font-mono text-xs"
                                                                title={typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val ?? '-')}
                                                            >
                                                                {typeof val === 'object'
                                                                    ? <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{JSON.stringify(val).slice(0, 50)}...</span>
                                                                    : key.includes('_at') && val
                                                                        ? new Date(val).toLocaleString('zh-CN')
                                                                        : String(val ?? '-')}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {dataPages > 1 && (
                                        <div className="mt-4 flex items-center justify-between text-sm">
                                            <span className="text-slate-500">共 {dataTotal} 条，第 {dataPage}/{dataPages} 页</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setDataPage(p => Math.max(1, p - 1))}
                                                    disabled={dataPage === 1}
                                                    className="p-1.5 rounded border hover:bg-slate-50 disabled:opacity-50"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDataPage(p => Math.min(dataPages, p + 1))}
                                                    disabled={dataPage === dataPages}
                                                    className="p-1.5 rounded border hover:bg-slate-50 disabled:opacity-50"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DatabaseViewer;
