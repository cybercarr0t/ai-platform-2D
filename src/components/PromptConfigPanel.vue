<template>
  <!--
    Prompt 配置面板：编辑 system / style / content 三块，预览最终 JSON
    data 由各生成面板的控件填充，通过 :preview 传入，此处只读展示
  -->
  <details class="prompt-panel">
    <summary class="prompt-summary">📝 Prompt 配置</summary>

    <div class="prompt-body">
      <!-- 系统提示词 -->
      <label class="p-field">
        <span class="p-label">系统提示词 <em>(system)</em></span>
        <textarea
          v-model="model.system"
          rows="4"
          placeholder="稳定的输出指令：网格规则、白底约束等"
        ></textarea>
      </label>

      <!-- 风格 -->
      <label class="p-field">
        <span class="p-label">风格 <em>(style)</em></span>
        <textarea
          v-model="model.style"
          rows="3"
          placeholder="画风描述：pixel-art / 平涂阴影 / 统一光照等"
        ></textarea>
      </label>

      <!-- 角色 / 内容物 -->
      <label class="p-field">
        <span class="p-label">角色 / 内容物 <em>(content)</em></span>
        <textarea
          v-model="model.content"
          rows="2"
          placeholder="主体类型：character / game art asset 等"
        ></textarea>
      </label>

      <div class="prompt-actions">
        <button class="btn-reset" @click="resetToDefault">↺ 恢复默认</button>
        <button class="btn-preview" @click="showPreview = !showPreview">
          {{ showPreview ? '隐藏' : '预览' }} Prompt JSON
        </button>
      </div>

      <pre v-if="showPreview" class="prompt-preview">{{ previewJson }}</pre>
    </div>
  </details>
</template>

<script setup>
import { computed, ref } from 'vue'
import { DEFAULT_PROMPT_CONFIG } from '../utils/prompt.js'

const props = defineProps({
  // 用户可编辑的三字段 { system, style, content }（v-model）
  modelValue: { type: Object, required: true },
  // 当前面板模式，用于取默认值
  mode: { type: String, required: true },
  // 由面板控件填好的 data 对象，用于预览最终 { prompt: {...} }
  preview: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue'])

// 直接在传入对象上读写（reactive 对象，Vue 透传响应式）
const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const showPreview = ref(false)

// 预览最终发给模型的 JSON（含 data）
const previewJson = computed(() => {
  const full = {
    system: model.value.system,
    style: model.value.style,
    content: model.value.content,
    data: props.preview,
  }
  return JSON.stringify({ prompt: full }, null, 2)
})

// 恢复当前模式的默认 system/style/content
function resetToDefault() {
  const def = DEFAULT_PROMPT_CONFIG[props.mode] || DEFAULT_PROMPT_CONFIG.basic
  model.value.system = def.system
  model.value.style = def.style
  model.value.content = def.content
}
</script>

<style scoped>
.prompt-panel {
  border: 1px solid var(--border, #21262d);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
.prompt-summary {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #8b949e;
  cursor: pointer;
  user-select: none;
  list-style: none;
  transition: color 0.15s;
}
.prompt-summary::-webkit-details-marker {
  display: none;
}
.prompt-summary:hover {
  color: #e6edf3;
}

.prompt-body {
  padding: 4px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.p-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.p-label {
  font-size: 12px;
  color: #8b949e;
  font-weight: 500;
}
.p-label em {
  color: #484f58;
  font-style: normal;
  font-weight: 400;
}
.p-field textarea {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #21262d;
  background: #0d1117;
  color: #e6edf3;
  font-size: 13px;
  line-height: 1.6;
  outline: none;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.p-field textarea:focus {
  border-color: #58a6ff;
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
}
.p-field textarea::placeholder {
  color: #484f58;
}

.prompt-actions {
  display: flex;
  gap: 10px;
}
.btn-reset,
.btn-preview {
  flex: 1;
  padding: 9px 0;
  border-radius: 8px;
  border: 1px solid #21262d;
  background: #161c24;
  color: #c9d1d9;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-reset:hover,
.btn-preview:hover {
  border-color: #58a6ff;
  color: #58a6ff;
  background: rgba(88, 166, 255, 0.05);
}

.prompt-preview {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #21262d;
  background: #0d1117;
  color: #8b949e;
  font-size: 12px;
  line-height: 1.5;
  font-family: 'SF Mono', 'Consolas', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 260px;
  overflow-y: auto;
}
</style>
