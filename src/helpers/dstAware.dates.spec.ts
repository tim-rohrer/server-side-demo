import { jest } from "@jest/globals"

import { dstAware } from "./dates.js"

jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] })

const setMockTime = (dateTime: string) => jest.setSystemTime(new Date(dateTime))

test("Generate DST-aware localized DateTime object for an event in LA during DST", () => {
  setMockTime("2023-08-11T23:00:00.000Z")

  const d = dstAware("15:00", "America/Los_Angeles")

  expect(d.isInDST).toBe(true)
  expect(d.toISO()).toEqual("2023-08-11T15:00:00.000-07:00")
})

test("Generate DST-aware localized DateTime object for an event in LA outside of DST", () => {
  setMockTime("2023-12-11T23:00:00.000Z")

  const d = dstAware("15:00", "America/Los_Angeles")

  expect(d.isInDST).toBe(false)
  expect(d.toISO()).toEqual("2023-12-11T15:00:00.000-08:00")
})

test("Generate DST-aware localized DateTime object for an event in Adelaide, Australia, during DST", () => {
  setMockTime("2023-12-01T12:30:00.000+10:30") // 12:30 local summer/DST in Adelaide, Australia

  const d = dstAware("11:00", "Australia/Adelaide")

  expect(d.isInDST).toBe(true)
  expect(d.toISO()).toEqual("2023-12-01T11:00:00.000+10:30")
})

test("Generate DST-aware localized DateTime object for an event in Adelaide, Australia, outside of DST", () => {
  setMockTime("2023-07-01T12:30:00.000+10:30") // 12:30 local summer/DST in Adelaide, Australia

  const d = dstAware("11:00", "Australia/Adelaide")

  expect(d.isInDST).toBe(false)
  expect(d.toISO()).toEqual("2023-07-01T11:00:00.000+09:30")
})
