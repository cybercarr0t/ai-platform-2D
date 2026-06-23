/**
 * 公共基础 prompt：网格布局 + 每行一组动画
 */
function buildBasePrompt(description, columns, rows) {
  return [
    `Generate a pixel-art sprite sheet of ${description}.`,
    `The sprite sheet is arranged in a grid of ${columns} columns and ${rows} rows,`,
    `totaling ${columns * rows} frames.`,
    `Each row represents one animation sequence, with frames progressing from left to right within that row.`,
  ]
}

/**
 * 横版视角 sprite sheet 生成 prompt
 *
 * 侧视视角，角色面向左/右
 */
export function buildSideViewPrompt(description, columns, rows) {
  return [
    ...buildBasePrompt(description, columns, rows),
    `Side-view perspective, character faces left or right.`,
    `Each frame shows a different side-view animation pose.`,
    `Consistent character scale across all frames.`,
    `Clean outlines, flat shading, uniform lighting.`,
    `Background MUST be pure white (#FFFFFF), fully opaque, with no gradients, no transparency, no patterns. This is required for automated sprite extraction.`,
    `Evenly spaced grid with no overlapping frames.`,
  ].join(' ')
}

/**
 * 俯视 8 方向 sprite sheet 生成 prompt
 *
 * 俯视视角，支持 8 个移动方向
 */
export function buildTopDownPrompt(description, columns, rows) {
  const directions = [
    'up', 'up-right', 'right', 'down-right',
    'down', 'down-left', 'left', 'up-left',
  ]
  return [
    ...buildBasePrompt(description, columns, rows),
    `Top-down / overhead perspective, bird's-eye view.`,
    `The character supports 8 movement directions: ${directions.join(', ')}.`,
    `Each frame captures a different direction or pose from the top-down view.`,
    `Consistent character scale across all frames.`,
    `Clean outlines, flat shading, uniform lighting.`,
    `Background MUST be pure white (#FFFFFF), fully opaque, with no gradients, no transparency, no patterns. This is required for automated sprite extraction.`,
    `Evenly spaced grid with no overlapping frames.`,
  ].join(' ')
}
