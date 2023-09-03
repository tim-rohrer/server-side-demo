import { DateTime } from "luxon"

import { jest } from "@jest/globals"

import { nextOccurrence, Weekdays } from "./dates.js"

const setMockTime = (dateTime: string) => jest.setSystemTime(new Date(dateTime))

test("nextOccurrence returns same date if desired weekday same as current weekday", () => {
  /**
   * GIVEN a lovely summer day in Adelaide, Australia, at half past local noon
   *  on Friday, December 1, 2023,
   * WHEN a joyful web servant enters a new meeting being held on Fridays,
   *  that she just attended at 11a local,
   * THEN we'd expect the first occurrence of said meeting to show as December the 1st,
   *  at 00:30Z
   */
  setMockTime("2023-12-01T12:30:00.000+10:30") // 12:30 local "Australia/Adelaide"

  const meetingTimeStampIfHeldToday = DateTime.fromISO("2023-12-01T11", {
    zone: "Australia/Adelaide",
  }) // Output from dstAware function if the event is being held at 1100 ACDT

  const result = nextOccurrence(Weekdays.FRIDAY, meetingTimeStampIfHeldToday)

  expect(result.toJSDate()).toEqual(new Date("2023-12-01T11:00:00.000+10:30"))
})

test("If day of the week is changed to Thursdays (4) then nextOccurrence should be six days later", () => {
  setMockTime("2023-12-01T12:30:00.000+10:30") // 12:30 local "Australia/Adelaide"

  const meetingTimeStampIfHeldToday = DateTime.fromISO("2023-12-01T11", {
    zone: "Australia/Adelaide",
  })
  // Output from dstAware function if the event is being held at 1100 ACDT

  expect(
    nextOccurrence(Weekdays.THURSDAY, meetingTimeStampIfHeldToday).toJSDate()
  ).toEqual(new Date("2023-12-07T11:00:00.000+10:30"))
})
