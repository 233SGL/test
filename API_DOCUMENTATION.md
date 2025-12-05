# 鹤山积分管理系统 API 文档

## 概述

本文档描述了系统后端提供的所有 RESTful API 接口。

- **基础 URL**: `http://localhost:3000/api`
- **数据格式**: JSON
- **认证方式**: 暂无（后续可添加 JWT）

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
  "ok": 1
}
```

---

## 员工管理 API

### 获取所有员工

```
GET /api/employees
```

### 创建员工

```
POST /api/employees
Content-Type: application/json

{
  "id": "emp001",
  "name": "张三",
  "gender": "male",
  "workshopId": "ws_weaving",
  "department": "织造部",
  "position": "操作工",
  "joinDate": "2024-01-01",
  "standardBaseScore": 100,
  "status": "active",
  "phone": "13800138000",
  "expectedDailyHours": 8
}
```

### 更新员工

```
PUT /api/employees/:id
```

### 删除员工

```
DELETE /api/employees/:id
```

---

## 系统用户 API

### 获取所有用户

```
GET /api/users
```

### 创建用户

```
POST /api/users
```

### 更新用户

```
PUT /api/users/:id
```

### 删除用户

```
DELETE /api/users/:id
```

---

## 工段/车间 API

### 获取所有工段

```
GET /api/workshops
```

---

## 系统设置 API

### 获取设置

```
GET /api/settings
```

### 更新设置

```
PUT /api/settings
```

---

## 月度数据 API

### 获取指定月份数据

```
GET /api/monthly-data/:year/:month
```

### 保存月度数据

```
POST /api/monthly-data
```

---

## 织造工段 API

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
    "status": "active",
    "attendanceDays": 26,
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
  "machineId": "H1",
  "team": "一班"
}
```

#### 更新织造员工

```
PUT /api/weaving/employees/:id
```

#### 删除织造员工

```
DELETE /api/weaving/employees/:id
```

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
    "targetOutput": 6450,
    "status": "running"
  }
]
```

#### 更新机台

```
PUT /api/weaving/machines/:id
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

#### 更新配置

```
PUT /api/weaving/config
```

### 月度数据

#### 获取指定月份数据

```
GET /api/weaving/monthly-data/:year/:month
```

**响应示例**:
```json
{
  "year": 2024,
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

#### 保存月度数据

```
POST /api/weaving/monthly-data
Content-Type: application/json

{
  "year": 2024,
  "month": 12,
  "netFormationRate": 72.5,
  "operationRate": 78.3,
  "equivalentOutput": 65000,
  "activeMachines": 10,
  "actualOperators": 22,
  "attendanceDays": 26
}
```

#### 获取历史数据

```
GET /api/weaving/monthly-data
```

返回最近 12 个月的数据，用于趋势图展示。

### 机台产量记录

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
  "year": 2024,
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
- `404` - 资源不存在
- `500` - 服务器内部错误

---

## 数据库表结构

### 织造工段相关表

| 表名 | 说明 |
|------|------|
| `weaving_employees` | 织造工段员工表 |
| `weaving_machines` | 机台配置表 |
| `weaving_config` | 工段配置参数表 |
| `weaving_monthly_data` | 月度汇总数据表 |
| `weaving_machine_monthly_records` | 机台月度产量明细表 |

### 员工岗位类型

| 值 | 说明 |
|----|------|
| `admin_leader` | 管理员班长 |
| `admin_member` | 管理员班员 |
| `operator` | 操作工 |

### 机台速度类型

| 值 | 速度系数 | 说明 |
|----|----------|------|
| `H2` | 1.0 | 高速机 |
| `H5` | 0.56 | 低速机 |
