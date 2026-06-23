import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite 配置：注册 Vue 插件
// base 用根路径——站点通过自定义域名 2d-ai-platform.cybercarrot.net
// 从根路径访问，不再是 GitHub Pages 默认的子路径。
// 若改回 <org>.github.io/<repo>/ 形式，需把 base 设为 '/ai-platform-2D/'。
export default defineConfig({
  plugins: [vue()],
  base: '/',
})
