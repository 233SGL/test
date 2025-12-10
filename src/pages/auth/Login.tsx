/**
 * 登录页面
 * 
 * 用户选择账号并输入PIN码进行身份验证
 * 设计规范: UI_UX_DESIGN_SPEC_V2.md
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { SystemUser } from '../../types';
import { ShieldCheck, Loader2, Lock, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { db } from '../../services/db';
import { getDefaultRoute } from '../../utils/routeHelpers';

export const Login: React.FC = () => {
    const { login, user } = useAuth();
    const { systemUsers, isLoading } = useData();
    const navigate = useNavigate();

    const [connecting, setConnecting] = useState(true);
    const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
    const [pinInput, setPinInput] = useState('');
    const [error, setError] = useState('');
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // Pre-connect DB on load
    useEffect(() => {
        db.connect().then(() => setConnecting(false));
    }, []);

    // Redirect if user is already logged in
    useEffect(() => {
        if (user) {
            const defaultRoute = getDefaultRoute(user.permissions);
            navigate(defaultRoute);
        }
    }, [user, navigate]);

    const handleUserClick = (u: SystemUser) => {
        setSelectedUser(u);
        setPinInput('');
        setError('');
        setFailedAttempts(0);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || submitting) return;

        setSubmitting(true);
        setError('');

        try {
            if (pinInput === selectedUser.pinCode) {
                // 检查是否有任何权限
                const defaultRoute = getDefaultRoute(selectedUser.permissions);
                if (defaultRoute === '/login') {
                    setError('此账号无任何权限，请联系管理员');
                    setFailedAttempts(0);
                    return;
                }

                // 记录登录成功
                try {
                    await fetch('/api/admin/login-record', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: selectedUser.id,
                            username: selectedUser.displayName,
                            action: 'LOGIN'
                        })
                    });
                } catch (err) {
                    console.error('记录登录失败:', err);
                }

                login(selectedUser);
                navigate(defaultRoute);
            } else {
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);

                // 记录登录失败
                try {
                    await fetch('/api/admin/login-record', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: selectedUser.id,
                            username: selectedUser.displayName,
                            action: 'LOGIN_FAILED'
                        })
                    });
                } catch (err) {
                    console.error('记录登录失败:', err);
                }

                if (newAttempts >= 3) {
                    setError('PIN 码错误，如需修改密码，请联系管理员');
                } else {
                    setError('PIN 码错误');
                }
                setPinInput('');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
            <div className="max-w-5xl w-full grid md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px]">

                {/* 左侧: 品牌区域 */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white p-12 flex flex-col justify-center relative overflow-hidden">
                    {/* 装饰背景 */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-20 left-10 w-64 h-64 bg-indigo-500 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-20 right-10 w-48 h-48 bg-sky-500 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/30">
                            <ShieldCheck size={36} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-bold mb-3 tracking-tight">积分管理系统</h1>
                        <p className="text-slate-300 text-lg mb-10">企业级积分权重管理系统 v2.5</p>

                        <div className="space-y-5">
                            {[
                                '角色权限分级管控',
                                '人员档案数据库管理',
                                '实时积分权重计算'
                            ].map((text, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <span className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-indigo-300 font-bold text-sm">
                                        {i + 1}
                                    </span>
                                    <span className="text-slate-300">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 右侧: 登录区域 */}
                <div className="p-12 flex flex-col justify-center relative bg-white">
                    {/* 加载状态 */}
                    {(isLoading || connecting) && (
                        <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                                <Loader2 size={24} className="text-indigo-600 animate-spin" />
                            </div>
                            <p className="text-slate-600 font-medium">正在安全连接数据库...</p>
                        </div>
                    )}

                    {!selectedUser ? (
                        // 步骤 1: 用户列表
                        <div className="animate-fade-in-up">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">欢迎回来</h2>
                            <p className="text-slate-500 mb-8">请选择您的登录账号</p>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {systemUsers.map((u) => (
                                    <button
                                        key={u.id}
                                        onClick={() => handleUserClick(u)}
                                        className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white 
                                                   hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100
                                                   transition-all duration-200 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-indigo-100 
                                                          flex items-center justify-center text-slate-600 
                                                          group-hover:text-indigo-600 transition-colors font-bold text-lg">
                                                {u.displayName[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">
                                                    {u.displayName}
                                                </div>
                                                <div className="text-sm text-slate-400 group-hover:text-indigo-500 transition-colors truncate">
                                                    {u.customRoleName || ROLE_LABELS[u.role].split(' ')[0]}
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // 步骤 2: PIN 输入
                        <div className="animate-fade-in-up">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 
                                          mb-8 transition-colors group"
                            >
                                <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                                返回切换账号
                            </button>

                            <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-xl">
                                <div className="w-14 h-14 rounded-xl bg-indigo-100 text-indigo-600 
                                              flex items-center justify-center text-2xl font-bold">
                                    {selectedUser.displayName[0]}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{selectedUser.displayName}</h3>
                                    <p className="text-slate-500 text-sm">{selectedUser.customRoleName || ROLE_LABELS[selectedUser.role]}</p>
                                </div>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        请输入 PIN 码 <span className="text-slate-400 font-normal">(默认: 1234)</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            autoFocus
                                            type="password"
                                            value={pinInput}
                                            onChange={e => { setPinInput(e.target.value); setError(''); }}
                                            className="input pl-11 text-lg tracking-[0.3em] font-mono h-12"
                                            placeholder="••••"
                                            maxLength={6}
                                        />
                                    </div>
                                    {error && (
                                        <p className="mt-2 text-sm text-rose-600 flex items-center gap-1.5">
                                            <AlertCircle size={14} />
                                            {error}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary w-full h-12 text-base shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            登录中...
                                        </>
                                    ) : (
                                        '登 录'
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* 底部状态 */}
                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${connecting ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                            <span>{connecting ? '连接数据库...' : '数据库已连接'}</span>
                        </div>
                        <span>System v2.5</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

