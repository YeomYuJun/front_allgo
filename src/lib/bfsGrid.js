/* Pure grid helpers for the BFS lab. No canvas/DOM. */

export function idx(r, c, cols) {
  return r * cols + c
}

export function inBounds(r, c, rows, cols) {
  return r >= 0 && r < rows && c >= 0 && c < cols
}

export function emptyWalls(rows, cols) {
  return new Array(rows * cols).fill(false)
}

export function randomMaze(rows, cols, density, start, goal) {
  const walls = new Array(rows * cols)
  for (let i = 0; i < walls.length; i++) walls[i] = Math.random() < density
  walls[start] = false
  walls[goal] = false
  return walls
}
