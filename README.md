# server-side-demo

Demo of how DST can be accounted for with recurring events that don't have specific dates

## Problem

Recurring events identified by a local time, day of the week and a timezone are hard to put in chronological order because, without a specific date reference, it is challenging to know if daylight savings time is in effect. This has typically resulted in processing the list of events on the client's computer providing the local time and timezone of the event. This does work although there are drawbacks related to transfer sizes of the data and performance hits since all data processed on the client.

A potential solution is to take advantage of server-side processing to sort and filter events so that only the relevant set is transferred to the client for formatting and display. To accomplish this, a consistent way (think UTC/Zulu) is needed to sort the data (essential to present the user with the next X events matching criteria Y and Z) regardless of timezone and daylight savings time observance at the event host's location. This isn't trivial:

| Name | Time   | TZ                 | Offset <br> non-DST | Offset <br> DST |
| :--- | :----- | :----------------- | :------------------ | :-------------- |
| E1   | 6:30pm | America/New_York   | -5                  | -4              |
| E2   | 11pm   | Atlantic/Reykjavik | 0                   | 0               |

[Note] The Atlantic/Reykjavik timezone follows UTC without observing DST.

First question: Was DST in effect when the E1 was entered? From the local view of the world, 6:30pm is 6:30pm regardless of whether or not DST is in effect. The very next question is whether or not DST is in effect when the event needs to be sorted?

The answers are crucial because a UTC-like timestamp is needed as the basis for sorting events on the server. Assume both events were entered on March 1, 2023. The UTC time for E1 is 18:30 _EST_ + 5 hours = 23:30Z. In sorting the events on March 2, the order would be E2, then E1. So let's capture UTC in the dataset.

| Name | Time   | TZ                 | Offset <br> non-DST | Offset <br> DST | UTC                           |
| :--- | :----- | :----------------- | :------------------ | :-------------- | :---------------------------- |
| E1   | 6:30pm | America/New_York   | -5                  | -4              | 2023-03-01T23:30:00.000-00:00 |
| E2   | 11pm   | Atlantic/Reykjavik | 0                   | 0               | 2023-03-01T23:00:00.000-00:00 |

Splendid. But wait! On March 31st, The event in New York is now held at 6:30pm **EDT** (i.e., DST is in effect and the correct offset should be -4). The event time, relative to host locations that did not shift to DST in the US (i.e., Phoenix) should be listed an hour earlier to still be 6:30pm. During DST, the correct UTC time for E1 _should_ be 22:30Z, and the sorted order E1 followed by E2.

Possible solutions discussed so far have include some form or rewriting the database every few hours to update the recorded UTC of each event. This sounds expensive.

This demo shows a potential solution that involves MongoDB Views and a feature their database engine provides.

## Experiment

MongoDB provides the [`$hour`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/hour/) expression for use in the [Aggregation feature](https://www.mongodb.com/docs/manual/reference/operator/aggregation/). The beauty of the `$hour` expression is that it accounts for DST if provided a timezone. This precludes the code from needing to track daylight savings time adjustments to timezone offsets, making the problem much easier to solve.

If a timestamp noting the effective first occurrence of a event is recorded in the database, the `$hour` expression can be used in a created View to return the hour portion adjusted for daylight savings time. Basic example:

| DST in <br> effect | Code                                                                                                          | Output |
| :----------------- | :------------------------------------------------------------------------------------------------------------ | :----- |
| Yes                | <pre>"$hour": { <br> &nbsp;date: new Date("August 14, 2023Z"), <br> &nbsp;timezone: "America/New_York" <br>}  | 20     |
| No                 | <pre>"$hour": { <br> &nbsp;date: new Date("November 14, 2023Z"),<br> &nbsp;timezone: "America/New_York" <br>} | 19     |

`new Date()` without a time uses midnight Zulu, and so `-4` is the correct offset for EDT and `-5` for EST.

We can use our current timestamp `new Date()` and the original timestamp reflecting the first occurrence of the event to generate an adjusted UTC.

Non-optimized code for the aggregation pipeline, probably an [`$addFields` expression](https://www.mongodb.com/docs/v7.0/reference/operator/aggregation/addFields/).

```json
{
  adjustedUTC: { $dateFromParts: {
    "year": ISODate().getUTCFullYear(),
    "month": { $add: [ISODate().getUTCMonth(), 1]},
    "day": ISODate().getUTCDate(),
    "hour": { $hour:
      {
        date: "$startDateUTC",
        timezone: "$timezone"
      }
    },
    "minute": { $minute: "$startDateUTC"},
    "timezone": "$timezone"
  }}
}
```

But, we don't want the entire date from the timestamp, as sorting by date isn't accurate for our purpose. What we do want is the day of the week for this event to preface the adjusted UTC time. We simply want something sortable that includes the day of the week: `d:H:M`...and we might call this Coordinated Recovery Time (RTC) :-)

As long as we've recorded the UTC datetime of the first event in the series, we can use this to determine the correct UTC day of the week, and then build RTC for sorting. When a event is first saved, `startDateUTC` can be calculated to match the date of the first event and its time in UTC.Some examples:

| TZ               | Time  | Day    | Date Entered | `startDateUTC`                |
| :--------------- | :---- | :----- | :----------- | :---------------------------- |
| America/New_York | 15:00 | Sunday | Mar 1, 2023  | 2023-03-05T20:00:00.000-00:00 |
| America/New_York | 22:00 | Sunday | Mar 1, 2023  | 2023-03-06T03:00:00.000-00:00 |

The entire MongoDB aggregation pipeline used to create the View is in the `demo.spec.ts` file. The first stage of the pipeline is an `$addFields` which calculates `adjustedUTC` and a _corrected_[^1] day of the week for the View. This along with the rest of the data is passed into the second stage (`$project`) where RTC is generated. In the third and final stage, the data is sorted by RTC (although an index based on RTC might be better).

[^1]: MongoDB uses 1-7 to reflect days of the week vice 0-6. Alternatively, the original set of data could start using 1-7 but this would result in other code changes, or adjustment sometime before providing the data to the client.
