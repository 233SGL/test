# 鹤山积分管理系统 API 文档

## 概述

本文档描述了系统后端提供的所有 RESTful API 接口。

- **基础 URL**: `/api`（通过 Vite 代理转发到 `http://localhost:3000/api`）
- **数据格式**: JSON
- **字符编码**: UTF-8
- **认证方式**: 请求头认证 + 权限验证
- **后端框架**: Express.js + PostgreSQL (Supabase)

### 请求头

```
Content-Type: application/json
x-user-id: <用户ID>          # 敏感操作必须
x-user-name: <用户名>        # 审计日志用
```

### 认证与权限

| 权限 | 说明 | 适用 API |
|------|------|----------|
| `MANAGE_EMPLOYEES` | 员工管理权限 | POST/PUT/DELETE `/api/employees/*`, `/api/workshops/*` |
| `MANAGE_SYSTEM` | 系统管理权限 | POST/PUT/DELETE `/api/users/*`, `/api/admin/*` |

**速率限制**: 登录和 PIN 验证接口有 5 次失败锁定 15 分钟的限制。

### 通用响应格式

**成功响应**:
```json
{
  "data": {...}  // 或数组 [...]
}
```

**错误响应**:
```json
{
  "error": "错误信息描述"
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| `200` | 成功 |
| `201` | 创建成功 |
| `204` | 删除成功（无内容返回）|
| `400` | 请求参数错误 |
| `401` | 未授权（缺少或无效的用户标识）|
| `403` | 权限不足 |
| `404` | 资源不存在 |
| `429` | 请求过于频繁（速率限制）|
| `500` | 服务器内部错误 |


---

## 通用 API

### 健康检查

```
GET /api/health
```

检查数据库连接状态。

**响应示例**:
```json
{
  "connected": true,
  "ok": true
}
```

---

## 定型工段 API

### 员工管理

#### 获取所有员工

```
GET /api/employees
```

**响应示例**:
```json
[
  {
    "id": "emp001",
    "name": "张三",
    "gender": "male",
    "workshopId": "ws_styling",
    "department": "定型一车间",
    "position": "操作工",
    "joinDate": "2024-01-01",
    "standardBaseScore": 100,
    "status": "active",
    "phone": "13800138000",
    "expectedDailyHours": 8,
    "machineId": "M1",
    "baseSalary": 3000,
    "coefficient": 1.0
  }
]
```

#### 创建员工

```
POST /api/employees
Content-Type: application/json

{
  "id": "emp001",
  "name": "张三",
  "gender": "male",
  "workshopId": "ws_styling",
  "department": "定型一车间",
  "position": "操作工",
  "joinDate": "2024-01-01",
  "standardBaseScore": 100,
  "status": "active",
  "phone": "13800138000",
  "expectedDailyHours": 8,
  "baseSalary": 3000,
  "coefficient": 1.0
}
```

**请求体字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 员工编号 |
| `name` | string | 是 | 姓名 |
| `gender` | string | 是 | 性别: male/female |
| `workshopId` | string | 是 | 所属工段ID |
| `department` | string | 否 | 部门名称 |
| `position` | string | 是 | 职位 |
| `joinDate` | string | 是 | 入职日期 (YYYY-MM-DD) |
| `standardBaseScore` | number | 是 | 标准基础分 |
| `status` | string | 是 | 状态: active/inactive |
| `phone` | string | 否 | 联系电话 |
| `expectedDailyHours` | number | 否 | 预期日工时，默认12 |
| `baseSalary` | number | 否 | 基本工资，默认0 |
| `coefficient` | number | 否 | 系数，默认1.0 |

#### 更新员工

```
PUT /api/employees/:id
Content-Type: application/json

{
  "name": "张三",
  "gender": "male",
  "workshopId": "ws_styling",
  "department": "定型一车间",
  "position": "班长",
  "joinDate": "2024-01-01",
  "standardBaseScore": 120,
  "status": "active",
  "phone": "13800138000",
  "expectedDailyHours": 8,
  "baseSalary": 3500,
  "coefficient": 1.2
}
```

#### 删除员工

```
DELETE /api/employees/:id
```

**响应**: `204 No Content`

### 月度数据

#### 获取指定月份数据

```
GET /api/monthly-data/:year/:month
```

**示例**: `GET /api/monthly-data/2025/12`

**响应示例**:
```json
{
  "year": 2025,
  "month": 12,
  "data": {
    "employees": [...],
    "attendance": {...},
    "scores": {...}
  }
}
```

#### 保存月度数据

```
POST /api/monthly-data
Content-Type: application/json

{
  "year": 2025,
  "month": 12,
  "data": {
    "employees": [...],
    "attendance": {...},
    "scores": {...}
  }
}
```

**说明**: 使用 `UPSERT` 模式，如果记录存在则更新，不存在则创建。

---

## 系统管理 API

### 系统用户

#### 获取所有用户

```
GET /api/users
```

**响应示例**:
```json
[
  {
    "id": "user001",
    "username": "admin",
    "display_name": "管理员",
    "role": "admin",
    "custom_role_name": null,
    "pin_code": "123456",
    "is_system": true,
    "scopes": ["styling", "weaving", "system"],
    "permissions": ["read", "write", "delete", "admin"]
  }
]
```

#### 创建用户

```
POST /api/users
Content-Type: application/json

{
  "id": "user002",
  "username": "operator1",
  "displayName": "操作员小王",
  "role": "operator",
  "customRoleName": null,
  "pinCode": "654321",
  "isSystem": false,
  "scopes": ["styling"],
  "permissions": ["read", "write"]
}
```

**请求体字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 用户ID |
| `username` | string | 是 | 用户名（登录用）|
| `displayName` | string | 是 | 显示名称 |
| `role` | string | 是 | 角色: admin/manager/operator |
| `customRoleName` | string | 否 | 自定义角色名称 |
| `pinCode` | string | 是 | PIN码（6位数字）|
| `isSystem` | boolean | 否 | 是否系统用户，默认false |
| `scopes` | array | 是 | 权限范围: styling/weaving/system |
| `permissions` | array | 是 | 权限: read/write/delete/admin |

#### 更新用户

```
PUT /api/users/:id
Content-Type: application/json

{
  "username": "operator1",
  "displayName": "操作员老王",
  "role": "manager",
  "pinCode": "111111",
  "isSystem": false,
  "scopes": ["styling", "weaving"],
  "permissions": ["read", "write", "delete"]
}
```

#### 删除用户

```
DELETE /api/users/:id
```

**响应**: `204 No Content`

### 工段/车间

#### 获取所有工段

```
GET /api/workshops
```

**响应示例**:
```json
[
  {
    "id": "ws_styling",
    "name": "定型工段",
    "code": "styling",
    "departments": ["定型一车间", "定型二车间", "后整理"]
  },
  {
    "id": "ws_weaving",
    "name": "织造工段",
    "code": "weaving",
    "departments": ["织造一班", "织造二班"]
  }
]
```

#### 更新工段

```
PUT /api/workshops/:id
Content-Type: application/json

{
  "name": "定型工段",
  "code": "styling",
  "departments": ["定型一车间", "定型二车间", "后整理"]
}
```

**说明**: 使用 `UPSERT` 模式，如果工段存在则更新，不存在则创建。

#### 重命名文件夹（原子操作）

```
POST /api/workshops/:id/rename-folder
Content-Type: application/json

{
  "oldName": "定型一车间",
  "newName": "定型一车间（新）"
}
```

**请求体字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `oldName` | string | 是 | 原文件夹名称 |
| `newName` | string | 是 | 新文件夹名称，最长50字符 |

**说明**: 此操作使用数据库事务，会同时更新：
1. 工段的 `departments` 数组
2. 该文件夹下所有员工的 `department` 字段

**响应示例**:
```json
{
  "success": true,
  "message": "文件夹重命名成功",
  "newDepartments": ["定型一车间（新）", "定型二车间", "后整理"]
}
```

**错误响应**:
- `400` - 文件夹名称不能为空或超过50字符
- `404` - 工段或原文件夹不存在
- `409` - 新文件夹名称已存在

### 系统设置

#### 获取设置

```
GET /api/settings
```

**响应示例**:
```json
{
  "id": "global",
  "announcement": "系统公告内容..."
}
```

#### 更新设置

```
PUT /api/settings
Content-Type: application/json

{
  "announcement": "新的系统公告内容"
}
```

---

## 织造工段 API

> 所有织造工段 API 以 `/api/weaving` 为前缀

### 员工管理

#### 获取所有织造员工

```
GET /api/weaving/employees
```

**响应示例**:
```json
[
  {
    "id": "w1",
    "name": "耿志友",
    "gender": "male",
    "position": "admin_leader",
    "baseSalary": 3500,
    "coefficient": 1.3,
    "joinDate": "2020-01-01",
    "phone": "13800138001",
    "status": "active",
    "notes": "管理员班班长",
    "machineId": null,
    "team": null
  }
]
```

#### 创建织造员工

```
POST /api/weaving/employees
Content-Type: application/json

{
  "id": "w4",
  "name": "李四",
  "gender": "male",
  "position": "operator",
  "baseSalary": 0,
  "coefficient": 0,
  "joinDate": "2024-06-01",
  "phone": "13800138004",
  "status": "active",
  "notes": "",
  "machineId": "H1",
  "team": "一班"
}
```

**请求体字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 员工编号 |
| `name` | string | 是 | 姓名 |
| `gender` | string | 是 | 性别: male/female |
| `position` | string | 是 | 岗位: admin_leader/admin_member/operator |
| `baseSalary` | number | 否 | 基本工资，默认0 |
| `coefficient` | number | 否 | 分配系数，默认1.0 |
| `joinDate` | string | 否 | 入职日期 (YYYY-MM-DD) |
| `phone` | string | 否 | 联系电话 |
| `status` | string | 否 | 状态: active/inactive，默认active |
| `notes` | string | 否 | 备注 |
| `machineId` | string | 否 | 负责机台ID（操作工填写）|
| `team` | string | 否 | 班组 |

#### 更新织造员工

```
PUT /api/weaving/employees/:id
Content-Type: application/json

{
  "name": "李四",
  "gender": "male",
  "position": "operator",
  "baseSalary": 0,
  "coefficient": 0,
  "joinDate": "2024-06-01",
  "phone": "13800138004",
  "status": "active",
  "notes": "优秀员工",
  "machineId": "H2",
  "team": "二班"
}
```

#### 删除织造员工

```
DELETE /api/weaving/employees/:id
```

**响应**: `204 No Content`

### 网种/产品管理

#### 获取所有网种

```
GET /api/weaving/products
```

**响应示例**:
```json
[
  {
    "id": "22504",
    "name": "22504标准网",
    "weftDensity": 13,
    "description": "基准产品，纬密13",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z"
  },
  {
    "id": "7500",
    "name": "7500高密网",
    "weftDensity": 44.5,
    "description": "高纬密产品，产量系数3.42",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

#### 创建网种

```
POST /api/weaving/products
Content-Type: application/json

{
  "id": "3616ssb",
  "name": "3616ssb网",
  "weftDensity": 44.5,
  "description": "高纬密产品",
  "isActive": true
}
```

**请求体字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 网种编号 |
| `name` | string | 是 | 网种名称 |
| `weftDensity` | number | 是 | 纬密值 |
| `description` | string | 否 | 描述 |
| `isActive` | boolean | 否 | 是否启用，默认true |

#### 更新网种

```
PUT /api/weaving/products/:id
Content-Type: application/json

{
  "name": "3616ssb网（改）",
  "weftDensity": 45,
  "description": "高纬密产品（修改）",
  "isActive": true
}
```

#### 删除网种

```
DELETE /api/weaving/products/:id
```

**响应**: `204 No Content`

### 机台管理

#### 获取所有机台

```
GET /api/weaving/machines
```

**响应示例**:
```json
[
  {
    "id": "H1",
    "name": "1号机",
    "speedType": "H2",
    "width": 8.5,
    "effectiveWidth": 7.7,
    "speedWeftPerMin": 41,
    "targetOutput": 6450,
    "status": "running"
  },
  {
    "id": "H11",
    "name": "11号机",
    "speedType": "H5",
    "width": 8.8,
    "effectiveWidth": 8.0,
    "speedWeftPerMin": 23,
    "targetOutput": 6450,
    "status": "running"
  }
]
```

#### 更新机台

```
PUT /api/weaving/machines/:id
```

**请求体**（支持部分更新，只需传递要更新的字段）:
```json
{
  "targetOutput": 6500
}
```

或完整更新:
```json
{
  "name": "1号机",
  "speedType": "H2",
  "width": 7.7,
  "effectiveWidth": 7.7,
  "speedWeftPerMin": 41,
  "targetOutput": 6450,
  "status": "running"
}
```

**请求体字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 机台名称 |
| `speedType` | string | 否 | 速度类型: H2/H5 |
| `width` | number | 否 | 织机宽度 (m)，仅记录 |
| `effectiveWidth` | number | 否 | 有效幅宽 (m)，用于产量计算 |
| `speedWeftPerMin` | number | 否 | 速度 (纬/分)，H2≈41，H5≈23 |
| `targetOutput` | number | 否 | 月目标产量 (㎡) |
| `status` | string | 否 | 状态: running/threading/maintenance/idle |

**说明**: 更新操作使用 `COALESCE` 只修改请求体中提供的字段，未提供的字段保持原值不变。

### 生产记录管理

#### 获取指定月份的生产记录

```
GET /api/weaving/production-records?year=2025&month=12
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `year` | number | 是 | 年份 |
| `month` | number | 是 | 月份 |
| `machineId` | string | 否 | 按机台筛选 |
| `productId` | string | 否 | 按网种筛选 |

**响应示例**:
```json
[
  {
    "id": 1,
    "year": 2025,
    "month": 12,
    "productionDate": "2025-12-05",
    "machineId": "H1",
    "productId": "22504",
    "length": 55,
    "machineWidth": 8.5,
    "weftDensity": 13,
    "speedType": "H2",
    "actualArea": 467.5,
    "outputCoef": 1,
    "widthCoef": 1,
    "speedCoef": 1,
    "equivalentOutput": 467.5,
    "startTime": "2025-12-05T08:00:00",
    "endTime": "2025-12-05T16:00:00",
    "qualityGrade": "A",
    "isQualified": true,
    "notes": "",
    "createdAt": "2025-12-05T10:00:00Z"
  }
]
```

#### 创建生产记录

```
POST /api/weaving/production-records
Content-Type: application/json

{
  "productionDate": "2025-12-06",
  "machineId": "H1",
  "productId": "22504",
  "length": 55,
  "startTime": "2025-12-06T08:00:00",
  "endTime": "2025-12-06T16:00:00",
  "qualityGrade": "A",
  "isQualified": true,
  "notes": ""
}
```

**请求体字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `productionDate` | string | 是 | 生产日期 (YYYY-MM-DD)，自动提取年月 |
| `machineId` | string | 是 | 机台ID |
| `productId` | string | 是 | 网种ID |
| `length` | number | 是 | 长度 (m) |
| `startTime` | string | 否 | 开始时间 (ISO 8601) |
| `endTime` | string | 否 | 结束时间 (ISO 8601) |
| `qualityGrade` | string | 否 | 质量等级: A/B/C，默认A |
| `isQualified` | boolean | 否 | 是否合格，默认true |
| `notes` | string | 否 | 备注 |

**说明**: 
- `year` 和 `month` 会从 `productionDate` 自动提取
- `machineWidth`、`weftDensity`、`speedType` 会自动从机台和网种配置读取
- `actualArea`、`outputCoef`、`widthCoef`、`speedCoef`、`equivalentOutput` 由数据库触发器自动计算

#### 更新生产记录

```
PUT /api/weaving/production-records/:id
Content-Type: application/json

{
  "length": 60,
  "qualityGrade": "B",
  "isQualified": true,
  "notes": "修改后的备注"
}
```

**说明**: 只支持更新 `length`、`qualityGrade`、`isQualified`、`notes` 字段，触发器会重新计算等效产量。

#### 删除生产记录

```
DELETE /api/weaving/production-records/:id
```

**响应**: `204 No Content`

### 月度汇总

#### 获取月度汇总数据

```
GET /api/weaving/monthly-summary/:year/:month
```

**示例**: `GET /api/weaving/monthly-summary/2025/12`

从生产记录实时聚合计算，返回当月汇总数据。

**响应示例**:
```json
{
  "year": 2025,
  "month": 12,
  "totalNets": 150,
  "totalLength": 18000,
  "totalArea": 153000,
  "equivalentOutput": 153000,
  "qualifiedNets": 145,
  "netFormationRate": 96.67,
  "activeMachines": 10,
  "actualOperators": 22
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `totalNets` | number | 总生产网数 |
| `totalLength` | number | 总长度 (m) |
| `totalArea` | number | 总面积 (㎡) |
| `equivalentOutput` | number | 总等效产量 (㎡) |
| `qualifiedNets` | number | 合格网数 |
| `netFormationRate` | number | 成网率 (%) |
| `activeMachines` | number | 运行机台数 |
| `actualOperators` | number | 实际操作工人数 |

#### 获取机台汇总数据

```
GET /api/weaving/machine-summary/:year/:month
```

**示例**: `GET /api/weaving/machine-summary/2025/12`

**响应示例**:
```json
[
  {
    "machineId": "H1",
    "netCount": 15,
    "totalLength": 825,
    "totalArea": 7012.5,
    "totalEquivalent": 7012.5
  },
  {
    "machineId": "H2",
    "netCount": 12,
    "totalLength": 660,
    "totalArea": 5610,
    "totalEquivalent": 5610
  }
]
```

### 配置管理

#### 获取配置

```
GET /api/weaving/config
```

**响应示例**:
```json
{
  "netFormationBenchmark": 68,
  "operationRateBenchmark": 72,
  "targetEquivalentOutput": 6450,
  "operatorQuota": 24,
  "avgTargetBonus": 4000,
  "adminTeamSize": 3,
  "operationRateBonusUnit": 500,
  "leaderCoef": 1.3,
  "memberCoef": 1.0,
  "leaderBaseSalary": 3500,
  "memberBaseSalary": 2500
}
```

---

## 后台管理 API (Admin)

> 所有后台管理 API 以 `/api/admin` 为前缀

### 审计日志

#### 获取操作日志

```
GET /api/admin/audit-logs
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认1 |
| `limit` | number | 否 | 每页数量，默认50 |
| `action` | string | 否 | 操作类型: CREATE/UPDATE/DELETE/LOGIN/LOGOUT/LOGIN_FAILED/BACKUP/RESTORE/ADMIN_ACCESS |
| `targetType` | string | 否 | 目标类型: employee/workshop/user/settings/backup/system/weaving_employee/weaving_machine等 |
| `search` | string | 否 | 搜索关键词（匹配用户名或目标名称） |
| `dateFrom` | string | 否 | 开始日期 (YYYY-MM-DD) |
| `dateTo` | string | 否 | 结束日期 (YYYY-MM-DD)

**响应示例**:
```json
{
  "data": [
    {
      "id": 1,
      "username": "admin",
      "action": "UPDATE",
      "target_type": "employee",
      "target_id": "emp001",
      "target_name": "张三",
      "details": {"old": "...", "new": "..."},
      "ip_address": "127.0.0.1",
      "created_at": "2025-12-09T10:00:00Z"
    }
  ],
  "total": 100
}
```

### 系统统计

#### 获取系统概览统计

```
GET /api/admin/stats
```

**响应示例**:
```json
{
  "activeEmployees": 25,
  "systemUsers": 6,
  "logsToday": 42,
  "onlineUsers": 3
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `activeEmployees` | number | 在职员工数（不含离职）|
| `systemUsers` | number | 系统用户数 |
| `logsToday` | number | 今日操作日志数 |
| `onlineUsers` | number | 5分钟内活跃用户数 |

### 登录历史

#### 获取登录历史

```
GET /api/admin/login-history
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认1 |
| `limit` | number | 否 | 每页数量，默认50 |
| `userId` | string | 否 | 按用户ID筛选 |

**响应示例**:
```json
{
  "data": [
    {
      "id": 1,
      "user_id": "u1",
      "username": "admin",
      "action": "LOGIN",
      "ip_address": "127.0.0.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2025-12-11T08:00:00Z"
    }
  ],
  "total": 50
}
```

### 在线用户

#### 获取当前在线用户

```
GET /api/admin/users-online
```

**响应示例**:
```json
[
  {
    "user_id": "u1",
    "username": "admin",
    "ip_address": "192.168.1.1",
    "last_activity": "2025-12-11T15:00:00Z",
    "created_at": "2025-12-11T08:00:00Z"
  }
]
```

**说明**: 5分钟内有活动的用户视为在线。

### 管理员验证

#### 验证管理员身份

```
POST /api/admin/verify
Content-Type: application/json

{
  "userId": "u1",
  "password": "123456"
}
```

**响应**:
```json
{
  "verified": true
}
```

**错误响应**:
- `401` - PIN 码错误
- `403` - 用户无 MANAGE_SYSTEM 权限
- `429` - 请求次数过多（5次失败后锁定15分钟）

#### 验证管理员 PIN（危险操作二次确认）

```
POST /api/admin/verify-pin
Content-Type: application/json

{
  "pin": "123456"
}
```

使用 admin 账户的 PIN 码进行验证，用于恢复备份等高危操作的二次确认。

**响应**:
```json
{
  "verified": true
}
```

**错误响应**:
- `401` - { "verified": false }
- `429` - 请求次数过多

### 会话管理

#### 记录登录历史

```
POST /api/admin/login-record
Content-Type: application/json

{
  "userId": "u1",
  "username": "admin",
  "action": "LOGIN"
}
```

**action 值**:

| 值 | 说明 |
|------|------|
| `LOGIN` | 登录成功 |
| `LOGOUT` | 登出 |
| `LOGIN_FAILED` | 登录失败 |

#### 删除会话（登出）

```
DELETE /api/admin/session/:sessionId
```

**响应**: 
```json
{
  "success": true
}
```

### 数据库备份

#### 获取备份列表

```
GET /api/admin/backups
```

**响应示例**:
```json
[
  {
    "filename": "backup-manual-2025-12-11T10-00-00-000Z.json",
    "size": 102400,
    "createdAt": "2025-12-11T10:00:00Z"
  }
]
```

#### 创建备份

```
POST /api/admin/backups
```

**权限**: 需要 `MANAGE_SYSTEM` 权限

**响应**:
```json
{
  "success": true,
  "filename": "backup-manual-2025-12-11T10-00-00-000Z.json"
}
```

#### 下载备份文件

```
GET /api/admin/backups/:filename
```

**权限**: 需要 `MANAGE_SYSTEM` 权限

**响应**: 直接返回 JSON 文件内容，触发浏览器下载。

**响应头**:
```
Content-Type: application/json
Content-Disposition: attachment; filename="backup-xxx.json"
```

#### 删除备份

```
DELETE /api/admin/backups/:filename
```

**权限**: 需要 `MANAGE_SYSTEM` 权限

**响应**: `204 No Content`

#### 恢复备份

```
POST /api/admin/restore/:filename
```

**权限**: 需要 `MANAGE_SYSTEM` 权限

**警告**: 此操作会清空当前数据库并恢复到备份状态，不可逆！

**响应**:
```json
{
  "success": true
}
```

### 数据库查看器

#### 获取所有表信息

```
GET /api/admin/database/tables
```

**响应示例**:
```json
[
  {
    "table_name": "employees",
    "column_count": 10,
    "row_count": 25
  },
  {
    "table_name": "monthly_data",
    "column_count": 5,
    "row_count": 12
  }
]
```

#### 获取表结构

```
GET /api/admin/database/tables/:tableName
```

**示例**: `GET /api/admin/database/tables/employees`

**响应示例**:
```json
{
  "columns": [
    {
      "column_name": "id",
      "data_type": "text",
      "is_nullable": "NO",
      "column_default": null
    },
    {
      "column_name": "name",
      "data_type": "text",
      "is_nullable": "NO",
      "column_default": null
    }
  ]
}
```

#### 获取表数据

```
GET /api/admin/database/tables/:tableName/data
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认1 |
| `limit` | number | 否 | 每页数量，默认20，最大100 |

**响应示例**:
```json
{
  "data": [
    { "id": "emp001", "name": "张三", ... }
  ],
  "total": 25,
  "page": 1,
  "limit": 20
}
```

#### 更新配置

```
PUT /api/weaving/config
Content-Type: application/json

{
  "netFormationBenchmark": 68,
  "operationRateBenchmark": 72,
  "targetEquivalentOutput": 6450,
  "operatorQuota": 24,
  "avgTargetBonus": 4000,
  "adminTeamSize": 3,
  "operationRateBonusUnit": 500,
  "leaderCoef": 1.3,
  "memberCoef": 1.0,
  "leaderBaseSalary": 3500,
  "memberBaseSalary": 2500
}
```

**说明**: 使用 `UPSERT` 模式，如果配置存在则更新，不存在则创建。

### 月度数据存档

#### 获取指定月份数据

```
GET /api/weaving/monthly-data/:year/:month
```

**示例**: `GET /api/weaving/monthly-data/2025/12`

获取已保存的月度存档数据（包含计算快照）。

**响应示例**:
```json
{
  "year": 2025,
  "month": 12,
  "netFormationRate": 72.5,
  "operationRate": 78.3,
  "equivalentOutput": 65000,
  "activeMachines": 10,
  "actualOperators": 22,
  "attendanceDays": 26,
  "calculationSnapshot": {
    "qualityBonus": 15600,
    "operationBonus": 3150,
    "totalBonus": 18750,
    "perPersonBonus": {...}
  },
  "machineRecords": [...]
}
```

#### 保存月度数据

```
POST /api/weaving/monthly-data
Content-Type: application/json

{
  "year": 2025,
  "month": 12,
  "netFormationRate": 72.5,
  "operationRate": 78.3,
  "equivalentOutput": 65000,
  "activeMachines": 10,
  "actualOperators": 22,
  "attendanceDays": 26,
  "calculationSnapshot": {...},
  "machineRecords": [...]
}
```

**请求体字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `year` | number | 是 | 年份 |
| `month` | number | 是 | 月份 |
| `netFormationRate` | number | 是 | 成网率 (%) |
| `operationRate` | number | 是 | 运转率 (%) |
| `equivalentOutput` | number | 是 | 等效产量 (㎡) |
| `activeMachines` | number | 是 | 有效机台数 |
| `actualOperators` | number | 是 | 实际操作工人数 |
| `attendanceDays` | number | 是 | 出勤天数 |
| `calculationSnapshot` | object | 否 | 计算结果快照 |
| `machineRecords` | array | 否 | 机台记录数组 |

#### 获取历史数据

```
GET /api/weaving/monthly-data
```

返回最近 12 个月的数据，用于趋势图展示。

### 机台产量记录（旧版兼容）

> 此 API 为旧版兼容接口，新功能请使用生产记录 API

#### 获取指定月份机台记录

```
GET /api/weaving/machine-records/:year/:month
```

**响应示例**:
```json
[
  {
    "machineId": "H1",
    "actualOutput": 6500,
    "weftDensity": 13,
    "machineWidth": 8.5,
    "speedType": "H2",
    "equivalentOutput": 6500
  }
]
```

#### 批量保存机台记录

```
POST /api/weaving/machine-records
Content-Type: application/json

{
  "year": 2025,
  "month": 12,
  "records": [
    {
      "machineId": "H1",
      "actualOutput": 6500,
      "weftDensity": 13,
      "machineWidth": 8.5,
      "speedType": "H2",
      "equivalentOutput": 6500
    }
  ]
}
```

---

## 数据库表结构

### 织造工段相关表

| 表名 | 说明 |
|------|------|
| `weaving_employees` | 织造工段员工表 |
| `weaving_machines` | 机台配置表 (H1-H11) |
| `weaving_products` | 网种/产品表 |
| `weaving_production_records` | 生产记录表（每张网一条） |
| `weaving_config` | 工段配置参数表 |
| `weaving_monthly_summary` | 月度汇总数据表 |
| `weaving_machine_monthly_records` | 机台月度产量记录表 |

### 定型工段相关表

| 表名 | 说明 |
|------|------|
| `employees` | 员工信息表 |
| `workshops` | 工段/车间表 |
| `settings` | 系统设置表 |
| `system_users` | 系统用户表（含权限）|
| `monthly_data` | 月度积分数据表 |

### 员工岗位类型（织造工段）

| position 值 | 显示名称 | 基本工资 | 系数 | 说明 |
|-------------|----------|----------|------|------|
| `admin_leader` | 管理员班长 | 3500 | 1.3 | 管理员班班长，参与奖金二次分配 |
| `admin_member` | 管理员班员 | 2500 | 1.0 | 管理员班成员，参与奖金二次分配 |
| `operator` | 操作工 | 0 | 0 | 负责机台操作，薪酬另行计算 |

### 机台属性说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 机台编号 (H1-H11) |
| `name` | string | 机台名称 |
| `speedType` | string | 速度类型 (H2/H5) |
| `width` | number | 织造宽度 (m) |
| `effectiveWidth` | number | 有效宽度 (m)，用于计算实际面积 |
| `speedWeftPerMin` | number | 织造速度 (纬/分钟)，H2=41, H5=23 |
| `targetOutput` | number | 月目标产量 (㎡)，默认6450 |
| `status` | string | 运行状态 |

### 机台状态

| status 值 | 显示名称 | 说明 |
|-----------|----------|------|
| `running` | 运行中 | 正常生产状态 |
| `threading` | 穿线中 | 更换网种，穿线准备 |
| `maintenance` | 维护中 | 设备维护保养 |
| `idle` | 停机 | 停止运行 |

### 速度系数

| 速度类型 | 纬/分钟 | 系数 |
|----------|---------|------|
| H2 | 41 | 1.0 |
| H5 | 23 | 0.56 |

### 质量等级

| 等级 | 说明 |
|------|------|
| A | 优质，合格 |
| B | 良好，合格 |
| C | 不合格 |

---

## 计算公式

### 等效产量计算

```
等效产量 = 实际产量(长度×宽度) × 产量系数 × 宽度系数 × 速度系数
```

其中：
- **产量系数** = 纬密 ÷ 13（以22504网种纬密13为基准）
- **宽度系数** = 8.5 ÷ 机台宽度（以8.5米为基准，反比例）
- **速度系数** = H2为1.0，H5为0.56

### 成网率质量奖

```
奖励系数 = (当月成网率-68%)×100÷30 × 当月等效产量÷(单机目标×有效机台数) ÷ 实际操作工人数 × 操作工定员

质量奖总数 = 奖励系数 × 平均目标奖金(4000) × 管理员班人数(3)
```

### 运转率奖

```
运转率奖 = (当月运转率-72%) × 100 × 500
```

以72%为基准，每超1个百分点奖500元。

### 二次分配

```
总系数 = 班长系数(1.3) + 班员系数(1.0) × 班员人数(2) = 3.3

班长奖金 = 总奖金 ÷ 总系数 × 班长系数
班员奖金 = 总奖金 ÷ 总系数 × 班员系数
```

---

## 配置项说明

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `netFormationBenchmark` | 成网率基准 (%) | 68 |
| `operationRateBenchmark` | 运转率基准 (%) | 72 |
| `targetEquivalentOutput` | 单机台目标等效产量 (㎡) | 6450 |
| `operatorQuota` | 操作工定员 | 24 |
| `avgTargetBonus` | 平均目标奖金 | 4000 |
| `adminTeamSize` | 管理员班人数 | 3 |
| `operationRateBonusUnit` | 运转率每超1%奖金 | 500 |
| `leaderCoef` | 班长分配系数 | 1.3 |
| `memberCoef` | 班员分配系数 | 1.0 |
| `leaderBaseSalary` | 班长基本工资 | 3500 |
| `memberBaseSalary` | 班员基本工资 | 2500 |

---

## 错误处理

所有 API 在发生错误时返回统一格式：

```json
{
  "error": "错误信息描述"
}
```

HTTP 状态码：
- `200` - 成功
- `201` - 创建成功
- `204` - 删除成功（无内容返回）
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器内部错误

---

## 更新日志

### 2025-12-11
- 新增后台管理 API 文档：
  - `GET /api/admin/stats` - 系统统计概览
  - `GET /api/admin/login-history` - 登录历史
  - `GET /api/admin/users-online` - 在线用户
  - `POST /api/admin/verify` - 管理员身份验证
  - `POST /api/admin/verify-pin` - PIN 码二次确认
  - `POST /api/admin/login-record` - 记录登录历史
  - `DELETE /api/admin/session/:sessionId` - 删除会话
- 新增数据库备份 API 文档：
  - `GET /api/admin/backups` - 获取备份列表
  - `POST /api/admin/backups` - 创建备份
  - `GET /api/admin/backups/:filename` - 下载备份文件
  - `DELETE /api/admin/backups/:filename` - 删除备份
  - `POST /api/admin/restore/:filename` - 恢复备份
- 新增工段文件夹重命名 API `POST /api/workshops/:id/rename-folder`
- 完善工段 API 文档，添加 PUT 工段更新接口
- 更新分页响应格式，添加 `page` 和 `limit` 字段

### 2025-12-06
- 完善 API 文档：添加所有端点详细说明
- 补充请求/响应字段说明表格
- 添加定型工段 API、系统管理 API 完整文档
- 完善机台更新 API，支持部分字段更新（COALESCE 保留原值）
- 添加等效产量计算公式说明
- 添加配置项详细说明
- 添加速度系数、质量等级数据字典
- 新增机台汇总 API 说明
- 新增生产记录更新 API 说明

### 2025-12-05
- 新增织造工段 API 文档
- 添加生产记录管理接口
- 添加机台管理接口
