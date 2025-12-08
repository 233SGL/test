
import React, { useState, useRef, useMemo } from 'react';
import { useAuth, ROLE_LABELS } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { UserRole, SystemUser, PERMISSION_LIST, Permission } from '../../types';
import { db, API_BASE } from '../../services/db';
import { 
  Database, 
  RotateCcw, 
  Download, 
  Upload, 
  Lock, 
  CheckCircle,
  AlertTriangle,
  Users,
  Plus,
  Trash2,
  Key,
  FileJson,
  Search
} from 'lucide-react';

export const Settings: React.FC = () => {
    const { hasPermission, user: currentUser } = useAuth();
    const { resetMonthData, systemUsers, addSystemUser, updateSystemUser, deleteSystemUser, workshops, isSaving } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string | undefined;
    const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string | undefined;
  
  // User Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState<Partial<SystemUser>>({});
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [rawJson, setRawJson] = useState('');

  const canManageSystem = hasPermission('MANAGE_SYSTEM');

  const filteredUsers = useMemo(() => {
    return systemUsers.filter(u => 
        u.displayName.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
        u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        (u.customRoleName && u.customRoleName.includes(userSearchTerm))
    );
  }, [systemUsers, userSearchTerm]);

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

  const handleResetDB = async () => {
    if (confirm('警告：此操作将清空所有历史数据并重置为初始状态！此操作不可逆！\n\n确定要继续吗？')) {
        setIsProcessing(true);
        try {
            await db.resetDatabase();
            await resetMonthData(); // Reload context
            showStatus('success', '数据库已重置为出厂设置');
        } catch (e) {
            showStatus('error', '重置失败');
        } finally {
            setIsProcessing(false);
        }
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);
    try {
        const json = await db.exportDatabase();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `heshan_payroll_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        showStatus('success', '备份文件已导出');
    } catch (e) {
        showStatus('error', '导出失败');
    } finally {
        setIsProcessing(false);
    }
  };

  const testSupabaseConnection = async () => {
    try {
        // 测试后端连接（后端会连接到 Supabase）
        const res = await fetch(`${API_BASE}/health`);
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            showStatus('success', '后端已连接 Supabase 数据库');
          } else {
            showStatus('error', '后端无法连接数据库');
          }
        } else {
          showStatus('error', `后端服务错误：HTTP ${res.status}`);
        }
    } catch (e) {
        showStatus('error', `无法连接后端服务（${API_BASE})`);
    }
  };  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (confirm('即将覆盖当前所有数据，确定要导入吗？')) {
          setIsProcessing(true);
          const reader = new FileReader();
          reader.onload = async (ev) => {
              try {
                  const content = ev.target?.result as string;
                  const success = await db.importDatabase(content);
                  if (success) {
                      await resetMonthData(); // Reload context
                      showStatus('success', '数据导入成功');
                  } else {
                      showStatus('error', '导入文件格式错误');
                  }
              } catch (err) {
                  showStatus('error', '导入失败');
              } finally {
                  setIsProcessing(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
              }
          };
          reader.readAsText(file);
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

  const inspectData = async () => {
      const json = await db.exportDatabase();
      setRawJson(json);
      setInspectorOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">系统全局设置</h1>
        <p className="text-slate-500">管理全局用户权限与数据库维护</p>
      </div>

      {statusMsg && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {statusMsg.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              <span className="font-medium">{statusMsg.text}</span>
          </div>
      )}

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
                                )}) : (
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
      </div>

      {/* User Modal */}
      {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
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
                                  onChange={e => setUserForm({...userForm, displayName: e.target.value})}
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
                                  onChange={e => setUserForm({...userForm, username: e.target.value})}
                              />
                          </div>
                          <div>
                              <label htmlFor="user-pin" className="block text-sm font-medium text-slate-700 mb-1">登录 PIN 码</label>
                              <input 
                                  id="user-pin"
                                  type="text" required
                                  className="w-full border border-slate-300 rounded px-3 py-2 font-mono tracking-widest"
                                  value={userForm.pinCode || ''}
                                  onChange={e => setUserForm({...userForm, pinCode: e.target.value})}
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
                                  onChange={e => setUserForm({...userForm, customRoleName: e.target.value})}
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
      )}

      {/* Database Maintenance Section (Bottom) */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Database size={20} />
              </div>
              <div>
                  <h3 className="text-lg font-bold text-slate-800">数据库维护</h3>
                  <p className="text-sm text-slate-500">备份、恢复与重置系统数据；测试 Supabase 连通性</p>
              </div>
          </div>
          <div className="p-6">
              <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={handleExport} disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 shadow-sm transition"
                  >
                      <Download size={18} /> 导出备份
                  </button>
                                    <button 
                                        onClick={handleImportClick} disabled={isProcessing}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 shadow-sm transition"
                                    >
                                            <Upload size={18} aria-hidden="true" /> 恢复数据
                                    </button>
                                    <label htmlFor="import-backup" className="sr-only">选择要导入的备份文件</label>
                                    <input
                                        id="import-backup"
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".json"
                                        onChange={handleFileChange}
                                        aria-label="导入备份文件"
                                    />
                  
                  <div className="flex-1"></div>
                  
                                    <button 
                                        onClick={testSupabaseConnection}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition"
                                    >
                                            测试 Supabase 连接
                                    </button>

                  <button 
                    onClick={inspectData}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"
                  >
                      <FileJson size={18} /> 查看源数据
                  </button>

                  <button 
                    onClick={handleResetDB} disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition"
                  >
                      <RotateCcw size={18} /> 恢复出厂设置
                  </button>
              </div>
          </div>
      </div>

      {/* JSON Inspector Modal */}
      {inspectorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                      <h3 className="text-white font-mono font-bold flex items-center gap-2">
                          <Database size={18} /> DB Inspector
                      </h3>
                      <button onClick={() => setInspectorOpen(false)} className="text-slate-400 hover:text-white">Close</button>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                      <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap break-all">
                          {rawJson}
                      </pre>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
