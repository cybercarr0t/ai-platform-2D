import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite 配置：注册 Vue 插件
// base 设为仓库名子路径，适配 GitHub Pages 部署到
// https://cybercarr0t.github.io/ai-platform-2D/
export default defineConfig({
  plugins: [vue()],
  base: '/ai-platform-2D/',
})
