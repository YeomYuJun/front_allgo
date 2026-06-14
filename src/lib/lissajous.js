function gcd(a, b) { return b ? gcd(b, a % b) : a }

export function reduceRatio(a, b) {
  const g = gcd(Math.abs(a), Math.abs(b)) || 1
  return [a / g, b / g]
}
