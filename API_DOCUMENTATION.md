# 和山薪酬管理系统 API 文档

**版本**: 1.1  
**更新日期**: 2025年12月1日  

---

## 目录

1. [概述](#概述)
2. [类型定义](#类型定义)
3. [数据库服务 (db.ts)](#数据库服务-dbts)
4. [计算服务 (calcService.ts)](#计算服务-calcservicets)
5. [认证上下文 (AuthContext.tsx)](#认证上下文-authcontexttsx)
6. [数据上下文 (DataContext.tsx)](#数据上下文-datacontexttsx)
7. [错误处理](#错误处理)

---

## 概述

和山薪酬管理系统是一个基于 React + TypeScript + Node.js 的工资计算与管理系统。前端通过 REST API 访问本地 Node/Express 后端，后端使用 Session Pooler 直连 Supabase Postgres 数据库，实现持久化存储与共享。系统实现了基于角色的权限控制（RBAC），支持多用户、多部门的薪酬核算。

重要变更：
- 从 v1.1 起，应用不再持久化登录状态，刷新或重新打开页面需要重新登录（会话级登录）。
- 从 v1.2 起，所有业务数据均由后端连接 Supabase 数据库提供，前端不再直接写入浏览器 localStorage。

### 核心功能模块

- **用户认证与权限管理**: 基于角色的访问控制
- **员工档案管理**: 员工信息的增删改查
- **考勤管理**: 每日工时记录
- **薪酬计算**: 基于产量、出勤、基础分的综合计算
- **数据导入导出**: 支持数据备份与恢复

### 运行架构

- **前端 (Vite + React)**：默认开发端口 5173，可通过 `VITE_DEV_PORT` 自定义。
- **后端 (Express + PostgreSQL)**：运行在 `http://localhost:3000`，并向前端暴露 `/api/*` REST 接口。
- **数据库**：Supabase Postgres（Session Pooler 连接字符串在 `.env.server` 中配置）。
- **API 基础地址**：前端会自动根据当前页面端口推断 API 基础地址，亦可通过 `VITE_API_BASE` 显式指定（例如 `https://example.com/api`）。

---

## 类型定义

### 用户角色 (UserRole)

```typescript
enum UserRole {
  ADMIN = 'ADMIN',                  // 系统管理员
  VP_PRODUCTION = 'VP_PRODUCTION',  // 生产副总
  SCHEDULING = 'SCHEDULING',        // 调度中心
  SECTION_HEAD = 'SECTION_HEAD',    // 工段负责人
  GENERAL_MANAGER = 'GENERAL_MANAGER', // 总经理
  GUEST = 'GUEST'                   // 访客
}
```

### 权限类型 (Permission)

```typescript
type Permission = 
  | 'EDIT_YIELD'        // 录入产量
  | 'EDIT_UNIT_PRICE'   // 单价维护
  | 'EDIT_HOURS'        // 工时管理
  | 'EDIT_BASE_SCORE'   // 评定基础分
  | 'EDIT_WEIGHTS'      // 权重调节
  | 'EDIT_FIXED_PACK'   // 固定包维护（出勤/KPI）
  | 'APPLY_SIMULATION'  // 运行薪酬模拟
  | 'VIEW_SENSITIVE'    // 查看敏感薪资
  | 'VIEW_DASHBOARD'    // 查看数据大盘
  | 'VIEW_PRODUCTION'   // 查看/录入生产
  | 'VIEW_ATTENDANCE'   // 查看/录入工时
  | 'VIEW_CALCULATOR'   // 查看薪酬计算器
  | 'VIEW_SIMULATION'   // 查看薪酬模拟
  | 'VIEW_EMPLOYEES'    // 查看员工档案
  | 'MANAGE_ANNOUNCEMENTS' // 公告管理
  | 'MANAGE_EMPLOYEES'  // 员工档案管理
  | 'MANAGE_SYSTEM'     // 系统设置管理
```

### 系统用户 (SystemUser)

```typescript
interface SystemUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  permissions: Permission[];
  pinCode: string;           // PIN码登录
  scopes: string[];          // 可访问工段范围，如 ['styling'] | ['all']
  avatar?: string;           // 头像（可选）
  isSystem?: boolean;        // 是否为系统预置用户
}
```

### 员工信息 (Employee)

```typescript
interface Employee {
  id: string;
  name: string;
  gender: 'male' | 'female';
  workshopId: string;        // 归属工段ID
  department: string;        // 归属部门/车间
  position: string;
  joinDate: string;
  phone?: string;
  idCard?: string;
  standardBaseScore: number;     // 标准基础分
  status: EmployeeStatus;        // 在职状态
  notes?: string;
  expectedDailyHours?: number;   // 预期日工时
}
```

### 薪酬记录 (SalaryRecord)

```typescript
interface SalaryRecord {
  employeeId: string;
  employeeName: string;
  workHours: number;              // 实际工时
  dailyLogs?: Record<number, number>; // 每日工时记录
  expectedHours: number;          // 预期工时
  baseScoreSnapshot: number;      // 基础分快照
}
```

### 月度参数 (MonthlyParams)

```typescript
interface MonthlyParams {
  year: number;
  month: number;
  area: number;              // 产量面积 (㎡)
  unitPrice: number;         // 单价 (元/㎡)
  attendancePack: number;    // 出勤考核包 (元)
  kpiScore: number;          // KPI奖励包 (元)
  weightTime: number;        // 工时权重 (%)
  weightBase: number;        // 基础分权重 (%)
}
```

### 月度数据 (MonthlyData)

```typescript
interface MonthlyData {
  id: string;                // 格式: YYYY-MM
  params: MonthlyParams;
  records: SalaryRecord[];
}
```

### 计算结果 (CalculationResult)

```typescript
interface CalculationResult {
  records: Array<SalaryRecord & {
    workRatio: number;         // 工时占比
    baseRatio: number;         // 基础分占比
    compositeWeight: number;   // 综合权重
    realBase: number;          // 实际基础工资
    bonus: number;             // 奖金
    finalScore: number;        // 最终工资
  }>;
  totalPool: number;           // 总薪资池
  totalBasePayout: number;     // 基础工资总和
  bonusPool: number;           // 奖金池
  sumWorkHours: number;
  sumExpectedHours: number;
  sumStandardBase: number;
}
```

---

## 数据库服务 (db.ts)

### 类: DatabaseService

单例模式的数据库服务类。所有方法都会通过 `fetch` 调用本地 Node 后端 (`API_BASE`)，由后端直连 Supabase 数据库并返回 JSON 结果。

`API_BASE` 计算规则：
1. 读取 `import.meta.env.VITE_API_BASE`（若设置则直接使用）。
2. 若未设置，则根据当前页面所在端口推断：
  - 当前端运行在 `5173/4173/3001` 等典型开发端口时，自动使用 `http://localhost:3000/api`。
  - 其它情况默认拼接为同源的 `/api`。

#### 实例获取

```typescript
static getInstance(): DatabaseService
```

**返回**: 唯一的 DatabaseService 实例

#### 连接数据库

```typescript
async connect(): Promise<boolean>
```

**功能**: 检查后端 `/health` 接口是否可用，验证后端及数据库连接状态  
**返回**: `true` 表示连接成功
#### 工段管理（Workshop）

##### 获取工段列表

```typescript
async getWorkshops(): Promise<Workshop[]>
```

**返回**: 工段数组（包含工段名称、代码、部门列表）

##### 保存工段列表

```typescript
async saveWorkshops(workshops: Workshop[]): Promise<void>
```

**参数**:
- `workshops`: 工段数组

#### 设置管理

##### 获取全局设置

```typescript
async getSettings(): Promise<GlobalSettings>
```

**返回**: 全局设置对象（包含公告等信息）

##### 保存全局设置

```typescript
async saveSettings(settings: GlobalSettings): Promise<void>
```

**参数**:
- `settings`: 要保存的设置对象

#### 系统用户管理

##### 获取所有系统用户

```typescript
async getSystemUsers(): Promise<SystemUser[]>
```

**返回**: 系统用户列表

##### 新增系统用户

```typescript
async createSystemUser(user: SystemUser): Promise<SystemUser>
```

**参数**:
- `user`: 前端构建的新用户对象（需要预生成 `id`）

**返回**: 后端保存后的系统用户对象

##### 更新系统用户

```typescript
async updateSystemUserRemote(user: SystemUser): Promise<SystemUser>
```

**说明**: 将改动同步到数据库并返回最新记录

##### 删除系统用户

```typescript
async deleteSystemUserRemote(id: string): Promise<void>
```

**参数**:
- `id`: 需要删除的系统用户 ID

#### 员工管理

##### 获取所有员工

```typescript
async getEmployees(): Promise<Employee[]>
```

**返回**: 员工列表（包含已离职员工）

##### 新增单个员工

```typescript
async createEmployee(employee: Employee): Promise<Employee>
```

**参数**:
- `employee`: 需要写入数据库的新员工（前端先生成 `id`）

**返回**: 后端返回的完整员工记录（会自动从 `snake_case` 转为 `camelCase`）

##### 更新单个员工

```typescript
async updateEmployee(updatedEmp: Employee): Promise<void>
```

**参数**:
- `updatedEmp`: 更新后的员工对象

**说明**: 会自动查找并替换对应ID的员工信息

#### 月度数据管理

##### 获取指定月份数据

```typescript
async getMonthlyData(year: number, month: number): Promise<MonthlyData | null>
```

**参数**:
- `year`: 年份
- `month`: 月份 (1-12)

**返回**: 月度数据对象，不存在时返回 `null`

##### 保存月度数据

```typescript
async saveMonthlyData(data: MonthlyData): Promise<void>
```

**参数**:
- `data`: 月度数据对象

**存储键**: `heshan_db_v9_data_{year}_{month}`

#### 数据统计与维护

##### 获取存储统计

```typescript
async getStorageStats(): Promise<StorageStats>
```

**返回**:
```typescript
{
  usedKB: number;          // 已用存储空间 (KB)
  recordCount: number;     // 月度记录数量
  employeeCount: number;   // 员工数量
  lastBackup: string;      // 最后备份时间
}
```

##### 重置数据库

```typescript
async resetDatabase(): Promise<void>
```

**功能**: 清空所有数据，恢复到初始状态（包含预置员工和用户）

**警告**: 此操作不可逆！

##### 导出数据库

```typescript
async exportDatabase(): Promise<string>
```

**返回**: JSON 格式的数据库完整内容

**用途**: 数据备份

##### 导入数据库

```typescript
async importDatabase(jsonString: string): Promise<boolean>
```

**参数**:
- `jsonString`: 通过 `exportDatabase()` 导出的 JSON 字符串

**返回**: `true` 表示导入成功，`false` 表示失败

**警告**: 会覆盖现有所有数据

---

## 计算服务 (calcService.ts)

### 工作日计算

```typescript
function getWorkingDays(year: number, month: number): number
```

**功能**: 计算指定月份的工作日天数（排除周日）

**参数**:
- `year`: 年份
- `month`: 月份 (1-12)

**返回**: 工作日天数

**示例**:
```typescript
const days = getWorkingDays(2025, 12); // 返回 26 (假设该月有4个周日)
```

### 薪酬计算

```typescript
function calculateSalary(data: MonthlyData): CalculationResult
```

**功能**: 根据月度数据计算所有员工的工资

**计算逻辑**:

1. **计算总薪资池**:
   ```
   总薪资池 = (产量面积 × 单价) + 出勤考核包 + KPI奖励包
   ```

2. **计算实际基础工资**:
   ```
   实际基础工资 = 标准基础分 × (实际工时 / 预期工时)
   ```

3. **计算奖金池**:
   ```
   奖金池 = 总薪资池 - 所有员工实际基础工资之和
   ```

4. **计算综合权重**:
   ```
   工时占比 = 个人工时 / 总工时
   基础分占比 = 个人实际基础工资 / 总实际基础工资
   综合权重 = (工时占比 × 工时权重%) + (基础分占比 × 基础分权重%)
   ```

5. **计算最终工资**:
   ```
   个人奖金 = 奖金池 × 综合权重
   最终工资 = 实际基础工资 + 个人奖金
   ```

**参数**:
- `data`: 包含参数和记录的月度数据

**返回**: 包含详细计算结果的对象

**示例**:
```typescript
const result = calculateSalary(monthlyData);
console.log(`总薪资池: ${result.totalPool}元`);
console.log(`奖金池: ${result.bonusPool}元`);
result.records.forEach(r => {
  console.log(`${r.employeeName}: ${r.finalScore.toFixed(2)}元`);
});
```

---

## 认证上下文 (AuthContext.tsx)

### Hook: useAuth()

```typescript
function useAuth(): AuthContextType
```

**返回**:
```typescript
interface AuthContextType {
  role: UserRole;                    // 当前用户角色
  setRole: (role: UserRole) => void; // 设置角色
  user: {                            // 当前用户信息
    name: string;
    avatar: string;
    permissions: Permission[];
    scopes: string[];                // 会话内可访问范围
    role?: UserRole;
  } | null;
  logout: () => void;                // 登出
  hasPermission: (perm: Permission) => boolean; // 权限检查
  hasScope: (scope: string) => boolean;         // 范围检查（如 'styling'）
  login: (user: SystemUser) => void; // 登录
}
```

### 方法说明

#### login()

```typescript
login(user: SystemUser): void
```

**功能**: 用户登录，设置当前用户和角色

**参数**:
- `user`: 系统用户对象

**副作用**: 会话内更新用户信息（不再持久化到 localStorage）

#### logout()

```typescript
logout(): void
```

**功能**: 用户登出，清除会话

**副作用**: 重置会话为访客角色（不涉及 localStorage）

#### hasPermission()

```typescript
hasPermission(perm: Permission): boolean
```

**功能**: 检查当前用户是否拥有指定权限

**参数**:
- `perm`: 要检查的权限

**返回**: `true` 表示有权限，`false` 表示无权限

**逻辑**: 
- 优先检查用户权限列表
- ADMIN 角色默认拥有所有权限

**示例**:
```typescript
const { hasPermission } = useAuth();

if (hasPermission('EDIT_MONEY')) {
  // 显示修改薪资的按钮
}
```

### 角色标签

```typescript
const ROLE_LABELS: Record<UserRole, string>
```

**内容**:
```typescript
{
  ADMIN: '行政 (系统管理)',
  VP_PRODUCTION: '生产副总 (定薪/KPI)',
  SCHEDULING: '调度中心 (产量)',
  SECTION_HEAD: '工段负责人 (工时)',
  GENERAL_MANAGER: '总经理 (审批/查看)',
  GUEST: '访客'
}
```

---

## 数据上下文 (DataContext.tsx)

### Hook: useData()

```typescript
function useData(): DataContextType
```

**返回**:
```typescript
interface DataContextType {
  // 状态
  currentDate: { year: number; month: number };
  currentData: MonthlyData;
  employees: Employee[];
  systemUsers: SystemUser[];
  settings: GlobalSettings;
  isLoading: boolean;
  isSaving: boolean;

  // 日期控制
  setCurrentDate: (date: { year: number; month: number }) => void;

  // 月度数据修改
  updateParams: (params: Partial<MonthlyParams>) => void;
  updateRecord: (employeeId: string, changes: Partial<SalaryRecord>) => void;
  updateDailyLog: (employeeId: string, day: number, hours: number) => void;
  autoFillAttendance: () => Promise<void>;
  resetMonthData: () => Promise<void>;

  // 员工管理
  addEmployee: (emp: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (emp: Employee) => Promise<void>;
  removeEmployee: (id: string) => Promise<void>;

  // 用户管理
  addSystemUser: (user: Omit<SystemUser, 'id'>) => Promise<void>;
  updateSystemUser: (user: SystemUser) => Promise<void>;
  deleteSystemUser: (id: string) => Promise<void>;

  // 设置管理
  updateSettings: (settings: Partial<GlobalSettings>) => Promise<void>;
}
```

### 方法详解

#### 日期与数据获取

##### setCurrentDate()

```typescript
setCurrentDate(date: { year: number; month: number }): void
```

**功能**: 切换当前查看的月份

**参数**:
- `date.year`: 年份
- `date.month`: 月份 (1-12)

**副作用**: 自动加载对应月份的数据，如不存在则创建新月数据

#### 月度参数修改

##### updateParams()

```typescript
updateParams(params: Partial<MonthlyParams>): void
```

**功能**: 更新当前月份的计算参数

**参数**:
- `params`: 要更新的参数（部分更新）

**示例**:
```typescript
const { updateParams } = useData();

// 更新单价和产量
updateParams({
  area: 20000,
  unitPrice: 2.8
});
```

##### updateRecord()

```typescript
updateRecord(employeeId: string, changes: Partial<SalaryRecord>): void
```

**功能**: 更新指定员工的薪酬记录

**参数**:
- `employeeId`: 员工ID
- `changes`: 要更新的字段

**示例**:
```typescript
updateRecord('emp123', {
  workHours: 288,
  baseScoreSnapshot: 7500
});
```

##### updateDailyLog()

```typescript
updateDailyLog(employeeId: string, day: number, hours: number): void
```

**功能**: 更新指定员工某一天的工时

**参数**:
- `employeeId`: 员工ID
- `day`: 日期 (1-31)
- `hours`: 工时数

**副作用**: 自动重新计算该员工的总工时

##### autoFillAttendance()

```typescript
async autoFillAttendance(): Promise<void>
```

**功能**: 自动填充当月所有工作日的出勤记录

**逻辑**: 
- 排除周日
- 使用员工的预期日工时填充
- 覆盖现有记录

##### resetMonthData()

```typescript
async resetMonthData(): Promise<void>
```

**功能**: 重置当前月份数据到初始状态

**警告**: 会清除所有已录入的工时和调整

#### 员工管理

##### addEmployee()

```typescript
async addEmployee(emp: Omit<Employee, 'id'>): Promise<void>
```

**功能**: 添加新员工

**参数**:
- `emp`: 员工信息（不包含 `id`，系统自动生成）

**副作用**: 自动将新员工同步到当前月份的薪酬记录中

##### updateEmployee()

```typescript
async updateEmployee(emp: Employee): Promise<void>
```

**功能**: 更新员工信息

**参数**:
- `emp`: 完整的员工对象

**副作用**: 
- 更新员工档案
- 同步更新当前月份的基础分和姓名

##### removeEmployee()

```typescript
async removeEmployee(id: string): Promise<void>
```

**功能**: 标记员工为离职状态（软删除）

**参数**:
- `id`: 员工ID

**说明**: 不会真正删除员工，而是将状态改为 `terminated`

#### 用户管理

##### addSystemUser()

```typescript
async addSystemUser(user: Omit<SystemUser, 'id'>): Promise<void>
```

**功能**: 添加新的系统用户

**参数**:
- `user`: 用户信息（不包含 `id`）

##### updateSystemUser()

```typescript
async updateSystemUser(user: SystemUser): Promise<void>
```

**功能**: 更新系统用户信息

**参数**:
- `user`: 完整的用户对象

##### deleteSystemUser()

```typescript
async deleteSystemUser(id: string): Promise<void>
```

**功能**: 删除系统用户（硬删除）

**参数**:
- `id`: 用户ID

**警告**: 不能删除 `isSystem: true` 的预置用户

#### 设置管理

##### updateSettings()

```typescript
async updateSettings(settings: Partial<GlobalSettings>): Promise<void>
```

**功能**: 更新全局设置

**参数**:
- `settings`: 要更新的设置项

---

## 错误处理

### 通用错误处理原则

所有异步操作均使用 `try-catch` 捕获错误，并在控制台输出详细信息：

```typescript
try {
  await db.saveMonthlyData(data);
} catch (err) {
  console.error("Failed to save monthly data:", err);
}
```

### 常见错误场景

#### 1. 无法连接后端 / Supabase

**原因**: `http://localhost:3000/api` 未启动、端口冲突或 Session Pooler 连接失效。

**解决方案**:
- 在终端重新执行 `start /b node server.js`，确认输出 `Backend server running...`
- 若端口被占用，先运行 `taskkill /F /IM node.exe` 再启动。
- 确保 `.env.server` 中的 `DATABASE_URL`、`PORT` 配置正确。

#### 2. JSON 数据解析失败

**原因**: 后端返回的历史 `monthly_data` JSON 字段损坏。

**解决方案**:
- 在 Supabase 控制台检查 `monthly_data` 表，修复或删除异常记录。
- 重新执行最近一次正确的 `init-db.sql` 或备份脚本。

#### 3. 权限不足

**原因**: 用户尝试访问无权限的功能

**解决方案**:
- 在 UI 层使用 `hasPermission()` 预先隐藏无权限的操作
- 在操作执行前再次验证权限

---

## 使用示例

### 完整的薪酬计算流程

```typescript
import { useData } from './contexts/DataContext';
import { calculateSalary } from './services/calcService';

function SalaryCalculatorPage() {
  const { currentData, updateParams } = useData();

  // 1. 设置月度参数
  const handleSetParams = () => {
    updateParams({
      area: 18000,
      unitPrice: 2.5,
      attendancePack: 20000,
      kpiScore: 2500,
      weightTime: 50,
      weightBase: 50
    });
  };

  // 2. 计算工资
  const result = calculateSalary(currentData);

  // 3. 显示结果
  return (
    <div>
      <h1>总薪资池: {result.totalPool.toFixed(2)} 元</h1>
      <h2>奖金池: {result.bonusPool.toFixed(2)} 元</h2>
      <table>
        <thead>
          <tr>
            <th>姓名</th>
            <th>工时</th>
            <th>基础工资</th>
            <th>奖金</th>
            <th>总工资</th>
          </tr>
        </thead>
        <tbody>
          {result.records.map(r => (
            <tr key={r.employeeId}>
              <td>{r.employeeName}</td>
              <td>{r.workHours}h</td>
              <td>{r.realBase.toFixed(2)}</td>
              <td>{r.bonus.toFixed(2)}</td>
              <td>{r.finalScore.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 权限控制示例

```typescript
import { useAuth } from './contexts/AuthContext';

function EmployeeManagementPage() {
  const { hasPermission } = useAuth();

  return (
    <div>
      <h1>员工管理</h1>
      
      {hasPermission('MANAGE_EMPLOYEES') && (
        <button>添加员工</button>
      )}
      
      {hasPermission('EDIT_BASE_SCORE') && (
        <button>修改基础分</button>
      )}
      
      {!hasPermission('VIEW_SENSITIVE') && (
        <p>您无权查看敏感薪资信息</p>
      )}
    </div>
  );
}
```

---

## 附录

### Supabase 表结构 (init-db.sql)

| 表名 | 说明 |
|------|------|
| `employees` | 员工档案与基础分等信息 |
| `workshops` | 工段/部门结构（含 `departments` JSONB） |
| `system_users` | 系统登录账户、权限、PIN 码 |
| `settings` | 全局公告等配置 |
| `monthly_data` | 每月薪酬计算参数与 `data` JSON | 

提示：任何结构修改请优先在 `init-db.sql` 中更新并同步到 Supabase。 

### 性能优化建议

1. **避免频繁的状态更新**: 使用防抖或节流处理用户输入
2. **数据分页**: 大量员工时考虑分页显示
3. **懒加载**: 只加载当前月份的数据，不预加载其他月份
4. **缓存计算结果**: 在参数未变化时复用计算结果

### 安全建议

1. **PIN 码加密**: 当前 PIN 码明文存储，建议使用哈希算法
2. **数据加密**: 敏感数据可考虑加密存储
3. **会话超时**: 添加自动登出机制
4. **操作日志**: 记录敏感操作（如修改工资、删除员工）

---

**文档维护**: 如有更新，请同步修改此文档  
**技术支持**: 请联系系统开发团队
