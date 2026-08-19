const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function toDate(value: Date | number | string) {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: Date | number | string): string {
  return dateFormatter.format(toDate(value));
}

export function formatDateTime(value: Date | number | string): string {
  return dateTimeFormatter.format(toDate(value));
}

/** `Jan 5` style in the environment’s local timezone (no year). */
const shortMonthDayFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
});

export function formatShortMonthDay(value: Date | number | string): string {
  return shortMonthDayFormatter.format(toDate(value));
}

/**
 * Interprets `isoDate` as a calendar day in UTC (`YYYY-MM-DD`) and returns `Mon`, `Tue`, …
 * for chart ticks.
 */
export function formatUtcWeekdayShortFromIsoDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(
    new Date(`${isoDate}T12:00:00.000Z`),
  );
}

/**
 * Interprets `isoDate` as a calendar day in UTC and returns `Apr 28`-style text for tooltips.
 */
export function formatShortMonthDayUtcFromIsoDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00.000Z`));
}

/** Hour in `timeZone` (0–23) for the given instant, using a 24-hour clock. */
export function getHourInTimeZone(timeZone: string, date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone,
  }).formatToParts(date);
  const raw = parts.find((p) => p.type === "hour")?.value ?? "0";
  return Number.parseInt(raw, 10);
}

/** Greeting word for the given local hour bucket in `timeZone`. */
export function getTimeOfDayGreetingForTimeZone(
  timeZone: string,
  date: Date = new Date(),
): "Afternoon" | "Evening" | "Morning" {
  const hour = getHourInTimeZone(timeZone, date);
  if (hour >= 5 && hour < 12) {
    return "Morning";
  }
  if (hour >= 12 && hour < 17) {
    return "Afternoon";
  }
  return "Evening";
}

export function toStartOfDayIso(date: Date): string {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next.toISOString();
}

export function toEndOfDayIso(date: Date): string {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next.toISOString();
}
