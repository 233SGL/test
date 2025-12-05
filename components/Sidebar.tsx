import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calculator,
  Users,
  Settings,
  LogOut,
  X,
  Database,
  CalendarDays,
  Factory,
  Layers,
  ChevronDown,
  ChevronRight,
  Grid3X3,
  Server,
  MonitorPlay,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export const Sidebar = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => {
  const { user, logout, role, hasPermission, hasScope } = useAuth();
  const { isSaving } = useData();
  const location = useLocation();

  const [expandedSections, setExpandedSections] = useState<string[]>(['styling', 'weaving', 'system']);

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const menuStructure = [
    {
      id: 'styling',
      title: '定型工段',
      icon: Layers,
      visible: hasScope('styling'),
      items: [
        { icon: LayoutDashboard, label: '数据大盘', to: '/dashboard', visible: hasPermission('VIEW_DASHBOARD') },
        { icon: Factory, label: '生产录入', to: '/production-data', visible: hasPermission('VIEW_PRODUCTION') },
        { icon: CalendarDays, label: '每日工时', to: '/attendance', visible: hasPermission('VIEW_ATTENDANCE') },
        { icon: Calculator, label: '积分计算', to: '/calculator', visible: hasPermission('VIEW_CALCULATOR') },
        { icon: MonitorPlay, label: '积分模拟', to: '/simulation', visible: hasPermission('VIEW_SIMULATION') },
        { icon: Megaphone, label: '工段公告', to: '/styling-settings', visible: hasPermission('MANAGE_ANNOUNCEMENTS') },
      ]
    },
    {
      id: 'weaving',
      title: '织造工段',
      icon: Grid3X3,
      visible: hasScope('weaving'),
      items: [
        { icon: LayoutDashboard, label: '工段总览', to: '/weaving', visible: true, end: true },
        { icon: Database, label: '数据录入', to: '/weaving/data-entry', visible: hasPermission('VIEW_WEAVING_DATA_ENTRY') },
        { icon: Calculator, label: '积分计算', to: '/weaving/calculator', visible: hasPermission('VIEW_WEAVING_CALCULATOR') },
        { icon: Settings, label: '工段配置', to: '/weaving/config', visible: hasPermission('VIEW_WEAVING_CONFIG') },
      ]
    },
    {
      id: 'system',
      title: '系统管理',
      icon: Server,
      visible: hasPermission('VIEW_EMPLOYEES') || hasPermission('MANAGE_SYSTEM'),
      items: [
        { icon: Users, label: '员工档案', to: '/employees', visible: hasPermission('VIEW_EMPLOYEES') },
        { icon: Settings, label: '全局设置', to: '/settings', visible: hasPermission('MANAGE_SYSTEM') },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static flex flex-col shadow-2xl
        `}
      >
        <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-white shadow-lg shadow-primary-500/30">
              H
            </div>
            <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">积分管理系统</span>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="lg:hidden text-slate-400"
            aria-label="关闭侧边栏"
          >
            <X size={24} aria-hidden="true" />
            <span className="sr-only">关闭</span>
          </button>
        </div>

        <div className="p-4 border-b border-slate-800/40">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 transition-all duration-200 cursor-pointer group">
            <div className="relative">
              <img src={user?.avatar} alt="User" className="w-11 h-11 rounded-xl border-2 border-slate-700/50 group-hover:border-primary-500/50 transition-colors shadow-lg" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full ring-2 ring-emerald-500/20"></span>
            </div>
            <div className="overflow-hidden flex-1">
              <p className="font-semibold text-sm truncate group-hover:text-white transition-colors">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate font-medium">{role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
          {menuStructure.filter(section => section.visible).map(section => {
            const isExpanded = expandedSections.includes(section.id);
            const visibleItems = section.items.filter(i => i.visible !== false);

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.id} className="mb-2">
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-bold uppercase tracking-wider ${isExpanded ? 'text-slate-300 bg-slate-800/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/20'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <section.icon size={16} className={isExpanded ? 'text-primary-400' : ''} />
                    <span>{section.title}</span>
                  </div>
                  <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown size={14} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-1.5 space-y-0.5 ml-3 pl-3 border-l-2 border-slate-700/50 animate-fade-in-up">
                    {visibleItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => window.innerWidth < 1024 && toggle()}
                        className={({ isActive }) => `
                          flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm relative overflow-hidden
                          ${isActive
                            ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30 font-medium'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
                        `}
                      >
                        <item.icon size={17} />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Database Status Indicator */}
        <div className="px-4 py-4 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/40 rounded-xl text-xs text-emerald-400 border border-slate-700/50">
            <Database size={14} />
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium">数据库已连接</span>
            </div>
          </div>

          {isSaving && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-primary-400 bg-primary-500/10 rounded-lg">
              <span className="w-3 h-3 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></span>
              正在保存数据...
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800/60">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200 group"
          >
            <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
            <span className="font-semibold">退出登录</span>
          </button>
        </div>
      </aside>
    </>
  );
};
