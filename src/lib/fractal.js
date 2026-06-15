export const TYPES = [
  { value: 'mandelbrot', label: 'Mandelbrot' },
  { value: 'julia', label: 'Julia' },
]

export const COLOR_SCHEMES = [
  { value: 'classic', label: 'Classic' },
  { value: 'rainbow', label: 'Rainbow' },
  { value: 'fire', label: 'Fire' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'grayscale', label: 'Grayscale' },
]

export const BASE_SPAN = 4.0 // BE FractalService.generate: type 무관 정사각 range = 4/zoom
export const DEFAULT_CENTER = { mandelbrot: { x: -0.6, y: 0 }, julia: { x: 0, y: 0 } }

export function span(zoom) { return BASE_SPAN / zoom }

export function defaultView(type) {
  const c = DEFAULT_CENTER[type] ?? DEFAULT_CENTER.mandelbrot
  return { centerX: c.x, centerY: c.y, zoom: 1 }
}

export function clampZoom(z) { return Math.max(1, Math.min(4096, z)) }
