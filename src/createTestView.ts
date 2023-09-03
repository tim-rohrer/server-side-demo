export async function createTestView(db, name: string) {
  await db.createCollection(name, {
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
                $minute: {
                  date: "$startDateUTC",
                  timezone: "$timezone",
                },
              },
              timezone: "$timezone",
            },
          },
          dayOfWeekStr: {
            $dateToString: {
              date: "$startDateUTC",
              format: "%u",
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
          adjustedUTC: 1,
          adjustedHour: {
            $hour: {
              date: "$startDateUTC",
              timezone: "$timezone",
            },
          },
          adjustedMinute: {
            $minute: {
              date: "$startDateUTC",
              timezone: "$timezone",
            },
          },
          dayOfWeekStr: 1,
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
}
