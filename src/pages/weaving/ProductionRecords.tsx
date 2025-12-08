/**
 * ========================================
 * 织造工段 - 生产记录页面
 * ========================================
 * 
 * 查看历史生产记录，支持筛选、编辑、删除
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Trash2,
  Edit3,
  Loader2,
  FileText,
  Download,
  RefreshCw,
  X,
  Save
} from 'lucide-react';

// ========================================
// 类型定义
// ========================================

interface ProductionRecord {
  id: number;
  year: number;
  month: number;
  productionDate: string;
  machineId: string;
  machineName?: string;
  productId: string;
  productName?: string;
  length: number;
  machineWidth: number;
  weftDensity: number;
  actualArea: number;
  equivalentOutput: number;
  qualityGrade: string;
  isQualified: boolean;
  notes: string;
  createdAt: string;
}

interface Machine {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
}

// ========================================
// API 函数
// ========================================

const API_BASE = '/api/weaving';

async function fetchRecords(year: number, month: number): Promise<ProductionRecord[]> {
  const res = await fetch(`${API_BASE}/production-records?year=${year}&month=${month}`);
  if (!res.ok) throw new Error('获取记录失败');
  return res.json();
}

async function deleteRecord(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/production-records/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('删除失败');
}

async function updateRecord(id: number, data: Partial<ProductionRecord>): Promise<ProductionRecord> {
  const res = await fetch(`${API_BASE}/production-records/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('更新失败');
  return res.json();
}

async function fetchMachines(): Promise<Machine[]> {
  const res = await fetch(`${API_BASE}/machines`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) return [];
  return res.json();
}

// ========================================
// 主组件
// ========================================

export const ProductionRecords: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选条件
  const [filterMachine, setFilterMachine] = useState<string>('');
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [searchText, setSearchText] = useState('');

  // 编辑状态
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);
  const [editForm, setEditForm] = useState({
    length: 0,
    qualityGrade: 'A',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  // 机台按数字排序（H1, H2, ... H11）
  const sortMachines = (machines: Machine[]) => {
    return [...machines].sort((a, b) => {
      const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  };

  // 加载数据
  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchRecords(year, month),
      fetchMachines(),
      fetchProducts()
    ])
      .then(([recordsData, machinesData, productsData]) => {
        setRecords(recordsData);
        setMachines(sortMachines(machinesData));
        setProducts(productsData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [year, month]);

  // 刷新数据
  const handleRefresh = () => {
    loadData();
  };

  // 删除记录
  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此记录？')) return;
    try {
      await deleteRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 打开编辑模态框
  const handleEdit = (record: ProductionRecord) => {
    setEditingRecord(record);
    setEditForm({
      length: record.length,
      qualityGrade: record.qualityGrade,
      notes: record.notes || ''
    });
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    setSaving(true);
    try {
      const updated = await updateRecord(editingRecord.id, {
        length: editForm.length,
        qualityGrade: editForm.qualityGrade,
        isQualified: editForm.qualityGrade === 'A' || editForm.qualityGrade === 'B',
        notes: editForm.notes
      });

      // 更新本地记录
      setRecords(prev => prev.map(r =>
        r.id === editingRecord.id ? { ...r, ...updated } : r
      ));
      setEditingRecord(null);
      // 刷新数据以获取重新计算的值
      loadData();
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 筛选记录
  const filteredRecords = records.filter(r => {
    if (filterMachine && r.machineId !== filterMachine) return false;
    if (filterProduct && r.productId !== filterProduct) return false;
    if (searchText && !r.notes?.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  // 统计
  const stats = {
    totalNets: filteredRecords.length,
    totalLength: filteredRecords.reduce((s, r) => s + r.length, 0),
    totalArea: filteredRecords.reduce((s, r) => s + r.actualArea, 0),
    totalEquivalent: filteredRecords.reduce((s, r) => s + r.equivalentOutput, 0),
    qualifiedNets: filteredRecords.filter(r => r.isQualified).length
  };

  // 获取机台/产品名称
  const getMachineName = (id: string) => machines.find(m => m.id === id)?.name || id;
  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 页面标题和月份选择 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">生产记录</h1>
          <p className="text-sm text-slate-500 mt-1">查看和管理历史生产数据</p>
        </div>

        {/* 月份选择器 - 下拉框样式 */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <label htmlFor="records-year" className="text-sm font-semibold text-slate-600">年份</label>
            <select
              id="records-year"
              name="records-year"
              className="border border-slate-200 rounded-lg py-1.5 px-3 text-sm min-w-[90px] focus:ring-2 focus:ring-blue-500 outline-none"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              aria-label="选择年份"
            >
              {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <label htmlFor="records-month" className="text-sm font-semibold text-slate-600">月份</label>
            <select
              id="records-month"
              name="records-month"
              className="border border-slate-200 rounded-lg py-1.5 px-3 text-sm min-w-[80px] focus:ring-2 focus:ring-blue-500 outline-none"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              aria-label="选择月份"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          {/* 刷新按钮 */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="刷新数据"
            aria-label="刷新数据"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">总网数</div>
          <div className="text-2xl font-bold text-slate-800">{stats.totalNets}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">总长度</div>
          <div className="text-2xl font-bold text-slate-800">{stats.totalLength.toFixed(0)}m</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">总面积</div>
          <div className="text-2xl font-bold text-slate-800">{stats.totalArea.toFixed(0)}㎡</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">等效产量</div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalEquivalent.toFixed(0)}㎡</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">成网率</div>
          <div className="text-2xl font-bold text-emerald-600">
            {stats.totalNets > 0 ? ((stats.qualifiedNets / stats.totalNets) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 搜索 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
            <label htmlFor="search-notes" className="sr-only">搜索备注</label>
            <input
              id="search-notes"
              name="search-notes"
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="搜索备注..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="搜索备注"
            />
          </div>

          {/* 机台筛选 */}
          <label htmlFor="filter-machine" className="sr-only">筛选机台</label>
          <select
            id="filter-machine"
            name="filter-machine"
            value={filterMachine}
            onChange={e => setFilterMachine(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="筛选机台"
          >
            <option value="">全部机台</option>
            {machines.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <label htmlFor="filter-product" className="sr-only">筛选网种</label>
          <select
            id="filter-product"
            name="filter-product"
            value={filterProduct}
            onChange={e => setFilterProduct(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="筛选网种"
          >
            <option value="">全部网种</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* 导出按钮 */}
          <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">暂无生产记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">日期</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">机台</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">网种</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">长度(m)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">面积(㎡)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">等效产量</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">等级</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">备注</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {new Date(record.productionDate).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">
                      {getMachineName(record.machineId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {getProductName(record.productId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-slate-700">
                      {record.length.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-slate-700">
                      {record.actualArea.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-blue-600">
                      {record.equivalentOutput.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${record.qualityGrade === 'A'
                          ? 'bg-emerald-100 text-emerald-700'
                          : record.qualityGrade === 'B'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                        {record.qualityGrade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-[150px] truncate">
                      {record.notes || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                          title="编辑"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 编辑模态框 */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">编辑生产记录</h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 记录信息展示 */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg text-sm">
                <div>
                  <span className="text-slate-500">日期：</span>
                  <span className="text-slate-700">{new Date(editingRecord.productionDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-500">机台：</span>
                  <span className="text-slate-700">{getMachineName(editingRecord.machineId)}</span>
                </div>
                <div>
                  <span className="text-slate-500">网种：</span>
                  <span className="text-slate-700">{getProductName(editingRecord.productId)}</span>
                </div>
                <div>
                  <span className="text-slate-500">面积：</span>
                  <span className="text-slate-700">{editingRecord.actualArea.toFixed(1)} ㎡</span>
                </div>
              </div>

              {/* 可编辑字段 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">长度 (米)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.length}
                  onChange={e => setEditForm(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">质量等级</label>
                <select
                  value={editForm.qualityGrade}
                  onChange={e => setEditForm(prev => ({ ...prev, qualityGrade: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="A">A - 优等品</option>
                  <option value="B">B - 一等品</option>
                  <option value="C">C - 合格品</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
                <textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="可选备注信息..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionRecords;
