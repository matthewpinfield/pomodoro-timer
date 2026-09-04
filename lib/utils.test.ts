import { formatTime, getTaskDisplayColor, getTaskModeColor } from "./utils";
import type { Task } from "@/types/task";

describe("formatTime", () => {
  it("formats whole minutes and seconds with zero-padding", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(5)).toBe("00:05");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(600)).toBe("10:00");
  });

  it("clamps negative input to zero instead of showing a negative countdown", () => {
    expect(formatTime(-42)).toBe("00:00");
  });

  it("floors fractional seconds", () => {
    expect(formatTime(90.9)).toBe("01:30");
  });
});

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    name: "Test Task",
    goalTimeMinutes: 60,
    progressMinutes: 0,
    chartIndex: 3,
    isPriority: false,
    notes: [],
    ...overrides,
  };
}

describe("getTaskDisplayColor", () => {
  it("falls back to the neutral gray color when the task is missing", () => {
    expect(getTaskDisplayColor(null, false)).toBe("oklch(0.8 0.01 90)");
  });

  it("falls back to the neutral gray color when chartIndex is invalid", () => {
    expect(getTaskDisplayColor(makeTask({ chartIndex: 0 }), false)).toBe("oklch(0.8 0.01 90)");
  });

  it("returns a fallback color for a task with a valid chartIndex when no CSS vars are defined (jsdom)", () => {
    // jsdom has no stylesheet loaded, so getCssVariable's lookup fails and both
    // functions must fall through to their documented fallback rather than throwing.
    expect(getTaskDisplayColor(makeTask({ chartIndex: 3 }), false)).toBe("oklch(0.8 0.01 90)");
    expect(getTaskDisplayColor(makeTask({ chartIndex: 3 }), true)).toBe("oklch(0.8 0.01 90)");
  });
});

describe("getTaskModeColor", () => {
  it("falls back to the neutral gray color when the task is missing", () => {
    expect(getTaskModeColor(null, false, "work")).toBe("oklch(0.8 0.01 90)");
  });

  it("falls back to the neutral gray color for work/rest/base modes with no CSS vars defined", () => {
    const task = makeTask({ chartIndex: 5 });
    expect(getTaskModeColor(task, false, "work")).toBe("oklch(0.8 0.01 90)");
    expect(getTaskModeColor(task, false, "rest")).toBe("oklch(0.8 0.01 90)");
    expect(getTaskModeColor(task, false, "base")).toBe("oklch(0.8 0.01 90)");
  });
});
