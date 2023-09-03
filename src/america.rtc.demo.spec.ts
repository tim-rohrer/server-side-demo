import type { Db, MongoClient } from "mongodb"
import { nanoid } from "nanoid"

import { jest } from "@jest/globals"

import { createTestView } from "./createTestView.js"
import { mongoClient, preppedData, TestData } from "./helpers/dataSetup.js"

let connection: MongoClient
let db: Db

beforeAll(async () => {
  connection = await mongoClient().connect()
  db = connection.db("rtc")
})

beforeEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  connection.close()
  jest.useRealTimers()
})

async function setupDatabase(data: TestData[]) {
  await db.collection("events").insertMany(preppedData(data))
}

async function resetDatabase() {
  await db.collection("events").deleteMany({})
}

test("Event at 2200L in New York on Sunday outside of DST has RTC of 1:03:00", async () => {
  jest.setSystemTime(new Date("2023-02-01"))
  const testView = nanoid() // Each view needs a unique name for testing
  const testEvent = [
    {
      name: "Su-2200", // 0300Z on Monday; in DST 0200Z on Monday
      time: "22:00",
      day: 0,
      timezone: "America/New_York",
    },
  ]
  await setupDatabase(testEvent)
  await createTestView(db, testView)

  expect((await db.collection(testView).find({}).toArray())[0].rtc).toBe(
    "1:03:00"
  )
})

test("Event at 1500L in New York on Sunday, outside of DST, has RTC of 7:20:00", async () => {
  jest.setSystemTime(new Date("2023-02-01"))
  const testView = nanoid()
  const testEvent = [
    {
      name: "Su-1500", // 20:00Z on Sunday
      time: "15:00",
      day: 0,
      timezone: "America/New_York",
    },
  ]
  await setupDatabase(testEvent)
  await createTestView(db, testView)

  expect((await db.collection(testView).find({}).toArray())[0].rtc).toBe(
    "7:20:00"
  )
})

test("Event at 1500L in New York on Sunday, created outside of DST, has RTC of 7:19:00 during DST", async () => {
  const testView = nanoid()
  const testEvent = [
    {
      name: "Su-1500", // 20:00Z on Sunday
      time: "15:00",
      day: 0,
      timezone: "America/New_York",
    },
  ]
  jest.setSystemTime(new Date("2023-02-01"))
  await setupDatabase(testEvent)
  jest.setSystemTime(new Date("2023-07-01"))
  await createTestView(db, testView)

  expect((await db.collection(testView).find({}).toArray())[0].rtc).toBe(
    "7:19:00"
  )
})
