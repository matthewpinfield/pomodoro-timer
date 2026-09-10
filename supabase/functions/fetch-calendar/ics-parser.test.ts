import { unfoldLines, parseDateTime, parseIcs, dateDigitsToIso, windowEndDigits } from "./ics-parser";

describe("dateDigitsToIso", () => {
  it("converts YYYYMMDD to YYYY-MM-DD", () => {
    expect(dateDigitsToIso("20260907")).toBe("2026-09-07");
  });
});

describe("windowEndDigits", () => {
  it("adds the given number of days ahead", () => {
    expect(windowEndDigits("20260907", 14)).toBe("20260921");
  });

  it("correctly rolls over a month boundary", () => {
    expect(windowEndDigits("20260925", 14)).toBe("20261009");
  });

  it("correctly rolls over a year boundary", () => {
    expect(windowEndDigits("20261225", 14)).toBe("20270108");
  });

  it("defaults to the standard 30-day window when not specified", () => {
    expect(windowEndDigits("20260907")).toBe(windowEndDigits("20260907", 30));
    expect(windowEndDigits("20260907")).toBe("20261007");
  });
});

describe("unfoldLines", () => {
  it("joins a folded continuation line back onto the previous line", () => {
    // Per RFC 5545, folding *inserts* a single whitespace marker without
    // consuming whatever character was already there - so a fold at a point
    // where the original text already had a space produces *two* whitespace
    // characters on the continuation line (the marker, then the original
    // space). Only the marker gets stripped, leaving the real content intact.
    const ics = "SUMMARY:A very long event title that got\n  folded across two lines";
    expect(unfoldLines(ics)).toEqual(["SUMMARY:A very long event title that got folded across two lines"]);
  });

  it("also unfolds a tab-marked continuation line", () => {
    const ics = "SUMMARY:Folded with a\n\t tab-marked fold";
    expect(unfoldLines(ics)).toEqual(["SUMMARY:Folded with a tab-marked fold"]);
  });

  it("leaves normal, unfolded lines alone", () => {
    const ics = "BEGIN:VEVENT\nSUMMARY:Standup\nEND:VEVENT";
    expect(unfoldLines(ics)).toEqual(["BEGIN:VEVENT", "SUMMARY:Standup", "END:VEVENT"]);
  });
});

describe("parseDateTime", () => {
  it("parses a UTC (Z-suffixed) datetime", () => {
    const result = parseDateTime("20260315T090000Z");
    expect(result?.dateDigits).toBe("20260315");
    expect(result?.epochMs).toBe(Date.UTC(2026, 2, 15, 9, 0, 0));
  });

  it("parses a datetime with a TZID parameter's value (the parameter itself is stripped by the caller)", () => {
    // By the time this reaches parseDateTime, the ";TZID=..." parameter has
    // already been stripped from the key by parseIcs - only the raw
    // YYYYMMDDTHHMMSS value ever reaches this function.
    const result = parseDateTime("20260315T090000");
    expect(result?.dateDigits).toBe("20260315");
  });

  it("returns null for an all-day (date-only, no time) value", () => {
    expect(parseDateTime("20260315")).toBeNull();
  });

  it("returns null for garbage input", () => {
    expect(parseDateTime("not-a-date")).toBeNull();
  });
});

describe("parseIcs", () => {
  it("extracts a single event's uid, summary, and duration", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:event-1@example.com",
      "SUMMARY:Team standup",
      "DTSTART:20260315T090000Z",
      "DTEND:20260315T091500Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const events = parseIcs(ics);
    expect(events).toEqual([
      { uid: "event-1@example.com", summary: "Team standup", dateDigits: "20260315", durationMinutes: 15 },
    ]);
  });

  it("parses multiple events from the same feed independently", () => {
    const ics = [
      "BEGIN:VEVENT",
      "UID:event-1",
      "SUMMARY:Standup",
      "DTSTART:20260315T090000Z",
      "DTEND:20260315T091500Z",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:event-2",
      "SUMMARY:1:1",
      "DTSTART:20260315T140000Z",
      "DTEND:20260315T143000Z",
      "END:VEVENT",
    ].join("\r\n");

    const events = parseIcs(ics);
    expect(events).toHaveLength(2);
    expect(events[0].uid).toBe("event-1");
    expect(events[1].uid).toBe("event-2");
    expect(events[1].durationMinutes).toBe(30);
  });

  it("strips parameters from keys, e.g. DTSTART;TZID=... is still read as DTSTART", () => {
    const ics = [
      "BEGIN:VEVENT",
      "UID:event-1",
      "SUMMARY:Standup",
      "DTSTART;TZID=America/New_York:20260315T090000",
      "DTEND;TZID=America/New_York:20260315T091500",
      "END:VEVENT",
    ].join("\r\n");

    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].durationMinutes).toBe(15);
  });

  it("skips all-day events (no meaningful duration)", () => {
    const ics = [
      "BEGIN:VEVENT",
      "UID:event-1",
      "SUMMARY:Company holiday",
      "DTSTART;VALUE=DATE:20260315",
      "DTEND;VALUE=DATE:20260316",
      "END:VEVENT",
    ].join("\r\n");

    expect(parseIcs(ics)).toEqual([]);
  });

  it("skips a VEVENT missing a UID (nothing stable to dedupe re-syncs against)", () => {
    const ics = [
      "BEGIN:VEVENT",
      "SUMMARY:No uid here",
      "DTSTART:20260315T090000Z",
      "DTEND:20260315T091500Z",
      "END:VEVENT",
    ].join("\r\n");

    expect(parseIcs(ics)).toEqual([]);
  });

  it("defaults to 'Untitled event' when SUMMARY is missing", () => {
    const ics = [
      "BEGIN:VEVENT",
      "UID:event-1",
      "DTSTART:20260315T090000Z",
      "DTEND:20260315T091500Z",
      "END:VEVENT",
    ].join("\r\n");

    expect(parseIcs(ics)[0].summary).toBe("Untitled event");
  });

  it("handles a folded SUMMARY line correctly end to end", () => {
    const ics = [
      "BEGIN:VEVENT",
      "UID:event-1",
      "SUMMARY:A very long meeting title that got",
      "  folded across two physical lines", // 2 leading spaces: fold marker + real content space
      "DTSTART:20260315T090000Z",
      "DTEND:20260315T091500Z",
      "END:VEVENT",
    ].join("\r\n");

    expect(parseIcs(ics)[0].summary).toBe("A very long meeting title that got folded across two physical lines");
  });
});
