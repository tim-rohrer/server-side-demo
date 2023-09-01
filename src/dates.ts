import { DateTime } from "luxon"

export const utcDayOffset = (
  localDay: number,
  localTime: string,
  localTZ: string,
) => {
  console.log(localTZ, ": ", getTimezoneOffset(localTZ) / 3600000)
  return 6
}

const getTimezoneOffset = (timeZone: string, date = new Date()) => {
  const tz = date
    .toLocaleString("en", { timeZone, timeStyle: "long" })
    .split(" ")
    .slice(-1)[0]
  console.log(tz)
  const dateString = date.toString()
  console.log(dateString)
  const offset =
    Date.parse(`${dateString} UTC`) - Date.parse(`${dateString} ${tz}`)

  // return UTC offset in millis
  return offset
}

export const getOffset = (tz: string, dateTime: string) => {
  const rep = DateTime.fromISO(dateTime, { zone: tz })
  return rep.offset
}

export const dstAware = (time: string, tz: string) => {
  const localTimeParts = time.split(":")
  const now = DateTime.now()
  const date = {
    year: now.year,
    month: now.month,
    day: now.day,
    hour: Number(localTimeParts[0]),
    minute: Number(localTimeParts[1]),
  }
  return DateTime.fromObject(date, { zone: tz })
}

export const nextOccurrenceLocal = (
  dayOfWeek: number,
  dateTime: Date = new Date(),
) => {
  const d = new Date(dateTime)
  d.setDate(d.getDate() + ((dayOfWeek + (7 - d.getDay())) % 7))
  return d
}
