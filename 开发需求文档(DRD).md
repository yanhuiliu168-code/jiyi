# 开发需求文档 (DRD) - 记忆卡片训练系统

## 1. 技术栈选型

### 1.1 前端应用 (memory-game & admin-panel)
- **框架**：React 18 (Vite 构建工具)
- **语言**：TypeScript
- **路由**：react-router-dom v6
- **状态管理**：Zustand (带 persist 中间件，实现本地存储和跨页面状态共享)
- **UI & 样式**：Tailwind CSS (原子化 CSS，响应式布局)
- **图标库**：Lucide React (轻量级 SVG 图标)

### 1.2 后端服务 (server)
- **框架**：Express (Node.js)
- **语言**：TypeScript (ts-node 运行/编译)
- **认证**：JSON Web Tokens (JWT) + bcryptjs 密码哈希
- **数据存储**：目前使用内存变量 (`let gameConfig = {}` / `let users = []`) 模拟，结合文件系统 (`fs`) 在本地读写 JSON 文件。
- **跨域处理**：Cors 中间件。

### 1.3 部署环境
- **平台**：Vercel
- **策略**：
  - 前端 SPA (Single Page Application) 配置 `vercel.json` 将所有路由重写至 `index.html`。
  - 后端配置为 Vercel Serverless Functions (`@vercel/node`)，导出 Express App 实例。

---

## 2. 核心业务逻辑与架构设计

### 2.1 状态管理架构 (Zustand - `useStore.ts`)
全局 Store 需要包含以下核心切片：
1. **用户系统**：
   - `user`: 当前登录用户的详细信息 (ID, Username, Token)。
   - 登入、登出动作。
2. **游戏配置同步**：
   - `serverConfig`: 从后端 `/api/config` 获取的全局配置（电量上限、关卡数据等）。
3. **进度与资产系统**：
   - `battery`: 当前电量（扣除、增加动作）。
   - `reviveItems`: 记忆沙漏数量（使用、增加动作）。
   - `game1Level`, `game2Level`, `game3Level`: 用户当前解锁的最高等级。
4. **历史记录系统**：
   - `game1Records`, `game2Records`, `game3Records`: 存储历史战绩。
   - 数据结构需包含 `userId`，以便在读取时进行过滤，实现数据隔离。格式：`{ userId: number, level: number, score: number, timeSpent: number, timestamp: number, difficulty: string }`

### 2.2 游戏循环机制 (React 组件)

#### 2.2.1 状态机设计
三个游戏组件均采用有限状态机（FSM）模式管理生命周期：
- `level-select`: 选择关卡/模式界面。
- `ready`: 显示最高记录、开始按钮界面。
- `flash` / `memorize`: 记忆阶段，展示目标卡片，启动倒计时。
- `select`: 答题阶段，展示包含干扰项的所有选项，监听用户点击。
- `animating`: 锁死点击状态，防止快速双击触发多次结算 BUG。
- `win` / `lose`: 结算弹窗界面。

#### 2.2.2 核心算法实现
- **Game1 & Game3 卡片生成**：
  使用 `Array.sort(() => 0.5 - Math.random())` 进行数组乱序。
  Game3 需动态生成对象，组合 `shapeIdx` 和 `colorIdx`。
- **Game2 连续记忆无尽流算法**：
  维护三个状态：
  1. `history`: 之前回合已经正确点击过的所有卡片。
  2. `currentNewCards`: 当前回合刚刷新的 N 张新目标。
  3. `pendingNewCards`: 用户本回合还未点击完毕的新目标。
  **结算逻辑**：
  当用户点击某卡片时：
  - 若在 `history` 中，判负。
  - 若在 `pendingNewCards` 中，将其移出。
  - 当 `pendingNewCards` 为空时，回合胜利，将 `currentNewCards` 并入 `history`，重新生成下一轮的新卡片并立即进入洗牌（不返回倒计时阶段）。

#### 2.2.3 异常处理与防抖
- **多次点击 Bug**：在检测到胜利/失败条件时，立即设置状态为 `animating`，屏蔽后续 `onClick` 事件。
- **定时器清理**：使用 `useRef` 保存 `setTimeout` / `setInterval` 的 ID，在组件卸载或状态切换时调用 `clearTimeout/clearInterval` 防止内存泄漏和状态错乱。

### 2.3 后端 API 设计 (RESTful)

#### `/api/auth/register` (POST)
- 接收 `username`, `email`, `password`。
- 校验重复性，使用 `bcryptjs` 加密密码。
- 颁发 JWT。

#### `/api/auth/login` (POST)
- 支持常规账号密码登录。
- 支持 `type: 'wechat'` 的模拟一键登录（返回虚拟账号并下发 Token）。

#### `/api/config` (GET / POST)
- GET: 返回完整的游戏配置 JSON。
- POST: 接收 Admin 面板的配置更新请求，写入内存（在 Serverless 环境下由于只读文件系统，捕获写文件异常并发出警告）。

### 2.4 家长控制台机制
- **儿童锁验证**：每次组件 `mount` (`useEffect`) 时重置验证状态。生成 1-5 之间的随机加法题，用户输入答案通过后渲染内容。
- **CD 冷却计算**：基于当前时间戳 `Date.now()` 和配置中的 `lastVideoWatchTime` 及冷却时长计算倒计时。

---

## 3. 环境与部署配置

### 3.1 环境变量
前端使用 `.env.production` 定义生产环境 API 地址：
```env
VITE_API_URL=https://jiyicard-xxxx.vercel.app
```

### 3.2 微信小程序适配
提供 `wechat-miniprogram` 文件夹，包含 `app.json`, `project.config.json` 等配置文件。
核心页面使用 `<web-view src="https://jiyicard-q.vercel.app"></web-view>` 嵌套 H5 页面。
需在微信开发者工具中勾选“不校验合法域名”。

## 4. 后续优化建议 (TODO)
1. **持久化存储**：将后端内存变量迁移至 Vercel KV, Supabase 或 MongoDB，解决 Serverless 环境下的数据易失问题。
2. **防作弊机制**：将核心随机算法（卡片生成、结果校验）上移至后端，防止前端抓包作弊。