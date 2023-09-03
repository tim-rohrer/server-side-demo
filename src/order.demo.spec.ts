import { Db, MongoClient } from "mongodb"

import { jest } from "@jest/globals"

import { createTestView } from "./createTestView.js"
import { mongoClient, preppedData } from "./helpers/dataSetup.js"

let connection: MongoClient
let db: Db

const setMockTime = (dateTime: string) => jest.setSystemTime(new Date(dateTime))

interface TestData {
  day: number
  time: string
  timezone: string
  name: string
}

beforeAll(async () => {
  jest.setSystemTime(new Date("2023-02-01"))
  connection = await mongoClient().connect()
  db = connection.db("demo")
  await resetDatabase()
  await setupDatabase(testEvents)
})

afterAll(async () => {
  await connection.close()
  jest.useRealTimers()
})

async function setupDatabase(data: TestData[]) {
  await db.collection("events").insertMany(preppedData(data))
}

const testEvents = [
  {
    name: "Su-1830-NY", // 2330Z; in DST 22:30Z
    time: "18:30",
    day: 0,
    timezone: "America/New_York",
  },
  {
    name: "Su-2300", // 2300Z
    time: "23:00",
    day: 0,
    timezone: "Atlantic/Reykjavik",
  },
  {
    name: "Su-1645", // 2345Z
    time: "16:45",
    day: 0,
    timezone: "America/Phoenix",
  },
  {
    name: "Su-2200", // 0300Z on Monday; in DST 0200Z on Monday
    time: "22:00",
    day: 0,
    timezone: "America/New_York",
  },
  {
    name: "Su-1500", // 2000Z; in DST 1900Z
    time: "15:00",
    day: 0,
    timezone: "America/New_York",
  },
  {
    name: "Su-1830-Aus", // ACST +9:30 (09:00Z), ACDT +10:30 (08:00Z)
    time: "18:30",
    day: 0,
    timezone: "Australia/Adelaide",
  },
]

async function resetDatabase() {
  const collections = await db.listCollections().toArray()
  collections.forEach(
    async (coll: { name: any }) => await db.collection(coll.name).drop()
  )
  await db.collection("events").deleteMany({})
}

test("Outside of US DST, sorted order should match winterOrder", async () => {
  const winterOrder = [
    "Su-2200",
    "Su-1830-Aus",
    "Su-1500",
    "Su-2300",
    "Su-1830-NY",
    "Su-1645",
  ]
  await createTestView(db, "winter")

  const resultWinter = await db.collection("winter").find({}).toArray()

  expect(resultWinter.map((event) => event.name)).toEqual(winterOrder)
})

test("During US DST, sorted order should match summerOrder", async () => {
  const summerOrder = [
    "Su-2200",
    "Su-1830-Aus",
    "Su-1500",
    "Su-1830-NY",
    "Su-2300",
    "Su-1645",
  ]
  setMockTime("2023-08-01T23:00:00.000Z") // 1900 EDT, Shift to US summer, DST
  await createTestView(db, "summer")

  const resultSummer = await db.collection("summer").find({}).toArray()

  expect(resultSummer.map((event) => event.name)).toEqual(summerOrder)
})
