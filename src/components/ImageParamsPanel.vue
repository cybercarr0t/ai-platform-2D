<template>
  <!-- OpenAI image API 高级参数面板：全部下拉选单，默认折叠 -->
  <details class="params-panel">
    <summary class="params-summary">⚙️ 高级参数</summary>

    <div class="params-grid">
      <!-- 尺寸：宽 × 高 填空，拼成 WxH 传给 API -->
      <div class="param-field">
        <span class="param-label">尺寸（宽 × 高）</span>
        <div class="size-row">
          <input
            v-model.number="sizeW"
            type="number"
            min="1"
            class="size-input"
            @input="syncSize"
          />
          <span class="size-times">×</span>
          <input
            v-model.number="sizeH"
            type="number"
            min="1"
            class="size-input"
            @input="syncSize"
          />
        </div>
      </div>

      <!-- 质量 -->
      <label class="param-field">
        <span class="param-label">质量</span>
        <select v-model="model.quality">
          <option value="auto">自动</option>
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
        </select>
      </label>

      <!-- 背景 -->
      <label class="param-field">
        <span class="param-label">背景</span>
        <select v-model="model.background">
          <option value="auto">自动</option>
          <option value="transparent">透明</option>
          <option value="opaque">不透明</option>
        </select>
      </label>

      <!-- 输出格式 -->
      <label class="param-field">
        <span class="param-label">输出格式</span>
        <select v-model="model.output_format">
          <option value="png">PNG</option>
          <option value="jpeg">JPEG</option>
          <option value="webp">WebP</option>
        </select>
      </label>

      <!-- 压缩级别（仅 jpeg/webp 生效） -->
      <label class="param-field" :class="{ disabled: model.output_format === 'png' }">
        <span class="param-label">
          压缩级别
          <em v-if="model.output_format === 'png'">（仅 JPEG/WebP）</em>
        </span>
        <select v-model.number="model.output_compression" :disabled="model.output_format === 'png'">
          <option v-for="n in compressionOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>

      <!-- 内容审核 -->
      <label class="param-field">
        <span class="param-label">内容审核</span>
        <select v-model="model.moderation">
          <option value="auto">自动</option>
          <option value="low">宽松</option>
        </select>
      </label>
    </div>

    <!-- 透明背景与格式冲突提示 -->
    <p v-if="showTransparentHint" class="param-hint">
      ℹ️ 透明背景需 PNG 或 WebP 格式，已自动切换
    </p>
  </details>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  // imageParams 对象（v-model）
  modelValue: { type: Object, required: true },
})
const emit = defineEmits(['update:modelValue'])

// 直接在传入对象上读写（reactive 对象，Vue 透传响应式）
const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

// 压缩级别选项 0–100，步进 10
const compressionOptions = Array.from({ length: 11 }, (_, i) => i * 10)

// ---- 尺寸：宽高填空与 model.size（"WxH" 字符串）双向同步 ----
// 初始从 model.size 拆出 W/H；非法或非数字则回退到 1024
function parseSize(size) {
  const m = /^(\d+)\s*[xX×]\s*(\d+)$/.exec(String(size))
  return m ? { w: Number(m[1]), h: Number(m[2]) } : { w: 1024, h: 1024 }
}
const initial = parseSize(model.value.size)
const sizeW = ref(initial.w)
const sizeH = ref(initial.h)

// 宽高输入变化时拼成 "WxH" 写回 model；clamp 到 ≥1，空值回退 1024
function syncSize() {
  const w = Number.isFinite(sizeW.value) && sizeW.value >= 1 ? sizeW.value : 1024
  const h = Number.isFinite(sizeH.value) && sizeH.value >= 1 ? sizeH.value : 1024
  model.value.size = `${w}x${h}`
}

// model.size 被外部改动时（如未来重置）回填宽高输入
watch(
  () => model.value.size,
  (size) => {
    const { w, h } = parseSize(size)
    if (sizeW.value !== w) sizeW.value = w
    if (sizeH.value !== h) sizeH.value = h
  }
)

// 联动：透明背景 + jpeg 不兼容 → 自动切 png
const showTransparentHint = computed(
  () => model.value.background === 'transparent' && model.value.output_format === 'jpeg'
)
watch(showTransparentHint, (conflict) => {
  if (conflict) {
    // 直接改 model.value（reactive 对象的字段，响应式触发）
    model.value.output_format = 'png'
  }
})
</script>

<style scoped>
.params-panel {
  border: 1px solid var(--border, #21262d);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
.params-summary {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #8b949e;
  cursor: pointer;
  user-select: none;
  list-style: none;
  transition: color 0.15s;
}
.params-summary::-webkit-details-marker {
  display: none;
}
.params-summary:hover {
  color: #e6edf3;
}
.params-grid {
  padding: 4px 16px 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.param-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.param-field.disabled {
  opacity: 0.45;
}
.param-label {
  font-size: 12px;
  color: #8b949e;
  font-weight: 500;
}
.param-label em {
  color: #484f58;
  font-style: normal;
  font-weight: 400;
}
.param-field select {
  padding: 9px 10px;
  border-radius: 8px;
  border: 1px solid #21262d;
  background: #0d1117;
  color: #e6edf3;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}
.param-field select:focus {
  border-color: #58a6ff;
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
}
.param-field select:disabled {
  cursor: not-allowed;
}

/* 尺寸宽高填空 */
.size-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.size-input {
  flex: 1;
  min-width: 0;
  padding: 9px 10px;
  border-radius: 8px;
  border: 1px solid #21262d;
  background: #0d1117;
  color: #e6edf3;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
  -moz-appearance: textfield;
}
.size-input::-webkit-outer-spin-button,
.size-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.size-input:focus {
  border-color: #58a6ff;
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
}
.size-times {
  font-size: 14px;
  color: #484f58;
  flex-shrink: 0;
}
.param-hint {
  margin: 0;
  padding: 0 16px 14px;
  font-size: 12px;
  color: #d2991d;
}

/* 窄屏单列 */
@media (max-width: 560px) {
  .params-grid {
    grid-template-columns: 1fr;
  }
}
</style>
