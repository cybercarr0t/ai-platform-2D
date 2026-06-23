<template>
  <!-- 根组件：顶部栏 + 左侧控制台 + 主视图区 -->
  <div class="app-root">
    <!-- ====== 顶部栏 ====== -->
    <header class="topbar">
      <div class="topbar-left">
        <span class="topbar-logo">🎮</span>
        <h1 class="topbar-title">Cybercarrot 2D AI Platform</h1>
      </div>
      <div class="topbar-right">
        <ApiConfig ref="apiConfigRef" />
      </div>
    </header>

    <!-- ====== 主体区域 ====== -->
    <div class="app-body">
      <Console v-model="activeView" />

      <main class="main-view">
        <Generator
          v-if="activeView === 'sprite-sheet'"
          :key="'sprite-sheet'"
          :apiConfig="apiConfigState"
        />
        <ImageGenerator
          v-else-if="activeView === 'image-gen'"
          :key="'image-gen'"
          :apiConfig="apiConfigState"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ApiConfig from './components/ApiConfig.vue'
import Console from './components/Console.vue'
import Generator from './components/Generator.vue'
import ImageGenerator from './components/ImageGenerator.vue'

const activeView = ref('image-gen')
const apiConfigRef = ref(null)

const apiConfigState = computed(() => {
  const comp = apiConfigRef.value
  if (!comp) {
    return {
      endpoint: 'https://api.openai.com',
      apiKey: '',
      model: 'gemini-3.1-flash-image-preview',
      isValid: false,
    }
  }
  return {
    endpoint: comp.endpoint,
    apiKey: comp.apiKey,
    model: comp.model,
    isValid: comp.isValid,
  }
})
</script>

<style>
/* ---- CSS 变量 ---- */
:root {
  --bg-primary: #0a0e14;
  --bg-topbar: #11161d;
  --bg-console: #11161d;
  --bg-card: #161c24;
  --bg-input: #0d1117;
  --border: #21262d;
  --border-light: #30363d;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #484f58;
  --accent: #58a6ff;
  --accent-purple: #a78bfa;
  --accent-green: #3fb950;
  --danger: #f85149;
  --orange: #d2991d;
  --radius: 10px;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text',
    Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  letter-spacing: 0.01em;
}

/* ---- 根布局 ---- */
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ---- 顶部栏 ---- */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  background: var(--bg-topbar);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.topbar-logo {
  font-size: 22px;
  line-height: 1;
}
.topbar-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.4px;
  background: linear-gradient(135deg, #58a6ff 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ---- 主体区域 ---- */
.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ---- 主视图 ---- */
.main-view {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(88, 166, 255, 0.03) 0%, transparent 70%),
    var(--bg-primary);
}

/* ---- 响应式 ---- */
@media (max-width: 768px) {
  .topbar {
    padding: 0 16px;
    height: 52px;
  }
  .topbar-title {
    font-size: 14px;
  }
  .main-view {
    padding: 24px 16px;
  }
}
</style>
