<template>
  <!-- Sprite Sheet 生成面板：支持横版视角 / 俯视 8 方向两种模式 -->
  <div class="generator">
    <div class="view-header">
      <h2 class="view-title">🎞️ Sprite Sheet 生成器</h2>
      <p class="view-subtitle">选择视角模式，输入角色描述，AI 为你生成游戏精灵图序列帧</p>
    </div>

    <!-- ===== 视角模式切换 ===== -->
    <div class="mode-tabs">
      <button
        class="mode-tab"
        :class="{ active: viewMode === 'side' }"
        @click="viewMode = 'side'"
      >
        <span class="mode-icon">🏃</span>
        <span class="mode-label">横版视角</span>
        <span class="mode-desc">侧视动画帧</span>
      </button>
      <button
        class="mode-tab"
        :class="{ active: viewMode === 'topdown' }"
        @click="viewMode = 'topdown'"
      >
        <span class="mode-icon">🔝</span>
        <span class="mode-label">俯视 8 方向</span>
        <span class="mode-desc">鸟瞰 8 向移动</span>
      </button>
    </div>

    <!-- ===== 输入区 ===== -->
    <div class="card">
      <div class="card-body">
        <!-- 角色描述 -->
        <label class="field">
          <span class="field-label">角色描述 <em>(必填)</em></span>
          <textarea
            v-model="description"
            :placeholder="placeholderText"
            rows="5"
          ></textarea>
        </label>

        <!-- 参考图（可多选，最多 16 张，作为图生图参考） -->
        <label class="field">
          <span class="field-label">参考图 <em>(可选，可多选，最多 16 张，作为图生图参考)</em></span>
          <ImageDropZone
            :previews="refImagePreviews"
            @select="addRefImages"
            @remove="removeRefImage"
            @clear="clearRefImages"
          />
        </label>

        <!-- 网格设置 -->
        <div class="grid-block">
          <span class="field-label">网格设置</span>
          <div class="grid-controls">
            <div class="grid-field">
              <label class="grid-label">列数</label>
              <div class="stepper">
                <button class="stepper-btn" @click="columns > 1 && columns--">−</button>
                <input
                  v-model.number="columns"
                  type="number"
                  min="1"
                  max="8"
                  class="stepper-input"
                />
                <button class="stepper-btn" @click="columns < 8 && columns++">+</button>
              </div>
            </div>
            <span class="grid-times">×</span>
            <div class="grid-field">
              <label class="grid-label">行数</label>
              <div class="stepper">
                <button class="stepper-btn" @click="rows > 1 && rows--">−</button>
                <input
                  v-model.number="rows"
                  type="number"
                  min="1"
                  max="8"
                  class="stepper-input"
                />
                <button class="stepper-btn" @click="rows < 8 && rows++">+</button>
              </div>
            </div>
            <span class="grid-info">共 {{ columns * rows }} 帧</span>
          </div>
        </div>

        <!-- Prompt 配置（system / style / content，可编辑，有默认） -->
        <PromptConfigPanel
          v-model="promptOverrides"
          mode="sprite-sheet"
          :preview="promptPreviewData"
        />

        <!-- 高级参数（OpenAI image API 原生字段，下拉选单） -->
        <ImageParamsPanel v-model="imageParams" />
      </div>

      <div class="card-footer">
        <button class="btn-generate" :disabled="loading" @click="generate">
          <span v-if="!loading">🎨 生成 Sprite Sheet</span>
          <span v-else class="loading-text">
            <span class="spinner"></span> 生成中，请稍候...
          </span>
        </button>
      </div>
    </div>

    <!-- ===== 输出区 ===== -->
    <div class="output-section">
      <div v-if="loading" class="status loading">
        <span class="spinner-lg"></span>
        <p>正在调用 AI 生成精灵图，通常需要 1-3 分钟，请耐心等待...</p>
      </div>

      <div v-if="error && !loading" class="status error">
        <span class="status-icon">⚠️</span>
        <p>{{ error }}</p>
      </div>

      <template v-if="resultUrl && !loading">
        <div class="result-card">
          <div class="result-header">
            <span>Sprite Sheet — {{ columns }}×{{ rows }}</span>
          </div>
          <img :src="resultUrl" alt="生成的 Sprite Sheet" class="result-img" />
        </div>
        <button class="btn-download" @click="downloadImage('sprite-sheet')">
          ⬇️ 下载图片
        </button>
      </template>

      <div v-if="!resultUrl && !loading && !error" class="status empty">
        <span class="status-icon">🎨</span>
        <p>输入描述并点击生成，Sprite Sheet 将在此展示</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { buildPromptConfig, DEFAULT_PROMPT_CONFIG } from '../utils/prompt.js'
import { useImageGeneration } from '../composables/useImageGeneration.js'
import ImageDropZone from './ImageDropZone.vue'
import ImageParamsPanel from './ImageParamsPanel.vue'
import PromptConfigPanel from './PromptConfigPanel.vue'

const props = defineProps({
  apiConfig: { type: Object, required: true },
})

// ---- 视角模式：side（横版）| topdown（俯视 8 方向） ----
const viewMode = ref('side')

// ---- 网格参数（本面板私有） ----
const columns = ref(4)
const rows = ref(4)

// 输入边界保护：clamp 到 [1, 8]，防止用户键盘输入越界值污染 prompt
watch(columns, (v) => {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n) || n < 1) columns.value = 1
  else if (n > 8) columns.value = 8
  else if (n !== v) columns.value = n
})
watch(rows, (v) => {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n) || n < 1) rows.value = 1
  else if (n > 8) rows.value = 8
  else if (n !== v) rows.value = n
})

// ---- placeholder 根据视角动态切换 ----
const placeholderText = computed(() =>
  viewMode.value === 'side'
    ? '描述你要生成的角色或对象\n\n例如：一个穿铁甲的骑士，手持长剑和盾牌，中世纪风格'
    : '描述你要生成的角色或对象\n\n例如：一个魔法师，戴尖顶帽穿长袍，手持法杖'
)

// ---- prompt 组装：根据当前视角模式分发，返回结构化对象 ----
const buildPrompt = (desc, overrides) =>
  buildPromptConfig(
    {
      mode: 'sprite-sheet',
      description: desc,
      view: viewMode.value,
      columns: columns.value,
      rows: rows.value,
    },
    overrides
  )

// ---- 预览用 data（随视角/网格/描述实时变化，传给 PromptConfigPanel） ----
const promptPreviewData = computed(() => {
  const obj = buildPromptConfig(
    {
      mode: 'sprite-sheet',
      description: description.value || '<你的描述>',
      view: viewMode.value,
      columns: columns.value,
      rows: rows.value,
    },
    {}
  )
  return obj.data
})

// ---- 复用通用图像生成逻辑 ----
const {
  description,
  promptOverrides,
  imageParams,
  refImagePreviews,
  resultUrl,
  loading,
  error,
  addRefImages,
  removeRefImage,
  clearRefImages,
  generate,
  downloadImage,
} = useImageGeneration(() => props.apiConfig, buildPrompt, {
  storageKey: 'prompt-config:sprite-sheet',
  defaults: DEFAULT_PROMPT_CONFIG['sprite-sheet'],
})
</script>

<style scoped>
.generator {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ---- 视图头部 ---- */
.view-header {
  margin-bottom: 4px;
}
.view-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #e6edf3;
}
.view-subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: #8b949e;
}

/* ---- 视角模式切换 ---- */
.mode-tabs {
  display: flex;
  gap: 12px;
}
.mode-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 18px 16px 14px;
  border-radius: 12px;
  border: 2px solid #21262d;
  background: #161c24;
  color: #8b949e;
  cursor: pointer;
  transition: all 0.2s;
}
.mode-tab:hover {
  border-color: #30363d;
  background: #1c2433;
}
.mode-tab.active {
  border-color: #58a6ff;
  background: rgba(88, 166, 255, 0.06);
  box-shadow: 0 0 0 1px rgba(88, 166, 255, 0.15);
}
.mode-icon {
  font-size: 28px;
  line-height: 1;
}
.mode-label {
  font-size: 14px;
  font-weight: 600;
  color: #c9d1d9;
}
.mode-tab.active .mode-label {
  color: #58a6ff;
}
.mode-desc {
  font-size: 11px;
  color: #484f58;
}

/* ---- 卡片容器 ---- */
.card {
  background: var(--bg-card, #161c24);
  border: 1px solid var(--border, #21262d);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}
.card-body {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.card-footer {
  padding: 18px 28px;
  border-top: 1px solid var(--border, #21262d);
  background: rgba(0, 0, 0, 0.15);
}

/* ---- 表单字段 ---- */
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.field-label {
  font-size: 14px;
  font-weight: 600;
  color: #c9d1d9;
}
.field-label em {
  color: #8b949e;
  font-weight: 400;
  font-style: normal;
}
.field textarea {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid var(--border, #21262d);
  background: var(--bg-input, #0d1117);
  color: #e6edf3;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.field textarea:focus {
  border-color: #58a6ff;
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
}
.field textarea::placeholder {
  color: #484f58;
}

/* ---- 网格设置 ---- */
.grid-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.grid-controls {
  display: flex;
  align-items: flex-end;
  gap: 14px;
}
.grid-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.grid-label {
  font-size: 12px;
  color: #8b949e;
  font-weight: 500;
}
.stepper {
  display: flex;
  align-items: center;
  border: 1px solid #21262d;
  border-radius: 8px;
  overflow: hidden;
}
.stepper-btn {
  width: 36px;
  height: 38px;
  border: none;
  background: #21262d;
  color: #8b949e;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stepper-btn:hover {
  background: #30363d;
  color: #e6edf3;
}
.stepper-btn:active {
  background: #58a6ff;
  color: #fff;
}
.stepper-input {
  width: 52px;
  height: 38px;
  border: none;
  background: #0d1117;
  color: #e6edf3;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  outline: none;
  -moz-appearance: textfield;
}
.stepper-input::-webkit-outer-spin-button,
.stepper-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.grid-times {
  font-size: 20px;
  color: #484f58;
  padding-bottom: 8px;
}
.grid-info {
  font-size: 13px;
  color: #58a6ff;
  padding-bottom: 10px;
  font-weight: 500;
}

/* ---- 生成按钮 ---- */
.btn-generate {
  width: 100%;
  padding: 15px 0;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #e94560, #c23152);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-generate:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(233, 69, 96, 0.3);
}
.btn-generate:active:not(:disabled) {
  transform: translateY(0);
}
.btn-generate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 10px;
}
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ---- 输出区 ---- */
.output-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.status {
  padding: 48px 32px;
  border-radius: 12px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.status p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}
.status-icon {
  font-size: 28px;
}
.status.loading {
  color: #d2991d;
  background: rgba(210, 153, 29, 0.06);
  border: 1px solid rgba(210, 153, 29, 0.1);
}
.status.error {
  color: #f85149;
  background: rgba(248, 81, 73, 0.06);
  border: 1px solid rgba(248, 81, 73, 0.1);
}
.status.empty {
  color: #484f58;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #21262d;
}

.spinner-lg {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(210, 153, 29, 0.2);
  border-top-color: #d2991d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 结果 */
.result-card {
  width: 100%;
  background: var(--bg-card, #161c24);
  border-radius: 12px;
  border: 1px solid #21262d;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.3);
}
.result-header {
  padding: 14px 20px;
  font-size: 13px;
  font-weight: 600;
  color: #8b949e;
  border-bottom: 1px solid #21262d;
}
.result-img {
  width: 100%;
  display: block;
}

.btn-download {
  padding: 14px 40px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #238636, #2ea043);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(35, 134, 54, 0.2);
}
.btn-download:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(35, 134, 54, 0.4);
}
.btn-download:active {
  transform: translateY(0);
}
</style>
