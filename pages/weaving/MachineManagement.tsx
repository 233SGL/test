/**
 * ========================================
 * 织造工段 - 机台管理页面
 * ========================================
 * 
 * 11台织机的状态监控和属性配置
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Pause,
  Wrench,
  AlertTriangle,
  Check,
  X,
  Loader2,
  Edit3
} from 'lucide-react';

// ========================================
// 类型定义
// ========================================

interface Machine {
  id: string;
  name: string;
  speedType: 'H2' | 'H5';
  width: number;          // 织造宽度（用于计算）
  effectiveWidth?: number; // 有效幅宽（可选）
  speedWeftPerMin?: number; // 速度（可选）
  targetOutput: number;
  status: 'running' | 'threading' | 'maintenance' | 'idle';
}

// ========================================
// API 函数
// ========================================

const API_BASE = '/api/weaving';

async function fetchMachines(): Promise<Machine[]> {
  const res = await fetch(`${API_BASE}/machines`);
  if (!res.ok) throw new Error('获取机台失败');
  return res.json();
}

async function updateMachine(id: string, data: Partial<Machine>): Promise<void> {
  const res = await fetch(`${API_BASE}/machines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('更新失败');
}

// ========================================
// 状态配置
// ========================================

const STATUS_CONFIG = {
  running: {
    label: '运行中',
    color: 'emerald',
    icon: Activity,
    bgClass: 'bg-emerald-100 border-emerald-300',
    textClass: 'text-emerald-700'
  },
  threading: {
    label: '穿线中',
    color: 'amber',
    icon: Pause,
    bgClass: 'bg-amber-100 border-amber-300',
    textClass: 'text-amber-700'
  },
  maintenance: {
    label: '维护中',
    color: 'blue',
    icon: Wrench,
    bgClass: 'bg-blue-100 border-blue-300',
    textClass: 'text-blue-700'
  },
  idle: {
    label: '停机',
    color: 'slate',
    icon: AlertTriangle,
    bgClass: 'bg-slate-100 border-slate-300',
    textClass: 'text-slate-500'
  }
};

// ========================================
// 机台卡片组件
// ========================================

interface MachineCardProps {
  machine: Machine;
  onStatusChange: (status: Machine['status']) => void;
  onEdit: () => void;
}

const MachineCard: React.FC<MachineCardProps> = ({ machine, onStatusChange, onEdit }) => {
  // 添加默认状态保护，防止未知状态导致崩溃
  const statusConfig = STATUS_CONFIG[machine.status] || STATUS_CONFIG.idle;
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`relative bg-white rounded-2xl border-2 ${statusConfig.bgClass} p-5 transition-all hover:shadow-lg`}>
      {/* 状态指示灯 */}
      <div className="absolute top-4 right-4">
        <div className={`w-3 h-3 rounded-full ${machine.status === 'running' ? 'bg-emerald-500 animate-pulse' :
            machine.status === 'threading' ? 'bg-amber-500' :
              machine.status === 'maintenance' ? 'bg-blue-500' :
                'bg-slate-400'
          }`} />
      </div>

      {/* 机台名称 */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl ${statusConfig.bgClass} flex items-center justify-center`}>
          <span className="text-xl font-bold text-slate-700">{machine.id.replace('H', '')}</span>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-800">{machine.name}</div>
          <div className={`text-sm flex items-center gap-1 ${statusConfig.textClass}`}>
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </div>
        </div>
        {/* 编辑按钮 */}
        <button
          onClick={onEdit}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="编辑机台"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      {/* 机台属性 */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-xs text-slate-500">织造宽度</div>
          <div className="font-semibold text-slate-700">{machine.width}m</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-xs text-slate-500">速度</div>
          <div className="font-semibold text-slate-700">{machine.speedWeftPerMin}纬/分</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-xs text-slate-500">月目标</div>
          <div className="font-semibold text-slate-700">{machine.targetOutput}㎡</div>
        </div>
      </div>

      {/* 状态切换 */}
      <div className="flex gap-2">
        {(['running', 'threading', 'maintenance', 'idle'] as const).map(status => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all ${machine.status === status
                ? `${STATUS_CONFIG[status].bgClass} ${STATUS_CONFIG[status].textClass}`
                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
          >
            {STATUS_CONFIG[status].label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ========================================
// 编辑弹窗组件
// ========================================

interface EditModalProps {
  machine: Machine | null;
  onClose: () => void;
  onSave: (data: Partial<Machine>) => void;
}

const EditModal: React.FC<EditModalProps> = ({ machine, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: '',
    speedType: 'H2' as 'H2' | 'H5',
    loomWidth: 8.5,
    width: 7.7,
    speedWeftPerMin: 41,
    targetOutput: 6450
  });

  useEffect(() => {
    if (machine) {
      setForm({
        name: machine.name,
        speedType: machine.speedType,
        loomWidth: machine.width,
        width: machine.width,
        speedWeftPerMin: machine.speedWeftPerMin || 0,
        targetOutput: machine.targetOutput
      });
    }
  }, [machine]);

  if (!machine) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md m-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">编辑 {machine.name}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="关闭" title="关闭">
            <X className="w-5 h-5 text-slate-500" aria-hidden="true" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="machine-name" className="block text-sm font-medium text-slate-700 mb-1">名称</label>
            <input
              id="machine-name"
              name="machine-name"
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="loom-width" className="block text-sm font-medium text-slate-700 mb-1">织机宽度 (m)</label>
              <input
                id="loom-width"
                name="loom-width"
                type="number"
                step="0.1"
                value={form.loomWidth}
                onChange={e => setForm(f => ({ ...f, loomWidth: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                aria-describedby="loom-width-desc"
              />
              <p id="loom-width-desc" className="text-xs text-slate-400 mt-1">仅作记录，不参与计算</p>
            </div>
            <div>
              <label htmlFor="weaving-width" className="block text-sm font-medium text-slate-700 mb-1">织造宽度 (m)</label>
              <input
                id="weaving-width"
                name="weaving-width"
                type="number"
                step="0.1"
                value={form.width}
                onChange={e => setForm(f => ({ ...f, width: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                aria-describedby="weaving-width-desc"
              />
              <p id="weaving-width-desc" className="text-xs text-slate-400 mt-1">用于产量计算</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="speed-weft" className="block text-sm font-medium text-slate-700 mb-1">速度 (纬/分)</label>
              <input
                id="speed-weft"
                name="speed-weft"
                type="number"
                value={form.speedWeftPerMin}
                onChange={e => setForm(f => ({ ...f, speedWeftPerMin: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="target-output" className="block text-sm font-medium text-slate-700 mb-1">月目标 (㎡)</label>
              <input
                id="target-output"
                name="target-output"
                type="number"
                value={form.targetOutput}
                onChange={e => setForm(f => ({ ...f, targetOutput: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================
// 主组件
// ========================================

export const MachineManagement: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  // 机台按数字排序（H1, H2, ... H11）
  const sortMachines = (machines: Machine[]) => {
    return [...machines].sort((a, b) => {
      const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  };

  // 加载数据
  useEffect(() => {
    fetchMachines()
      .then(data => {
        setMachines(sortMachines(data));
        setLoading(false);
      })
      .catch(() => {
        // 使用默认数据
        setMachines([
          { id: 'H1', name: '1号机', speedType: 'H2', width: 8.5, effectiveWidth: 7.7, speedWeftPerMin: 41, targetOutput: 6450, status: 'running' },
          { id: 'H2', name: '2号机', speedType: 'H2', width: 8.5, effectiveWidth: 7.7, speedWeftPerMin: 41, targetOutput: 6450, status: 'running' },
          { id: 'H3', name: '3号机', speedType: 'H2', width: 8.5, effectiveWidth: 7.7, speedWeftPerMin: 41, targetOutput: 6450, status: 'threading' },
          { id: 'H4', name: '4号机', speedType: 'H2', width: 8.5, effectiveWidth: 7.7, speedWeftPerMin: 41, targetOutput: 6450, status: 'running' },
          { id: 'H5', name: '5号机', speedType: 'H5', width: 4.25, effectiveWidth: 3.85, speedWeftPerMin: 23, targetOutput: 3600, status: 'running' },
          { id: 'H6', name: '6号机', speedType: 'H2', width: 8.5, effectiveWidth: 7.7, speedWeftPerMin: 41, targetOutput: 6450, status: 'running' },
          { id: 'H7', name: '7号机', speedType: 'H2', width: 8.5, effectiveWidth: 7.7, speedWeftPerMin: 41, targetOutput: 6450, status: 'maintenance' },
          { id: 'H8', name: '8号机', speedType: 'H2', width: 8.5, effectiveWidth: 7.7, speedWeftPerMin: 41, targetOutput: 6450, status: 'running' },
          { id: 'H9', name: '9号机', speedType: 'H2', width: 8.5, effectiveWidth: 7.7, speedWeftPerMin: 41, targetOutput: 6450, status: 'running' },
          { id: 'H10', name: '10号机', speedType: 'H2', width: 8.5, effectiveWidth: 7.7, speedWeftPerMin: 41, targetOutput: 6450, status: 'running' },
          { id: 'H11', name: '11号机', speedType: 'H2', width: 8.5, effectiveWidth: 7.7, speedWeftPerMin: 41, targetOutput: 6450, status: 'idle' },
        ]);
        setLoading(false);
      });
  }, []);

  // 更新状态
  const handleStatusChange = async (machineId: string, status: Machine['status']) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;

    try {
      // 传递完整的机台数据
      await updateMachine(machineId, {
        name: machine.name,
        speedType: machine.speedType,
        width: machine.width,
        targetOutput: machine.targetOutput,
        status
      });
      setMachines(prev => prev.map(m => m.id === machineId ? { ...m, status } : m));
    } catch (err) {
      console.error('更新状态失败:', err);
      // 仍然本地更新以保持UI响应
      setMachines(prev => prev.map(m => m.id === machineId ? { ...m, status } : m));
    }
  };

  // 保存编辑
  const handleSaveEdit = async (data: Partial<Machine>) => {
    if (!editingMachine) return;
    try {
      await updateMachine(editingMachine.id, data);
      setMachines(prev => prev.map(m => m.id === editingMachine.id ? { ...m, ...data } : m));
    } catch {
      setMachines(prev => prev.map(m => m.id === editingMachine.id ? { ...m, ...data } : m));
    }
    setEditingMachine(null);
  };

  // 统计
  const stats = {
    running: machines.filter(m => m.status === 'running').length,
    threading: machines.filter(m => m.status === 'threading').length,
    maintenance: machines.filter(m => m.status === 'maintenance').length,
    idle: machines.filter(m => m.status === 'idle').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">机台管理</h1>
          <p className="text-sm text-slate-500 mt-1">11台织机状态监控与配置</p>
        </div>
      </div>

      {/* 状态统计 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">{stats.running}</div>
            <div className="text-xs text-emerald-600">运行中</div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Pause className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">{stats.threading}</div>
            <div className="text-xs text-amber-600">穿线中</div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-700">{stats.maintenance}</div>
            <div className="text-xs text-blue-600">维护中</div>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-600">{stats.idle}</div>
            <div className="text-xs text-slate-500">停机</div>
          </div>
        </div>
      </div>

      {/* 机台网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {machines.map(machine => (
          <MachineCard
            key={machine.id}
            machine={machine}
            onStatusChange={status => handleStatusChange(machine.id, status)}
            onEdit={() => setEditingMachine(machine)}
          />
        ))}
      </div>

      {/* 编辑弹窗 */}
      <EditModal
        machine={editingMachine}
        onClose={() => setEditingMachine(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default MachineManagement;
