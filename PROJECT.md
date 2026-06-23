# 项目：Cybercarrot 2D AI Platform

纯前端网页工具（Vue 3 + Vite），通过 OpenAI 兼容的 image API 调用图像生成模型，为游戏开发产出两类素材：

1. **基础图像生成**：单张游戏美术素材
2. **Sprite Sheet 生成器**：将用户描述包装为 sprite sheet prompt，生成游戏精灵图序列帧（横版视角 / 俯视 8 方向）

## 技术栈

- **框架**：Vue 3（Composition API + `<script setup>`）
- **构建工具**：Vite 5
- **样式**：纯 CSS（无 UI 库，CSS 变量管理主题）
- **运行**：`pnpm dev` 启动开发服务器，`pnpm build` 输出静态文件
- **API**：OpenAI 兼容 image API，无后端，所有逻辑在浏览器端完成

## 默认配置

| 项 | 默认值 |
|----|--------|
| API 端点 | `https://www.packyapi.com` |
| 默认模型 | `gpt-image-2` |
| localStorage key | `sprite-sheet-config` |

API 调用规则（见 `src/utils/api.js`）：

- **无参考图** → `POST {endpoint}/v1/images/generations`（JSON body：`{ model, prompt, n, size }`）
- **有参考图** → `POST {endpoint}/v1/images/edits`（multipart/form-data：`model, prompt, image, n, size`），实现图生图

响应解析优先取 `data[0].b64_json`，其次 `data[0].url`，转为 blob URL 展示。

## 项目结构

```
/
├── index.html                       # Vite 入口 HTML
├── package.json                     # 依赖声明（仅 vue）
├── vite.config.js                   # Vite 配置（vue 插件）
├── PROJECT.md                       # 本文件
├── AGENTS.md / CLAUDE.md            # 入口指引（指向 PROJECT.md）
└── src/
    ├── main.js                      # Vue 应用入口
    ├── App.vue                      # 根组件：顶部栏 + 左侧控制台 + 主视图区
    ├── components/
    │   ├── ApiConfig.vue            # API 配置面板（localStorage 持久化 + emit 同步）
    │   ├── Console.vue              # 左侧导航控制台（可折叠，状态持久化）
    │   ├── ImageDropZone.vue        # 通用图片上传区（拖拽/点击，v-model 同步 File）
    │   ├── Generator.vue            # Sprite Sheet 生成面板（横版 / 俯视 8 方向）
    │   └── ImageGenerator.vue       # 基础图像生成面板
    ├── composables/
    │   └── useImageGeneration.js    # 图像生成可复用逻辑（state + 生成/下载/清理）
    └── utils/
        ├── api.js                   # OpenAI image API 调用（generations / edits）
        └── prompt.js                # sprite sheet prompt 组装（横版 / 俯视）
```

## 架构与数据流

```
localStorage ──→ ApiConfig ──emit('update')──→ App(apiConfigState ref)
                                                   │
                                                   ↓ props.apiConfig
用户输入 ──→ Generator / ImageGenerator
              │
              ├─ useImageGeneration(getConfig, buildPrompt)
              │     ├─ getConfig = () => props.apiConfig  （实时读取，避免响应式断链）
              │     ├─ buildPrompt：Generator 按视角分发，ImageGenerator 原样透传
              │     └─ generateImage(config, prompt, refImage, size)
              │           ├─ 无参考图 → /v1/images/generations
              │           └─ 有参考图 → /v1/images/edits
              │
              └─ resultUrl（blob URL）──→ <img> 展示 + 下载按钮
```

### 关键设计

- **配置响应式**：ApiConfig 通过 `emit('update', config)` 向上同步，App 用 `ref` 持有并作为 prop 下发。`useImageGeneration` 的 `getConfig` 是函数，在 `generate()` 执行时实时读取 `props.apiConfig`，从机制上避免旧版通过 `defineExpose` 跨组件 pull 导致的响应式断链。
- **逻辑复用**：两个生成面板共享 `useImageGeneration` composable（参考图、生成、下载、blob URL 生命周期）与 `ImageDropZone` 组件，各自只保留独有 UI（视角切换 / 网格设置）与 prompt 组装。
- **blob URL 生命周期**：参考图预览与生成结果均为 blob URL，在替换与组件卸载时 `revokeObjectURL`，避免内存泄漏。

## 规则

### 开发流程

1. 先确定需求文档（`<name>.req.md`）
2. 再撰写开发文档（`<name>.dev.md`）
3. 最后根据开发文档写代码

每个步骤在写入或实施前，都必须先确认用户同意。验收代码后，删除开发文档和需求文档。

### 文档规范

- 需求文档：描述 feature 的实现路径、技术栈、输入输出规范、副作用、与整体的关系
- 开发文档：细化到模块/文件、具体函数及输入输出、修改位置和目的、添加位置和功能细节

### 代码规则

- 每个模块、类、函数都要写必要注释，至少能看出该模块/类/函数在做什么
- 代码实现必须严格按照开发文档描述；如需修改，先更新开发文档再改代码
- 开发完成后检查文档中是否有代码不能直接体现的内容（潜规则、副作用），若有则添加到相关代码旁注释

### 测试方案

1. 先撰写测试相关开发文档，确认用户同意后再编写测试代码
2. 测试至少包含：单元测试、模块层次 smoke 测试、全量 smoke 测试
