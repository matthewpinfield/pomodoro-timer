import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { AlarmProvider, useAlarms } from "./alarm-context";

const wrapper = ({ children }: { children: ReactNode }) => <AlarmProvider>{children}</AlarmProvider>;

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("AlarmProvider", () => {
  it("starts with no alarms", () => {
    const { result } = renderHook(() => useAlarms(), { wrapper });
    expect(result.current.alarms).toHaveLength(0);
  });

  it("addAlarm creates a running alarm with the full duration remaining", () => {
    const { result } = renderHook(() => useAlarms(), { wrapper });

    act(() => {
      result.current.addAlarm(300, "Call the client");
    });

    expect(result.current.alarms).toHaveLength(1);
    const alarm = result.current.alarms[0];
    expect(alarm.label).toBe("Call the client");
    expect(alarm.firing).toBe(false);
    expect(result.current.getRemainingSeconds(alarm)).toBe(300);
  });

  it("counts down against a wall-clock deadline, immune to how choppy the display tick is", () => {
    const { result } = renderHook(() => useAlarms(), { wrapper });

    act(() => {
      result.current.addAlarm(60);
    });

    act(() => {
      jest.advanceTimersByTime(10_000);
    });

    const alarm = result.current.alarms[0];
    expect(result.current.getRemainingSeconds(alarm)).toBe(50);
    expect(alarm.firing).toBe(false);
  });

  it("marks an alarm as firing once its deadline passes, without needing a screen to be watching", () => {
    const { result } = renderHook(() => useAlarms(), { wrapper });

    act(() => {
      result.current.addAlarm(5, "Stretch break");
    });

    act(() => {
      jest.advanceTimersByTime(5_500);
    });

    expect(result.current.alarms[0].firing).toBe(true);
    expect(result.current.getRemainingSeconds(result.current.alarms[0])).toBe(0);
  });

  it("pauseAlarm freezes the remaining time, and resumeAlarm continues from exactly there", () => {
    const { result } = renderHook(() => useAlarms(), { wrapper });

    act(() => {
      result.current.addAlarm(60);
    });
    act(() => {
      jest.advanceTimersByTime(20_000); // 40s left
    });

    const id = result.current.alarms[0].id;
    act(() => {
      result.current.pauseAlarm(id);
    });
    expect(result.current.getRemainingSeconds(result.current.alarms[0])).toBe(40);

    // Time passing while paused must not count against it.
    act(() => {
      jest.advanceTimersByTime(15_000);
    });
    expect(result.current.getRemainingSeconds(result.current.alarms[0])).toBe(40);
    expect(result.current.alarms[0].firing).toBe(false);

    act(() => {
      result.current.resumeAlarm(id);
    });
    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    expect(result.current.getRemainingSeconds(result.current.alarms[0])).toBe(30);
  });

  it("removeAlarm deletes the alarm outright, including one that is currently firing (Dismiss)", () => {
    const { result } = renderHook(() => useAlarms(), { wrapper });

    act(() => {
      result.current.addAlarm(5);
    });
    act(() => {
      jest.advanceTimersByTime(5_500);
    });
    expect(result.current.alarms[0].firing).toBe(true);

    act(() => {
      result.current.removeAlarm(result.current.alarms[0].id);
    });
    expect(result.current.alarms).toHaveLength(0);
  });
});
