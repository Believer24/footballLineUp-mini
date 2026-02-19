# 金龙FC足球俱乐部 - 微信小程序项目说明书

## 一、项目概述

**项目名称**：footballLineUp-mini（金龙FC足球俱乐部微信小程序）

**项目描述**：一款面向业余足球俱乐部的微信小程序，用于管理比赛、阵容、球员数据统计和排行榜。支持从微信群报名接龙文本中快速导入球员名单，可视化战术板阵型编辑，赛后数据录入与自动评分，以及射手榜/助攻榜等排行统计。

**目标用户**：业余足球俱乐部的队长、领队和队员。

---

## 二、技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Taro** | 4.1.11 | 跨端开发框架（编译为微信小程序） |
| **React** | ^18.3.1 | UI 组件库 |
| **TypeScript** | ^5.4.0 | 类型安全的 JavaScript 超集 |
| **Zustand** | ^4.5.0 | 轻量状态管理（项目中实际使用本地存储方案） |
| **NutUI React Taro** | ^3.0.0 | UI 组件库（可用） |
| **Sass** | ^1.77.0 | CSS 预处理器 |
| **Webpack 5** | (Taro内置) | 构建打包工具 |

---

## 三、项目目录结构

```
footballLineUp-mini/
├── config/                     # Taro 构建配置
│   ├── dev.js                  # 开发环境配置
│   ├── prod.js                 # 生产环境配置
│   └── index.js                # 通用配置
├── src/
│   ├── app.config.ts           # 小程序全局配置（页面路由、TabBar）
│   ├── app.tsx                 # 应用入口组件
│   ├── app.scss                # 全局样式（设计系统、通用组件样式）
│   ├── assets/                 # 静态资源
│   │   ├── teamIcon.jpg        # 球队Logo
│   │   └── playerIcon/         # 球员位置头像图片（GK、CB、LB、RB、CDM、CM、CAM、LM、RM、LW、ST等）
│   ├── data/
│   │   └── formations.ts       # 阵型数据定义（5v5/7v7/11v11 各阵型坐标）
│   ├── services/
│   │   └── api.ts              # API 请求封装层（与后端通信）
│   ├── store/
│   │   └── auth.ts             # 用户认证状态管理（本地存储）
│   ├── pages/
│   │   ├── login/              # 登录页
│   │   ├── matches/            # 比赛列表页（TabBar）
│   │   ├── import/             # 报名导入页（TabBar）
│   │   ├── tactics/            # 战术板/阵型编辑页
│   │   ├── stats/              # 赛后数据统计页
│   │   └── leaderboard/        # 排行榜页（TabBar）
│   └── utils/                  # 工具函数
├── package.json
├── tsconfig.json
├── babel.config.js
├── project.config.json         # 微信小程序项目配置
└── project.private.config.json # 微信小程序私有配置
```

---

## 四、全局配置

### 4.1 应用配置 (`src/app.config.ts`)

```typescript
// 页面路由注册
pages: [
  'pages/login/index',      // 登录页（首页）
  'pages/matches/index',    // 比赛列表
  'pages/import/index',     // 报名导入
  'pages/tactics/index',    // 战术板
  'pages/leaderboard/index',// 排行榜
  'pages/stats/index',      // 赛后统计
]

// 底部导航栏（TabBar）
tabBar: {
  list: [
    { pagePath: 'pages/matches/index', text: '比赛' },
    { pagePath: 'pages/import/index',  text: '导入' },
    { pagePath: 'pages/leaderboard/index', text: '排行榜' },
  ]
}
```

**导航栏主题**：深色风格（`#1a1a2e` 背景 + 白色文字），选中色为 `#1976d2`。

---

## 五、功能模块详解

### 5.1 用户认证模块

#### 功能说明
- 简单的用户名/密码登录
- 三种角色：`captain`（队长）、`manager`（领队）、`player`（队员）
- 权限控制：队长和领队可编辑（创建比赛、导入球员、修改阵型、录入数据），队员只读

#### 代码实现

**文件**：`src/store/auth.ts`

```typescript
// 角色类型定义
export type UserRole = 'captain' | 'manager' | 'player'

// 用户信息接口
export interface AuthUser {
  id: number
  username: string
  displayName: string
  role: UserRole
}

// 本地存储键名
const STORAGE_KEY = 'footballLineUp_auth'

// 权限判定：队长和领队可编辑
export const canEdit = (role: UserRole): boolean => {
  return role === 'captain' || role === 'manager'
}

// 从本地存储读取/保存/清除用户信息
export const getUser = (): AuthUser | null => { /* Taro.getStorageSync */ }
export const saveUser = (user: AuthUser) => { /* Taro.setStorageSync */ }
export const clearUser = () => { /* Taro.removeStorageSync */ }
```

**登录页**：`src/pages/login/index.tsx`

| 实现逻辑 | 说明 |
|---------|------|
| 调用 `api.login(username, password)` | 向后端 POST `/api/auth/login` |
| 登录成功后 `saveUser(res.user)` | 存储到本地 Storage |
| 跳转 `Taro.switchTab` 到比赛列表页 | 使用 switchTab 切换到 TabBar 页面 |
| 默认账号提示 | `captain` / `manager` / `player1`，密码 `123456` |

---

### 5.2 比赛列表模块

#### 功能说明
- 显示所有比赛记录，按日期筛选
- 比赛卡片显示：日期时间、赛制（5v5/7v7/11v11）、状态（未开始/进行中/已结束）、阵型、报名人数、地点、比分
- 队长/领队可进入阵型编辑和数据统计，可删除比赛
- 用户信息栏显示当前登录用户和退出按钮

#### 代码实现

**文件**：`src/pages/matches/index.tsx`

| 实现逻辑 | 说明 |
|---------|------|
| `useDidShow` 生命周期 | 每次页面显示时检查登录状态并加载比赛列表 |
| `api.getMatches(date?)` | GET `/api/matches` 或 `/api/matches?date=YYYY-MM-DD` |
| 日期筛选 | 使用 Taro `<Picker mode='date'>` 组件 |
| 状态标签样式 | `upcoming` → 蓝色, `ongoing` → 橙色, `completed` → 绿色 |
| 删除比赛 | `Taro.showModal` 确认后调用 `api.deleteMatch(id)` |
| 查看/修改阵型 | `Taro.navigateTo` 跳转到 `/pages/tactics/index?matchId={id}` |
| 数据统计入口 | 跳转到 `/pages/stats/index?matchId={id}` |

---

### 5.3 报名导入模块

#### 功能说明
- 从微信群接龙文本中解析球员、日期、时间、地点
- 选择赛制（5v5/7v7/11v11）和对应阵型
- 解析后预览球员名单，自动分配位置
- 一键创建比赛并导入球员

#### 代码实现

**文件**：`src/pages/import/index.tsx`

**赛制与阵型映射**：

```typescript
const FORMATION_MAP: Record<string, string[]> = {
  '5v5':  ['2-2', '1-2-1', '2-1-1', '3-1'],
  '7v7':  ['2-3-1', '3-2-1', '3-3'],
  '11v11':['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '4-1-2-1-2', '4-5-1', '4-3-2-1', '5-3-2', '4-3-1-2', '3-4-3'],
}
```

**文本解析逻辑** (`handleParse`)：

| 解析项 | 正则/逻辑 | 示例 |
|--------|----------|------|
| 日期 | `/(\\d{4})年(\\d{1,2})月(\\d{1,2})日/` | `2025年3月15日` → `2025-03-15` |
| 时间 | `/(\\d{1,2})点/` | `8点` → `08:00` |
| 地点 | `/地点[：:](.*?)(?:\\n\|$)/` | `地点：XX球场` → `XX球场` |
| 球员名单 | `/\\d+[.\\u3001]\\s*([^\\n\\d]+)/g` | `1. 张三` → `张三` |

**位置自动分配** (`assignPositions`)：

根据赛制分配基础位置序列，超出基础人数的球员按 `DF → MF → FW` 循环分配。

```typescript
const base = {
  '5v5':   ['DF', 'DF', 'MF', 'FW', 'FW'],
  '7v7':   ['GK', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW'],
  '11v11': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'],
}
```

**导入流程** (`handleImport`)：
1. `api.createMatch(...)` → 创建比赛（包含日期、时间、地点、赛制）
2. `api.importPlayers(matchId, players)` → 导入球员，前 N 人为首发（N=赛制人数）
3. `api.updateMatch(matchId, { formation })` → 保存阵型
4. 成功后跳转到战术板页

---

### 5.4 战术板模块（核心功能）

#### 功能说明
- 可视化足球场布局，根据阵型在球场上显示球员位置
- 球员卡片支持翻转动画（正面显示头像，背面显示号码和评分）
- 队长/领队可交换球员位置（首发之间交换、首发与替补互换）
- 阵型切换（Picker 选择器）
- 替补席管理
- 保存阵型和人员位置到后端

#### 代码实现

**文件**：`src/pages/tactics/index.tsx`（403行，最复杂页面）

**球员头像系统**：

按位置分类，每个类别有多个头像图片，通过 `index % avatars.length` 循环使用：

```typescript
const POSITION_AVATARS: Record<string, string[]> = {
  GK: [GK01, GK02],           // 守门员 2种
  DF: [CB01, CB02, CB03, LB01, LB02, RB01, RB02],  // 后卫 7种
  MF: [CDM01, CDM02, CM01, CM02, CAM01, LM01, RM01, LW02], // 中场 8种
  FW: [ST01, ST02, ST03, ST04, ST05, ST06],  // 前锋 6种
}
```

**位置分类映射** (`getPositionCategory`)：

```typescript
GK → 'GK'
CB, LB, RB, LWB, RWB, DF → 'DF'
CDM, CM, CAM, LM, RM, LW, RW, MF → 'MF'
ST, CF, FW → 'FW'
```

**球员交换逻辑**：

| 操作 | 实现 |
|------|------|
| 点击首发球员（未选中状态） | 选中该球员，高亮显示 |
| 点击另一个首发位置 | 两个首发球员交换位置 |
| 选中首发 → 点击替补 | 首发与替补互换 |
| 选中替补 → 点击首发 | 替补上场替换首发 |
| 选中替补 → 点击另一替补 | 两个替补交换顺序 |
| 点击取消按钮 | 取消当前选中状态 |

**评分计算逻辑**（与赛后统计模块共用）：

```typescript
// 基础10分制评分
const calcRating = (s) => {
  if (全为0) return 6.0  // 默认
  raw = 6.0 + goals * 1.0 + assists * 0.5 - yellowCards * 0.5 - redCards * 1.5
  return clamp(raw, 1, 10)
}

// 转为百分制（用于球员卡片显示）
const toPercentRating = (rating10) => Math.round(rating10 * 3.75 + 62.5)
```

**评分颜色**：
- ≥ 85 → 绿色 `#4caf50`
- ≥ 75 → 蓝色 `#2196f3`
- < 75 → 红色 `#f44336`

**保存逻辑** (`handleSave`)：
1. `api.updateMatch(id, { formation })` → 更新比赛阵型
2. 重组球员列表（首发带 `position_index` + `is_starter: true`，替补 `position_index: null` + `is_starter: false`）
3. `api.importPlayers(matchId, players)` → 覆盖球员位置信息

---

### 5.5 赛后数据统计模块

#### 功能说明
- 录入比赛比分（主队/客队）
- 为每位首发球员录入：进球、助攻、黄牌、红牌
- 自动计算评分和 MVP

#### 代码实现

**文件**：`src/pages/stats/index.tsx`

**数据接口**：

```typescript
interface PlayerStat {
  playerId: number
  playerName: string
  goals: number       // 进球
  assists: number     // 助攻
  yellowCards: number  // 黄牌
  redCards: number     // 红牌
  rating: number       // 自动评分
  isMVP: boolean       // 是否MVP
}
```

**评分公式**：
```
rating = 6.0 + goals × 1.0 + assists × 0.5 - yellowCards × 0.5 - redCards × 1.5
范围限制：[1.0, 10.0]
```

**MVP 自动判定**：评分最高且至少有一项进球或助攻数据的球员自动标记为 MVP。

**保存逻辑** (`handleSave`)：
- `api.batchSaveStats(matchId, { stats, home_score, away_score, formation })` → POST 到后端

---

### 5.6 排行榜模块

#### 功能说明
- 三个 Tab 切换：射手榜、助攻榜、综合数据
- 前三名显示奖牌 🥇🥈🥉 和领奖台卡片
- 排行列表显示：球员名、位置、数值、场次、场均

#### 代码实现

**文件**：`src/pages/leaderboard/index.tsx`

| Tab | 排序字段 | 显示列 |
|-----|---------|--------|
| ⚽ 射手榜 | `total_goals` 降序 | 球员、位置、进球、场次、场均进球 |
| 🤝 助攻榜 | `total_assists` 降序 | 球员、位置、助攻、场次、场均助攻 |
| ⭐ 综合数据 | 默认排序 | 球员、位置、进球、助攻、MVP次数、场次 |

**领奖台渲染**：仅取前 3 名且数值 > 0 的球员，渲染为卡片式领奖台。

---

## 六、API 接口层

### 6.1 请求封装

**文件**：`src/services/api.ts`

```typescript
const API_BASE = 'http://localhost:4000/api'  // 后端地址

const request = async (url, options?) => {
  const res = await Taro.request({
    url: `${API_BASE}${url}`,
    header: { 'Content-Type': 'application/json' },
    ...options,
  })
  return res.data
}
```

### 6.2 API 接口清单

| 模块 | 方法 | HTTP | 路径 | 说明 |
|------|------|------|------|------|
| **认证** | `login(username, password)` | POST | `/api/auth/login` | 用户名密码登录 |
| **比赛** | `getMatches(date?)` | GET | `/api/matches` 或 `/api/matches?date=` | 获取比赛列表 |
| | `getMatch(id)` | GET | `/api/matches/:id` | 获取单场比赛详情（含球员、统计数据） |
| | `createMatch(data)` | POST | `/api/matches` | 创建比赛 |
| | `updateMatch(id, data)` | PUT | `/api/matches/:id` | 更新比赛信息（含阵型） |
| | `deleteMatch(id)` | DELETE | `/api/matches/:id` | 删除比赛 |
| **球员** | `getPlayers()` | GET | `/api/players` | 获取所有球员 |
| | `addPlayer(data)` | POST | `/api/players` | 添加球员 |
| | `deletePlayer(id)` | DELETE | `/api/players/:id` | 删除球员 |
| **批量操作** | `importPlayers(matchId, players)` | POST | `/api/matches/:matchId/import-players` | 批量导入球员到比赛 |
| | `batchSaveStats(matchId, data)` | POST | `/api/matches/:matchId/batch-stats` | 批量保存赛后统计 |
| **排行榜** | `getLeaderboard()` | GET | `/api/stats/leaderboard` | 获取排行榜汇总数据 |

---

## 七、数据库表结构（推断自 API）

> 注：本项目前端代码中未包含后端代码，以下表结构根据 API 请求参数和响应数据推断。后端地址默认为 `http://localhost:4000`。

### 7.1 用户表 (`users`)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER (PK) | 用户 ID |
| `username` | VARCHAR | 用户名（如 captain, manager, player1） |
| `password` | VARCHAR | 密码（默认 123456） |
| `displayName` | VARCHAR | 显示名称 |
| `role` | ENUM('captain','manager','player') | 角色 |

### 7.2 比赛表 (`matches`)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER (PK) | 比赛 ID |
| `match_date` | DATE | 比赛日期 |
| `match_time` | TIME | 比赛时间（可选） |
| `location` | VARCHAR | 比赛地点（可选） |
| `format` | ENUM('5v5','7v7','11v11') | 赛制 |
| `formation` | VARCHAR | 阵型（如 '4-4-2'） |
| `status` | ENUM('upcoming','ongoing','completed') | 比赛状态 |
| `home_score` | INTEGER | 主队得分 |
| `away_score` | INTEGER | 客队得分 |
| `registered_count` | INTEGER | 报名人数（可为计算字段） |

### 7.3 球员表 (`players`)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER (PK) | 球员 ID |
| `name` | VARCHAR | 球员姓名 |
| `preferred_position` | VARCHAR | 偏好位置（GK/DF/MF/FW 等） |
| `rating` | INTEGER | 基础评分（默认 75） |

### 7.4 比赛-球员注册表 (`match_registrations`)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER (PK) | 注册记录 ID |
| `match_id` | INTEGER (FK → matches.id) | 关联比赛 |
| `player_id` | INTEGER (FK → players.id) | 关联球员 |
| `player_name` | VARCHAR | 球员名称（冗余字段，方便查询） |
| `position_index` | INTEGER (NULLABLE) | 首发位置索引（0 起始），NULL 表示替补 |
| `is_starter` | BOOLEAN | 是否首发 |
| `preferred_position` | VARCHAR | 该比赛中的位置 |
| `rating` | INTEGER | 该比赛对应评分 |

### 7.5 球员统计表 (`match_stats`)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER (PK) | 统计记录 ID |
| `match_id` | INTEGER (FK → matches.id) | 关联比赛 |
| `player_id` | INTEGER (FK → players.id) | 关联球员 |
| `goals` | INTEGER | 进球数 |
| `assists` | INTEGER | 助攻数 |
| `yellow_cards` | INTEGER | 黄牌数 |
| `red_cards` | INTEGER | 红牌数 |
| `is_mvp` | BOOLEAN | 是否MVP |

### 7.6 排行榜视图/汇总 (`leaderboard`)

排行榜数据通常由后端聚合查询生成，返回如下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER | 球员 ID |
| `name` | VARCHAR | 球员姓名 |
| `preferred_position` | VARCHAR | 偏好位置 |
| `total_goals` | INTEGER | 累计进球 |
| `total_assists` | INTEGER | 累计助攻 |
| `mvp_count` | INTEGER | MVP 次数 |
| `matches_played` | INTEGER | 参赛场次 |

---

## 八、数据表映射关系

```
┌──────────┐        ┌────────────────────┐        ┌──────────┐
│  users   │        │ match_registrations │        │ players  │
│──────────│        │────────────────────│        │──────────│
│ id (PK)  │        │ id (PK)            │        │ id (PK)  │
│ username │        │ match_id (FK) ─────┼───┐    │ name     │
│ password │        │ player_id (FK) ────┼───┼──> │ position │
│ display  │        │ position_index     │   │    │ rating   │
│ role     │        │ is_starter         │   │    └──────────┘
└──────────┘        │ rating             │   │
                    └────────────────────┘   │
                                             │
┌──────────┐        ┌──────────────┐         │
│ matches  │<───────│ match_stats  │         │
│──────────│        │──────────────│         │
│ id (PK)  │<───────│ match_id(FK) │         │
│ date     │        │ player_id(FK)│─────────┘
│ time     │        │ goals        │
│ location │        │ assists      │
│ format   │        │ yellow_cards │
│ formation│        │ red_cards    │
│ status   │        │ is_mvp       │
│ h_score  │        └──────────────┘
│ a_score  │
└──────────┘
```

**核心关系**：
- **matches ↔ match_registrations**：一对多，一场比赛有多个球员注册
- **players ↔ match_registrations**：一对多，一个球员参加多场比赛
- **matches ↔ match_stats**：一对多，一场比赛有多条统计数据
- **players ↔ match_stats**：一对多，一个球员有多条比赛统计

---

## 九、阵型数据系统

### 9.1 阵型定义

**文件**：`src/data/formations.ts`

每个阵型包含位置坐标数组，坐标为球场百分比位置 `(x%, y%)`：

| 赛制 | 可选阵型 | 位置数 |
|------|---------|--------|
| 5v5 | `2-2`, `1-2-1`, `2-1-1`, `3-1` | 5 |
| 7v7 | `2-3-1`, `3-2-1`, `3-3` | 7 |
| 11v11 | `4-4-2`, `4-3-3`, `3-5-2`, `4-2-3-1` | 11 |

### 9.2 Position 接口

```typescript
interface Position {
  x: number;    // 球场水平位置百分比（0=最左, 100=最右）
  y: number;    // 球场垂直位置百分比（0=最上/攻击端, 100=最下/防守端）
  label: string;// 位置标签（GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, ST等）
}
```

---

## 十、构建与运行

### 10.1 开发命令

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化，编译为微信小程序）
npm run dev:weapp

# 生产构建
npm run build:weapp
```

### 10.2 运行要求

1. **后端服务**：需在 `http://localhost:4000` 启动对应的 REST API 后端服务
2. **微信开发者工具**：编译产物在 `dist/` 目录，需用微信开发者工具打开

---

## 十一、权限控制矩阵

| 功能 | 队长 (captain) | 领队 (manager) | 队员 (player) |
|------|:-:|:-:|:-:|
| 查看比赛列表 | ✅ | ✅ | ✅ |
| 创建/删除比赛 | ✅ | ✅ | ❌ |
| 导入报名数据 | ✅ | ✅ | ❌ |
| 修改阵型/人员位置 | ✅ | ✅ | ❌ |
| 查看阵容 | ✅ | ✅ | ✅ |
| 录入赛后数据 | ✅ | ✅ | ❌ |
| 查看排行榜 | ✅ | ✅ | ✅ |
| 翻转球员卡片 | ✅ | ✅ | ✅ |
  