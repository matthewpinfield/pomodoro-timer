import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { SettingsProvider } from "./settings-context";
import { TaskProvider, useTasks } from "./task-context";
import { TimerProvider, useTimer } from "./timer-context";

// The tick loop drives itself via requestAnimationFrame, passing a timestamp on
// each call. Rather than relying on real timers, we take over rAF entirely so
// tests can inject exact timestamp jumps - including the large single jump a
// throttled/backgrounded tab produces, which is exactly what exposed the
// per-minute progress under-counting bug this suite guards against.
let rafCallback: ((ts: number) => void) | null = null;

// Non-zero starting timestamp: the tick loop's lastTickRef check (`!lastTickRef.current`)
// treats 0 as "unset" just like null, so a first frame at exactly 0 would be
// mistaken for a fresh start on every subsequent frame too.
const BASE_TS = 1_000;

function fireFrame(timestamp: number) {
  const cb = rafCallback;
  if (!cb) throw new Error("Expected a queued requestAnimationFrame callback but found none");
  rafCallback = null;
  act(() => {
    cb(timestamp);
  });
}

let rafSpy: jest.SpyInstance;
let cafSpy: jest.SpyInstance;

beforeEach(() => {
  localStorage.clear();
  rafCallback = null;
  rafSpy = jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
    rafCallback = cb as (ts: number) => void;
    return 1;
  });
  cafSpy = jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
});

afterEach(() => {
  // Restore only the spies this file created - jest.restoreAllMocks() would
  // also undo the global console.log silencing set up in jest.setup.js.
  rafSpy.mockRestore();
  cafSpy.mockRestore();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <SettingsProvider>
    <TaskProvider>
      <TimerProvider>{children}</TimerProvider>
    </TaskProvider>
  </SettingsProvider>
);

function renderTimerAndTasks() {
  return renderHook(
    () => ({
      timer: useTimer(),
      tasks: useTasks(),
    }),
    { wrapper },
  );
}

function seedSingleTask(goalTimeMinutes: number) {
  localStorage.setItem(
    "focuspie-tasks",
    JSON.stringify([
      {
        id: "task-1",
        name: "Test Task",
        goalTimeMinutes,
        progressMinutes: 0,
        chartIndex: 1,
        isPriority: true,
        notes: [],
      },
    ]),
  );
  localStorage.setItem("focuspie-current-task", "task-1");
}

describe("TimerProvider - session duration is independent of task duration", () => {
  it("uses the pomodoro setting for the work session, not the task's own goal time", () => {
    // A 5-minute task must not shrink (or grow) the 25-minute default pomodoro -
    // conflating the two was a real bug fixed earlier this session.
    seedSingleTask(5);
    const { result } = renderTimerAndTasks();

    act(() => {
      result.current.timer.startWork();
    });

    expect(result.current.timer.mode).toBe("working");
    expect(result.current.timer.timeLeftInMode).toBe(result.current.timer.settings.pomodoro);
    expect(result.current.timer.settings.pomodoro).toBe(25 * 60);
  });
});

describe("TimerProvider - per-minute progress crediting", () => {
  it("credits every whole minute banked up by a large timestamp jump, not just one", () => {
    // Regression test for the backgrounded-tab bug: requestAnimationFrame can
    // deliver a single large gap (tab was throttled/minimized). The fix credits
    // Math.floor(secondsThisTick / 60) minutes and keeps the remainder, instead
    // of a flat +1 with a full reset that silently dropped everything past 60s.
    seedSingleTask(480);
    const { result } = renderTimerAndTasks();

    act(() => {
      result.current.timer.startWork();
    });

    // First frame just establishes the reference timestamp - no time has passed yet.
    // (Using a non-zero base: the tick loop treats a falsy lastTickRef as "unset",
    // and a timestamp of exactly 0 would be indistinguishable from that.)
    fireFrame(BASE_TS);

    // Simulate a throttled tab: the next frame arrives 150 real seconds later.
    fireFrame(BASE_TS + 150_000);

    const task = result.current.tasks.tasks.find((t) => t.id === "task-1");
    expect(task?.progressMinutes).toBe(2); // floor(150 / 60) = 2, not 1

    // The 30s remainder must be preserved, not discarded - a further 30s should
    // complete the next whole minute (3 total), not require a full 60s more.
    fireFrame(BASE_TS + 150_000 + 30_000);

    const taskAfter = result.current.tasks.tasks.find((t) => t.id === "task-1");
    expect(taskAfter?.progressMinutes).toBe(3);
  });

  it("does not credit progress while on a break", () => {
    seedSingleTask(480);
    const { result } = renderTimerAndTasks();

    act(() => {
      result.current.timer.startWork();
    });
    fireFrame(BASE_TS);
    // Finish the entire 25-minute work session in one jump so the timer
    // transitions into a break.
    fireFrame(BASE_TS + 25 * 60 * 1000);

    expect(result.current.timer.mode).toBe("shortBreak");
    const progressAfterWorkSession = result.current.tasks.tasks.find((t) => t.id === "task-1")?.progressMinutes;
    expect(progressAfterWorkSession).toBe(25);

    // Time passing during the break must not add further task progress.
    fireFrame(BASE_TS + 25 * 60 * 1000 + 60_000);
    const progressDuringBreak = result.current.tasks.tasks.find((t) => t.id === "task-1")?.progressMinutes;
    expect(progressDuringBreak).toBe(25);
  });
});

describe("TimerProvider - unused pomodoro time carries over between tasks", () => {
  function seedTwoTasks() {
    localStorage.setItem(
      "focuspie-tasks",
      JSON.stringify([
        { id: "task-1", name: "Short Task", goalTimeMinutes: 10, progressMinutes: 0, chartIndex: 1, isPriority: true, notes: [] },
        { id: "task-2", name: "Next Task", goalTimeMinutes: 480, progressMinutes: 0, chartIndex: 2, isPriority: false, notes: [] },
      ]),
    );
    localStorage.setItem("focuspie-current-task", "task-1");
  }

  it("stops the pomodoro the moment the task finishes early, and the next task starts with the banked remainder instead of a fresh pomodoro", () => {
    // Regression test for: a 10-minute task inside a 25-minute pomodoro used to
    // leave the pomodoro silently running for its full remaining duration, and
    // switching tasks afterward discarded whatever time was left unused.
    seedTwoTasks();
    const { result } = renderTimerAndTasks();

    act(() => {
      result.current.timer.startWork();
    });
    expect(result.current.timer.timeLeftInMode).toBe(25 * 60); // full pomodoro to start

    fireFrame(BASE_TS);
    // The 10-minute task finishes; the 25-minute pomodoro still has 15 minutes left.
    fireFrame(BASE_TS + 10 * 60 * 1000);

    expect(result.current.timer.mode).toBe("idle");
    expect(result.current.timer.isRunning).toBe(false);
    expect(result.current.timer.timeLeftInMode).toBe(15 * 60); // banked remainder, previewed while idle

    act(() => {
      result.current.tasks.setCurrentTaskId("task-2");
    });
    // Switching tasks must not discard the banked remainder.
    expect(result.current.timer.timeLeftInMode).toBe(15 * 60);

    act(() => {
      result.current.timer.startWork();
    });
    expect(result.current.timer.timeLeftInMode).toBe(15 * 60);
    expect(result.current.timer.sessionTotalDuration).toBe(15 * 60);

    // 16 minutes is more than the carried-over 15, but less than a fresh 25 -
    // only reaches a break at all if the shorter, banked duration was used.
    fireFrame(BASE_TS + 10 * 60 * 1000 + 1);
    fireFrame(BASE_TS + 10 * 60 * 1000 + 1 + 16 * 60 * 1000);

    expect(result.current.timer.mode).toBe("shortBreak");
  });

  it("does not double-credit progress when the task finishes on the same tick a whole minute completes", () => {
    // Guards against a real bug caught while writing this test: the early-stop
    // effect and the per-minute crediting effect both react to secondsThisTick.
    // If the early-stop effect also credited whole minutes itself (it briefly
    // did, during development), a task finishing exactly on a 60s boundary got
    // counted twice - once by each effect - in the same commit.
    seedTwoTasks();
    const { result } = renderTimerAndTasks();

    act(() => {
      result.current.timer.startWork();
    });
    fireFrame(BASE_TS);
    // The full 10-minute goal (600s) elapses in one jump - secondsThisTick
    // reaches exactly 600 (a clean multiple of 60) in the same tick taskTimeLeft
    // reaches exactly 0.
    fireFrame(BASE_TS + 10 * 60 * 1000);

    const task = result.current.tasks.tasks.find((t) => t.id === "task-1");
    expect(task?.progressMinutes).toBe(10); // exactly the goal, not 11
  });

  it("does not carry anything over when a full pomodoro completes normally", () => {
    seedSingleTask(480);
    const { result } = renderTimerAndTasks();

    act(() => {
      result.current.timer.startWork();
    });
    fireFrame(BASE_TS);
    fireFrame(BASE_TS + 25 * 60 * 1000); // full pomodoro completes normally, no early finish involved

    expect(result.current.timer.mode).toBe("shortBreak");

    act(() => {
      result.current.timer.skipBreak();
    });
    act(() => {
      result.current.timer.startWork();
    });
    expect(result.current.timer.timeLeftInMode).toBe(25 * 60); // fresh full pomodoro, nothing stray carried over
  });
});

describe("TimerProvider - taskTimeLeft", () => {
  it("depletes only during work sessions, tracking the task's own remaining time", () => {
    seedSingleTask(10); // 10-minute task, well under the 25-minute pomodoro
    const { result } = renderTimerAndTasks();

    const initialTaskTimeLeft = result.current.timer.taskTimeLeft;
    expect(initialTaskTimeLeft).toBe(10 * 60);

    act(() => {
      result.current.timer.startWork();
    });
    fireFrame(BASE_TS);
    fireFrame(BASE_TS + 20_000); // 20 seconds pass

    expect(result.current.timer.taskTimeLeft).toBe(10 * 60 - 20);
  });
});
