/**
 * 调用 OpenAI 兼容图像生成 API
 *
 * - 无参考图：POST {endpoint}/v1/images/generations（JSON）
 * - 有参考图：POST {endpoint}/v1/images/edits（multipart/form-data，图生图）
 *
 * 请求参数（gpt-image 系列原生参数，缺失字段用默认值兜底）：
 *   model, prompt, n=1, size, quality, background, output_format,
 *   output_compression, moderation
 *
 * 不传 response_format——packyapi 网关对部分请求会返回
 * "Unknown parameter: 'response_format'"，删掉后 API 默认即返回 url。
 *
 * 响应解析：直接返回 data[0].url（不 fetch，规避图床 CORS）；
 * 兜底 data[0].b64_json 转 blob URL。
 *
 * @param {Object} config - API 配置 { endpoint, apiKey, model, isValid }
 * @param {string} prompt - 文本 prompt（现为 { prompt: { system, style, content, data } } 的 JSON 字符串）
 * @param {File|null} refImage - 参考概念图；非空时走 edits 端点
 * @param {Object} [params] - 图像参数 { size, quality, background, output_format, output_compression, moderation }
 * @returns {Promise<string>} 生成图片的 blob URL
 */
export async function generateImage(config, prompt, refImage = null, params = {}) {
  // 参数默认值兜底，保证不带 params 也能工作
  const p = {
    size: 'auto',
    quality: 'auto',
    background: 'auto',
    output_format: 'png',
    output_compression: 100,
    moderation: 'auto',
    ...params,
  }

  const base = config.endpoint.replace(/\/$/, '')
  const url = `${base}/v1/images/${refImage ? 'edits' : 'generations'}`

  // 图像生成（尤其 high 质量 / 大尺寸）耗时较长，给 5 分钟超时
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 300_000)

  let response
  try {
    const init = {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}` },
      signal: controller.signal,
    }

    if (refImage) {
      // edits：multipart 上传参考图文件 + 全部参数作为 form 字段
      const form = new FormData()
      form.append('model', config.model)
      form.append('prompt', prompt)
      form.append('image', refImage)
      form.append('n', '1')
      form.append('size', p.size)
      form.append('quality', p.quality)
      form.append('background', p.background)
      form.append('output_format', p.output_format)
      form.append('output_compression', String(p.output_compression))
      form.append('moderation', p.moderation)
      init.body = form
    } else {
      // generations：JSON
      init.headers['Content-Type'] = 'application/json'
      init.body = JSON.stringify({
        model: config.model,
        prompt,
        n: 1,
        size: p.size,
        quality: p.quality,
        background: p.background,
        output_format: p.output_format,
        output_compression: p.output_compression,
        moderation: p.moderation,
      })
    }

    response = await fetch(url, init)
  } catch (fetchError) {
    if (fetchError.name === 'AbortError') {
      throw new Error('请求超时（300 秒）。AI 图片生成可能需要较长时间，请重试或尝试简化描述')
    }
    if (fetchError.name === 'TypeError') {
      throw new Error(
        '网络请求失败。可能原因：\n' +
        '1. API 服务不可达，请检查 API 端点地址是否正确\n' +
        '2. 浏览器 CORS 限制\n' +
        '3. 本地网络问题，请检查网络连接'
      )
    }
    throw new Error(`网络错误：${fetchError.message}`)
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    const msg = errBody.error?.message
      || (Array.isArray(errBody.error?.errors) && errBody.error.errors[0]?.message)
      || `API 返回错误 (${response.status})`
    throw new Error(msg)
  }

  const data = await response.json()
  if (import.meta.env.DEV) {
    console.log('Image API 响应状态:', response.status, '包含数据项:', data?.data?.length ?? 0)
  }

  const item = data?.data?.[0]
  if (!item) {
    throw new Error('API 未返回图片数据')
  }

  // mimeType 按 output_format 推导，仅 b64_json 路径需要
  const mimeType = FORMAT_TO_MIME[p.output_format] || 'image/png'

  // 优先直接返回 API 给的 url——<img> 标签跨域加载不受 CORS 限制，能正常显示。
  // 不在此 fetch 转 blob：腾讯 COS 等图床通常不带 CORS 头，浏览器 fetch 会被拦截。
  // 下载由调用方处理：跨域 URL 用 a.download 可能降级为新标签打开。
  if (item.url) {
    return item.url
  }
  if (item.b64_json) {
    return base64ToBlobUrl(item.b64_json, mimeType)
  }
  throw new Error('API 响应中未找到 b64_json 或 url 字段')
}

/** output_format → MIME 映射 */
const FORMAT_TO_MIME = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

/** base64 → blob URL（异步，内部用 dataURL + fetch 转换，避免逐字符循环阻塞主线程） */
function base64ToBlobUrl(b64, mimeType) {
  return fetch(`data:${mimeType};base64,${b64}`)
    .then((r) => r.blob())
    .then((blob) => URL.createObjectURL(blob))
}
