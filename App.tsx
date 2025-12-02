import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { SalaryCalculator } from './pages/SalaryCalculator';
import { Employees } from './pages/Employees';
import { Settings } from './pages/Settings';
import { StylingSettings } from './pages/StylingSettings';
import { Simulation } from './pages/Simulation';
import { Attendance } from './pages/Attendance';
import { ProductionData } from './pages/ProductionData';
import { Menu, Loader2, HardHat } from 'lucide-react';

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { isLoading } = useData();

  if (!user) return <Navigate to="/login" replace />;

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
          <span className="font-bold text-slate-800">薪酬管理系统</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600"
            aria-label="打开导航菜单"
          >
            <Menu size={24} aria-hidden="true" />
            <span className="sr-only">打开菜单</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

const WeavingPlaceholder = () => (
    <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <HardHat size={48} className="text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-600 mb-2">织造工段</h2>
        <p>该模块正在开发中，敬请期待...</p>
    </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Styling Section Routes */}
            <Route path="/" element={
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

            {/* Weaving Section Routes */}
            <Route path="/weaving" element={
                <Layout>
                    <WeavingPlaceholder />
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