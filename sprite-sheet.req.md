# 需求文档：Sprite Sheet 生成器

## 概述

一个纯前端网页工具，通过 OpenAI 兼容 API 调用图像生成模型，将用户输入的角色描述包装为专业的 sprite sheet 生成 prompt，产出游戏可用的精灵图（sprite sheet）。

## 技术栈

- **框架**：Vue 3（Composition API + `<script setup>`）
- **构建工具**：Vite
- **样式**：纯 CSS（无需 UI 库）
- **运行**：`npm run dev` 启动开发服务器，`npm run build` 输出静态文件
- **API**：直接调用 OpenAI 兼容的图片生成 API（`/v1/images/generations`），无后端

## 项目结构

```
/
├── index.html              # Vite 入口 HTML
├── src/
│   ├── App.vue             # 根组件，布局骨架
│   ├── components/
│   │   ├── ApiConfig.vue   # API 配置面板
│   │   └── Generator.vue   # Sprite Sheet 生成面板（输入 + 输出）
│   ├── utils/
│   │   └── prompt.js       # prompt 包装函数
│   └── main.js             # Vue 应用入口，挂载 App
├── package.json
└── vite.config.js
```

## 功能模块

### 1. API 配置面板

用户填写并保存 API 连接信息：

- **API 端点**（Endpoint）：文本输入框，默认 `https://api.openai.com`
- **API 密钥**（API Key）：密码输入框
- **模型名称**（Model）：文本输入框，默认 `dall-e-3`
- **保存 / 加载**：配置存到 `localStorage`，页面刷新后自动回填

### 2. Sprite Sheet 生成面板

#### 2.1 输入区

- **角色描述**（必填）：文本输入框，用户用自然语言描述要生成的角色/对象（如"一个穿铁甲的骑士，持剑和盾"）
- **参考概念图**（可选）：图片上传区域，支持拖拽或点击上传，预览已上传的图片。用于给 AI 提供风格参考。
- **网格设置**：由 GUI 直接指定
  - **列数**（Columns）：数字输入，默认 4
  - **行数**（Rows）：数字输入，默认 4
- **生成按钮**：点击后组装 prompt 并调用 API

#### 2.2 Prompt 包装逻辑

系统将用户输入自动包装为专业的 sprite sheet prompt：

> 模板示例：
> "Generate a sprite sheet of [角色描述]. The sprite sheet should be arranged in a grid of [列数] columns and [行数] rows. Each frame shows a different animation pose (idle, walk cycle, attack, etc.). Uniform lighting, clean pixel-art or game-asset style, transparent or solid-color background, consistent character scale across all frames. Sprite sheet layout: evenly spaced grid."

- 如果用户上传了参考概念图，将图片以 base64 形式附加到 API 请求中（如 API 支持 image-to-image），或将其描述信息融入 prompt
- 网格参数直接填入 prompt 的列数和行数

#### 2.3 输出区

- **生成的 sprite sheet 图片展示**：在页面上以大图展示
- **下载按钮**：点击下载 PNG 图片
- **生成状态提示**：加载中动画、成功提示、错误提示

### 3. 错误处理

- API 密钥未填写时提示用户
- API 调用失败时展示错误信息
- 网络超时处理
- 图片生成失败时的友好提示

## 输入输出规范

| 项目 | 说明 |
|------|------|
| 输入 | 角色描述（文本）、参考概念图（可选，图片文件）、网格行列数（数字） |
| 输出 | 一张 sprite sheet 图片（PNG），可通过按钮下载 |
| 副作用 | API 配置写入 localStorage |

## 与整体的关系

- 本项目仅此一个功能模块，无其他子系统
- 纯前端，无后端依赖
- 所有逻辑在浏览器端完成
