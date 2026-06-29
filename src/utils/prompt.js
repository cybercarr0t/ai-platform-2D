/**
 * Prompt 拆分与序列化
 *
 * 将原本耦合的 sprite sheet prompt 拆成四块：
 *   - system：稳定指令（网格布局规则、白底约束、无重叠等）
 *   - style：画风（pixel-art / 干净线稿 / 平涂阴影 / 统一光照 / 比例一致）
 *   - content：角色/内容物（character / game art asset 等）
 *   - data：每次生成会变的量（描述、视角、列行数、帧数、方向）
 *
 * 发给模型时整体包裹一层 { prompt: {...} } 并 JSON.stringify，
 * 由调用方作为字符串写入 image API 的 prompt 字段。
 */

/**
 * 各模式默认 prompt 配置（system / style / content 三块用户可编辑，data 由面板控件填充）
 *
 * side / topdown 共用同一份 system/style/content，仅 data.perspective / data.directions 不同；
 * basic 面向单张素材生成，system 留空，content 默认 "game art asset"。
 */
export const DEFAULT_PROMPT_CONFIG = {
  'sprite-sheet': {
    system:
      'Generate a sprite sheet arranged in a grid. Each row represents one animation sequence, ' +
      'with frames progressing from left to right within that row. ' +
      'Background MUST be pure white (#FFFFFF), fully opaque, with no gradients, no transparency, no patterns. ' +
      'This is required for automated sprite extraction. ' +
      'Evenly spaced grid with no overlapping frames.',
    style:
      'pixel-art, clean outlines, flat shading, uniform lighting, ' +
      'consistent character scale across all frames',
    content: 'character',
  },
  basic: {
    system: '',
    style: 'pixel-art, clean outlines, flat shading, uniform lighting',
    content: 'game art asset',
  },
}

/** 俯视 8 方向固定方向序列 */
const TOPDOWN_DIRECTIONS = [
  'up', 'up-right', 'right', 'down-right',
  'down', 'down-left', 'left', 'up-left',
]

/** 视角 → perspective 描述句 */
const PERSPECTIVE_TEXT = {
  side: 'Side-view perspective, character faces left or right.',
  topdown: "Top-down / overhead perspective, bird's-eye view.",
}

/**
 * 组装完整 prompt 对象（含 data）
 *
 * @param {Object} opts
 * @param {'sprite-sheet'|'basic'} opts.mode - 面板模式
 * @param {string} opts.description - 用户输入的描述
 * @param {'side'|'topdown'} [opts.view] - sprite sheet 视角模式（basic 不需要）
 * @param {number} [opts.columns] - 网格列数
 * @param {number} [opts.rows] - 网格行数
 * @param {Object} [overrides] - 用户编辑过的 system/style/content 覆盖值
 * @returns {{system:string, style:string, content:string, data:Object}}
 */
export function buildPromptConfig({ mode, description, view, columns, rows }, overrides = {}) {
  const base = DEFAULT_PROMPT_CONFIG[mode] || DEFAULT_PROMPT_CONFIG.basic

  const system = overrides.system ?? base.system
  const style = overrides.style ?? base.style
  const content = overrides.content ?? base.content

  let data
  if (mode === 'sprite-sheet') {
    const v = view === 'topdown' ? 'topdown' : 'side'
    data = {
      description,
      view: v,
      perspective: PERSPECTIVE_TEXT[v],
      columns,
      rows,
      frames: columns * rows,
      directions: v === 'topdown' ? TOPDOWN_DIRECTIONS : null,
    }
  } else {
    data = { description }
  }

  return { system, style, content, data }
}

/**
 * 序列化 prompt 对象为发给模型的字符串
 *
 * 包裹一层 { prompt: {...} }，整体 JSON.stringify。
 *
 * @param {{system:string, style:string, content:string, data:Object}} promptConfig
 * @returns {string}
 */
export function serializePrompt(promptConfig) {
  return JSON.stringify({ prompt: promptConfig })
}
