import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, X } from 'lucide-react';
import { EquivalentOutputRow } from '../../weavingTypes';

interface EquivalentOutputCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (total: number) => void;
}

export const EquivalentOutputCalculator: React.FC<EquivalentOutputCalculatorProps> = ({
    isOpen,
    onClose,
    onConfirm,
}) => {
    const [rows, setRows] = useState<EquivalentOutputRow[]>([
        { id: '1', actualOutput: 0, weftDensity: 0, machineWidth: 0, speedType: 'H2' }
    ]);

    const calculateRow = (row: EquivalentOutputRow): EquivalentOutputRow => {
        const outputCoef = row.weftDensity / 13;
        const widthCoef = row.machineWidth > 0 ? 8.5 / row.machineWidth : 0;
        const speedCoef = row.speedType === 'H2' ? 1 : 0.56;

        const rowEquivalentOutput = row.actualOutput * outputCoef * widthCoef * speedCoef;

        return {
            ...row,
            outputCoef,
            widthCoef,
            speedCoef,
            rowEquivalentOutput
        };
    };

    const addRow = () => {
        const newId = (rows.length + 1).toString();
        setRows([...rows, { id: newId, actualOutput: 0, weftDensity: 0, machineWidth: 0, speedType: 'H2' }]);
    };

    const removeRow = (id: string) => {
        setRows(rows.filter(r => r.id !== id));
    };

    const updateRow = (id: string, field: keyof EquivalentOutputRow, value: any) => {
        setRows(rows.map(r => {
            if (r.id === id) {
                return { ...r, [field]: value };
            }
            return r;
        }));
    };

    const totalEquivalentOutput = rows.reduce((sum, row) => {
        const calculated = calculateRow(row);
        return sum + (calculated.rowEquivalentOutput || 0);
    }, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <Calculator className="text-blue-600" size={24} />
                        <h2 className="text-xl font-bold text-slate-900">等效产量计算器</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-500 mb-2 px-2">
                            <div className="col-span-2">实际产量 (㎡)</div>
                            <div className="col-span-2">纬密</div>
                            <div className="col-span-2">机台宽度 (m)</div>
                            <div className="col-span-2">速度类型</div>
                            <div className="col-span-3">行等效产量</div>
                            <div className="col-span-1">操作</div>
                        </div>

                        {rows.map((row) => {
                            const calculated = calculateRow(row);
                            return (
                                <div key={row.id} className="grid grid-cols-12 gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            value={row.actualOutput || ''}
                                            onChange={(e) => updateRow(row.id, 'actualOutput', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            value={row.weftDensity || ''}
                                            onChange={(e) => updateRow(row.id, 'weftDensity', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            value={row.machineWidth || ''}
                                            onChange={(e) => updateRow(row.id, 'machineWidth', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <select
                                            value={row.speedType}
                                            onChange={(e) => updateRow(row.id, 'speedType', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="H2">H2 (1.0)</option>
                                            <option value="H5">H5 (0.56)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-3 font-mono text-slate-700 font-semibold">
                                        {calculated.rowEquivalentOutput?.toFixed(2)}
                                    </div>
                                    <div className="col-span-1">
                                        <button
                                            onClick={() => removeRow(row.id)}
                                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
                                            disabled={rows.length === 1}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        <button
                            onClick={addRow}
                            className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 px-2 py-1"
                        >
                            <Plus size={18} /> 添加机台行
                        </button>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm text-slate-500">总等效产量</span>
                        <span className="text-2xl font-bold text-blue-600">{totalEquivalentOutput.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={() => onConfirm(totalEquivalentOutput)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            确认并填入
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
