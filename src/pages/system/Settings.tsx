
import React, { useState, useMemo } from 'react';
import { useAuth, ROLE_LABELS } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { UserRole, SystemUser, PERMISSION_LIST, Permission } from '../../types';
import { db, API_BASE } from '../../services/db';
import {
    Database,
    Lock,
    CheckCircle,
    AlertTriangle,
    Users,
    Plus,
    Trash2,
    Key,
    Search,
    Archive,
    RotateCcw,
    Clock,
    FileDown,
    X
} from 'lucide-react';
import { BackupFile } from '../../types';

export const Settings: React.FC = () => {
    const { hasPermission, user: currentUser } = useAuth();
    const { resetMonthData, systemUsers, addSystemUser, updateSystemUser, deleteSystemUser, workshops, isSaving } = useData();
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string | undefined;
    const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string | undefined;

    // User Management State
    const [showUserModal, setShowUserModal] = useState(false);
    const [userForm, setUserForm] = useState<Partial<SystemUser>>({});
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Backup State
    const [backups, setBackups] = useState<BackupFile[]>([]);
    const [isLoadingBackups, setIsLoadingBackups] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const canManageSystem = hasPermission('MANAGE_SYSTEM');

    const filteredUsers = useMemo(() => {
        return systemUsers.filter(u =>
            u.displayName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
            u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
            (u.customRoleName && u.customRoleName.includes(userSearchTerm))
        );
    }, [systemUsers, userSearchTerm]);

    // Initial Data Load
    React.useEffect(() => {
        checkServerStatus();
        loadBackups();
    }, []);

    const checkServerStatus = async () => {
        try {
            const res = await fetch(`${API_BASE}/health`);
            setIsConnected(res.ok);
            if (res.ok) {
                showStatus('success', '服务器连接正常');
            } else {
                showStatus('error', `服务器连接失败: ${res.statusText}`);
            }
        } catch (error) {
            setIsConnected(false);
            showStatus('error', '服务器连接失败: 无法连接');
        }
    };

    const loadBackups = async () => {
        setIsLoadingBackups(true);
        try {
            const data = await db.getBackups();
            setBackups(data);
            setIsConnected(true);
        } catch (error) {
            console.error('Failed to load backups:', error);
            setIsConnected(false);
        } finally {
            setIsLoadingBackups(false);
        }
    };

    // Group permissions by category
    const permissionGroups = useMemo(() => {
        const groups: Record<string, typeof PERMISSION_LIST> = {};
        PERMISSION_LIST.forEach(p => {
            if (!groups[p.category]) groups[p.category] = [];
            groups[p.category].push(p);
        });
        return groups;
    }, []);

    const showStatus = (type: 'success' | 'error', text: string) => {
        setStatusMsg({ type, text });
        setTimeout(() => setStatusMsg(null), 3000);
    };

    const handleCreateBackup = async () => {
        setIsProcessing(true);
        try {
            const result = await db.createBackup();
            if (result.success) {
                setStatusMsg({ type: 'success', text: `备份创建成功: ${result.filename}` });
                await loadBackups();
            } else {
                // Should not happen as db.createBackup throws on processing failure
                setStatusMsg({ type: 'error', text: '备份创建失败: 未知错误' });
            }
        } catch (error: any) {
            setStatusMsg({ type: 'error', text: error.message || '备份创建失败' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRestoreBackup = async (filename: string) => {
        if (isProcessing) return;
        if (confirm(`⚠️ 严重警告：\n\n您正在尝试从备份 "${filename}" 恢复数据。\n此操作将清空当前所有数据并覆盖为备份状态！\n\n此操作不可撤销！确定要继续吗？`)) {
            // 二次确认，要求输入当前用户的 PIN
            const pin = prompt("请输入您的账户密码（PIN）以确认恢复操作：");
            if (!pin) {
                return;
            }

            // 通过后端 API 验证 PIN
            try {
                const verifyResponse = await fetch('/api/admin/verify-pin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin })
                });

                if (!verifyResponse.ok) {
                    showStatus('error', '密码验证失败，操作取消');
                    return;
                }
            } catch (err) {
                showStatus('error', '验证请求失败，请重试');
                return;
            }

            setIsProcessing(true);
            try {
                await db.restoreBackup(filename);
                showStatus('success', '数据恢复成功，页面将刷新');
                setTimeout(() => window.location.reload(), 2000);
            } catch (e) {
                showStatus('error', '数据恢复失败');
                setIsProcessing(false);
            }
        }
    };

    const handleDeleteBackup = async (filename: string) => {
        if (confirm(`确定要删除备份文件 "${filename}" 吗？`)) {
            try {
                await db.deleteBackup(filename);
                showStatus('success', '备份已删除');
                setBackups(prev => prev.filter(b => b.filename !== filename));
            } catch (e) {
                showStatus('error', '删除失败');
            }
        }
    };

    const handleDownloadBackup = async (filename: string) => {
        try {
            const userId = localStorage.getItem('userId') || '';
            const userName = localStorage.getItem('userName') || '';

            const response = await fetch(`${API_BASE}/admin/backups/${filename}`, {
                headers: {
                    'x-user-id': userId,
                    'x-user-name': encodeURIComponent(userName)
                }
            });

            if (!response.ok) {
                throw new Error('下载失败');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showStatus('success', `备份文件 "${filename}" 下载成功`);
        } catch (e) {
            showStatus('error', '下载失败，请重试');
        }
    };


    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userForm.username || !userForm.displayName || !userForm.pinCode) return;

        try {
            const userData = {
                ...userForm,
                permissions: userForm.permissions || [],
                scopes: userForm.scopes || []
            } as SystemUser;

            if (userForm.id) {
                await updateSystemUser(userData);
                showStatus('success', '用户信息已更新');
            } else {
                await addSystemUser({
                    username: userForm.username,
                    displayName: userForm.displayName,
                    role: userForm.role || UserRole.GUEST,
                    customRoleName: userForm.customRoleName,
                    permissions: userForm.permissions || [],
                    scopes: userForm.scopes || [],
                    pinCode: userForm.pinCode,
                    isSystem: false
                });
                showStatus('success', '新用户已创建');
            }
            setShowUserModal(false);
            setUserForm({ permissions: [], scopes: [], role: UserRole.SECTION_HEAD });
        } catch (err) {
            console.error('Failed to save user', err);
            const message = err instanceof Error ? err.message : '保存失败，请稍后再试';
            showStatus('error', message);
        }
    };

    const handleDeleteUser = async (u: SystemUser) => {
        if (confirm(`确定要永久删除用户 "${u.displayName}" 吗？此操作无法撤销。`)) {
            await deleteSystemUser(u.id);
            showStatus('success', '用户已删除');
        }
    };

    const togglePermission = (perm: Permission) => {
        const currentPerms = userForm.permissions || [];
        if (currentPerms.includes(perm)) {
            setUserForm({ ...userForm, permissions: currentPerms.filter(p => p !== perm) });
        } else {
            setUserForm({ ...userForm, permissions: [...currentPerms, perm] });
        }
    };

    const toggleScope = (scope: string) => {
        const currentScopes = userForm.scopes || [];
        if (currentScopes.includes(scope)) {
            setUserForm({ ...userForm, scopes: currentScopes.filter(s => s !== scope) });
        } else {
            setUserForm({ ...userForm, scopes: [...currentScopes, scope] });
        }
    };

    return (
        <>
            <div className="max-w-5xl mx-auto px-4 space-y-8 animate-fade-in-up pb-12">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">系统全局设置</h1>
                    <p className="text-slate-500">管理全局用户权限与数据库维护</p>
                </div>

                {/* 3. User Management */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                <Users size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">系统用户与权限管理</h3>
                                <p className="text-sm text-slate-500">添加/删除登录账号，自定义权限</p>
                            </div>
                        </div>
                        {!canManageSystem && <Lock size={20} className="text-slate-300" />}
                    </div>

                    <div className="p-6">
                        {canManageSystem ? (
                            <>
                                <div className="mb-4 flex flex-col md:flex-row justify-between gap-4">
                                    <div className="relative flex-1 max-w-sm">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <label htmlFor="user-search" className="sr-only">搜索用户</label>
                                        <input
                                            id="user-search"
                                            type="text"
                                            placeholder="搜索用户..."
                                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                            value={userSearchTerm}
                                            onChange={e => setUserSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => { setUserForm({ permissions: [], scopes: [], role: UserRole.SECTION_HEAD }); setShowUserModal(true); }}
                                        className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded hover:bg-slate-900 text-sm font-medium"
                                    >
                                        <Plus size={16} /> 新增用户
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3">显示名称</th>
                                                <th className="px-4 py-3">角色/职位</th>
                                                <th className="px-4 py-3">管辖范围</th>
                                                <th className="px-4 py-3 text-center">PIN</th>
                                                <th className="px-4 py-3 text-right">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredUsers.length > 0 ? filteredUsers.map(u => {
                                                const isProtected = u.id === 'u1' || (currentUser && u.displayName === currentUser.name);

                                                return (
                                                    <tr key={u.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-2">
                                                            <div className="font-medium text-slate-800">{u.displayName}</div>
                                                            <div className="text-xs text-slate-500">{u.username}</div>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100 font-bold">
                                                                {u.customRoleName || ROLE_LABELS[u.role]?.split(' ')[0] || u.role}
                                                            </span>
                                                            <div className="text-xs text-slate-400 mt-1">
                                                                {u.permissions.length} 项权限
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {u.scopes?.includes('all') ? (
                                                                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">全厂通用</span>
                                                            ) : (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {u.scopes?.map(s => {
                                                                        const ws = workshops.find(w => w.code === s);
                                                                        return (
                                                                            <span key={s} className="text-xs bg-slate-100 text-slate-600 px-1.5 rounded">
                                                                                {ws ? ws.name : s}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 text-center font-mono text-slate-400">****</td>
                                                        <td className="px-4 py-2 flex justify-end gap-2">
                                                            <button
                                                                onClick={() => { setUserForm({ ...u, permissions: [...(u.permissions || [])], scopes: [...(u.scopes || [])] }); setShowUserModal(true); }}
                                                                className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded"
                                                                title="编辑"
                                                            >
                                                                <Key size={16} />
                                                            </button>

                                                            {!isProtected && (
                                                                <button
                                                                    onClick={() => handleDeleteUser(u)}
                                                                    className="p-1.5 text-red-500 hover:text-white hover:bg-red-500 bg-red-50 rounded transition-colors"
                                                                    title="删除"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            }) : (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                                        未找到匹配用户
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-50/50 rounded-lg">
                                <Lock size={32} className="mb-2 opacity-50" />
                                <p>仅系统管理员可配置用户权限</p>
                            </div>
                        )}
                    </div>
                </div >

                {/* User Modal */}
                {
                    showUserModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto animate-fade-in-up">
                                <h3 className="text-lg font-bold mb-4">{userForm.id ? '编辑用户' : '新增用户'}</h3>
                                <form onSubmit={handleSaveUser} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="user-display-name" className="block text-sm font-medium text-slate-700 mb-1">显示名称</label>
                                            <input
                                                id="user-display-name"
                                                type="text" required
                                                className="w-full border border-slate-300 rounded px-3 py-2"
                                                value={userForm.displayName || ''}
                                                onChange={e => setUserForm({ ...userForm, displayName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="user-username" className="block text-sm font-medium text-slate-700 mb-1">登录用户名</label>
                                            <input
                                                id="user-username"
                                                type="text" required
                                                disabled={!!userForm.id}
                                                className="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100"
                                                value={userForm.username || ''}
                                                onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="user-pin" className="block text-sm font-medium text-slate-700 mb-1">登录 PIN 码</label>
                                            <input
                                                id="user-pin"
                                                type="text" required
                                                className="w-full border border-slate-300 rounded px-3 py-2 font-mono tracking-widest"
                                                value={userForm.pinCode || ''}
                                                onChange={e => setUserForm({ ...userForm, pinCode: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="user-custom-role" className="block text-sm font-medium text-slate-700 mb-1">职位名称</label>
                                            <input
                                                id="user-custom-role"
                                                type="text"
                                                placeholder="例如：车间统计员、工段负责人"
                                                className="w-full border border-slate-300 rounded px-3 py-2"
                                                value={userForm.customRoleName || ''}
                                                onChange={e => setUserForm({ ...userForm, customRoleName: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-3">权限配置</label>
                                            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                                {Object.entries(permissionGroups).map(([category, perms]) => (
                                                    <div key={category} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{category}</h4>
                                                        <div className="grid grid-cols-1 gap-1">
                                                            {(perms as typeof PERMISSION_LIST).map(p => (
                                                                <label key={p.key} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={(userForm.permissions || []).includes(p.key)}
                                                                        onChange={() => togglePermission(p.key)}
                                                                        className="rounded text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                    <span>{p.label}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-3">管辖工段 (Scope)</label>
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                                                <label className="flex items-center gap-2 text-sm text-purple-700 font-bold cursor-pointer hover:bg-purple-50 p-2 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={(userForm.scopes || []).includes('all')}
                                                        onChange={() => toggleScope('all')}
                                                        className="rounded text-purple-600 focus:ring-purple-500"
                                                    />
                                                    <span>全厂通用 (超级权限)</span>
                                                </label>
                                                <div className="border-t border-slate-200 my-2"></div>
                                                {workshops.map(ws => (
                                                    <label key={ws.code} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-100 p-2 rounded">
                                                        <input
                                                            type="checkbox"
                                                            checked={(userForm.scopes || []).includes(ws.code)}
                                                            onChange={() => toggleScope(ws.code)}
                                                            disabled={(userForm.scopes || []).includes('all')}
                                                            className="rounded text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span>{ws.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => { setShowUserModal(false); setUserForm({ permissions: [], scopes: [], role: UserRole.SECTION_HEAD }); }}
                                            className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                                        >
                                            取消
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            保存配置
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* Database Maintenance */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                            <Database size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">数据库维护与备份</h3>
                            <p className="text-sm text-slate-500">管理数据库连接、执行备份与恢复</p>
                        </div>
                    </div>

                    {/* Connection Status & Actions */}
                    <div className="bg-slate-50 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                {isConnected ? '服务运行中' : '服务未连接'}
                            </div>
                            <span className="text-sm text-slate-400">每日 02:00 自动备份</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={checkServerStatus}
                                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                            >
                                测试连接
                            </button>
                            <button
                                onClick={handleCreateBackup}
                                disabled={isProcessing || !isConnected}
                                className={`px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 ${isProcessing || !isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Plus size={16} />}
                                立即备份
                            </button>
                        </div>
                    </div>

                    {/* Backup List */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Archive size={16} /> 备份文件列表
                        </h4>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-2 font-medium">文件名</th>
                                        <th className="px-4 py-2 font-medium">大小</th>
                                        <th className="px-4 py-2 font-medium">创建时间</th>
                                        <th className="px-4 py-2 font-medium text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {isLoadingBackups ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">加载中...</td></tr>
                                    ) : backups.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">暂无备份文件</td></tr>
                                    ) : (
                                        backups.map(backup => (
                                            <tr key={backup.filename} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-mono text-slate-600 break-all">{backup.filename}</td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {(backup.size / 1024).toFixed(1)} KB
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={14} />
                                                        {new Date(backup.createdAt).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleDownloadBackup(backup.filename)}
                                                        disabled={isProcessing}
                                                        className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded disabled:opacity-30"
                                                        title="导出下载"
                                                    >
                                                        <FileDown size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRestoreBackup(backup.filename)}
                                                        disabled={isProcessing}
                                                        className="text-orange-600 hover:text-orange-700 p-1.5 hover:bg-orange-50 rounded disabled:opacity-30"
                                                        title="恢复此备份"
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBackup(backup.filename)}
                                                        disabled={isProcessing}
                                                        className="text-red-500 hover:text-red-600 p-1.5 hover:bg-red-50 rounded disabled:opacity-30"
                                                        title="删除"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ... End of main content ... */}
            </div >

            {
                statusMsg && (
                    <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-xl border flex items-center gap-3 animate-bounce-in min-w-[320px] backdrop-blur-md ${statusMsg.type === 'success' ? 'bg-white/90 text-emerald-600 border-emerald-100' : 'bg-white/90 text-red-600 border-red-100'}`}>
                        {statusMsg.type === 'success' ? <CheckCircle size={24} className="text-emerald-500" /> : <AlertTriangle size={24} className="text-red-500" />}
                        <div>
                            <h4 className="font-bold text-sm">{statusMsg.type === 'success' ? '操作成功' : '操作失败'}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{statusMsg.text}</p>
                        </div>
                        <button
                            onClick={() => setStatusMsg(null)}
                            className="ml-auto p-1 rounded-full hover:bg-slate-100/50 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )
            }
        </>
    );
};
