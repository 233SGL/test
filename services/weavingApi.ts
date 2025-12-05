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
// 机台月度产量记录 API
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
