export function spawn(field) {
  return [Math.random() * field, Math.random() * field]
}

export function outOfBounds(x, y, field) {
  return x < 0 || x > field || y < 0 || y > field
}
