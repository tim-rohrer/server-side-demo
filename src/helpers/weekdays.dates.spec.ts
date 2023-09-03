import { newWeekday } from "./dates"

test("Existing weekday 0 returns 7 (Sunday)", () => {
  expect(newWeekday(0)).toBe(7)
})

test("Existing weekday 6 returns 6 (Saturday)", () => {
  expect(newWeekday(6)).toBe(6)
})
