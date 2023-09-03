import { DateTime } from "luxon"

import { jest } from "@jest/globals"

import { nextOccurrence, Weekdays } from "./dates.js"

const setMockTime = (dateTime: string) => jest.setSystemTime(new Date(dateTime))

/**
 * GIVEN the day of the week (1-7, Monday start), a local time and the local timezone,
 * WHEN represented in UTC for today, processed with the day of the week,
 * THEN nextOccurrence will return the date the weekly sequence starts.
 */
test("nextOccurrence returns provided date if desired weekday same current weekday.", () => {
  // The local time we're entering the event in the database
  setMockTime("2023-08-29T22:36:00.000-08:00") // Tuesday @ 10:36pm in "America/Anchorage"
  // Represents dstAware output if the event is being held at 1500 ADT
  const eventTimeStampIfHeldToday = DateTime.fromISO(
    "2023-08-29T23:00:00.000Z",
    { zone: "America/Anchorage" }
  )

  expect(
    nextOccurrence(Weekdays.TUESDAY, eventTimeStampIfHeldToday).toJSDate()
  ).toEqual(new Date("2023-08-29T15:00:00.000-08:00"))
})

test("nextOccurrence returns six days later if event changed to Monday", () => {
  // The local time we're entering the event in the database
  setMockTime("2023-08-29T22:36:00.000-08:00") // Tuesday @ 10:36pm in "America/Anchorage"
  // Represents dstAware output if the event is being held at 1500 ADT
  const eventTimeStampIfHeldToday = DateTime.fromISO(
    "2023-08-29T23:00:00.000Z",
    { zone: "America/Anchorage" }
  )

  expect(
    nextOccurrence(Weekdays.MONDAY, eventTimeStampIfHeldToday).toJSDate()
  ).toEqual(new Date("2023-09-04T15:00:00.000-08:00"))
})

test("nextOccurrence returns the next day if event changed to Wednesday", () => {
  // The local time we're entering the event in the database
  setMockTime("2023-08-29T22:36:00.000-08:00") // Tuesday @ 10:36pm in "America/Anchorage"
  // Represents dstAware output if the event is being held at 1500 ADT
  const eventTimeStampIfHeldToday = DateTime.fromISO(
    "2023-08-29T23:00:00.000Z",
    { zone: "America/Anchorage" }
  )

  expect(
    nextOccurrence(Weekdays.WEDNESDAY, eventTimeStampIfHeldToday).toJSDate()
  ).toEqual(new Date("2023-08-30T15:00:00.000-08:00"))
})

test("nextOccurrence returns next day UTC if 2200 in New York", () => {
  setMockTime("2023-02-01T10:00:00.000-05:00") // Wed @ 10am on Feb 1st in New York
  // For a meeting that night, Wednesdays at 10pm in New York
  const eventTimeStampIfHeldToday = DateTime.fromISO(
    "2023-02-01T22:00:00.000-05:00",
    { zone: "America/New_York" }
  )

  expect(
    nextOccurrence(Weekdays.WEDNESDAY, eventTimeStampIfHeldToday).toJSDate()
  ).toEqual(new Date("2023-02-02T03:00:00Z"))
})
