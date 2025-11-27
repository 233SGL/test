
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, Employee } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  ShieldAlert, 
  X, 
  Save, 
  User, 
  Briefcase, 
  Calendar, 
  Phone,
  CreditCard,
  FileText,
  Clock
} from 'lucide-react';

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    probation: 'bg-amber-100 text-amber-800 border-amber-200',
    leave: 'bg-blue-100 text-blue-800 border-blue-200',
    terminated: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  const labels: Record<string, string> = {
    active: '正式在职',
    probation: '试用期',
    leave: '休假中',
    terminated: '已离职',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.active}`}>
      {labels[status] || status}
    </span>
  );
};

export const Employees: React.FC = () => {
  const { employees, addEmployee, updateEmployee } = useData();
  const { hasPermission } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Derive unique departments and positions for suggestions
  const existingDepartments = useMemo(() => Array.from(new Set(employees.map(e => e.department))), [employees]);
  const existingPositions = useMemo(() => Array.from(new Set(employees.map(e => e.position))), [employees]);

  // Form State
  const initialFormState: Omit<Employee, 'id'> = {
    name: '',
    gender: 'male',
    department: '',
    position: '',
    joinDate: new Date().toISOString().split('T')[0],
    standardBaseScore: 5000,
    status: 'active',
    phone: '',
    notes: '',
    expectedDailyHours: 12
  };
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>(initialFormState);

  const canManage = hasPermission('MANAGE_EMPLOYEES');
  
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            emp.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [employees, searchTerm, statusFilter]);

  const handleEditClick = (emp: Employee) => {
    setEditingEmp(emp);
    setFormData({ ...emp, expectedDailyHours: emp.expectedDailyHours || 12 }); 
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingEmp(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmp) {
        await updateEmployee({ ...formData, id: editingEmp.id });
    } else {
        await addEmployee(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (emp: Employee) => {
    if (confirm(`确定要将 ${emp.name} 标记为离职吗？\n(历史数据将保留，但不再参与新月份计算)`)) {
        await updateEmployee({ ...emp, status: 'terminated' });
    }
  };

  if (!canManage) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <ShieldAlert size={48} className="mb-4" />
            <h2 className="text-xl font-semibold">权限不足：您没有管理员工档案的权限</h2>
        </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">员工档案库</h1>
          <p className="text-slate-500">全厂人员信息管理、技能评分与状态维护</p>
        </div>
        <button 
            onClick={handleCreateClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition font-medium"
        >
            <Plus size={18} /> 新增员工
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="搜索姓名、车间或职位..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            <select 
                className="border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
            >
                <option value="all">所有状态</option>
                <option value="active">正式在职</option>
                <option value="probation">试用期</option>
                <option value="leave">休假中</option>
                <option value="terminated">已离职</option>
            </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
            {filteredEmployees.map(emp => (
                <div key={emp.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col relative group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${emp.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                {emp.name[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">{emp.name}</h3>
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                    {emp.department} · {emp.position}
                                </div>
                            </div>
                        </div>
                        <StatusBadge status={emp.status} />
                    </div>
                    
                    <div className="space-y-3 mb-6 flex-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">入职日期</span>
                            <span className="font-medium text-slate-700">{emp.joinDate}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">每日工时标准</span>
                            <span className="font-medium text-slate-700">{emp.expectedDailyHours || 12} 小时</span>
                        </div>
                        <div className="flex justify-between text-sm items-center pt-2 border-t border-slate-100">
                            <span className="text-slate-500 font-bold">技能基础分</span>
                            <span className="font-bold text-blue-600 text-lg bg-blue-50 px-2 rounded">{emp.standardBaseScore}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleEditClick(emp)}
                            className="flex-1 py-2 flex items-center justify-center gap-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                        >
                            <Edit3 size={16} /> 详情/编辑
                        </button>
                        {emp.status !== 'terminated' && (
                            <button 
                                onClick={() => handleDelete(emp)}
                                className="px-3 py-2 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 transition-colors"
                                title="标记离职"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
            
            {filteredEmployees.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                    <User size={48} className="mb-4 opacity-50" />
                    <p>没有找到符合条件的员工</p>
                </div>
            )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-slate-800">
                        {editingEmp ? '编辑员工档案' : '录入新员工'}
                    </h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSave} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                            <User size={16} /> 基本信息
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">姓名 <span className="text-red-500">*</span></label>
                                <input 
                                    required type="text" 
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">性别</label>
                                <select 
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}
                                >
                                    <option value="male">男</option>
                                    <option value="female">女</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">联系电话</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input 
                                        type="tel" 
                                        className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Briefcase size={16} /> 岗位信息
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">所属车间/部门 (可手填)</label>
                                <input 
                                    list="dept-list"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.department} 
                                    onChange={e => setFormData({...formData, department: e.target.value})}
                                />
                                <datalist id="dept-list">
                                    {existingDepartments.map(d => <option key={d} value={d} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">职位 (可手填)</label>
                                <input 
                                    list="pos-list"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.position} 
                                    onChange={e => setFormData({...formData, position: e.target.value})}
                                />
                                <datalist id="pos-list">
                                    {existingPositions.map(p => <option key={p} value={p} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">入职日期</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input 
                                        type="date" 
                                        className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">在职状态</label>
                                <select 
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}
                                >
                                    <option value="active">正式在职</option>
                                    <option value="probation">试用期</option>
                                    <option value="leave">休假中</option>
                                    <option value="terminated">已离职</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                            <CreditCard size={16} /> 薪资与工时标准
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <label className="block text-sm font-medium text-slate-700 mb-2">技能基础分 (Standard)</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        className="w-full text-lg font-bold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-blue-600"
                                        value={formData.standardBaseScore} onChange={e => setFormData({...formData, standardBaseScore: parseInt(e.target.value) || 0})}
                                    />
                                    <span className="text-slate-400 text-sm whitespace-nowrap">分</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-2">影响基础分计算</div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <label className="block text-sm font-medium text-slate-700 mb-2">每日标准工时</label>
                                <div className="flex items-center gap-2">
                                    <Clock size={20} className="text-slate-400"/>
                                    <input 
                                        type="number" min="0" max="24" step="0.5"
                                        className="w-full text-lg font-bold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                                        value={formData.expectedDailyHours} onChange={e => setFormData({...formData, expectedDailyHours: parseFloat(e.target.value) || 0})}
                                    />
                                    <span className="text-slate-400 text-sm whitespace-nowrap">小时</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-2">用于智能填充（支持0.5小数）</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                         <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                            <FileText size={16} /> 备注
                        </h3>
                        <textarea 
                            rows={3}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})}
                            placeholder="填写备注信息..."
                        ></textarea>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
                        >
                            取消
                        </button>
                        <button 
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
                        >
                            <Save size={18} />
                            {editingEmp ? '保存更改' : '确认录入'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
