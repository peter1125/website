# Website booking page

The scheduling page lives at `/schedule/` and is designed for a static Hugo/Wowchemy site.

## Change availability

Edit `static/booking/availability.json`:

- `timezone`: the timezone used for the published availability windows.
- `slotIntervalMinutes`: how often possible start times appear.
- `minimumNoticeHours`: hides slots that are too soon.
- `daysToShow`: how many days ahead visitors can see.
- `bufferMinutes`: blocks extra time before and after booked meetings.
- `meetingTypes`: meeting labels and allowed durations.
- `weeklyAvailability`: recurring windows by weekday.
- `unavailableDates`: full days to hide, in `YYYY-MM-DD` format in the owner timezone.
- `booked`: already-reserved meetings, using ISO timestamps, for example:

```json
{
  "start": "2026-05-06T16:00:00.000Z",
  "end": "2026-05-06T16:30:00.000Z"
}
```

## How bookings work

This is intentionally static-site friendly:

1. A visitor chooses a published slot.
2. The page generates an `.ics` calendar file in the browser.
3. The page opens a pre-filled email request to Peter.
4. After confirming, add the meeting to `booked` so the slot no longer appears.

Because the site has no server-side scheduler yet, a slot is not reserved until Peter confirms it and updates `availability.json`.

## Files

- `content/schedule/index.md`: Hugo page.
- `layouts/shortcodes/booking.html`: booking page markup.
- `static/booking/availability.json`: editable schedule configuration.
- `static/booking/booking.js`: slot calculation and `.ics` generation.
- `static/booking/booking.css`: page styling.
- `tests/booking.test.js`: Node unit tests for slot and ICS logic.
