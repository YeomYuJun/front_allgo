export function randomSites(n) {
  return Array.from({ length: n }, () => [Math.random(), Math.random()])
}

export function siteColor(i) {
  const sh = 0.1 + ((i % 7) / 7) * 0.5
  return [Math.round(sh * 175), Math.round(sh * 255), Math.round(sh * 40)]
}
