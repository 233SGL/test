import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Employee, Workshop } from '../../types';
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
    Clock,
    FolderOpen,
    FolderPlus,
    ChevronRight,
    MoreVertical,
    Layers,
    Lock
} from 'lucide-react';

// 系统核心工段，不可删除（与路由和系统功能硬绑定）
const PROTECTED_WORKSHOP_CODES = ['styling', 'weaving'];

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

// 日期格式化函数：将 ISO 格式转换为 YYYY-MM-DD
const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const Employees: React.FC = () => {
    const { employees, workshops, addEmployee, updateEmployee, deleteEmployee, addWorkshop, deleteWorkshop, addWorkshopFolder, deleteWorkshopFolder } = useData();
    const { hasPermission, hasScope } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Selection State
    const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(workshops[0]?.id || null);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null); // Department Name

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isWorkshopModalOpen, setIsWorkshopModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newWorkshopName, setNewWorkshopName] = useState('');
    const [newWorkshopCode, setNewWorkshopCode] = useState('');
    const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

    const canView = hasPermission('VIEW_EMPLOYEES');
    const canManage = hasPermission('MANAGE_EMPLOYEES');

    // Filter Logic
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            // 1. Scope/Workshop Filter
            if (selectedWorkshopId && emp.workshopId !== selectedWorkshopId) return false;
            // 2. Folder/Department Filter
            if (selectedFolder && emp.department !== selectedFolder) return false;

            const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.position.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [employees, searchTerm, statusFilter, selectedWorkshopId, selectedFolder]);

    // Form State
    const initialFormState: Omit<Employee, 'id'> = {
        name: '',
        gender: 'male',
        workshopId: selectedWorkshopId || '',
        department: selectedFolder || '',
        position: '',
        joinDate: new Date().toISOString().split('T')[0],
        standardBaseScore: 5000,
        status: 'active',
        phone: '',
        notes: '',
        expectedDailyHours: 12,
        coefficient: 1.0,
        baseSalary: 0
    };
    const [formData, setFormData] = useState<Omit<Employee, 'id'>>(initialFormState);

    const handleEditClick = (emp: Employee) => {
        if (!canManage) return;
        setEditingEmp(emp);
        setFormData({
            ...emp,
            expectedDailyHours: emp.expectedDailyHours || 12,
            joinDate: formatDate(emp.joinDate) // 确保日期格式正确
        });
        setIsModalOpen(true);
    };

    const handleCreateClick = () => {
        if (!canManage) return;
        if (!selectedWorkshopId) {
            alert("请先选择一个工段");
            return;
        }
        setEditingEmp(null);
        setFormData({
            ...initialFormState,
            workshopId: selectedWorkshopId,
            department: selectedFolder || ''
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canManage) return;
        if (editingEmp) {
            await updateEmployee({ ...formData, id: editingEmp.id });
        } else {
            await addEmployee(formData);
        }
        setIsModalOpen(false);
    };

    const handleDelete = async (emp: Employee) => {
        if (!canManage) return;
        if (confirm(`确定要将 ${emp.name} 标记为离职吗？\n(历史数据将保留)`)) {
            await updateEmployee({ ...emp, status: 'terminated' });
        }
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canManage) return;
        if (selectedWorkshopId && newFolderName) {
            try {
                await addWorkshopFolder(selectedWorkshopId, newFolderName);
                setNewFolderName('');
                setIsFolderModalOpen(false);
            } catch (error) {
                console.error(error);
                alert("创建文件夹失败，请重试");
            }
        }
    };

    const handleDeleteFolder = async (e: React.MouseEvent, wsId: string, folder: string) => {
        e.stopPropagation();
        if (!canManage) return;
        if (confirm(`确定要删除文件夹 "${folder}" 吗？\n注意：这不会删除里面的员工，但他们的部门信息可能需要更新。`)) {
            try {
                await deleteWorkshopFolder(wsId, folder);
                if (selectedFolder === folder) setSelectedFolder(null);
            } catch (error) {
                console.error(error);
                alert("删除文件夹失败");
            }
        }
    };

    const handleCreateWorkshop = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canManage) return;
        if (newWorkshopName && newWorkshopCode) {
            try {
                await addWorkshop(newWorkshopName, newWorkshopCode);
                setNewWorkshopName('');
                setNewWorkshopCode('');
                setIsWorkshopModalOpen(false);
            } catch (error) {
                console.error(error);
                alert("创建工段失败，Code 可能已存在");
            }
        }
    };

    const handleDeleteWorkshop = async (e: React.MouseEvent, wsId: string, wsName: string, wsCode: string) => {
        e.stopPropagation();
        if (!canManage) return;

        // 保护核心工段不被删除
        if (PROTECTED_WORKSHOP_CODES.includes(wsCode)) {
            alert(`❌ 无法删除核心工段\n\n「${wsName}」是系统核心工段，与路由和功能页面绑定。\n删除后会导致系统功能异常。\n\n如需调整，请联系系统管理员。`);
            return;
        }

        if (confirm(`⚠️ 严重警告：确定要删除整个工段 "${wsName}" 吗？\n此操作不可逆！\n请确保该工段下的所有员工已被转移或删除。`)) {
            await deleteWorkshop(wsId);
            if (selectedWorkshopId === wsId) setSelectedWorkshopId(null);
        }
    };

    // 检查工段是否为核心工段
    const isProtectedWorkshop = (code: string) => PROTECTED_WORKSHOP_CODES.includes(code);

    if (!canView && !canManage) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <ShieldAlert size={48} className="mb-4" />
                <h2 className="text-xl font-semibold">权限不足：您没有查看员工档案的权限</h2>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 animate-fade-in-up">

            {/* LEFT PANE: Workshops & Folders */}
            <div className="w-full md:w-72 flex-shrink-0 card flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-bold text-slate-700 flex justify-between items-center bg-slate-50/80">
                    <span className="flex items-center gap-2"><Layers size={18} className="text-primary-500" /> 组织架构</span>
                    {canManage && (
                        <div className="flex gap-1">
                            {/* 新增工段按钮已移除 - 新工段需要配置路由才能正常工作 */}
                            <button
                                onClick={() => setIsFolderModalOpen(true)}
                                disabled={!selectedWorkshopId}
                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all disabled:opacity-30" title="新建部门文件夹"
                            >
                                <FolderPlus size={18} />
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {workshops.map(ws => {
                        const hasAccess = hasScope('all') || hasScope(ws.code);
                        if (!hasAccess) return null;

                        const isWsSelected = selectedWorkshopId === ws.id;

                        return (
                            <div key={ws.id} className="group/ws">
                                <div
                                    onClick={() => { setSelectedWorkshopId(ws.id); setSelectedFolder(null); }}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer font-bold transition-all ${isWsSelected ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <ChevronRight size={16} className={`transition-transform duration-200 ${isWsSelected ? 'rotate-90 text-primary-500' : ''}`} />
                                        <span>{ws.name}</span>
                                    </div>
                                    {canManage && (
                                        <div className="flex items-center gap-1">
                                            {/* 快捷新建文件夹按钮 */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedWorkshopId(ws.id);
                                                    setIsFolderModalOpen(true);
                                                }}
                                                className="text-slate-300 hover:text-blue-500 opacity-0 group-hover/ws:opacity-100 transition-opacity p-1"
                                                title="在该工段下新建文件夹"
                                            >
                                                <FolderPlus size={14} />
                                            </button>

                                            {isProtectedWorkshop(ws.code) ? (
                                                <span className="text-slate-300 p-1" title="核心工段，不可删除">
                                                    <Lock size={14} />
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={(e) => handleDeleteWorkshop(e, ws.id, ws.name, ws.code)}
                                                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover/ws:opacity-100 transition-opacity p-1"
                                                    title="删除工段"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {isWsSelected && (
                                    <div className="ml-3 mt-1.5 space-y-0.5 border-l-2 border-primary-200 pl-3 animate-fade-in-up">
                                        <div
                                            onClick={() => setSelectedFolder(null)}
                                            className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-all ${!selectedFolder ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            全部人员
                                        </div>
                                        {ws.departments.map(dept => (
                                            <div
                                                key={dept}
                                                onClick={() => setSelectedFolder(dept)}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer group/folder transition-all ${selectedFolder === dept ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FolderOpen size={14} className={selectedFolder === dept ? 'text-primary-500' : 'text-slate-400'} />
                                                    <span>{dept}</span>
                                                </div>
                                                {canManage && (
                                                    <button
                                                        onClick={(e) => handleDeleteFolder(e, ws.id, dept)}
                                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover/folder:opacity-100 transition-opacity p-1"
                                                        title="删除文件夹"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* RIGHT PANE: Employees List */}
            <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            {selectedWorkshopId ? workshops.find(w => w.id === selectedWorkshopId)?.name : '所有员工'}
                            {selectedFolder && <span className="text-slate-400 font-normal"> / {selectedFolder}</span>}
                        </h1>
                        <p className="text-slate-500 text-sm mt-0.5">人员档案管理</p>
                    </div>
                    {canManage && (
                        <button
                            onClick={handleCreateClick}
                            disabled={!selectedWorkshopId}
                            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={18} /> 新增员工
                        </button>
                    )}
                </div>

                <div className="card p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <label htmlFor="employee-search" className="sr-only">搜索姓名或职位</label>
                        <input
                            id="employee-search"
                            type="text"
                            placeholder="搜索姓名或职位..."
                            className="input pl-10"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-slate-400" />
                        <label htmlFor="employee-status-filter" className="sr-only">筛选在职状态</label>
                        <select
                            id="employee-status-filter"
                            className="input py-2 min-w-[120px]"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
                        {filteredEmployees.map(emp => (
                            <div key={emp.id} className="card card-hover p-5 flex flex-col relative group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${emp.gender === 'male' ? 'bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600' : 'bg-gradient-to-br from-pink-100 to-pink-50 text-pink-600'}`}>
                                            {emp.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg">{emp.name}</h3>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                {emp.department} · {emp.position}
                                                {emp.machineId && <span className="bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-md ml-1 font-medium">{emp.machineId}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <StatusBadge status={emp.status} />
                                </div>

                                <div className="space-y-2.5 mb-5 flex-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">入职日期</span>
                                        <span className="font-medium text-slate-700 tabular-nums">{formatDate(emp.joinDate)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">每日工时标准</span>
                                        <span className="font-medium text-slate-700">{emp.expectedDailyHours || 12} 小时</span>
                                    </div>
                                    <div className="flex justify-between text-sm items-center pt-3 border-t border-slate-100">
                                        <span className="text-slate-600 font-semibold">技能基础分</span>
                                        <span className="font-bold text-primary-600 text-lg bg-primary-50 px-2.5 py-0.5 rounded-lg tabular-nums">{emp.standardBaseScore}</span>
                                    </div>
                                </div>

                                {canManage && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditClick(emp)}
                                            className="flex-1 py-2 flex items-center justify-center gap-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                                        >
                                            <Edit3 size={16} /> 详情/编辑
                                        </button>
                                        {emp.status === 'terminated' ? (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={async () => {
                                                        if (confirm(`确定要恢复 ${emp.name} 为在职状态吗？`)) {
                                                            await updateEmployee({ ...emp, status: 'active' });
                                                        }
                                                    }}
                                                    className="px-3 py-2 rounded-lg border border-green-100 hover:bg-green-50 text-green-600 transition-colors"
                                                    title="恢复在职"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm(`⚠️ 警告：确定要永久删除 ${emp.name} 吗？\n\n此操作将删除员工的所有历史数据，不可恢复！`)) {
                                                            await deleteEmployee(emp.id);
                                                        }
                                                    }}
                                                    className="px-3 py-2 rounded-lg border border-red-100 hover:bg-red-50 text-red-600 transition-colors"
                                                    title="永久删除"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleDelete(emp)}
                                                className="px-3 py-2 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 transition-colors"
                                                title="标记离职"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {filteredEmployees.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                                <User size={48} className="mb-4 opacity-50" />
                                <p>该文件夹下没有员工</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Employee Modal */}
            {isModalOpen && canManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editingEmp ? '编辑员工档案' : '录入新员工'}
                            </h2>
                            <button type="button" title="关闭" aria-label="关闭" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            {/* Basic info form (similar to before but with fixed workshop select) */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <User size={16} /> 基本信息
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="employee-name" className="block text-sm font-medium text-slate-700 mb-1">姓名 <span className="text-red-500">*</span></label>
                                        <input
                                            id="employee-name"
                                            required type="text"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="employee-workshop" className="block text-sm font-medium text-slate-700 mb-1">所属工段</label>
                                        <select
                                            id="employee-workshop"
                                            disabled
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-100"
                                            value={formData.workshopId}
                                        >
                                            {workshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="employee-department" className="block text-sm font-medium text-slate-700 mb-1">部门/文件夹 (分组)</label>
                                        {/* 如果工段有文件夹，则强制选择；否则允许输入 */}
                                        {(() => {
                                            const currentWs = workshops.find(w => w.id === formData.workshopId);
                                            const departments = currentWs?.departments || [];

                                            // 只有当有定义的文件夹时，才使用下拉框
                                            if (departments.length > 0) {
                                                return (
                                                    <select
                                                        id="employee-department"
                                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={formData.department}
                                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                                    >
                                                        <option value="">-- 未分组 --</option>
                                                        {departments.map(d => (
                                                            <option key={d} value={d}>{d}</option>
                                                        ))}
                                                        {/* 如果当前部门不在列表中（历史数据），也显示出来 */}
                                                        {formData.department && !departments.includes(formData.department) && (
                                                            <option value={formData.department}>{formData.department} (历史数据)</option>
                                                        )}
                                                    </select>
                                                );
                                            } else {
                                                return (
                                                    <div className="relative">
                                                        <input
                                                            id="employee-department"
                                                            type="text"
                                                            placeholder="该工段暂无文件夹，可直接输入或在左侧新建"
                                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={formData.department}
                                                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                                                        />
                                                        <p className="text-xs text-slate-400 mt-1">提示：在左侧栏点击 "+" 号可新建分组文件夹</p>
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                    <div>
                                        <label htmlFor="employee-position" className="block text-sm font-medium text-slate-700 mb-1">职位</label>
                                        {workshops.find(w => w.id === formData.workshopId)?.code === 'weaving' ? (
                                            <select
                                                id="employee-position"
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.position}
                                                onChange={e => {
                                                    const pos = e.target.value;
                                                    // 自动设置基本工资和系数
                                                    const baseSalary = pos === '机台管理员班长' ? 3500 : pos === '机台管理员' ? 2500 : 0;
                                                    const coefficient = pos === '机台管理员班长' ? 1.3 : 1.0;
                                                    setFormData({ ...formData, position: pos, baseSalary, coefficient });
                                                }}
                                            >
                                                <option value="">请选择职位</option>
                                                <option value="机台管理员班长">机台管理员班长</option>
                                                <option value="机台管理员">机台管理员</option>
                                            </select>
                                        ) : (
                                            <input
                                                id="employee-position"
                                                type="text"
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })}
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="employee-gender" className="block text-sm font-medium text-slate-700 mb-1">性别</label>
                                        <select
                                            id="employee-gender"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                                        >
                                            <option value="male">男</option>
                                            <option value="female">女</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="employee-joindate" className="block text-sm font-medium text-slate-700 mb-1">入职日期</label>
                                        <input
                                            id="employee-joindate"
                                            type="date"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formatDate(formData.joinDate)}
                                            onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="employee-status" className="block text-sm font-medium text-slate-700 mb-1">在职状态</label>
                                        <select
                                            id="employee-status"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                        >
                                            <option value="active">正式在职</option>
                                            <option value="probation">试用期</option>
                                            <option value="leave">休假中</option>
                                            <option value="terminated">已离职</option>
                                        </select>
                                    </div>

                                    {/* 织造工段专用：机台号 */}
                                    {workshops.find(w => w.id === formData.workshopId)?.code === 'weaving' && (
                                        <div>
                                            <label htmlFor="employee-machine" className="block text-sm font-medium text-slate-700 mb-1">机台号 (织造专用)</label>
                                            <select
                                                id="employee-machine"
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.machineId || ''}
                                                onChange={e => setFormData({ ...formData, machineId: e.target.value })}
                                            >
                                                <option value="">未分配</option>
                                                <option value="admin">管理员班长</option>
                                                {Array.from({ length: 11 }, (_, i) => `H${i + 1}`).map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Score and Hours - 仅定型工段显示 */}
                            {workshops.find(w => w.id === formData.workshopId)?.code !== 'weaving' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <CreditCard size={16} /> 积分与工时标准
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <label htmlFor="employee-base-score" className="block text-sm font-medium text-slate-700 mb-2">技能基础分 (Standard)</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    id="employee-base-score"
                                                    type="number"
                                                    className="w-full text-lg font-bold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-blue-600"
                                                    value={formData.standardBaseScore} onChange={e => setFormData({ ...formData, standardBaseScore: parseInt(e.target.value) || 0 })}
                                                />
                                                <span className="text-slate-400 text-sm whitespace-nowrap">分</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <label htmlFor="employee-daily-hours" className="block text-sm font-medium text-slate-700 mb-2">每日标准工时</label>
                                            <div className="flex items-center gap-2">
                                                <Clock size={20} className="text-slate-400" />
                                                <input
                                                    id="employee-daily-hours"
                                                    type="number" min="0" max="24" step="0.5"
                                                    className="w-full text-lg font-bold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                                                    value={formData.expectedDailyHours} onChange={e => setFormData({ ...formData, expectedDailyHours: parseFloat(e.target.value) || 0 })}
                                                />
                                                <span className="text-slate-400 text-sm whitespace-nowrap">小时</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 织造工段专用：基本工资和分配系数 */}
                            {workshops.find(w => w.id === formData.workshopId)?.code === 'weaving' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <CreditCard size={16} /> 薪资与奖金分配
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <label htmlFor="employee-base-salary" className="block text-sm font-medium text-slate-700 mb-2">基本工资</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    id="employee-base-salary"
                                                    type="number"
                                                    className="w-full text-lg font-bold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-blue-600"
                                                    value={formData.baseSalary || 0}
                                                    onChange={e => setFormData({ ...formData, baseSalary: parseInt(e.target.value) || 0 })}
                                                />
                                                <span className="text-slate-400 text-sm whitespace-nowrap">元</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">班长3500，班员2500</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <label htmlFor="employee-coefficient" className="block text-sm font-medium text-slate-700 mb-2">分配系数</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    id="employee-coefficient"
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    className="w-full text-lg font-bold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-blue-600"
                                                    value={formData.coefficient || 1.0}
                                                    onChange={e => setFormData({ ...formData, coefficient: parseFloat(e.target.value) || 1.0 })}
                                                />
                                                <span className="text-slate-400 text-sm whitespace-nowrap">倍</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">班长1.3，班员1.0</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">取消</button>
                                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg">保存</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* New Folder Modal */}
            {isFolderModalOpen && canManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold mb-4">新建部门文件夹</h3>
                        <form onSubmit={handleCreateFolder}>
                            <label className="block text-sm font-medium text-slate-700 mb-1">所属工段</label>
                            <div className="mb-4 text-sm font-bold text-slate-800 bg-slate-100 px-3 py-2 rounded">
                                {workshops.find(w => w.id === selectedWorkshopId)?.name}
                            </div>
                            <label htmlFor="new-folder-name" className="block text-sm font-medium text-slate-700 mb-1">文件夹名称</label>
                            <input
                                id="new-folder-name"
                                autoFocus
                                type="text" required
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newFolderName}
                                onChange={e => setNewFolderName(e.target.value)}
                                placeholder="例如：维修班"
                            />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsFolderModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded text-slate-700">取消</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">创建</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* New Workshop Modal */}
            {isWorkshopModalOpen && canManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold mb-4">新建一级工段</h3>
                        <form onSubmit={handleCreateWorkshop}>
                            <label htmlFor="new-workshop-name" className="block text-sm font-medium text-slate-700 mb-1">工段名称 (Name)</label>
                            <input
                                id="new-workshop-name"
                                autoFocus
                                type="text" required
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newWorkshopName}
                                onChange={e => setNewWorkshopName(e.target.value)}
                                placeholder="例如：染色工段"
                            />
                            <label htmlFor="new-workshop-code" className="block text-sm font-medium text-slate-700 mb-1">唯一标识码 (Code)</label>
                            <input
                                id="new-workshop-code"
                                type="text" required
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                value={newWorkshopCode}
                                onChange={e => setNewWorkshopCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                                placeholder="例如：dyeing"
                            />
                            <div className="bg-amber-50 p-3 rounded text-xs text-amber-700 mb-4">
                                提示：Code 必须是唯一的英文字母，用于权限分配。
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsWorkshopModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded text-slate-700">取消</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">创建</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};