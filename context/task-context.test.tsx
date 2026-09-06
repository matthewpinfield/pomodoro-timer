import { act, renderHook, waitFor } from "@testing-library/react";
import { AuthProvider } from "./auth-context";
import { TaskProvider, useTasks } from "./task-context";
import type { ReactNode } from "react";

// Minimal in-memory stand-in for the Supabase client, covering only what
// task-context.tsx actually calls (auth session/state-change, and
// from("tasks").select/upsert/delete). Exposes __mockSignIn/__mockStore so
// tests can drive a sign-in and inspect what got synced, without any real
// network call ever happening.
jest.mock("../lib/supabase", () => {
  const store: { tasks: Array<Record<string, unknown>> } = { tasks: [] };
  let authCallback: ((event: string, session: unknown) => void) | null = null;

  const supabase = {
    auth: {
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        authCallback = cb;
        // Real Supabase fires an INITIAL_SESSION event on its own microtask
        // immediately upon subscription - mimic that timing so AuthProvider's
        // loading state resolves the same way it does against a real client.
        Promise.resolve().then(() => cb("INITIAL_SESSION", null));
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
    from: () => ({
      select: () => ({
        eq: async (col: string, val: string) => ({
          data: store.tasks.filter((r) => r[col] === val),
          error: null,
        }),
      }),
      upsert: async (rows: Array<Record<string, unknown>>) => {
        rows.forEach((row) => {
          const idx = store.tasks.findIndex((r) => r.id === row.id);
          if (idx >= 0) store.tasks[idx] = row;
          else store.tasks.push(row);
        });
        return { error: null };
      },
      delete: () => ({
        in: async (col: string, ids: string[]) => {
          store.tasks = store.tasks.filter((r) => !ids.includes(r[col] as string));
          return { error: null };
        },
      }),
    }),
  };

  return {
    supabase,
    __mockSignIn: (userId: string) => {
      authCallback?.("SIGNED_IN", { user: { id: userId, email: "test@example.com" } });
    },
    __mockStore: store,
  };
});

const { __mockSignIn, __mockStore } = jest.requireMock("../lib/supabase") as {
  __mockSignIn: (userId: string) => void;
  __mockStore: { tasks: Array<Record<string, unknown>> };
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <TaskProvider>{children}</TaskProvider>
  </AuthProvider>
);

function renderTasks() {
  return renderHook(() => useTasks(), { wrapper });
}

// Lets the mock's deferred INITIAL_SESSION event resolve before a test
// simulates a sign-in - mirrors reality, where a real sign-in (a human
// clicking a magic link, taking at least seconds) always happens well after
// the initial auth check settles. Signing in immediately on mount, in the
// same tick, created a race that doesn't correspond to any real usage.
async function settleInitialAuth() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  localStorage.clear();
  __mockStore.tasks = [];
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

describe("TaskProvider - Supabase sync", () => {
  it("pushes existing real (non-demo) local tasks up on first sign-in, when the account has no synced tasks yet", async () => {
    const { result } = renderTasks();
    await settleInitialAuth();
    act(() => {
      result.current.addTask({ name: "Local before sign-in", goalTimeMinutes: 30 });
    });
    expect(__mockStore.tasks).toHaveLength(0); // nothing synced yet - not signed in

    act(() => {
      __mockSignIn("user-1");
    });

    await waitFor(() => expect(__mockStore.tasks).toHaveLength(1));
    expect(__mockStore.tasks[0].name).toBe("Local before sign-in");
    expect(__mockStore.tasks[0].user_id).toBe("user-1");
  });

  it("does not push demo tasks up on first sign-in", async () => {
    const { result } = renderTasks();
    await settleInitialAuth();
    expect(result.current.tasks.every((t) => t.id.startsWith("demo-"))).toBe(true);

    act(() => {
      __mockSignIn("user-1");
    });

    // Give the migration effect a moment to run - asserting it stays empty
    // rather than waiting for a change that should never happen.
    await new Promise((r) => setTimeout(r, 20));
    expect(__mockStore.tasks).toHaveLength(0);
  });

  it("replaces local state with the account's already-synced tasks on sign-in, rather than merging", async () => {
    __mockStore.tasks = [
      {
        id: "server-task-1",
        user_id: "user-1",
        name: "From another device",
        goal_time_minutes: 60,
        progress_minutes: 15,
        chart_index: 1,
        is_priority: true,
        notes: [],
      },
    ];
    const { result } = renderTasks();
    await settleInitialAuth();
    act(() => {
      result.current.addTask({ name: "Local only, never synced", goalTimeMinutes: 20 });
    });

    act(() => {
      __mockSignIn("user-1");
    });

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].name).toBe("From another device");
    });
    // The local-only task must not have been pushed up over the server's data.
    expect(__mockStore.tasks).toHaveLength(1);
  });

  it("writes through to Supabase when adding a task while already signed in", async () => {
    const { result } = renderTasks();
    await settleInitialAuth();
    act(() => {
      __mockSignIn("user-1");
    });
    await waitFor(() => expect(__mockStore.tasks).toHaveLength(0)); // sign-in settles, no server data, nothing to push

    act(() => {
      result.current.addTask({ name: "Added while signed in", goalTimeMinutes: 25 });
    });

    await waitFor(() => expect(__mockStore.tasks).toHaveLength(1));
    expect(__mockStore.tasks[0].name).toBe("Added while signed in");
  });

  it("removes a task from Supabase when it's deleted locally while signed in", async () => {
    const { result } = renderTasks();
    await settleInitialAuth();
    act(() => {
      __mockSignIn("user-1");
    });
    act(() => {
      result.current.addTask({ name: "Will be deleted", goalTimeMinutes: 10 });
    });
    await waitFor(() => expect(__mockStore.tasks).toHaveLength(1));

    const id = result.current.tasks[0].id;
    act(() => {
      result.current.deleteTask(id);
    });

    await waitFor(() => expect(__mockStore.tasks).toHaveLength(0));
  });
});
