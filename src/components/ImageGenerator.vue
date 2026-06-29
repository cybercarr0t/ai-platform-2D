<template>
  <!-- 基础图像生成面板 -->
  <div class="image-gen">
    <div class="view-header">
      <h2 class="view-title">🖼️ 基础图像生成</h2>
      <p class="view-subtitle">描述你要生成的游戏美术素材，AI 为你出图</p>
    </div>

    <!-- ===== 输入区 ===== -->
    <div class="card">
      <div class="card-body">
        <label class="field">
          <span class="field-label">图像描述 <em>(必填)</em></span>
          <textarea
            v-model="description"
            :placeholder="placeholderText"
            rows="5"
          ></textarea>
        </label>

        <label class="field">
          <span class="field-label">参考图 <em>(可选，可多选，最多 16 张，作为图生图参考)</em></span>
          <ImageDropZone
            :previews="refImagePreviews"
            @select="addRefImages"
            @remove="removeRefImage"
            @clear="clearRefImages"
          />
        </label>

        <!-- Prompt 配置（system / style / content，可编辑，有默认） -->
        <PromptConfigPanel
          v-model="promptOverrides"
          mode="basic"
          :preview="promptPreviewData"
        />

        <!-- 高级参数（OpenAI image API 原生字段，下拉选单） -->
        <ImageParamsPanel v-model="imageParams" />
      </div>

      <div class="card-footer">
        <button class="btn-generate" :disabled="loading" @click="generate">
          <span v-if="!loading">🎨 生成图像</span>
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
        <p>正在调用 AI 生成图像，通常需要 1-3 分钟，请耐心等待...</p>
      </div>

      <div v-if="error && !loading" class="status error">
        <span class="status-icon">⚠️</span>
        <p>{{ error }}</p>
      </div>

      <template v-if="resultUrl && !loading">
        <div class="result-card">
          <div class="result-header">
            <span>生成结果</span>
          </div>
          <img :src="resultUrl" alt="生成的图像" class="result-img" />
        </div>
        <button class="btn-download" @click="downloadImage('generated-image')">
          ⬇️ 下载图片
        </button>
      </template>

      <div v-if="!resultUrl && !loading && !error" class="status empty">
        <span class="status-icon">🖼️</span>
        <p>输入描述并点击生成，图像将在此展示</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { buildPromptConfig, DEFAULT_PROMPT_CONFIG } from '../utils/prompt.js'
import { useImageGeneration } from '../composables/useImageGeneration.js'
import ImageDropZone from './ImageDropZone.vue'
import ImageParamsPanel from './ImageParamsPanel.vue'
import PromptConfigPanel from './PromptConfigPanel.vue'

const props = defineProps({
  apiConfig: { type: Object, required: true },
})

// ---- placeholder ----
const placeholderText =
  '描述你要生成的图像\n\n例如：像素风格的游戏背包道具，一把散发着火焰光芒的传说级长剑，32x32 像素'

// ---- prompt 组装：basic 模式，返回结构化对象 ----
const buildPrompt = (desc, overrides) =>
  buildPromptConfig({ mode: 'basic', description: desc }, overrides)

// ---- 预览用 data（传给 PromptConfigPanel） ----
const promptPreviewData = computed(() => ({
  description: description.value || '<你的描述>',
}))

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
  storageKey: 'prompt-config:image-gen',
  defaults: DEFAULT_PROMPT_CONFIG.basic,
})
</script>

<style scoped>
.image-gen {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
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

/* ---- 表单 ---- */
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
