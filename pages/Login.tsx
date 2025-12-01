
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { SystemUser } from '../types';
import { ShieldCheck, Loader2, Lock, ChevronRight, ShieldAlert } from 'lucide-react';
import { db } from '../services/db';

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const { systemUsers, isLoading } = useData();
  const navigate = useNavigate();
  
  const [connecting, setConnecting] = useState(true);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');

  // Pre-connect DB on load
  useEffect(() => {
    db.connect().then(() => setConnecting(false));
  }, []);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleUserClick = (u: SystemUser) => {
      setSelectedUser(u);
      setPinInput('');
      setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (pinInput === selectedUser.pinCode) {
        login(selectedUser);
        navigate('/');
    } else {
        setError('PIN 码错误');
        setPinInput('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px]">
        
        {/* Left Side: Branding */}
        <div className="bg-slate-900 text-white p-12 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 to-blue-900 opacity-50"></div>
            <div className="relative z-10">
                <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                    <ShieldCheck size={40} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-4">薪酬管理系统</h1>
                <p className="text-slate-300 text-lg mb-8">企业级薪酬权重管理系统 v2.5</p>
                <ul className="space-y-4 text-slate-400">
                    <li className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-accent font-bold">1</span>
                        <span>角色权限分级管控</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-accent font-bold">2</span>
                        <span>人员档案数据库管理</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-accent font-bold">3</span>
                        <span>实时薪酬权重计算</span>
                    </li>
                </ul>
            </div>
        </div>

        {/* Right Side: User Selection */}
        <div className="p-12 flex flex-col justify-center relative bg-slate-50">
          {(isLoading || connecting) && (
            <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 size={40} className="text-accent animate-spin mb-4" />
                <p className="text-slate-600 font-medium">正在安全连接数据库...</p>
            </div>
          )}

          {!selectedUser ? (
            // Step 1: User List
            <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">欢迎回来</h2>
                <p className="text-slate-500 mb-8">请选择您的登录账号</p>
                
                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {systemUsers.map((u) => (
                    <button
                        key={u.id}
                        onClick={() => handleUserClick(u)}
                        className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-accent hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-600 group-hover:text-blue-600 transition-colors font-bold">
                                {u.displayName[0]}
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-slate-700 group-hover:text-blue-700">
                                    {u.displayName}
                                </div>
                                <div className="text-xs text-slate-400 group-hover:text-blue-500">
                                    {u.customRoleName || ROLE_LABELS[u.role].split(' ')[0]}
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-accent" />
                        </div>
                    </button>
                    ))}
                </div>
            </div>
          ) : (
            // Step 2: PIN Entry
            <div className="animate-fade-in">
                 <button 
                    onClick={() => setSelectedUser(null)} 
                    className="text-sm text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1"
                >
                    ← 返回切换账号
                 </button>

                 <div className="flex items-center gap-4 mb-8">
                     <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
                        {selectedUser.displayName[0]}
                     </div>
                     <div>
                         <h3 className="text-xl font-bold text-slate-800">{selectedUser.displayName}</h3>
                         <p className="text-slate-500 text-sm">{selectedUser.customRoleName || ROLE_LABELS[selectedUser.role]}</p>
                     </div>
                 </div>

                 <form onSubmit={handleLogin} className="space-y-4">
                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-2">请输入 PIN 码 (默认: 1234)</label>
                         <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                autoFocus
                                type="password" 
                                value={pinInput}
                                onChange={e => { setPinInput(e.target.value); setError(''); }}
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-accent outline-none text-lg tracking-widest font-mono"
                                placeholder="****"
                                maxLength={6}
                            />
                         </div>
                         {error && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><ShieldAlert size={14}/> {error}</p>}
                     </div>
                     <button 
                        type="submit"
                        className="w-full py-3 bg-accent text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200 mt-4"
                     >
                        登 录
                     </button>
                 </form>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connecting ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
                <span>{connecting ? '连接数据库...' : '数据库已连接'}</span>
            </div>
            <span>System v2.5</span>
          </div>
        </div>
      </div>
    </div>
  );
};
