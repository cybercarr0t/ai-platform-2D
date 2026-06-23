import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite 配置：仅需注册 Vue 插件
export default defineConfig({
  plugins: [vue()],
})
