<template>
  <!-- 左侧控制台：功能导航，支持缩略/完整切换 -->
  <nav class="console" :class="{ collapsed }">
    <div class="console-top">
      <span v-if="!collapsed" class="console-header">控制台</span>
      <button
        class="btn-toggle"
        :title="collapsed ? '展开控制台' : '收起控制台'"
        @click="toggleCollapse"
      >
        <span class="toggle-icon">{{ collapsed ? '▶' : '◀' }}</span>
      </button>
    </div>

    <ul class="console-menu">
      <li
        v-for="item in menuItems"
        :key="item.id"
        class="menu-item"
        :class="{ active: modelValue === item.id }"
        :title="collapsed ? item.label : ''"
        @click="$emit('update:modelValue', item.id)"
      >
        <span class="menu-icon">{{ item.icon }}</span>
        <Transition name="fade">
          <div v-if="!collapsed" class="menu-text">
            <span class="menu-label">{{ item.label }}</span>
            <span class="menu-desc">{{ item.desc }}</span>
          </div>
        </Transition>
        <!-- 折叠时显示激活指示点 -->
        <span
          v-if="collapsed && modelValue === item.id"
          class="active-dot"
        ></span>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

defineProps({
  modelValue: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const COLLAPSED_KEY = 'console-collapsed'

// 从 localStorage 恢复折叠状态
const collapsed = ref(false)
onMounted(() => {
  try {
    const saved = localStorage.getItem(COLLAPSED_KEY)
    if (saved !== null) collapsed.value = JSON.parse(saved)
  } catch {
    // 忽略
  }
})

function toggleCollapse() {
  collapsed.value = !collapsed.value
  localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsed.value))
}

const menuItems = [
  {
    id: 'image-gen',
    icon: '🖼️',
    label: '基础图像生成',
    desc: '生成单张游戏美术素材',
  },
  {
    id: 'sprite-sheet',
    icon: '🎞️',
    label: 'Sprite Sheet 生成器',
    desc: '生成游戏精灵图序列帧',
  },
]
</script>

<style scoped>
.console {
  width: 240px;
  flex-shrink: 0;
  background: var(--bg-console, #161b22);
  border-right: 1px solid var(--border, #30363d);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.console.collapsed {
  width: 64px;
}

/* 顶部：标题 + 切换按钮 */
.console-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 14px 12px;
  min-height: 48px;
}
.console.collapsed .console-top {
  justify-content: center;
  padding: 18px 0 12px;
}

.console-header {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted, #484f58);
  white-space: nowrap;
}

.btn-toggle {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--border, #30363d);
  background: transparent;
  color: var(--text-muted, #484f58);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.btn-toggle:hover {
  border-color: var(--accent, #4a9eff);
  color: var(--accent, #4a9eff);
  background: rgba(74, 158, 255, 0.06);
}
.toggle-icon {
  font-size: 10px;
  line-height: 1;
}

/* 菜单 */
.console-menu {
  list-style: none;
  margin: 0;
  padding: 4px 10px;
}
.console.collapsed .console-menu {
  padding: 4px 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, padding 0.25s;
  margin-bottom: 4px;
  position: relative;
}
.console.collapsed .menu-item {
  justify-content: center;
  padding: 14px 0;
  gap: 0;
}
.menu-item:hover {
  background: rgba(74, 158, 255, 0.05);
}
.menu-item.active {
  background: rgba(74, 158, 255, 0.1);
  box-shadow: inset 3px 0 0 var(--accent, #4a9eff);
}

.menu-icon {
  font-size: 20px;
  flex-shrink: 0;
  width: 32px;
  text-align: center;
  line-height: 1;
}

.menu-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}
.menu-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #e6edf3);
  white-space: nowrap;
}
.menu-item.active .menu-label {
  color: var(--accent, #4a9eff);
}
.menu-desc {
  font-size: 11px;
  color: var(--text-muted, #484f58);
  margin-top: 2px;
  white-space: nowrap;
}

/* 折叠时的激活指示点 */
.active-dot {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent, #4a9eff);
}

/* Vue transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 500px) {
  .console:not(.collapsed) {
    width: 200px;
  }
}
</style>
