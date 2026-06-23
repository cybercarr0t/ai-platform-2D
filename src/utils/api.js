/**
 * 调用 Gemini 原生图像生成 API（:generateContent），支持参考图
 *
 * Gemini 格式：
 *   POST /v1/models/{model}:generateContent
 *   Body: { contents: [{ parts: [{text}, {inline_data: {mime_type, data}}, ...] }],
 *           generationConfig: { responseModalities: ["TEXT","IMAGE"], ... } }
 *   Response: candidates[0].content.parts[] → inlineData { mimeType, data }
 *
 * @param {Object} config - API 配置 { endpoint, apiKey, model }
 * @param {string} prompt - 文本 prompt
 * @param {File|null} refImage - 参考概念图（可选）
 * @param {string} [size='1024x1024'] - 图片尺寸
 * @returns {Promise<string>} blob URL
 */
export async function generateImageGemini(config, prompt, refImage = null, size = '1024x1024') {
  // 将 size（如 "1024x1024"）映射为 Gemini 的 aspectRatio
  const [w, h] = size.split('x').map(Number)
  let aspectRatio = '1:1'
  let imageSize = '2K'
  if (w && h) {
    if (w === h) {
      aspectRatio = '1:1'
    } else if (w > h) {
      aspectRatio = '16:9'
    } else {
      aspectRatio = '9:16'
    }
    const maxDim = Math.max(w, h)
    if (maxDim <= 512) imageSize = '512'
    else if (maxDim <= 1024) imageSize = '1K'
    else if (maxDim <= 2048) imageSize = '2K'
    else imageSize = '4K'
  }

  // 构建 parts 数组
  const parts = [{ text: prompt }]

  // 如果有参考图，转 base64 后附加为 inline_data
  if (refImage) {
    const base64 = await fileToBase64(refImage)
    const mimeType = refImage.type || 'image/png'
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: base64,
      },
    })
  }

  const body = {
    contents: [{
      parts,
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      responseFormat: {
        image: {
          aspectRatio,
          imageSize,
        },
      },
    },
  }

  const url = `${config.endpoint.replace(/\/$/, '')}/v1beta/models/${config.model}:generateContent`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120_000)

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (fetchError) {
    clearTimeout(timeoutId)
    if (fetchError.name === 'AbortError') {
      throw new Error('请求超时（120 秒）。AI 图片生成可能需要较长时间，请重试或尝试简化描述')
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
  }

  clearTimeout(timeoutId)

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    const msg = errBody.error?.message
      || (Array.isArray(errBody.error?.errors) && errBody.error.errors[0]?.message)
      || `API 返回错误 (${response.status})`
    throw new Error(msg)
  }

  const data = await response.json()
  console.log('Gemini API 完整响应:', JSON.stringify(data, null, 2))

  // 从 Gemini 响应中提取图片 base64
  let b64Json = null
  if (data.candidates?.[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        b64Json = part.inlineData.data
        break
      }
    }
  }

  if (!b64Json) {
    throw new Error(
      'API 未返回图片数据，请打开浏览器控制台查看 "Gemini API 完整响应" 日志'
    )
  }

  return base64ToBlobUrl(b64Json, 'image/png')
}

/** File → base64（去掉 data:xxx;base64, 前缀） */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      // 去掉 "data:image/png;base64," 前缀
      const base64 = dataUrl.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** base64 → blob URL */
function base64ToBlobUrl(b64, mimeType) {
  const byteChars = atob(b64)
  const byteNums = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    byteNums[i] = byteChars.charCodeAt(i)
  }
  const blob = new Blob([byteNums], { type: mimeType })
  return URL.createObjectURL(blob)
}
