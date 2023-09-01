import { MongoClient } from "mongodb"

import { jest } from "@jest/globals"

import { dstAware, nextOccurrenceLocal } from "./dates.js"

let connection
let db

const setMockTime = (dateTime: string) => jest.setSystemTime(new Date(dateTime))

interface TestData {
  day: number
  time: string
  timezone: string
  name: string
}

beforeAll(async () => {
  jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] })
  connection = await MongoClient.connect(globalThis.__MONGO_URI__)
  db = connection.db(globalThis.__MONGO_DB_NAME__)
  await resetDatabase()
  await setupDatabase(testEvents)
})

afterAll(async () => {
  await connection.close()
  jest.useRealTimers()
})

async function setupDatabase(data: TestData[]) {
  const prepped_data = data.map((d) => {
    const updated = dstAware(d.time, d.timezone).toJSDate()
    return {
      ...d,
      entered: new Date(),
      startDateUTC: nextOccurrenceLocal(d.day, updated),
    }
  })

  await db.collection("events").insertMany(prepped_data)
}

const testEvents = [
  {
    name: "Su-1830", // 2330Z; in DST 22:30Z
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
]

async function resetDatabase() {
  const collections = await db.listCollections().toArray()
  collections.forEach(
    async (coll: { name: any }) => await db.collection(coll.name).drop()
  )
  await db.collection("events").deleteMany({})
}

test("Outside of DST, sorted order should match winterOrder", async () => {
  const winterOrder = ["Su-1500", "Su-2300", "Su-1830", "Su-1645", "Su-2200"]
  jest.setSystemTime(new Date("2023-02-01"))
  await db.createCollection("winter", {
    viewOn: "events",
    pipeline: [
      {
        $addFields: {
          adjustedUTC: {
            $dateFromParts: {
              year: new Date().getUTCFullYear(),
              month: {
                $add: [new Date().getUTCMonth(), 1],
              },
              day: new Date().getUTCDate(),
              hour: {
                $hour: {
                  date: "$startDateUTC",
                  timezone: "$timezone",
                },
              },
              minute: {
                $minute: "$startDateUTC",
              },
              timezone: "$timezone",
            },
          },
          dayOfWeekStr: {
            $toString: {
              $subtract: [
                {
                  $toInt: {
                    $dateToString: {
                      date: "$startDateUTC",
                      format: "%w",
                    },
                  },
                },
                1,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          dayStr: {
            $toString: "$day",
          },
          time: 1,
          timezone: 1,
          startDateUTC: 1,
          adjustedHour: {
            $hour: {
              date: "$startDateUTC",
              timezone: "$timezone",
            },
          },
          rtc: {
            $concat: [
              "$dayOfWeekStr",
              ":",
              {
                $dateToString: {
                  date: "$adjustedUTC",
                  format: "%H:%M",
                },
              },
            ],
          },
        },
      },
      {
        $sort: {
          rtc: 1,
        },
      },
    ],
  })

  const resultWinter = await db.collection("winter").find({}).toArray()

  expect(resultWinter.map((e) => e.name)).toEqual(winterOrder)
})

test("During DST, sorted order should match summerOrder", async () => {
  const summerOrder = ["Su-1500", "Su-1830", "Su-2300", "Su-1645", "Su-2200"]
  setMockTime("2023-08-01T23:00:00.000Z") // 1900 EDT, summer
  await db.createCollection("summer", {
    viewOn: "events",
    pipeline: [
      {
        $addFields: {
          adjustedUTC: {
            $dateFromParts: {
              year: new Date().getUTCFullYear(),
              month: {
                $add: [new Date().getUTCMonth(), 1],
              },
              day: new Date().getUTCDate(),
              hour: {
                $hour: {
                  date: "$startDateUTC",
                  timezone: "$timezone",
                },
              },
              minute: {
                $minute: "$startDateUTC",
              },
              timezone: "$timezone",
            },
          },
          dayOfWeekStr: {
            $toString: {
              $subtract: [
                {
                  $toInt: {
                    $dateToString: {
                      date: "$startDateUTC",
                      format: "%w",
                    },
                  },
                },
                1,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          dayStr: {
            $toString: "$day",
          },
          time: 1,
          timezone: 1,
          startDateUTC: 1,
          adjustedHour: {
            $hour: {
              date: "$startDateUTC",
              timezone: "$timezone",
            },
          },
          rtc: {
            $concat: [
              "$dayOfWeekStr",
              ":",
              {
                $dateToString: {
                  date: "$adjustedUTC",
                  format: "%H:%M",
                },
              },
            ],
          },
        },
      },
      {
        $sort: {
          rtc: 1,
        },
      },
    ],
  })

  const resultSummer = await db.collection("summer").find({}).toArray()

  expect(resultSummer.map((e) => e.name)).toEqual(summerOrder)
})
