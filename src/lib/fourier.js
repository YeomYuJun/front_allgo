export function idealWave(type, t) {
  if (type === 'saw') {
    const m = ((((t + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI
    return m / Math.PI
  }
  if (type === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(t))
  return Math.sign(Math.sin(t))
}
