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
          <span class="field-label">参考概念图 <em>(可选)</em></span>
          <div
            class="drop-zone"
            :class="{ 'has-image': refImagePreview }"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="handleDrop"
          >
            <template v-if="refImagePreview">
              <img :src="refImagePreview" alt="参考图预览" class="preview-img" />
              <button class="btn-remove" @click="clearRefImage" title="移除图片">✕</button>
            </template>
            <template v-else>
              <div class="drop-placeholder">
                <span class="drop-icon">📁</span>
                <span class="drop-hint">拖拽图片到此处，或点击选择文件</span>
              </div>
            </template>
            <input
              type="file"
              accept="image/*"
              class="file-input"
              @change="handleImageUpload"
            />
          </div>
        </label>

        <label class="field">
          <span class="field-label">图片尺寸</span>
          <input
            v-model="size"
            type="text"
            placeholder="1024x1024"
            class="size-input"
          />
        </label>
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
        <p>正在调用 AI 生成图像，通常需要 10-30 秒...</p>
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
        <button class="btn-download" @click="downloadImage">
          ⬇️ 下载 PNG
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
import { ref, onUnmounted } from 'vue'
import { generateImageGemini } from '../utils/api.js'

const props = defineProps({
  apiConfig: { type: Object, required: true },
})

// ---- placeholder ----
const placeholderText = '描述你要生成的图像\n\n例如：像素风格的游戏背包道具，一把散发着火焰光芒的传说级长剑，32x32 像素'

// ---- 输入 ----
const description = ref('')
const size = ref('1024x1024')
const refImage = ref(null)
const refImagePreview = ref(null)
const dragOver = ref(false)

// ---- 输出 ----
const resultUrl = ref(null)
const loading = ref(false)
const error = ref(null)

// ---- 参考图操作 ----
function handleImageUpload(event) {
  const file = event.target.files?.[0]
  if (file) setRefImage(file)
}
function handleDrop(event) {
  dragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) setRefImage(file)
}
function setRefImage(file) {
  refImage.value = file
  if (refImagePreview.value) URL.revokeObjectURL(refImagePreview.value)
  refImagePreview.value = URL.createObjectURL(file)
}
function clearRefImage() {
  if (refImagePreview.value) URL.revokeObjectURL(refImagePreview.value)
  refImage.value = null
  refImagePreview.value = null
}

// ---- 生成 ----
async function generate() {
  error.value = null

  if (!props.apiConfig.isValid) {
    error.value = '请先在顶部栏配置 API 密钥'
    return
  }
  if (!description.value.trim()) {
    error.value = '请输入图像描述'
    return
  }

  loading.value = true
  try {
    // 不做任何 prompt 包装，直接发送用户原始输入（用于测试/调试 API）
    const prompt = description.value.trim()

    if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
    resultUrl.value = null

    resultUrl.value = await generateImageGemini(props.apiConfig, prompt, refImage.value, size.value)
  } catch (e) {
    error.value = `生成失败：${e.message}`
  } finally {
    loading.value = false
  }
}

// ---- 下载 ----
function downloadImage() {
  if (!resultUrl.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = 'generated-image.png'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ---- 清理 ----
onUnmounted(() => {
  if (refImagePreview.value) URL.revokeObjectURL(refImagePreview.value)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
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

/* ---- 尺寸输入 ---- */
.size-input {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--border, #21262d);
  background: var(--bg-input, #0d1117);
  color: #e6edf3;
  font-size: 14px;
  outline: none;
  width: 160px;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.size-input:focus {
  border-color: #58a6ff;
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
}
.size-input::placeholder {
  color: #484f58;
}

/* ---- 拖拽上传 ---- */
.drop-zone {
  position: relative;
  height: 160px;
  border: 2px dashed #21262d;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s;
  background: rgba(0, 0, 0, 0.1);
}
.drop-zone:hover {
  border-color: #58a6ff;
  background: rgba(88, 166, 255, 0.04);
}
.drop-zone.has-image {
  border-style: solid;
  border-color: #30363d;
}
.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.drop-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}
.drop-icon {
  font-size: 28px;
  opacity: 0.6;
}
.drop-hint {
  color: #484f58;
  font-size: 13px;
}
.preview-img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  pointer-events: none;
}
.btn-remove {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.btn-remove:hover {
  background: #f85149;
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
