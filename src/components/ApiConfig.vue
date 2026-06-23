<template>
  <!-- API 配置：顶部栏弹出式面板，数据持久化到 localStorage -->
  <div class="api-config" ref="rootEl">
    <button class="api-trigger" @click="toggle">
      <span class="trigger-icon">⚙️</span>
      <span class="trigger-label">API 配置</span>
      <span v-if="isValid" class="status-dot" title="已配置密钥"></span>
    </button>

    <!-- 弹出面板 -->
    <Teleport to="body">
      <div v-if="open" class="api-backdrop" @click="close"></div>
      <div v-if="open" class="api-popover" :style="popoverStyle">
        <div class="popover-header">
          <span>🔑 API 配置</span>
          <button class="btn-close" @click="close">✕</button>
        </div>
        <div class="popover-body">
          <label class="field">
            <span>API 端点</span>
            <input
              v-model="endpoint"
              type="text"
              placeholder="https://api.openai.com"
            />
          </label>
          <label class="field">
            <span>API 密钥</span>
            <input
              v-model="apiKey"
              type="password"
              placeholder="sk-..."
            />
          </label>
          <label class="field">
            <span>模型名称</span>
            <input
              v-model="model"
              type="text"
              placeholder="dall-e-3"
            />
          </label>
          <div class="popover-actions">
            <button class="btn-save" @click="handleSave">保存配置</button>
          </div>
          <p v-if="savedHint" class="hint">{{ savedHint }}</p>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'

const STORAGE_KEY = 'sprite-sheet-config'

const endpoint = ref('https://api.openai.com')
const apiKey = ref('')
const model = ref('gemini-3.1-flash-image-preview')
const open = ref(false)
const savedHint = ref('')
const rootEl = ref(null)
const popoverStyle = ref({})

const isValid = computed(() => apiKey.value.trim().length > 0)

onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const config = JSON.parse(saved)
      if (config.endpoint) endpoint.value = config.endpoint
      if (config.apiKey) apiKey.value = config.apiKey
      if (config.model) model.value = config.model
    }
  } catch {
    // 数据损坏则忽略
  }
})

function updatePosition() {
  if (!rootEl.value) return
  const btn = rootEl.value.querySelector('.api-trigger')
  if (!btn) return
  const rect = btn.getBoundingClientRect()
  popoverStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 8}px`,
    right: `${window.innerWidth - rect.right}px`,
    width: '340px',
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) nextTick(updatePosition)
}

function close() {
  open.value = false
}

function saveConfig() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ endpoint: endpoint.value, apiKey: apiKey.value, model: model.value })
  )
}

function handleSave() {
  saveConfig()
  savedHint.value = '✅ 配置已保存'
  setTimeout(() => (savedHint.value = ''), 2000)
  setTimeout(() => (open.value = false), 600)
}

function onKeydown(e) {
  if (e.key === 'Escape') close()
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

defineExpose({ endpoint, apiKey, model, isValid })
</script>

<style scoped>
/* 触发器按钮 */
.api-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid var(--border, #21262d);
  background: transparent;
  color: var(--text-secondary, #8b949e);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.api-trigger:hover {
  border-color: var(--accent, #58a6ff);
  color: var(--text-primary, #e6edf3);
  background: rgba(88, 166, 255, 0.04);
}
.trigger-icon {
  font-size: 15px;
  line-height: 1;
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3fb950;
  flex-shrink: 0;
}

/* 遮罩 */
.api-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
  backdrop-filter: blur(1px);
}

/* 弹出面板 */
.api-popover {
  z-index: 1000;
  background: #161c24;
  border: 1px solid #21262d;
  border-radius: 12px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(88, 166, 255, 0.05);
  overflow: hidden;
}
.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #21262d;
  font-size: 14px;
  font-weight: 600;
  color: #e6edf3;
}
.btn-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #8b949e;
  font-size: 16px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.btn-close:hover {
  background: #21262d;
  color: #e6edf3;
}
.popover-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field span {
  font-size: 13px;
  font-weight: 500;
  color: #8b949e;
}
.field input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #21262d;
  background: #0d1117;
  color: #e6edf3;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}
.field input:focus {
  border-color: #58a6ff;
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
}
.field input::placeholder {
  color: #484f58;
}

.popover-actions {
  margin-top: 4px;
}
.btn-save {
  width: 100%;
  padding: 10px 0;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #58a6ff, #8b5cf6);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}
.btn-save:hover {
  opacity: 0.9;
}
.btn-save:active {
  transform: scale(0.98);
}

.hint {
  margin: 0;
  font-size: 12px;
  color: #3fb950;
  text-align: center;
}
</style>
