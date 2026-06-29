<template>
  <!--
    多图上传区：支持拖拽或点击选择多张参考图，v-model 由父组件持有 File[]，
    通过 :previews 传入预览 URL 数组（与 File[] 一一对应、同顺序）。
    emit：select(File[]，可多选) / remove(index) / clear
  -->
  <div
    class="drop-zone"
    :class="{ 'has-image': previews.length > 0, drag: dragOver }"
    @dragover.prevent="dragOver = true"
    @dragleave.prevent="dragOver = false"
    @drop.prevent="handleDrop"
  >
    <!-- 空态：占位 -->
    <div v-if="previews.length === 0" class="drop-placeholder">
      <span class="drop-icon">📁</span>
      <span class="drop-hint">拖拽图片到此处，或点击选择（可多选，最多 16 张）</span>
    </div>

    <!-- 有图：缩略图网格 -->
    <div v-else class="thumb-grid">
      <div
        v-for="(src, i) in previews"
        :key="i"
        class="thumb"
      >
        <img :src="src" :alt="`参考图 ${i + 1}`" class="thumb-img" />
        <span class="thumb-index">{{ i + 1 }}</span>
        <button
          class="btn-remove"
          @click.stop="$emit('remove', i)"
          :title="`移除第 ${i + 1} 张`"
        >✕</button>
      </div>
    </div>

    <!-- 右上角清空按钮 -->
    <button
      v-if="previews.length > 0"
      class="btn-clear"
      @click.stop="$emit('clear')"
      title="清空全部"
    >清空</button>

    <input
      type="file"
      accept="image/*"
      multiple
      class="file-input"
      @change="handleUpload"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  previews: { type: Array, default: () => [] }, // 预览 URL 数组（与 File[] 同顺序）
})
const emit = defineEmits(['select', 'remove', 'clear'])

// 拖拽高亮状态（仅本组件内部视觉反馈）
const dragOver = ref(false)

// 从 FileList 中提取合法图片文件，超 16 张截断并提示
function pickFiles(list) {
  const files = []
  for (const f of list) {
    if (f && f.type.startsWith('image/')) files.push(f)
  }
  return files
}

function handleUpload(event) {
  const picked = pickFiles(event.target.files || [])
  if (picked.length) emit('select', picked)
  // 清空 input 值，允许重复选择同一文件
  event.target.value = ''
}

function handleDrop(event) {
  dragOver.value = false
  const picked = pickFiles(event.dataTransfer?.files || [])
  if (picked.length) emit('select', picked)
}
</script>

<style scoped>
.drop-zone {
  position: relative;
  min-height: 160px;
  padding: 12px;
  border: 2px dashed var(--border, #21262d);
  border-radius: 12px;
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
  height: 136px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
  text-align: center;
}

/* 缩略图网格 */
.thumb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 10px;
  pointer-events: none;
}
.thumb {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  background: #0d1117;
  border: 1px solid #21262d;
}
.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.thumb-index {
  position: absolute;
  left: 4px;
  top: 4px;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.7);
  color: #e6edf3;
  font-size: 11px;
  font-weight: 600;
  pointer-events: none;
}
.btn-remove {
  position: absolute;
  right: 4px;
  top: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  z-index: 3;
  transition: background 0.15s;
}
.btn-remove:hover {
  background: #f85149;
}

/* 清空按钮 */
.btn-clear {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #30363d;
  background: rgba(22, 28, 36, 0.9);
  color: #8b949e;
  font-size: 12px;
  cursor: pointer;
  z-index: 3;
  transition: all 0.15s;
}
.btn-clear:hover {
  color: #f85149;
  border-color: #f85149;
}
</style>
