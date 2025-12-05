/**
 * ========================================
 * 织造工段 API 服务
 * ========================================
 * 
 * 提供织造工段相关的前端 API 调用方法
 */

import { WeavingEmployee, WeavingMachine, WeavingConfig, WeavingMonthlyData } from '../weavingTypes';

// API 基础路径
const API_BASE = 'http://localhost:3000/api/weaving';

// ========================================
// 员工管理 API
// ========================================

/**
 * 获取所有织造工段员工
 */
export async function fetchWeavingEmployees(): Promise<WeavingEmployee[]> {
  const response = await fetch(`${API_BASE}/employees`);
  if (!response.ok) {
    throw new Error('获取员工列表失败');
  }
  return response.json();
}

/**
 * 创建织造工段员工
 */
export async function createWeavingEmployee(employee: Omit<WeavingEmployee, 'createdAt' | 'updatedAt'>): Promise<WeavingEmployee> {
  const response = await fetch(`${API_BASE}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee)
  });
  if (!response.ok) {
    throw new Error('创建员工失败');
  }
  return response.json();
}

/**
 * 更新织造工段员工
 */
export async function updateWeavingEmployee(id: string, employee: Partial<WeavingEmployee>): Promise<WeavingEmployee> {
  const response = await fetch(`${API_BASE}/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee)
  });
  if (!response.ok) {
    throw new Error('更新员工失败');
  }
  return response.json();
}

/**
 * 删除织造工段员工
 */
export async function deleteWeavingEmployee(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/employees/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('删除员工失败');
  }
}

// ========================================
// 机台管理 API
// ========================================

/**
 * 获取所有机台
 */
export async function fetchWeavingMachines(): Promise<WeavingMachine[]> {
  const response = await fetch(`${API_BASE}/machines`);
  if (!response.ok) {
    throw new Error('获取机台列表失败');
  }
  return response.json();
}

/**
 * 更新机台信息
 */
export async function updateWeavingMachine(id: string, machine: Partial<WeavingMachine>): Promise<WeavingMachine> {
  const response = await fetch(`${API_BASE}/machines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(machine)
  });
  if (!response.ok) {
    throw new Error('更新机台失败');
  }
  return response.json();
}

// ========================================
// 配置管理 API
// ========================================

/**
 * 获取织造工段配置
 */
export async function fetchWeavingConfig(): Promise<WeavingConfig> {
  const response = await fetch(`${API_BASE}/config`);
  if (!response.ok) {
    throw new Error('获取配置失败');
  }
  return response.json();
}

/**
 * 更新织造工段配置
 */
export async function updateWeavingConfig(config: Partial<WeavingConfig>): Promise<WeavingConfig> {
  const response = await fetch(`${API_BASE}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!response.ok) {
    throw new Error('更新配置失败');
  }
  return response.json();
}

// ========================================
// 月度数据 API
// ========================================

/**
 * 月度数据接口
 */
export interface WeavingMonthlyDataInput {
  year: number;
  month: number;
  netFormationRate: number;
  operationRate: number;
  equivalentOutput: number;
  activeMachines: number;
  actualOperators: number;
  attendanceDays: number;
  calculationSnapshot?: Record<string, unknown>;
  machineRecords?: MachineMonthlyRecord[];
}

/**
 * 机台月度产量记录
 */
export interface MachineMonthlyRecord {
  machineId: string;
  actualOutput: number;
  weftDensity: number;
  machineWidth: number;
  speedType: 'H2' | 'H5';
  equivalentOutput: number;
}

/**
 * 获取指定月份的月度数据
 */
export async function fetchWeavingMonthlyData(year: number, month: number): Promise<WeavingMonthlyDataInput | null> {
  const response = await fetch(`${API_BASE}/monthly-data/${year}/${month}`);
  if (!response.ok) {
    throw new Error('获取月度数据失败');
  }
  return response.json();
}

/**
 * 保存月度数据
 */
export async function saveWeavingMonthlyData(data: WeavingMonthlyDataInput): Promise<void> {
  const response = await fetch(`${API_BASE}/monthly-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error('保存月度数据失败');
  }
}

/**
 * 获取历史月度数据（用于趋势图）
 */
export async function fetchWeavingMonthlyHistory(): Promise<WeavingMonthlyDataInput[]> {
  const response = await fetch(`${API_BASE}/monthly-data`);
  if (!response.ok) {
    throw new Error('获取历史数据失败');
  }
  return response.json();
}

// ========================================
// 机台月度产量记录 API（旧版兼容）
// ========================================

/**
 * 获取指定月份的机台产量记录
 */
export async function fetchMachineRecords(year: number, month: number): Promise<MachineMonthlyRecord[]> {
  const response = await fetch(`${API_BASE}/machine-records/${year}/${month}`);
  if (!response.ok) {
    throw new Error('获取机台产量记录失败');
  }
  return response.json();
}

/**
 * 批量保存机台产量记录
 */
export async function saveMachineRecords(year: number, month: number, records: MachineMonthlyRecord[]): Promise<void> {
  const response = await fetch(`${API_BASE}/machine-records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, month, records })
  });
  if (!response.ok) {
    throw new Error('保存机台产量记录失败');
  }
}

// ========================================
// 产品/网种管理 API
// ========================================

/**
 * 产品/网种接口
 */
export interface WeavingProduct {
  id: string;
  name: string;
  weftDensity: number;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

/**
 * 获取所有产品/网种
 */
export async function fetchWeavingProducts(): Promise<WeavingProduct[]> {
  const response = await fetch(`${API_BASE}/products`);
  if (!response.ok) {
    throw new Error('获取产品列表失败');
  }
  return response.json();
}

/**
 * 创建产品/网种
 */
export async function createWeavingProduct(product: Omit<WeavingProduct, 'createdAt'>): Promise<WeavingProduct> {
  const response = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  if (!response.ok) {
    throw new Error('创建产品失败');
  }
  return response.json();
}

/**
 * 更新产品/网种
 */
export async function updateWeavingProduct(id: string, product: Partial<WeavingProduct>): Promise<WeavingProduct> {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  if (!response.ok) {
    throw new Error('更新产品失败');
  }
  return response.json();
}

/**
 * 删除产品/网种
 */
export async function deleteWeavingProduct(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('删除产品失败');
  }
}

// ========================================
// 生产记录 API（核心：每张网一条记录）
// ========================================

/**
 * 生产记录接口
 */
export interface WeavingProductionRecord {
  id?: number;
  year?: number;
  month?: number;
  productionDate: string;
  machineId: string;
  productId?: string;
  length: number;
  // 自动计算字段
  machineWidth?: number;
  weftDensity?: number;
  speedType?: 'H2' | 'H5';
  actualArea?: number;
  outputCoef?: number;
  widthCoef?: number;
  speedCoef?: number;
  equivalentOutput?: number;
  // 时间记录
  startTime?: string;
  endTime?: string;
  // 质量信息
  qualityGrade?: 'A' | 'B' | 'C';
  isQualified?: boolean;
  notes?: string;
  createdAt?: string;
}

/**
 * 生产记录查询参数
 */
export interface ProductionRecordQuery {
  year: number;
  month: number;
  machineId?: string;
  productId?: string;
}

/**
 * 获取生产记录
 */
export async function fetchProductionRecords(query: ProductionRecordQuery): Promise<WeavingProductionRecord[]> {
  const params = new URLSearchParams({
    year: String(query.year),
    month: String(query.month)
  });
  if (query.machineId) params.append('machineId', query.machineId);
  if (query.productId) params.append('productId', query.productId);
  
  const response = await fetch(`${API_BASE}/production-records?${params}`);
  if (!response.ok) {
    throw new Error('获取生产记录失败');
  }
  return response.json();
}

/**
 * 创建生产记录
 */
export async function createProductionRecord(record: Omit<WeavingProductionRecord, 'id' | 'createdAt'>): Promise<WeavingProductionRecord> {
  const response = await fetch(`${API_BASE}/production-records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  if (!response.ok) {
    throw new Error('创建生产记录失败');
  }
  return response.json();
}

/**
 * 更新生产记录
 */
export async function updateProductionRecord(id: number, record: Partial<WeavingProductionRecord>): Promise<WeavingProductionRecord> {
  const response = await fetch(`${API_BASE}/production-records/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  if (!response.ok) {
    throw new Error('更新生产记录失败');
  }
  return response.json();
}

/**
 * 删除生产记录
 */
export async function deleteProductionRecord(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/production-records/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('删除生产记录失败');
  }
}

// ========================================
// 月度汇总 API（新版：从生产记录聚合）
// ========================================

/**
 * 月度汇总接口
 */
export interface WeavingMonthlySummary {
  year: number;
  month: number;
  totalNets: number;
  totalLength: number;
  totalArea: number;
  equivalentOutput: number;
  qualifiedNets: number;
  netFormationRate: number;
  activeMachines: number;
  actualOperators: number;
}

/**
 * 机台月度汇总
 */
export interface WeavingMachineSummary {
  machineId: string;
  netCount: number;
  totalLength: number;
  totalArea: number;
  totalEquivalent: number;
}

/**
 * 获取月度汇总数据
 */
export async function fetchMonthlySummary(year: number, month: number): Promise<WeavingMonthlySummary> {
  const response = await fetch(`${API_BASE}/monthly-summary/${year}/${month}`);
  if (!response.ok) {
    throw new Error('获取月度汇总失败');
  }
  return response.json();
}

/**
 * 获取各机台月度汇总
 */
export async function fetchMachineSummary(year: number, month: number): Promise<WeavingMachineSummary[]> {
  const response = await fetch(`${API_BASE}/machine-summary/${year}/${month}`);
  if (!response.ok) {
    throw new Error('获取机台汇总失败');
  }
  return response.json();
}
