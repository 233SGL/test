/**
 * ========================================
 * 织造工段 - 网种管理页面
 * ========================================
 * 
 * 产品/纬密维护
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search,
  Check,
  X,
  Loader2,
  Package,
  Upload,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

// ========================================
// 类型定义
// ========================================

interface Product {
  id: string;
  name: string;
  weftDensity: number;
  description: string;
  isActive: boolean;
}

// ========================================
// API 函数
// ========================================

const API_BASE = '/api/weaving';

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error('获取网种失败');
  return res.json();
}

async function createProduct(product: Omit<Product, 'isActive'>): Promise<void> {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  if (!res.ok) throw new Error('创建失败');
}

async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('更新失败');
}

async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('删除失败');
}

// ========================================
// 主组件
// ========================================

export const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  
  // 编辑/新增状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', weftDensity: 13, description: '' });

  // 导入相关状态
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<Array<{ id: string; name: string; weftDensity: number; description: string }>>([]);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载数据
  useEffect(() => {
    fetchProducts()
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        // 使用默认数据
        setProducts([
          { id: '22504', name: '22504标准网', weftDensity: 13, description: '基准产品，纬密13', isActive: true },
          { id: '3616ssb-1', name: '3616ssb-1', weftDensity: 44.5, description: '高纬密产品', isActive: true },
          { id: '7500', name: '7500网', weftDensity: 44.5, description: '高纬密产品', isActive: true }
        ]);
        setLoading(false);
      });
  }, []);

  // 筛选
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchText.toLowerCase()) ||
    p.id.toLowerCase().includes(searchText.toLowerCase())
  );

  // 开始编辑
  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      id: product.id,
      name: product.name,
      weftDensity: product.weftDensity,
      description: product.description
    });
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setForm({ id: '', name: '', weftDensity: 13, description: '' });
  };

  // 保存编辑
  const saveEdit = async () => {
    if (!form.id || !form.name || form.weftDensity <= 0) {
      alert('请填写完整信息');
      return;
    }

    try {
      if (isAdding) {
        await createProduct(form);
        setProducts(prev => [...prev, { ...form, isActive: true }]);
      } else if (editingId) {
        await updateProduct(editingId, form);
        setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...form } : p));
      }
    } catch {
      // 本地更新
      if (isAdding) {
        setProducts(prev => [...prev, { ...form, isActive: true }]);
      } else if (editingId) {
        setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...form } : p));
      }
    }
    cancelEdit();
  };

  // 删除
  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此网种？')) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportError('');
    setImportData([]);
    
    // 检查文件类型
    const validTypes = ['.csv', '.txt', '.tsv'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(ext)) {
      setImportError('请上传 CSV 或 TXT 格式的文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length < 2) {
          setImportError('文件内容不足，至少需要表头和一行数据');
          return;
        }

        // 解析表头
        const delimiter = lines[0].includes('\t') ? '\t' : ',';
        const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
        
        // 查找列索引
        const idIdx = headers.findIndex(h => h.includes('编号') || h === 'id');
        const nameIdx = headers.findIndex(h => h.includes('名称') || h === 'name');
        const densityIdx = headers.findIndex(h => h.includes('纬密') || h.includes('weft') || h.includes('density'));
        const descIdx = headers.findIndex(h => h.includes('描述') || h.includes('desc') || h.includes('remark'));

        if (idIdx === -1 || nameIdx === -1 || densityIdx === -1) {
          setImportError('表头必须包含：编号、名称、纬密');
          return;
        }

        // 解析数据行
        const parsed: Array<{ id: string; name: string; weftDensity: number; description: string }> = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(delimiter).map(c => c.trim());
          const id = cols[idIdx];
          const name = cols[nameIdx];
          const weftDensity = parseFloat(cols[densityIdx]);
          const description = descIdx !== -1 ? cols[descIdx] || '' : '';

          if (id && name && !isNaN(weftDensity) && weftDensity > 0) {
            parsed.push({ id, name, weftDensity, description });
          }
        }

        if (parsed.length === 0) {
          setImportError('未能解析到有效数据');
          return;
        }

        setImportData(parsed);
        setShowImportModal(true);
      } catch (err) {
        setImportError('文件解析失败，请检查格式');
      }
    };
    reader.readAsText(file);
    
    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 确认导入
  const confirmImport = async () => {
    for (const item of importData) {
      // 检查是否已存在
      const exists = products.find(p => p.id === item.id);
      if (exists) {
        // 更新已有
        try {
          await updateProduct(item.id, item);
        } catch {}
        setProducts(prev => prev.map(p => p.id === item.id ? { ...p, ...item } : p));
      } else {
        // 新增
        try {
          await createProduct(item);
        } catch {}
        setProducts(prev => [...prev, { ...item, isActive: true }]);
      }
    }
    setShowImportModal(false);
    setImportData([]);
  };

  // 计算产量系数
  const getOutputCoef = (weftDensity: number) => (weftDensity / 13).toFixed(3);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">网种管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理产品及其纬密参数</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 导入按钮 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.tsv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            导入表格
          </button>
          <button
            onClick={() => { setIsAdding(true); setForm({ id: '', name: '', weftDensity: 13, description: '' }); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加网种
          </button>
        </div>
      </div>

      {/* 导入错误提示 */}
      {importError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{importError}</span>
          <button
            onClick={() => setImportError('')}
            className="ml-auto p-1 hover:bg-red-100 rounded"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {/* 搜索栏 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="搜索网种编号或名称..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 新增表单 */}
      {isAdding && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-800 mb-4">添加新网种</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">编号 *</label>
              <input
                type="text"
                value={form.id}
                onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                placeholder="如 22504"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">名称 *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="如 22504标准网"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">纬密 *</label>
              <input
                type="number"
                step="0.1"
                value={form.weftDensity}
                onChange={e => setForm(f => ({ ...f, weftDensity: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">描述</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={cancelEdit}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={saveEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              保存
            </button>
          </div>
        </div>
      )}

      {/* 网种列表 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">暂无网种数据</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">编号</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">名称</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">纬密</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">产量系数</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">描述</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  {editingId === product.id ? (
                    // 编辑模式
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={form.id}
                          onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                          className="w-full px-2 py-1 border rounded"
                          disabled
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.1"
                          value={form.weftDensity}
                          onChange={e => setForm(f => ({ ...f, weftDensity: parseFloat(e.target.value) || 0 }))}
                          className="w-20 px-2 py-1 border rounded text-center"
                        />
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-blue-600">
                        ×{getOutputCoef(form.weftDensity)}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={form.description}
                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={saveEdit}
                            className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // 显示模式
                    <>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                          {product.id}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{product.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-slate-700">{product.weftDensity}</span>
                        <span className="text-xs text-slate-400 ml-1">根/cm</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono font-semibold text-blue-600">
                          ×{getOutputCoef(product.weftDensity)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{product.description || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEdit(product)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 说明 */}
      <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
        <p className="font-medium mb-2">💡 使用说明</p>
        <p className="mb-1"><strong>产量系数</strong> = 纬密 ÷ 13（基准纬密），用于计算等效产量。</p>
        <p className="mb-2">例如：纬密44.5的网种，产量系数 = 44.5 ÷ 13 = 3.423</p>
        <p className="font-medium mb-1">📥 表格导入格式要求：</p>
        <p>支持 CSV、TXT（制表符分隔）文件，表头需包含：编号、名称、纬密（描述可选）</p>
      </div>

      {/* 导入预览弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-3xl m-4 overflow-hidden max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                导入预览
              </h3>
              <button 
                onClick={() => { setShowImportModal(false); setImportData([]); }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 overflow-auto flex-1">
              <p className="text-sm text-slate-600 mb-4">
                共解析到 <span className="font-semibold text-blue-600">{importData.length}</span> 条数据，请确认后导入：
              </p>
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-slate-600">编号</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-600">名称</th>
                    <th className="px-4 py-2 text-center font-semibold text-slate-600">纬密</th>
                    <th className="px-4 py-2 text-center font-semibold text-slate-600">产量系数</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-600">描述</th>
                    <th className="px-4 py-2 text-center font-semibold text-slate-600">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importData.map(item => {
                    const exists = products.find(p => p.id === item.id);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono">{item.id}</td>
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2 text-center">{item.weftDensity}</td>
                        <td className="px-4 py-2 text-center font-mono text-blue-600">×{getOutputCoef(item.weftDensity)}</td>
                        <td className="px-4 py-2 text-slate-500">{item.description || '-'}</td>
                        <td className="px-4 py-2 text-center">
                          {exists ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">更新</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">新增</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowImportModal(false); setImportData([]); }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmImport}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                确认导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
