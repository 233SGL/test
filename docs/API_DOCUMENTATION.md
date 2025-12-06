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

### 网种/产品管理

#### 获取所有网种

```
GET /api/weaving/products
```

**响应示例**:
```json
[
  {
    "id": "product_13weft",
    "name": "13纬密网",
    "weftDensity": 13,
    "isActive": true
  }
]
```

#### 创建网种

```
POST /api/weaving/products
```

#### 更新网种

```
PUT /api/weaving/products/:id
```

#### 删除网种

```
DELETE /api/weaving/products/:id
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
    "width": 8.5,
    "effectiveWidth": 7.7,
    "speedWeftPerMin": 41,
    "targetOutput": 6450,
    "status": "running"
  }
]
```

#### 更新机台

```
PUT /api/weaving/machines/:id
```

**请求体**:
```json
{
  "name": "1号机",
  "width": 8.5,
  "effectiveWidth": 7.7,
  "speedWeftPerMin": 41,
  "targetOutput": 6450,
  "status": "running"
}
```

### 生产记录管理

#### 获取指定月份的生产记录

```
GET /api/weaving/production-records?year=2024&month=12
```

**响应示例**:
```json
[
  {
    "id": 1,
    "productionDate": "2024-12-05",
    "machineId": "H1",
    "machineName": "1号机",
    "productId": "product_13weft",
    "productName": "13纬密网",
    "length": 120,
    "machineWidth": 8.5,
    "weftDensity": 13,
    "actualArea": 1020,
    "equivalentOutput": 1020,
    "qualityGrade": "A",
    "isQualified": true,
    "startTime": "2024-12-05T08:00:00",
    "endTime": "2024-12-05T16:00:00"
  }
]
```

#### 创建生产记录

```
POST /api/weaving/production-records
Content-Type: application/json

{
  "productionDate": "2024-12-05",
  "machineId": "H1",
  "productId": "product_13weft",
  "length": 120,
  "qualityGrade": "A",
  "isQualified": true,
  "startTime": "2024-12-05T08:00:00",
  "endTime": "2024-12-05T16:00:00",
  "notes": ""
}
```

#### 删除生产记录

```
DELETE /api/weaving/production-records/:id
```

### 月度汇总

#### 获取月度汇总数据

```
GET /api/weaving/monthly-summary/:year/:month
```

**响应示例**:
```json
{
  "totalNets": 150,
  "totalLength": 18000,
  "totalArea": 153000,
  "equivalentOutput": 153000,
  "netFormationRate": 72.5,
  "operationRate": 78.3,
  "activeMachines": 10,
  "actualOperators": 22
}
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
| `weaving_products` | 网种/产品表 |
| `weaving_production_records` | 生产记录表（每张网一条） |
| `weaving_config` | 工段配置参数表 |
| `weaving_monthly_summary` | 月度汇总数据表 |

### 员工岗位类型（织造工段）

| 职位名称 | 基本工资 | 系数 | 说明 |
|----------|----------|------|------|
| 机台管理员班长 | 3500 | 1.3 | 管理员班班长 |
| 机台管理员 | 2500 | 1.0 | 管理员班成员 |

### 机台属性说明

| 字段 | 说明 |
|------|------|
| `width` | 织造宽度 (m) |
| `effectiveWidth` | 有效宽度 (m)，用于计算实际面积 |
| `speedWeftPerMin` | 织造速度 (纬/分) |
| `targetOutput` | 月目标产量 (㎡) |
| `status` | 状态：running/threading/maintenance/idle |

### 机台状态

| 值 | 说明 |
|----|------|
| `running` | 运行中 |
| `threading` | 穿线中 |
| `maintenance` | 维护中 |
| `idle` | 停机 |
