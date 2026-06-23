# 开发文档：Sprite Sheet 生成器

## 涉及模块

全部新建，共 5 个源代码文件 + 2 个配置文件：

| 文件 | 职责 |
|------|------|
| `index.html` | Vite 入口，挂载 `#app` |
| `src/main.js` | 创建 Vue 应用，挂载根组件 |
| `src/App.vue` | 根组件：两栏布局（左侧配置、右侧生成），管理全局状态 |
| `src/components/ApiConfig.vue` | API 配置表单，读写 localStorage |
| `src/components/Generator.vue` | 生成面板：输入区 + 输出区，调用 API 并展示结果 |
| `src/utils/prompt.js` | prompt 包装函数，纯函数 |
| `package.json` | 依赖声明（仅 vue） |
| `vite.config.js` | Vite 配置（vue 插件） |

## 实现步骤

### 步骤 1：项目初始化（package.json + vite.config.js + index.html + main.js）

#### `package.json`

```json
{
  "name": "sprite-sheet-generate",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5",
    "vite": "^5"
  }
}
```

#### `vite.config.js`

标准配置，仅注册 `@vitejs/plugin-vue`。

#### `index.html`

标准 Vite 入口 HTML，`<div id="app">` + `<script type="module" src="/src/main.js">`。

#### `src/main.js`

```js
import { createApp } from 'vue'
import App from './App.vue'
createApp(App).mount('#app')
```

---

### 步骤 2：工具函数 `src/utils/prompt.js`

#### `buildPrompt(description, columns, rows)`

- **输入**：`description: string`（角色描述），`columns: number`，`rows: number`
- **输出**：`string`（拼装好的 prompt）
- **逻辑**：
  ```
  "Generate a pixel-art sprite sheet of [description].
  The sprite sheet is arranged in a grid of [columns] columns and [rows] rows.
  Each frame shows a different animation pose（idle, walk, attack, hurt, death...）.
  Top-down or side-view game asset style, consistent scale, clean outlines,
  transparent or solid background, evenly spaced grid, no overlapping."
  ```
- **副作用**：无

---

### 步骤 3：API 配置面板 `src/components/ApiConfig.vue`

#### 模板结构

一个折叠/展开的面板，包含：

- API 端点输入框（`v-model="endpoint"`），默认 `https://api.openai.com`
- API 密钥输入框（`type="password"`，`v-model="apiKey"`）
- 模型名称输入框（`v-model="model"`），默认 `dall-e-3`
- 保存按钮

#### 逻辑

- **`data` / `ref`**：`endpoint`、`apiKey`、`model`
- **`onMounted`**：从 `localStorage` 读取配置回填（key: `"sprite-sheet-config"`）
- **`saveConfig()`**：将当前值写入 `localStorage`
- **`defineExpose`**：暴露 `endpoint`、`apiKey`、`model` 供父组件读取（生成时传给 API）
- **验证**：提供 `isValid` computed，检查 `apiKey` 非空

**副作用**：读写 `localStorage`（key: `"sprite-sheet-config"`）

---

### 步骤 4：生成面板 `src/components/Generator.vue`

#### 4.1 输入区模板

- **角色描述**：`<textarea>`，`v-model="description"`，必填
- **参考概念图**：图片上传区域
  - 拖拽区域 `<div>`，监听 `dragover` / `drop` 事件
  - 内含 `<input type="file" accept="image/*">`，支持点击选择
  - 选中后预览缩略图，用 `URL.createObjectURL` 生成临时 URL
  - 数据存为 `refImage: File | null`
- **网格设置**：
  - 列数 `<input type="number" min="1" max="8">`，`v-model.number="columns"`，默认 4
  - 行数 `<input type="number" min="1" max="8">`，`v-model.number="rows"`，默认 4
- **生成按钮**：`<button @click="generate">生成</button>`

#### 4.2 输出区模板

- 条件渲染 `v-if="resultUrl"`
- 展示图片 `<img :src="resultUrl">`
- 下载按钮 `<a :href="resultUrl" download="sprite-sheet.png">下载</a>`
- 加载状态：`v-if="loading"` 展示 loading 文字/动画
- 错误信息：`v-if="error"` 展示错误文本

#### 4.3 逻辑

**Props**：

| Prop | 类型 | 说明 |
|------|------|------|
| `apiConfig` | `{ endpoint, apiKey, model }` | 来自 ApiConfig 的配置 |

**State（ref）**：

| 变量 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `description` | `string` | `""` | 角色描述 |
| `columns` | `number` | `4` | 网格列数 |
| `rows` | `number` | `4` | 网格行数 |
| `refImage` | `File \| null` | `null` | 参考概念图文件 |
| `refImagePreview` | `string \| null` | `null` | 参考图预览 URL |
| `resultUrl` | `string \| null` | `null` | 生成结果图片 URL |
| `loading` | `boolean` | `false` | 加载状态 |
| `error` | `string \| null` | `null` | 错误信息 |

**函数**：

##### `handleImageUpload(event)` / `handleDrop(event)`

- **输入**：文件事件或拖拽事件
- **逻辑**：提取第一个图片文件 → 存入 `refImage` → 用 `URL.createObjectURL` 生成预览 URL
- **副作用**：创建 blob URL（需在组件卸载时 `revokeObjectURL`）

##### `async generate()`

- **输入**：无（读取当前 state）
- **输出**：无（设置 `resultUrl` 或 `error`）
- **逻辑**：
  1. 校验 `apiConfig.apiKey` 非空 → 否则 `error = "请先配置 API 密钥"`
  2. 校验 `description` 非空 → 否则 `error = "请输入角色描述"`
  3. 设置 `loading = true`，`error = null`
  4. 调用 `buildPrompt(description, columns, rows)` 组装 prompt
  5. 构造请求体：
     ```json
     {
       "model": "<apiConfig.model>",
       "prompt": "<拼装好的 prompt>",
       "n": 1,
       "size": "1024x1024",
       "response_format": "b64_json"
     }
     ```
  6. 用 `fetch` 调用 `<apiConfig.endpoint>/v1/images/generations`，带 `Authorization: Bearer <apiConfig.apiKey>`
  7. 成功 → 从响应提取 base64 → 转为 blob URL 存入 `resultUrl`
  8. 失败 → 解析错误信息存入 `error`
  9. `finally` → `loading = false`

##### `downloadImage()`

- **逻辑**：创建一个临时的 `<a>` 元素，设置 `href` 为 `resultUrl`，`download` 为 `sprite-sheet.png`，触发点击
- **副作用**：触发浏览器下载

**副作用**：
- `handleImageUpload` / `handleDrop` 创建 blob URL（`onUnmounted` 时 revoke）
- `generate()` 发起网络请求
- `onUnmounted` 清理 `URL.revokeObjectURL`

---

### 步骤 5：根组件 `src/App.vue`

#### 模板

两栏布局：

```
┌──────────────┬──────────────────────┐
│  ApiConfig   │    Generator         │
│  (侧边栏)    │    (主区域)          │
│              │                      │
│  30% 宽度    │    70% 宽度          │
└──────────────┴──────────────────────┘
```

- 左侧：`<ApiConfig ref="apiConfigRef">`
- 右侧：`<Generator :apiConfig="apiConfigState">`

#### 逻辑

- **`apiConfigState`**：从 `ApiConfig` 组件通过 `ref` 获取暴露的值
- **响应式连接**：当 `ApiConfig` 中配置变更时，`Generator` 自动获取最新值（通过 `defineExpose` + `ref`）

**副作用**：无

---

### 步骤 6：样式

纯 CSS，不用 UI 库。

- 整体：深色背景（`#1a1a2e`），浅色文字，现代工具风格
- 配置面板：左侧卡片，输入框全宽，保存按钮醒目
- 生成面板：右侧卡片，上传区域有虚线边框 + hover 效果，网格输入用紧凑行内排列
- 输出区：图片居中、带阴影、最大宽度限制，下载按钮醒目
- 响应式：小屏幕（<768px）时上下堆叠
- 使用 CSS 变量管理颜色

---

## 数据流

```
localStorage ──→ ApiConfig ──→ apiConfig (defineExpose)
                                   │
                                   ↓
用户输入 ──→ Generator.generate()
              │
              ├── buildPrompt(description, columns, rows)
              │
              ├── fetch(apiConfig.endpoint + '/v1/images/generations', ...)
              │
              └── resultUrl ──→ <img> 展示 + 下载按钮
```

## 错误处理总览

| 场景 | 处理方式 |
|------|---------|
| API 密钥为空 | Generator 校验，提示 "请先配置 API 密钥" |
| 描述为空 | Generator 校验，提示 "请输入角色描述" |
| fetch 网络错误 | catch 后展示 "网络错误：xxx" |
| API 返回非 200 | 解析响应 body 中的 error 信息展示 |
| 图片生成超时 | fetch 无超时机制，依赖浏览器默认超时；可在 UI 提示 "生成可能需数十秒" |
| 图片格式异常 | 将 base64 解析失败视为错误 |
