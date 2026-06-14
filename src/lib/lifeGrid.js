// 순수 그리드 헬퍼 (boolean[h][w]). 백엔드 페이로드와 동일한 행 우선(row-major) 구조.
export function createEmpty(w, h) {
  return Array.from({ length: h }, () => Array(w).fill(false))
}

export function randomGrid(w, h, density = 0.3) {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => Math.random() < density))
}

export function countPopulation(grid) {
  let p = 0
  for (const row of grid) for (const cell of row) if (cell) p++
  return p
}

export function cloneGrid(grid) {
  return grid.map((row) => row.slice())
}

// 글라이더(5셀)를 (r0,c0) 기준으로 배치
export function placeGlider(grid, r0, c0) {
  const cells = [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]]
  for (const [dr, dc] of cells) {
    const r = r0 + dr, c = c0 + dc
    if (grid[r] && grid[r][c] !== undefined) grid[r][c] = true
  }
  return grid
}
