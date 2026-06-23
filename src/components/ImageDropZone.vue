<template>
  <!-- 参考概念图上传区：支持拖拽或点击选择，v-model 同步 File -->
  <div
    class="drop-zone"
    :class="{ 'has-image': preview, drag: dragOver }"
    @dragover.prevent="dragOver = true"
    @dragleave.prevent="dragOver = false"
    @drop.prevent="handleDrop"
  >
    <template v-if="preview">
      <img :src="preview" alt="参考图预览" class="preview-img" />
      <button class="btn-remove" @click="handleRemove" title="移除图片">✕</button>
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
      @change="handleUpload"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  preview: { type: String, default: '' }, // 预览 URL
})
const emit = defineEmits(['select', 'remove'])

// 拖拽高亮状态（仅本组件内部视觉反馈）
const dragOver = ref(false)

function handleUpload(event) {
  const file = event.target.files?.[0]
  if (file && file.type.startsWith('image/')) emit('select', file)
  // 清空 input 值，允许重复选择同一文件
  event.target.value = ''
}

function handleDrop(event) {
  dragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) emit('select', file)
}

function handleRemove() {
  emit('remove')
}
</script>

<style scoped>
.drop-zone {
  position: relative;
  height: 160px;
  border: 2px dashed var(--border, #21262d);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s;
  background: rgba(0, 0, 0, 0.1);
}
.drop-zone:hover,
.drop-zone.drag {
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
</style>
