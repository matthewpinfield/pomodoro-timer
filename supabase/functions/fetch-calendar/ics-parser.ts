// Pure ICS parsing logic, deliberately kept free of any Deno-specific APIs
// (no Deno.serve/Deno.env here) so it can be unit tested directly under
// Jest/Node, not just verified live once deployed to the Deno runtime.
//
// Does NOT do real timezone conversion - FocusPie only needs an event's
// duration (end - start, correct regardless of timezone, since both share
// the same interpretation) and which day it falls on, not its exact
// wall-clock time. The caller supplies its own local "today" (as YYYYMMDD)
// rather than this module computing "today" itself, which would use
// whichever timezone the parsing code happens to run in instead of the
// user's.

export interface ParsedEvent {
  uid: string;
  summary: string;
  dateDigits: string; // YYYYMMDD, from DTSTART
  durationMinutes: number;
}

// ICS allows long lines to be "folded" across multiple physical lines, where
// continuation lines start with a single space or tab - must be undone
// before parsing key:value pairs, or a folded line reads as garbage.
export function unfoldLines(icsText: string): string[] {
  const rawLines = icsText.split(/\r\n|\n|\r/);
  const lines: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

// Returns null for all-day events (date-only, no "T" time component) -
// deliberately skipped, since a 24h "duration" isn't a meaningful task.
export function parseDateTime(value: string): { epochMs: number; dateDigits: string } | null {
  if (!value.includes("T")) return null;
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  const dateDigits = `${y}${mo}${d}`;
  const epochMs = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  return { epochMs, dateDigits };
}

export function parseIcs(icsText: string): ParsedEvent[] {
  const lines = unfoldLines(icsText);
  const events: ParsedEvent[] = [];
  let current: Record<string, string> | null = null;

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      current = {};
    } else if (line.startsWith("END:VEVENT")) {
      if (current) {
        const uid = current["UID"];
        const summary = current["SUMMARY"] || "Untitled event";
        const dtstartRaw = current["DTSTART"];
        const dtendRaw = current["DTEND"];
        if (uid && dtstartRaw && dtendRaw) {
          const start = parseDateTime(dtstartRaw);
          const end = parseDateTime(dtendRaw);
          if (start && end) {
            const durationMinutes = Math.round((end.epochMs - start.epochMs) / 60000);
            if (durationMinutes > 0) {
              events.push({ uid, summary, dateDigits: start.dateDigits, durationMinutes });
            }
          }
        }
      }
      current = null;
    } else if (current) {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      // Strip parameters (e.g. "DTSTART;TZID=America/New_York") - keep the base key only.
      const baseKey = line.slice(0, colonIdx).split(";")[0].toUpperCase();
      current[baseKey] = line.slice(colonIdx + 1);
    }
  }
  return events;
}
