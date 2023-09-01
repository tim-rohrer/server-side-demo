import { jest } from "@jest/globals"

import { dstAware, nextOccurrenceLocal } from "./dates.js"

jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] })

const setMockTime = (dateTime: string) => jest.setSystemTime(new Date(dateTime))

test("Generate DST-aware localized DateTime object for a meeting in LA during DST", () => {
  setMockTime("2023-08-11T23:00:00.000Z")

  const d = dstAware("15:00", "America/Los_Angeles")

  expect(d.isInDST).toBe(true)
  expect(d.toISO()).toEqual("2023-08-11T15:00:00.000-07:00")
})

test("Generate DST-aware localized DateTime object for a meeting in LA outside of DST", () => {
  setMockTime("2023-12-01T23:00:00.000Z")

  const d = dstAware("15:00", "America/Los_Angeles")

  expect(d.isInDST).toBe(false)
  expect(d.toISO()).toEqual("2023-12-01T15:00:00.000-08:00")
})

/** GIVEN the day of the week (0-6, Sunday start), a local time and the local timezone,
 * WHEN represented in UTC for today, processed with the day of the week,
 * THEN nextOccurrenceLocal will return the date the weekly sequence starts.
 */
test("nexOccurrenceLocal returns provided date if that day of the week", () => {
  // The local time we're entering the meeting in the database
  setMockTime("2023-08-29T22:36:00.000-08:00") // "America/Anchorage"

  const meetingTimeStampIfHeldToday = new Date("2023-08-29T23:00:00.000Z") // Output from dstAware function if the event is being held at 1500 ADT

  expect(nextOccurrenceLocal(2, meetingTimeStampIfHeldToday)).toEqual(
    new Date("2023-08-29T15:00:00.000-08:00")
  )
  // Friday
  expect(nextOccurrenceLocal(5, meetingTimeStampIfHeldToday)).toEqual(
    new Date("2023-09-01T15:00:00.000-08:00")
  )

  // Tues, but using now() time (mocked) vice provided
  expect(nextOccurrenceLocal(2)).toEqual(
    new Date("2023-08-29T22:36:00.000-08:00")
  )
  // Wednesday
  expect(nextOccurrenceLocal(3)).toEqual(
    new Date("2023-08-30T22:36:00.000-08:00")
  )
})
