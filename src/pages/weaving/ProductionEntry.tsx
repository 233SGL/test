/**
 * ========================================
 * 织造工段 - 生产录入页面
 * ========================================
 * 
 * 简洁录入：每完成一张网，录入一条记录
 * 
 * 只需输入：
 * 1. 选择机台（自动带出宽度）
 * 2. 选择产品/网种（自动带出纬密）
 * 3. 织造长度（米）
 * 4. 开始时间、结束时间
 * 
 * 系统自动计算：面积、等效产量
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  Clock,
  Ruler,
  Calculator
} from 'lucide-react';

// ========================================
// 类型定义
// ========================================

interface Machine {
  id: string;
  name: string;
  speedType: 'H2' | 'H5';
  width: number;
  status: string;
}

interface Product {
  id: string;
  name: string;
  weftDensity: number;
  isActive?: boolean;
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

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error('获取网种失败');
  return res.json();
}

async function submitProduction(record: {
  productionDate: string;
  machineId: string;
  productId: string;
  length: number;
  startTime?: string;
  endTime?: string;
  qualityGrade: string;
  isQualified: boolean;
  notes: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/production-records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  if (!res.ok) throw new Error('提交失败');
}

// ========================================
// 主组件
// ========================================

export const ProductionEntry: React.FC = () => {
  // 数据状态
  const [machines, setMachines] = useState<Machine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 表单状态 - 只有必要字段
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [length, setLength] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [qualityGrade, setQualityGrade] = useState<'A' | 'B' | 'C'>('A');
  const [notes, setNotes] = useState('');

  // 获取当前日期
  const today = new Date().toISOString().split('T')[0];

  // 获取选中的机台和产品数据
  const selectedMachineData = machines.find(m => m.id === selectedMachine);
  const selectedProductData = products.find(p => p.id === selectedProduct);
  const lengthNum = parseFloat(length) || 0;

  // 计算等效产量预览
  const preview = React.useMemo(() => {
    if (!selectedMachineData || !selectedProductData || lengthNum <= 0) {
      return null;
    }
    const machineWidth = selectedMachineData.width;
    const weftDensity = selectedProductData.weftDensity;
    const speedCoef = selectedMachineData.speedType === 'H5' ? 0.56 : 1.0;

    const actualArea = lengthNum * machineWidth;
    const outputCoef = weftDensity / 13;
    const widthCoef = 8.5 / machineWidth;
    const equivalentOutput = actualArea * outputCoef * widthCoef * speedCoef;

    return {
      machineWidth,
      weftDensity,
      actualArea: actualArea.toFixed(2),
      outputCoef: outputCoef.toFixed(3),
      widthCoef: widthCoef.toFixed(3),
      speedCoef: speedCoef.toFixed(2),
      equivalentOutput: equivalentOutput.toFixed(2)
    };
  }, [selectedMachineData, selectedProductData, lengthNum]);

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
    Promise.all([fetchMachines(), fetchProducts()])
      .then(([machinesData, productsData]) => {
        setMachines(sortMachines(machinesData));
        setProducts(productsData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // 设置当前时间
  const setCurrentTime = (type: 'start' | 'end') => {
    const now = new Date();
    const timeStr = `${today}T${now.toTimeString().slice(0, 5)}`;
    if (type === 'start') {
      setStartTime(timeStr);
    } else {
      setEndTime(timeStr);
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine || !selectedProduct || lengthNum <= 0) {
      setError('请选择机台、产品并填写长度');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitProduction({
        productionDate: today,
        machineId: selectedMachine,
        productId: selectedProduct,
        length: lengthNum,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        qualityGrade,
        isQualified: qualityGrade !== 'C',
        notes
      });

      setSuccess(true);
      // 重置表单（保留机台便于连续录入）
      setSelectedProduct('');
      setLength('');
      setStartTime('');
      setEndTime('');
      setNotes('');

      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-500">加载中...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">生产录入</h1>
          <p className="text-sm text-slate-500 mt-1">每完成一张网，录入一条记录</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500">今日日期</div>
          <div className="text-lg font-semibold text-slate-700">
            {new Date().toLocaleDateString('zh-CN')}
          </div>
        </div>
      </div>

      {/* 成功提示 */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
          </div>
          <span className="text-emerald-700 font-medium">录入成功！</span>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* 录入表单 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">

          {/* 第一步：选择机台 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              1. 选择织机 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {machines.filter(m => m.status === 'running').map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMachine(m.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${selectedMachine === m.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  aria-label={`选择${m.name}`}
                  aria-pressed={selectedMachine === m.id}
                >
                  <div className="font-bold">{m.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    宽 {m.width}m
                  </div>
                </button>
              ))}
            </div>
            {selectedMachineData && (
              <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                已选: {selectedMachineData.name}，织造宽度 <strong>{selectedMachineData.width}m</strong>
              </div>
            )}
          </div>

          {/* 第二步：选择产品/网种 */}
          <div>
            <label htmlFor="product-select" className="block text-sm font-semibold text-slate-700 mb-2">
              2. 选择网种 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="product-select"
                name="product-select"
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                aria-label="选择网种"
              >
                <option value="">选择产品...</option>
                {products.filter(p => p.isActive !== false).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (纬密: {p.weftDensity})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden="true" />
            </div>
            {selectedProductData && (
              <div className="mt-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                已选: {selectedProductData.name}，纬密 <strong>{selectedProductData.weftDensity}</strong>
              </div>
            )}
          </div>

          {/* 第三步：输入长度 */}
          <div>
            <label htmlFor="weaving-length" className="block text-sm font-semibold text-slate-700 mb-2">
              3. 织造长度 (米) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                <input
                  id="weaving-length"
                  name="weaving-length"
                  type="number"
                  value={length}
                  onChange={e => setLength(e.target.value)}
                  placeholder="输入长度..."
                  step="0.1"
                  min="0"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  aria-label="织造长度"
                />
              </div>
            </div>
          </div>

          {/* 第四步：时间记录（可选） */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              4. 时间记录 <span className="text-slate-400 font-normal">(可选)</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-time" className="text-xs text-slate-500 mb-1 block">开始时间</label>
                <div className="flex gap-2">
                  <input
                    id="start-time"
                    name="start-time"
                    type="datetime-local"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="开始时间"
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentTime('start')}
                    className="px-2 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    title="设置为当前时间"
                    aria-label="设置开始时间为当前时间"
                  >
                    <Clock className="w-4 h-4 text-slate-500" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="end-time" className="text-xs text-slate-500 mb-1 block">结束时间</label>
                <div className="flex gap-2">
                  <input
                    id="end-time"
                    name="end-time"
                    type="datetime-local"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="结束时间"
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentTime('end')}
                    className="px-2 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    title="设置为当前时间"
                    aria-label="设置结束时间为当前时间"
                  >
                    <Clock className="w-4 h-4 text-slate-500" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 质量等级 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              5. 质量等级
            </label>
            <div className="flex gap-3" role="group" aria-label="质量等级选择">
              {(['A', 'B', 'C'] as const).map(grade => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => setQualityGrade(grade)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${qualityGrade === grade
                      ? grade === 'A'
                        ? 'bg-emerald-500 text-white'
                        : grade === 'B'
                          ? 'bg-amber-500 text-white'
                          : 'bg-red-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  aria-label={`质量等级${grade}级`}
                  aria-pressed={qualityGrade === grade}
                >
                  {grade}级
                </button>
              ))}
            </div>
            {qualityGrade === 'C' && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                ⚠️ C级不计入成网率
              </div>
            )}
          </div>

          {/* 备注 */}
          <div>
            <label htmlFor="production-notes" className="block text-sm font-semibold text-slate-700 mb-2">
              备注 <span className="text-slate-400 font-normal">(可选)</span>
            </label>
            <textarea
              id="production-notes"
              name="production-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="填写备注信息..."
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
            />
          </div>
        </div>

        {/* 计算预览 */}
        {preview && (
          <div className="mx-6 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-slate-700">自动计算预览</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">织造宽度:</span>
                  <span className="font-medium">{preview.machineWidth} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">纬密:</span>
                  <span className="font-medium">{preview.weftDensity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">织造面积:</span>
                  <span className="font-medium">{preview.actualArea} ㎡</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">产量系数:</span>
                  <span className="font-medium">{preview.outputCoef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">宽度系数:</span>
                  <span className="font-medium">{preview.widthCoef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">速度系数:</span>
                  <span className="font-medium">{preview.speedCoef}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
              <span className="text-slate-700 font-medium">等效产量:</span>
              <span className="text-2xl font-bold text-blue-600">{preview.equivalentOutput} ㎡</span>
            </div>
          </div>
        )}

        {/* 提交按钮 */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="submit"
            disabled={submitting || !selectedMachine || !selectedProduct || lengthNum <= 0}
            className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${submitting || !selectedMachine || !selectedProduct || lengthNum <= 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30'
              }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                提交记录
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
