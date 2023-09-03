import { MongoClient } from "mongodb"

import { dstAware, newWeekday, nextOccurrence } from "./dates"

export interface TestData {
  day: number
  time: string
  timezone: string
  name: string
}

export const mongoClient = () =>
  new MongoClient(process.env.MONGO_URI || "broken")

export const preppedData = (data: TestData[]) =>
  data.map((d) => {
    const updated = dstAware(d.time, d.timezone)
    const weekday = newWeekday(d.day)
    return {
      name: d.name,
      day: weekday,
      time: d.time,
      timezone: d.timezone,
      entered: new Date(),
      startDateUTC: nextOccurrence(weekday, updated),
    }
  })
