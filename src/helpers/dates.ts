import { DateTime } from "luxon"

export const dstAware = (time: string, tz: string) => {
  const localTimeParts = time.split(":")
  const now = DateTime.utc()
  const date = {
    year: now.year,
    month: now.month,
    day: now.day,
    hour: Number(localTimeParts[0]),
    minute: Number(localTimeParts[1]),
  }

  return DateTime.fromObject(date, { zone: tz })
}

export enum Weekdays {
  MONDAY = 1,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
  SUNDAY,
}

const prevWeekdays = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
}

export const newWeekday = (previous: number) =>
  Weekdays[prevWeekdays[previous]] as unknown as Weekdays

export const nextOccurrence = (dayOfWeek: Weekdays, dateTime: DateTime) => {
  // console.log("Meeting time if held today: ", dateTime)
  // const currentWeekday = dateTime.weekday
  // console.log("And the desired local day of the week: ", dayOfWeek)
  // console.log("Day of the month (UTC): ", dateTime.get("day"))
  // console.log("Day of the month (local)", date)
  // console.log(currentWeekday)
  //   "Day of the year Adelaide: ",
  //   dateTime.setZone("Australia/Adelaide").ordinal
  // )
  // console.log(dateTime.getUTCDay(), dateTime.getDay())
  // // Because dayOfWeek is not in UTC land, we need to adjust it if necessary
  const adjustedDayOfWeek = dayOfWeek // + dateTime.setZone("UTC").ordinal - dateTime.ordinal
  // console.log(adjustedDayOfWeek)
  const advance = (adjustedDayOfWeek + (7 - dateTime.get("weekday"))) % 7
  // console.log(advance)
  const newOrdinalDate = dateTime.ordinal + advance
  // dateTime.setUTCDate(dateTime.getUTCDate() + advance)
  // console.log(dateTime.set({ordinal: advance}))
  return dateTime.set({ ordinal: newOrdinalDate })
}

/** Original using Date */
// export const nextOccurrence = (dayOfWeek: number, dateTime: Date) => {
//   console.log("Meeting time if held today: ", dateTime)
//   console.log("Day of the month (UTC): ", dateTime.getUTCDate())
//   console.log(dateTime.getUTCDay(), dateTime.getDay())
//   // Because dayOfWeek is not in UTC land, we need to adjust it if necessary
//   const adjustedDayOfWeek = dayOfWeek + dateTime.getUTCDay() - dateTime.getDay()
//   const advance = (adjustedDayOfWeek + (7 - dateTime.getUTCDay())) % 7
//   console.log(advance)
//   dateTime.setUTCDate(dateTime.getUTCDate() + advance)
//   console.log(dateTime)
//   return dateTime
// }
