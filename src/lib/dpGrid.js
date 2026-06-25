/* Pure grid helpers for the DP lab. No canvas/DOM. */

/** Returns an n×n 2D array where every value is a random integer 1..9. */
export function randomGrid(n) {
  const grid = []
  for (let r = 0; r < n; r++) {
    const row = []
    for (let c = 0; c < n; c++) row.push(1 + Math.floor(Math.random() * 9))
    grid.push(row)
  }
  return grid
}

/** Cycles a cell value through 1..9: cycleValue(9) === 1, cycleValue(3) === 4. */
export function cycleValue(v) {
  return 1 + (v % 9)
}
