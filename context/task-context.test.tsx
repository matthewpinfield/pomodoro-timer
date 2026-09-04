import { act, renderHook } from "@testing-library/react";
import { TaskProvider, useTasks } from "./task-context";
import type { ReactNode } from "react";

const wrapper = ({ children }: { children: ReactNode }) => <TaskProvider>{children}</TaskProvider>;

function renderTasks() {
  return renderHook(() => useTasks(), { wrapper });
}

beforeEach(() => {
  localStorage.clear();
});

describe("TaskProvider", () => {
  it("seeds demo tasks when localStorage is empty, and reports hasRealTasks as false", () => {
    const { result } = renderTasks();
    expect(result.current.tasks.length).toBeGreaterThan(0);
    expect(result.current.tasks.every((t) => t.id.startsWith("demo-"))).toBe(true);
    expect(result.current.hasRealTasks).toBe(false);
  });

  it("replaces the demo list with the first real task a user adds", () => {
    const { result } = renderTasks();
    expect(result.current.tasks.every((t) => t.id.startsWith("demo-"))).toBe(true);

    act(() => {
      result.current.addTask({ name: "Write report", goalTimeMinutes: 30 });
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].name).toBe("Write report");
    expect(result.current.tasks[0].id.startsWith("demo-")).toBe(false);
    expect(result.current.hasRealTasks).toBe(true);
  });

  it("appends subsequent tasks instead of replacing the list again", () => {
    const { result } = renderTasks();

    act(() => {
      result.current.addTask({ name: "First", goalTimeMinutes: 30 });
    });
    act(() => {
      result.current.addTask({ name: "Second", goalTimeMinutes: 15 });
    });

    expect(result.current.tasks.map((t) => t.name).sort()).toEqual(["First", "Second"]);
  });

  it("updateTaskProgress accumulates minutes rather than overwriting them", () => {
    const { result } = renderTasks();
    act(() => {
      result.current.addTask({ name: "Deep work", goalTimeMinutes: 120 });
    });
    const id = result.current.tasks[0].id;

    act(() => {
      result.current.updateTaskProgress(id, 2);
    });
    act(() => {
      result.current.updateTaskProgress(id, 3);
    });

    expect(result.current.tasks.find((t) => t.id === id)?.progressMinutes).toBe(5);
  });

  it("deleteTask removes the task, and restoreTask brings it back with progress intact (Undo)", () => {
    const { result } = renderTasks();
    act(() => {
      result.current.addTask({ name: "Undo me", goalTimeMinutes: 45 });
    });
    const original = result.current.tasks[0];

    act(() => {
      result.current.updateTaskProgress(original.id, 10);
    });
    const withProgress = result.current.tasks.find((t) => t.id === original.id)!;

    act(() => {
      result.current.deleteTask(original.id);
    });
    expect(result.current.tasks.find((t) => t.id === original.id)).toBeUndefined();

    act(() => {
      result.current.restoreTask(withProgress);
    });
    const restored = result.current.tasks.find((t) => t.id === original.id);
    expect(restored).toBeDefined();
    expect(restored?.progressMinutes).toBe(10);
  });

  it("deleteTask clears currentTaskId when the deleted task was the active one", () => {
    const { result } = renderTasks();
    act(() => {
      result.current.addTask({ name: "Active task", goalTimeMinutes: 20 });
    });
    const id = result.current.tasks[0].id;

    act(() => {
      result.current.setCurrentTaskId(id);
    });
    expect(result.current.currentTaskId).toBe(id);

    act(() => {
      result.current.deleteTask(id);
    });
    expect(result.current.currentTaskId).toBeNull();
  });

  it("restoreTask does not create a duplicate if the task id is already present", () => {
    const { result } = renderTasks();
    act(() => {
      result.current.addTask({ name: "Only once", goalTimeMinutes: 20 });
    });
    const task = result.current.tasks[0];

    act(() => {
      result.current.restoreTask(task);
    });

    expect(result.current.tasks.filter((t) => t.id === task.id)).toHaveLength(1);
  });
});
