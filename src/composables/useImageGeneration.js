import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { generateImage } from '../utils/api.js'
import { serializePrompt } from '../utils/prompt.js'

/**
 * 图像生成的可复用状态与逻辑
 *
 * 封装两个生成面板（Generator / ImageGenerator）共享的全部行为：
 * 参考图上传/预览/清理、prompt 配置编辑与持久化、生成调用、结果展示与下载、blob URL 生命周期管理。
 *
 * 响应式说明：getConfig 通过函数读取，确保 generate() 执行时实时拿到最新配置，
 * 避免父组件持有过期引用（修复旧版 ApiConfig→App 响应式断链问题）。
 *
 * prompt 现为结构化对象 { system, style, content, data }：
 *   - system/style/content：用户可编辑，存于 promptOverrides，按 storageKey 持久化到 localStorage
 *   - data：由 buildPrompt 根据面板控件（描述、网格、视角）实时填充
 * buildPrompt 返回该对象，generate() 调用 serializePrompt 包成 { prompt: {...} } JSON 字符串发往 API。
 *
 * @param {() => Object} getConfig - 返回当前 apiConfig 的函数（响应式读取）
 * @param {(description: string, overrides: Object) => Object} buildPrompt
 *        由调用方提供的 prompt 组装函数，返回 { system, style, content, data }
 * @param {Object} opts
 * @param {string} opts.storageKey - promptOverrides 持久化的 localStorage key
 * @param {{system:string, style:string, content:string}} opts.defaults
 *        system/style/content 的默认值；首次渲染即填入，挂载后由 localStorage 覆盖
 */
export function useImageGeneration(getConfig, buildPrompt, opts = {}) {
  const storageKey = opts.storageKey || 'prompt-config'
  const defaults = opts.defaults || { system: '', style: '', content: '' }

  // ---- 输入 ----
  const description = ref('')

  // prompt 可编辑三字段（system/style/content），用默认值初始化，保证首次渲染即显示；
  // data 由 buildPrompt 现填。挂载后若 localStorage 有自定义值则覆盖。
  const promptOverrides = reactive({
    system: defaults.system,
    style: defaults.style,
    content: defaults.content,
  })

  // OpenAI image API 参数（全部对应 gpt-image 系列原生字段）
  const imageParams = reactive({
    size: '1024x1024',       // 形如 "WxH"，由面板的宽高填空拼成
    quality: 'auto',         // auto / low / medium / high
    background: 'auto',      // auto / transparent / opaque
    output_format: 'png',    // png / jpeg / webp
    output_compression: 100, // 0-100，仅 jpeg/webp 生效
    moderation: 'auto',      // auto / low
  })

  const refImage = ref(null)
  const refImagePreview = ref(null)
  const dragOver = ref(false)

  // ---- 输出 ----
  const resultUrl = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // ---- prompt 配置持久化 ----
  onMounted(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const cfg = JSON.parse(saved)
        // 仅当 localStorage 中存在对应字段时覆盖默认值，避免空值清掉默认
        if (typeof cfg.system === 'string' && cfg.system) promptOverrides.system = cfg.system
        if (typeof cfg.style === 'string' && cfg.style) promptOverrides.style = cfg.style
        if (typeof cfg.content === 'string' && cfg.content) promptOverrides.content = cfg.content
      }
    } catch {
      // 数据损坏则忽略，保留默认值
    }
  })

  // 任意字段变化时持久化
  watch(promptOverrides, () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ ...promptOverrides })
    )
  })

  // ---- 参考图操作 ----
  function setRefImage(file) {
    if (refImagePreview.value) URL.revokeObjectURL(refImagePreview.value)
    refImage.value = file
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

    // 实时读取最新配置（getConfig 在此执行时收集响应式依赖）
    const config = getConfig()
    if (!config?.isValid) {
      error.value = '请先在顶部栏配置 API 密钥'
      return
    }
    if (!description.value.trim()) {
      error.value = '请输入描述'
      return
    }

    loading.value = true
    try {
      // buildPrompt 返回结构化对象，再包成 { prompt: {...} } JSON 字符串
      const promptObj = buildPrompt(description.value.trim(), promptOverrides)
      const prompt = serializePrompt(promptObj)

      if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
      resultUrl.value = null

      resultUrl.value = await generateImage(config, prompt, refImage.value, imageParams)
    } catch (e) {
      error.value = `生成失败：${e.message}`
    } finally {
      loading.value = false
    }
  }

  // ---- 下载 ----
  // basename 不含扩展名，扩展名按当前 output_format 推导（jpeg → jpg）。
  // blob URL 直接触发下载；http URL（API 返回的图床链接）因跨域 a.download 失效，
  // 尝试 fetch 转 blob 下载，CORS 失败则回退到新标签打开。
  async function downloadImage(basename = 'image') {
    if (!resultUrl.value) return
    const ext = imageParams.output_format === 'jpeg' ? 'jpg' : imageParams.output_format
    const filename = `${basename}.${ext}`

    // blob: 或 data: 开头，直接走 a.download
    if (/^(blob:|data:)/.test(resultUrl.value)) {
      triggerDownload(resultUrl.value, filename)
      return
    }

    // http(s) URL：尝试 fetch 转 blob
    try {
      const resp = await fetch(resultUrl.value)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const blob = await resp.blob()
      const blobUrl = URL.createObjectURL(blob)
      triggerDownload(blobUrl, filename)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch {
      // CORS 拦截等：回退新标签打开
      window.open(resultUrl.value, '_blank')
    }
  }

  function triggerDownload(href, filename) {
    const a = document.createElement('a')
    a.href = href
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // ---- 清理 blob URL，避免内存泄漏 ----
  onUnmounted(() => {
    if (refImagePreview.value) URL.revokeObjectURL(refImagePreview.value)
    if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  })

  return {
    // state
    description,
    promptOverrides,
    imageParams,
    refImage,
    refImagePreview,
    dragOver,
    resultUrl,
    loading,
    error,
    // methods
    setRefImage,
    clearRefImage,
    generate,
    downloadImage,
  }
}
