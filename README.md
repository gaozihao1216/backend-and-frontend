# UGC Level Platform MVP

## Project Overview

This project is a minimal fullstack UGC level platform built with TypeScript. It supports three roles in a simple level review flow:

- Designer creates a level and submits it for review
- Admin reviews pending submissions and approves or rejects them
- Player browses published levels and rates them

The current implementation focuses on a minimal runnable MVP. It does not include chat, currency systems, or a complex visual level editor.

## Core Features

- Designer can create a level with title, description, and JSON level data
- Designer can submit a created level for admin review
- Admin can view pending submissions
- Admin can approve or reject a submission with an optional review note
- Player can view published levels
- Player can submit a rating from 1 to 5 for a published level

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Validation and shared contracts: Zod
- Data storage: in-memory store for MVP demo

## Local Development

Install dependencies:

```bash
npm install
```

Run the backend:

```bash
npm run dev
```

Run the frontend in another terminal:

```bash
npm run dev:frontend
```

Open the frontend at:

```text
http://localhost:5173
```

The backend runs at:

```text
http://localhost:3000
```

Type check:

```bash
npm run check
```

Production build:

```bash
npm run build
```

## Type-Safe Design Summary

This project uses a shared-schema approach to keep the frontend and backend consistent.

- Zod schemas in `src/shared` define the request and response contracts
- TypeScript types are inferred from those schemas instead of being rewritten manually
- The frontend validates request data before sending it
- The backend validates request headers, params, and bodies before calling service logic
- The backend validates response payloads before returning them
- The frontend parses API responses again before rendering data

This design provides two layers of safety:

- Compile-time safety: shared TypeScript types reduce mismatches between frontend and backend
- Runtime safety: Zod validation rejects invalid data even if input comes from outside the type system

In the current MVP, this is visible in all three main flows:

- level creation uses shared schemas for title, description, and level data
- submission review uses shared schemas for review status and optional review note
- player rating uses a shared schema that restricts scores to integers from 1 to 5

## 登录/注册与角色说明

当前前端提供了一个适合课程演示的 mock auth 流程，用于在页面中切换和体验不同角色。该流程不接数据库，也不接真实认证系统，账号信息保存在浏览器本地存储中，仅用于本地演示。

- 玩家注册需要填写昵称和密码
- 设计师注册需要填写昵称、密码和固定验证码 `66260696`
- 管理员注册需要填写昵称、密码和固定验证码 `66260696`

当前系统中的角色分工如下：

- 玩家：浏览已发布关卡、参与评分，并在社区页面中发表评论
- 设计师：创建关卡并提交审核
- 管理员：审核设计师提交的关卡，以及处理社区中的评论内容

需要说明的是，后端当前仍然使用内置演示账号来完成核心 API 流程：

- 玩家：`player-1`
- 设计师：`designer-1`
- 管理员：`admin-1`

因此，前端本地注册账号的主要作用是完成界面演示与角色切换；只有绑定了现有后端演示账号的内置用户，才能直接调用当前后端中的对应角色接口。

## 地图页面视觉改造说明

为提升课程展示效果，项目对首页中的地图页面做了一轮纯前端视觉改造。在不改变后端接口、不调整业务数据结构、不修改核心交互逻辑的前提下，将原先偏灰绿、偏压暗的地图舞台，调整为更明亮、更轻松、更接近休闲手游的卡通冒险风格。

本次视觉改造主要包括以下几个方面：

- 背景：将地图背景改为浅蓝天空、浅黄高光、浅绿色地形的组合，并加入云雾、浮岛和远景层次，使页面整体更明亮、更有漂浮感
- 路径：将原先偏“锁链感”的节点连接效果，调整为更接近木桥或木板路的冒险路径表现
- 节点：将关卡节点改为更有手游关卡徽章感的暖色圆形节点，主色调更偏金色、橙色和木色
- 锁定态：保留未解锁关卡的锁图标提示，但弱化了原先大面积灰色遮罩，使未解锁状态仍能明显区分，同时避免视觉过于沉闷

这部分改动仅涉及前端页面表现与样式文件，不改变后端的关卡创建、提交审核、管理员审核、玩家查看 published 关卡和评分等业务逻辑。

Because the same schemas are reused across both sides of the application, the system keeps a single source of truth for API contracts and reduces integration errors.

## 演示步骤

本节适合直接用于课程作业展示。建议先启动前后端，再按照“设计师提交 -> 管理员审核 -> 玩家浏览与评分”的顺序进行演示。

启动完成后：

- 前端地址：`http://localhost:5173`
- 后端地址：`http://localhost:3000`

### 演示准备

1. 进入页面：浏览器打开 `http://localhost:5173`
   操作：进入系统首页
   预期结果：页面顶部显示项目标题，页面中可切换 `Designer`、`Admin`、`Player` 三个角色视图

### 1. 设计师提交关卡

1. 进入页面：`Designer` 页面
   操作：点击角色切换区域中的 `Designer`
   预期结果：页面显示关卡创建表单，包含 `Title`、`Description`、`Level Data JSON` 三个输入区域

2. 进入页面：`Designer` 页面
   操作：填写或修改关卡标题、描述，并保留默认的 JSON 关卡数据
   预期结果：输入框内容可正常编辑，`Level Data JSON` 文本框中能看到完整的关卡数据

3. 进入页面：`Designer` 页面
   操作：点击 `Create Level`
   预期结果：页面出现成功提示，如 `Created level ...`；下方 `Created In This Session` 列表新增一条关卡记录，状态显示为 `draft`

4. 进入页面：`Designer` 页面
   操作：在刚创建的关卡卡片上点击 `Submit For Review`
   预期结果：页面出现成功提示，如 `Submitted ... for review`；该关卡按钮变为 `Submitted`，表示已提交审核

### 2. 管理员审核关卡

1. 进入页面：`Admin` 页面
   操作：点击角色切换区域中的 `Admin`
   预期结果：页面显示管理员审核面板，顶部有 `Refresh Pending` 按钮

2. 进入页面：`Admin` 页面
   操作：点击 `Refresh Pending`
   预期结果：待审核列表中出现刚才由设计师提交的 submission，卡片中可看到 `Level ID` 和 `Submitter ID`

3. 进入页面：`Admin` 页面
   操作：在 `Review Note` 文本框中输入审核意见，例如“内容完整，可以发布”
   预期结果：文本框保留输入内容，可作为审核备注一并提交

4. 进入页面：`Admin` 页面
   操作：点击 `Approve`
   预期结果：该 submission 从待审核列表中消失；说明该关卡已通过审核并进入可发布状态

5. 进入页面：`Admin` 页面
   操作：如需补充说明，可口头指出若点击 `Reject` 则会驳回该 submission
   预期结果：被驳回的关卡不会出现在玩家可浏览列表中

### 3. 玩家浏览并评分

1. 进入页面：`Player` 页面
   操作：点击角色切换区域中的 `Player`
   预期结果：页面显示玩家面板，顶部有 `Refresh Published Levels` 按钮，下面是已发布关卡列表

2. 进入页面：`Player` 页面
   操作：点击 `Refresh Published Levels`
   预期结果：刚刚审核通过的关卡出现在列表中；卡片中能看到关卡标题、描述、`Level ID`，以及评分摘要，例如 `0.0 / 5 (0)`

3. 进入页面：`Player` 页面
   操作：在 `Score` 下拉框中选择一个分数，例如 `5`
   预期结果：下拉框显示所选分值，表示当前准备提交该评分

4. 进入页面：`Player` 页面
   操作：点击 `Submit Rating`
   预期结果：页面出现成功提示，如 `Rated ... with 5 stars`

5. 进入页面：`Player` 页面
   操作：再次点击 `Refresh Published Levels`
   预期结果：该关卡仍然保留在列表中，且评分摘要已更新，例如显示新的平均分和评分人数，如 `5.0 / 5 (1)`

### 建议展示顺序

1. 在 `Designer` 页面创建一个新关卡
2. 提交该关卡进入审核流程
3. 切换到 `Admin` 页面并批准该关卡
4. 切换到 `Player` 页面刷新已发布关卡列表
5. 对该关卡进行评分，并再次刷新以展示评分结果更新

## 最小接口示例

下面给出一组基于当前后端实现的最小请求与响应示例，适合直接放入 README 展示系统的核心 API 流程。

### 通用说明

- 后端基础地址：`http://localhost:3000`
- 所有接口都需要通过请求头 `x-user-id` 标识当前用户
- 当前内置测试用户：
  - 设计师：`designer-1`
  - 管理员：`admin-1`
  - 玩家：`player-1`
- 成功响应统一包装为：

```json
{
  "success": true,
  "data": {}
}
```

### 1. 设计师提交关卡

设计师提交关卡在当前后端中分为两个接口：先创建关卡，再发起提交审核。

#### 1.1 创建设计师关卡

路径：

```text
POST /designer/levels
```

请求示例：

```http
POST /designer/levels HTTP/1.1
Host: localhost:3000
Content-Type: application/json
x-user-id: designer-1

{
  "title": "Starter Level",
  "description": "A simple demo level",
  "data": {
    "world": {
      "width": 1200,
      "height": 800,
      "gravity": 9.8
    },
    "birdInventory": {
      "basic": 3
    },
    "obstacles": [
      {
        "id": "obstacle-1",
        "material": "wood",
        "position": { "x": 500, "y": 300 },
        "size": { "width": 80, "height": 160 }
      }
    ],
    "enemies": [
      {
        "id": "enemy-1",
        "type": "pig",
        "position": { "x": 540, "y": 260 }
      }
    ]
  }
}
```

响应示例：

```json
{
  "success": true,
  "data": {
    "id": "level-1",
    "title": "Starter Level",
    "description": "A simple demo level",
    "data": {
      "world": {
        "width": 1200,
        "height": 800,
        "gravity": 9.8
      },
      "birdInventory": {
        "basic": 3
      },
      "obstacles": [
        {
          "id": "obstacle-1",
          "material": "wood",
          "position": { "x": 500, "y": 300 },
          "size": { "width": 80, "height": 160 }
        }
      ],
      "enemies": [
        {
          "id": "enemy-1",
          "type": "pig",
          "position": { "x": 540, "y": 260 }
        }
      ]
    },
    "authorId": "designer-1",
    "status": "draft",
    "averageRating": 0,
    "ratingCount": 0,
    "createdAt": "2026-03-30T12:00:00.000Z",
    "updatedAt": "2026-03-30T12:00:00.000Z"
  }
}
```

对应的类型安全说明：

- 请求体由共享 Zod schema `CreateLevelInputSchema` 校验，要求 `title`、`description`、`data` 结构完整且字段类型正确
- 响应体中的 `data` 会再次通过 `LevelSchema` 校验，保证前后端看到的是同一份 `Level` 类型
- 前端与后端都从同一套 schema 推导 TypeScript 类型，避免手写接口定义不一致

#### 1.2 提交关卡进入审核

路径：

```text
POST /designer/submissions
```

请求示例：

```http
POST /designer/submissions HTTP/1.1
Host: localhost:3000
Content-Type: application/json
x-user-id: designer-1

{
  "levelId": "level-1"
}
```

响应示例：

```json
{
  "success": true,
  "data": {
    "id": "submission-1",
    "levelId": "level-1",
    "submitterId": "designer-1",
    "status": "pending",
    "submittedAt": "2026-03-30T12:01:00.000Z"
  }
}
```

对应的类型安全说明：

- 请求体通过 `SubmitLevelInputSchema` 校验，只允许提交合法的 `levelId`
- 后端会先校验该关卡是否属于当前设计师，再创建 submission，避免越权提交他人关卡
- 返回值通过 `SubmissionSchema` 校验，确保 `status`、时间字段和 ID 字段满足统一约束

### 2. 管理员审核

路径：

```text
POST /admin/submissions/:submissionId/review
```

请求示例：

```http
POST /admin/submissions/submission-1/review HTTP/1.1
Host: localhost:3000
Content-Type: application/json
x-user-id: admin-1

{
  "status": "approved",
  "reviewNote": "Looks good for publishing"
}
```

响应示例：

```json
{
  "success": true,
  "data": {
    "id": "submission-1",
    "levelId": "level-1",
    "submitterId": "designer-1",
    "status": "approved",
    "reviewerId": "admin-1",
    "reviewNote": "Looks good for publishing",
    "submittedAt": "2026-03-30T12:01:00.000Z",
    "reviewedAt": "2026-03-30T12:02:00.000Z"
  }
}
```

对应的类型安全说明：

- 路径参数通过 `SubmissionIdParamsSchema` 校验，保证 `submissionId` 存在且类型正确
- 请求体通过 `ReviewSubmissionInputSchema` 校验，`status` 只能是 `approved` 或 `rejected`
- 审核结果响应通过 `SubmissionSchema` 校验，确保审核人、审核备注和审核时间字段结构稳定

### 3. 玩家评分

路径：

```text
POST /player/levels/:levelId/ratings
```

请求示例：

```http
POST /player/levels/level-1/ratings HTTP/1.1
Host: localhost:3000
Content-Type: application/json
x-user-id: player-1

{
  "score": 5
}
```

响应示例：

```json
{
  "success": true,
  "data": {
    "id": "rating-1",
    "levelId": "level-1",
    "playerId": "player-1",
    "score": 5,
    "createdAt": "2026-03-30T12:03:00.000Z",
    "updatedAt": "2026-03-30T12:03:00.000Z"
  }
}
```

对应的类型安全说明：

- 路径参数通过 `LevelIdParamsSchema` 校验，请求体通过 `CreateRatingInputSchema` 校验
- `score` 受 `RatingValueSchema` 限制，只能是 `1` 到 `5` 的整数
- 响应数据通过 `RatingSchema` 校验，保证评分对象结构与前端读取逻辑一致

### 补充说明

- 若管理员已审核通过某个关卡，玩家可再调用 `GET /player/levels` 查看已发布关卡及其评分汇总信息
- 当前项目采用共享 schema 模式，核心接口的请求体、路径参数、响应体都由 `src/shared` 中的 Zod schema 统一定义
- 这种做法同时提供了编译期类型安全和运行时数据校验，能减少前后端接口不一致的问题
