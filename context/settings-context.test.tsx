import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider } from "./auth-context";
import { SettingsProvider, useSettings } from "./settings-context";

// Same minimal in-memory Supabase stand-in used in task-context.test.tsx,
// scoped to what settings-context.tsx actually calls: auth state and
// from("user_settings").select/upsert against a single row keyed by user_id.
jest.mock("../lib/supabase", () => {
  const store: { user_settings: Array<Record<string, unknown>> } = { user_settings: [] };
  let authCallback: ((event: string, session: unknown) => void) | null = null;

  const supabase = {
    auth: {
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        authCallback = cb;
        Promise.resolve().then(() => cb("INITIAL_SESSION", null));
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
    from: () => ({
      select: () => ({
        eq: (col: string, val: string) => ({
          maybeSingle: async () => ({
            data: store.user_settings.find((r) => r[col] === val) ?? null,
            error: null,
          }),
        }),
      }),
      upsert: async (row: Record<string, unknown>) => {
        const idx = store.user_settings.findIndex((r) => r.user_id === row.user_id);
        if (idx >= 0) store.user_settings[idx] = { ...store.user_settings[idx], ...row };
        else store.user_settings.push(row);
        return { error: null };
      },
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
  __mockStore: { user_settings: Array<Record<string, unknown>> };
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <SettingsProvider>{children}</SettingsProvider>
  </AuthProvider>
);

function renderSettings() {
  return renderHook(() => useSettings(), { wrapper });
}

async function settleInitialAuth() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  localStorage.clear();
  __mockStore.user_settings = [];
});

describe("SettingsProvider", () => {
  it("defaults to 8-hour workday, non-monochrome, sound on", () => {
    const { result } = renderSettings();
    expect(result.current.workdayHours).toBe(8);
    expect(result.current.useMonochromeChart).toBe(false);
    expect(result.current.soundEnabled).toBe(true);
  });

  it("clamps workday hours to the 1-24 range", () => {
    const { result } = renderSettings();
    act(() => result.current.updateWorkdayHours(30));
    expect(result.current.workdayHours).toBe(24);
    act(() => result.current.updateWorkdayHours(0));
    expect(result.current.workdayHours).toBe(1);
  });
});

describe("SettingsProvider - Supabase sync", () => {
  it("pushes current local settings up on first sign-in when the account has none synced yet", async () => {
    const { result } = renderSettings();
    await settleInitialAuth();
    act(() => result.current.updateWorkdayHours(6));

    act(() => __mockSignIn("user-1"));

    await waitFor(() => expect(__mockStore.user_settings).toHaveLength(1));
    expect(__mockStore.user_settings[0].workday_hours).toBe(6);
    expect(__mockStore.user_settings[0].user_id).toBe("user-1");
  });

  it("replaces local settings with the account's already-synced settings on sign-in", async () => {
    __mockStore.user_settings = [
      { user_id: "user-1", workday_hours: 10, use_monochrome_chart: true, sound_enabled: false },
    ];
    const { result } = renderSettings();
    await settleInitialAuth();

    act(() => __mockSignIn("user-1"));

    await waitFor(() => {
      expect(result.current.workdayHours).toBe(10);
      expect(result.current.useMonochromeChart).toBe(true);
      expect(result.current.soundEnabled).toBe(false);
    });
  });

  it("writes through to Supabase when a setting changes while already signed in", async () => {
    const { result } = renderSettings();
    await settleInitialAuth();
    act(() => __mockSignIn("user-1"));
    await waitFor(() => expect(__mockStore.user_settings).toHaveLength(1)); // initial push on sign-in

    act(() => result.current.updateSoundEnabled(false));

    await waitFor(() => expect(__mockStore.user_settings[0].sound_enabled).toBe(false));
  });
});
