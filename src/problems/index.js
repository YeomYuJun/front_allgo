import knapsack from './knapsack/index.js'
import classroom from './classroom/index.js'

// 문제 플러그인 정본. 새 문제는 모듈을 만들어 여기에 등록만 하면 된다 (docs/07 HOWTO 참조).
export const PROBLEMS = {
  [knapsack.id]: knapsack,
  [classroom.id]: classroom,
}
