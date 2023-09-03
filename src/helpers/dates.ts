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
  const adjustedDayOfWeek = dayOfWeek
  const advance = (adjustedDayOfWeek + (7 - dateTime.get("weekday"))) % 7
  const newOrdinalDate = dateTime.ordinal + advance
  return dateTime.set({ ordinal: newOrdinalDate })
}
