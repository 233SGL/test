/**
 * ========================================
 * 鹤山积分管理系统 - 应用主组件
 * ========================================
 * 
 * 本文件是应用的入口组件，负责：
 * - 路由配置（HashRouter）
 * - 全局布局（Layout）
 * - 上下文提供者嵌套（Auth + Data）
 * - 权限路由重定向
 * 
 * 路由结构：
 * - /login: 登录页
 * - /dashboard: 定型工段数据大盘
 * - /production-data: 定型工段生产数据录入
 * - /attendance: 定型工段每日工时
 * - /calculator: 定型工段积分计算
 * - /simulation: 定型工段模拟沙箱
 * - /styling-settings: 定型工段设置
 * - /weaving/*: 织造工段相关页面
 * - /employees: 员工档案管理
 * - /settings: 系统设置
 * 
 * @module App
 */

import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/styling/Dashboard';
import { SalaryCalculator } from './pages/styling/SalaryCalculator';
import { Employees } from './pages/system/Employees';
import { Settings } from './pages/system/Settings';
import { StylingSettings } from './pages/styling/StylingSettings';
import { Simulation } from './pages/styling/Simulation';
import { Attendance } from './pages/styling/Attendance';
import { ProductionData } from './pages/styling/ProductionData';
// 织造工段新页面
import { ProductionEntry } from './pages/weaving/ProductionEntry';
import { ProductionRecords } from './pages/weaving/ProductionRecords';
import { MonthlySummary } from './pages/weaving/MonthlySummary';
import { BonusCalculation } from './pages/weaving/BonusCalculation';
import { MachineManagement } from './pages/weaving/MachineManagement';
import { ProductManagement } from './pages/weaving/ProductManagement';
import { Menu, Loader2 } from 'lucide-react';
import { getDefaultRoute } from './utils/routeHelpers';

/**
 * 主布局组件
 * 包含侧边栏和主内容区域，处理移动端响应式布局
 * 
 * @param children - 子组件（页面内容）
 */
const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { isLoading } = useData();

  // 未登录用户重定向到登录页
  if (!user) return <Navigate to="/login" replace />;

  // 数据加载中显示加载动画
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <p>正在同步数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
          <span className="font-bold text-slate-800">积分管理系统</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600"
            aria-label="打开导航菜单"
          >
            <Menu size={24} />
            <span className="sr-only">打开菜单</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

/**
 * 根路由重定向组件
 * 根据用户权限判断并重定向到默认页面
 */
const RootRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      const defaultRoute = getDefaultRoute(user.permissions);
      navigate(defaultRoute, { replace: true });
    }
  }, [user, navigate]);

  return <Navigate to="/login" replace />;
};

/**
 * 应用根组件
 * 配置全局上下文和路由
 */
const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Styling Section Routes */}
            <Route path="/" element={<RootRedirect />} />

            <Route path="/dashboard" element={
              <Layout>
                <Dashboard />
              </Layout>
            } />

            <Route path="/production-data" element={
              <Layout>
                <ProductionData />
              </Layout>
            } />

            <Route path="/attendance" element={
              <Layout>
                <Attendance />
              </Layout>
            } />

            <Route path="/calculator" element={
              <Layout>
                <SalaryCalculator />
              </Layout>
            } />

            <Route path="/simulation" element={
              <Layout>
                <Simulation />
              </Layout>
            } />

            <Route path="/styling-settings" element={
              <Layout>
                <StylingSettings />
              </Layout>
            } />

            {/* Weaving Section Routes - 新页面结构 */}
            <Route path="/weaving" element={
              <Layout>
                <MonthlySummary />
              </Layout>
            } />
            <Route path="/weaving/entry" element={
              <Layout>
                <ProductionEntry />
              </Layout>
            } />
            <Route path="/weaving/records" element={
              <Layout>
                <ProductionRecords />
              </Layout>
            } />
            <Route path="/weaving/bonus" element={
              <Layout>
                <BonusCalculation />
              </Layout>
            } />
            <Route path="/weaving/machines" element={
              <Layout>
                <MachineManagement />
              </Layout>
            } />
            <Route path="/weaving/products" element={
              <Layout>
                <ProductManagement />
              </Layout>
            } />

            {/* System Routes */}
            <Route path="/employees" element={
              <Layout>
                <Employees />
              </Layout>
            } />

            <Route path="/settings" element={
              <Layout>
                <Settings />
              </Layout>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;