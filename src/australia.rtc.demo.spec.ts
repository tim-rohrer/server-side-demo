import { Db, MongoClient } from "mongodb"
import { nanoid } from "nanoid"

import { jest } from "@jest/globals"

import { createTestView } from "./createTestView.js"
import { mongoClient, preppedData, TestData } from "./helpers/dataSetup.js"

let connection: MongoClient
let db: Db

beforeAll(async () => {
  connection = await mongoClient().connect()
  db = connection.db("australia")
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

test("Australia/Adelaide corrects minutes in RTC", async () => {
  const events = [
    {
      name: "Su-1830", // ACST +9:30 (09:00Z), ACDT +10:30 (08:00Z)
      time: "18:30",
      day: 0,
      timezone: "Australia/Adelaide",
    },
  ]
  jest.setSystemTime(new Date("2023-01-29")) // Sunday, January 29th, summer in Australia!
  const testView = nanoid()
  await setupDatabase(events)
  await createTestView(db, testView)

  const resultSummer = await db.collection(testView).find({}).toArray()

  expect(resultSummer[0].rtc).toEqual("7:08:00")
})
